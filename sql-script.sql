-- 1. Create user_charts table
CREATE TABLE IF NOT EXISTS public.user_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  birth_date TEXT NOT NULL,
  birth_time TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  prokerala_raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add a unique constraint to prevent duplicates for the same birth data
ALTER TABLE public.user_charts 
  ADD CONSTRAINT unique_user_chart 
  UNIQUE (user_id, birth_date, birth_time, latitude, longitude);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.user_charts ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
-- Users can only insert their own charts
CREATE POLICY "Users can insert their own charts" 
ON public.user_charts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can only select their own charts
CREATE POLICY "Users can view their own charts" 
ON public.user_charts FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own charts (for caching)
CREATE POLICY "Users can update their own charts" 
ON public.user_charts FOR UPDATE 
USING (auth.uid() = user_id);
