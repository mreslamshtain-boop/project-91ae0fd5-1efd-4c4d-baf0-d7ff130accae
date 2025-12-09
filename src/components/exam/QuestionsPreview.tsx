import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "./QuestionCard";
import { Eye, EyeOff, FileText } from "lucide-react";
import { Question } from "@/types/exam";

interface QuestionsPreviewProps {
  questions: Question[];
}

export function QuestionsPreview({ questions }: QuestionsPreviewProps) {
  const [showAllAnswers, setShowAllAnswers] = useState(false);

  if (questions.length === 0) return null;

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="w-5 h-5 text-primary" />
          معاينة الأسئلة ({questions.length} سؤال)
        </CardTitle>
        <Button
          variant={showAllAnswers ? "secondary" : "outline"}
          onClick={() => setShowAllAnswers(!showAllAnswers)}
        >
          {showAllAnswers ? (
            <>
              <EyeOff className="w-4 h-4 ml-2" />
              إخفاء كل الإجابات
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 ml-2" />
              إظهار كل الإجابات
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              globalShowAnswer={showAllAnswers}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
