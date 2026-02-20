import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const llmProvider = Deno.env.get("LLM_PROVIDER") || "not set";
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const llmModel = Deno.env.get("LLM_MODEL") || "not set";

    const config = {
      llmProvider,
      llmModel,
      hasGeminiKey: !!geminiKey,
      hasOpenaiKey: !!openaiKey,
      hasAnthropicKey: !!anthropicKey,
      geminiKeyLength: geminiKey ? geminiKey.length : 0,
      openaiKeyLength: openaiKey ? openaiKey.length : 0,
      anthropicKeyLength: anthropicKey ? anthropicKey.length : 0,
    };

    return new Response(
      JSON.stringify(config, null, 2),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
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
