import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const userToken = process.env.TEST_USER_TOKEN;

if (!supabaseUrl || !supabaseAnonKey || !userToken) {
  console.error('Missing environment variables');
  process.exit(1);
}

async function testA0() {
  try {
    console.log('=== Testando process-a0 corrigido ===\n');

    const chunkId = '96750c77-77c6-42e0-bdf4-e94063a4147e';
    console.log('Chunk ID:', chunkId);

    const apiUrl = `${supabaseUrl}/functions/v1/process-a0`;
    console.log('API URL:', apiUrl);
    console.log('\nChamando Edge Function...\n');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({
        chunkId: chunkId,
        profileId: 'a0-basic-v1',
      }),
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);

    const responseText = await response.text();
    console.log('\nResponse Body (first 2000 chars):');
    console.log(responseText.substring(0, 2000));

    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('\n=== SUCESSO ===');
      console.log('Evidências extraídas:', result.evidencesCreated);

      if (result.evidences && result.evidences.length > 0) {
        console.log('\n=== PRIMEIRA EVIDÊNCIA ===');
        const first = result.evidences[0];
        console.log('Tipo:', first.suggested_entity_type);
        console.log('Score:', first.relevance_score);
        console.log('Texto (primeiros 200 chars):', first.excerpt_text.substring(0, 200));
        console.log('Tamanho completo:', first.excerpt_text.length, 'caracteres');
      }
    } else {
      console.log('\n=== ERRO ===');
      try {
        const error = JSON.parse(responseText);
        console.log('Error:', error.error);
        console.log('Details:', error.details);
      } catch (e) {
        console.log('Erro ao fazer parse:', responseText);
      }
    }

  } catch (error) {
    console.error('\n=== EXCEÇÃO ===');
    console.error('Erro:', error.message);
    console.error('Stack:', error.stack);
  }
}

testA0();
