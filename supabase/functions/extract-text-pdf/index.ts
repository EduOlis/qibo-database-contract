import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function extractTextFromPDF(pdfBuffer: Uint8Array): Promise<string> {
  try {
    const pdfLib = await import("npm:pdf-parse@1.1.1");
    const data = await pdfLib.default(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    throw new Error("Failed to extract text from PDF");
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const contentType = req.headers.get("content-type");

    if (contentType?.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return new Response(
          JSON.stringify({ error: "No file provided" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const text = await extractTextFromPDF(uint8Array);

      return new Response(
        JSON.stringify({
          success: true,
          text: text,
          filename: file.name,
          size: file.size,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (contentType?.includes("application/json")) {
      const { fileUrl } = await req.json();

      if (!fileUrl) {
        return new Response(
          JSON.stringify({ error: "No fileUrl provided" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        throw new Error("Failed to fetch file from URL");
      }

      const arrayBuffer = await fileResponse.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const text = await extractTextFromPDF(uint8Array);

      return new Response(
        JSON.stringify({
          success: true,
          text: text,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid content type" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error:", error);

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
