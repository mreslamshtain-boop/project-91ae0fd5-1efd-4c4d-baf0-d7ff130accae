import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AIModel = 'xiaomi/mimo-v2-flash:free' | 'nvidia/nemotron-3-nano-30b-a3b:free';

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
  aiModel?: AIModel;
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

// Normalize Arabic physics symbols to standard Latin
const normalizeSymbols = (text: string): string => {
  if (!text) return text;
  
  // Replace Arabic physics symbols with Latin equivalents
  // Only when they appear in mathematical/variable contexts
  return text
    // شحنة -> q (when appearing as variable)
    .replace(/\bش₁\b/g, 'q₁')
    .replace(/\bش₂\b/g, 'q₂')
    .replace(/\bش₃\b/g, 'q₃')
    .replace(/\bش\b(?=\s*[=×÷\+\-\*\/²³]|\s*$)/g, 'q')
    // قوة -> F
    .replace(/\bق₁\b/g, 'F₁')
    .replace(/\bق₂\b/g, 'F₂')
    .replace(/\bق\b(?=\s*[=×÷\+\-\*\/²³]|\s*$)/g, 'F')
    // مسافة/نصف قطر -> r
    .replace(/\bف₁\b/g, 'r₁')
    .replace(/\bف₂\b/g, 'r₂')
    .replace(/\bف\b(?=\s*[=×÷\+\-\*\/²³]|\s*$)/g, 'r')
    // كتلة -> m
    .replace(/\bك₁\b/g, 'm₁')
    .replace(/\bك₂\b/g, 'm₂')
    .replace(/\bك\b(?=\s*[=×÷\+\-\*\/²³]|\s*$)/g, 'm')
    // سرعة -> v
    .replace(/\bع₁\b/g, 'v₁')
    .replace(/\bع₂\b/g, 'v₂')
    .replace(/\bع\b(?=\s*[=×÷\+\-\*\/²³]|\s*$)/g, 'v')
    // تسارع -> a
    .replace(/\bج₁\b/g, 'a₁')
    .replace(/\bج₂\b/g, 'a₂')
    .replace(/\bج\b(?=\s*[=×÷\+\-\*\/²³]|\s*$)/g, 'a')
    // زمن -> t
    .replace(/\bز\b(?=\s*[=×÷\+\-\*\/²³]|\s*$)/g, 't')
    // Additional common patterns
    .replace(/٣ف/g, '3r')
    .replace(/٢ف/g, '2r')
    .replace(/٤ف/g, '4r');
};

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

// Apply both cleaning functions
const cleanAndNormalize = (text: string): string => {
  return normalizeSymbols(cleanLatex(text));
};

// Normalize question from AI response
const normalizeQuestion = (q: any, index: number): Question => ({
  index: index + 1,
  text: cleanAndNormalize(q.text || q.question || ''),
  optionA: cleanAndNormalize(q.optionA || q.option_a || ''),
  optionB: cleanAndNormalize(q.optionB || q.option_b || ''),
  optionC: cleanAndNormalize(q.optionC || q.option_c || ''),
  optionD: cleanAndNormalize(q.optionD || q.option_d || ''),
  correctOption: (q.correctOption || q.correct_option || 'A').toUpperCase(),
  difficulty: (q.difficulty || 'MEDIUM').toUpperCase(),
  mark: q.mark || (q.difficulty === 'EASY' ? 1 : q.difficulty === 'HARD' ? 3 : 2),
  explanation: cleanAndNormalize(q.explanation || ''),
  needsImage: q.needsImage || false,
  qualityScore: q.qualityScore,
});

// Call AI API with model selection via OpenRouter
async function callAI(apiKey: string, systemPrompt: string, userPrompt: string, model: AIModel): Promise<string> {
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://lovable.dev',
      'X-Title': 'Exam Generator',
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
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
      throw { status: 402, message: 'يرجى إضافة رصيد لحساب OpenRouter.' };
    }
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// Parse JSON from AI response
function parseJsonFromResponse(content: string): any[] {
  // Remove markdown code blocks if present
  let cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error('No JSON array found in response');
}

