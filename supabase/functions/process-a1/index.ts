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

    const systemPrompt = `Você é o Agente A1 — Agente de Agrupamento Conservador de Evidências.

PAPEL: Organizar texto em blocos temáticos baseados em proximidade textual superficial.

REGRAS ABSOLUTAS:
1. PRESERVE TODO o texto original sem nenhuma alteração, resumo ou paráfrase
2. IDENTIFIQUE aspectos textuais superficiais (ex: descrição de sintoma, contexto temporal, fator modificador)
3. AGRUPE trechos que tratam do MESMO aspecto textual
4. NÃO interprete, NÃO infira significado clínico, NÃO crie conclusões
5. NÃO adicione explicações, justificativas ou comentários
6. Use APENAS texto literal do input

FORMATO DE OUTPUT:
Retorne JSON com array de blocos:
[
  {
    "aspect": "descritivo-neutro-do-aspecto-textual",
    "text": "texto literal extraído do input"
  }
]

IMPORTANTE:
- "aspect" deve ser um identificador descritivo neutro (ex: "descricao-sintoma", "variacao-temporal", "fator-modificador")
- NÃO use termos clínicos, diagnósticos ou interpretativos em "aspect"
- "text" deve conter apenas texto literal do input, sem modificações
- Se houver dúvida, NÃO agrupe
- Preferível fragmentar em excesso do que inferir agrupamentos incorretos`;

    const userPrompt = `Organize o seguinte texto em blocos baseados em aspectos textuais superficiais.

Texto:
${text}

Retorne apenas o JSON com os blocos, sem explicações adicionais.`;

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!anthropicApiKey) {
      const fallbackBlocks = processTextFallback(text, prefix);

      return new Response(
        JSON.stringify({
          blocks: fallbackBlocks,
          audit: {
            agent_name: "A1",
            agent_model: "A1-α",
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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        temperature: 0,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.content[0].text;

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
        agent_model: "A1-α",
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
