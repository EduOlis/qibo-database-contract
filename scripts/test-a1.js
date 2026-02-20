import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const userToken = process.env.TEST_USER_TOKEN;

if (!supabaseUrl || !supabaseAnonKey || !userToken) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testA1() {
  try {
    console.log('=== Testando process-a1 ===\n');

    const sourceId = '49d0b4d7-9f9d-4653-9058-373193dee1f2';
    console.log('Source ID:', sourceId);

    const apiUrl = `${supabaseUrl}/functions/v1/process-a1`;
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
        sourceId: sourceId,
        profileId: 'a1-basic-v1',
      }),
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);

    const responseText = await response.text();
    console.log('\nResponse Body:');
    console.log(responseText);

    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('\n=== SUCESSO ===');
      console.log('Clusters criados:', result.clustersCreated);
      console.log('Audit:', JSON.stringify(result.audit, null, 2));
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

testA1();
