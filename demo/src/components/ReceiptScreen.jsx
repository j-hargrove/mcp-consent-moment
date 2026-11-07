import { useState } from 'react';
import { Button, ConsentReceipt } from '@mcp-consent/react';

const stamp = (date) => {
  const day = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${time}`;
};

/** The first sentence is the honest headline, and the rest is the outcome line. */
const splitMessage = (message) => {
  const [, headline, outcome] = message.match(/^(.*?\.)\s*(.*)$/);
  return { headline, outcome };
};

const stepsFrom = events => events
  .filter(event => event.decision)
  .map(({ decision, serverId, toolName }) => ({
    kind: decision.kind,
    server: serverId,
    field: toolName,
    value: decision.value,
    line: decision.kind === 'high' ? 'high' : decision.kind === 'declined' ? 'ends' : 'granted',
  }));

function downloadReceipt(receipt) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: 'consent-receipt.json' });
  link.click();
  URL.revokeObjectURL(url);
}

/** Thesis 4: the budget as a record. What you decided, then what's left for you. */
export function ReceiptScreen({ completion, stopped, events, onReset }) {
  const [timestamp] = useState(() => stamp(new Date()));
  const [left, setLeft] = useState(() => (completion?.tasks ?? [])
    .filter(task => !task.done)
    .map(task => ({ label: task.label, done: false, alert: !task.leftover })));

  const { headline, outcome } = stopped
    ? {
      headline: 'Agent stopped.',
      outcome: stopped.byUser ? 'Nothing else will run.' : `Consent denied for ${stopped.toolName}.`,
    }
    : splitMessage(completion.message);
  const steps = stepsFrom(events);

  return (
    <div className="consent-card-wrap">
      <ConsentReceipt
        headline={headline}
        timestamp={timestamp}
        outcome={outcome}
        steps={steps}
        left={stopped ? null : left}
        autoFocus
        onToggleLeft={(label, done) => setLeft(items => items.map(i => (i.label === label ? { ...i, done } : i)))}
        primary={<Button icon="arrow-right" onClick={onReset}>Run Another Scenario</Button>}
        secondary={(
          <Button
            variant="secondary"
            icon="download"
            onClick={() => downloadReceipt({ timestamp, headline, outcome, decisions: steps, leftForYou: left })}
          >
            Export Receipt
          </Button>
        )}
      />
    </div>
  );
}
