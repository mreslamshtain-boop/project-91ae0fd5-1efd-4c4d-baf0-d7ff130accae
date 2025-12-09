import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  title: string;
  description: string;
  subject: string;
  grade: string;
  questionCount: number;
  difficulty: {
    mode: 'all-easy' | 'all-medium' | 'all-hard' | 'mixed';
    easyPercent?: number;
    mediumPercent?: number;
    hardPercent?: number;
  };
  pdfContent?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { title, description, subject, grade, questionCount, difficulty, pdfContent }: GenerateRequest = await req.json();

    console.log('Generating questions for:', { title, subject, questionCount, difficulty });

    // Build difficulty distribution
    let difficultyInstructions = '';
    if (difficulty.mode === 'all-easy') {
      difficultyInstructions = 'جميع الأسئلة يجب أن تكون سهلة (EASY).';
    } else if (difficulty.mode === 'all-medium') {
      difficultyInstructions = 'جميع الأسئلة يجب أن تكون متوسطة (MEDIUM).';
    } else if (difficulty.mode === 'all-hard') {
      difficultyInstructions = 'جميع الأسئلة يجب أن تكون صعبة (HARD).';
    } else {
      difficultyInstructions = `توزيع الصعوبة:
- أسئلة سهلة (EASY): ${difficulty.easyPercent}%
- أسئلة متوسطة (MEDIUM): ${difficulty.mediumPercent}%
- أسئلة صعبة (HARD): ${difficulty.hardPercent}%`;
    }

    const systemPrompt = `أنت مساعد تعليمي متخصص في إنشاء أسئلة اختبارات الاختيار من متعدد (MCQ) باللغة العربية.

مهمتك: إنشاء أسئلة اختبار عالية الجودة بناءً على المحتوى المقدم.

قواعد مهمة:
1. جميع الأسئلة والخيارات يجب أن تكون باللغة العربية الفصحى
2. كل سؤال يحتوي على 4 خيارات (أ، ب، ج، د)
3. إجابة واحدة صحيحة فقط لكل سؤال
4. الأسئلة يجب أن تكون متنوعة وتغطي مفاهيم مختلفة
5. تجنب الأسئلة الغامضة أو غير الواضحة
6. قدم شرحاً مختصراً لكل إجابة صحيحة

توزيع الدرجات حسب الصعوبة:
- سهل (EASY): 1 درجة
- متوسط (MEDIUM): 2 درجة
- صعب (HARD): 3 درجات

للأسئلة التي تحتاج رسم أو شكل توضيحي، أضف في نص السؤال عبارة مثل "في الشكل المقابل" أو "كما هو موضح في الدائرة" لتحديد الحاجة للصورة.

أرجع الأسئلة بصيغة JSON array فقط بدون أي نص إضافي.`;

    const userPrompt = `المادة: ${subject || 'غير محدد'}
الصف: ${grade || 'غير محدد'}
عنوان الاختبار: ${title}

المحتوى:
${description}
${pdfContent ? `\n\nمحتوى إضافي من ملف PDF:\n${pdfContent}` : ''}

${difficultyInstructions}

المطلوب: إنشاء ${questionCount} سؤال اختيار من متعدد.

أرجع JSON array بالصيغة التالية:
[
  {
    "text": "نص السؤال",
    "optionA": "الخيار أ",
    "optionB": "الخيار ب",
    "optionC": "الخيار ج",
    "optionD": "الخيار د",
    "correctOption": "A",
    "difficulty": "EASY",
    "mark": 1,
    "explanation": "شرح مختصر للإجابة الصحيحة",
    "needsImage": false
  }
]

ملاحظة: اجعل needsImage = true للأسئلة التي تحتاج رسم بياني أو شكل توضيحي.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة لاحقاً.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'يرجى إضافة رصيد لحساب Lovable AI.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from AI');
    }

    console.log('AI response received, parsing...');

    // Parse the JSON from the response
    let questions;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (parseError) {
      console.error('Parse error:', parseError, 'Content:', content);
      throw new Error('Failed to parse AI response');
    }

    // Validate and normalize questions
    const normalizedQuestions = questions.map((q: any, index: number) => ({
      index: index + 1,
      text: q.text || q.question || '',
      optionA: q.optionA || q.option_a || '',
      optionB: q.optionB || q.option_b || '',
      optionC: q.optionC || q.option_c || '',
      optionD: q.optionD || q.option_d || '',
      correctOption: (q.correctOption || q.correct_option || 'A').toUpperCase(),
      difficulty: (q.difficulty || 'MEDIUM').toUpperCase(),
      mark: q.mark || (q.difficulty === 'EASY' ? 1 : q.difficulty === 'HARD' ? 3 : 2),
      explanation: q.explanation || '',
      needsImage: q.needsImage || false,
    }));

    console.log(`Generated ${normalizedQuestions.length} questions`);

    return new Response(JSON.stringify({ questions: normalizedQuestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-questions:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'حدث خطأ أثناء توليد الأسئلة' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