// Fast quality evaluation - checks basic criteria without AI call
function evaluateQualityFast(questions: Question[]): { scores: number[], weakIndices: number[] } {
  const scores: number[] = [];
  const weakIndices: number[] = [];
  
  questions.forEach((q, i) => {
    let score = 10;
    
    // Check question text length
    if (q.text.length < 20) score -= 3;
    else if (q.text.length < 40) score -= 1;
    
    // Check options variety
    const options = [q.optionA, q.optionB, q.optionC, q.optionD];
    const uniqueOptions = new Set(options.map(o => o.trim().toLowerCase()));
    if (uniqueOptions.size < 4) score -= 2;
    
    // Check options length balance
    const avgLen = options.reduce((sum, o) => sum + o.length, 0) / 4;
    const lenVariance = options.reduce((sum, o) => sum + Math.abs(o.length - avgLen), 0) / 4;
    if (lenVariance > avgLen * 0.8) score -= 1;
    
    // Check explanation exists
    if (!q.explanation || q.explanation.length < 10) score -= 1;
    
    // Check correct option is valid
    if (!['A', 'B', 'C', 'D'].includes(q.correctOption)) score -= 2;
    
    scores[i] = Math.max(1, score);
    if (scores[i] < 6) weakIndices.push(i);
  });
  
  return { scores, weakIndices };
}

