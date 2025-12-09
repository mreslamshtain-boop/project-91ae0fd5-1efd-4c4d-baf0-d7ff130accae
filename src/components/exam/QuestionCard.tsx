import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Question, CorrectOption } from "@/types/exam";

interface QuestionCardProps {
  question: Question;
  showAnswer?: boolean;
  globalShowAnswer?: boolean;
}

const difficultyLabels = {
  EASY: { label: 'سهل', variant: 'secondary' as const },
  MEDIUM: { label: 'متوسط', variant: 'default' as const },
  HARD: { label: 'صعب', variant: 'destructive' as const },
};

const optionLabels: Record<CorrectOption, string> = {
  A: 'أ',
  B: 'ب',
  C: 'ج',
  D: 'د',
};

export function QuestionCard({ question, globalShowAnswer = false }: QuestionCardProps) {
  const [localShowAnswer, setLocalShowAnswer] = useState(false);
  const showAnswer = globalShowAnswer || localShowAnswer;

  const difficulty = difficultyLabels[question.difficulty];
  const options = [
    { key: 'A' as const, text: question.optionA },
    { key: 'B' as const, text: question.optionB },
    { key: 'C' as const, text: question.optionC },
    { key: 'D' as const, text: question.optionD },
  ];

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg">
              {question.index}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={difficulty.variant}>{difficulty.label}</Badge>
              <Badge variant="outline">الدرجة: {question.mark}</Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocalShowAnswer(!localShowAnswer)}
            className="shrink-0"
          >
            {showAnswer ? (
              <>
                <EyeOff className="w-4 h-4 ml-2" />
                إخفاء الإجابة
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 ml-2" />
                إظهار الإجابة
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {question.imageUrl && (
          <div className="rounded-lg overflow-hidden border border-border bg-card">
            <img 
              src={question.imageUrl} 
              alt={`شكل توضيحي للسؤال ${question.index}`}
              className="w-full max-h-64 object-contain"
            />
          </div>
        )}

        <p className="text-lg font-medium leading-relaxed">{question.text}</p>

        <div className="grid gap-2">
          {options.map((option) => {
            const isCorrect = option.key === question.correctOption;
            const showCorrect = showAnswer && isCorrect;

            return (
              <div
                key={option.key}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  showCorrect
                    ? 'bg-green-50 border-green-300 dark:bg-green-950/30 dark:border-green-700'
                    : 'bg-card border-border hover:bg-accent/50'
                }`}
              >
                <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                  showCorrect
                    ? 'bg-green-500 text-green-50'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {optionLabels[option.key]}
                </span>
                <span className={`flex-1 ${showCorrect ? 'text-green-700 dark:text-green-300 font-medium' : ''}`}>
                  {option.text}
                </span>
                {showCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
              </div>
            );
          })}
        </div>

        {showAnswer && question.explanation && (
          <div className="p-4 bg-accent/50 rounded-lg border border-border">
            <p className="text-sm font-medium text-accent-foreground mb-1">الشرح:</p>
            <p className="text-muted-foreground">{question.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
