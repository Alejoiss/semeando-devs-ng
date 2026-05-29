ALTER TABLE public.coupons 
ADD COLUMN valid_for_plan_type TEXT DEFAULT 'all' 
CHECK (valid_for_plan_type IN ('monthly', 'yearly', 'all'));
