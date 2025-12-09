import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, FileSearch, Brain, Image, FileSpreadsheet } from "lucide-react";
import { GenerationProgress } from "@/types/exam";

interface ProgressIndicatorProps {
  progress: GenerationProgress;
}

const stepIcons = {
  idle: null,
  analyzing: FileSearch,
  generating: Brain,
  images: Image,
  excel: FileSpreadsheet,
  complete: CheckCircle2,
  error: XCircle,
};

const stepColors = {
  idle: 'text-muted-foreground',
  analyzing: 'text-primary',
  generating: 'text-primary',
  images: 'text-primary',
  excel: 'text-primary',
  complete: 'text-green-500',
  error: 'text-destructive',
};

export function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  const Icon = stepIcons[progress.step];
  const colorClass = stepColors[progress.step];

  if (progress.step === 'idle') return null;

  return (
    <Card className="shadow-md animate-in slide-in-from-top-2 duration-300">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4 mb-4">
          {Icon && (
            <div className={`${colorClass}`}>
              {progress.step === 'complete' || progress.step === 'error' ? (
                <Icon className="w-6 h-6" />
              ) : (
                <Loader2 className="w-6 h-6 animate-spin" />
              )}
            </div>
          )}
          <p className={`text-lg font-medium ${colorClass}`}>
            {progress.message}
          </p>
        </div>
        <Progress value={progress.progress} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2 text-center">
          {progress.progress}%
        </p>
      </CardContent>
    </Card>
  );
}
