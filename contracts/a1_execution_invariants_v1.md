# A1 Execution Invariants — Version 1

**Status:** Normativo
**Escopo:** Execuções do agente A1
**Dependências:** A1.md (contrato principal), A0.md, a0_execution_invariants_v1.md

Este documento define invariantes operacionais imutáveis para qualquer execução válida do agente **A1** (Agente de Agrupamento Conservador de Evidências). Estes invariantes garantem rastreabilidade, auditabilidade, integridade epistemológica e conformidade com o princípio de conservadorismo epistêmico, independentemente de mudanças futuras de código ou infraestrutura.

---

## 1. Identidade da Execução

Toda execução válida do agente A1 **DEVE** registrar as seguintes informações de identidade:

### 1.1 Obrigatoriedade de profile_id

- Toda execução **DEVE** estar vinculada a exatamente um perfil de execução registrado (`profile_id`).
- O `profile_id` **DEVE** ser persistido no registro de auditoria correspondente.
- Execuções sem `profile_id` válido são **inválidas** e não auditáveis.
- O `profile_id` identifica de forma imutável o conjunto de ferramentas, versões e limites operacionais sob os quais o A1 foi executado.

### 1.2 Obrigatoriedade de agent_name

- O campo `agent_name` **DEVE** conter exatamente o valor `"A1"`.
- Este valor **NÃO PODE** ser omitido, alterado ou substituído.

### 1.3 Obrigatoriedade de agent_model

- O campo `agent_model` **DEVE** conter exatamente o valor `"A1-α"`.
- Este valor identifica o modelo de operação conservador do agente.
- Este valor **NÃO PODE** ser omitido, alterado ou substituído.

### 1.4 Obrigatoriedade de referência ao contrato

- Todo registro de log gerado pelo A1 **DEVE** referenciar explicitamente o hash SHA-256 do contrato A1 vigente no momento da execução.
- Esta referência **NÃO PODE** ser omitida.
- A referência **DEVE** permitir auditoria retrospectiva inequívoca da versão do contrato aplicada.

### 1.5 Obrigatoriedade de agent_version

- Toda execução **DEVE** registrar a versão exata do agente A1 utilizada.
- O campo `agent_version` **NÃO PODE** ser vazio ou nulo.
- Mudanças de versão **DEVEM** refletir alterações substanciais no comportamento do agente.

---

## 2. Invariantes de Logging

### 2.1 Toda execução gera log

- Toda execução válida do A1 **DEVE** gerar ao menos um registro primário de auditoria inequívoco.
- O registro **DEVE** ser criado antes ou durante a execução, nunca após falha silenciosa.
- A ausência de log invalida a execução, mesmo que output tenha sido produzido.

### 2.2 Logs sem output são permitidos

- É válido que uma execução do A1 não produza nenhum agrupamento, rótulo ou sinalização.
- O log **DEVE** registrar contadores zerados para os outputs intermediários do A1 neste caso.
- Execuções com zero outputs **NÃO** são consideradas falhas, desde que o log esteja presente.

### 2.3 Output sem log é proibido

- Se existirem artefatos de saída intermediários atribuídos a uma execução do A1, **DEVE** existir o log correspondente.
- Registros órfãos (sem log de auditoria) indicam violação de governança.
- Tais registros **NÃO** podem ser considerados válidos para fins de auditoria epistemológica.

---

## 3. Invariantes de Input

### 3.1 Restrição de input a evidências explicitamente aprovadas

**Regra semântica normativa (obrigatória):**

- O A1 **DEVE** processar exclusivamente evidências que tenham sido explicitamente aprovadas por revisão humana completa.
- A aprovação humana **DEVE** ser verificada através de metadados que atestem:
  - Status de aprovação explícito
  - Identidade do revisor responsável
  - Timestamp da revisão
- A verificação **DEVE** ocorrer na camada de acesso aos dados.
- **NÃO** é permitido recuperar evidências não aprovadas e aplicar filtragem posterior em código de aplicação.
- Implementações que realizem filtragem fora da camada de acesso aos dados constituem **violação explícita de contrato**.

**Exemplo ilustrativo (não normativo):**

Em uma implementação baseada em SQL com a estrutura descrita no contrato A1.md, a restrição semântica acima poderia ser implementada através de uma cláusula WHERE como:

