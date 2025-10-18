import { useState } from 'react';
import type { DesignSuggestion } from '../../services/ai-suggestions.service';
import { analyzeCanvasDesign, isAISuggestionsAvailable } from '../../services/ai-suggestions.service';
import type { CanvasShape } from '../../types/canvas.types';
import { Button } from '../UI/Button';
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
        return '⚡';
      case 'spacing':
        return '📏';
      case 'color':
        return '🎨';
      case 'grouping':
        return '📦';
      case 'layout':
        return '🎯';
      default:
        return '✨';
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
                      <span>{getSeverityIcon(suggestion.severity)}</span>
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
                      <div className="ai-suggestion-applied">✓ Applied</div>
                    ) : (
                      <>
                        <Button onClick={() => handleApply(suggestion)} variant="primary">
                          Apply
                        </Button>
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

        <div className="ai-suggestions-footer">
          <button className="ai-suggestions-reanalyze" onClick={handleAnalyze} disabled={loading}>
            Re-analyze
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISuggestions;

