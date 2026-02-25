# A3 - Diagrama de Fluxo de Execução

## Visão Geral do Processamento

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENTE A3 - ENTRADA                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Input: source_id                                               │
│                                                                 │
│  1. Buscar entidades aprovadas (status='approved')              │
│     └─> kb_extracted_entities                                   │
│                                                                 │
│  2. Buscar evidências das entidades                             │
│     └─> kb_evidence_excerpts                                    │
│                                                                 │
│  3. Buscar chunks originais (NOVO!)                             │
│     └─> kb_raw_chunks (texto completo)                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                  PREPARAÇÃO DE LOTES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  • Dividir entidades em lotes (BATCH_SIZE = 10)                │
│  • Para cada lote, coletar:                                     │
│    - Entidades do lote                                          │
│    - Chunks completos associados                                │
│    - Evidências (referência)                                    │
│                                                                 │
│  Total: N lotes = ceil(total_entidades / 10)                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              PROCESSAMENTO DE CADA LOTE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Montar prompt para LLM com:                                 │
│     ┌─────────────────────────────────────────┐                │
│     │ ENTIDADES DISPONÍVEIS                   │                │
│     │ [{ id, type, label, data }...]          │                │
│     └─────────────────────────────────────────┘                │
│                     ↓                                           │
│     ┌─────────────────────────────────────────┐                │
│     │ CONTEXTO TEXTUAL COMPLETO (CHUNKS)      │                │
│     │ [{ id, text, sequence, page }...]       │                │
│     │ ← CONTEXTO AMPLO PARA ANÁLISE           │                │
│     └─────────────────────────────────────────┘                │
│                     ↓                                           │
│     ┌─────────────────────────────────────────┐                │
│     │ EVIDÊNCIAS (REFERÊNCIA)                 │                │
│     │ [{ id, chunk_id, text, type }...]       │                │
│     └─────────────────────────────────────────┘                │
│                                                                 │
│  2. Chamar LLM (Gemini ou OpenAI)                               │
│     └─> Identificar relações explícitas                         │
│                                                                 │
│  3. Parsear resposta JSON                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│           VALIDAÇÃO E INSERÇÃO DE RELAÇÕES                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Para cada relação identificada:                                │
│                                                                 │
│  1. VERIFICAR DUPLICAÇÃO (crítico!)                             │
│     ┌────────────────────────────────────┐                     │
│     │ SELECT * FROM proposals WHERE:     │                     │
│     │   source_id = X                    │                     │
│     │   AND from_entity_id = Y           │                     │
│     │   AND to_entity_id = Z             │                     │
│     │   AND relation_type = T            │                     │
│     └────────────────────────────────────┘                     │
│              ↓                    ↓                             │
│         Existe?               Não existe?                       │
│              ↓                    ↓                             │
│     ┌─────────────┐      ┌───────────────┐                     │
│     │  SKIP       │      │  INSERIR      │                     │
│     │  Log: dup   │      │  Nova relação │                     │
│     └─────────────┘      └───────────────┘                     │
│                                                                 │
│  2. Inserir se não duplicada:                                   │
│     - source_id, from_entity_id, to_entity_id                   │
│     - relation_type, textual_evidence                           │
│     - evidence_ids[], confidence_score                          │
│     - extraction_rationale, status='pending'                    │
│     - agent_version='a3-v1.0.0'                                 │
│                                                                 │
│  3. Contar relações criadas                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                  FINALIZAÇÃO E LOGS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Atualizar kb_document_pipeline_status:                      │
│     - a2_status = 'completed'                                   │
│     - a2_completed_at = now()                                   │
│     - total_relations = count                                   │
│                                                                 │
│  2. Se relações criadas > 0:                                    │
│     Criar notificação:                                          │
│     - type: 'validation_required'                               │
│     - title: "Relações entre entidades identificadas"           │
│     - message: "N relações aguardam revisão"                    │
│                                                                 │
│  3. Retornar JSON:                                              │
│     {                                                           │
│       success: true,                                            │
│       sourceId,                                                 │
│       relationsCreated: N,                                      │
│       entitiesAnalyzed: M,                                      │
│       executionTimeMs: T                                        │
│     }                                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Comparação: Antes vs Depois

### ANTES (Problema Identificado)

