-- Add case_sensitive column for identification answer matching.
-- Handles both legacy plural table naming (`questions`) and current singular naming (`question`).
DO $$
BEGIN
	IF to_regclass('public.question') IS NOT NULL THEN
		ALTER TABLE public.question
			ADD COLUMN IF NOT EXISTS case_sensitive BOOLEAN NOT NULL DEFAULT false;

		CREATE INDEX IF NOT EXISTS idx_question_case_sensitive
			ON public.question(case_sensitive)
			WHERE type = 'IDENTIFICATION';
	ELSIF to_regclass('public.questions') IS NOT NULL THEN
		ALTER TABLE public.questions
			ADD COLUMN IF NOT EXISTS case_sensitive BOOLEAN NOT NULL DEFAULT false;

		CREATE INDEX IF NOT EXISTS idx_questions_case_sensitive
			ON public.questions(case_sensitive)
			WHERE type = 'IDENTIFICATION';
	END IF;
END $$;
