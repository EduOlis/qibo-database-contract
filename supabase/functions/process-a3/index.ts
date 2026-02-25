import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface A3Request {
  sourceId: string;
}

const A3_SYSTEM_PROMPT = `Você é um assistente especializado em identificar relações entre entidades de Medicina Tradicional Chinesa. Retorne sempre JSON válido.`;

const A3_PROMPT = `Você é o agente A3 - Extração de Relações entre Entidades de MTC.

RESPONSABILIDADE:
Analisar entidades extraídas e identificar relações explícitas baseadas no contexto textual completo dos chunks originais.

TIPOS DE RELAÇÕES:
- has_symptom: síndrome apresenta sintoma
- has_clinical_sign: síndrome apresenta sinal clínico
- treated_by_principle: síndrome/sintoma é tratada por princípio terapêutico
- treated_by_acupoint: síndrome/sintoma/princípio é tratado por acuponto
- causes: entidade causa outra
- alleviates: entidade alivia outra
- contraindicated_with: entidade é contraindicada com outra
- combined_with: entidade é frequentemente combinada com outra

REGRAS:
1. Identificar apenas relações EXPLICITAMENTE mencionadas no texto
2. Cada relação deve ter evidência textual clara no contexto dos chunks
3. Não inferir relações implícitas ou usar conhecimento externo
4. Confidence_score baseado na clareza da evidência textual
5. Use o contexto COMPLETO dos chunks para identificar relações entre entidades

ENTIDADES DISPONÍVEIS:
{entities_json}

CONTEXTO TEXTUAL COMPLETO (CHUNKS):
{chunks_json}

EVIDÊNCIAS EXTRAÍDAS (para referência):
{evidences_json}

Analise o CONTEXTO COMPLETO dos chunks e identifique relações entre as entidades. Para cada relação encontrada, retorne:
- from_entity_id: ID da entidade de origem
- to_entity_id: ID da entidade de destino
- relation_type: tipo de relação (uma das opções acima)
- textual_evidence: trecho literal do texto do chunk que suporta a relação
- evidence_ids: array de IDs das evidências que suportam
- confidence_score: 0.0 a 1.0
- extraction_rationale: explicação breve

Retorne JSON: { "relations": [ ... ] }
Exemplo: {
  "relations": [{
    "from_entity_id": "uuid1",
    "to_entity_id": "uuid2",
    "relation_type": "has_symptom",
    "textual_evidence": "Deficiência de Qi do Baço apresenta fadiga",
    "evidence_ids": ["uuid3"],
    "confidence_score": 0.9,
    "extraction_rationale": "Relação direta entre síndrome e sintoma encontrada no contexto do chunk"
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
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
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
    const apikeyHeader = req.headers.get("apikey");

    console.log("Auth header present:", !!authHeader);
    console.log("Apikey header present:", !!apikeyHeader);

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      console.error("Auth error:", userError);
      console.error("Auth header:", authHeader?.substring(0, 20) + "...");
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

    console.log("User authenticated:", user.id);

    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const requestData: A3Request = await req.json();
    const { sourceId } = requestData;

    if (!sourceId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: sourceId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: entities, error: entitiesError } = await supabaseClient
      .from("kb_extracted_entities")
      .select("*")
      .eq("source_id", sourceId)
      .eq("status", "approved");

    if (entitiesError) {
      throw new Error(`Failed to fetch entities: ${entitiesError.message}`);
    }

    if (!entities || entities.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No approved entities found for this source",
          relationsCreated: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const evidenceIds = entities.map(e => e.evidence_id);
    const { data: evidences, error: evidencesError } = await supabaseClient
      .from("kb_evidence_excerpts")
      .select("*")
      .in("id", evidenceIds);

    if (evidencesError) {
      throw new Error(`Failed to fetch evidences: ${evidencesError.message}`);
    }

    const chunkIds = evidences?.map(e => e.chunk_id).filter(Boolean) || [];
    const { data: chunks, error: chunksError } = await supabaseClient
      .from("kb_raw_chunks")
      .select("id, raw_text, sequence_number, page_reference")
      .in("id", chunkIds);

    if (chunksError) {
      throw new Error(`Failed to fetch chunks: ${chunksError.message}`);
    }

    const llmProvider = Deno.env.get("LLM_PROVIDER") || "gemini";
    const llmApiKey = llmProvider === "openai"
      ? Deno.env.get("OPENAI_API_KEY")!
      : Deno.env.get("GEMINI_API_KEY")!;

    const callLLM = llmProvider === "openai" ? callOpenAI : callGemini;

    const BATCH_SIZE = 10;
    const MAX_EXECUTION_TIME = 45000;
    let relationsCreated = 0;
    let totalBatches = Math.ceil(entities.length / BATCH_SIZE);
    let processedBatches = 0;

    console.log(`Processing ${entities.length} entities in ${totalBatches} batches`);

    for (let i = 0; i < entities.length; i += BATCH_SIZE) {
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > MAX_EXECUTION_TIME) {
        console.log(`Timeout approaching, stopping after ${processedBatches} batches`);
        break;
      }

      const batchEntities = entities.slice(i, i + BATCH_SIZE);
      const batchEvidenceIds = batchEntities.map(e => e.evidence_id);
      const batchEvidences = evidences?.filter(ev => batchEvidenceIds.includes(ev.id)) || [];
      const batchChunkIds = batchEvidences.map(ev => ev.chunk_id).filter(Boolean);
      const batchChunks = chunks?.filter(ch => batchChunkIds.includes(ch.id)) || [];

      const entitiesJson = JSON.stringify(batchEntities.map(e => ({
        id: e.id,
        type: e.entity_type,
        label: e.entity_label,
        data: e.entity_data,
        evidence_id: e.evidence_id,
      })), null, 2);

      const chunksJson = JSON.stringify(batchChunks.map(ch => ({
        id: ch.id,
        text: ch.raw_text,
        sequence: ch.sequence_number,
        page: ch.page_reference,
      })), null, 2);

      const evidencesJson = JSON.stringify(batchEvidences.map(ev => ({
        id: ev.id,
        chunk_id: ev.chunk_id,
        text: ev.excerpt_text,
        type: ev.suggested_entity_type,
      })), null, 2);

      const prompt = A3_PROMPT
        .replace("{entities_json}", entitiesJson)
        .replace("{chunks_json}", chunksJson)
        .replace("{evidences_json}", evidencesJson);

      console.log(`Processing batch ${processedBatches + 1}/${totalBatches}`);

      try {
        const responseText = await callLLM(A3_SYSTEM_PROMPT, prompt, llmApiKey);

        let response;
        try {
          response = JSON.parse(responseText);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          console.error("Response text:", responseText);
          continue;
        }

        const relations = response.relations || [];

        for (const relation of relations) {
          const { data: existing } = await supabaseClient
            .from("kb_entity_relations_proposals")
            .select("id")
            .eq("source_id", sourceId)
            .eq("from_entity_id", relation.from_entity_id)
            .eq("to_entity_id", relation.to_entity_id)
            .eq("relation_type", relation.relation_type)
            .maybeSingle();

          if (existing) {
            console.log(`Relation already exists, skipping: ${relation.from_entity_id} -> ${relation.to_entity_id} (${relation.relation_type})`);
            continue;
          }

          const { error: insertError } = await supabaseClient
            .from("kb_entity_relations_proposals")
            .insert({
              source_id: sourceId,
              from_entity_id: relation.from_entity_id,
              to_entity_id: relation.to_entity_id,
              relation_type: relation.relation_type,
              textual_evidence: relation.textual_evidence,
              evidence_ids: relation.evidence_ids,
              confidence_score: relation.confidence_score || 0.5,
              extraction_rationale: relation.extraction_rationale || "",
              status: "pending",
              agent_version: "a3-v1.0.0",
            });

          if (!insertError) {
            relationsCreated++;
          } else {
            console.error("Failed to insert relation:", insertError);
          }
        }

        processedBatches++;
      } catch (batchError) {
        console.error(`Error processing batch ${processedBatches + 1}:`, batchError);
      }
    }

    console.log(`Completed processing: ${processedBatches}/${totalBatches} batches, ${relationsCreated} relations created`);

    const executionTime = Date.now() - startTime;

    await supabaseClient
      .from("kb_document_pipeline_status")
      .update({
        a2_status: "completed",
        a2_completed_at: new Date().toISOString(),
      })
      .eq("source_id", sourceId);

    if (relationsCreated > 0) {
      await supabaseClient
        .from("kb_notifications")
        .insert({
          notification_type: "validation_required",
          title: "Relações entre entidades identificadas",
          message: `${relationsCreated} relações foram identificadas e aguardam revisão`,
          related_entity_type: "source",
          related_entity_id: sourceId,
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        sourceId,
        relationsCreated,
        entitiesAnalyzed: entities.length,
        executionTimeMs: executionTime,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("A3 processing error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
