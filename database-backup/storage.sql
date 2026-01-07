-- =====================================================
-- إعدادات التخزين (Storage Configuration)
-- Database Backup - Created: 2026-01-07
-- =====================================================

-- =====================================================
-- إنشاء Storage Buckets
-- =====================================================

-- bucket لصور الأسئلة
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('question-images', 'question-images', true, NULL, NULL);

-- =====================================================
-- سياسات التخزين (Storage Policies)
-- =====================================================

-- السماح بقراءة صور الأسئلة للجميع
CREATE POLICY "Allow public read access on question images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'question-images');

-- السماح برفع صور للجميع
CREATE POLICY "Allow public upload to question images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'question-images');
