import { useState } from 'react';
import { renderSchemaFields } from '@mcp-consent/core';
import {
  ApprovalCheckbox, Button, ConsentFrame, DestructivePanel, FieldRows, SectionLabel,
  useCommitGuard, useDeliberateBeat,
} from '@mcp-consent/react';

/**
 * Theses 2, 3, 5: money leaves and can't come back, so this gates every time.
 * There is no remember option: the absence is the message. Narrowest is doing nothing.
 */
export function RefundCard({ request, onResolve }) {
  const [reviewed, setReviewed] = useState(false);
  const [nudge, setNudge] = useState(false);
  // Confirm goes live after motion.duration.deliberate. Never disabled: an early click nudges instead
  const live = useDeliberateBeat();
  // Both buttons share one guard: after either commits, repeat clicks are ignored
  const guard = useCommitGuard();

  const { amount_usd: amount, customer_id: customer } = request.args;
  const money = Number(amount).toFixed(2);
  const fields = renderSchemaFields(request.tool.inputSchema, request.args)
    .map(field => (field.name === 'amount_usd' ? { ...field, value: money } : field));

  const review = (checked) => {
    setReviewed(checked);
    setNudge(false);
  };

  const confirm = guard(() => {
    if (!live || !reviewed) {
      setNudge(true);
      return false;
    }
    onResolve(true);
    return true;
  });
  const dontRefund = guard(() => onResolve(false));

  return (
    <div className="consent-card-wrap">
      <div className="card-context-header">The agent wants to issue a refund.</div>
      <ConsentFrame
        tier="destructive"
        panel={(
          <DestructivePanel
            tool={request.tool.name}
            server={request.serverId}
            icon="purchase"
            value={`$${money}`}
            detail={`to customer ${customer} · can't be undone`}
          />
        )}
        autoFocus
        onEscape={dontRefund}
        footnote="Not remembered. Every refund asks again."
        primary={<Button data-action="deny" icon="close" onClick={dontRefund}>Don't Refund</Button>}
        secondary={(
          <Button data-action="allow" data-live={live || undefined} variant="override" icon="arrow-right" onClick={confirm}>
            Confirm ${money} Refund
          </Button>
        )}
      >
        <SectionLabel icon="purchase">WHAT GETS SENT</SectionLabel>
        <FieldRows fields={fields} />
        {/* Required, not optional: its own section, decision weight. Slate icon, since forest means approved */}
        <SectionLabel icon="checkmark" tone={null}>BEFORE YOU CONFIRM</SectionLabel>
        <ApprovalCheckbox kind="review" checked={reviewed} onChange={review}>
          I've checked the amount and the customer.
        </ApprovalCheckbox>
        {nudge && <p className="cm-muted" role="status">Check the amount first.</p>}
      </ConsentFrame>
    </div>
  );
}
