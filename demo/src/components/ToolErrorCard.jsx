import { Button, ConsentFrame, SectionLabel, Timeline } from '@mcp-consent/react';

/** Thesis 5: a failure the agent can't resolve comes back to the human at human tempo. */
export function ToolErrorCard({ decision, onDecision }) {
  return (
    <div className="consent-card-wrap">
      <div className="card-context-header">The agent needs you to decide what happens next.</div>
      <ConsentFrame
        tier="alert"
        tool="payments.refund"
        server="payments"
        icon="purchase"
        decision={decision.title}
        primary={<Button data-decision="skip" icon="arrow-right" onClick={() => onDecision('skip')}>Skip for Now</Button>}
        secondary={(
          <Button data-decision="retry" variant="secondary" icon="renew" onClick={() => onDecision('retry')}>
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
