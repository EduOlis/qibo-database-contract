import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const testUserToken = process.env.TEST_USER_TOKEN;

if (!supabaseUrl || !supabaseAnonKey || !testUserToken) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.log('Certifique-se de que TEST_USER_TOKEN está definido no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      Authorization: `Bearer ${testUserToken}`
    }
  }
});

async function testProcessP0(sourceId) {
  console.log('🔄 Testando process-p0...\n');

  const { data, error } = await supabase.functions.invoke('process-p0', {
    body: { source_id: sourceId }
  });

  if (error) {
    console.error('❌ Erro:', error);
    return null;
  }

  console.log('✅ P0 concluído:', data);
  return data;
}

async function testProcessA0(sourceId) {
  console.log('🔄 Testando process-a0...\n');

  const { data, error } = await supabase.functions.invoke('process-a0', {
    body: { source_id: sourceId }
  });

  if (error) {
    console.error('❌ Erro:', error);
    return null;
  }

  console.log('✅ A0 concluído:', data);
  return data;
}

async function testProcessA1(sourceId) {
  console.log('🔄 Testando process-a1...\n');

  const { data, error } = await supabase.functions.invoke('process-a1', {
    body: { source_id: sourceId }
  });

  if (error) {
    console.error('❌ Erro:', error);
    return null;
  }

  console.log('✅ A1 concluído:', data);
  return data;
}

async function testProcessA2(sourceId) {
  console.log('🔄 Testando process-a2...\n');

  const { data, error } = await supabase.functions.invoke('process-a2', {
    body: { source_id: sourceId }
  });

  if (error) {
    console.error('❌ Erro:', error);
    return null;
  }

  console.log('✅ A2 concluído:', data);
  return data;
}

async function testFullPipeline(sourceId) {
  console.log('🚀 Iniciando pipeline completo...\n');
  console.log('Source ID:', sourceId);
  console.log('─'.repeat(50));

  const p0Result = await testProcessP0(sourceId);
  if (!p0Result) return;

  console.log('\n' + '─'.repeat(50));

  const a0Result = await testProcessA0(sourceId);
  if (!a0Result) return;

  console.log('\n' + '─'.repeat(50));

  const a1Result = await testProcessA1(sourceId);
  if (!a1Result) return;

  console.log('\n' + '─'.repeat(50));

  const a2Result = await testProcessA2(sourceId);
  if (!a2Result) return;

  console.log('\n' + '═'.repeat(50));
  console.log('✅ Pipeline completo executado com sucesso!');
  console.log('═'.repeat(50));
}

async function listSources() {
  console.log('📚 Listando fontes disponíveis...\n');

  const { data, error } = await supabase
    .from('kb_sources')
    .select('id, title, file_name, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Erro ao listar fontes:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('Nenhuma fonte encontrada.');
    return;
  }

  console.log('Fontes disponíveis:');
  data.forEach((source, index) => {
    console.log(`${index + 1}. ${source.title}`);
    console.log(`   ID: ${source.id}`);
    console.log(`   Arquivo: ${source.file_name}`);
    console.log(`   Criado em: ${new Date(source.created_at).toLocaleString('pt-BR')}`);
    console.log('');
  });
}

// CLI
const command = process.argv[2];
const sourceId = process.argv[3];

async function main() {
  switch (command) {
    case 'list':
      await listSources();
      break;

    case 'p0':
      if (!sourceId) {
        console.error('❌ Forneça o source_id: npm run test-pipeline p0 <source_id>');
        process.exit(1);
      }
      await testProcessP0(sourceId);
      break;

    case 'a0':
      if (!sourceId) {
        console.error('❌ Forneça o source_id: npm run test-pipeline a0 <source_id>');
        process.exit(1);
      }
      await testProcessA0(sourceId);
      break;

    case 'a1':
      if (!sourceId) {
        console.error('❌ Forneça o source_id: npm run test-pipeline a1 <source_id>');
        process.exit(1);
      }
      await testProcessA1(sourceId);
      break;

    case 'a2':
      if (!sourceId) {
        console.error('❌ Forneça o source_id: npm run test-pipeline a2 <source_id>');
        process.exit(1);
      }
      await testProcessA2(sourceId);
      break;

    case 'full':
      if (!sourceId) {
        console.error('❌ Forneça o source_id: npm run test-pipeline full <source_id>');
        process.exit(1);
      }
      await testFullPipeline(sourceId);
      break;

    default:
      console.log(`
Script de Teste do Pipeline TCM Knowledge Base

Uso:
  node scripts/test-pipeline.js <comando> [source_id]

Comandos disponíveis:
  list        - Lista todas as fontes disponíveis
  p0          - Executa apenas o P0 (chunking) para um source_id
  a0          - Executa apenas o A0 (evidence extraction) para um source_id
  a1          - Executa apenas o A1 (clustering) para um source_id
  a2          - Executa apenas o A2 (tensions) para um source_id
  full        - Executa o pipeline completo (P0 → A0 → A1 → A2)

Exemplos:
  node scripts/test-pipeline.js list
  node scripts/test-pipeline.js p0 123e4567-e89b-12d3-a456-426614174000
  node scripts/test-pipeline.js full 123e4567-e89b-12d3-a456-426614174000

Nota: O script usa o TEST_USER_TOKEN do arquivo .env para autenticação.
      `);
  }
}

main().catch(console.error);
