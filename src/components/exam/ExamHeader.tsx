import { Sparkles, BookOpen } from "lucide-react";
export function ExamHeader() {
  return <header className="text-center py-8 md:py-12">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <div className="p-3 bg-accent rounded-xl">
          <BookOpen className="w-8 h-8 text-accent-foreground" />
        </div>
      </div>
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">منصة قلم الذكية</h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">معلمنا الفاضل .. حول ملفات الشرح إلي بنك أسئلة و قم باستخدامه علي منصة قلم الأساسية ... و شكرا لكم لتعونكم مع إدارة منصة قلم التعليمية</p>
    </header>;
}