# a3_execution_invariants_v1.md
**Invariantes de Execução do Agente A3**
**Versão:** 1.0.0
**Data:** 2026-02-25
**Contrato Base:** A3.md (SHA-256: 3f164fb6affcbc68f458a771f2a81a04430fa119f39195329763f72b10801c0a)

---

## Propósito

Este documento define as **invariantes de execução** que DEVEM ser sempre verdadeiras durante e após a execução do agente A3, independentemente do conteúdo processado.

Estas invariantes servem como:
1. Critérios de validação automatizada
2. Base para testes de conformidade
3. Requisitos para auditoria
4. Garantias epistemológicas do sistema

---

## I. Invariantes de Input

### I.1. Entidades de Input
```
INVARIANTE I.1.1: Apenas Entidades Aprovadas
∀ entidade ∈ inputs_A3 →
  entidade.status = 'approved' ∧
  entidade.source_id = source_atual
```

**Verificação:**
```sql
-- DEVE retornar 0 violações
SELECT COUNT(*) FROM kb_extracted_entities e
WHERE e.id IN (SELECT from_entity_id FROM kb_entity_relations_proposals WHERE source_id = $1)
  AND e.status != 'approved';
```

### I.2. Evidências de Input
```
INVARIANTE I.2.1: Evidências Aprovadas
∀ evidência ∈ evidences_A3 →
  evidência.status = 'approved' ∧
  evidência.id IN (SELECT evidence_id FROM kb_extracted_entities WHERE status = 'approved')
```

**Verificação:**
```sql
-- DEVE retornar 0 violações
SELECT COUNT(*) FROM kb_evidence_excerpts e
WHERE e.id IN (
  SELECT evidence_id FROM kb_extracted_entities
  WHERE status = 'approved' AND source_id = $1
) AND e.status != 'approved';
```

### I.3. Chunks de Input
```
INVARIANTE I.3.1: Chunks Existem e São Válidos
∀ chunk_id ∈ chunk_ids_processados →
  ∃ chunk IN kb_raw_chunks WHERE
    chunk.id = chunk_id ∧
    chunk.source_id = source_atual ∧
    LENGTH(chunk.raw_text) > 0
```

---

## II. Invariantes de Processamento

### II.1. Não-Duplicação
```
INVARIANTE II.1.1: Unicidade de Relações
∀ r1, r2 ∈ kb_entity_relations_proposals →
  (r1.source_id = r2.source_id ∧
   r1.from_entity_id = r2.from_entity_id ∧
   r1.to_entity_id = r2.to_entity_id ∧
   r1.relation_type = r2.relation_type)
  → r1.id = r2.id
```

**Verificação:**
```sql
-- DEVE retornar 0 duplicatas
SELECT
  source_id,
  from_entity_id,
  to_entity_id,
  relation_type,
  COUNT(*) as count
FROM kb_entity_relations_proposals
WHERE source_id = $1
GROUP BY source_id, from_entity_id, to_entity_id, relation_type
HAVING COUNT(*) > 1;
```

### II.2. Evidência Textual Obrigatória
```
INVARIANTE II.2.1: Toda Relação Tem Evidência
∀ relação ∈ kb_entity_relations_proposals →
  relação.textual_evidence IS NOT NULL ∧
  LENGTH(relação.textual_evidence) > 10 ∧
  relação.evidence_ids IS NOT NULL ∧
  ARRAY_LENGTH(relação.evidence_ids, 1) > 0
```

**Verificação:**
```sql
-- DEVE retornar 0 violações
SELECT COUNT(*) FROM kb_entity_relations_proposals
WHERE source_id = $1
  AND (
    textual_evidence IS NULL OR
    LENGTH(textual_evidence) <= 10 OR
    evidence_ids IS NULL OR
    ARRAY_LENGTH(evidence_ids, 1) = 0
  );
```

