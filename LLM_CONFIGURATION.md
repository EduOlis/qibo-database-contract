# Configuração de LLM

O sistema agora suporta múltiplos provedores de LLM de forma modular.

## Provedores Disponíveis

### Gemini (Padrão)
- **Modelo**: `gemini-1.5-pro`
- **Variável de ambiente**: `GEMINI_API_KEY`

### Anthropic Claude
- **Modelo**: `claude-3-5-sonnet-20241022`
- **Variável de ambiente**: `ANTHROPIC_API_KEY`

## Como Configurar

### Opção 1: Usar Gemini (Recomendado para testes)

1. Obtenha sua API key em: https://aistudio.google.com/app/apikey
2. Configure as variáveis de ambiente no Supabase:
   - `GEMINI_API_KEY`: sua chave da API do Gemini
   - `LLM_PROVIDER`: `gemini` (ou deixe vazio, pois é o padrão)

### Opção 2: Usar Anthropic Claude

1. Obtenha sua API key em: https://console.anthropic.com/
2. Configure as variáveis de ambiente no Supabase:
   - `ANTHROPIC_API_KEY`: sua chave da API da Anthropic
   - `LLM_PROVIDER`: `anthropic`

## Modo Fallback

Se nenhuma API key estiver configurada, o sistema usará um modo fallback que:
- Divide o texto em sentenças
- Não usa inteligência artificial
- Funciona para testes básicos

## Adicionar Novo Provedor

Para adicionar suporte a um novo LLM:

1. Crie uma nova classe que implemente a interface `LLMProvider`:

```typescript
class NovoProvider implements LLMProvider {
  name = "nome-do-modelo";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async callAPI(systemPrompt: string, userPrompt: string): Promise<string> {
    // Implementar chamada à API
    // Retornar texto da resposta
  }
}
```

2. Adicione o novo provedor na função `getLLMProvider()`:

```typescript
function getLLMProvider(): LLMProvider | null {
  const providerType = Deno.env.get("LLM_PROVIDER") || "gemini";

  // ... outros provedores ...

  if (providerType === "novo_provider") {
    const apiKey = Deno.env.get("NOVO_PROVIDER_API_KEY");
    if (apiKey) {
      return new NovoProvider(apiKey);
    }
  }

  return null;
}
```

3. Reimplante a edge function com `mcp__supabase__deploy_edge_function`
