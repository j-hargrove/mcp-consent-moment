import { useState } from 'react';
import {
  Alert, AgentStatus, ApprovalCheckbox, Button, CausalTrace, ConsentFrame, ConsentReceipt,
  DestructivePanel, HopConnector, Icon, ICON_TONES, SectionLabel, TierChip, TraceNode,
} from '@mcp-consent/react';
import { ICON_PATHS } from '../../../packages/consent-react/icon-paths.js';

const VARIANTS = [
  ['primary', 'Create This Ticket', 'arrow-right'],
  ['secondary', 'Approve Selected · 0 of 2', 'checkmark'],
  ['ghost', 'Deny', 'close'],
  ['override', 'Confirm $149.00 Refund', 'arrow-right'],
];
const FORCES = [undefined, 'hover', 'focus', 'active'];
const TIERS = ['read', 'write', 'scope-creep', 'destructive', 'alert'];
const NODES = ['granted', 'new-half', 'new-open', 'high', 'declined'];

const Cap = ({ children }) => <span className="g-cap">{children}</span>;
const Section = ({ title, children }) => (
  <section className="g-section">
    <SectionLabel>{title}</SectionLabel>
    {children}
  </section>
);

function ButtonMatrix({ surface }) {
  return VARIANTS.map(([variant, label, icon]) => (
    <div className="g-row" key={variant}>
      {FORCES.map(force => (
        <div className="g-cell" key={force ?? 'rest'}>
          <Cap>{variant} · {force ?? 'rest'}</Cap>
          <Button variant={variant} surface={surface} icon={icon} force={force}>{label}</Button>
        </div>
      ))}
    </div>
  ));
}

function ScopeCreepTrace() {
  const [assignee, setAssignee] = useState(false);
  const [labels, setLabels] = useState(true);
  return (
    <CausalTrace
      steps={[
        { kind: 'granted', server: 'issue-tracker', field: 'status, resolution_note', value: 'open → resolved', line: 'ends' },
        {
          kind: 'new-half', field: '+ assignee', note: 'Moves ownership to another team', line: 'ends',
          control: <ApprovalCheckbox checked={assignee} onChange={setAssignee}>Approve assignee</ApprovalCheckbox>,
        },
        {
          kind: 'new-open', field: '+ labels', note: 'Tags only',
          control: <ApprovalCheckbox checked={labels} onChange={setLabels}>Approve labels</ApprovalCheckbox>,
        },
      ]}
    />
  );
}

const HOP_STEPS = [
  { kind: 'granted', server: 'crm', field: 'contact.email', value: 'a@old.example → a@new.example', line: 'ends', hopTo: 'payments' },
  { kind: 'new-half', server: 'payments', field: '+ billing_contact', note: 'Follows the CRM email automatically', line: 'ends' },
  { kind: 'new-half', server: 'payments', field: '+ card_on_file.notify_to', note: 'Card receipts and fraud alerts go to the new address' },
];

const DECIDED_ALL = [
  { kind: 'granted', server: 'issue-tracker', field: 'issues.create', value: 'ISS-1847' },
  { kind: 'high', server: 'payments', field: 'payments.refund', value: '$149.00 to cust-7291', line: 'high' },
  { kind: 'granted', server: 'issue-tracker', field: 'issues.update', value: 'assignee, labels approved' },
];
const DECIDED_PARTIAL = [
  { kind: 'granted', server: 'issue-tracker', field: 'issues.create', value: 'ISS-1847' },
  { kind: 'declined', server: 'payments', field: 'payments.refund', value: 'Not refunded' },
];

