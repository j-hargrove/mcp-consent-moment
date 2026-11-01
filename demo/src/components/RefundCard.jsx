import { useState } from 'react';
import { renderSchemaFields } from '@mcp-consent/core';
import {
  ApprovalCheckbox, Button, ConsentFrame, DestructivePanel, FieldRows, SectionLabel,
} from '@mcp-consent/react';

/**
 * Theses 2, 3, 5: money leaves and can't come back, so this gates every time.
 * There is no remember option: the absence is the message. Narrowest is doing nothing.
 */
export function RefundCard({ request, onResolve }) {
  const [reviewed, setReviewed] = useState(false);
  const [nudge, setNudge] = useState(false);

  const { amount_usd: amount, customer_id: customer } = request.args;
  const money = Number(amount).toFixed(2);
  const fields = renderSchemaFields(request.tool.inputSchema, request.args)
    .map(field => (field.name === 'amount_usd' ? { ...field, value: money } : field));

  const review = (checked) => {
    setReviewed(checked);
    setNudge(false);
  };

  const confirm = () => {
    if (!reviewed) {
      setNudge(true);
      return;
    }
    onResolve(true);
  };

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
        primary={<Button data-action="deny" icon="close" onClick={() => onResolve(false)}>Don't Refund</Button>}
        secondary={(
          <Button data-action="allow" variant="override" icon="arrow-right" onClick={confirm}>
            Confirm ${money} Refund
          </Button>
        )}
      >
        <SectionLabel icon="purchase">WHAT GETS SENT</SectionLabel>
        <FieldRows fields={fields} />
        <ApprovalCheckbox
          checked={reviewed}
          onChange={review}
          review
          consequence="Not remembered. Every refund asks again."
        >
          I've checked the amount and the customer.
        </ApprovalCheckbox>
        {nudge && <p className="cm-muted" role="status">Check the amount first.</p>}
      </ConsentFrame>
    </div>
  );
}
