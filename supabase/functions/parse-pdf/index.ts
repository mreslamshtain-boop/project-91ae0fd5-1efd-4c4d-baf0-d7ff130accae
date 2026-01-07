import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Efficient base64 encoding that handles large files
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let result = '';
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    result += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(result);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing PDF:', file.name, 'Size:', file.size);

    // Check file size - limit to 15MB
    if (file.size > 15 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'الملف كبير جداً. الحد الأقصى هو 15 ميجابايت' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert file to base64 in chunks to avoid stack overflow
    const arrayBuffer = await file.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);

    console.log('Base64 encoding complete, length:', base64.length);

    // Use OpenRouter API with gemini-2.5-pro for PDF extraction
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lovable.dev',
        'X-Title': 'Exam Generator',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        max_tokens: 16000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `أنت خبير في استخراج المحتوى التعليمي من ملفات PDF. مهمتك استخراج كامل المحتوى النصي من هذا الملف بدقة شديدة.

**تعليمات الاستخراج:**

1. **استخرج النص كاملاً** - لا تختصر أو تلخص. انسخ المحتوى كما هو بالضبط.

2. **حافظ على البنية الأصلية:**
   - العناوين الرئيسية والفرعية
   - الترقيم والتعداد
   - الجداول (حولها لنص منظم)
   - الأشكال والرسومات (اوصفها بالتفصيل)

3. **المعادلات والرموز - مهم جداً:**
   - حافظ على الرموز اللاتينية كما هي في الملف الأصلي (q, r, F, E, v, m, a, t...)
   - لا تترجم أو تحوّل الرموز الفيزيائية إلى العربية
   - ممنوع استبدال: q بـ ش، أو r بـ ف، أو F بـ ق، أو m بـ ك
   - لا تستخدم LaTeX
   - مثال صحيح: F = kq₁q₂/r²
   - مثال خاطئ: ق = ك×ش₁×ش₂/ف²

4. **المحتوى المهم للاختبارات:**
   - التعريفات والمفاهيم
   - القوانين والنظريات
   - الأمثلة المحلولة (كاملة)
   - التمارين والمسائل
   - الملاحظات والتنبيهات

5. **تنظيم المخرجات:**
   - اجعل المحتوى سهل القراءة
   - افصل بين الأقسام بوضوح

**مهم جداً:** الهدف هو إنشاء أسئلة اختبار من هذا المحتوى، لذا استخرج كل التفاصيل مع الحفاظ على الرموز العلمية القياسية (اللاتينية).

ابدأ الاستخراج الآن:`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PDF parsing error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'تم تجاوز الحد الأقصى للطلبات' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'يرجى إضافة رصيد لحساب OpenRouter: https://openrouter.ai/settings/credits' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`PDF parsing failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content extracted from PDF');
    }

    console.log('PDF content extracted, length:', content.length);

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-pdf:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to parse PDF' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
