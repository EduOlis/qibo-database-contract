import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testA2() {
  try {
    // Get the first source with A1 completed
    const { data: sources, error: sourcesError } = await supabase
      .from('kb_document_pipeline_status')
      .select('source_id, a1_status')
      .eq('a1_status', 'completed')
      .limit(1);

    if (sourcesError) {
      console.error('Error fetching sources:', sourcesError);
      return;
    }

    if (!sources || sources.length === 0) {
      console.log('No sources with A1 completed found');
      return;
    }

    const sourceId = sources[0].source_id;
    console.log('Testing A2 for source:', sourceId);

    // Check clusters
    const { data: clusters, error: clustersError } = await supabase
      .from('kb_evidence_clusters')
      .select('*')
      .eq('source_id', sourceId);

    console.log('\n=== CLUSTERS ===');
    console.log('Total clusters:', clusters?.length || 0);
    console.log('Clusters:', JSON.stringify(clusters, null, 2));

    // Call A2
    const functionUrl = `${supabaseUrl}/functions/v1/process-a2`;
    console.log('\nCalling A2 function...');

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ sourceId })
    });

    const result = await response.json();
    console.log('\n=== A2 RESULT ===');
    console.log(JSON.stringify(result, null, 2));

    // Check tensions created
    const { data: tensions, error: tensionsError } = await supabase
      .from('kb_textual_tensions')
      .select('*')
      .eq('source_id', sourceId);

    console.log('\n=== TENSIONS ===');
    console.log('Total tensions:', tensions?.length || 0);
    if (tensions && tensions.length > 0) {
      console.log('Tensions:', JSON.stringify(tensions, null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testA2();