// Regenerate weak questions - simplified for speed
async function regenerateWeakQuestions(
  apiKey: string,
  weakQuestions: Question[],
  context: { subject: string; grade: string; title: string; description: string; customPrompt?: string },
  model: AIModel
): Promise<Question[]> {
  if (weakQuestions.length === 0) return [];
  
  const regeneratePrompt = `حسّن هذه الأسئلة:
${weakQuestions.map((q, i) => `${i + 1}. ${q.text} (${q.difficulty})`).join('\n')}

المادة: ${context.subject}
أرجع JSON array: [{"text":"..","optionA":"..","optionB":"..","optionC":"..","optionD":"..","correctOption":"A","difficulty":"MEDIUM","mark":2,"explanation":"..","needsImage":false}]`;

  try {
    const content = await callAI(apiKey, 'حسّن الأسئلة. أرجع JSON فقط.', regeneratePrompt, model);
    const improved = parseJsonFromResponse(content);
    return improved.map((q: any, i: number) => normalizeQuestion(q, weakQuestions[i].index - 1));
  } catch (error) {
    console.error('Regeneration error:', error);
    return weakQuestions;
  }
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

    const { title, description, subject, grade, questionCount, difficulty, pdfContent, customPrompt, enableQualityCheck, aiModel }: GenerateRequest = await req.json();

    const selectedModel: AIModel = aiModel || 'xiaomi/mimo-v2-flash:free';
    console.log('Generating questions for:', { title, subject, questionCount, difficulty, enableQualityCheck, model: selectedModel });

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
- إذا كان المحتوى يتضمن أرقاماً أو قيماً محددة، استخدمها كما هي

**ممنوعات (مهم جداً):**
- ممنوع ذكر أي عبارات مرجعية مثل: "في الدرس الأول"، "في هذا الدرس"، "كما ورد في المحتوى"، "كما هو مكتوب"، "حسب النص"، "في الملف".
- السؤال والشرح يجب أن يبدوا مستقلين بذاتهم بدون الإشارة لأي مصدر.
- ممنوع النسخ الحرفي لجمل طويلة من المحتوى؛ أعد صياغة الفكرة بنفس المعنى وبنفس المصطلحات الأساسية.

قواعد إضافية:
1. جميع الأسئلة والخيارات يجب أن تكون باللغة العربية الفصحى
2. كل سؤال يحتوي على 4 خيارات (أ، ب، ج، د)
3. إجابة واحدة صحيحة فقط لكل سؤال
4. الأسئلة يجب أن تكون متنوعة وتغطي مفاهيم مختلفة من المحتوى
5. تجنب الأسئلة الغامضة أو غير الواضحة
6. قدّم شرحاً مختصراً يوضح **لماذا** الإجابة صحيحة بدون أي عبارات مثل "كما ورد" أو "حسب المحتوى"
7. اجعل الخيارات المشتتة معقولة لكن خاطئة بوضوح

**مهم جداً - الرموز الفيزيائية والرياضية:**
- لا تستخدم أبداً رموز LaTeX (مثل \\sqrt أو \\frac أو ^ أو _)
- استخدم الرموز الفيزيائية اللاتينية المعيارية الدولية (ليس العربية):
  • الشحنة: q (وليس ش)
  • القوة: F (وليس ق)
  • المسافة/نصف القطر: r (وليس ف أو م)
  • الكتلة: m (وليس ك)
  • السرعة: v (وليس س)
  • التسارع: a (وليس ت)
  • الزمن: t (وليس ز)
  • المجال الكهربائي: E
  • المجال المغناطيسي: B
  • الجهد الكهربائي: V
  • التيار الكهربائي: I
  • المقاومة: R
  • ثابت كولوم: k

**الأُسس والجذور (استخدم Unicode):**
- الأُسس العليا (superscript): استخدم ⁰ ¹ ² ³ ⁴ ⁵ ⁶ ⁷ ⁸ ⁹ ⁺ ⁻ ⁿ
  • مثال: x² وليس x^2، و 10⁸ وليس 10^8
  • مثال: E = mc² (صحيح) وليس E = mc^2
- الأُسس السفلية (subscript): استخدم ₀ ₁ ₂ ₃ ₄ ₅ ₆ ₇ ₈ ₉
  • مثال: q₁ و q₂ وليس q1 و q2
- الجذور: استخدم √ مباشرة
  • مثال: √2 أو √(x+1) وليس sqrt(2)
  • الجذر التكعيبي: ∛ مثال: ∛8 = 2
- الكسور البسيطة: اكتبها بالشكل a/b أو استخدم ½ ⅓ ¼ ⅔ ¾
  • مثال: ½kx² للطاقة الحركية

**المعادلات الكيميائية:**
- استخدم الأرقام السفلية للذرات: H₂O, CO₂, H₂SO₄, NaCl, C₆H₁₂O₆
- استخدم الأسهم: → للتفاعل، ⇌ للتوازن
- حالات المادة: (g) غاز، (l) سائل، (s) صلب، (aq) محلول مائي
- مثال: 2H₂ + O₂ → 2H₂O
- مثال: CH₄ + 2O₂ → CO₂ + 2H₂O

**الصيغ البنائية:**
- استخدم الشرطات للروابط: C-C للرابطة الأحادية، C=C للمزدوجة، C≡C للثلاثية
- مثال: CH₃-CH₂-OH للإيثانول
- مثال: CH₂=CH₂ للإيثين

**التشكيل في اللغة العربية:**
- شكّل الكلمات التي يلزم تشكيلها لتوضيح المعنى أو النطق الصحيح
- استخدم علامات التشكيل: فَتْحَة (َ)، ضَمَّة (ُ)، كَسْرَة (ِ)، سُكُون (ْ)، شَدَّة (ّ)، تَنْوِين
- مثال: القُوَّة، الشُّحْنَة، المُقَاوَمَة

**رموز رياضية إضافية:**
- الضرب: × (وليس x أو *)
- القسمة: ÷
- يساوي: = ، لا يساوي: ≠
- أكبر/أصغر: > < ≥ ≤
- زائد/ناقص: ± 
- ما لا نهاية: ∞
- الزاوية: °
- باي: π
- دلتا: Δ
- سيجما: Σ

- اكتب النص والشرح بالعربية، لكن الرموز تبقى لاتينية دائماً
- مثال صحيح: "إذا زادت المسافة r بين شحنتين q₁ و q₂"
- مثال خاطئ: "إذا زادت المسافة ف بين شحنتين ش₁ و ش₂"

توزيع الدرجات حسب الصعوبة:
- سهل (EASY): 1 درجة
- متوسط (MEDIUM): 2 درجة
- صعب (HARD): 3 درجات

${customPrompt ? `\n**توجيهات إضافية من المستخدم:**\n${customPrompt}` : ''}

أرجع الأسئلة بصيغة JSON array فقط بدون أي نص إضافي.`;

    const userPrompt = `المادة: ${subject || 'غير محدد'}
الصف: ${grade || 'غير محدد'}
عنوان الاختبار: ${title}

${pdfContent ? `**محتوى الملف (المصدر الوحيد):**
${pdfContent}

${description ? `**ملاحظات إضافية:**\n${description}` : ''}` : `**المحتوى:**\n${description}`}

${difficultyInstructions}

**المطلوب:** إنشاء ${questionCount} سؤال اختيار من متعدد.

**تعليمات حاسمة (التزم حرفياً):**
1. كل سؤال مبني على معلومة محددة من المحتوى أعلاه فقط
2. ممنوع أي جملة تشير للمصدر (مثل: في الدرس/في المحتوى/في الملف/كما ورد)
3. ممنوع النسخ الحرفي؛ أعد صياغة الفكرة بدقة
4. استخدم الأرقام والقيم كما وردت بدون تغيير

تذكير: لا تستخدم أي رموز LaTeX.

أرجع JSON array بالصيغة التالية:
[
  {
    "text": "نص السؤال بصياغة مستقلة",
    "optionA": "الخيار أ",
    "optionB": "الخيار ب",
    "optionC": "الخيار ج",
    "optionD": "الخيار د",
    "correctOption": "A",
    "difficulty": "EASY",
    "mark": 1,
    "explanation": "شرح مختصر يوضح سبب صحة الإجابة بدون ذكر المصدر",
    "needsImage": false
  }
]`;

    // Step 1: Generate initial questions
    console.log('Step 1: Generating initial questions...');
    const content = await callAI(OPENROUTER_API_KEY, systemPrompt, userPrompt, selectedModel);
    
    let rawQuestions;
    try {
      rawQuestions = parseJsonFromResponse(content);
    } catch (parseError) {
      console.error('Parse error:', parseError, 'Content:', content);
      throw new Error('Failed to parse AI response');
    }

    let normalizedQuestions = rawQuestions.map((q: any, i: number) => normalizeQuestion(q, i));
    console.log(`Generated ${normalizedQuestions.length} initial questions`);

    // Step 2: Fast quality check (if enabled)
    if (enableQualityCheck && normalizedQuestions.length > 0) {
      console.log('Step 2: Fast quality evaluation...');
      const { scores, weakIndices } = evaluateQualityFast(normalizedQuestions);
      
      // Add quality scores to questions
      normalizedQuestions = normalizedQuestions.map((q: Question, i: number) => ({
        ...q,
        qualityScore: scores[i]
      }));
      
      console.log(`Quality scores: ${scores.join(', ')}`);
      console.log(`Weak questions (score < 6): ${weakIndices.length}`);

      // Only regenerate if there are few weak questions (max 3)
      if (weakIndices.length > 0 && weakIndices.length <= 3) {
        console.log('Step 3: Regenerating weak questions...');
        const weakQuestions = weakIndices.map(i => normalizedQuestions[i]);
        const improvedQuestions = await regenerateWeakQuestions(
          OPENROUTER_API_KEY,
          weakQuestions,
          { subject, grade, title, description, customPrompt },
          selectedModel
        );
        
        weakIndices.forEach((originalIndex, i) => {
          if (improvedQuestions[i]) {
            normalizedQuestions[originalIndex] = {
              ...improvedQuestions[i],
              index: originalIndex + 1,
              qualityScore: 8
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
