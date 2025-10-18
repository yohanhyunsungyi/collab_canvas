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
    icon={
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r=".5"></circle>
        <circle cx="17.5" cy="10.5" r=".5"></circle>
        <circle cx="8.5" cy="7.5" r=".5"></circle>
        <circle cx="6.5" cy="12.5" r=".5"></circle>
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
      </svg>
    }
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

