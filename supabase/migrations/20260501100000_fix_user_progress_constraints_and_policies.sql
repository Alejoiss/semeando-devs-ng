-- Add unique constraints to prevent duplicate progress records
ALTER TABLE public.user_modules 
ADD CONSTRAINT user_modules_user_id_module_id_key UNIQUE (user_id, module_id);

ALTER TABLE public.user_submodules 
ADD CONSTRAINT user_submodules_user_id_sub_module_id_key UNIQUE (user_id, sub_module_id);

-- Add missing update policy for user_modules
CREATE POLICY "Users can update their own user_modules"
    ON public.user_modules
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
