import jsPDF from 'jspdf';
import { Exam, CorrectOption } from '@/types/exam';

const optionLabels: Record<CorrectOption, string> = {
  A: 'أ',
  B: 'ب',
  C: 'ج',
  D: 'د',
};

const difficultyLabels = {
  EASY: 'سهل',
  MEDIUM: 'متوسط',
  HARD: 'صعب',
};

export async function generatePdf(exam: Exam, cardsPerPage: number): Promise<void> {
  // Create PDF with Arabic font support
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Add Arabic font (using built-in Helvetica for now, ideally would use Arabic font)
  doc.setFont('helvetica');
  
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  // Calculate card dimensions based on cards per page
  let cardHeight: number;
  let cardsPerRow: number;
  let cardsPerCol: number;

  switch (cardsPerPage) {
    case 1:
      cardHeight = pageHeight - 60;
      cardsPerRow = 1;
      cardsPerCol = 1;
      break;
    case 2:
      cardHeight = (pageHeight - 70) / 2;
      cardsPerRow = 1;
      cardsPerCol = 2;
      break;
    case 4:
    default:
      cardHeight = (pageHeight - 70) / 2;
      cardsPerRow = 1;
      cardsPerCol = 2;
      break;
  }

  // Title page
  doc.setFontSize(24);
  doc.setTextColor(51, 51, 51);
  
  // RTL text handling - we'll use reverse for Arabic
  const reverseArabic = (text: string) => text.split('').reverse().join('');
  
  let y = 40;
  doc.text(exam.title || 'اختبار', pageWidth / 2, y, { align: 'center' });
  
  y += 20;
  doc.setFontSize(14);
  
  if (exam.subject) {
    doc.text(`${exam.subject} :ةداملا`, pageWidth / 2, y, { align: 'center' });
    y += 10;
  }
  
  if (exam.grade) {
    doc.text(`${exam.grade} :فصلا`, pageWidth / 2, y, { align: 'center' });
    y += 10;
  }
  
  if (exam.durationMinutes) {
    doc.text(`ةقيقد ${exam.durationMinutes} :ةدملا`, pageWidth / 2, y, { align: 'center' });
    y += 10;
  }

  doc.text(`لاؤس ${exam.questions.length} :ةلئسلأا ددع`, pageWidth / 2, y, { align: 'center' });
  y += 10;

  const totalMarks = exam.questions.reduce((sum, q) => sum + q.mark, 0);
  doc.text(`ةجرد ${totalMarks} :ةيلكلا ةجردلا`, pageWidth / 2, y, { align: 'center' });

  // Questions pages
  let currentPage = 1;
  let cardIndex = 0;

  for (let i = 0; i < exam.questions.length; i++) {
    const question = exam.questions[i];
    
    if (cardIndex % cardsPerPage === 0) {
      doc.addPage();
      currentPage++;
      cardIndex = 0;
    }

    const row = Math.floor(cardIndex / cardsPerRow);
    const cardY = margin + 10 + row * (cardHeight + 5);
    
    // Card border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, cardY, contentWidth, cardHeight - 10, 3, 3);

    // Question number badge
    doc.setFillColor(99, 102, 241);
    doc.circle(margin + 10, cardY + 10, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(question.index.toString(), margin + 10, cardY + 12, { align: 'center' });

    // Difficulty and mark badges
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const diffLabel = difficultyLabels[question.difficulty];
    doc.text(`${diffLabel} | ةجرد ${question.mark}`, margin + contentWidth - 5, cardY + 10, { align: 'right' });

    // Question text
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(11);
    
    const questionLines = doc.splitTextToSize(question.text, contentWidth - 30);
    let textY = cardY + 25;
    questionLines.forEach((line: string) => {
      doc.text(line, margin + contentWidth - 5, textY, { align: 'right' });
      textY += 6;
    });

    // Options
    textY += 5;
    const options = [
      { key: 'A' as const, text: question.optionA },
      { key: 'B' as const, text: question.optionB },
      { key: 'C' as const, text: question.optionC },
      { key: 'D' as const, text: question.optionD },
    ];

    options.forEach((option) => {
      const label = optionLabels[option.key];
      const optionText = `${option.text} (${label}`;
      
      const optionLines = doc.splitTextToSize(optionText, contentWidth - 40);
      optionLines.forEach((line: string, lineIdx: number) => {
        if (lineIdx === 0) {
          // Draw option circle
          doc.setDrawColor(150, 150, 150);
          doc.circle(margin + contentWidth - 10, textY - 2, 3);
        }
        doc.text(line, margin + contentWidth - 20, textY, { align: 'right' });
        textY += 6;
      });
      textY += 2;
    });

    cardIndex++;
  }

  // Save the PDF
  const fileName = `${exam.title || 'اختبار'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
