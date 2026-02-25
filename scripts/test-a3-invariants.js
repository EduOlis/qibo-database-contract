import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testA3Invariants(sourceId) {
  console.log('\n=== A3 Invariants Validation ===\n');
  console.log(`Testing invariants for source: ${sourceId}\n`);

  let allTestsPassed = true;
  const results = [];

  async function runTest(name, description, query, params = []) {
    try {
      const { data, error } = await supabase.rpc('execute_sql', {
        query,
        params
      });

      if (error) {
        const { data: directData, error: directError } = await supabase
          .from('kb_entity_relations_proposals')
          .select('*')
          .eq('source_id', sourceId);

        if (directError) throw directError;

        console.log(`❌ ${name}: ${description}`);
        console.log(`   Error: ${error.message}\n`);
        results.push({ name, passed: false, error: error.message });
        allTestsPassed = false;
        return;
      }

      const violations = Array.isArray(data) ? data.length : (data?.violations || 0);

      if (violations === 0) {
        console.log(`✅ ${name}: ${description}`);
        results.push({ name, passed: true });
      } else {
        console.log(`❌ ${name}: ${description}`);
        console.log(`   Found ${violations} violations\n`);
        results.push({ name, passed: false, violations });
        allTestsPassed = false;
      }
    } catch (err) {
      console.log(`❌ ${name}: ${description}`);
      console.log(`   Exception: ${err.message}\n`);
      results.push({ name, passed: false, error: err.message });
      allTestsPassed = false;
    }
  }

  console.log('--- I. Input Invariants ---\n');

  await runTest(
    'I.1.1',
    'Only approved entities used',
    `
    SELECT COUNT(*) as violations
    FROM kb_entity_relations_proposals r
    JOIN kb_extracted_entities e1 ON r.from_entity_id = e1.id
    WHERE r.source_id = $1 AND e1.status != 'approved'
    `,
    [sourceId]
  );

  await runTest(
    'I.1.2',
    'All to_entities are approved',
    `
    SELECT COUNT(*) as violations
    FROM kb_entity_relations_proposals r
    JOIN kb_extracted_entities e2 ON r.to_entity_id = e2.id
    WHERE r.source_id = $1 AND e2.status != 'approved'
    `,
    [sourceId]
  );

  console.log('\n--- II. Processing Invariants ---\n');

  await runTest(
    'II.1.1',
    'No duplicate relations',
    `
    SELECT COUNT(*) as violations FROM (
      SELECT
        source_id,
        from_entity_id,
        to_entity_id,
        relation_type,
        COUNT(*) as dup_count
      FROM kb_entity_relations_proposals
      WHERE source_id = $1
      GROUP BY source_id, from_entity_id, to_entity_id, relation_type
      HAVING COUNT(*) > 1
    ) duplicates
    `,
    [sourceId]
  );

  await runTest(
    'II.2.1',
    'All relations have textual evidence',
    `
    SELECT COUNT(*) as violations
    FROM kb_entity_relations_proposals
    WHERE source_id = $1
      AND (
        textual_evidence IS NULL OR
        LENGTH(textual_evidence) <= 10 OR
        evidence_ids IS NULL OR
        ARRAY_LENGTH(evidence_ids, 1) = 0
      )
    `,
    [sourceId]
  );

  await runTest(
    'II.3.1',
    'Only valid relation types',
    `
    SELECT COUNT(*) as violations
    FROM kb_entity_relations_proposals
    WHERE source_id = $1
      AND relation_type NOT IN (
        'has_symptom',
        'has_clinical_sign',
        'treated_by_principle',
        'treated_by_acupoint',
        'causes',
        'alleviates',
        'contraindicated_with',
        'combined_with'
      )
    `,
    [sourceId]
  );

  await runTest(
    'II.4.1',
    'Confidence score in valid range',
    `
    SELECT COUNT(*) as violations
    FROM kb_entity_relations_proposals
    WHERE source_id = $1
      AND (confidence_score < 0.0 OR confidence_score > 1.0)
    `,
    [sourceId]
  );

  console.log('\n--- III. Output Invariants ---\n');

  await runTest(
    'III.1.1',
    'New relations created as pending',
    `
    SELECT COUNT(*) as violations
    FROM kb_entity_relations_proposals
    WHERE source_id = $1
      AND agent_version LIKE 'a3-%'
      AND (
        status != 'pending' OR
        reviewed_by IS NOT NULL OR
        reviewed_at IS NOT NULL
      )
    `,
    [sourceId]
  );

  await runTest(
    'III.2.1',
    'Agent version present',
    `
    SELECT COUNT(*) as violations
    FROM kb_entity_relations_proposals
    WHERE source_id = $1
      AND (
        agent_version IS NULL OR
        agent_version NOT LIKE 'a3-%'
      )
    `,
    [sourceId]
  );

  console.log('\n--- Direct Queries (Non-SQL) ---\n');

  const { data: relations, error: relError } = await supabase
    .from('kb_entity_relations_proposals')
    .select('*')
    .eq('source_id', sourceId);

  if (relError) {
    console.log(`❌ Failed to fetch relations: ${relError.message}\n`);
    allTestsPassed = false;
  } else {
    console.log(`Total relations for source: ${relations?.length || 0}`);

    const { data: pipelineStatus } = await supabase
      .from('kb_document_pipeline_status')
      .select('*')
      .eq('source_id', sourceId)
      .single();

    if (pipelineStatus) {
      console.log(`✅ Pipeline status updated correctly`);
      console.log(`   a2_status: ${pipelineStatus.a2_status}`);
      console.log(`   total_relations: ${pipelineStatus.total_relations}`);
    } else {
      console.log(`❌ Pipeline status not found or incomplete`);
      allTestsPassed = false;
    }
  }

  console.log('\n=== Summary ===\n');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  console.log(`Passed: ${passed}/${total}`);

  if (allTestsPassed) {
    console.log('\n✅ All A3 invariants are satisfied!\n');
  } else {
    console.log('\n❌ Some invariants were violated. Review the results above.\n');
  }

  return allTestsPassed;
}

const sourceId = process.argv[2];

if (!sourceId) {
  console.error('Usage: node test-a3-invariants.js <source_id>');
  process.exit(1);
}

testA3Invariants(sourceId)
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