```
┌─────────────────────────┐
│ Entidades Aprovadas     │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│ Evidências (excerpts)   │  ← Contexto LIMITADO
│ "fadiga crônica"        │     Pequenos trechos
│ "língua pálida"         │
└──────────┬──────────────┘
           ↓
     ┌─────────┐
     │   LLM   │  ← Pouca informação
     └─────────┘     Difícil identificar relações
           ↓
  [Poucas relações]
```

### DEPOIS (Solução Implementada)

```
┌─────────────────────────┐
│ Entidades Aprovadas     │
└──────────┬──────────────┘
           ↓
┌─────────────────────────────────────────────────┐
│ CHUNKS COMPLETOS (contexto amplo)              │
│                                                 │
│ "Deficiência de Qi do Baço é uma síndrome      │
│  caracterizada por fadiga crônica, falta de     │
│  apetite e distensão abdominal após            │
│  alimentação. Os sinais clínicos incluem        │
│  língua pálida e pulso fraco. O tratamento     │
│  envolve tonificar o Qi do Baço usando         │
│  acupontos como E36 (Zusanli) e BP6           │
│  (Sanyinjiao)..."                               │
│                                                 │
└───────────────────┬─────────────────────────────┘
                    ↓
           ┌─────────────────┐
           │      LLM        │  ← Contexto RICO
           │  (Análise rica) │     Identificação precisa
           └─────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│ RELAÇÕES IDENTIFICADAS:                        │
│                                                │
│ • Deficiência Qi Baço → has_symptom → Fadiga  │
│ • Deficiência Qi Baço → has_clinical_sign →   │
│   Língua Pálida                                │
│ • Deficiência Qi Baço → treated_by_acupoint → │
│   E36 (Zusanli)                                │
│ • Fadiga → treated_by_acupoint → E36           │
│                                                │
└────────────────────────────────────────────────┘
```

---

## Tipos de Relações e Exemplos

```
┌────────────────────────────────────────────────────────────┐
│                  RELAÇÕES SINDRÔMICAS                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  [Síndrome] ──has_symptom──> [Sintoma]                    │
│                                                            │
│  Exemplo:                                                  │
│  "Deficiência de Qi do Baço" ──> "Fadiga crônica"         │
│                                                            │
│  ───────────────────────────────────────────────────       │
│                                                            │
│  [Síndrome] ──has_clinical_sign──> [Sinal Clínico]        │
│                                                            │
│  Exemplo:                                                  │
│  "Deficiência de Qi do Baço" ──> "Língua pálida"          │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                 RELAÇÕES TERAPÊUTICAS                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  [Síndrome/Sintoma] ──treated_by_principle──> [Princípio] │
│                                                            │
│  Exemplo:                                                  │
│  "Deficiência de Qi do Baço" ──> "Tonificar Qi do Baço"   │
│                                                            │
│  ───────────────────────────────────────────────────────   │
│                                                            │
│  [Síndrome/Sintoma] ──treated_by_acupoint──> [Acuponto]   │
│                                                            │
│  Exemplo:                                                  │
│  "Deficiência de Qi do Baço" ──> "E36 (Zusanli)"          │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                   RELAÇÕES CAUSAIS                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  [Entidade A] ──causes──> [Entidade B]                     │
│                                                            │
│  Exemplo:                                                  │
│  "Dieta irregular" ──> "Deficiência de Qi do Baço"        │
│                                                            │
│  ───────────────────────────────────────────────────────   │
│                                                            │
│  [Entidade A] ──alleviates──> [Entidade B]                 │
│                                                            │
│  Exemplo:                                                  │
│  "E36 (Zusanli)" ──> "Fadiga"                              │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                 RELAÇÕES DE COMBINAÇÃO                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  [Entidade A] ──combined_with──> [Entidade B]              │
│                                                            │
│  Exemplo:                                                  │
│  "E36 (Zusanli)" ──> "BP6 (Sanyinjiao)"                    │
│                                                            │
│  ───────────────────────────────────────────────────────   │
│                                                            │
│  [Entidade A] ──contraindicated_with──> [Entidade B]       │
│                                                            │
│  Exemplo:                                                  │
│  "Moxa" ──> "Febre alta"                                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Anti-Duplicação: Como Funciona

```
Lote 1 de processamento:
┌─────────────────────────────────────┐
│ Entidade A ──has_symptom──> B       │
│ Verificar: Já existe? → NÃO         │
│ Ação: ✅ INSERIR                     │
└─────────────────────────────────────┘

