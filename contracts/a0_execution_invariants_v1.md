# A0 Execution Invariants — Version 1

**Status:** Normativo
**Escopo:** Execuções do agente A0
**Dependências:** A0.md (contrato principal)

Este documento define invariantes operacionais imutáveis para qualquer execução válida do agente **A0** (Agente de Extração de Evidências Clínicas). Estes invariantes garantem rastreabilidade, auditabilidade e integridade epistemológica ao longo do tempo, independentemente de mudanças futuras de código ou infraestrutura.

---

## 1. Identidade da Execução

Toda execução válida do agente A0 **DEVE** registrar as seguintes informações de identidade:

### 1.1 Obrigatoriedade de profile_id

- Toda execução **DEVE** estar vinculada a exatamente um perfil de execução registrado (`profile_id`).
- O `profile_id` **DEVE** ser persistido no registro de auditoria correspondente.
- Execuções sem `profile_id` válido são **inválidas** e não auditáveis.
- O `profile_id` identifica de forma imutável o conjunto de ferramentas, versões e limites operacionais sob os quais o A0 foi executado.

### 1.2 Obrigatoriedade de agent_name

- O campo `agent_name` **DEVE** conter exatamente o valor `"A0"`.
- Este valor **NÃO PODE** ser omitido, alterado ou substituído.

### 1.3 Obrigatoriedade de agent_version

- Toda execução **DEVE** registrar a versão exata do agente A0 utilizada.
- O campo `agent_version` **NÃO PODE** ser vazio ou nulo.
- Mudanças de versão **DEVEM** refletir alterações substanciais no comportamento do agente.

---

## 2. Invariantes de Logging

### 2.1 Toda execução gera log

- Toda execução do A0 **DEVE** gerar exatamente um registro de auditoria.
- O registro **DEVE** ser criado antes ou durante a execução, nunca após falha silenciosa.
- A ausência de log invalida a execução, mesmo que output tenha sido produzido.

### 2.2 Logs sem output são permitidos

- É válido que uma execução do A0 não produza nenhum excerpt.
- O log **DEVE** registrar `output_excerpts_count = 0` neste caso.
- Execuções com zero excerpts **NÃO** são consideradas falhas, desde que o log esteja presente.

### 2.3 Output sem log é proibido

- Se existirem registros em `kb_evidence_excerpts` para uma execução, **DEVE** existir o log correspondente.
- Registros órfãos (sem log de auditoria) indicam violação de governança.
- Tais registros **NÃO** podem ser considerados válidos para fins de auditoria epistemológica.

---

## 3. Invariantes de Idempotência

### 3.1 Um mesmo chunk pode gerar múltiplos excerpts

- Um único registro em `kb_raw_chunks` **PODE** gerar 0, 1 ou N registros em `kb_evidence_excerpts`.
- Esta multiplicidade **NÃO** constitui duplicação indevida.
- É responsabilidade de processos posteriores consolidar ou filtrar excerpts redundantes.

### 3.2 Reexecuções devem ser distinguíveis por profile_id

- A reexecução do A0 sobre um chunk já processado (`processed = true`) só é válida se:
  - Um novo `profile_id` for utilizado, **ou**
  - Houver registro explícito de reexecução nos logs de auditoria.
- Reexecuções com o mesmo `profile_id` sem justificativa são consideradas anômalas.

### 3.3 Nenhuma execução sobrescreve outputs anteriores

- O A0 **NUNCA** atualiza ou deleta registros existentes em `kb_evidence_excerpts`.
- O A0 **NUNCA** altera o campo `status` de excerpts após a criação.
- Toda modificação de excerpts é responsabilidade exclusiva de revisores humanos ou agentes superiores.

---

## 4. Invariantes de Texto

### 4.1 excerpt_text é sempre substring literal

- O campo `excerpt_text` em `kb_evidence_excerpts` **DEVE** ser um substring literal exato de `kb_raw_chunks.raw_text`.
- **NENHUMA** das seguintes operações é permitida:
  - Alteração de palavras
  - Resumo ou paráfrase
  - Completação de texto
  - Inferência de conteúdo ausente
  - Normalização ortográfica ou gramatical
  - Tradução ou transliteração

### 4.2 Qualquer violação invalida a execução

- Se `excerpt_text` contiver texto que não existe literalmente no chunk original, a execução é **inválida**.
- Esta violação **compromete a integridade epistemológica** de toda a base de conhecimento.
- Ferramentas de auditoria **DEVEM** ser capazes de verificar esta invariante automaticamente.

---

## 5. Invariantes de Segurança Epistemológica

### 5.1 A0 nunca cria conhecimento

- O A0 **NÃO** realiza:
  - Validação científica
  - Validação clínica
  - Validação terapêutica
  - Interpretação semântica
  - Curadoria de conteúdo
- O A0 apenas identifica e registra trechos literais potencialmente relevantes.

### 5.2 A0 nunca escreve em tabelas finais

- O A0 **NUNCA** insere registros em:
  - `kb_entity_proposals`
  - `tcm_*` (qualquer tabela final de conhecimento clínico estruturado)
- Qualquer registro nestas tabelas atribuído ao A0 é uma **violação grave de contrato**.

### 5.3 A0 nunca altera status após criação

- O A0 **SEMPRE** cria excerpts com `status = "pending"`.
- O A0 **NUNCA** altera `status` para `"approved"` ou `"rejected"`.
- Mudanças de status são responsabilidade exclusiva de revisores humanos qualificados.

---

## 6. Critério de Auditoria

Um auditor técnico ou epistemológico **DEVE** conseguir responder, consultando apenas:

- `A0.md` (contrato principal)
- `a0_execution_invariants_v1.md` (este documento)
- Registros de auditoria (`kb_ingestion_logs` ou equivalente)
- Perfis de execução documentados

à seguinte pergunta:

> **"Sob qual profile, versão e regras este A0 rodou?"**

**Sem:**
- Olhar código-fonte
- Inferir comportamento
- Consultar desenvolvedores
- Acessar sistemas externos

---

## 7. Violações

Qualquer execução do A0 que:

- Não registre `profile_id`, ou
- Registre um `profile_id` inexistente ou não documentado, ou
- Não gere log de auditoria, ou
- Produza `excerpt_text` que não seja substring literal, ou
- Escreva em `kb_entity_proposals` ou tabelas `tcm_*`, ou
- Altere `status` de excerpts após criação, ou
- Altere `profile_id` retroativamente

**Compromete a rastreabilidade epistemológica do sistema** e **DEVE** ser considerada inválida para fins de auditoria científica e clínica.

---

## 8. Relação com Versionamento

- Mudanças na ferramenta de IA (modelo, prompt, temperatura, etc.) **EXIGEM** novo perfil de execução.
- Mudanças na versão do agente (`agent_version`) **EXIGEM** novo perfil de execução.
- Um novo perfil **NÃO** invalida execuções anteriores, desde que estas apontem para o perfil correto vigente à época.

---

## 9. Nota Final

Este documento é complementar ao contrato A0.md e **não modifica o escopo epistemológico do agente**.

Ele define regras de governança mínimas para preservar validade auditável ao longo do tempo, garantindo que execuções do A0 permaneçam rastreáveis e verificáveis independentemente de mudanças futuras na implementação ou infraestrutura.
