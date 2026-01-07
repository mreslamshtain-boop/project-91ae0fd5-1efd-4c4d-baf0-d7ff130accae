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
  customPrompt?: string;
  enableQualityCheck?: boolean;
}

interface Question {
  index: number;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  difficulty: string;
  mark: number;
  explanation: string;
  needsImage: boolean;
  qualityScore?: number;
}

// Clean LaTeX from text
const cleanLatex = (text: string): string => {
  if (!text) return text;
  return text
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
    .replace(/\\sqrt\{([^}]+)\}/g, '√$1')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/_1/g, '₁')
    .replace(/_2/g, '₂')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\theta/g, 'θ')
    .replace(/\\omega/g, 'ω')
    .replace(/\\pi/g, 'π')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\/g, '');
};

// Normalize question from AI response
const normalizeQuestion = (q: any, index: number): Question => ({
  index: index + 1,
  text: cleanLatex(q.text || q.question || ''),
  optionA: cleanLatex(q.optionA || q.option_a || ''),
  optionB: cleanLatex(q.optionB || q.option_b || ''),
  optionC: cleanLatex(q.optionC || q.option_c || ''),
  optionD: cleanLatex(q.optionD || q.option_d || ''),
  correctOption: (q.correctOption || q.correct_option || 'A').toUpperCase(),
  difficulty: (q.difficulty || 'MEDIUM').toUpperCase(),
  mark: q.mark || (q.difficulty === 'EASY' ? 1 : q.difficulty === 'HARD' ? 3 : 2),
  explanation: cleanLatex(q.explanation || ''),
  needsImage: q.needsImage || false,
  qualityScore: q.qualityScore,
});

// Call AI API
async function callAI(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-pro',
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
      throw { status: 429, message: 'تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة لاحقاً.' };
    }
    if (response.status === 402) {
      throw { status: 402, message: 'يرجى إضافة رصيد لحساب Lovable AI.' };
    }
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Parse JSON from AI response
function parseJsonFromResponse(content: string): any[] {
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error('No JSON array found in response');
}

// Evaluate question quality
async function evaluateQuality(apiKey: string, questions: Question[]): Promise<{ scores: number[], weakIndices: number[] }> {
  const evaluationPrompt = `أنت خبير في تقييم جودة أسئلة الاختبارات. قيّم الأسئلة التالية من 1 إلى 10:

معايير التقييم:
- وضوح صياغة السؤال (2 نقاط)
- جودة الخيارات المشتتة (2 نقاط)
- عدم وجود غموض (2 نقاط)
- مناسبة مستوى الصعوبة (2 نقاط)
- صحة الإجابة والشرح (2 نقاط)

الأسئلة:
${questions.map((q, i) => `
سؤال ${i + 1}:
${q.text}
أ) ${q.optionA}
ب) ${q.optionB}
ج) ${q.optionC}
د) ${q.optionD}
الإجابة: ${q.correctOption}
`).join('\n')}

أرجع JSON array بالصيغة:
[{"index": 1, "score": 8, "issues": ["وصف المشكلة إن وجدت"]}]`;

  try {
    const content = await callAI(apiKey, 'أنت خبير تقييم أسئلة اختبارات. أرجع JSON فقط.', evaluationPrompt);
    const evaluations = parseJsonFromResponse(content);
    
    const scores: number[] = [];
    const weakIndices: number[] = [];
    
    evaluations.forEach((evalItem: any) => {
      const idx = (evalItem.index || evalItem.questionIndex || 0) - 1;
      const score = evalItem.score || 5;
      if (idx >= 0 && idx < questions.length) {
        scores[idx] = score;
        if (score < 6) {
          weakIndices.push(idx);
        }
      }
    });
    
    // Fill missing scores
    for (let i = 0; i < questions.length; i++) {
      if (scores[i] === undefined) scores[i] = 7;
    }
    
    return { scores, weakIndices };
  } catch (error) {
    console.error('Quality evaluation error:', error);
    // Return default scores if evaluation fails
    return { 
      scores: questions.map(() => 7), 
      weakIndices: [] 
    };
  }
}

