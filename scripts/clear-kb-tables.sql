-- Script para limpar todas as tabelas KB
-- ATENÇÃO: Isso vai deletar TODOS os dados das tabelas de Knowledge Base

-- Limpar na ordem correta respeitando foreign keys
DELETE FROM kb_validation_actions;
DELETE FROM kb_tension_groups;
DELETE FROM kb_evidence_conflicts;
DELETE FROM kb_entity_relations;
DELETE FROM kb_textual_tensions;
DELETE FROM kb_evidence_clusters;
DELETE FROM kb_entity_proposals;
DELETE FROM kb_evidence_excerpts;
DELETE FROM kb_raw_chunks;
DELETE FROM kb_document_pipeline_status;
DELETE FROM kb_notifications WHERE related_entity_type IN ('source', 'chunk', 'evidence');
DELETE FROM kb_sources;

-- Verificar que está tudo limpo
SELECT 'kb_sources' as table_name, COUNT(*) as count FROM kb_sources
UNION ALL
SELECT 'kb_raw_chunks', COUNT(*) FROM kb_raw_chunks
UNION ALL
SELECT 'kb_evidence_excerpts', COUNT(*) FROM kb_evidence_excerpts
UNION ALL
SELECT 'kb_entity_proposals', COUNT(*) FROM kb_entity_proposals
UNION ALL
SELECT 'kb_evidence_clusters', COUNT(*) FROM kb_evidence_clusters
UNION ALL
SELECT 'kb_textual_tensions', COUNT(*) FROM kb_textual_tensions
UNION ALL
SELECT 'kb_entity_relations', COUNT(*) FROM kb_entity_relations
UNION ALL
SELECT 'kb_evidence_conflicts', COUNT(*) FROM kb_evidence_conflicts
UNION ALL
SELECT 'kb_tension_groups', COUNT(*) FROM kb_tension_groups
UNION ALL
SELECT 'kb_validation_actions', COUNT(*) FROM kb_validation_actions
UNION ALL
SELECT 'kb_document_pipeline_status', COUNT(*) FROM kb_document_pipeline_status;
