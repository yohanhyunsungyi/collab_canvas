import { useState } from 'react';
import type { DesignSuggestion } from '../../services/ai-suggestions.service';
import { analyzeCanvasDesign, isAISuggestionsAvailable } from '../../services/ai-suggestions.service';
import type { CanvasShape } from '../../types/canvas.types';
import { Spinner } from '../UI/Spinner';
import './AISuggestions.css';

interface AISuggestionsProps {
  shapes: CanvasShape[];
  onApplySuggestion: (suggestion: DesignSuggestion) => void;
  onClose: () => void;
}

export const AISuggestions = ({ shapes, onApplySuggestion, onClose }: AISuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<DesignSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  const handleAnalyze = async () => {
    if (!isAISuggestionsAvailable()) {
      setError('AI service is not configured. Please add your OpenAI API key.');
      return;
    }

    if (shapes.length === 0) {
      setError('Canvas is empty. Add some shapes first!');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await analyzeCanvasDesign(shapes);
      setSuggestions(result);
      setAnalyzed(true);
      
      if (result.length === 0) {
        setError('No improvements needed! Your design looks great.');
      }
    } catch (err) {
      console.error('Error analyzing design:', err);
      setError('Failed to analyze design. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (suggestion: DesignSuggestion) => {
    onApplySuggestion(suggestion);
    setAppliedSuggestions((prev) => new Set(prev).add(suggestion.id));
  };

  const handleDismiss = (suggestionId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return '⚠️';
      case 'medium':
        return '💡';
      case 'low':
        return 'ℹ️';
      default:
        return '📌';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alignment':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="21" y1="10" x2="3" y2="10"></line>
            <line x1="21" y1="6" x2="3" y2="6"></line>
            <line x1="21" y1="14" x2="3" y2="14"></line>
            <line x1="21" y1="18" x2="3" y2="18"></line>
          </svg>
        );
      case 'spacing':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
            <line x1="15" y1="3" x2="15" y2="21"></line>
          </svg>
        );
      case 'color':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r=".5"></circle>
            <circle cx="17.5" cy="10.5" r=".5"></circle>
            <circle cx="8.5" cy="7.5" r=".5"></circle>
            <circle cx="6.5" cy="12.5" r=".5"></circle>
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
          </svg>
        );
      case 'grouping':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        );
      case 'layout':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
        );
      case 'completeness':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z"></path>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z"></path>
          </svg>
        );
    }
  };

  return (
    <div className="ai-suggestions-overlay" onClick={onClose}>
      <div className="ai-suggestions-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ai-suggestions-header">
          <h2>Design Suggestions</h2>
          <button className="ai-suggestions-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="ai-suggestions-content">
          {!analyzed && !loading && (
            <div className="ai-suggestions-intro">
              <div className="ai-suggestions-intro-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
              <h3>Improve Your Design</h3>
              <p>
                Our AI will analyze your canvas and suggest improvements for alignment, spacing,
                colors, and layout.
              </p>
              <button className="ai-suggestions-analyze-button" onClick={handleAnalyze} disabled={shapes.length === 0}>
                {shapes.length === 0 ? 'Canvas is Empty' : 'Analyze Design'}
              </button>
            </div>
          )}

          {loading && (
            <div className="ai-suggestions-loading">
              <Spinner size="large" label="Analyzing your design..." />
            </div>
          )}

          {error && !loading && (
            <div className="ai-suggestions-error">
              <div className="ai-suggestions-error-icon">
                {error.includes('great') ? (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                    <line x1="9" y1="9" x2="9.01" y2="9"></line>
                    <line x1="15" y1="9" x2="15.01" y2="9"></line>
                  </svg>
                ) : (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                )}
              </div>
              <p>{error}</p>
              {!error.includes('great') && (
                <button className="ai-suggestions-analyze-button" onClick={handleAnalyze}>Try Again</button>
              )}
            </div>
          )}

          {analyzed && !loading && suggestions.length > 0 && (
            <div className="ai-suggestions-list">
              <div className="ai-suggestions-summary">
                Found {suggestions.length} improvement{suggestions.length !== 1 ? 's' : ''}
              </div>

              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`ai-suggestion-card ${
                    appliedSuggestions.has(suggestion.id) ? 'applied' : ''
                  }`}
                >
                  <div className="ai-suggestion-header">
                    <div className="ai-suggestion-type">
                      <span className="ai-suggestion-type-icon">{getTypeIcon(suggestion.type)}</span>
                      <span className="ai-suggestion-type-label">
                        {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}
                      </span>
                    </div>
                    <div
                      className="ai-suggestion-severity"
                      style={{ color: getSeverityColor(suggestion.severity) }}
                    >
                      <span>{suggestion.severity}</span>
                    </div>
                  </div>

                  <h4 className="ai-suggestion-title">{suggestion.title}</h4>
                  <p className="ai-suggestion-description">{suggestion.description}</p>

                  {suggestion.changes && suggestion.changes.length > 0 && (
                    <div className="ai-suggestion-changes">
                      <div className="ai-suggestion-changes-title">Changes:</div>
                      {suggestion.changes.slice(0, 3).map((change, idx) => (
                        <div key={idx} className="ai-suggestion-change">
                          • {change.property}: {change.oldValue} → {change.newValue}
                        </div>
                      ))}
                      {suggestion.changes.length > 3 && (
                        <div className="ai-suggestion-change-more">
                          + {suggestion.changes.length - 3} more changes
                        </div>
                      )}
                    </div>
                  )}

                  {suggestion.newElements && suggestion.newElements.length > 0 && (
                    <div className="ai-suggestion-changes">
                      <div className="ai-suggestion-changes-title">New Elements:</div>
                      {suggestion.newElements.slice(0, 3).map((element, idx) => (
                        <div key={idx} className="ai-suggestion-change">
                          • Add {element.type}: {element.text || `at (${Math.round(element.x)}, ${Math.round(element.y)})`}
                        </div>
                      ))}
                      {suggestion.newElements.length > 3 && (
                        <div className="ai-suggestion-change-more">
                          + {suggestion.newElements.length - 3} more elements
                        </div>
                      )}
                    </div>
                  )}

                  <div className="ai-suggestion-actions">
                    {appliedSuggestions.has(suggestion.id) ? (
                      <div className="ai-suggestion-applied">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Applied
                      </div>
                    ) : (
                      <>
                        <button
                          className="ai-suggestion-apply"
                          onClick={() => handleApply(suggestion)}
                        >
                          Apply
                        </button>
                        <button
                          className="ai-suggestion-dismiss"
                          onClick={() => handleDismiss(suggestion.id)}
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {analyzed && (
          <div className="ai-suggestions-footer">
            <button className="ai-suggestions-reanalyze" onClick={handleAnalyze} disabled={loading}>
              Re-analyze
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISuggestions;

