import { useState, useCallback, useRef } from 'react';
import { useConsentGate, BudgetPanel } from '@mcp-consent/react';
import { runDemo, MODE, MODE_META } from './agent.js';
import { StyledConsentCard } from './components/StyledConsentCard.jsx';
import { ActivityStrip } from './components/ActivityStrip.jsx';

export default function App() {
  const {
    callTool,
    pendingRequest,
    resolve,
    budget,
    grants,
    revokeGrant,
    resetBudget,
    grantedSchemas,
    setRememberNextGrant,
  } = useConsentGate();

  const [status, setStatus] = useState('Select a scenario to run the consent flow demo.');
  const [events, setEvents] = useState([]);
  const [completion, setCompletion] = useState(null);
  const [stopped, setStopped] = useState(null); // null | { toolName }
  const [isRunning, setIsRunning] = useState(false);
  const [remember, setRemember] = useState(true);
  const [pendingDecision, setPendingDecision] = useState(null);
  const decisionResolveRef = useRef(null);

  // Merge event updates by id; new events are appended
  const emit = useCallback((event) => {
    setEvents(prev => {
      const idx = prev.findIndex(e => e.id === event.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...event };
        return next;
      }
      return [...prev, event];
    });
  }, []);

  const waitForDecision = useCallback((decision) => {
    return new Promise(resolve => {
      decisionResolveRef.current = resolve;
      setPendingDecision(decision);
    });
  }, []);

  const handleDecision = useCallback((value) => {
    setPendingDecision(null);
    decisionResolveRef.current?.(value);
    decisionResolveRef.current = null;
  }, []);

  const handleResolve = useCallback((allowed) => {
    setRememberNextGrant(remember);
    resolve(allowed);
    setRemember(true);
  }, [resolve, remember, setRememberNextGrant]);

  const onStopped = useCallback((toolName) => {
    console.log('[onStopped] fired for', toolName);
    setStopped({ toolName });
    setStatus(`Agent stopped. Consent denied for ${toolName}.`);
  }, []);

  const startDemo = useCallback(async (mode) => {
    if (isRunning) return;
    resetBudget();
    setEvents([]);
    setCompletion(null);
    setStopped(null);
    setIsRunning(true);
    setRemember(true);
    setStatus('Starting…');

    await runDemo({
      mode,
      callTool,
      budget,
      grantedSchemas,
      emit,
      onStatusChange: setStatus,
      onComplete: setCompletion,
      onStopped,
      waitForDecision,
    });

    setIsRunning(false);
  }, [isRunning, callTool, budget, grantedSchemas, emit, waitForDecision, resetBudget, onStopped]);

  const handleReset = useCallback(() => {
    resetBudget();
    setEvents([]);
    setCompletion(null);
    setStopped(null);
    setPendingDecision(null);
    setStatus('Select a scenario to run the consent flow demo.');
  }, [resetBudget]);

  const isIdle = !isRunning && !pendingRequest && !completion;

  return (
    <div className="app">

      {/* ── Header ── */}
      <header className="app-header">
        <div className="app-brand">
          <span className="app-brand__mark">⬡</span>
          <span className="app-brand__name">MCP Consent Moment</span>
        </div>
        <div className="status-bar">
          <span className={`status-bar__dot ${isRunning || pendingRequest ? 'status-bar__dot--active' : ''}`} />
          <span className="status-bar__text">{status}</span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="app-body">

        {/* ── Main panel ── */}
        <main className="main-panel">
          <div className="task-card">
            <div className="task-card__label">agent task</div>
            <div className="task-card__text">
              Triage a customer payment error, file a support ticket, and issue a refund.
            </div>
          </div>

          <div className="main-stage">
            {pendingRequest ? (
              <StyledConsentCard
                request={pendingRequest}
                onResolve={handleResolve}
                remember={remember}
                onRememberChange={setRemember}
              />
            ) : completion ? (
              <CompletionView completion={completion} onReset={handleReset} />
            ) : stopped ? (
              <StoppedView stopped={stopped} onBack={handleReset} />
            ) : isRunning ? (
              <div className="agent-running">
                <div className="agent-running__pulse" />
                <span className="agent-running__label">Agent running…</span>
              </div>
            ) : (
              <ModePicker onSelect={startDemo} />
            )}
          </div>
        </main>

        {/* ── Side panel ── */}
        <aside className="side-panel">
          <div className="side-section">
            <div className="side-section__label">activity</div>
            <ActivityStrip
              events={events}
              pendingDecision={pendingDecision}
              onDecision={handleDecision}
            />
          </div>

          <div className="side-section">
            <div className="side-section__label">What you've authorized</div>
            <div className="side-section__sublabel">Revoke anytime — agent re-prompts on next use.</div>
            <BudgetPanel grants={grants} onRevoke={revokeGrant} />
          </div>
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stopped view
// ---------------------------------------------------------------------------

function StoppedView({ stopped, onBack }) {
  return (
    <div className="stopped-view">
      <div className="stopped-view__icon">⊘</div>
      <div className="stopped-view__message">
        Agent stopped. Consent denied for <span className="stopped-view__tool">{stopped.toolName}</span>.
      </div>
      <div className="outcome-insight">The agent halted cleanly. Nothing ran without your approval.</div>
      <button className="btn btn--reset" onClick={onBack}>
        Back to scenarios
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mode picker
// ---------------------------------------------------------------------------

function ModePicker({ onSelect }) {
  return (
    <div className="mode-picker">
      <div className="explainer">
        <div className="explainer__headline">How this works</div>
        <div className="explainer__framing">
          Agents move fast. Humans decide slowly. This is the system that reconciles them.
        </div>
        <div className="explainer__tiers">
          <div className="explainer-row">
            <span className="explainer-row__dot explainer-row__dot--read" />
            <div className="explainer-row__body">
              <span className="explainer-row__label">Low stakes — reads and lookups</span>
              <span className="explainer-row__desc">Flows silently. You can see what happened, after.</span>
            </div>
          </div>
          <div className="explainer-row">
            <span className="explainer-row__dot explainer-row__dot--write" />
            <div className="explainer-row__body">
              <span className="explainer-row__label">Write actions — creating, updating</span>
              <span className="explainer-row__desc">Agent shows exactly what it will write before it runs. Approve once, it remembers.</span>
            </div>
          </div>
          <div className="explainer-row">
            <span className="explainer-row__dot explainer-row__dot--destructive" />
            <div className="explainer-row__body">
              <span className="explainer-row__label">High stakes — money, irreversible actions</span>
              <span className="explainer-row__desc">Hard stop every time. No memory. Friction is the feature.</span>
            </div>
          </div>
        </div>
        <div className="explainer__footer">
          Revoke any permission at any time — the agent re-prompts on next use.
        </div>
      </div>

      <div className="mode-picker__prompt">Choose a scenario</div>
      <div className="mode-picker__grid">
        {Object.values(MODE).map(mode => (
          <button
            key={mode}
            className={`mode-card mode-card--${mode}`}
            onClick={() => onSelect(mode)}
          >
            <div className="mode-card__label">{MODE_META[mode].label}</div>
            <div className="mode-card__description">{MODE_META[mode].description}</div>
            <div className="mode-card__watch">{MODE_META[mode].watch}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Completion views
// ---------------------------------------------------------------------------

function CompletionView({ completion, onReset }) {
  if (completion.type === 'partial') {
    return (
      <div className="partial-completion">
        <div className="partial-completion__summary">{completion.message}</div>
        {completion.tasks && (
          <div className="partial-completion__tasks">
            {completion.tasks.map((task, i) => (
              <div
                key={i}
                className={`task-line ${task.done ? 'task-line--done' : task.manual ? 'task-line--manual' : 'task-line--pending'}`}
              >
                <span className="task-line__icon">{task.done ? '✓' : '⚠'}</span>
                <span>{task.label}</span>
              </div>
            ))}
          </div>
        )}
        {completion.insight && <div className="outcome-insight">{completion.insight}</div>}
        <button className="btn btn--reset" onClick={onReset}>Run another scenario</button>
      </div>
    );
  }

  return (
    <div className="completion">
      <div className="completion__icon">✓</div>
      <div className="completion__text">{completion.message}</div>
      {completion.insight && <div className="outcome-insight">{completion.insight}</div>}
      <button className="btn btn--reset" onClick={onReset}>Run another scenario</button>
    </div>
  );
}
