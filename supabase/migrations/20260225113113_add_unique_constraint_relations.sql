/*
  # Adicionar constraint de unicidade para relações entre entidades

  1. Alterações
    - Adiciona constraint UNIQUE em kb_entity_relations_proposals
    - Garante que não existam relações duplicadas para o mesmo source, from_entity, to_entity e relation_type
  
  2. Segurança
    - Remove duplicatas existentes antes de aplicar constraint
    - Mantém a relação mais recente em caso de duplicatas
  
  3. Nota
    - Esta constraint garante a invariante II.1.1 do contrato A3 a nível de banco de dados
*/

-- Primeiro, remover duplicatas existentes (se houver)
-- Mantém apenas o registro mais recente de cada grupo de duplicatas
DELETE FROM kb_entity_relations_proposals
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY source_id, from_entity_id, to_entity_id, relation_type
        ORDER BY created_at DESC
      ) as rn
    FROM kb_entity_relations_proposals
  ) t
  WHERE t.rn > 1
);

-- Adicionar constraint de unicidade
ALTER TABLE kb_entity_relations_proposals
ADD CONSTRAINT unique_relation_per_source
UNIQUE (source_id, from_entity_id, to_entity_id, relation_type);