export function Gallery() {
  const [write, setWrite] = useState(false);
  const [review, setReview] = useState(false);
  const [left, setLeft] = useState([{ label: 'Issue the $149.00 refund', done: false }]);

  return (
    <main className="g">
      <h1 className="g-title">CONSENT MOMENT · COMPONENTS</h1>

      <Section title="ICONS">
        <div className="g-row">
          {Object.keys(ICON_PATHS).map(name => (
            <div className="g-cell" key={name}><Icon name={name} tone={ICON_TONES[name]} /><Cap>{name}</Cap></div>
          ))}
        </div>
      </Section>

      <Section title="BUTTON · ON SURFACE">
        <div className="g-pane g-section"><ButtonMatrix surface="surface" /></div>
      </Section>
      <Section title="BUTTON · ON RED">
        <div className="g-red g-section"><ButtonMatrix surface="red" /></div>
      </Section>

      <Section title="TIER CHIP">
        <div className="g-row">
          {TIERS.map(t => <TierChip key={t} tier={t} />)}
          {TIERS.slice(0, 4).map(t => <TierChip key={t} tier={t} compact />)}
        </div>
        <div className="g-red g-row"><TierChip tier="destructive" onPanel /><Cap>destructive on red panel</Cap></div>
      </Section>

      <Section title="TRACE NODE">
        <div className="g-row">
          {NODES.map(k => <div className="g-cell" key={k}><TraceNode kind={k} /><Cap>{k}</Cap></div>)}
        </div>
      </Section>

      <Section title="HOP CONNECTOR">
        <div className="g-pane"><HopConnector server="payments" /></div>
      </Section>

      <Section title="APPROVAL CHECKBOX">
        <div className="g-pane g-row">
          <ApprovalCheckbox checked={false}>Off</ApprovalCheckbox>
          <ApprovalCheckbox checked>On</ApprovalCheckbox>
          <ApprovalCheckbox checked={false} review>Review first</ApprovalCheckbox>
          <ApprovalCheckbox checked review>Review done</ApprovalCheckbox>
          <ApprovalCheckbox checked={write} onChange={setWrite} consequence="Applies to new tickets only.">
            Don't ask again for new tickets on issue-tracker
          </ApprovalCheckbox>
        </div>
      </Section>

      <Section title="AGENT LIGHT AND STATUS LINE">
        <div className="g-pane g-row">
          <AgentStatus state="working">reading customers.read</AgentStatus>
          <AgentStatus state="speaking">filing support ticket</AgentStatus>
          <AgentStatus state="waiting">paused → waiting for you</AgentStatus>
          <AgentStatus state="stopped">agent stopped</AgentStatus>
        </div>
      </Section>

      <Section title="CAUSAL TRACE">
        <div className="g-cards">
          <div className="g-cell g-pane"><Cap>grant ends, new fields</Cap><ScopeCreepTrace /></div>
          <div className="g-cell g-pane"><Cap>cross-server hop</Cap><CausalTrace steps={HOP_STEPS} /></div>
          <div className="g-cell g-pane"><Cap>record with high node</Cap><CausalTrace steps={DECIDED_ALL} /></div>
          <div className="g-cell g-pane"><Cap>record with declined node</Cap><CausalTrace steps={DECIDED_PARTIAL} /></div>
        </div>
      </Section>

      <Section title="CONSENT CARD FRAME">
        <div className="g-cards">
          <ConsentFrame tier="read" tool="customers.read" server="company-data" icon="view">
            <p>Read tier never interrupts. This frame is the quiet baseline.</p>
          </ConsentFrame>
          <ConsentFrame
            tier="write" tool="issues.create" server="issue-tracker" icon="receipt"
            primary={<Button icon="arrow-right">Create This Ticket</Button>}
            secondary={<Button variant="secondary" icon="close">Deny</Button>}
            decision="Create a new high-priority ticket for PAY-503."
          />
          <ConsentFrame
            tier="scope-creep" tool="issues.update" server="issue-tracker" icon="maximize"
            primary={<Button icon="arrow-right">Keep Current Grant</Button>}
            secondary={<Button variant="secondary" icon="checkmark">Approve Selected · 1 of 2</Button>}
            decision="issue-tracker wants to write 2 fields it didn't have before."
          />
          <ConsentFrame
            tier="scope-creep" tool="crm.contacts.update" icon="link"
            decision="Changing this email also changes 2 things on payments, a server you haven't granted."
            primary={<Button icon="arrow-right">Change CRM Only</Button>}
            secondary={<Button variant="secondary" icon="checkmark">Approve Selected · 0 of 2</Button>}
          >
            <p className="cm-muted">Change CRM Only: payments keeps the old address until someone updates it.</p>
          </ConsentFrame>
          <ConsentFrame
            tier="alert" tool="payments.refund" server="payments" icon="purchase"
            primary={<Button icon="arrow-right">Skip for Now</Button>}
            secondary={<Button variant="secondary" icon="renew">Try Refund Again</Button>}
            decision="The $149.00 refund failed twice."
          />
          <ConsentFrame
            tier="destructive"
            panel={<DestructivePanel tool="payments.refund" icon="purchase" value="$149.00" detail="to customer cust-7291 · can't be undone" />}
            primary={<Button icon="close">Don't Refund</Button>}
            secondary={<Button variant="override" icon="arrow-right">Confirm $149.00 Refund</Button>}
          >
            <ApprovalCheckbox checked={review} onChange={setReview} review consequence="Not remembered. Every refund asks again.">
              I've checked the amount and the customer.
            </ApprovalCheckbox>
          </ConsentFrame>
          <ConsentFrame
            tier="receipt"
            panel={<>
              <div className="cm-panel__row cm-panel__row--between">
                <span className="cm-panel__label"><Icon name="security" /> CONSENT RECEIPT</span>
                <span className="cm-panel__time">12:14 PM</span>
              </div>
            </>}
          >
            <p>Frame only. The full receipt is below.</p>
          </ConsentFrame>
        </div>
      </Section>

      <Section title="ALERT">
        <div className="g-cards">
          <Alert
            title="The $149.00 refund failed twice."
            primary={<Button icon="arrow-right">Skip for Now</Button>}
            secondary={<Button variant="secondary" icon="renew">Try Refund Again</Button>}
          >
            No money moved.
          </Alert>
          <div className="g-cell g-pane">
            <Cap>passive notice</Cap>
            <Alert tone="passive">Connection lost, retrying</Alert>
          </div>
        </div>
      </Section>

      <Section title="CONSENT RECEIPT">
        <div className="g-cards">
          <ConsentReceipt
            timestamp="Nov 1, 2026 · 12:14 PM"
            outcome="Bug triaged, ticket filed, refund issued."
            steps={DECIDED_ALL}
            primary={<Button icon="arrow-right">Run Another Scenario</Button>}
            secondary={<Button variant="secondary" icon="download">Export Receipt</Button>}
          />
          <ConsentReceipt
            timestamp="Nov 1, 2026 · 12:14 PM"
            headline="2 of 3 done."
            outcome="Bug triaged and ticket filed. Refund not issued."
            steps={DECIDED_PARTIAL}
            left={left}
            onToggleLeft={(label, done) => setLeft(items => items.map(i => (i.label === label ? { ...i, done } : i)))}
            primary={<Button icon="arrow-right">Run Another Scenario</Button>}
            secondary={<Button variant="secondary" icon="download">Export Receipt</Button>}
          />
        </div>
      </Section>
    </main>
  );
}
