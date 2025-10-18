import './EmptyState.css';

interface EmptyStateProps {
  icon?: string | React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Empty state component for when there's no content to display
 * Provides helpful guidance and optional call-to-action
 */
export const EmptyState = ({ 
  icon, 
  title, 
  description, 
  action, 
  className = '' 
}: EmptyStateProps) => {
  return (
    <div className={`empty-state ${className}`}>
      {icon && (
        <div className="empty-state-icon">
          {typeof icon === 'string' ? <span>{icon}</span> : icon}
        </div>
      )}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && (
        <button className="empty-state-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
};

/**
 * Pre-configured empty states for common scenarios
 */
export const EmptyCanvas = () => (
  <EmptyState
    icon="🎨"
    title="Your canvas is empty"
    description="Start creating by selecting a shape from the toolbar, or use AI commands to generate designs."
  />
);

export const EmptyHistory = () => (
  <EmptyState
    icon="💬"
    title="No AI commands yet"
    description="Try asking the AI to create shapes, arrange layouts, or build complex components."
  />
);

export const EmptyComments = () => (
  <EmptyState
    icon="💭"
    title="No comments yet"
    description="Click the comment tool and add your first annotation to the canvas."
  />
);

export const EmptyPresence = () => (
  <EmptyState
    icon="👥"
    title="No collaborators online"
    description="Share your canvas link to invite others to collaborate in real-time."
  />
);

export default EmptyState;

