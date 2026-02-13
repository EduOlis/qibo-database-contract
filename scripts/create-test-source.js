import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const testUserToken = process.env.TEST_USER_TOKEN;
const testUserId = process.env.TEST_USER_ID;

if (!supabaseUrl || !supabaseAnonKey || !testUserToken || !testUserId) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.log('Execute primeiro: npm run get-token');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      Authorization: `Bearer ${testUserToken}`
    }
  }
});

async function createTestSource() {
  console.log('📝 Criando fonte de teste...\n');

  const testSource = {
    source_type: 'book',
    title: 'Documento de Teste - Síndrome de Deficiência de Qi do Baço',
    author: 'Sistema de Teste',
    file_name: 'test_document.txt',
    file_path: 'test/test_document.txt',
    created_by: testUserId,
    notes: 'Documento criado automaticamente para testes do pipeline',
    metadata: {
      is_test: true,
      created_at: new Date().toISOString()
    }
  };

  const { data, error } = await supabase
    .from('kb_sources')
    .insert(testSource)
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao criar fonte:', error);
    return null;
  }

  console.log('✅ Fonte criada com sucesso!\n');
  console.log('Source ID:', data.id);
  console.log('Título:', data.title);
  console.log('Tipo:', data.source_type);
  console.log('\n');

  // Criar alguns chunks de teste
  console.log('📄 Criando chunks de teste...\n');

  const testChunks = [
    {
      source_id: data.id,
      raw_text: 'A Síndrome de Deficiência de Qi do Baço (Pi Qi Xu) é uma condição comum na Medicina Tradicional Chinesa. Caracteriza-se por sintomas como fadiga, falta de apetite, distensão abdominal e fezes amolecidas.',
      language: 'pt',
      page_reference: '1',
      processed: false,
      raw_text_hash: 'hash1',
      p0_version: 'v1.0.0',
      execution_profile: 'p0-pdf-text-v1'
    },
    {
      source_id: data.id,
      raw_text: 'Os pontos de acupuntura recomendados para tratar Deficiência de Qi do Baço incluem: BP6 (San Yin Jiao), E36 (Zu San Li), BP3 (Tai Bai) e VC12 (Zhong Wan). Estes pontos tonificam o Qi do Baço e harmonizam o sistema digestivo.',
      language: 'pt',
      page_reference: '2',
      processed: false,
      raw_text_hash: 'hash2',
      p0_version: 'v1.0.0',
      execution_profile: 'p0-pdf-text-v1'
    },
    {
      source_id: data.id,
      raw_text: 'Princípios terapêuticos: Tonificar o Qi do Baço, fortalecer a função de transporte e transformação. A dieta também é fundamental: evitar alimentos frios e crus, preferir alimentos mornos e de fácil digestão.',
      language: 'pt',
      page_reference: '3',
      processed: false,
      raw_text_hash: 'hash3',
      p0_version: 'v1.0.0',
      execution_profile: 'p0-pdf-text-v1'
    }
  ];

  const { data: chunksData, error: chunksError } = await supabase
    .from('kb_raw_chunks')
    .insert(testChunks)
    .select();

  if (chunksError) {
    console.error('❌ Erro ao criar chunks:', chunksError);
    return data;
  }

  console.log(`✅ ${chunksData.length} chunks criados com sucesso!\n`);

  // Criar status do pipeline
  const pipelineStatus = {
    source_id: data.id,
    p0_status: 'completed',
    p0_completed_at: new Date().toISOString(),
    total_chunks: chunksData.length,
    processed_chunks: 0
  };

  const { error: statusError } = await supabase
    .from('kb_document_pipeline_status')
    .insert(pipelineStatus);

  if (statusError) {
    console.error('⚠️  Aviso ao criar status do pipeline:', statusError);
  } else {
    console.log('✅ Status do pipeline inicializado!\n');
  }

  console.log('═'.repeat(50));
  console.log('Fonte de teste pronta para usar!');
  console.log('═'.repeat(50));
  console.log('\nAgora você pode testar o pipeline:');
  console.log(`npm run test-pipeline a0 ${data.id}`);
  console.log(`npm run test-pipeline full ${data.id}`);
  console.log('\n');

  return data;
}

createTestSource().catch(console.error);
