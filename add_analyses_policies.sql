-- Add RLS policies for analyses table to allow background tasks

-- Allow INSERT for analyses (for background analysis tasks)
CREATE POLICY "allow_analysis_insert" ON analyses
  FOR INSERT WITH CHECK (true);

-- Allow UPDATE for analyses (for background analysis tasks)
CREATE POLICY "allow_analysis_update" ON analyses
  FOR UPDATE USING (true);
