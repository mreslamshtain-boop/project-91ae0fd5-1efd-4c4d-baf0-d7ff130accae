import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Settings2, Image, Hash } from "lucide-react";
import { GenerationConfig, DifficultySettings } from "@/types/exam";

interface QuestionSettingsProps {
  config: GenerationConfig;
  onChange: (config: GenerationConfig) => void;
}

export function QuestionSettings({ config, onChange }: QuestionSettingsProps) {
  const handleCountChange = (value: number) => {
    onChange({ ...config, questionCount: Math.max(1, Math.min(100, value)) });
  };

  const handleDifficultyModeChange = (mode: DifficultySettings['mode']) => {
    const newDifficulty: DifficultySettings = { mode };
    if (mode === 'mixed') {
      newDifficulty.easyPercent = 33;
      newDifficulty.mediumPercent = 34;
      newDifficulty.hardPercent = 33;
    }
    onChange({ ...config, difficulty: newDifficulty });
  };

  const handlePercentChange = (type: 'easy' | 'medium' | 'hard', value: number) => {
    const difficulty = { ...config.difficulty };
    const total = 100;
    
    if (type === 'easy') {
      difficulty.easyPercent = value;
      const remaining = total - value;
      const currentMediumHard = (difficulty.mediumPercent || 0) + (difficulty.hardPercent || 0);
      if (currentMediumHard > 0) {
        const ratio = remaining / currentMediumHard;
        difficulty.mediumPercent = Math.round((difficulty.mediumPercent || 0) * ratio);
        difficulty.hardPercent = remaining - difficulty.mediumPercent;
      } else {
        difficulty.mediumPercent = Math.round(remaining / 2);
        difficulty.hardPercent = remaining - difficulty.mediumPercent;
      }
    } else if (type === 'medium') {
      difficulty.mediumPercent = value;
      const remaining = total - value;
      const currentEasyHard = (difficulty.easyPercent || 0) + (difficulty.hardPercent || 0);
      if (currentEasyHard > 0) {
        const ratio = remaining / currentEasyHard;
        difficulty.easyPercent = Math.round((difficulty.easyPercent || 0) * ratio);
        difficulty.hardPercent = remaining - difficulty.easyPercent;
      } else {
        difficulty.easyPercent = Math.round(remaining / 2);
        difficulty.hardPercent = remaining - difficulty.easyPercent;
      }
    } else {
      difficulty.hardPercent = value;
      const remaining = total - value;
      const currentEasyMedium = (difficulty.easyPercent || 0) + (difficulty.mediumPercent || 0);
      if (currentEasyMedium > 0) {
        const ratio = remaining / currentEasyMedium;
        difficulty.easyPercent = Math.round((difficulty.easyPercent || 0) * ratio);
        difficulty.mediumPercent = remaining - difficulty.easyPercent;
      } else {
        difficulty.easyPercent = Math.round(remaining / 2);
        difficulty.mediumPercent = remaining - difficulty.easyPercent;
      }
    }
    
    onChange({ ...config, difficulty });
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Settings2 className="w-5 h-5 text-primary" />
          إعدادات الأسئلة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="count" className="text-base font-medium flex items-center gap-2">
            <Hash className="w-4 h-4 text-muted-foreground" />
            عدد الأسئلة
          </Label>
          <Input
            id="count"
            type="number"
            min={1}
            max={100}
            value={config.questionCount}
            onChange={(e) => handleCountChange(parseInt(e.target.value) || 1)}
            className="w-32"
          />
        </div>

        <div className="space-y-4">
          <Label className="text-base font-medium">مستوى الصعوبة</Label>
          <RadioGroup
            value={config.difficulty.mode}
            onValueChange={(v) => handleDifficultyModeChange(v as DifficultySettings['mode'])}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            <div className="flex items-center space-x-2 space-x-reverse bg-card p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
              <RadioGroupItem value="all-easy" id="all-easy" />
              <Label htmlFor="all-easy" className="cursor-pointer text-sm">كلها سهلة</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse bg-card p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
              <RadioGroupItem value="all-medium" id="all-medium" />
              <Label htmlFor="all-medium" className="cursor-pointer text-sm">كلها متوسطة</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse bg-card p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
              <RadioGroupItem value="all-hard" id="all-hard" />
              <Label htmlFor="all-hard" className="cursor-pointer text-sm">كلها صعبة</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse bg-card p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
              <RadioGroupItem value="mixed" id="mixed" />
              <Label htmlFor="mixed" className="cursor-pointer text-sm">مزيج</Label>
            </div>
          </RadioGroup>
        </div>

        {config.difficulty.mode === 'mixed' && (
          <div className="space-y-4 p-4 bg-accent/30 rounded-lg border border-border">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm">نسبة السهلة</Label>
                <span className="text-sm font-medium text-primary">{config.difficulty.easyPercent}%</span>
              </div>
              <Slider
                value={[config.difficulty.easyPercent || 33]}
                onValueChange={([v]) => handlePercentChange('easy', v)}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm">نسبة المتوسطة</Label>
                <span className="text-sm font-medium text-primary">{config.difficulty.mediumPercent}%</span>
              </div>
              <Slider
                value={[config.difficulty.mediumPercent || 34]}
                onValueChange={([v]) => handlePercentChange('medium', v)}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm">نسبة الصعبة</Label>
                <span className="text-sm font-medium text-primary">{config.difficulty.hardPercent}%</span>
              </div>
              <Slider
                value={[config.difficulty.hardPercent || 33]}
                onValueChange={([v]) => handlePercentChange('hard', v)}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Image className="w-5 h-5 text-primary" />
            </div>
            <div>
              <Label htmlFor="images" className="text-base font-medium cursor-pointer">
                توليد صور للأسئلة
              </Label>
              <p className="text-sm text-muted-foreground">
                للأسئلة التي تحتاج شكلاً أو رسمًا بيانيًا
              </p>
            </div>
          </div>
          <Switch
            id="images"
            checked={config.generateImages}
            onCheckedChange={(checked) => onChange({ ...config, generateImages: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
