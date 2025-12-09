import * as XLSX from 'xlsx';
import { Exam } from '@/types/exam';

export function generateExcel(exam: Exam): void {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: معلومات الاختبار
  const infoData = [
    ['معلومات الاختبار', '', ''],
    ['', '', ''],
    ['الحقل', 'القيمة', 'ملاحظات'],
    ['عنوان الاختبار', exam.title, 'العنوان الرئيسي للاختبار'],
    ['الوصف', exam.description || '', 'وصف تفصيلي للاختبار'],
    ['المادة', exam.subject || '', 'اسم المادة الدراسية'],
    ['الصف', exam.grade || '', 'الصف أو المرحلة الدراسية'],
    ['المدة (بالدقائق)', exam.durationMinutes?.toString() || '60', 'مدة الاختبار بالدقائق'],
    ['درجة النجاح (%)', exam.passingPercent?.toString() || '50', 'الحد الأدنى للنجاح'],
  ];

  const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
  
  // Set column widths
  infoSheet['!cols'] = [
    { wch: 20 },
    { wch: 40 },
    { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(workbook, infoSheet, 'معلومات الاختبار');

  // Sheet 2: الأسئلة
  const questionsHeader = [
    ['أسئلة الاختبار - MCQ (اختيار من متعدد)', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    ['رقم السؤال', 'السؤال', 'الخيار أ', 'الخيار ب', 'الخيار ج', 'الخيار د', 'الإجابة الصحيحة', 'الدرجة', 'رابط الصورة'],
  ];

  const questionsData = exam.questions.map(q => [
    q.index,
    q.text,
    q.optionA,
    q.optionB,
    q.optionC,
    q.optionD,
    q.correctOption,
    q.mark,
    q.imageUrl || '',
  ]);

  const questionsSheetData = [...questionsHeader, ...questionsData];
  const questionsSheet = XLSX.utils.aoa_to_sheet(questionsSheetData);

  // Set column widths for questions sheet
  questionsSheet['!cols'] = [
    { wch: 12 },
    { wch: 60 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 25 },
    { wch: 15 },
    { wch: 10 },
    { wch: 40 },
  ];

  XLSX.utils.book_append_sheet(workbook, questionsSheet, 'الأسئلة');

  // Generate and download
  const fileName = `${exam.title || 'اختبار'}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
