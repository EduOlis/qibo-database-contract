/*
  # Remove duplicate relations and add unique constraint

  1. Changes
    - Remove duplicate relations keeping only the oldest one (first created)
    - Add unique constraint on (source_id, from_entity_id, to_entity_id, relation_type)
    - This prevents the same relation from being created multiple times
    - Ensures data integrity when A3 is run multiple times on the same source
  
  2. Security
    - No changes to RLS policies
  
  3. Notes
    - Keeps the oldest relation when duplicates exist
    - This preserves the original extraction while removing redundant ones
*/

-- First, identify and delete duplicate relations, keeping only the oldest one
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY source_id, from_entity_id, to_entity_id, relation_type 
      ORDER BY created_at ASC
    ) as rn
  FROM kb_entity_relations_proposals
)
DELETE FROM kb_entity_relations_proposals
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'kb_entity_relations_unique_relation'
  ) THEN
    ALTER TABLE kb_entity_relations_proposals
    ADD CONSTRAINT kb_entity_relations_unique_relation 
    UNIQUE (source_id, from_entity_id, to_entity_id, relation_type);
  END IF;
END $$;