Lote 2 de processamento:
┌─────────────────────────────────────┐
│ Entidade A ──has_symptom──> B       │
│ Verificar: Já existe? → SIM         │
│ Ação: ⏩ SKIP (log: "already exists")│
└─────────────────────────────────────┘

Resultado final:
┌─────────────────────────────────────┐
│ ✅ Apenas 1 relação no banco         │
│ ✅ Invariante II.1.1 satisfeita      │
│ ✅ Constraint UNIQUE garante         │
└─────────────────────────────────────┘
```

---

## Fluxo de Revisão Humana (Após A3)

```
┌──────────────────────────────────────────────┐
│      A3 completa processamento               │
│      36 relações criadas                     │
└────────────┬─────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────┐
│  Notificação criada                          │
│  "36 relações aguardam revisão"              │
└────────────┬─────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────┐
│  Revisor humano acessa interface web         │
│  Página: "Relações"                          │
└────────────┬─────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────┐
│  Para cada relação (status=pending):         │
│                                              │
│  1. Ver entidade origem                      │
│  2. Ver entidade destino                     │
│  3. Ver tipo de relação                      │
│  4. Ler evidência textual                    │
│  5. Ver score de confiança                   │
│  6. Ler justificativa                        │
│                                              │
│  Decisão: [Aprovar] ou [Rejeitar]            │
└────────────┬─────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────┐
│  Status atualizado:                          │
│  • approved → pode ser migrada para TCM      │
│  • rejected → descartada                     │
└──────────────────────────────────────────────┘
```

---

## Rastreabilidade Completa

```
┌─────────────────────────────────────────────────────────┐
│                  CAMINHO DE AUDITORIA                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Relação Proposta (kb_entity_relations_proposals)      │
│         ↓                                               │
│  from_entity_id → Entidade Origem                       │
│         ↓                                               │
│  evidence_id → Evidência Textual                        │
│         ↓                                               │
│  chunk_id → Chunk Original (contexto completo)          │
│         ↓                                               │
│  source_id → Documento Original (PDF/Web/etc)           │
│                                                         │
│  ✅ Rastreabilidade fim-a-fim garantida                 │
│  ✅ Auditável do resultado até a fonte primária         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Métricas e Monitoramento

```
┌───────────────────────────────────────────────┐
│  Métricas registradas:                        │
├───────────────────────────────────────────────┤
│                                               │
│  • Total de entidades analisadas              │
│  • Total de relações criadas                  │
│  • Total de relações skipped (duplicadas)     │
│  • Lotes processados / total de lotes         │
│  • Tempo de execução (ms)                     │
│  • Timeout? (sim/não)                         │
│                                               │
│  Logs de exemplo:                             │
│  ───────────────────────────────────────      │
│  Processing 88 entities in 9 batches          │
│  Processing batch 1/9                         │
│  Relation already exists, skipping: uuid1...  │
│  Processing batch 2/9                         │
│  ...                                          │
│  Completed: 9/9 batches, 36 relations created │
│                                               │
└───────────────────────────────────────────────┘
```

---

## Garantias Epistemológicas

```
┌──────────────────────────────────────────────────────────┐
│              GARANTIAS DO AGENTE A3                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ✅ Apenas entidades aprovadas                           │
│     └─> Status verificado antes do processamento        │
│                                                          │
│  ✅ Contexto completo dos chunks                         │
│     └─> Texto integral, não apenas excerpts             │
│                                                          │
│  ✅ Evidência textual obrigatória                        │
│     └─> Trecho literal do texto                         │
│                                                          │
│  ✅ Sem duplicação                                       │
│     └─> Verificação + constraint no banco               │
│                                                          │
│  ✅ Sem inferência clínica                               │
│     └─> Apenas relações explícitas no texto             │
│                                                          │
│  ✅ Sem conhecimento externo                             │
│     └─> Baseado exclusivamente no corpus                │
│                                                          │
│  ✅ Revisão humana obrigatória                           │
│     └─> Status 'pending' para todas as propostas        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

**Última atualização:** 2026-02-25
**Versão do contrato:** A3 v1.0.0
**SHA-256:** 3f164fb6affcbc68f458a771f2a81a04430fa119f39195329763f72b10801c0a