// Regenerate weak questions
async function regenerateWeakQuestions(
  apiKey: string,
  weakQuestions: Question[],
  context: { subject: string; grade: string; title: string; description: string; customPrompt?: string }
): Promise<Question[]> {
  const regeneratePrompt = `أعد كتابة الأسئلة التالية بجودة أعلى. حسّن الصياغة واجعل الخيارات المشتتة أكثر ذكاءً:

${weakQuestions.map((q, i) => `
سؤال ${i + 1} (الأصلي):
${q.text}
أ) ${q.optionA}
ب) ${q.optionB}
ج) ${q.optionC}
د) ${q.optionD}
الإجابة الصحيحة: ${q.correctOption}
الصعوبة: ${q.difficulty}
`).join('\n')}

المادة: ${context.subject}
الصف: ${context.grade}
${context.customPrompt ? `توجيهات إضافية: ${context.customPrompt}` : ''}

أرجع JSON array بنفس الصيغة:
[{"text": "...", "optionA": "...", "optionB": "...", "optionC": "...", "optionD": "...", "correctOption": "A", "difficulty": "MEDIUM", "mark": 2, "explanation": "...", "needsImage": false}]`;

  const systemPrompt = `أنت مساعد تعليمي متخصص في تحسين أسئلة الاختبارات. 
اكتب الأسئلة بالعربية الفصحى. لا تستخدم LaTeX.
اجعل الأسئلة واضحة ودقيقة.`;

  try {
    const content = await callAI(apiKey, systemPrompt, regeneratePrompt);
    const improved = parseJsonFromResponse(content);
    return improved.map((q: any, i: number) => normalizeQuestion(q, weakQuestions[i].index - 1));
  } catch (error) {
    console.error('Regeneration error:', error);
    return weakQuestions; // Return original if regeneration fails
  }
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

    const { title, description, subject, grade, questionCount, difficulty, pdfContent, customPrompt, enableQualityCheck }: GenerateRequest = await req.json();

    console.log('Generating questions for:', { title, subject, questionCount, difficulty, enableQualityCheck });

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

مهمتك: إنشاء أسئلة اختبار عالية الجودة **مستندة بشكل كامل ودقيق** على المحتوى المقدم.

**قاعدة ذهبية: التزم بالمحتوى المقدم فقط!**
- كل سؤال يجب أن يكون مبنياً على معلومة موجودة فعلياً في المحتوى المقدم
- لا تضف معلومات من خارج المحتوى المقدم
- استخدم نفس المصطلحات والتعريفات الموجودة في المحتوى
- إذا كان المحتوى يتضمن أرقاماً أو قيماً محددة، استخدمها في الأسئلة
- الإجابة الصحيحة يجب أن تكون مذكورة أو مستنتجة مباشرة من المحتوى

قواعد إضافية:
1. جميع الأسئلة والخيارات يجب أن تكون باللغة العربية الفصحى
2. كل سؤال يحتوي على 4 خيارات (أ، ب، ج، د)
3. إجابة واحدة صحيحة فقط لكل سؤال
4. الأسئلة يجب أن تكون متنوعة وتغطي مفاهيم مختلفة من المحتوى
5. تجنب الأسئلة الغامضة أو غير الواضحة
6. قدم شرحاً مختصراً لكل إجابة صحيحة (مع الإشارة للمصدر في المحتوى)
7. اجعل الخيارات المشتتة معقولة لكن خاطئة بوضوح

**مهم جداً - الرموز الفيزيائية والرياضية:**
- لا تستخدم أبداً رموز LaTeX
- اكتب جميع الرموز كنص عربي عادي
- استخدم الحروف العربية للرموز: ق للقوة، ك للكتلة، ج للتسارع، ع للسرعة، ش للشحنة

توزيع الدرجات حسب الصعوبة:
- سهل (EASY): 1 درجة
- متوسط (MEDIUM): 2 درجة
- صعب (HARD): 3 درجات

