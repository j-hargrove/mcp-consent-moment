import { useState } from 'react';
import { ApprovalCheckbox, Button, CausalTrace, ConsentFrame, SectionLabel } from '@mcp-consent/react';

/** How much each new field matters: drives the node and says what it changes. */
const FIELD_NOTES = {
  assignee: { kind: 'new-half', note: 'Moves ownership to another team' },
  labels: { kind: 'new-open', note: 'Tags only' },
};

const formatValue = value => (Array.isArray(value) ? value.join(', ') : String(value ?? 'not set'));

/**
 * Thesis 4: a server asking for more re-prompts and never silently expands.
 * Primary keeps the grant as it is. Approval covers only the fields checked here.
 */
export function CreepCard({ request, onKeep, onApprove }) {
  const [selected, setSelected] = useState([]);
  const [remember, setRemember] = useState(false);
  const [nudge, setNudge] = useState(false);

  const newFields = request.newFields;
  const properties = Object.keys(request.tool.inputSchema.properties);
  const grantedFields = properties.filter(field => !newFields.includes(field));

  const toggle = (field, on) => {
    setNudge(false);
    setSelected(prev => newFields.filter(f => (f === field ? on : prev.includes(f))));
  };

  const approve = () => {
    if (selected.length === 0) {
      setNudge(true);
      return;
    }
    onApprove(selected, remember);
  };

  const steps = [
    ...grantedFields.map((field, i) => ({
      kind: 'granted',
      field,
      value: formatValue(request.args[field]),
      line: i === grantedFields.length - 1 ? 'ends' : 'granted',
    })),
    ...newFields.map(field => ({
      ...FIELD_NOTES[field],
      field: `+ ${field}`,
      value: formatValue(request.args[field]),
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
      <div className="card-context-header">The agent wants to expand what it can write to this server.</div>
      <ConsentFrame
        tier="scope-creep"
        tool={request.tool.name}
        server={request.serverId}
        icon="maximize"
        autoFocus
        onEscape={onKeep}
        decision={`${request.serverId} wants to write ${newFields.length} fields it didn't have before.`}
        primary={<Button data-action="deny" icon="arrow-right" onClick={onKeep}>Keep Current Grant</Button>}
        secondary={
          <Button data-action="allow" variant="secondary" icon="checkmark" onClick={approve}>
            Approve Selected · {selected.length} of {newFields.length}
          </Button>
        }
      >
        <SectionLabel icon="recently-viewed">YOUR CURRENT GRANT</SectionLabel>
        <CausalTrace steps={steps} />
        <ApprovalCheckbox
          checked={remember}
          onChange={setRemember}
          consequence="Left unchecked, approval covers this update only and the grant stays as it was."
        >
          Remember {selected.length ? `${selected.join(' and ')} ` : ''}for {request.serverId}
        </ApprovalCheckbox>
        <p className="cm-muted">
          Keep Current Grant: the ticket updates with the {grantedFields.length} granted fields.
        </p>
        {nudge && <p className="cm-muted" role="status">Check at least one field first.</p>}
      </ConsentFrame>
    </div>
  );
}