### II.3. Tipos de Relação Válidos
```
INVARIANTE II.3.1: Apenas Tipos Permitidos
∀ relação ∈ kb_entity_relations_proposals →
  relação.relation_type IN {
    'has_symptom',
    'has_clinical_sign',
    'treated_by_principle',
    'treated_by_acupoint',
    'causes',
    'alleviates',
    'contraindicated_with',
    'combined_with'
  }
```

**Verificação:**
```sql
-- DEVE retornar 0 violações
SELECT COUNT(*) FROM kb_entity_relations_proposals
WHERE source_id = $1
  AND relation_type NOT IN (
    'has_symptom',
    'has_clinical_sign',
    'treated_by_principle',
    'treated_by_acupoint',
    'causes',
    'alleviates',
    'contraindicated_with',
    'combined_with'
  );
```

### II.4. Confiança Válida
```
INVARIANTE II.4.1: Score de Confiança no Range
∀ relação ∈ kb_entity_relations_proposals →
  relação.confidence_score >= 0.0 ∧
  relação.confidence_score <= 1.0
```

**Verificação:**
```sql
-- DEVE retornar 0 violações
SELECT COUNT(*) FROM kb_entity_relations_proposals
WHERE source_id = $1
  AND (confidence_score < 0.0 OR confidence_score > 1.0);
```

---

## III. Invariantes de Output

### III.1. Status Inicial
```
INVARIANTE III.1.1: Relações Criadas como Pending
∀ relação ∈ novas_relações_A3 →
  relação.status = 'pending' ∧
  relação.reviewed_by IS NULL ∧
  relação.reviewed_at IS NULL
```

**Verificação:**
```sql
-- DEVE retornar 0 violações de relações novas com status incorreto
SELECT COUNT(*) FROM kb_entity_relations_proposals
WHERE source_id = $1
  AND agent_version LIKE 'a3-%'
  AND created_at >= $2  -- timestamp de início da execução
  AND (
    status != 'pending' OR
    reviewed_by IS NOT NULL OR
    reviewed_at IS NOT NULL
  );
```

### III.2. Rastreabilidade
```
INVARIANTE III.2.1: Agent Version Presente
∀ relação ∈ kb_entity_relations_proposals →
  relação.agent_version IS NOT NULL ∧
  relação.agent_version LIKE 'a3-v%'
```

**Verificação:**
```sql
-- DEVE retornar 0 violações
SELECT COUNT(*) FROM kb_entity_relations_proposals
WHERE source_id = $1
  AND (
    agent_version IS NULL OR
    agent_version NOT LIKE 'a3-v%'
  );
```

### III.3. Integridade Referencial
```
INVARIANTE III.3.1: From Entity Existe
∀ relação ∈ kb_entity_relations_proposals →
  ∃ entidade IN kb_extracted_entities WHERE
    entidade.id = relação.from_entity_id ∧
    entidade.status = 'approved'
```

```
INVARIANTE III.3.2: To Entity Existe
∀ relação ∈ kb_entity_relations_proposals →
  ∃ entidade IN kb_extracted_entities WHERE
    entidade.id = relação.to_entity_id ∧
    entidade.status = 'approved'
```

**Verificação:**
```sql
-- DEVE retornar 0 violações para from_entity
SELECT COUNT(*) FROM kb_entity_relations_proposals r
LEFT JOIN kb_extracted_entities e ON r.from_entity_id = e.id
WHERE r.source_id = $1
  AND (e.id IS NULL OR e.status != 'approved');

-- DEVE retornar 0 violações para to_entity
SELECT COUNT(*) FROM kb_entity_relations_proposals r
LEFT JOIN kb_extracted_entities e ON r.to_entity_id = e.id
WHERE r.source_id = $1
  AND (e.id IS NULL OR e.status != 'approved');
```

