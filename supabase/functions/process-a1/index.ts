import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface A1Request {
  sourceId: string;
  profileId: string;
}

interface A1Block {
  aspect: string;
  text: string;
}

interface LLMProvider {
  name: string;
  callAPI: (systemPrompt: string, userPrompt: string) => Promise<string>;
}

class GeminiProvider implements LLMProvider {
  name: string;
  private apiKey: string;

  constructor(apiKey: string) {
    this.name = Deno.env.get("LLM_MODEL") || "gemini-2.5-flash";
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: userError?.message || "Invalid JWT",
          details: userError
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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

    const { sourceId, profileId } = body as A1Request;

    if (!sourceId || !profileId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: sourceId and profileId" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: evidences, error: evidencesError } = await supabase
      .from("kb_evidence_excerpts")
      .select("id, excerpt_text, suggested_entity_type")
      .eq("source_id", sourceId)
      .eq("status", "pending");

    if (evidencesError) {
      throw new Error(`Failed to fetch evidences: ${evidencesError.message}`);
    }

    if (!evidences || evidences.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No pending evidences found for this source",
          clustersCreated: 0
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const combinedText = evidences.map(e => e.excerpt_text).join("\n\n");

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
${combinedText}

Retorne apenas o JSON com os blocos, sem explicações adicionais.`;

    const llmProvider = getLLMProvider();

    if (!llmProvider) {
      return new Response(
        JSON.stringify({
          error: "LLM provider not configured. Set GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY.",
          clustersCreated: 0
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

    const content = await llmProvider.callAPI(systemPrompt, userPrompt);

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from LLM");
    }

    const parsedBlocks: A1Block[] = JSON.parse(jsonMatch[0]);

    let clustersCreated = 0;

    for (const block of parsedBlocks) {
      const relevantEvidenceIds = evidences
        .filter(e => block.text.includes(e.excerpt_text))
        .map(e => e.id);

      if (relevantEvidenceIds.length === 0) {
        continue;
      }

      const { error: insertError } = await supabase
        .from("kb_evidence_clusters")
        .insert({
          source_id: sourceId,
          cluster_label: block.aspect,
          cluster_basis: block.text,
          evidence_ids: relevantEvidenceIds,
          agent_version: "A1 v1.0.0",
          contract_hash: "a1_v1.1",
          status: "pending",
          confidence_level: 1.0
        });

      if (!insertError) {
        clustersCreated++;
      } else {
        console.error("Failed to insert cluster:", insertError);
      }
    }

    await supabase
      .from("kb_document_pipeline_status")
      .update({
        a1_status: "completed",
        a1_completed_at: new Date().toISOString(),
        total_clusters: clustersCreated,
        updated_at: new Date().toISOString()
      })
      .eq("source_id", sourceId);

    const executionTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        message: "A1 processing completed successfully",
        clustersCreated,
        audit: {
          agent_name: "A1",
          agent_model: `A1-α (${llmProvider.name})`,
          agent_version: "1.0.0",
          contract_version: "A1 v1.1",
          execution_time_ms: executionTime,
          input_evidences: evidences.length,
          output_clusters: clustersCreated
        }
      }),
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
