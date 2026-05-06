import { useState } from 'react';
import type { AEOScore } from '../../types/ocdp';
import { getRecommendations } from '../../utils/aeoCalculator';

const GRADE_STYLE: Record<string, { bg: string; color: string }> = {
  A: { bg: 'var(--aeo-a-bg)', color: 'var(--aeo-a)' },
  B: { bg: 'var(--aeo-b-bg)', color: 'var(--aeo-b)' },
  C: { bg: 'var(--aeo-c-bg)', color: 'var(--aeo-c)' },
  D: { bg: 'var(--aeo-d-bg)', color: 'var(--aeo-d)' },
  F: { bg: 'var(--aeo-f-bg)', color: 'var(--aeo-f)' },
};

interface AEOAssessmentModalProps {
  score: AEOScore;
  pageName: string;
  onProceed: () => void;
  onCancel: () => void;
}

export function AEOAssessmentModal({ score, pageName, onProceed, onCancel }: AEOAssessmentModalProps) {
  const [showDetails, setShowDetails] = useState(false);
  const g = GRADE_STYLE[score.grade] ?? GRADE_STYLE.F;
  const recommendations = getRecommendations(score);
  const hasIssues = score.grade === 'D' || score.grade === 'F';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, maxWidth: 600, width: '100%',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px', borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: 0 }}>
              AEO / SEO Assessment
            </h2>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>
              {pageName}
            </p>
          </div>
          <button onClick={onCancel} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 24, color: '#9CA3AF', lineHeight: 1, padding: 0,
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {/* Score Card */}
          <div style={{
            background: g.bg, borderRadius: 12, padding: 20,
            border: `2px solid ${g.color}20`, marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 32,
                background: g.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, fontWeight: 800, color: '#fff', flexShrink: 0,
              }}>
                {score.grade}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: g.color, lineHeight: 1 }}>
                  {score.score}
                </div>
                <div style={{ fontSize: 13, color: g.color, marginTop: 4, opacity: 0.8 }}>
                  out of 100 points
                </div>
              </div>
            </div>

            {/* Score bar */}
            <div style={{
              height: 8, background: 'rgba(0,0,0,0.1)', borderRadius: 4,
              overflow: 'hidden', marginBottom: 12,
            }}>
              <div style={{
                height: '100%', width: `${score.score}%`,
                background: g.color, borderRadius: 4, transition: 'width 0.6s ease-out',
              }} />
            </div>

            {hasIssues && (
              <div style={{
                padding: '10px 14px', background: 'rgba(220,38,38,0.1)',
                borderRadius: 8, fontSize: 12, color: '#DC2626', fontWeight: 600,
              }}>
                ⚠��� Low score detected. Consider improving content before submission.
              </div>
            )}
          </div>

          {/* Quick Summary */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 12,
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: 0 }}>
                Score Breakdown
              </h3>
              <button onClick={() => setShowDetails(!showDetails)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, color: '#DB0011', padding: '4px 8px',
              }}>
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {score.breakdown.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: showDetails ? '10px 12px' : '6px 12px',
                  background: item.pass ? '#F0FDF4' : '#FEF2F2',
                  borderRadius: 8, border: `1px solid ${item.pass ? '#BBF7D0' : '#FECACA'}`,
                  transition: 'all 0.2s',
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>
                    {item.pass ? '✅' : '❌'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600,
                      color: item.pass ? '#166534' : '#991B1B',
                    }}>
                      {item.label}
                    </div>
                    {showDetails && item.recommendation && (
                      <div style={{
                        fontSize: 11, color: '#6B7280', marginTop: 4,
                        fontStyle: 'italic',
                      }}>
                        �� {item.recommendation}
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    color: item.pass ? '#166534' : '#991B1B',
                    flexShrink: 0,
                  }}>
                    {item.score}/{item.maxScore}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div style={{
              padding: '14px 16px', background: '#FFF7ED',
              border: '1px solid #FED7AA', borderRadius: 10,
            }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: '#C2410C',
                marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                💡 Recommendations
              </div>
              <ul style={{
                margin: 0, paddingLeft: 20, fontSize: 12, color: '#9A3412',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                {recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 28px', borderTop: '1px solid #E5E7EB',
          display: 'flex', gap: 10,
        }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '10px', fontSize: 13, fontWeight: 600,
            background: 'transparent', color: '#6B7280',
            border: '1px solid #D1D5DB', borderRadius: 8, cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button onClick={onCancel} style={{
            flex: 1, padding: '10px', fontSize: 13, fontWeight: 600,
            background: '#EFF6FF', color: '#1D4ED8',
            border: '1px solid #BFDBFE', borderRadius: 8, cursor: 'pointer',
          }}>
            Improve Content
          </button>
          <button onClick={onProceed} style={{
            flex: 1, padding: '10px', fontSize: 13, fontWeight: 700,
            background: hasIssues ? '#F59E0B' : '#DB0011', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer',
          }}>
            {hasIssues ? '⚠️ Submit Anyway' : '✓ Submit for Approval'}
          </button>
        </div>
      </div>
    </div>
  );
}