### III.4. Evidências Referenciam Entidades Corretas
```
INVARIANTE III.4.1: Evidence IDs Válidos
∀ relação ∈ kb_entity_relations_proposals →
  ∀ evidence_id ∈ relação.evidence_ids →
    ∃ evidência IN kb_evidence_excerpts WHERE
      evidência.id = evidence_id ∧
      evidência.status = 'approved' ∧
      (evidência.id IN (
        SELECT evidence_id FROM kb_extracted_entities
        WHERE id IN (relação.from_entity_id, relação.to_entity_id)
      ))
```

---

## IV. Invariantes de Contextualização

### IV.1. Uso de Chunks
```
INVARIANTE IV.1.1: Evidência Vem do Contexto de Chunks
∀ relação ∈ kb_entity_relations_proposals →
  ∃ chunk IN kb_raw_chunks WHERE
    chunk.id IN (
      SELECT chunk_id FROM kb_evidence_excerpts
      WHERE id IN (SELECT UNNEST(relação.evidence_ids))
    ) ∧
    relação.textual_evidence é substring ou paráfrase de chunk.raw_text
```

**Nota:** Esta invariante é verificada qualitativamente durante auditoria.

### IV.2. Múltiplos Chunks
```
INVARIANTE IV.2.1: Consolidação de Evidências
∀ relação ∈ kb_entity_relations_proposals →
  Se ∃ múltiplas evidências para mesma relação em diferentes chunks →
    relação.evidence_ids contém TODAS as evidências relevantes ∧
    ∃ apenas UMA proposta de relação
```

---

## V. Invariantes de Pipeline

### V.1. Atualização de Status
```
INVARIANTE V.1.1: Pipeline Status Atualizado
Após execução completa de A3 para source_id S →
  ∃ status IN kb_document_pipeline_status WHERE
    status.source_id = S ∧
    status.a2_status = 'completed' ∧
    status.a2_completed_at IS NOT NULL ∧
    status.total_relations >= 0
```

**Verificação:**
```sql
-- DEVE retornar 1 registro com valores corretos
SELECT
  a2_status,
  a2_completed_at,
  total_relations
FROM kb_document_pipeline_status
WHERE source_id = $1;
```

### V.2. Notificações
```
INVARIANTE V.2.1: Notificação Criada Se Há Relações
Após execução de A3 para source_id S →
  Se relações_criadas > 0 →
    ∃ notificação IN kb_notifications WHERE
      notificação.notification_type = 'validation_required' ∧
      notificação.related_entity_type = 'source' ∧
      notificação.related_entity_id = S
```

---

## VI. Invariantes de Não-Inferência

### VI.1. Preservação Textual
```
INVARIANTE VI.1.1: Sem Conhecimento Externo
∀ relação ∈ kb_entity_relations_proposals →
  relação.textual_evidence pode ser rastreada a texto literal em chunks ∧
  NÃO contém conhecimento de MTC não presente no corpus
```

**Nota:** Verificada qualitativamente em auditoria humana.

### VI.2. Sem Interpretação Clínica
```
INVARIANTE VI.2.1: Extraction Rationale Descritivo
∀ relação ∈ kb_entity_relations_proposals →
  relação.extraction_rationale descreve identificação textual ∧
  NÃO contém diagnóstico, prognóstico ou recomendação clínica
```

**Nota:** Verificada qualitativamente em auditoria humana.

---

## VII. Testes de Conformidade

### Teste 1: Verificação de Duplicação
```sql
-- Executar após cada processamento A3
-- Resultado esperado: 0 duplicatas
WITH duplicates AS (
  SELECT
    source_id,
    from_entity_id,
    to_entity_id,
    relation_type,
    COUNT(*) as dup_count
  FROM kb_entity_relations_proposals
  WHERE source_id = $1
  GROUP BY source_id, from_entity_id, to_entity_id, relation_type
  HAVING COUNT(*) > 1
)
SELECT * FROM duplicates;
```

