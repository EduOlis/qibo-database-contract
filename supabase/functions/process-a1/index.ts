import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface A1Block {
  id: string;
  text: string;
  aspect: string;
}

interface A1Request {
  text: string;
  prefix: string;
}

interface A1Response {
  blocks: A1Block[];
  audit: {
    agent_name: string;
    agent_model: string;
    agent_version: string;
    contract_version: string;
    execution_time_ms: number;
    input_length: number;
    output_blocks_count: number;
  };
}

interface LLMProvider {
  name: string;
  callAPI: (systemPrompt: string, userPrompt: string) => Promise<string>;
}

class GeminiProvider implements LLMProvider {
  name = "gemini-2.5-flash";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async callAPI(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt + "\n\n" + userPrompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 8192,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      throw new Error("Invalid response format from Gemini API");
    }

    return result.candidates[0].content.parts[0].text;
  }
}

class AnthropicProvider implements LLMProvider {
  name = "claude-3-5-sonnet-20241022";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async callAPI(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: this.name,
        max_tokens: 4096,
        temperature: 0,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result.content[0].text;
  }
}

function getLLMProvider(): LLMProvider | null {
  const providerType = Deno.env.get("LLM_PROVIDER") || "gemini";

  if (providerType === "gemini") {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (apiKey) {
      return new GeminiProvider(apiKey);
    }
  } else if (providerType === "anthropic") {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (apiKey) {
      return new AnthropicProvider(apiKey);
    }
  }

  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const startTime = Date.now();
    let body;

    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { text, prefix } = body as A1Request;

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!prefix) {
      return new Response(
        JSON.stringify({ error: "Prefix is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const systemPrompt = `Você é o agente A1 — Organização Inicial.

PAPEL DO A1:
Seu papel é exclusivamente organizar o texto bruto fornecido em blocos coerentes, sem interpretar, sem resumir, sem inferir relações clínicas, sem criar hipóteses.

Você NÃO é um agente de análise.
Você NÃO é um agente diagnóstico.
Você NÃO é um agente de síntese.

OBJETIVO:
Transformar texto clínico potencialmente confuso, repetitivo ou desorganizado em blocos textuais organizados, preservando 100% do conteúdo original.

REGRAS ABSOLUTAS (NÃO QUEBRE):

1. NÃO ALTERAR O TEXTO ORIGINAL
   - Não reescreva
   - Não corrija
   - Não melhore
   - Não normalize
   - Não complete frases

2. NÃO INTERPRETAR
   - Não inferir causalidade
   - Não assumir relações entre fatos
   - Não explicar divergências
   - Não resolver contradições

3. NÃO RESUMIR
   - Todo conteúdo deve permanecer íntegro
   - Agrupe apenas quando os trechos forem claramente sobre o mesmo assunto

4. NÃO PENSAR CLINICAMENTE
   - Nenhum julgamento
   - Nenhuma hipótese
   - Nenhuma leitura diagnóstica

COMO ORGANIZAR:
- Separe o texto em blocos temáticos mínimos coerentes
- Um bloco pode conter mais de uma frase, desde que tratem do mesmo aspecto literal
- Evite fragmentação excessiva
- Evite agrupamento interpretativo
- NÃO fragmentar enumerações (ex: "dor em pontada, dor surda e desconforto" = 1 bloco, não 3)
- NÃO separar frases coordenadas que descrevem o mesmo fenômeno
- NÃO dividir artificialmente por vírgulas, conjunções ("e", "ou", "mas") ou quebras sintáticas
- Uma descrição completa de um mesmo aspecto = 1 bloco

QUANDO SEPARAR EM BLOCOS DIFERENTES:
- Mudança clara de aspecto (ex: dor → sono)
- Mudança de eixo descritivo (ex: localização → duração)
- Mudança de domínio (ex: sintoma → intervenção tentada)
- Tempo/contexto claramente distinto

SOBRE OS RÓTULOS (CRÍTICO):
Os rótulos devem ser LITERAIS, DESCRITIVOS, NEUTROS, POBRES SEMANTICAMENTE.

RÓTULOS ACEITÁVEIS:
- descricao-dor-ombro
- duracao-dor
- relato-sono
- uso-calor
- atividade-fisica
- ausencia-trauma
- descricao-alimentacao

RÓTULOS PROIBIDOS (qualquer forma de interpretação, relação ou metalinguagem):
- ❌ relacao-atividade-sintoma
- ❌ fator-modificador-divergente
- ❌ variacao-padrao-dor
- ❌ caracteristicas-clinicas
- ❌ sintoma-principal
- ❌ divergencia-registros

Se houver contradição no texto:
- Apenas agrupe os trechos
- Não explique
- Não nomeie a contradição

FORMATO DE OUTPUT:
Retorne JSON com array de blocos:
[
  {
    "aspect": "rotulo-literal-neutro",
    "text": "texto original exatamente como fornecido"
  }
]

CHECK FINAL (AUTO-VERIFICAÇÃO):
Antes de responder, valide:
- Alterei alguma palavra do texto? → Se sim, corrija
- Fiz alguma inferência? → Se sim, corrija
- Algum rótulo "parece inteligente demais"? → Simplifique
- Outro agente poderia interpretar esse bloco de várias formas? → Bom sinal

PRODUZA APENAS A ORGANIZAÇÃO. Sem explicações, sem comentários, sem observações extras.`;

    const userPrompt = `Organize o seguinte texto em blocos baseados em aspectos textuais superficiais.

Texto:
${text}

Retorne apenas o JSON com os blocos, sem explicações adicionais.`;

    const llmProvider = getLLMProvider();

    if (!llmProvider) {
      const fallbackBlocks = processTextFallback(text, prefix);

      return new Response(
        JSON.stringify({
          blocks: fallbackBlocks,
          audit: {
            agent_name: "A1",
            agent_model: "A1-α-fallback",
            agent_version: "1.0.0",
            contract_version: "A1 v1.1",
            execution_time_ms: Date.now() - startTime,
            input_length: text.length,
            output_blocks_count: fallbackBlocks.length,
            warning: "Using fallback mode - LLM API not configured"
          }
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const content = await llmProvider.callAPI(systemPrompt, userPrompt);

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from LLM");
    }

    const parsedBlocks = JSON.parse(jsonMatch[0]);

    const blocks: A1Block[] = parsedBlocks.map((block: { aspect: string; text: string }, index: number) => ({
      id: `${prefix}-BLOCO-${String(index + 1).padStart(2, '0')}`,
      text: block.text.trim(),
      aspect: block.aspect
    }));

    const executionTime = Date.now() - startTime;

    const responseData: A1Response = {
      blocks,
      audit: {
        agent_name: "A1",
        agent_model: `A1-α (${llmProvider.name})`,
        agent_version: "1.0.0",
        contract_version: "A1 v1.1",
        execution_time_ms: executionTime,
        input_length: text.length,
        output_blocks_count: blocks.length
      }
    };

    return new Response(
      JSON.stringify(responseData),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error('Error in process-a1:', error);

    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        details: error.toString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

function processTextFallback(text: string, prefix: string): A1Block[] {
  const blocks: A1Block[] = [];
  let blockCounter = 1;

  const paragraphs = text.split('\n').filter(line => line.trim().length > 0);

  for (const paragraph of paragraphs) {
    const sentences = paragraph
      .split(/([.!?]+\s+)/)
      .reduce<string[]>((acc, part, idx, arr) => {
        if (idx % 2 === 0 && part.trim()) {
          const nextPart = arr[idx + 1] || '';
          acc.push((part + nextPart).trim());
        }
        return acc;
      }, [])
      .filter(s => s.length > 0);

    if (sentences.length === 0 && paragraph.trim()) {
      blocks.push({
        id: `${prefix}-BLOCO-${String(blockCounter).padStart(2, '0')}`,
        text: paragraph.trim(),
        aspect: "unidade-textual"
      });
      blockCounter++;
    } else {
      for (const sentence of sentences) {
        blocks.push({
          id: `${prefix}-BLOCO-${String(blockCounter).padStart(2, '0')}`,
          text: sentence,
          aspect: "unidade-textual"
        });
        blockCounter++;
      }
    }
  }

  return blocks;
}
