# Configuração de LLM

O sistema suporta múltiplos provedores de LLM de forma modular e configurável.

## Provedores Disponíveis

### 1. Google Gemini (Padrão)
- **Modelo padrão**: `gemini-2.5-flash`
- **Variável de ambiente**: `GEMINI_API_KEY`
- **Vantagens**: Rápido, gratuito para uso moderado
- **Como obter**: https://aistudio.google.com/app/apikey

### 2. OpenAI
- **Modelo padrão**: `gpt-4o-mini`
- **Variável de ambiente**: `OPENAI_API_KEY`
- **Vantagens**: Alta qualidade, bom para produção
- **Como obter**: https://platform.openai.com/api-keys

### 3. Anthropic Claude
- **Modelo padrão**: `claude-3-5-sonnet-20241022`
- **Variável de ambiente**: `ANTHROPIC_API_KEY`
- **Vantagens**: Excelente para tarefas complexas
- **Como obter**: https://console.anthropic.com/

## Como Configurar

### Configuração Básica (Gemini)

Por padrão, o sistema usa Gemini. Basta configurar:

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **Edge Functions** → **Manage secrets**
3. Adicione a secret:
   - Nome: `GEMINI_API_KEY`
   - Valor: sua chave da API do Gemini

### Trocar para OpenAI

Para usar OpenAI em vez do Gemini:

1. Adicione as secrets no Supabase:
   - `OPENAI_API_KEY`: sua chave da OpenAI
   - `LLM_PROVIDER`: `openai`

2. (Opcional) Para usar um modelo diferente:
   - `LLM_MODEL`: ex: `gpt-4o`, `gpt-4-turbo`, etc.

### Trocar para Anthropic Claude

Para usar Claude:

1. Adicione as secrets no Supabase:
   - `ANTHROPIC_API_KEY`: sua chave da Anthropic
   - `LLM_PROVIDER`: `anthropic`

2. (Opcional) Para usar um modelo diferente:
   - `LLM_MODEL`: ex: `claude-3-opus-20240229`, etc.

## Variáveis de Ambiente

| Variável | Descrição | Valor Padrão |
|----------|-----------|--------------|
| `LLM_PROVIDER` | Provider a ser usado | `gemini` |
| `LLM_MODEL` | Modelo específico do provider | Varia por provider |
| `GEMINI_API_KEY` | Chave de API do Gemini | - |
| `OPENAI_API_KEY` | Chave de API da OpenAI | - |
| `ANTHROPIC_API_KEY` | Chave de API da Anthropic | - |

### Modelos Padrão por Provider

- **Gemini**: `gemini-2.5-flash`
- **OpenAI**: `gpt-4o-mini`
- **Anthropic**: `claude-3-5-sonnet-20241022`

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
