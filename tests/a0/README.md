# A0 Contract Violation Tests

Este diretório contém testes SQL que **tentam violar** o Contrato Formal do Agente A0.

## Propósito

Cada arquivo SQL representa uma **tentativa deliberada de quebrar** uma regra específica do contrato A0. Estes testes servem para:

1. **Documentar violações possíveis** que devem ser prevenidas
2. **Validar constraints** do banco de dados
3. **Orientar desenvolvimento** de RLS e triggers
4. **Testar auditoria** e sistemas de alerta

## ⚠️ ATENÇÃO

Estes SQLs **NÃO DEVEM** executar com sucesso em um sistema corretamente implementado.

- ✅ **Esperado**: Erro/bloqueio ao tentar executar
- ❌ **Falha de segurança**: Execução bem-sucedida

## Lista de Violações Testadas

| Arquivo | Violação | Seção do Contrato |
|---------|----------|-------------------|
| `01_violation_text_not_literal.sql` | `raw_text` não é substring literal | § 5.1 |
| `02_violation_text_modified.sql` | Palavras alteradas/substituídas | § 5.1 |
| `03_violation_status_change.sql` | A0 tentando alterar `status` | § 6, § 10 |
| `04_violation_create_entities.sql` | A0 escrevendo em `kb_entity_proposals` | § 2, § 10 |
| `05_violation_invalid_reference.sql` | `chunk_id` inexistente | § 8 |
| `06_violation_interpretation.sql` | `raw_text` contém interpretação | § 5.2, § 12 |
| `07_violation_create_relations.sql` | A0 criando relações entre entidades | § 5.2, § 10 |
| `08_violation_text_completion.sql` | Texto completado/inferido | § 5.1 |
| `09_violation_normalization.sql` | Texto normalizado/limpo | § 4 |
| `10_violation_scientific_validation.sql` | A0 validando cientificamente | § 10 |

## Como Usar

### 1. Teste Manual
Execute cada SQL em ambiente de desenvolvimento e **espere que falhe**:

```bash
psql -d sua_base -f 01_violation_text_not_literal.sql
# Resultado esperado: ERROR
```

### 2. Teste Automatizado
Crie script que:
- Executa cada violação
- Verifica que retornou erro
- Alerta se executou com sucesso

```bash
#!/bin/bash
for file in tests/a0/*.sql; do
  if psql -d test_db -f "$file" 2>&1 | grep -q "ERROR"; then
    echo "✅ $file: violação bloqueada corretamente"
  else
    echo "❌ $file: VIOLAÇÃO NÃO BLOQUEADA!"
  fi
done
```

### 3. CI/CD Integration
Inclua estes testes em pipeline para garantir que:
- Constraints nunca sejam removidas acidentalmente
- Migrações futuras não enfraqueçam segurança

## Mecânicas de Proteção

Cada violação deve ser bloqueada por:

| Violação | Mecânica de Bloqueio |
|----------|---------------------|
| Texto não literal | Trigger de validação + audit |
| Status change | RLS policy + trigger |
| Create entities | RLS negando INSERT em outras tabelas |
| Invalid reference | FK constraint |
| Interpretation | Trigger de validação semântica |
| Relations | RLS negando INSERT em tabelas de relação |
| Completion | Trigger comparando com chunk original |
| Normalization | Trigger validando igualdade binária |
| Scientific validation | Audit log + revisão humana |

## Desenvolvimento Futuro

1. **Adicionar triggers** que impeçam violações
2. **Implementar RLS** que restrinja A0 apenas a `kb_evidence_excerpts`
3. **Criar audit logs** que registrem tentativas de violação
4. **Gerar alertas** quando padrões suspeitos forem detectados

## Princípio

> "Se o A0 começar a produzir texto como 'Este texto descreve várias síndromes...' → Contrato violado."
>
> — Contrato A0, § 12

🔒 **A0 não cria conhecimento, apenas aponta onde pode existir conhecimento.**
