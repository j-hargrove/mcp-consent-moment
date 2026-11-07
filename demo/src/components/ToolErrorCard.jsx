import { Button, ConsentFrame, SectionLabel, Timeline, useCommitGuard } from '@mcp-consent/react';

/** Thesis 5: a failure the agent can't resolve comes back to the human at human tempo. */
export function ToolErrorCard({ decision, onDecision }) {
  // Try Refund Again moves money: a double click can't send it twice
  const guard = useCommitGuard();
  const skip = guard(() => onDecision('skip'));
  const retry = guard(() => onDecision('retry'));
  return (
    <div className="consent-card-wrap">
      <div className="card-context-header">The agent needs you to decide what happens next.</div>
      <ConsentFrame
        tier="alert"
        tool="payments.refund"
        server="payments"
        icon="purchase"
        decision={decision.title}
        autoFocus
        onEscape={skip}
        primary={<Button data-decision="skip" icon="arrow-right" onClick={skip}>Skip for Now</Button>}
        secondary={(
          <Button data-decision="retry" variant="secondary" icon="renew" onClick={retry}>
            Try Refund Again
          </Button>
        )}
      >
        <p>{decision.detail}</p>
        <SectionLabel icon="recently-viewed">WHAT HAPPENED</SectionLabel>
        <Timeline events={decision.timeline} />
        <p className="cm-muted">Skip for Now: the refund stays with you to finish.</p>
      </ConsentFrame>
    </div>
  );
}
