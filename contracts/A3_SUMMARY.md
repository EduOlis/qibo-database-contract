# A3 - Resumo Técnico
**Agente de Identificação de Relações entre Entidades**

---

## Visão Geral

O agente A3 foi desenvolvido para identificar relações explícitas entre entidades de MTC baseando-se no **contexto completo dos chunks originais**, não apenas nos excerpts das evidências.

### Problema Identificado

Anteriormente, o A3 operava apenas sobre os pequenos trechos de texto das evidências (clusters), perdendo contexto importante que existia nos chunks originais. Isso limitava a capacidade de identificar relações entre entidades que apareciam no mesmo documento mas em evidências diferentes.

### Solução Implementada

O A3 agora:
1. Acessa o texto completo dos chunks originais (`kb_raw_chunks`)
2. Usa as evidências como referência secundária
3. Fornece contexto amplo ao LLM para melhor identificação de relações
4. Previne duplicação através de verificação obrigatória antes de inserção

---

## Documentos Criados

### 1. A3.md (Contrato Principal)
**SHA-256:** `3f164fb6affcbc68f458a771f2a81a04430fa119f39195329763f72b10801c0a`

**Seções principais:**
- Objetivo e princípios epistemológicos
- Escopo permitido e proibido
- Tipos de relações (8 tipos definidos)
- Regras de identificação
- Prevenção de duplicação
- Processamento em lotes
- Rastreabilidade e auditoria

**Garantias:**
- Apenas entidades aprovadas são processadas
- Relações baseadas em evidência textual explícita
- Nenhuma inferência ou conhecimento externo
- Uma única proposta por relação única
- Contexto dos chunks usado obrigatoriamente

### 2. a3_execution_invariants_v1.md (Invariantes)
**SHA-256:** `b89a359531a1fb3c33e8ed29e7df08bad9c8d17fac4ecb033872ad6c5e30761b`

**Categorias de invariantes:**

#### I. Input Invariants
- I.1.1: Apenas entidades aprovadas
- I.2.1: Evidências aprovadas
- I.3.1: Chunks válidos

#### II. Processing Invariants
- II.1.1: **Unicidade de relações (anti-duplicação)**
- II.2.1: Evidência textual obrigatória
- II.3.1: Tipos de relação válidos
- II.4.1: Confidence score válido (0.0-1.0)

#### III. Output Invariants
- III.1.1: Status inicial 'pending'
- III.2.1: Agent version presente
- III.3.1/2: Integridade referencial (from/to entities)
- III.4.1: Evidence IDs válidos

#### IV. Context Invariants
- IV.1.1: Evidência vem do contexto de chunks
- IV.2.1: Consolidação de evidências múltiplas

#### V. Pipeline Invariants
- V.1.1: Pipeline status atualizado
- V.2.1: Notificações criadas

**Testes incluídos:**
- Queries SQL para verificação automática
- Checklist de auditoria
- Script de validação completo

---

## Tipos de Relações Suportadas

### 1. Relações Sindrômicas
- `has_symptom` - Síndrome apresenta sintoma
- `has_clinical_sign` - Síndrome apresenta sinal clínico

### 2. Relações Terapêuticas
- `treated_by_principle` - Síndrome/sintoma tratada por princípio
- `treated_by_acupoint` - Síndrome/sintoma/princípio tratado por acuponto

### 3. Relações Causais
- `causes` - Entidade causa outra
- `alleviates` - Entidade alivia outra

### 4. Relações de Combinação
- `contraindicated_with` - Entidade contraindicada com outra
- `combined_with` - Entidade combinada com outra

---

## Mecanismo Anti-Duplicação

### Verificação Obrigatória
Antes de cada inserção, verifica se já existe relação com:
- Mesmo `source_id`
- Mesmo `from_entity_id`
- Mesmo `to_entity_id`
- Mesmo `relation_type`

### Comportamento
```typescript
const { data: existing } = await supabaseClient
  .from("kb_entity_relations_proposals")
  .select("id")
  .eq("source_id", sourceId)
  .eq("from_entity_id", relation.from_entity_id)
  .eq("to_entity_id", relation.to_entity_id)
  .eq("relation_type", relation.relation_type)
  .maybeSingle();

if (existing) {
  console.log("Relation already exists, skipping");
  continue;
}
```

### Constraint no Banco (Recomendado)
Para garantir a nível de banco de dados, pode-se adicionar:
```sql
ALTER TABLE kb_entity_relations_proposals
ADD CONSTRAINT unique_relation_per_source
UNIQUE (source_id, from_entity_id, to_entity_id, relation_type);
```

---

## Uso de Contexto de Chunks

### Fluxo de Dados

```
Entidades Aprovadas
    ↓
Buscar evidence_ids
    ↓
Buscar chunk_ids das evidências
    ↓
Carregar chunks completos (raw_text)
    ↓
Fornecer ao LLM:
  - Entidades com seus tipos/labels
  - Chunks completos (contexto amplo)
  - Evidências (referência)
    ↓
LLM identifica relações no contexto
    ↓
Verificar duplicação
    ↓
Inserir relações únicas
```

### Prompt Template

```
ENTIDADES DISPONÍVEIS:
{entities_json}

CONTEXTO TEXTUAL COMPLETO (CHUNKS):
{chunks_json}

EVIDÊNCIAS EXTRAÍDAS (para referência):
{evidences_json}

Analise o CONTEXTO COMPLETO dos chunks e identifique relações...
```