```sql
WHERE status = 'approved'
  AND reviewed_by IS NOT NULL
  AND reviewed_at IS NOT NULL
```

Este exemplo ilustra uma possível implementação. Os nomes de colunas e a sintaxe SQL específica não são obrigatórios. O que é obrigatório é a semântica: apenas evidências explicitamente aprovadas por revisão humana completa podem ser processadas.

### 3.2 Proibição de processamento de dados não aprovados

- O A1 **NUNCA** pode processar registros com `status = "pending"`.
- O A1 **NUNCA** pode processar registros com `status = "rejected"`.
- O A1 **NUNCA** pode processar registros com `reviewed_by IS NULL`.
- O A1 **NUNCA** pode processar registros com `reviewed_at IS NULL`.

### 3.3 Proibição de acesso direto a chunks

- O A1 **NUNCA** pode ler diretamente de `kb_raw_chunks`.
- O A1 **NUNCA** pode reprocessar chunks para reinterpretação.
- O acesso a dados brutos constitui violação de separação de responsabilidades.

### 3.4 Proibição de inferência de dados ausentes

- O A1 **NUNCA** pode inferir ou completar campos ausentes em evidências.
- O A1 **NUNCA** pode assumir valores default não explicitamente presentes nos dados.

---

## 4. Invariantes de Output

### 4.1 Natureza provisória obrigatória

- Todo output do A1 **DEVE** ser marcado como provisório e intermediário.
- Nenhum output do A1 constitui conhecimento clínico final.
- Todo output do A1 **DEVE** ser claramente identificável como derivado do A1-α.

### 4.2 Rastreabilidade obrigatória

- Todo agrupamento **DEVE** referenciar explicitamente identificadores inequívocos das evidências fonte aprovadas por A0.
- Todo rótulo provisório **DEVE** referenciar identificadores inequívocos das evidências das quais foi derivado.
- Toda sinalização **DEVE** referenciar identificadores inequívocos das evidências envolvidas.
- Todos os identificadores referenciados **DEVEM** corresponder a evidências que foram processadas conforme invariante 3.1.

### 4.3 Proibição de escrita em tabelas finais

- O A1 **NUNCA** insere registros em:
  - Tabelas com prefixo `tcm_*` (conhecimento clínico final)
  - Tabelas de entidades clínicas finalizadas
  - Tabelas de relações causais, terapêuticas ou diagnósticas
  - Qualquer tabela que represente conhecimento clínico validado
- Qualquer registro nestas tabelas atribuído ao A1 é uma **violação grave de contrato**.

---

## 5. Invariantes de Texto e Processamento

### 5.1 Rótulos devem ser literais ou concatenações literais

- Todo rótulo provisório (`provisional_label`, `label_text`) **DEVE** ser:
  - Extraído literalmente do texto das evidências aprovadas, **OU**
  - Composto exclusivamente por concatenação literal de termos presentes nas evidências
- **NENHUMA** das seguintes operações é permitida:
  - Paráfrase
  - Generalização conceitual
  - Abstração ou síntese semântica
  - Tradução entre idiomas
  - Normalização ontológica
  - Enriquecimento com conhecimento externo

### 5.2 Proibição de inferência semântica

- O A1 **NUNCA** pode deduzir equivalências conceituais não explicitamente textuais.
- O A1 **NUNCA** pode inferir que termos diferentes se referem ao mesmo conceito.
- O A1 **NUNCA** pode aplicar raciocínio clínico para interpretar similaridade.
- Similaridade textual computacional **NÃO** autoriza inferência de similaridade semântica, conceitual ou clínica.

### 5.3 Proibição de técnicas estatísticas vetoriais

- O A1 **NUNCA** pode utilizar:
  - Vetorização estatística
  - Embeddings (word embeddings, sentence embeddings, document embeddings)
  - TF-IDF (Term Frequency-Inverse Document Frequency)
  - BM25 (Best Matching 25)
  - Cosine similarity baseada em vetores estatísticos
  - Qualquer técnica equivalente de representação vetorial aprendida ou estatística
- Esta proibição aplica-se mesmo se a técnica for utilizada apenas como etapa intermediária.
- Esta proibição aplica-se independentemente de a técnica não ser exposta no output final.