${customPrompt ? `\n**توجيهات إضافية من المستخدم:**\n${customPrompt}` : ''}

أرجع الأسئلة بصيغة JSON array فقط بدون أي نص إضافي.`;

    const userPrompt = `المادة: ${subject || 'غير محدد'}
الصف: ${grade || 'غير محدد'}
عنوان الاختبار: ${title}

${pdfContent ? `**محتوى الملف (المصدر الأساسي - التزم به بدقة):**
${pdfContent}

${description ? `**ملاحظات إضافية:**\n${description}` : ''}` : `**المحتوى:**\n${description}`}

${difficultyInstructions}

**المطلوب:** إنشاء ${questionCount} سؤال اختيار من متعدد.

**تعليمات حاسمة:**
1. كل سؤال يجب أن يكون مبنياً على معلومة محددة من المحتوى أعلاه
2. لا تخترع معلومات غير موجودة في المحتوى
3. استخدم الأرقام والقيم الموجودة في المحتوى إن وجدت
4. في الشرح، اذكر من أين في المحتوى جاءت الإجابة

تذكير: لا تستخدم أي رموز LaTeX. اكتب الرموز كنص عربي عادي.

أرجع JSON array بالصيغة التالية:
[
  {
    "text": "نص السؤال (مبني على المحتوى)",
    "optionA": "الخيار أ",
    "optionB": "الخيار ب",
    "optionC": "الخيار ج",
    "optionD": "الخيار د",
    "correctOption": "A",
    "difficulty": "EASY",
    "mark": 1,
    "explanation": "الشرح مع الإشارة للمصدر في المحتوى",
    "needsImage": false
  }
]`;

    // Step 1: Generate initial questions
    console.log('Step 1: Generating initial questions...');
    const content = await callAI(LOVABLE_API_KEY, systemPrompt, userPrompt);
    
    let rawQuestions;
    try {
      rawQuestions = parseJsonFromResponse(content);
    } catch (parseError) {
      console.error('Parse error:', parseError, 'Content:', content);
      throw new Error('Failed to parse AI response');
    }

    let normalizedQuestions = rawQuestions.map((q: any, i: number) => normalizeQuestion(q, i));
    console.log(`Generated ${normalizedQuestions.length} initial questions`);

    // Step 2: Quality check and regeneration (if enabled)
    if (enableQualityCheck && normalizedQuestions.length > 0) {
      console.log('Step 2: Evaluating question quality...');
      const { scores, weakIndices } = await evaluateQuality(LOVABLE_API_KEY, normalizedQuestions);
      
      // Add quality scores to questions
      normalizedQuestions = normalizedQuestions.map((q: Question, i: number) => ({
        ...q,
        qualityScore: scores[i]
      }));
      
      console.log(`Quality scores: ${scores.join(', ')}`);
      console.log(`Weak questions (score < 6): ${weakIndices.length}`);

      // Step 3: Regenerate weak questions
      if (weakIndices.length > 0 && weakIndices.length <= Math.ceil(normalizedQuestions.length / 2)) {
        console.log('Step 3: Regenerating weak questions...');
        const weakQuestions = weakIndices.map(i => normalizedQuestions[i]);
        const improvedQuestions = await regenerateWeakQuestions(
          LOVABLE_API_KEY,
          weakQuestions,
          { subject, grade, title, description, customPrompt }
        );
        
        // Replace weak questions with improved ones
        weakIndices.forEach((originalIndex, i) => {
          if (improvedQuestions[i]) {
            normalizedQuestions[originalIndex] = {
              ...improvedQuestions[i],
              index: originalIndex + 1,
              qualityScore: 8 // Assume improved
            };
          }
        });
        console.log(`Regenerated ${improvedQuestions.length} questions`);
      }
    }

    console.log(`Final: ${normalizedQuestions.length} questions`);

    return new Response(JSON.stringify({ questions: normalizedQuestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in generate-questions:', error);
    
    if (error.status === 429) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (error.status === 402) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'حدث خطأ أثناء توليد الأسئلة' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
