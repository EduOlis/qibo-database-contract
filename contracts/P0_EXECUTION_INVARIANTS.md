# P0 Execution Invariants — Logging and Profile Binding

**Status:** Normativo
**Escopo:** Execuções do processo P0
**Dependências:** P0.md (congelado), p0_execution_profiles_v1.md (congelado)

Este documento define invariantes obrigatórios para qualquer execução do processo **P0**. Ele não altera o contrato P0 nem seus perfis; apenas **endurece a governança de execução e rastreabilidade**.

---

## 1. Obrigatoriedade de Profile

Toda execução do processo P0 **DEVE** estar vinculada a exatamente um perfil de execução registrado.

- O identificador do perfil **DEVE** ser persistido no campo `profile_id` da tabela `kb_ingestion_logs`.
- Execuções sem `profile_id` válido são **inválidas** e não devem ser consideradas auditáveis.

---

## 2. Validade do Profile

O valor de `profile_id`:

- **DEVE** corresponder exatamente a um identificador definido em um arquivo `p0_execution_profiles_vX.md` congelado.
- **NÃO PODE** ser um valor arbitrário, experimental ou não documentado.
- **NÃO PODE** ser alterado retroativamente após a execução.

---

## 3. Imutabilidade Pós-Execução

Após o registro em `kb_ingestion_logs`:

- O campo `profile_id` é **imutável**.
- Qualquer tentativa de alteração deve ser considerada violação de governança.

---

## 4. Relação com Versionamento

- Mudanças de ferramenta, versão ou configuração **EXIGEM** novo perfil de execução.
- Um novo perfil **NÃO** invalida execuções anteriores, desde que estas apontem para o perfil correto vigente à época.

---

## 5. Critério de Auditoria

Um auditor técnico deve conseguir responder, apenas consultando:

- `P0.md`
- `p0_execution_profiles_vX.md`
- `kb_ingestion_logs`

à seguinte pergunta:

> "Com qual contrato, perfil e limites esta execução P0 ocorreu?"

Sem olhar código.
Sem inferir comportamento.

---

## 6. Violação

Qualquer execução P0 que:

- não registre `profile_id`, ou
- registre um `profile_id` inexistente, ou
- altere `profile_id` após o registro

**compromete a rastreabilidade epistemológica do sistema**.

---

## 7. Nota Final

Este documento é complementar e **não modifica** contratos congelados.
Ele define regras de governança mínimas para preservar validade auditável ao longo do tempo.