### 5.4 Tokenização mecânica obrigatória

- Tokenização **DEVE** ser exclusivamente baseada em delimitadores explícitos (whitespace, pontuação).
- **NÃO** é permitido:
  - Tokenização estatística
  - Tokenização subword (BPE, WordPiece, SentencePiece)
  - Tokenização probabilística
  - Tokenização derivada de modelos treinados

---

## 6. Invariantes de Não-Modificação

### 6.1 Imutabilidade de evidências aprovadas

- O A1 **NUNCA** altera registros em `kb_evidence_excerpts`.
- O A1 **NUNCA** remove evidências aprovadas.
- O A1 **NUNCA** modifica campos:
  - `status`
  - `reviewed_by`
  - `reviewed_at`
  - `excerpt_text`
  - Qualquer outro campo de evidências

### 6.2 Proibição de substituição de julgamento humano

- O A1 **NUNCA** aprova evidências.
- O A1 **NUNCA** rejeita evidências.
- O A1 **NUNCA** valida cientificamente qualquer conteúdo.
- O A1 **NUNCA** resolve conflitos entre evidências de forma resolutiva.

---

## 7. Invariantes de Confidence Level

### 7.1 Natureza opcional e não normativa

- O atributo `confidence_level` é **opcional** e não constitui requisito de validade da execução.
- Outputs sem `confidence_level` são válidos e auditáveis.
- Quando presente, `confidence_level` representa exclusivamente consistência mecânica/computacional do agrupamento textual.
- O atributo `confidence_level` **NÃO** representa:
  - Validade clínica
  - Relevância científica
  - Força conceitual
  - Correção epistemológica
  - Aprovação semântica

### 7.2 Determinismo quando presente

- Quando `confidence_level` estiver presente, seu cálculo **DEVE** ser:
  - Determinístico (mesmas entradas → mesmo resultado)
  - Monotônico em relação à sobreposição textual literal
  - Reproduzível dado o mesmo input textual bruto
  - Independente de pesos aprendidos
  - Independente de ajustes dinâmicos
  - Independente de heurísticas adaptativas
  - Independente de qualquer forma de aprendizado de máquina

### 7.3 Proibição de uso downstream

- O atributo `confidence_level` **NÃO PODE** ser utilizado para:
  - Ordenação de relevância clínica
  - Priorização de revisão humana baseada em importância clínica
  - Tomada de decisão automática
  - Qualquer forma de inferência downstream sobre qualidade clínica

---

## 8. Invariantes de Idempotência

### 8.1 Consistência de agrupamentos

- Múltiplas execuções do A1 sobre o mesmo conjunto de evidências aprovadas **DEVEM** produzir resultados consistentes.
- Agrupamentos **NÃO PODEM** variar aleatoriamente entre execuções.
- Diferenças entre execuções **DEVEM** ser explicáveis por mudanças em:
  - Perfil de execução (`profile_id`)
  - Versão do agente (`agent_version`)
  - Conjunto de evidências aprovadas processadas

### 8.2 Reexecuções devem ser distinguíveis por profile_id

- A reexecução do A1 sobre evidências já processadas só é válida se:
  - Um novo `profile_id` for utilizado, **ou**
  - Houver registro explícito de reexecução nos logs de auditoria
- Reexecuções com o mesmo `profile_id` sem justificativa são consideradas anômalas.

---

## 9. Invariantes de Conservadorismo Epistêmico

### 9.1 Falsos negativos são aceitáveis

- É preferível omitir um agrupamento do que criar um agrupamento incorreto.
- O A1 **DEVE** abster-se de produzir output na ausência de evidência textual explícita.
- Omissão **NÃO** constitui falha de execução.

### 9.2 Incerteza deve ser explicitada

- Agrupamentos com confiança abaixo do threshold **DEVEM** ser sinalizados como "baixa confiança, requer revisão".
- Rótulos derivados de evidência única **DEVEM** ser marcados como "fonte única".
- Conflitos identificados com baixa certeza **DEVEM** incluir nota "possível conflito, requer revisão humana".

### 9.3 Regra de abstenção

- Em caso de dúvida sobre similaridade textual, adequação de rótulo ou natureza de conflito:
- O A1 **DEVE** abster-se de produzir saída, **ou**
- O A1 **DEVE** produzir saída marcada como "incerta, requer revisão humana"

