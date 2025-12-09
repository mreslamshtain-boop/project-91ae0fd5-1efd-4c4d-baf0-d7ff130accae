import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Exam } from "@/types/exam";
import { useToast } from "@/hooks/use-toast";

interface ExportButtonsProps {
  exam: Exam | null;
  onExportExcel: () => Promise<void>;
  onExportPdf: (cardsPerPage: number) => Promise<void>;
}

export function ExportButtons({ exam, onExportExcel, onExportPdf }: ExportButtonsProps) {
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [cardsPerPage, setCardsPerPage] = useState('2');
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);
  const { toast } = useToast();

  if (!exam || exam.questions.length === 0) return null;

  const handleExcelExport = async () => {
    setExporting('excel');
    try {
      await onExportExcel();
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تحميل ملف Excel",
      });
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير ملف Excel",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  const handlePdfExport = async () => {
    setExporting('pdf');
    setPdfDialogOpen(false);
    try {
      await onExportPdf(parseInt(cardsPerPage));
      toast({
        title: "تم التصدير بنجاح",
        description: "تم تحميل ملف PDF",
      });
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "حدث خطأ أثناء تصدير ملف PDF",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  return (
    <>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Download className="w-5 h-5 text-primary" />
            تصدير الاختبار
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleExcelExport}
            disabled={exporting !== null}
            className="flex-1"
            size="lg"
          >
            {exporting === 'excel' ? (
              <Loader2 className="w-5 h-5 ml-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-5 h-5 ml-2" />
            )}
            تحميل ملف Excel
          </Button>
          <Button
            onClick={() => setPdfDialogOpen(true)}
            disabled={exporting !== null}
            variant="secondary"
            className="flex-1"
            size="lg"
          >
            {exporting === 'pdf' ? (
              <Loader2 className="w-5 h-5 ml-2 animate-spin" />
            ) : (
              <FileText className="w-5 h-5 ml-2" />
            )}
            حفظ كملف PDF
          </Button>
        </CardContent>
      </Card>

      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إعدادات ملف PDF</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-base font-medium mb-4 block">
              عدد بطاقات الأسئلة في كل صفحة
            </Label>
            <RadioGroup
              value={cardsPerPage}
              onValueChange={setCardsPerPage}
              className="grid grid-cols-3 gap-4"
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="1" id="cards-1" />
                <Label htmlFor="cards-1" className="cursor-pointer">1 سؤال</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="2" id="cards-2" />
                <Label htmlFor="cards-2" className="cursor-pointer">2 سؤال</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="4" id="cards-4" />
                <Label htmlFor="cards-4" className="cursor-pointer">4 أسئلة</Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPdfDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handlePdfExport}>
              تصدير PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
