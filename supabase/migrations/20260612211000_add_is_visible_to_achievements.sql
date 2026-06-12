-- Migration: Add is_visible column to achievements table
-- This column tracks whether an achievement is active and visible to users.

ALTER TABLE achievements
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE NOT NULL;
