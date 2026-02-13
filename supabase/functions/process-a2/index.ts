import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const A2_CONTRACT_HASH = "a062eec91c7d535bcefb28dcdbdf65a54cf6613ddbb7093a65eb173aa500e94f";
const A2_VERSION = "1.0.0";

interface A2Request {
  sourceId: string;
}

const A2_SYSTEM_PROMPT = `Você é um assistente especializado em identificar tensões textuais sem interpretá-las. Retorne sempre JSON válido.`;

const A2_PROMPT = `Você é o agente A2 - Organização de Tensões Textuais.

RESPONSABILIDADE EXCLUSIVA:
Organizar e tornar visíveis tensões textuais explícitas presentes nos clusters do A1.

REGRAS ABSOLUTAS:
1. NUNCA formular hipóteses clínicas, diagnósticas ou sindrômicas
2. NUNCA sugerir, nomear ou insinuar padrões sindrômicos
3. NUNCA inferir relações causais, funcionais ou terapêuticas
4. NUNCA resolver conflitos textuais
5. NUNCA priorizar descrições com base em relevância clínica
6. NUNCA introduzir conhecimento externo ao corpus
7. Apenas ORGANIZAR e TORNAR VISÍVEIS tensões que já existem no texto

Tipos de tensões permitidas:
- contradiction: descrições explicitamente contraditórias
- terminology_variation: mesma entidade com termos diferentes
- incompatibility: descrições que não podem coexistir logicamente
- coexistence: descrições divergentes que aparecem juntas

Para cada tensão identificada, retorne:
- tension_type: tipo da tensão
- tension_description: descrição textual neutra da tensão
- cluster_ids: IDs dos clusters envolvidos
- evidence_ids: IDs das evidências envolvidas
- textual_basis: base textual literal da tensão

CLUSTERS PARA ANÁLISE:
{clusters_data}

Retorne apenas um JSON array de tensões, sem texto adicional.`;

async function callGemini(systemPrompt: string, userPrompt: string, apiKey: string): Promise<string> {
  const model = Deno.env.get("LLM_MODEL") || "gemini-1.5-flash";
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

    const requestData: A2Request = await req.json();
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

    const { data: clusters, error: clustersError } = await supabase
      .from("kb_evidence_clusters")
      .select("*")
      .eq("source_id", sourceId)
      .eq("status", "approved");

    if (clustersError) {
      throw new Error(`Failed to fetch clusters: ${clustersError.message}`);
    }

    if (!clusters || clusters.length === 0) {
      return new Response(
        JSON.stringify({ message: "No approved clusters found", tensionsCreated: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const evidenceIds = clusters.flatMap(c => c.evidence_ids);
    const { data: evidences, error: evidencesError } = await supabase
      .from("kb_evidence_excerpts")
      .select("*")
      .in("id", evidenceIds);

    if (evidencesError) {
      throw new Error(`Failed to fetch evidences: ${evidencesError.message}`);
    }

    const clustersData = clusters.map(cluster => {
      const clusterEvidences = evidences?.filter(e =>
        cluster.evidence_ids.includes(e.id)
      ) || [];

      return {
        cluster_id: cluster.id,
        cluster_label: cluster.cluster_label,
        evidences: clusterEvidences.map(e => ({
          id: e.id,
          text: e.excerpt_text,
          type: e.suggested_entity_type,
        })),
      };
    });

    const prompt = A2_PROMPT.replace(
      "{clusters_data}",
      JSON.stringify(clustersData, null, 2)
    );

    const responseText = await callLLM(A2_SYSTEM_PROMPT, prompt);
    const response = JSON.parse(responseText);
    const tensions = response.tensions || [];

    let totalTensions = 0;

    for (const tension of tensions) {
      const { error: insertError } = await supabase
        .from("kb_textual_tensions")
        .insert({
          source_id: sourceId,
          tension_type: tension.tension_type,
          tension_description: tension.tension_description,
          cluster_ids: tension.cluster_ids || [],
          evidence_ids: tension.evidence_ids || [],
          textual_basis: tension.textual_basis,
          agent_version: A2_VERSION,
          contract_hash: A2_CONTRACT_HASH,
          status: "pending",
        });

      if (!insertError) {
        totalTensions++;
      } else {
        console.error("Failed to insert tension:", insertError);
      }
    }

    const executionTime = Date.now() - startTime;

    await supabase
      .from("kb_document_pipeline_status")
      .update({
        a2_status: "completed",
        a2_completed_at: new Date().toISOString(),
      })
      .eq("source_id", sourceId);

    if (totalTensions > 0) {
      await supabase
        .from("kb_notifications")
        .insert({
          notification_type: "tension_detected",
          title: "Tensões textuais identificadas",
          message: `${totalTensions} tensões foram identificadas e aguardam revisão`,
          related_entity_type: "source",
          related_entity_id: sourceId,
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        clustersAnalyzed: clusters.length,
        tensionsCreated: totalTensions,
        executionTimeMs: executionTime,
        contractHash: A2_CONTRACT_HASH,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("A2 processing error:", error);

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
