-- Migration: Add is_validated column to lessons table
-- This column tracks whether a lesson has passed all validation checks.
-- NULL = never validated or pending revalidation
-- TRUE = all checks passed
-- FALSE = one or more checks failed

ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT NULL;
