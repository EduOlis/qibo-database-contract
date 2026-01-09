/*
  # Add NOT NULL constraint to entity_label

  1. Changes
    - Alter `kb_entity_proposals.entity_label` to NOT NULL
    
  2. Rationale
    - Every entity proposal must have a human-readable label
    - Enforces data quality at the schema level
    - Aligns with contract requirement that entity_label is mandatory
*/

ALTER TABLE kb_entity_proposals 
ALTER COLUMN entity_label SET NOT NULL;
