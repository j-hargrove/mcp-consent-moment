import { renderSchemaFields } from '@mcp-consent/core';
import { ApprovalCheckbox, Button, ConsentFrame, DraftPreview, SectionLabel } from '@mcp-consent/react';

function decisionFor({ priority, title }) {
  const reference = title?.match(/[A-Z]+-\d+/)?.[0];
  const kind = priority ? `${priority}-priority ` : '';
  return `Create a new ${kind}ticket${reference ? ` for ${reference}` : ''}.`;
}

/**
 * Theses 1, 2, 3: first write to a server, showing the exact record it will create.
 * After approval the same card stays up, in place, while the tool returns the real ID.
 */
export function WriteCard({ request, committed, resultId, remember, onRememberChange, onResolve }) {
  const fields = renderSchemaFields(request.tool.inputSchema, request.args);
  const live = action => (committed ? undefined : action);
  return (
    <div className={`consent-card-wrap${committed ? ' consent-card-wrap--committed' : ''}`}>
      <div className="card-context-header">The agent wants to file a new support ticket.</div>
      <ConsentFrame
        tier="write"
        tool={request.tool.name}
        server={request.serverId}
        icon="receipt"
        decision={decisionFor(request.args)}
        autoFocus={!committed}
        onEscape={committed ? undefined : () => onResolve(false)}
        primary={
          <Button data-action={live('allow')} icon="arrow-right" onClick={() => onResolve(true)}>Create This Ticket</Button>
        }
        secondary={
          <Button data-action={live('deny')} variant="secondary" icon="close" onClick={() => onResolve(false)}>Deny</Button>
        }
      >
        <SectionLabel>WHAT GETS WRITTEN</SectionLabel>
        <DraftPreview id={resultId ?? 'ISS-new'} fields={fields} committed={committed} />
        <ApprovalCheckbox
          checked={remember}
          onChange={onRememberChange}
          consequence="Left unchecked, the agent asks again next time."
        >
          Don't ask again for new tickets on issue-tracker
        </ApprovalCheckbox>
      </ConsentFrame>
    </div>
  );
}
