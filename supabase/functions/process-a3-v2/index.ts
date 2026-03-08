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

interface Entity {
  id: string;
  type: string;
  label: string;
  data: Record<string, unknown>;
  evidence_id: string;
}

interface Chunk {
  id: string;
  text: string;
  sequence: number;
  page: string | null;
}

interface Evidence {
  id: string;
  chunk_id: string;
  text: string;
  type: string;
}

interface RelationResponse {
  from_entity_id: string;
  to_entity_id: string;
  relation_type: string;
  textual_evidence: string;
  evidence_ids: string[];
  confidence_score: number;
  extraction_rationale: string;
}

const A3V2_SYSTEM_PROMPT = `Você é um assistente especializado em identificar relações entre entidades de Medicina Tradicional Chinesa em um contexto específico. Retorne sempre JSON válido.`;

const A3V2_PROMPT = `Você é o agente A3v2 - Extração Chunk-First de Relações entre Entidades de MTC.

RESPONSABILIDADE:
Analisar um único chunk de texto e identificar TODAS as relações explícitas entre as entidades que estão PRESENTES NESTE CHUNK.

TIPOS DE RELAÇÕES:
- has_symptom: síndrome apresenta sintoma
- has_clinical_sign: síndrome apresenta sinal clínico
- treated_by_principle: síndrome/sintoma é tratada por princípio terapêutico
- treated_by_acupoint: síndrome/sintoma/princípio é tratado por acuponto (IMPORTANTE: quando o texto lista pontos de acupuntura para tratamento, criar uma relação para CADA ponto listado)
- causes: entidade causa outra
- alleviates: entidade alivia outra
- contraindicated_with: entidade é contraindicada com outra
- combined_with: entidade é frequentemente combinada com outra

REGRAS CRÍTICAS:
1. Analisar APENAS o texto fornecido neste chunk específico
2. Identificar APENAS relações EXPLICITAMENTE mencionadas no texto
3. Procurar as entidades pelo seu "label" (nome) no texto do chunk
4. Para CADA relação encontrada, deve haver evidência textual clara
5. Quando há múltiplos pontos de acupuntura (ex: "VC4, R3, VB39, E36"), criar UMA relação separada para CADA ponto
6. A confidence_score deve refletir a clareza da evidência textual
7. NÃO inferir relações implícitas ou usar conhecimento externo
8. NÃO mencionar entidades que não estão presentes neste chunk

CHUNK A ANALISAR:
{chunk_text}

ENTIDADES DISPONÍVEIS (presentes neste documento):
{entities_json}

EVIDÊNCIAS RELEVANTES (para referência):
{evidences_json}

INSTRUÇÕES:
1. Leia o texto do chunk com atenção
2. Para cada par de entidades, procure se há relação mencionada
3. A relação deve estar EXPLÍCITA no texto do chunk
4. Se encontrar texto como "Tratamento VC4, R3, VB39, E36", crie 4 relações separadas
5. Use os IDs das entidades exatamente como fornecidos

EXEMPLO CONCRETO:
Chunk: "Deficiência do Jing do Rim - Manifestação: Fadiga, Tonturas. Tratamento: VC4, R3, VB39, E36"
Entidades: [
  {"id": "abc", "label": "Deficiência do Jing do Rim", "type": "syndrome"},
  {"id": "d1", "label": "Fadiga", "type": "symptom"},
  {"id": "d2", "label": "Tonturas", "type": "symptom"},
  {"id": "def", "label": "VC4", "type": "acupoint"},
  {"id": "ghi", "label": "R3", "type": "acupoint"},
  {"id": "jkl", "label": "VB39", "type": "acupoint"},
  {"id": "mno", "label": "E36", "type": "acupoint"}
]

Relações encontradas:
1. abc -> d1 (has_symptom): "Fadiga" mencionada como manifestação
2. abc -> d2 (has_symptom): "Tonturas" mencionada como manifestação
3. abc -> def (treated_by_acupoint): "VC4" listado no tratamento
4. abc -> ghi (treated_by_acupoint): "R3" listado no tratamento
5. abc -> jkl (treated_by_acupoint): "VB39" listado no tratamento
6. abc -> mno (treated_by_acupoint): "E36" listado no tratamento

Retorne JSON: { "relations": [ ... ] }
Exemplo de resposta: {
  "relations": [{
    "from_entity_id": "uuid1",
    "to_entity_id": "uuid2",
    "relation_type": "has_symptom",
    "textual_evidence": "Fadiga mencionada como manifestação",
    "evidence_ids": ["uuid3"],
    "confidence_score": 0.95,
    "extraction_rationale": "Relação direta entre síndrome e sintoma encontrada no texto do chunk"
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

    console.log("=== A3v2 AUTH DEBUG ===");
    console.log("Auth header present:", !!authHeader);
    console.log("Auth header value:", authHeader ? authHeader.substring(0, 30) + "..." : "none");
    console.log("Apikey header present:", !!apikeyHeader);

    if (!authHeader) {
      return new Response(
        JSON.stringify({
          code: 401,
          error: "Missing authorization header",
          message: "Missing authorization header"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    console.log("Supabase URL:", supabaseUrl);
    console.log("Anon key present:", !!supabaseAnonKey);

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    console.log("Calling getUser()...");
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    console.log("getUser() result - user:", !!user);
    console.log("getUser() result - error:", userError);

    if (userError || !user) {
      console.error("Auth error:", userError);
      console.error("Auth header:", authHeader?.substring(0, 20) + "...");
      console.log("==================");
      return new Response(
        JSON.stringify({
          code: 401,
          error: "Unauthorized",
          message: userError?.message || "Invalid JWT",
          errorMessage: userError?.message || "Invalid JWT",
          errorDetails: userError
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("User authenticated:", user.id);
    console.log("==================");

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

    console.log("A3v2 Processing source:", sourceId);

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
          agentVersion: "a3-v2.0.0",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: allChunks, error: chunksError } = await supabaseClient
      .from("kb_raw_chunks")
      .select("id, raw_text, sequence_number, page_reference")
      .eq("source_id", sourceId)
      .order("sequence_number", { ascending: true });

    if (chunksError) {
      throw new Error(`Failed to fetch chunks: ${chunksError.message}`);
    }

    if (!allChunks || allChunks.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No chunks found for this source",
          relationsCreated: 0,
          agentVersion: "a3-v2.0.0",
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

    const llmProvider = Deno.env.get("LLM_PROVIDER") || "gemini";
    const llmApiKey = llmProvider === "openai"
      ? Deno.env.get("OPENAI_API_KEY")!
      : Deno.env.get("GEMINI_API_KEY")!;

    const callLLM = llmProvider === "openai" ? callOpenAI : callGemini;

    const MAX_EXECUTION_TIME = 45000;
    let relationsCreated = 0;
    let processedChunks = 0;

    console.log(`A3v2: Processing ${allChunks.length} chunks with ${entities.length} entities`);

    for (const chunk of allChunks) {
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > MAX_EXECUTION_TIME) {
        console.log(`A3v2: Timeout approaching, stopping after ${processedChunks} chunks`);
        break;
      }

      const chunkEvidences = evidences?.filter(ev => ev.chunk_id === chunk.id) || [];

      if (chunkEvidences.length === 0) {
        console.log(`A3v2: Chunk ${chunk.sequence_number} has no evidence, skipping`);
        continue;
      }

      const chunkEntityIds = new Set(chunkEvidences.map(ev => {
        const entity = entities.find(e => e.evidence_id === ev.id);
        return entity?.id;
      }).filter(Boolean));

      const chunkEntities = entities.filter(e => chunkEntityIds.has(e.id));

      if (chunkEntities.length < 2) {
        console.log(`A3v2: Chunk ${chunk.sequence_number} has ${chunkEntities.length} entities, need at least 2`);
        continue;
      }

      const entitiesJson = JSON.stringify(chunkEntities.map(e => ({
        id: e.id,
        type: e.entity_type,
        label: e.entity_label,
        data: e.entity_data,
        evidence_id: e.evidence_id,
      })), null, 2);

      const evidencesJson = JSON.stringify(chunkEvidences.map(ev => ({
        id: ev.id,
        chunk_id: ev.chunk_id,
        text: ev.excerpt_text,
        type: ev.suggested_entity_type,
      })), null, 2);

      const prompt = A3V2_PROMPT
        .replace("{chunk_text}", chunk.raw_text)
        .replace("{entities_json}", entitiesJson)
        .replace("{evidences_json}", evidencesJson);

      console.log(`A3v2: Processing chunk ${processedChunks + 1}/${allChunks.length} (sequence ${chunk.sequence_number}, ${chunkEntities.length} entities)`);

      try {
        const responseText = await callLLM(A3V2_SYSTEM_PROMPT, prompt, llmApiKey);

        let response;
        try {
          response = JSON.parse(responseText);
        } catch (parseError) {
          console.error("A3v2: JSON parse error:", parseError);
          console.error("A3v2: Response text:", responseText.substring(0, 200));
          processedChunks++;
          continue;
        }

        const relations: RelationResponse[] = response.relations || [];

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
            console.log(`A3v2: Relation already exists, skipping: ${relation.from_entity_id} -> ${relation.to_entity_id} (${relation.relation_type})`);
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
              evidence_ids: relation.evidence_ids || [],
              confidence_score: relation.confidence_score || 0.5,
              extraction_rationale: relation.extraction_rationale || "",
              status: "pending",
              agent_version: "a3-v2.0.0",
            });

          if (!insertError) {
            relationsCreated++;
          } else {
            console.error("A3v2: Failed to insert relation:", insertError);
          }
        }

        processedChunks++;
      } catch (chunkError) {
        console.error(`A3v2: Error processing chunk ${processedChunks + 1}:`, chunkError);
        processedChunks++;
      }
    }

    console.log(`A3v2: Completed processing: ${processedChunks}/${allChunks.length} chunks, ${relationsCreated} relations created`);

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
          title: "Relações entre entidades identificadas (A3v2)",
          message: `${relationsCreated} relações foram identificadas por chunk-first e aguardam revisão`,
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
        chunksProcessed: processedChunks,
        executionTimeMs: executionTime,
        agentVersion: "a3-v2.0.0",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("A3v2 processing error:", error);

    const errorResponse = {
      error: error instanceof Error ? error.message : "Internal server error",
      details: error instanceof Error ? error.stack : undefined,
      agentVersion: "a3-v2.0.0",
    };

    console.error("A3v2: Returning error response:", JSON.stringify(errorResponse));

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