---

## 10. Critério de Auditoria

Um auditor técnico ou epistemológico **DEVE** conseguir responder, consultando apenas:

- `A1.md` (contrato principal)
- `a1_execution_invariants_v1.md` (este documento)
- Registros de auditoria (`mcp_a1_audit_logs` ou equivalente)
- Perfis de execução documentados

às seguintes perguntas:

> **"Sob qual profile, versão e regras este A1 rodou?"**

> **"Quais evidências aprovadas foram processadas?"**

> **"Todos os agrupamentos e rótulos são rastreáveis a evidências aprovadas?"**

> **"Alguma técnica estatística vetorial foi utilizada?"**

**Sem:**
- Olhar código-fonte
- Inferir comportamento
- Consultar desenvolvedores
- Acessar sistemas externos

---

## 11. Violações

Qualquer execução do A1 que:

- Não registre `profile_id`, `agent_name`, `agent_model`, ou referência ao hash do contrato, ou
- Registre um `profile_id` inexistente ou não documentado, ou
- Não gere log de auditoria, ou
- Processe evidências que não foram explicitamente aprovadas por revisão humana completa, ou
- Processe evidências sem verificar metadados de aprovação, identidade do revisor e timestamp de revisão, ou
- Aplique filtragem de aprovação fora da camada de acesso aos dados, ou
- Acesse diretamente `kb_raw_chunks`, ou
- Escreva em tabelas `tcm_*` ou entidades clínicas finais, ou
- Altere `status`, `reviewed_by`, `reviewed_at` de evidências, ou
- Produza rótulos não literais ou não derivados de concatenação literal, ou
- Infira equivalências semânticas ou conceituais, ou
- Utilize vetorização estatística, embeddings, TF-IDF, BM25, cosine similarity, ou
- Utilize tokenização estatística, subword ou probabilística, ou
- Utilize `confidence_level` para ordenação clínica ou decisão automática, ou
- Altere `profile_id` retroativamente

**Compromete a rastreabilidade epistemológica e a integridade conservadora do sistema** e **DEVE** ser considerada inválida para fins de auditoria científica e clínica.

---

## 12. Relação com Versionamento

- Mudanças na ferramenta de IA (modelo, prompt, temperatura, etc.) **EXIGEM** novo perfil de execução.
- Mudanças na versão do agente (`agent_version`) **EXIGEM** novo perfil de execução.
- Mudanças em técnicas de agrupamento ou cálculo de similaridade **EXIGEM** novo perfil de execução.
- Um novo perfil **NÃO** invalida execuções anteriores, desde que estas apontem para o perfil correto vigente à época.

---

## 13. Escopo Não Incluído (Explicit Non-Goals)

Este documento **NÃO** define:

- Algoritmos específicos de agrupamento textual (responsabilidade do perfil de execução)
- Thresholds numéricos de confiança (responsabilidade do perfil de execução)
- Formatos específicos de rótulos provisórios
- Estratégias de detecção de conflitos (desde que baseadas em padrões textuais)
- Otimizações de performance (desde que preservem invariantes)
- Interfaces de usuário ou APIs
- Agentes superiores (A2, A3, etc.)
- Processos de revisão humana subsequentes

Este documento define **exclusivamente** as invariantes operacionais que garantem conformidade com o contrato A1.md e preservam rastreabilidade, auditabilidade e integridade epistemológica.

---

## 14. Nota Final

Este documento é complementar ao contrato A1.md e **não modifica o escopo epistemológico do agente**.

Ele define regras de governança mínimas para preservar validade auditável ao longo do tempo, garantindo que execuções do A1 permaneçam rastreáveis, verificáveis e estritamente conservadoras, independentemente de mudanças futuras na implementação ou infraestrutura.

Qualquer execução que viole estas invariantes compromete a garantia de que o A1 opera como um agente conservador que organiza evidências sem criar conhecimento clínico, inferir relações semânticas ou substituir julgamento humano.

Este documento de invariantes é congelável. Qualquer alteração neste arquivo invalida execuções futuras que referenciem a versão anterior. Toda execução do A1 deve referenciar explicitamente o hash SHA-256 deste arquivo para garantir conformidade inequívoca com as invariantes aplicadas.