### Teste 2: Integridade Total
```sql
-- Verificar todas as invariantes de uma vez
-- Resultado esperado: 0 violações em todas as queries

-- Status de entidades
SELECT 'I.1.1' as invariante, COUNT(*) as violations
FROM kb_entity_relations_proposals r
JOIN kb_extracted_entities e ON e.id IN (r.from_entity_id, r.to_entity_id)
WHERE r.source_id = $1 AND e.status != 'approved'

UNION ALL

-- Evidências válidas
SELECT 'II.2.1', COUNT(*) FROM kb_entity_relations_proposals
WHERE source_id = $1 AND (
  textual_evidence IS NULL OR
  LENGTH(textual_evidence) <= 10 OR
  evidence_ids IS NULL
)

UNION ALL

-- Tipos válidos
SELECT 'II.3.1', COUNT(*) FROM kb_entity_relations_proposals
WHERE source_id = $1 AND relation_type NOT IN (
  'has_symptom', 'has_clinical_sign', 'treated_by_principle',
  'treated_by_acupoint', 'causes', 'alleviates',
  'contraindicated_with', 'combined_with'
)

UNION ALL

-- Confidence score válido
SELECT 'II.4.1', COUNT(*) FROM kb_entity_relations_proposals
WHERE source_id = $1 AND (confidence_score < 0.0 OR confidence_score > 1.0)

UNION ALL

-- Status inicial correto
SELECT 'III.1.1', COUNT(*) FROM kb_entity_relations_proposals
WHERE source_id = $1
  AND agent_version LIKE 'a3-%'
  AND created_at >= $2
  AND (status != 'pending' OR reviewed_by IS NOT NULL);
```

### Teste 3: Rastreabilidade Completa
```sql
-- Verificar que todas as relações podem ser rastreadas
-- até entidades, evidências e chunks válidos
SELECT
  r.id as relation_id,
  r.from_entity_id,
  r.to_entity_id,
  e1.status as from_status,
  e2.status as to_status,
  ev.status as evidence_status,
  c.id as chunk_id,
  LENGTH(c.raw_text) as chunk_length
FROM kb_entity_relations_proposals r
JOIN kb_extracted_entities e1 ON r.from_entity_id = e1.id
JOIN kb_extracted_entities e2 ON r.to_entity_id = e2.id
JOIN kb_evidence_excerpts ev ON ev.id = ANY(r.evidence_ids)
JOIN kb_raw_chunks c ON ev.chunk_id = c.id
WHERE r.source_id = $1
  AND (
    e1.status != 'approved' OR
    e2.status != 'approved' OR
    ev.status != 'approved' OR
    c.raw_text IS NULL
  );
-- Resultado esperado: 0 registros (sem violações)
```

---

## VIII. Checklist de Auditoria

Para auditar uma execução do A3, verificar:

- [ ] Todas as entidades de input têm status 'approved'
- [ ] Não há relações duplicadas no output
- [ ] Todas as relações têm textual_evidence não-vazio
- [ ] Todas as relações têm evidence_ids populado
- [ ] Todos os relation_type são válidos
- [ ] Todos os confidence_score estão entre 0.0 e 1.0
- [ ] Todas as relações foram criadas com status 'pending'
- [ ] Agent_version está presente e correto
- [ ] Pipeline status foi atualizado corretamente
- [ ] Notificação foi criada se aplicável
- [ ] Integridade referencial mantida (foreign keys válidas)
- [ ] Extraction_rationale é descritivo, não interpretativo

---

## IX. Documento Congelado

Este documento de invariantes é normativo e versionado.

Qualquer modificação **EXIGE** criação de nova versão com novo hash.

**SHA-256:** b89a359531a1fb3c33e8ed29e7df08bad9c8d17fac4ecb033872ad6c5e30761b

---

## X. Referências

- **A3.md** — Contrato principal do agente A3
- **A0.md** — Contrato de validação de evidências
- **A1.md** — Contrato de extração de entidades
- **P0.md** — Contrato de chunking
