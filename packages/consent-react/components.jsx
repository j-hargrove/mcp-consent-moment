/**
 * Consent Moment design-system components.
 * Styled by styles.css, which reads only the token variables from tokens.json.
 * Thesis map: chips and frames (2, 5), trace and receipt (3, 4), buttons (2).
 */

import { Fragment, useEffect, useId, useRef } from 'react';
import { ICON_PATHS } from './icon-paths.js';
import { readSize, useTypedText } from './motion.js';

/** Assigned colors from theme-decisions.md. Everything else inherits ink or slate. */
export const ICON_TONES = {
  bot: 'agent',
  'warning-alt': 'alert',
  'stop-sign': 'alert',
  checkmark: 'approved',
  'recently-viewed': 'time',
};

export function Icon({ name, tone, className = '' }) {
  const { viewBox, paths } = ICON_PATHS[name];
  return (
    <svg className={`cm-icon ${className}`} data-name={name} data-tone={tone} viewBox={viewBox} aria-hidden="true" focusable="false">
      {paths.map(d => <path key={d} d={d} />)}
    </svg>
  );
}

/** variant: primary | secondary | ghost | override. surface: surface | red. */
export function Button({ variant = 'primary', surface = 'surface', icon, force, children, ...props }) {
  return (
    <button type="button" className="cm-btn" data-variant={variant} data-surface={surface} data-force={force} {...props}>
      <span>{children}</span>
      {icon && <Icon name={icon} />}
    </button>
  );
}

const TIER_LABELS = {
  read:          ['READ', 'READ'],
  write:         ['WRITE', 'WRITE'],
  'scope-creep': ['SCOPE CREEP', 'CREEP'],
  destructive:   ['DESTRUCTIVE', 'DEST'],
  alert:         ['ALERT', 'ALERT'],
};

export function TierChip({ tier, compact = false, onPanel = false }) {
  return (
    <span className="cm-chip" data-tier={tier} data-compact={compact || undefined} data-on-panel={onPanel || undefined}>
      {tier === 'alert' && <Icon name="warning-alt" />}
      {TIER_LABELS[tier][compact ? 1 : 0]}
    </span>
  );
}

/** tone overrides the icon's assigned color; null keeps the label's slate. */
export function SectionLabel({ icon, tone = ICON_TONES[icon], children }) {
  return (
    <div className="cm-section-label">
      {icon && <Icon name={icon} tone={tone ?? undefined} />}
      <span>{children}</span>
    </div>
  );
}

/** Primary always sits on the left: it is the narrowest choice. */
function CardActions({ primary, secondary, actionsRef }) {
  if (!primary && !secondary) return null;
  return (
    <div className="cm-frame__actions" ref={actionsRef}>
      {primary}
      {secondary}
    </div>
  );
}

/**
 * One column (below size.breakpoint-m): a gate that opens off screen scrolls into view, card top first,
 * and focus lands on the primary without a second jump. Reduced motion jumps with no smooth scroll.
 * Two columns: the card is already in view, so focus alone, as before.
 */
function revealGate(actions, button) {
  if (!button) return;
  const card = actions.closest('.consent-card-wrap') ?? actions.closest('.cm-frame');
  if (!window.matchMedia(`(width < ${readSize('breakpoint-m')})`).matches || !card) {
    button.focus();
    return;
  }
  const { top, bottom } = card.getBoundingClientRect();
  const inView = top >= 0 && bottom <= window.innerHeight;
  if (!inView) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    card.scrollIntoView({ block: 'start', behavior: reduced ? 'instant' : 'smooth' });
  }
  button.focus({ preventScroll: true });
}

/**
 * Gate keyboard rules (behavior-and-motion.md 2, 3).
 * autoFocus: focus lands on the primary (narrow) action when the card opens.
 * onEscape: Escape anywhere takes the safe choice. Enter on anything but a button takes the primary.
 * A button with explicit focus keeps its own Enter, so nothing broader ever has a shortcut.
 */
