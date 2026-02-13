import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface P0Request {
  sourceTitle: string;
  sourceAuthor?: string;
  sourceYear?: number;
  sourceType: string;
  rawText: string;
  executionProfile: string;
  notes?: string;
  fileName?: string;
}

interface Chunk {
  raw_text: string;
  text_hash: string;
  sequence_number: number;
  language: string;
  page_reference?: string;
}

function calculateSHA256(text: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  return crypto.subtle.digest("SHA-256", data).then(buffer => {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  });
}

function detectLanguage(text: string): string {
  const portugueseWords = ['de', 'da', 'do', 'em', 'para', 'com', 'por', 'uma', 'um', 'os', 'as'];
  const englishWords = ['the', 'of', 'and', 'to', 'in', 'is', 'for', 'that', 'with', 'on'];
  const chinesePattern = /[\u4e00-\u9fa5]/;

  if (chinesePattern.test(text)) {
    return 'zh';
  }

  const lowerText = text.toLowerCase();
  const portugueseCount = portugueseWords.filter(word =>
    lowerText.includes(` ${word} `)
  ).length;
  const englishCount = englishWords.filter(word =>
    lowerText.includes(` ${word} `)
  ).length;

  if (portugueseCount > englishCount) {
    return 'pt';
  } else if (englishCount > 0) {
    return 'en';
  }

  return 'unknown';
}

async function chunkText(text: string, maxChunkSize: number = 2000): Promise<string[]> {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);

  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

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

    const requestData: P0Request = await req.json();
    const { sourceTitle, sourceAuthor, sourceYear, sourceType, rawText, executionProfile, notes, fileName } = requestData;

    if (!sourceTitle || !rawText || !executionProfile) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: sourceTitle, rawText, executionProfile" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const actualFileName = fileName || `${sourceTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    const filePath = `text/${actualFileName}`;

    const { data: sourceData, error: sourceError } = await supabase
      .from("kb_sources")
      .insert({
        title: sourceTitle,
        author: sourceAuthor,
        year: sourceYear,
        source_type: sourceType,
        notes: notes,
        file_name: actualFileName,
        file_path: filePath,
      })
      .select()
      .single();

    if (sourceError) {
      throw new Error(`Failed to create source: ${sourceError.message}`);
    }

    const sourceId = sourceData.id;

    const textChunks = await chunkText(rawText);
    const language = detectLanguage(rawText);

    const chunksToInsert: Chunk[] = [];

    for (let i = 0; i < textChunks.length; i++) {
      const chunkText = textChunks[i];
      const hash = await calculateSHA256(chunkText);

      chunksToInsert.push({
        raw_text: chunkText,
        text_hash: hash,
        sequence_number: i + 1,
        language: language,
        page_reference: `chunk-${i + 1}`,
      });
    }

    const { error: chunksError } = await supabase
      .from("kb_raw_chunks")
      .insert(
        chunksToInsert.map(chunk => ({
          source_id: sourceId,
          ...chunk,
          processed: false,
        }))
      );

    if (chunksError) {
      throw new Error(`Failed to insert chunks: ${chunksError.message}`);
    }

    const executionTime = Date.now() - startTime;

    const { error: logError } = await supabase
      .from("kb_ingestion_logs")
      .insert({
        source_id: sourceId,
        agent_name: "P0",
        agent_version: "1.2.0",
        execution_profile: executionProfile,
        operation_type: "ingestion_chunking",
        status: "success",
        execution_time_ms: executionTime,
        summary: `Successfully processed ${textChunks.length} chunks from "${sourceTitle}"`,
      });

    if (logError) {
      console.error("Failed to insert log:", logError);
    }

    const { error: pipelineError } = await supabase
      .from("kb_document_pipeline_status")
      .insert({
        source_id: sourceId,
        p0_status: "completed",
        p0_completed_at: new Date().toISOString(),
        total_chunks: textChunks.length,
        processed_chunks: 0,
      });

    if (pipelineError) {
      console.error("Failed to insert pipeline status:", pipelineError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sourceId: sourceId,
        chunksCreated: textChunks.length,
        executionTimeMs: executionTime,
        language: language,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("P0 processing error:", error);

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
