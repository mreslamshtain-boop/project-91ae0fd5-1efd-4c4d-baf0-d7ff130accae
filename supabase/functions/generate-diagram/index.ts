import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use environment variable or fallback API key
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') || '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';
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const { questionText, examId, questionId } = await req.json();

    // Normalize Arabic symbols to Latin before sending to diagram generator
    const normalizedText = questionText
      .replace(/\bش₁\b/g, 'q₁').replace(/\bش₂\b/g, 'q₂').replace(/\bش₃\b/g, 'q₃')
      .replace(/\bش\b/g, 'q')
      .replace(/\bق₁\b/g, 'F₁').replace(/\bق₂\b/g, 'F₂').replace(/\bق\b/g, 'F')
      .replace(/\bف₁\b/g, 'r₁').replace(/\bف₂\b/g, 'r₂').replace(/\bف\b/g, 'r')
      .replace(/\bك₁\b/g, 'm₁').replace(/\bك₂\b/g, 'm₂').replace(/\bك\b/g, 'm')
      .replace(/\bع₁\b/g, 'v₁').replace(/\bع₂\b/g, 'v₂').replace(/\bع\b/g, 'v')
      .replace(/٣ف/g, '3r').replace(/٢ف/g, '2r').replace(/٤ف/g, '4r');

    console.log('Generating diagram for question:', normalizedText.substring(0, 100));

    // Create a prompt for diagram generation
    const prompt = `Create a simple, clean educational diagram for an Arabic exam question. The diagram should be:
- Simple black lines on pure white background
- Minimalist exam-style illustration
- Professional and clear for students
- Suitable for physics, math, or science exams

**CRITICAL RULES for labels and symbols:**
- Use standard Latin physics symbols ONLY (NOT Arabic letters):
  • Charge: q, q₁, q₂ (NOT ش)
  • Force: F (NOT ق)
  • Distance/radius: r, 2r, 3r (NOT ف or م)
  • Mass: m (NOT ك)
  • Velocity: v (NOT س)
  • Current: I
  • Voltage: V
  • Electric field: E
  • Magnetic field: B
- Arabic text is OK ONLY for descriptive labels like "الوضع الابتدائي" or "نقطة التلامس"
- Example correct labels: q₁, q₂, r, 3r, F, +q, -q
- Example WRONG labels: ش₁, ش₂, ف, ٣ف, ق

The question context: ${normalizedText}

Style: Clean educational diagram, no decorative elements, suitable for printing on exam paper.`;

    // Use OpenRouter API with image generation model
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lovable.dev',
        'X-Title': 'Exam Generator',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        max_tokens: 4000,
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image generation error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded', imageUrl: null }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required', imageUrl: null }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response structure:', JSON.stringify(data, null, 2).substring(0, 500));
    
    // Check different possible response structures
    let imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageData) {
      // Try alternative response structure
      imageData = data.choices?.[0]?.message?.content;
      if (imageData && !imageData.startsWith('data:image')) {
        imageData = null;
      }
    }

    if (!imageData) {
      console.log('No image generated, response:', JSON.stringify(data).substring(0, 500));
      return new Response(JSON.stringify({ imageUrl: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Image data received, length:', imageData.length);

    // Upload to Supabase Storage
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // Extract base64 data
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        const fileName = `${examId}/${questionId}-${Date.now()}.png`;
        
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('question-images')
          .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          // Return base64 as fallback
          return new Response(JSON.stringify({ imageUrl: imageData }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: publicUrl } = supabase
          .storage
          .from('question-images')
          .getPublicUrl(fileName);

        console.log('Image uploaded:', publicUrl.publicUrl);

        return new Response(JSON.stringify({ imageUrl: publicUrl.publicUrl }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (uploadErr) {
        console.error('Storage upload error:', uploadErr);
        return new Response(JSON.stringify({ imageUrl: imageData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Return base64 if storage not available
    return new Response(JSON.stringify({ imageUrl: imageData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-diagram:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to generate diagram',
      imageUrl: null 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});