function useGateKeys({ autoFocus, onEscape }) {
  const actionsRef = useRef(null);
  const escapeRef = useRef(onEscape);
  escapeRef.current = onEscape;
  const primary = () => actionsRef.current?.querySelector('button');

  useEffect(() => {
    if (autoFocus) revealGate(actionsRef.current, primary());
  }, [autoFocus]);

  useEffect(() => {
    if (!onEscape) return undefined;
    const onKey = (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      escapeRef.current?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [Boolean(onEscape)]);

  const onKeyDown = onEscape ? (event) => {
    if (event.key !== 'Enter' || event.defaultPrevented) return;
    if (event.target.closest('button, a, textarea')) return;
    event.preventDefault();
    primary()?.click();
  } : undefined;

  return { actionsRef, onKeyDown };
}

/** kind: granted | new-half | new-open | high | declined */
export function TraceNode({ kind }) {
  return <span className="cm-node" data-kind={kind} aria-hidden="true" />;
}

/** The only place a trace crosses servers. Same-server steps just continue the line. */
export function HopConnector({ server }) {
  return (
    <div className="cm-hop">
      <span className="cm-hop__rule" />
      <span className="cm-hop__label">crosses to {server} · not granted</span>
    </div>
  );
}

const STATE_WORD = {
  granted: 'approved',
  'new-half': 'new, higher consequence',
  'new-open': 'new, low consequence',
  high: 'high consequence',
  declined: 'declined',
};

const isNew = kind => kind === 'new-half' || kind === 'new-open';

/**
 * Draw order for a trace, as integers the CSS turns into token delays:
 * delay = order × motion.duration.trace-stagger + phase × motion.duration.slow.
 * Forest (granted) nodes and line first, then the hop connector, then the dashed
 * "grant ends" segments, then new-field nodes last.
 */
function drawOrder(steps) {
  const granted = steps.filter(s => !isNew(s.kind)).length;
  const hasHop = steps.some(s => s.hopTo);
  const hasEnds = steps.some((s, i) => i < steps.length - 1 && s.line === 'ends');
  const afterForest = granted > 0 ? 1 : 0;
  const endsPhase = afterForest + (hasHop ? 1 : 0);
  const newPhase = endsPhase + (hasEnds ? 1 : 0);
  let newIndex = 0;
  let grantedIndex = 0;
  return steps.map(step => {
    const node = isNew(step.kind)
      ? { order: granted + newIndex++, phase: newPhase }
      : { order: grantedIndex++, phase: 0 };
    const line = step.line === 'ends' ? { order: granted, phase: endsPhase } : node;
    return { node, line, hop: { order: granted, phase: afterForest } };
  });
}

const timing = ({ order, phase }) => ({ '--cm-order': order, '--cm-phase': phase });

/**
 * steps: [{ kind, server?, field, value?, note?, line?, hopTo?, control? }]
 * line is the segment below the node: granted | ends | high | none.
 * control is a slot for the step's approval checkbox.
 * motion: draw (the trace draws itself) | record (rows stagger in, for the receipt) | none.
 */
export function CausalTrace({ steps, motion = 'draw' }) {
  const order = drawOrder(steps);
  return (
    <ol className="cm-trace" data-motion={motion}>
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        const line = last ? 'none' : (step.line ?? 'granted');
        return (
          <Fragment key={`${step.server ?? ''}${step.field}`}>
            <li className="cm-trace__step" data-kind={step.kind} style={{ '--cm-row': i }}>
              <div className="cm-trace__rail">
                <span className="cm-trace__node" style={timing(order[i].node)}><TraceNode kind={step.kind} /></span>
                <span className="cm-trace__line" data-line={line} style={timing(order[i].line)} />
              </div>
              <div className="cm-trace__body">
                {step.server && <div className="cm-trace__server">{step.server}</div>}
                <div className="cm-trace__field" data-declined={step.kind === 'declined' || undefined}>
                  {step.field}
                  <span className="cm-visually-hidden"> ({STATE_WORD[step.kind]})</span>
                </div>
                {step.value && <div className="cm-trace__value">{step.value}</div>}
                {step.note && <div className="cm-trace__note">{step.note}</div>}
                {step.control}
              </div>
            </li>
            {step.hopTo && (
              <li className="cm-trace__hop" style={timing(order[i].hop)}><HopConnector server={step.hopTo} /></li>
            )}
          </Fragment>
        );
      })}
    </ol>
  );
}

/**
 * On is forest with a white check, filled the instant it's ticked. kind names the job, as in Figma:
 *   remember  optional; names exactly what it remembers
 *   select    optional widening; one per new field on a trace step
 *   review    required before a destructive action: 2px film-red border while off, decision-weight
 *             label, the whole row is the click target and carries the focus ring
 *   todo      a LEFT FOR YOU row. needsYou: 2px film-red border while off; otherwise a slate label
 * Film red always means a person has to act.
 */
