import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Layers } from "lucide-react";
import { GenerationConfig } from "@/types/exam";
import { useRef } from "react";

interface SourceSelectorProps {
  config: GenerationConfig;
  onChange: (config: GenerationConfig) => void;
}

export function SourceSelector({ config, onChange }: SourceSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSourceChange = (value: string) => {
    onChange({ ...config, sourceType: value as 'description' | 'pdf' | 'both' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange({ ...config, pdfFile: file });
    }
  };

  const handleCombineToggle = (checked: boolean) => {
    onChange({ 
      ...config, 
      sourceType: checked ? 'both' : (config.pdfFile ? 'pdf' : 'description')
    });
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Layers className="w-5 h-5 text-primary" />
          مصدر المحتوى
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={config.sourceType === 'both' ? 'pdf' : config.sourceType}
          onValueChange={handleSourceChange}
          className="gap-4"
        >
          <div className="flex items-center space-x-3 space-x-reverse">
            <RadioGroupItem value="description" id="description" />
            <Label htmlFor="description" className="flex items-center gap-2 cursor-pointer">
              <FileText className="w-4 h-4 text-muted-foreground" />
              إدخال وصفي
            </Label>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse">
            <RadioGroupItem value="pdf" id="pdf" />
            <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4 text-muted-foreground" />
              رفع ملف PDF
            </Label>
          </div>
        </RadioGroup>

        {(config.sourceType === 'pdf' || config.sourceType === 'both') && (
          <div className="space-y-4 p-4 bg-accent/30 rounded-lg border border-border">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all"
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-primary/60" />
              <p className="text-foreground font-medium mb-1">
                {config.pdfFile ? config.pdfFile.name : 'اضغط لاختيار ملف PDF'}
              </p>
              <p className="text-sm text-muted-foreground">
                أو اسحب الملف وأفلته هنا
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="flex items-start space-x-3 space-x-reverse">
              <Checkbox
                id="combine"
                checked={config.sourceType === 'both'}
                onCheckedChange={handleCombineToggle}
              />
              <div>
                <Label htmlFor="combine" className="cursor-pointer font-medium">
                  مزج الوصف المكتوب مع محتوى ملف الـ PDF
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  لتحسين جودة الأسئلة المولدة
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
