-- Migration: add recurring expense fields
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)

ALTER TABLE accounting_expenses
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recurrence   TEXT    DEFAULT 'none',   -- 'none' | 'monthly' | 'annual'
  ADD COLUMN IF NOT EXISTS renewal_date DATE;

-- Optional: index for fast renewal alerts query
CREATE INDEX IF NOT EXISTS idx_accounting_expenses_renewal
  ON accounting_expenses (renewal_date)
  WHERE is_recurring = TRUE;