### Vantagens
1. **Contexto rico**: Texto completo dos chunks
2. **Relações cross-evidence**: Entidades de diferentes evidências no mesmo chunk
3. **Menos fragmentação**: Visão mais holística do documento
4. **Melhor precisão**: LLM tem mais informação para decisões

---

## Processamento em Lotes

### Configuração
- **BATCH_SIZE:** 10 entidades por lote
- **MAX_EXECUTION_TIME:** 45 segundos
- **Timeout handling:** Para graciosamente

### Estrutura de Lote
Cada lote inclui:
- 10 entidades (máximo)
- Todos os chunks relevantes
- Todas as evidências relacionadas

### Logs
```
Processing 88 entities in 9 batches
Processing batch 1/9
Processing batch 2/9
...
Completed processing: 9/9 batches, 36 relations created
```

---

## Outputs e Rastreabilidade

### Estrutura da Proposta
```json
{
  "source_id": "uuid",
  "from_entity_id": "uuid",
  "to_entity_id": "uuid",
  "relation_type": "has_symptom",
  "textual_evidence": "Trecho literal do chunk",
  "evidence_ids": ["uuid1", "uuid2"],
  "confidence_score": 0.9,
  "extraction_rationale": "Explicação clara",
  "status": "pending",
  "agent_version": "a3-v1.0.0",
  "created_at": "timestamp"
}
```

### Campos Críticos
- `textual_evidence`: Trecho literal que suporta a relação
- `evidence_ids`: Array de IDs que referenciam as evidências
- `confidence_score`: 0.0 (baixa) a 1.0 (alta confiança)
- `extraction_rationale`: Justificativa descritiva (não interpretativa)

---

## Validação e Testes

### Script de Validação
```bash
node scripts/test-a3-invariants.js <source_id>
```

### Verificações Realizadas
1. ✅ Apenas entidades aprovadas usadas
2. ✅ Sem relações duplicadas
3. ✅ Evidências textuais presentes
4. ✅ Tipos de relação válidos
5. ✅ Scores de confiança válidos
6. ✅ Status inicial correto
7. ✅ Agent version presente
8. ✅ Integridade referencial mantida

### Saída Esperada
```
=== A3 Invariants Validation ===

--- I. Input Invariants ---
✅ I.1.1: Only approved entities used
✅ I.1.2: All to_entities are approved

--- II. Processing Invariants ---
✅ II.1.1: No duplicate relations
✅ II.2.1: All relations have textual evidence
✅ II.3.1: Only valid relation types
✅ II.4.1: Confidence score in valid range

--- III. Output Invariants ---
✅ III.1.1: New relations created as pending
✅ III.2.1: Agent version present

=== Summary ===
Passed: 8/8

✅ All A3 invariants are satisfied!
```

---

## Pipeline Integration

### Posição no Pipeline
```
P0 (chunks) → A0 (evidências) → A1 (entidades) → A3 (relações) → Revisão Humana
```

### Pré-requisitos
- ✅ P0 completado (chunks criados)
- ✅ A0 completado (evidências aprovadas)
- ✅ A1 completado (entidades aprovadas)

### Pós-processamento
1. Atualiza `kb_document_pipeline_status`:
   - `a2_status = 'completed'`
   - `total_relations = count`
2. Cria notificação se `relationsCreated > 0`
3. Relações aguardam revisão humana
4. Após aprovação: podem ser migradas para tabelas TCM

---

## Auditoria e Compliance

### Critérios de Auditoria
Um auditor deve poder verificar:
- ✅ Operação apenas sobre entidades aprovadas
- ✅ Evidência textual rastreável aos chunks
- ✅ Ausência de duplicação
- ✅ Ausência de inferência clínica
- ✅ Contexto dos chunks usado corretamente
- ✅ Humano como validador final

### Rastreabilidade Completa
```
Relação → Entidades → Evidências → Chunks → Documento Original
```

Cada relação pode ser auditada voltando até o documento fonte.

---

## Limitações Explícitas

O A3 **NÃO:**
- Realiza análise semântica profunda
- Resolve ambiguidades terminológicas
- Prioriza relações por relevância clínica
- Cria taxonomias ou ontologias
- Valida correção clínica das relações
- Aprova relações automaticamente

---

## Próximos Passos

### 1. Testar A3
```bash
npm run test-pipeline a3 <source_id>
```

### 2. Validar Invariantes
```bash
node scripts/test-a3-invariants.js <source_id>
```

### 3. Revisar Relações (Interface Web)
- Acessar página "Relações"
- Revisar evidências textuais
- Aprovar/Rejeitar relações propostas

### 4. Migrar para TCM (Futuro)
Após aprovação humana, relações podem ser migradas para:
- `tcm_syndrome_symptoms`
- `tcm_syndrome_clinical_signs`
- `tcm_syndrome_therapeutic_principles`
- `tcm_syndrome_acupoints`
- Outras tabelas relacionais TCM

---

## Referências

- **A3.md** - Contrato completo do agente
- **a3_execution_invariants_v1.md** - Invariantes de execução
- **test-a3-invariants.js** - Script de validação
- **process-a3/index.ts** - Implementação da edge function

---

## Changelog

### v1.0.0 (2026-02-25)
- ✅ Contrato A3 criado e congelado
- ✅ Invariantes de execução documentadas
- ✅ Uso de contexto de chunks implementado
- ✅ Mecanismo anti-duplicação implementado
- ✅ Script de validação criado
- ✅ Documentação completa
- ✅ Integração com pipeline estabelecida

---

**Status:** Produção
**Versão:** 1.0.0
**Data:** 2026-02-25