export function ApprovalCheckbox({ checked, onChange, kind = 'remember', needsYou = false, consequence, children }) {
  const id = useId();
  return (
    <div className="cm-check" data-kind={kind} data-needs-you={(kind === 'todo' && needsYou) || undefined}>
      <input
        id={id}
        className="cm-check__input"
        type="checkbox"
        checked={checked}
        onChange={e => onChange?.(e.target.checked)}
        aria-describedby={consequence ? `${id}-c` : undefined}
      />
      <label htmlFor={id} className="cm-check__label">
        <span className="cm-check__box">
          {checked && <Icon name="checkmark" />}
        </span>
        <span>{children}</span>
      </label>
      {consequence && <div id={`${id}-c`} className="cm-check__consequence">{consequence}</div>}
    </div>
  );
}

/**
 * state: working | speaking | waiting | stopped.
 * The status line types on at motion.duration.char-delay; while it types, a working light speaks.
 * Waiting holds still and stopped is static, so neither speaks. Stopped text is a fact and appears whole.
 * prefix is shown whole, before the typed text ("paused → ").
 * The line reserves the full text's size before it types on, so nothing below it jumps.
 */
export function AgentStatus({ state = 'working', name, prefix = '', children = '' }) {
  const text = String(children);
  const [shown, typing] = useTypedText(text, state !== 'stopped');
  const light = typing && state === 'working' ? 'speaking' : state;
  return (
    <div className="cm-agent" data-state={light}>
      <span className="cm-agent__light" aria-hidden="true">
        <span className="cm-agent__ring" />
        <span className="cm-agent__core" />
      </span>
      {name && <span className="cm-agent__name">{name}</span>}
      {/* The full sentence sits invisibly under the typed one, so the line holds its final size while it types */}
      <span className="cm-agent__text" aria-hidden="true">
        <span className="cm-agent__reserve">{prefix}{text}</span>
        <span className="cm-agent__typed">{prefix}{shown}</span>
      </span>
      <span className="cm-visually-hidden" role="status">{prefix}{text}</span>
    </div>
  );
}

function draftValue(value) {
  if (value === null || value === undefined) return 'not set';
  return Array.isArray(value) ? value.join(', ') : String(value);
}

