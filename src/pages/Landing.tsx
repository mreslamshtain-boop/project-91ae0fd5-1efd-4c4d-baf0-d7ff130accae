import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Sparkles, 
  FileText, 
  Brain, 
  Zap, 
  Users, 
  BookOpen, 
  ArrowLeft,
  CheckCircle,
  Image as ImageIcon,
  Download
} from 'lucide-react';

export default function Landing() {
  const features = [
    {
      icon: Brain,
      title: 'ذكاء اصطناعي متقدم',
      description: 'نستخدم أحدث نماذج الذكاء الاصطناعي لتوليد أسئلة دقيقة ومتنوعة'
    },
    {
      icon: FileText,
      title: 'تحليل ملفات PDF',
      description: 'ارفع ملف PDF وسنحوله إلى أسئلة اختبار متعددة الخيارات'
    },
    {
      icon: ImageIcon,
      title: 'توليد الصور التوضيحية',
      description: 'نولد رسومات ومخططات توضيحية للأسئلة التي تحتاجها'
    },
    {
      icon: Download,
      title: 'تصدير متعدد',
      description: 'صدّر اختباراتك بصيغة Excel أو PDF بتنسيقات احترافية'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'سؤال تم توليده' },
    { value: '500+', label: 'معلم يستخدم المنصة' },
    { value: '50+', label: 'مادة دراسية' },
    { value: '99%', label: 'دقة الأسئلة' }
  ];

  const steps = [
    { step: 1, title: 'أدخل المحتوى', description: 'اكتب وصف المحتوى أو ارفع ملف PDF' },
    { step: 2, title: 'حدد الإعدادات', description: 'اختر عدد الأسئلة ومستوى الصعوبة' },
    { step: 3, title: 'احصل على الاختبار', description: 'صدّر الاختبار جاهزاً للطباعة' }
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-background overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center animate-fade-in">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Qalam AI</span>
          </div>
          <Link to="/login">
            <Button>
              تسجيل الدخول
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">مدعوم بالذكاء الاصطناعي</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            حوّل أي محتوى إلى
            <span className="block text-primary mt-2">اختبار احترافي</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            منصة قلم الذكية تساعدك في توليد آلاف الأسئلة المتنوعة من ملفاتك أو وصفك للمحتوى، 
            مع صور توضيحية وتصدير احترافي
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link to="/login">
              <Button size="lg" className="text-lg px-8 h-14 hover-scale">
                <Sparkles className="w-5 h-5 ml-2" />
                ابدأ الآن مجاناً
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 h-14 hover-scale">
              <BookOpen className="w-5 h-5 ml-2" />
              تعرف على المزيد
            </Button>
          </div>

          {/* Company Info */}
          <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <p className="text-muted-foreground">
              منصة قلم الذكية إنتاج <span className="font-semibold text-foreground">مؤسسة قلم للخدمات الإلكترونية</span>
            </p>
            <p className="text-muted-foreground flex items-center justify-center gap-1">
              بكل فخر <span className="text-red-500 animate-pulse">❤</span> صنع في مصر 🇪🇬
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in">
              مميزات تجعلنا <span className="text-primary">الأفضل</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
              نوفر لك أدوات متقدمة لإنشاء اختبارات احترافية في دقائق
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group hover:border-primary transition-all duration-300 hover:-translate-y-2 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="py-20 px-4 bg-card">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in">
              كيف <span className="text-primary">تعمل المنصة؟</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
              ثلاث خطوات بسيطة للحصول على اختبار كامل
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((item, index) => (
              <div 
                key={index} 
                className="relative text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
                
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-border -translate-x-1/2" style={{ width: '50%', left: '-25%' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                لماذا يختار المعلمون <span className="text-primary">منصة قلم؟</span>
              </h2>
              <div className="space-y-4">
                {[
                  'توفير ساعات من الوقت في إعداد الاختبارات',
                  'أسئلة متنوعة ومتوازنة في مستوى الصعوبة',
                  'دعم كامل للغة العربية والمواد العلمية',
                  'صور ورسومات توضيحية تلقائية',
                  'تصدير بتنسيقات متعددة (Excel, PDF)',
                  'واجهة سهلة الاستخدام بالكامل'
                ].map((benefit, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl p-8 border border-primary/20">
                <div className="bg-card rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">اختبار الرياضيات</div>
                      <div className="text-sm text-muted-foreground">الصف الثالث الثانوي</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '85%' }} />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">جاري التوليد...</span>
                      <span className="text-primary font-medium">85%</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">الأسئلة المولدة</span>
                      <span className="font-semibold">17 / 20</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in">
            ابدأ في توليد اختباراتك الآن
          </h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            انضم لمئات المعلمين الذين يوفرون وقتهم مع منصة قلم الذكية
          </p>
          <Link to="/login">
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8 h-14 hover-scale animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              <Users className="w-5 h-5 ml-2" />
              سجّل دخولك الآن
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Qalam AI</span>
            </div>
            <p className="text-muted-foreground text-sm text-center">
              شكراً جزيلاً لتعاونكم الطيب مع منصة قلم التعليمية ❤
            </p>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} جميع الحقوق محفوظة
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}