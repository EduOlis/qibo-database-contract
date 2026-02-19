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
  chunkIds?: string[];
}

const A0_SYSTEM_PROMPT = `Você é um assistente especializado em extrair trechos literais de textos. Retorne sempre JSON válido.`;

const A0_PROMPT = `Você é o agente A0 - Extração Literal de Evidências para Medicina Tradicional Chinesa (MTC).

RESPONSABILIDADE EXCLUSIVA:
Identificar e extrair substrings LITERAIS relevantes do texto fornecido, focando em: Síndromes, Sintomas, Sinais Clínicos, Princípios Terapêuticos e Acupontos.

REGRAS ABSOLUTAS:
1. NUNCA parafrasear, resumir ou modificar o texto
2. Extrair APENAS substrings que existem EXATAMENTE como aparecem no texto
3. Cada excerpt DEVE ser uma substring literal verificável
4. NÃO interpretar, NÃO inferir, NÃO adicionar contexto
5. NÃO criar relações entre entidades (isso será feito posteriormente)
6. NÃO normalizar terminologia

TIPOS DE ENTIDADES A EXTRAIR:
- syndrome: Padrões diagnósticos da MTC (ex: "Deficiência de Qi do Baço")
- symptom: Sintomas subjetivos relatados pelo paciente (ex: "dor de cabeça", "tontura")
- clinical_sign: Sinais objetivos observáveis (ex: "língua pálida", "pulso fraco")
- acupoint: Pontos de acupuntura (ex: "Estômago 36", "E36", "Zusanli")
- therapeutic_principle: Princípios de tratamento (ex: "tonificar o Qi", "dispersar o Calor")

Para cada trecho relevante identificado, extraia:
- excerpt_text: substring LITERAL do texto original
- suggested_entity_type: uma das opções acima
- relevance_score: 0.0 a 1.0
- justification: breve explicação de por que este trecho é relevante
- structured_data: objeto JSON com dados estruturados específicos por tipo:
  * syndrome: { "name_pt": "...", "name_cn": "...", "organ_system": "..." }
  * symptom: { "name_pt": "...", "description": "..." }
  * clinical_sign: { "name_pt": "...", "sign_type": "tongue|pulse|complexion|other", "description": "..." }
  * acupoint: { "code": "...", "name_pt": "...", "name_cn": "...", "meridian": "..." }
  * therapeutic_principle: { "name": "...", "description": "..." }

TEXTO PARA ANÁLISE:
{chunk_text}

Retorne um objeto JSON no formato: { "excerpts": [ ... ] }
Exemplo: {
  "excerpts": [{
    "excerpt_text": "Deficiência de Qi do Baço",
    "suggested_entity_type": "syndrome",
    "relevance_score": 0.95,
    "justification": "Menciona síndrome diagnóstica específica da MTC",
    "structured_data": {
      "name_pt": "Deficiência de Qi do Baço",
      "organ_system": "Baço"
    }
  }]
}`;

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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const requestData: A0Request = await req.json();
    const { chunkId, sourceId, profileId, chunkIds } = requestData;

    if (!profileId || (!chunkId && !sourceId && !chunkIds)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: profileId and (chunkId, chunkIds or sourceId)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let chunksToProcess = [];

    if (chunkId) {
      const { data, error } = await supabaseClient
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
    } else if (chunkIds && chunkIds.length > 0) {
      const { data, error } = await supabaseClient
        .from("kb_raw_chunks")
        .select("*")
        .in("id", chunkIds)
        .eq("processed", false)
        .eq("skip_processing", false);

      if (error) {
        throw new Error(`Failed to fetch chunks: ${error.message}`);
      }
      chunksToProcess = data || [];
    } else if (sourceId) {
      const { data, error } = await supabaseClient
        .from("kb_raw_chunks")
        .select("*")
        .eq("source_id", sourceId)
        .eq("processed", false)
        .eq("skip_processing", false);

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

          const { data: evidenceData, error: insertError } = await supabaseClient
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
            })
            .select()
            .single();

          if (!insertError && evidenceData) {
            totalEvidences++;

            const entityType = excerpt.suggested_entity_type;
            if (entityType && entityType !== "other" && excerpt.structured_data) {
              const structuredData = excerpt.structured_data;
              let entityLabel = "";

              if (entityType === "syndrome" && structuredData.name_pt) {
                entityLabel = structuredData.name_pt;
              } else if (entityType === "symptom" && structuredData.name_pt) {
                entityLabel = structuredData.name_pt;
              } else if (entityType === "clinical_sign" && structuredData.name_pt) {
                entityLabel = structuredData.name_pt;
              } else if (entityType === "acupoint" && (structuredData.name_pt || structuredData.code)) {
                entityLabel = structuredData.name_pt || structuredData.code;
              } else if (entityType === "therapeutic_principle" && structuredData.name) {
                entityLabel = structuredData.name;
              }

              if (entityLabel) {
                await supabaseClient
                  .from("kb_extracted_entities")
                  .insert({
                    evidence_id: evidenceData.id,
                    source_id: chunk.source_id,
                    entity_type: entityType,
                    entity_label: entityLabel,
                    entity_data: structuredData,
                    confidence_score: excerpt.relevance_score || 0.5,
                    extraction_rationale: excerpt.justification || "",
                    status: "pending",
                    agent_version: "a0-v1.2.0",
                  });
              }
            }
          } else {
            console.error("Failed to insert evidence:", insertError);
          }
        }

        const { error: updateError } = await supabaseClient
          .from("kb_raw_chunks")
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
          })
          .eq("id", chunk.id);

        if (updateError) {
          console.error(`Failed to mark chunk ${chunk.id} as processed:`, updateError);
        } else {
          console.log(`Successfully marked chunk ${chunk.id} as processed`);
        }

      } catch (error) {
        console.error(`Error processing chunk ${chunk.id}:`, error);
      }
    }

    const executionTime = Date.now() - startTime;

    if (sourceId) {
      await supabaseClient
        .from("kb_document_pipeline_status")
        .update({
          a0_status: "completed",
          a0_completed_at: new Date().toISOString(),
          processed_chunks: chunksToProcess.length,
          total_evidences: totalEvidences,
        })
        .eq("source_id", sourceId);

      await supabaseClient
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
