/*
  # Create cases table

  1. New Tables
    - `cases`
      - `id` (uuid, primary key) - Unique identifier for each case
      - `description` (text) - Description of the case by professional
      - `additional_notes` (text, nullable) - Optional additional observations
      - `created_at` (timestamp) - When the case was created
  
  2. Security
    - Enable RLS on `cases` table
    - Add policy for public insert access (for now, as no auth is mentioned)
*/

CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  additional_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert cases"
  ON cases
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read cases"
  ON cases
  FOR SELECT
  TO anon
  USING (true);