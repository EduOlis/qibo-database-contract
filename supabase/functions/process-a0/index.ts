import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface A0Request {
  chunkId?: string;
  sourceId?: string;
  profileId: string;
}

const A0_SYSTEM_PROMPT = `Você é um assistente especializado em extrair trechos literais de textos. Retorne sempre JSON válido.`;

const A0_PROMPT = `Você é o agente A0 - Extração Literal de Evidências.

RESPONSABILIDADE EXCLUSIVA:
Identificar e extrair substrings LITERAIS relevantes do texto fornecido.

REGRAS ABSOLUTAS:
1. NUNCA parafrasear, resumir ou modificar o texto
2. Extrair APENAS substrings que existem EXATAMENTE como aparecem no texto
3. Cada excerpt DEVE ser uma substring literal verificável
4. NÃO interpretar, NÃO inferir, NÃO adicionar contexto
5. NÃO criar entidades ou relações
6. NÃO normalizar terminologia

Para cada trecho relevante identificado, extraia:
- excerpt_text: substring LITERAL do texto original
- suggested_entity_type: uma das opções (symptom, syndrome, clinical_sign, acupoint, therapeutic_principle, other)
- relevance_score: 0.0 a 1.0
- justification: breve explicação de por que este trecho é relevante

Retorne um array JSON de excerpts.

TEXTO PARA ANÁLISE:
{chunk_text}

Retorne apenas o JSON array, sem texto adicional.`;

async function callGemini(systemPrompt: string, userPrompt: string, apiKey: string): Promise<string> {
  const model = Deno.env.get("LLM_MODEL") || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `${systemPrompt}\n\n${userPrompt}`
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(systemPrompt: string, userPrompt: string, apiKey: string): Promise<string> {
  const model = Deno.env.get("LLM_MODEL") || "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
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
      temperature: 0.1,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  const provider = Deno.env.get("LLM_PROVIDER") || "gemini";

  if (provider === "gemini") {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }
    return await callGemini(systemPrompt, userPrompt, apiKey);
  } else if (provider === "openai") {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }
    return await callOpenAI(systemPrompt, userPrompt, apiKey);
  } else {
    throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

function validateExcerptIsLiteral(excerpt: string, chunkText: string): boolean {
  return chunkText.includes(excerpt);
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const requestData: A0Request = await req.json();
    const { chunkId, sourceId, profileId } = requestData;

    if (!profileId || (!chunkId && !sourceId)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: profileId and (chunkId or sourceId)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let chunksToProcess = [];

    if (chunkId) {
      const { data, error } = await supabase
        .from("kb_raw_chunks")
        .select("*")
        .eq("id", chunkId)
        .eq("processed", false)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: "Chunk not found or already processed" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      chunksToProcess = [data];
    } else if (sourceId) {
      const { data, error } = await supabase
        .from("kb_raw_chunks")
        .select("*")
        .eq("source_id", sourceId)
        .eq("processed", false);

      if (error) {
        throw new Error(`Failed to fetch chunks: ${error.message}`);
      }
      chunksToProcess = data || [];
    }

    if (chunksToProcess.length === 0) {
      return new Response(
        JSON.stringify({ message: "No unprocessed chunks found", evidencesCreated: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let totalEvidences = 0;
    let totalSkipped = 0;
    const llmResponses: any[] = [];

    for (const chunk of chunksToProcess) {
      const prompt = A0_PROMPT.replace("{chunk_text}", chunk.raw_text);

      try {
        console.log(`Processing chunk ${chunk.id}...`);
        const responseText = await callLLM(A0_SYSTEM_PROMPT, prompt);
        console.log(`LLM response:`, responseText);

        let response;
        try {
          response = JSON.parse(responseText);
        } catch (parseError) {
          console.error(`JSON parse error for chunk ${chunk.id}:`, parseError);
          llmResponses.push({ chunkId: chunk.id, error: 'JSON parse failed', raw: responseText });
          continue;
        }

        const excerpts = response.excerpts || [];
        console.log(`Found ${excerpts.length} excerpts`);
        llmResponses.push({ chunkId: chunk.id, excerptCount: excerpts.length, response });

        for (const excerpt of excerpts) {
          if (!validateExcerptIsLiteral(excerpt.excerpt_text, chunk.raw_text)) {
            console.warn(`Skipping non-literal excerpt: "${excerpt.excerpt_text.substring(0, 50)}..."`);
            totalSkipped++;
            continue;
          }

          const { error: insertError } = await supabase
            .from("kb_evidence_excerpts")
            .insert({
              source_id: chunk.source_id,
              chunk_id: chunk.id,
              excerpt_text: excerpt.excerpt_text,
              suggested_entity_type: excerpt.suggested_entity_type || "other",
              relevance_score: excerpt.relevance_score || 0.5,
              justification: excerpt.justification || "",
              language: chunk.language,
              page_reference: chunk.page_reference,
              status: "pending",
            });

          if (!insertError) {
            totalEvidences++;
          } else {
            console.error("Failed to insert evidence:", insertError);
          }
        }

        await supabase
          .from("kb_raw_chunks")
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
          })
          .eq("id", chunk.id);

      } catch (error) {
        console.error(`Error processing chunk ${chunk.id}:`, error);
      }
    }

    const executionTime = Date.now() - startTime;

    if (sourceId) {
      await supabase
        .from("kb_document_pipeline_status")
        .update({
          a0_status: "completed",
          a0_completed_at: new Date().toISOString(),
          processed_chunks: chunksToProcess.length,
          total_evidences: totalEvidences,
        })
        .eq("source_id", sourceId);

      await supabase
        .from("kb_notifications")
        .insert({
          notification_type: "evidence_pending",
          title: "Evidências extraídas",
          message: `${totalEvidences} evidências foram extraídas e aguardam revisão`,
          related_entity_type: "source",
          related_entity_id: sourceId,
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        chunksProcessed: chunksToProcess.length,
        evidencesCreated: totalEvidences,
        skippedNonLiteral: totalSkipped,
        executionTimeMs: executionTime,
        debug_llmResponses: llmResponses,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("A0 processing error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
