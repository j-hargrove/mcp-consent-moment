/**
 * Consent Moment design-system components.
 * Styled by styles.css, which reads only the token variables from tokens.json.
 * Thesis map: chips and frames (2, 5), trace and receipt (3, 4), buttons (2).
 */

import { Fragment, useId } from 'react';
import { ICON_PATHS } from './icon-paths.js';

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
    <svg className={`cm-icon ${className}`} data-tone={tone} viewBox={viewBox} aria-hidden="true" focusable="false">
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

export function SectionLabel({ icon, children }) {
  return (
    <div className="cm-section-label">
      {icon && <Icon name={icon} tone={ICON_TONES[icon]} />}
      <span>{children}</span>
    </div>
  );
}

/** Primary always sits on the left: it is the narrowest choice. */
function CardActions({ primary, secondary }) {
  if (!primary && !secondary) return null;
  return (
    <div className="cm-frame__actions">
      {primary}
      {secondary}
    </div>
  );
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
  granted: 'granted',
  'new-half': 'new, higher consequence',
  'new-open': 'new, low consequence',
  high: 'high consequence',
  declined: 'declined',
};

/**
 * steps: [{ kind, server?, field, value?, note?, line?, hopTo?, control? }]
 * line is the segment below the node: granted | ends | high | none.
 * control is a slot for the step's approval checkbox.
 */
export function CausalTrace({ steps }) {
  return (
    <ol className="cm-trace">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        const line = last ? 'none' : (step.line ?? 'granted');
        return (
          <Fragment key={`${step.server ?? ''}${step.field}`}>
            <li className="cm-trace__step" data-kind={step.kind}>
              <div className="cm-trace__rail">
                <TraceNode kind={step.kind} />
                <span className="cm-trace__line" data-line={line} />
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
            {step.hopTo && <li className="cm-trace__hop"><HopConnector server={step.hopTo} /></li>}
          </Fragment>
        );
      })}
    </ol>
  );
}

/** Off and on are forest. review marks a check the human must make: film-red border, view icon. */
export function ApprovalCheckbox({ checked, onChange, review = false, consequence, children }) {
  const id = useId();
  return (
    <div className="cm-check" data-review={review || undefined}>
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
          {checked ? <Icon name="checkmark" /> : review ? <Icon name="view" /> : null}
        </span>
        <span>{children}</span>
      </label>
      {consequence && <div id={`${id}-c`} className="cm-check__consequence">{consequence}</div>}
    </div>
  );
}

/** state: working | speaking | waiting | stopped. Loops are added in Phase 5. */
export function AgentStatus({ state = 'working', children }) {
  return (
    <div className="cm-agent" data-state={state} role="status">
      <span className="cm-agent__light" aria-hidden="true">
        <span className="cm-agent__ring" />
        <span className="cm-agent__core" />
      </span>
      <span className="cm-agent__text">{children}</span>
    </div>
  );
}

/**
 * tier: read | write | scope-creep | alert | destructive | receipt.
 * Pass tool for a standard header, or panel for the destructive and receipt panels.
 * decision is the sentence the human is deciding on, and the largest text in the body.
 */
export function ConsentFrame({ tier, tool, server, icon, panel, decision, primary, secondary, children }) {
  const chipTier = tier === 'receipt' ? null : tier;
  return (
    <section className="cm-frame" data-tier={tier}>
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
      <CardActions primary={primary} secondary={secondary} />
    </section>
  );
}

/** Destructive header content: hero value on the film-red panel. */
export function DestructivePanel({ tool, icon, value, detail }) {
  return (
    <>
      <div className="cm-panel__row">
        <TierChip tier="destructive" onPanel />
        {icon && <Icon name={icon} />}
        <span className="cm-frame__tool">{tool}</span>
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

/** Completion record: what was decided, then what is left for the human. */
export function ConsentReceipt({ timestamp, outcome, steps, left = [], onToggleLeft, primary, secondary }) {
  const panel = (
    <>
      <div className="cm-panel__row cm-panel__row--between">
        <span className="cm-panel__label"><Icon name="security" /> CONSENT RECEIPT</span>
        <span className="cm-panel__time">{timestamp}</span>
      </div>
      <div className="cm-panel__decision">Task complete.</div>
      <div className="cm-panel__detail">{outcome}</div>
    </>
  );
  return (
    <ConsentFrame tier="receipt" panel={panel} primary={primary} secondary={secondary}>
      <SectionLabel icon="recently-viewed">WHAT YOU DECIDED</SectionLabel>
      <CausalTrace steps={steps} />
      <SectionLabel>LEFT FOR YOU</SectionLabel>
      {left.length === 0
        ? <p className="cm-muted">Nothing left for you.</p>
        : (
          <div className="cm-stack">
            {left.map(item => (
              <ApprovalCheckbox
                key={item.label}
                checked={item.done}
                onChange={val => onToggleLeft?.(item.label, val)}
              >
                {item.label}
              </ApprovalCheckbox>
            ))}
          </div>
        )}
    </ConsentFrame>
  );
}
