import { useState } from 'react';
import { ApprovalCheckbox, Button, CausalTrace, ConsentFrame, SectionLabel } from '@mcp-consent/react';

/** What each linked field changes on the other server. Salmon half-fill: reversible, so not film red. */
const FIELD_NOTES = {
  billing_contact: 'Follows the CRM email automatically',
  'card_on_file.notify_to': 'Card receipts and fraud alerts go to the new address',
};

/** The granted field as the CRM names it on the trace. */
const GRANTED_LABEL = { email: 'contact.email' };

const serverOf = (request, field) => request.tool.inputSchema.properties[field]['x-mcp-server'] ?? request.serverId;

/** True when a scope-creep request carries fields to a server other than the one asking. */
export const isCrossServer = request => Boolean(request?.isCreep)
  && request.newFields.some(field => serverOf(request, field) !== request.serverId);

/**
 * Thesis 4: a change that crosses servers is a new decision, every time.
 * Primary changes the granting server only. Approval covers the checked fields and is never remembered.
 */
export function MultiHopCard({ request, before = {}, onKeep, onApprove }) {
  const [selected, setSelected] = useState([]);
  const [nudge, setNudge] = useState(false);

  const { newFields, serverId } = request;
  const hopServer = serverOf(request, newFields[0]);
  const grantedFields = Object.keys(GRANTED_LABEL).filter(field => field in request.args);
  const change = field => `${before.email ?? 'not set'} → ${request.args[field]}`;

  const toggle = (field, on) => {
    setNudge(false);
    setSelected(prev => newFields.filter(f => (f === field ? on : prev.includes(f))));
  };

  const approve = () => {
    if (selected.length === 0) {
      setNudge(true);
      return;
    }
    // Cross-server changes are never remembered
    onApprove(selected, false);
  };

  const steps = [
    ...grantedFields.map((field, i) => ({
      kind: 'granted',
      server: serverId,
      field: GRANTED_LABEL[field],
      value: change(field),
      line: 'granted',
      hopTo: i === grantedFields.length - 1 ? hopServer : undefined,
    })),
    ...newFields.map(field => ({
      kind: 'new-half',
      server: serverOf(request, field),
      field: `+ ${field}`,
      value: change(field),
      note: FIELD_NOTES[field],
      line: 'ends',
      control: (
        <ApprovalCheckbox checked={selected.includes(field)} onChange={on => toggle(field, on)}>
          Approve {field}
        </ApprovalCheckbox>
      ),
    })),
  ];

  return (
    <div className="consent-card-wrap">
      <div className="card-context-header">The agent wants to change a customer's email address.</div>
      <ConsentFrame
        tier="scope-creep"
        tool={request.tool.name}
        server={serverId}
        icon="link"
        decision={`Changing this email also changes ${newFields.length} things on ${hopServer}, a server you haven't granted.`}
        primary={<Button data-action="deny" icon="arrow-right" onClick={onKeep}>Change CRM Only</Button>}
        secondary={
          <Button data-action="allow" variant="secondary" icon="checkmark" onClick={approve}>
            Approve Selected · {selected.length} of {newFields.length}
          </Button>
        }
      >
        <SectionLabel icon="recently-viewed">YOUR CURRENT GRANT</SectionLabel>
        <CausalTrace steps={steps} />
        <p className="cm-muted">Not remembered. Cross-server changes ask every time.</p>
        <p className="cm-muted">Change CRM Only: {hopServer} keeps the old address until someone updates it.</p>
        {nudge && <p className="cm-muted" role="status">Check at least one field first.</p>}
      </ConsentFrame>
    </div>
  );
}
