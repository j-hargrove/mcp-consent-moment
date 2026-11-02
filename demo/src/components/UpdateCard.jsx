import { ApprovalCheckbox, Button, CausalTrace, ConsentFrame, SectionLabel } from '@mcp-consent/react';

const asText = value => String(value ?? 'not set');

/**
 * Theses 2, 4: a revoked write asks again on next use, showing exactly what it will write.
 * Each field is an open node: nothing here is granted until the human decides.
 */
export function UpdateCard({ request, remember, onRememberChange, onResolve }) {
  const steps = Object.keys(request.tool.inputSchema.properties).map(field => ({
    kind: 'new-open',
    field,
    value: asText(request.args[field]),
    line: 'none',
  }));

  return (
    <div className="consent-card-wrap">
      <div className="card-context-header">The agent wants to update a support ticket.</div>
      <ConsentFrame
        tier="write"
        tool={request.tool.name}
        server={request.serverId}
        icon="receipt"
        decision={`Update ticket ${request.args.issue_id}.`}
        primary={<Button data-action="allow" icon="arrow-right" onClick={() => onResolve(true)}>Update This Ticket</Button>}
        secondary={<Button data-action="deny" variant="secondary" icon="close" onClick={() => onResolve(false)}>Deny</Button>}
      >
        <SectionLabel>WHAT GETS WRITTEN</SectionLabel>
        <CausalTrace steps={steps} />
        <ApprovalCheckbox
          checked={remember}
          onChange={onRememberChange}
          consequence="Left unchecked, the agent asks again next time."
        >
          Don't ask again for ticket updates on {request.serverId}
        </ApprovalCheckbox>
        <p className="cm-muted">Deny: nothing is written to the ticket.</p>
      </ConsentFrame>
    </div>
  );
}