/** Thesis 3: the exact fields and values, never truncated. */
export function FieldRows({ fields }) {
  return (
    <dl className="cm-fields">
      {fields.map(field => (
        <div key={field.name} className="cm-fields__row">
          <dt>{field.name}</dt>
          <dd>{draftValue(field.value)}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Thesis 3: a create shows the record itself. Dashed until it exists, solid once it does. */
export function DraftPreview({ id, fields, committed = false }) {
  return (
    <div className="cm-draft" data-committed={committed || undefined}>
      <div className="cm-draft__id">{id}</div>
      <FieldRows fields={fields} />
    </div>
  );
}

/** events: [{ time, label }]. Time and history are brown. */
export function Timeline({ events }) {
  return (
    <ol className="cm-timeline">
      {events.map(event => (
        <li key={`${event.time}${event.label}`} className="cm-timeline__row">
          <time className="cm-timeline__time">{event.time}</time>
          <span>{event.label}</span>
        </li>
      ))}
    </ol>
  );
}

const THESES = [
  ['Defer the grant', 'Defer the grant to first meaningful use, not connection.'],
  ['Tier by risk', 'Tier by risk, not by tool.'],
  ['Schema is the payload', 'The tool schema is the consent payload.'],
  ['Consent is a budget', 'Consent is a budget, not a switch.'],
  ['Match the tempo', 'The system matches the human to the right tempo.'],
];

/** active: thesis numbers lit for the current step. */
export function ThesisStrip({ active = [] }) {
  return (
    <ol className="cm-theses" aria-label="Theses">
      {THESES.map(([label, full], i) => {
        const n = i + 1;
        const on = active.includes(n);
        return (
          <li key={n} className="cm-thesis" data-n={n} data-active={on || undefined} aria-current={on || undefined} title={full}>
            {on && '● '}{n} · {label}
          </li>
        );
      })}
    </ol>
  );
}

/** Stop stays on every screen until the agent has stopped, then the slot reads as a fact. */
export function TopBar({ state, agentName, status, prefix, notice, onStop }) {
  return (
    <header className="cm-topbar">
      <span className="cm-topbar__title">CONSENT MOMENT</span>
      <AgentStatus state={state} name={agentName} prefix={prefix}>{status}</AgentStatus>
      <div className="cm-topbar__end">
        {notice && <span className="cm-topbar__notice" role="status">{notice}</span>}
        {state === 'stopped'
          ? <span className="cm-topbar__stopped">Agent stopped</span>
          : (
            <button type="button" className="cm-stop" onClick={onStop}>
              <span>Stop Agent</span>
              <Icon name="stop-sign" />
            </button>
          )}
      </div>
    </header>
  );
}

/**
 * tier: read | write | scope-creep | alert | destructive | receipt.
 * Pass tool for a standard header, or panel for the destructive and receipt panels.
 * decision is the sentence the human is deciding on, and the largest text in the body.
 */
export function ConsentFrame({
  tier, tool, server, icon, panel, decision, primary, secondary, children,
  enter = true, autoFocus = false, onEscape, footnote,
}) {
  const chipTier = tier === 'receipt' ? null : tier;
  const { actionsRef, onKeyDown } = useGateKeys({ autoFocus, onEscape });
  // Stillness is weight: destructive and alert cards hard-cut in
  const entering = enter && tier !== 'destructive' && tier !== 'alert';
  return (
    <section className="cm-frame" data-tier={tier} data-enter={entering || undefined} onKeyDown={onKeyDown}>
      {panel
        ? <div className="cm-frame__panel">{panel}</div>
        : (
          <header className="cm-frame__header">
            {chipTier && <TierChip tier={chipTier} />}
            {icon && <Icon name={icon} />}
            <span className="cm-frame__tool">{tool}</span>
            {server && <span className="cm-frame__server">via {server}</span>}
          </header>
        )}
      {(decision || children) && (
        <div className="cm-frame__body">
          {decision && <p className="cm-decision">{decision}</p>}
          {children}
        </div>
      )}
      <CardActions primary={primary} secondary={secondary} actionsRef={actionsRef} />
      {footnote && <p className="cm-frame__footnote">{footnote}</p>}
    </section>
  );
}

/** Destructive header content. The panel and "can't be undone" carry the tier, so no chip. */
export function DestructivePanel({ tool, server, icon, value, detail }) {
  return (
    <>
      <div className="cm-panel__row">
        <span className="cm-visually-hidden">Destructive</span>
        {icon && <Icon name={icon} />}
        <span className="cm-frame__tool">{tool}</span>
        {server && <span className="cm-frame__server">via {server}</span>}
      </div>
      <div className="cm-panel__hero">{value}</div>
      <div className="cm-panel__detail">{detail}</div>
    </>
  );
}

/** Needs a human now: film red. tone="passive" is a system notice: slate, no frame colour. */
export function Alert({ tone = 'action', title, primary, secondary, children }) {
  if (tone === 'passive') {
    return (
      <div className="cm-notice" role="status">
        <Icon name="renew" />
        <span>{children}</span>
      </div>
    );
  }
  return (
    <div className="cm-alert" role="alert">
      <TierChip tier="alert" />
      <p className="cm-decision cm-alert__title">{title}</p>
      <div className="cm-alert__body">{children}</div>
      <CardActions primary={primary} secondary={secondary} />
    </div>
  );
}

/** Completion record. headline stays "Task complete." only when everything completed. */
export function ConsentReceipt({
  headline = 'Task complete.', timestamp, outcome, steps, left = [], onToggleLeft, primary, secondary, autoFocus,
}) {
  const decided = steps.length > 0;
  const panel = (
    <>
      <div className="cm-panel__row cm-panel__row--between">
        <span className="cm-panel__label"><Icon name="security" /> CONSENT RECEIPT</span>
        <span className="cm-panel__time">{timestamp}</span>
      </div>
      <div className="cm-panel__decision">{headline}</div>
      <div className="cm-panel__detail">{outcome}</div>
    </>
  );
  return (
    <ConsentFrame tier="receipt" panel={panel} primary={primary} secondary={secondary} autoFocus={autoFocus}>
      {decided && <SectionLabel icon="recently-viewed">WHAT YOU DECIDED</SectionLabel>}
      {decided && <CausalTrace steps={steps} motion="record" />}
      {left && <SectionLabel>LEFT FOR YOU</SectionLabel>}
      {left?.length === 0 && <p className="cm-muted">Nothing left for you.</p>}
      {left?.length > 0 && (
        <div className="cm-stack cm-receipt__left">
          {left.map((item, i) => (
            <div key={item.label} className="cm-receipt__row" style={{ '--cm-row': steps.length + i }}>
              <ApprovalCheckbox
                checked={item.done}
                kind="todo"
                needsYou={item.alert}
                onChange={val => onToggleLeft?.(item.label, val)}
              >
                {item.label}
              </ApprovalCheckbox>
            </div>
          ))}
        </div>
      )}
    </ConsentFrame>
  );
}
