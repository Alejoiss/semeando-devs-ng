-- Add UPDATE policy for user_achievements table
CREATE POLICY "Users can update own user_achievements" 
ON public.user_achievements 
FOR UPDATE TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
