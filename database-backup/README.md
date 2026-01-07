# نسخة احتياطية كاملة لقاعدة البيانات
# Complete Database Backup

تاريخ الإنشاء: 2026-01-07

## محتويات هذا المجلد:

1. **schema.sql** - هيكل قاعدة البيانات الكامل (الجداول والأعمدة)
2. **enums.sql** - أنواع البيانات المخصصة (Enums)
3. **functions.sql** - جميع الدوال (Functions)
4. **policies.sql** - سياسات أمان صف البيانات (RLS Policies)
5. **indexes.sql** - الفهارس (Indexes)
6. **storage.sql** - إعدادات التخزين (Storage Buckets & Policies)
7. **full-backup.sql** - النسخة الكاملة في ملف واحد

## كيفية استعادة قاعدة البيانات:

1. قم بإنشاء مشروع Supabase جديد
2. قم بتشغيل ملف `full-backup.sql` في SQL Editor
3. أو قم بتشغيل الملفات بالترتيب التالي:
   - enums.sql
   - schema.sql
   - indexes.sql
   - functions.sql
   - policies.sql
   - storage.sql
