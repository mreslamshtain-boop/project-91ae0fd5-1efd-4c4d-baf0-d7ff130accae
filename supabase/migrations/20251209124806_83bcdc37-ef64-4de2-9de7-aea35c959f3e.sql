-- Create exams table
CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  grade TEXT,
  duration_minutes INTEGER DEFAULT 60,
  passing_percent INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  index INTEGER NOT NULL,
  text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  mark INTEGER NOT NULL DEFAULT 1,
  image_url TEXT,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for question images
INSERT INTO storage.buckets (id, name, public) VALUES ('question-images', 'question-images', true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_exams_updated_at
BEFORE UPDATE ON public.exams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on exams table (public access for now)
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for exams (no auth required for this MVP)
CREATE POLICY "Allow public read access on exams"
ON public.exams FOR SELECT
USING (true);

CREATE POLICY "Allow public insert on exams"
ON public.exams FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update on exams"
ON public.exams FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete on exams"
ON public.exams FOR DELETE
USING (true);

-- Enable RLS on questions table
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for questions
CREATE POLICY "Allow public read access on questions"
ON public.questions FOR SELECT
USING (true);

CREATE POLICY "Allow public insert on questions"
ON public.questions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update on questions"
ON public.questions FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete on questions"
ON public.questions FOR DELETE
USING (true);

-- Storage policies for question images
CREATE POLICY "Allow public read access on question images"
ON storage.objects FOR SELECT
USING (bucket_id = 'question-images');

CREATE POLICY "Allow public upload to question images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'question-images');

-- Create indexes for better performance
CREATE INDEX idx_questions_exam_id ON public.questions(exam_id);
CREATE INDEX idx_questions_index ON public.questions(exam_id, index);