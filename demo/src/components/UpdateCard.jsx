import { ApprovalCheckbox, Button, CausalTrace, ConsentFrame, SectionLabel } from '@mcp-consent/react';

const asText = value => String(value ?? 'not set');

/** Copy per tool: the card names the record it writes, never permission jargon. */
const COPY = {
  'issues.update': {
    icon: 'receipt',
    intro: 'The agent wants to update a support ticket.',
    decision: args => `Update ticket ${args.issue_id}.`,
    allow: 'Update This Ticket',
    remember: server => `Don't ask again for ticket updates on ${server}`,
    deny: 'Deny: nothing is written to the ticket.',
  },
  'crm.contacts.update': {
    icon: 'email',
    intro: "The agent wants to change a customer's email address.",
    decision: args => `Change the email on contact ${args.contact_id}.`,
    allow: 'Change This Email',
    remember: server => `Don't ask again for contact emails on ${server}`,
    deny: 'Deny: the contact keeps its current email.',
  },
};

/**
 * Theses 2, 4: a revoked write asks again on next use, showing exactly what it will write.
 * Each field is an open node: nothing here is granted until the human decides.
 */
export function UpdateCard({ request, remember, onRememberChange, onResolve }) {
  const copy = COPY[request.tool.name] ?? COPY['issues.update'];
  const steps = Object.keys(request.tool.inputSchema.properties).map(field => ({
    kind: 'new-open',
    field,
    value: asText(request.args[field]),
    line: 'none',
  }));

  return (
    <div className="consent-card-wrap">
      <div className="card-context-header">{copy.intro}</div>
      <ConsentFrame
        tier="write"
        tool={request.tool.name}
        server={request.serverId}
        icon={copy.icon}
        decision={copy.decision(request.args)}
        autoFocus
        onEscape={() => onResolve(false)}
        primary={<Button data-action="allow" icon="arrow-right" onClick={() => onResolve(true)}>{copy.allow}</Button>}
        secondary={<Button data-action="deny" variant="secondary" icon="close" onClick={() => onResolve(false)}>Deny</Button>}
      >
        <SectionLabel>WHAT GETS WRITTEN</SectionLabel>
        <CausalTrace steps={steps} />
        <ApprovalCheckbox
          kind="remember"
          checked={remember}
          onChange={onRememberChange}
          consequence="Left unchecked, the agent asks again next time."
        >
          {copy.remember(request.serverId)}
        </ApprovalCheckbox>
        <p className="cm-muted">{copy.deny}</p>
      </ConsentFrame>
    </div>
  );
}
