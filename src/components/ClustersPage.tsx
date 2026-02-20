import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Cluster {
  id: string;
  cluster_label: string;
  cluster_basis: string;
  evidence_ids: string[];
  status: string;
  confidence_level: number;
  created_at: string;
  source_id: string;
}

interface Source {
  id: string;
  title: string;
}

export default function ClustersPage() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [sources, setSources] = useState<Record<string, Source>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);

  useEffect(() => {
    fetchClusters();
  }, []);

  async function fetchClusters() {
    try {
      setLoading(true);

      const { data: clustersData, error: clustersError } = await supabase
        .from('kb_evidence_clusters')
        .select('*')
        .order('created_at', { ascending: false });

      if (clustersError) throw clustersError;

      setClusters(clustersData || []);

      const uniqueSourceIds = [...new Set(clustersData?.map(c => c.source_id) || [])];

      const { data: sourcesData, error: sourcesError } = await supabase
        .from('kb_sources')
        .select('id, title')
        .in('id', uniqueSourceIds);

      if (sourcesError) throw sourcesError;

      const sourcesMap: Record<string, Source> = {};
      sourcesData?.forEach(source => {
        sourcesMap[source.id] = source;
      });
      setSources(sourcesMap);

    } catch (error) {
      console.error('Error fetching clusters:', error);
      alert('Failed to fetch clusters');
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending':
        return { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' };
      case 'approved':
        return { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' };
      case 'rejected':
        return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
      default:
        return { bg: '#f3f4f6', text: '#1f2937', border: '#d1d5db' };
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '32px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          Loading clusters...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
            Evidence Clusters (A1 Output)
          </h1>
          <p style={{ color: '#6b7280' }}>
            Clusters created by A1 agent from approved evidences
          </p>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
              Total Clusters: {clusters.length}
            </h2>
          </div>

          {clusters.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: '#6b7280' }}>
              No clusters found. Process A1 to create clusters from approved evidences.
            </div>
          ) : (
            <div>
              {clusters.map((cluster) => {
                const statusColors = getStatusColor(cluster.status);
                return (
                  <div
                    key={cluster.id}
                    style={{
                      padding: '16px 24px',
                      borderBottom: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => setSelectedCluster(cluster)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: '600', color: '#2563eb' }}>
                        {cluster.cluster_label}
                      </span>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: statusColors.bg,
                        color: statusColors.text,
                        border: `1px solid ${statusColors.border}`
                      }}>
                        {cluster.status}
                      </span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        Confidence: {(cluster.confidence_level * 100).toFixed(0)}%
                      </span>
                    </div>

                    <p style={{
                      fontSize: '14px',
                      color: '#374151',
                      marginBottom: '8px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {cluster.cluster_basis}
                    </p>

                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6b7280' }}>
                      <span>
                        Source: {sources[cluster.source_id]?.title || cluster.source_id.substring(0, 8)}
                      </span>
                      <span>
                        {cluster.evidence_ids.length} evidence(s)
                      </span>
                      <span>
                        {new Date(cluster.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedCluster && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              zIndex: 50
            }}
            onClick={() => setSelectedCluster(null)}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                maxWidth: '768px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                position: 'sticky',
                top: 0,
                backgroundColor: 'white',
                borderBottom: '1px solid #e5e7eb',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                  {selectedCluster.cluster_label}
                </h3>
                <button
                  onClick={() => setSelectedCluster(null)}
                  style={{
                    color: '#9ca3af',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Status
                  </label>
                  {(() => {
                    const statusColors = getStatusColor(selectedCluster.status);
                    return (
                      <span style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: '500',
                        backgroundColor: statusColors.bg,
                        color: statusColors.text,
                        border: `1px solid ${statusColors.border}`
                      }}>
                        {selectedCluster.status}
                      </span>
                    );
                  })()}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Cluster Basis (Text)
                  </label>
                  <div style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '4px',
                    padding: '16px',
                    fontSize: '14px',
                    color: '#374151',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedCluster.cluster_basis}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Metadata
                  </label>
                  <div style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '4px',
                    padding: '16px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    color: '#6b7280',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div>ID: {selectedCluster.id}</div>
                    <div>Source: {selectedCluster.source_id}</div>
                    <div>Evidence IDs: {selectedCluster.evidence_ids.length} items</div>
                    <div>Confidence: {(selectedCluster.confidence_level * 100).toFixed(0)}%</div>
                    <div>Created: {new Date(selectedCluster.created_at).toLocaleString()}</div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Evidence IDs ({selectedCluster.evidence_ids.length})
                  </label>
                  <div style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: '4px',
                    padding: '16px',
                    maxHeight: '160px',
                    overflowY: 'auto'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {selectedCluster.evidence_ids.map((evidenceId, idx) => (
                        <div key={idx} style={{ fontSize: '12px', fontFamily: 'monospace', color: '#6b7280' }}>
                          {evidenceId}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
