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

async function chunkText(text: string, minChunkSize: number = 1000, maxChunkSize: number = 3000): Promise<string[]> {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);

  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChunkSize) {
      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      const sentences = paragraph.split(/([.!?]+\s+)/);
      let tempChunk = '';

      for (const sentence of sentences) {
        if (tempChunk.length + sentence.length > maxChunkSize && tempChunk.length >= minChunkSize) {
          chunks.push(tempChunk.trim());
          tempChunk = sentence;
        } else if (tempChunk.length + sentence.length > maxChunkSize) {
          const words = (tempChunk + sentence).split(/\s+/);
          let wordChunk = '';

          for (const word of words) {
            if (wordChunk.length + word.length + 1 > maxChunkSize && wordChunk.length >= minChunkSize) {
              chunks.push(wordChunk.trim());
              wordChunk = word;
            } else {
              wordChunk += (wordChunk.length > 0 ? ' ' : '') + word;
            }
          }

          if (wordChunk.trim().length > 0) {
            tempChunk = wordChunk;
          }
        } else {
          tempChunk += sentence;
        }
      }

      if (tempChunk.trim().length > 0) {
        currentChunk = tempChunk;
      }
      continue;
    }

    const potentialLength = currentChunk.length + paragraph.length + (currentChunk.length > 0 ? 2 : 0);

    if (potentialLength > maxChunkSize && currentChunk.length >= minChunkSize) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else if (potentialLength > maxChunkSize && currentChunk.length < minChunkSize) {
      currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + paragraph;
      if (currentChunk.length >= minChunkSize) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
    } else {
      currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

function calculateRelevanceScore(text: string): number {
  const lowerText = text.toLowerCase();

  const tcmKeywords = [
    'síndrome', 'sindrome', 'syndrome',
    'sintoma', 'sintomas', 'symptom', 'symptoms',
    'sinal clínico', 'sinais clínicos', 'clinical sign',
    'princípio terapêutico', 'principio terapeutico', 'therapeutic principle',
    'acuponto', 'acupontos', 'acupoint', 'acupoints', 'ponto',
    'qi', 'yin', 'yang', 'meridiano', 'meridian',
    'baço', 'fígado', 'rim', 'coração', 'pulmão', 'estômago',
    'spleen', 'liver', 'kidney', 'heart', 'lung', 'stomach',
    'agulha', 'needle', 'moxabustão', 'moxa', 'ventosa',
    'deficiência', 'excesso', 'estagnação', 'umidade', 'calor', 'frio',
    'deficiency', 'excess', 'stagnation', 'dampness', 'heat', 'cold',
    'tonificar', 'dispersar', 'regular', 'harmonizar',
    'tonify', 'disperse', 'regulate', 'harmonize',
    'diagnóstico', 'tratamento', 'terapia', 'medicina chinesa', 'tcm',
    'diagnosis', 'treatment', 'therapy', 'chinese medicine'
  ];

  let matchCount = 0;
  let totalKeywordChars = 0;

  for (const keyword of tcmKeywords) {
    const regex = new RegExp(keyword, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      matchCount += matches.length;
      totalKeywordChars += matches.length * keyword.length;
    }
  }

  const keywordDensity = totalKeywordChars / text.length;
  const keywordFrequency = matchCount / (text.length / 100);

  let score = (keywordDensity * 0.6) + (keywordFrequency * 0.4);

  score = Math.min(1.0, Math.max(0.0, score));

  if (score > 0.8) score = 0.95;
  else if (score > 0.6) score = 0.80;
  else if (score > 0.4) score = 0.65;
  else if (score > 0.2) score = 0.50;
  else if (score > 0.1) score = 0.35;
  else score = 0.20;

  return score;
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
        created_by: user.id,
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
          raw_text: chunk.raw_text,
          raw_text_hash: chunk.text_hash,
          sequence_number: chunk.sequence_number,
          language: chunk.language,
          page_reference: chunk.page_reference,
          processed: false,
          p0_version: "1.2.0",
          execution_profile: executionProfile,
          relevance_score: calculateRelevanceScore(chunk.raw_text),
          relevance_calculated_at: new Date().toISOString(),
          skip_processing: false,
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
