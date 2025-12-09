import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, Percent, GraduationCap, BookOpen } from "lucide-react";
import { ExamConfig } from "@/types/exam";

interface ExamInfoFormProps {
  config: ExamConfig;
  onChange: (config: ExamConfig) => void;
}

export function ExamInfoForm({ config, onChange }: ExamInfoFormProps) {
  const handleChange = (field: keyof ExamConfig, value: string | number) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="w-5 h-5 text-primary" />
          معلومات الاختبار
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-base font-medium">
            عنوان الاختبار *
          </Label>
          <Input
            id="title"
            placeholder="مثال: اختبار الفيزياء - الفصل الأول"
            value={config.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-base font-medium">
            وصف المحتوى
          </Label>
          <Textarea
            id="description"
            placeholder="اكتب وصفاً تفصيلياً للمنهج أو الموضوعات التي تريد توليد أسئلة منها..."
            value={config.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            className="text-base resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-base font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              المادة
            </Label>
            <Input
              id="subject"
              placeholder="مثال: الفيزياء"
              value={config.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade" className="text-base font-medium flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-muted-foreground" />
              الصف
            </Label>
            <Input
              id="grade"
              placeholder="مثال: الثاني عشر"
              value={config.grade}
              onChange={(e) => handleChange('grade', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="text-base font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              المدة (بالدقائق)
            </Label>
            <Input
              id="duration"
              type="number"
              min={1}
              placeholder="60"
              value={config.durationMinutes || ''}
              onChange={(e) => handleChange('durationMinutes', parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passing" className="text-base font-medium flex items-center gap-2">
              <Percent className="w-4 h-4 text-muted-foreground" />
              درجة النجاح (%)
            </Label>
            <Input
              id="passing"
              type="number"
              min={0}
              max={100}
              placeholder="50"
              value={config.passingPercent || ''}
              onChange={(e) => handleChange('passingPercent', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
