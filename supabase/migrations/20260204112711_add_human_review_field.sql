/*
  # Add human review field to cases table

  1. Changes
    - Add `human_review` column to `cases` table
      - Type: text
      - Required: NOT NULL (mandatory field)
      - Description: Professional human analysis and clinical decision
  
  2. Notes
    - This field captures the mandatory human review that must be performed
    - The system cannot complete processing without this field
    - Contains professional interpretation, decision, and justification
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'human_review'
  ) THEN
    ALTER TABLE cases ADD COLUMN human_review text NOT NULL DEFAULT '';
  END IF;
END $$;