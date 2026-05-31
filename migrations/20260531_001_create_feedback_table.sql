-- Migration: Create feedback table
-- Date: 2026-05-31
-- Purpose: User Feedback Collection system (spec 02_specification-20260531-001.md)

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  message TEXT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  type VARCHAR(50) DEFAULT 'general' CHECK (type IN ('bug', 'feature', 'general')),
  email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'read', 'responded')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT message_length CHECK (LENGTH(message) >= 1 AND LENGTH(message) <= 500),
  CONSTRAINT valid_email CHECK (email IS NULL OR email ~ '^[^@]+@[^@]+\.[^@]+$'),

  -- Foreign Key (references members table if exists, or allows NULL)
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES members(id) ON DELETE SET NULL
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
