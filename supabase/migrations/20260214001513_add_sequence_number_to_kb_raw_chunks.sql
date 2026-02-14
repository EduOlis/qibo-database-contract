/*
  # Add sequence_number column to kb_raw_chunks

  1. Changes
    - Add `sequence_number` column to `kb_raw_chunks` table
      - Type: integer
      - Purpose: Track the order of chunks within a document
      - Required field to maintain chunk sequence

  2. Notes
    - This column is required by the P0 chunking process
    - Ensures chunks can be reassembled in the correct order
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kb_raw_chunks' AND column_name = 'sequence_number'
  ) THEN
    ALTER TABLE kb_raw_chunks ADD COLUMN sequence_number integer NOT NULL DEFAULT 0;
  END IF;
END $$;
