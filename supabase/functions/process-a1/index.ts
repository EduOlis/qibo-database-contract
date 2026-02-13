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
  name: string;
  private apiKey: string;

  constructor(apiKey: string) {
    this.name = Deno.env.get("LLM_MODEL") || "gemini-1.5-flash";
    this.apiKey = apiKey;
  }

  async callAPI(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.name}:generateContent?key=${this.apiKey}`,
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

class OpenAIProvider implements LLMProvider {
  name: string;
  private apiKey: string;

  constructor(apiKey: string) {
    this.name = Deno.env.get("LLM_MODEL") || "gpt-4o-mini";
    this.apiKey = apiKey;
  }

  async callAPI(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.name,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
  }
}

class AnthropicProvider implements LLMProvider {
  name: string;
  private apiKey: string;

  constructor(apiKey: string) {
    this.name = Deno.env.get("LLM_MODEL") || "claude-3-5-sonnet-20241022";
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
  } else if (providerType === "openai") {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (apiKey) {
      return new OpenAIProvider(apiKey);
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

    const systemPrompt = `Você é o agente A1 — Segmentação Mecânica Literal.

PAPEL:
Você executa apenas segmentação textual mecânica.
Você NÃO organiza semanticamente.
Você NÃO interpreta.
Você NÃO agrupa por tema.
Você NÃO resolve contradições.
Você NÃO pensa clinicamente.

OBJETIVO:
Dividir o texto exclusivamente com base em regras estruturais superficiais e mecânicas.

CRITÉRIO ÚNICO DE SEGMENTAÇÃO:

1. Cada frase completa deve se tornar um bloco separado.
2. Uma frase termina apenas quando houver:
   - ponto final (.)
   - ponto de interrogação (?)
   - ponto de exclamação (!)
3. Não separar por vírgulas.
4. Não separar por conjunções ("e", "mas", "ou").
5. Não agrupar frases diferentes no mesmo bloco.
6. Não reorganizar a ordem.
7. Não remover nada.
8. Não adicionar nada.

REGRAS ABSOLUTAS:

- Preserve 100% do texto original.
- Não altere nenhuma palavra.
- Não corrija ortografia.
- Não melhore pontuação.
- Não reescreva.
- Não resuma.
- Não explique.
- Não interprete.

SOBRE OS RÓTULOS:

Os rótulos devem ser puramente sequenciais e neutros.

Formato obrigatório do rótulo:
"bloco-01"
"bloco-02"
"bloco-03"
...

Não usar qualquer descrição semântica.
Não usar palavras do texto.
Não criar categorias.
Apenas numeração sequencial.

FORMATO DE OUTPUT:

Retorne exclusivamente JSON no formato:

[
  {
    "aspect": "bloco-01",
    "text": "frase original exata"
  }
]

Se houver 10 frases, devem existir 10 blocos.

CHECK FINAL (AUTO-VERIFICAÇÃO):

- Alterei alguma palavra? → Se sim, corrija.
- Agrupei frases? → Se sim, separe.
- Interpretei algo? → Se sim, remova.
- O rótulo contém qualquer palavra além de "bloco-XX"? → Se sim, corrija.

Produza apenas o JSON. Nenhum comentário adicional.`;

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
