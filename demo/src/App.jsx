import { useState, useCallback, useEffect, useRef } from 'react';
import { useConsentGate, BudgetPanel, SectionLabel, ThesisStrip, TopBar } from '@mcp-consent/react';
import { RiskTier } from '@mcp-consent/core';
import { runDemo, seedGrants } from './agent.js';
import { StyledConsentCard } from './components/StyledConsentCard.jsx';
import { ActivityStrip } from './components/ActivityStrip.jsx';
import { Landing } from './components/Landing.jsx';
import { WriteCard } from './components/WriteCard.jsx';

const IDLE_STATUS = 'idle → choose a scenario to run the consent flow';

/** Which theses light up for the step the human is looking at. */
const SESSION_START = Date.now();

const isFirstWrite = (request) => request?.tool.name === 'issues.create';

function thesesFor({ pendingRequest, pendingDecision, completion, events }) {
  if (completion) return [4];
  if (pendingDecision) return [5];
  if (!pendingRequest) return events.at(-1)?.tier === 'read' ? [2] : null;
  if (pendingRequest.isCreep) return [4];
  return pendingRequest.tier === RiskTier.DESTRUCTIVE ? [2, 3, 5] : [1, 2, 3];
}

export default function App() {
  const {
    callTool,
    pendingRequest,
    resolve,
    budget,
    grants,
    refreshGrants,
    revokeGrant,
    grantedSchemas,
    setRememberNextGrant,
  } = useConsentGate();

  const [status, setStatus] = useState(IDLE_STATUS);
  const [events, setEvents] = useState([]);
  const [completion, setCompletion] = useState(null);
  const [stopped, setStopped] = useState(null); // null | { toolName }
  const [isRunning, setIsRunning] = useState(false);
  const [remember, setRemember] = useState(false);
  const [pendingDecision, setPendingDecision] = useState(null);
  const decisionResolveRef = useRef(null);
  // Bumped by Stop Agent. Anything from an older run is ignored, and its next tool call never returns.
  const runIdRef = useRef(0);
  const litThesesRef = useRef([]);
  const [stopNotice, setStopNotice] = useState(null);
  const [approvedDraft, setApprovedDraft] = useState(null);

  const resetGrants = useCallback(() => {
    seedGrants(budget, grantedSchemas);
    refreshGrants();
  }, [budget, grantedSchemas, refreshGrants]);

  useEffect(resetGrants, [resetGrants]);

  // The approved draft stays up until the next gate replaces it
  useEffect(() => {
    if (pendingRequest) setApprovedDraft(null);
  }, [pendingRequest]);

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
    // Creep cards have no checkbox: approving them is the decision to expand the grant.
    setRememberNextGrant(pendingRequest?.isCreep || remember);
    if (allowed && isFirstWrite(pendingRequest)) setApprovedDraft(pendingRequest);
    resolve(allowed);
    setRemember(false);
  }, [resolve, remember, pendingRequest, setRememberNextGrant]);

  const onStopped = useCallback((toolName) => {
    console.log('[onStopped] fired for', toolName);
    setStopped({ toolName });
    setStatus(`Agent stopped. Consent denied for ${toolName}.`);
  }, []);

  const stopAgent = useCallback(() => {
    if (!isRunning) {
      setStopNotice('No agent running.');
      return;
    }
    runIdRef.current += 1;
    resolve(false);
    setPendingDecision(null);
    decisionResolveRef.current = null;
    setEvents(prev => prev.map(e => (e.state === 'running' ? { ...e, state: 'stopped' } : e)));
    setApprovedDraft(null);
    setIsRunning(false);
    setStopped({ byUser: true });
    setStatus('Agent stopped. Nothing else will run.');
  }, [isRunning, resolve]);

  const startDemo = useCallback(async (mode) => {
    if (isRunning) return;
    const runId = ++runIdRef.current;
    setStopNotice(null);
    setApprovedDraft(null);
    const live = (fn) => (...args) => { if (runIdRef.current === runId) return fn(...args); };
    const haltIfStopped = async (...args) => {
      const proceed = await callTool(...args);
      if (runIdRef.current !== runId) await new Promise(() => {});
      return proceed;
    };
    setEvents([]);
    setCompletion(null);
    setStopped(null);
    setIsRunning(true);
    setRemember(false);
    setStatus('Starting…');

    await runDemo({
      mode,
      callTool: haltIfStopped,
      budget,
      grantedSchemas,
      emit: live(emit),
      onStatusChange: live(setStatus),
      onComplete: live(setCompletion),
      onStopped: live(onStopped),
      waitForDecision,
    });

    if (runIdRef.current === runId) setIsRunning(false);
  }, [isRunning, callTool, budget, grantedSchemas, emit, waitForDecision, onStopped]);

  const handleReset = useCallback(() => {
    resetGrants();
    setEvents([]);
    setCompletion(null);
    setStopped(null);
    setPendingDecision(null);
    setApprovedDraft(null);
    setStatus(IDLE_STATUS);
  }, [resetGrants]);

  const isIdle = !isRunning && !pendingRequest && !completion && !stopped;
  const atGate = Boolean(pendingRequest || pendingDecision);
  const showDraft = approvedDraft && !pendingRequest && !completion && !stopped;
  const writeRequest = isFirstWrite(pendingRequest) ? pendingRequest : showDraft ? approvedDraft : null;
  const gateCard = Boolean(pendingRequest || writeRequest);
  const agentState = completion || stopped ? 'stopped' : atGate || isIdle ? 'waiting' : 'working';

  // Keep the last gate's theses lit while the agent runs between gates
  const lit = thesesFor({ pendingRequest, pendingDecision, completion, events });
  if (lit) litThesesRef.current = lit;
  if (isIdle || stopped) litThesesRef.current = [];

  return (
    <div className="app">

      <TopBar state={agentState} status={atGate ? `paused → ${status}` : status} notice={stopNotice} onStop={stopAgent} />
      <ThesisStrip active={litThesesRef.current} />

      {/* ── Body ── */}
      <div className="app-body">

        {/* ── Main panel ── */}
        <main className="main-panel">
          <div className="task-card">
            <SectionLabel icon="bot">AGENT TASK</SectionLabel>
            <div className="task-card__text">
              Triage a customer payment error, file a support ticket, and issue a refund.
            </div>
          </div>

          <div className={`main-stage${isIdle ? ' main-stage--top' : ''}${gateCard ? ' main-stage--top main-stage--gate' : ''}`}>
            {writeRequest ? (
              <WriteCard
                request={writeRequest}
                committed={!pendingRequest}
                resultId={events.find(e => e.resultId)?.resultId}
                remember={remember}
                onRememberChange={setRemember}
                onResolve={handleResolve}
              />
            ) : pendingRequest ? (
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
              <Landing onSelect={startDemo} />
            )}
          </div>
        </main>

        {/* ── Side panel ── */}
        <aside className="side-panel">
          <div className="side-section">
            <SectionLabel icon="recently-viewed">ACTIVITY</SectionLabel>
            <ActivityStrip
              events={events}
              gateOpen={Boolean(pendingRequest)}
              pendingDecision={pendingDecision}
              onDecision={handleDecision}
            />
          </div>

          <div className="side-section">
            <SectionLabel icon="security">WHAT YOU'VE AUTHORIZED</SectionLabel>
            <div className="side-section__sublabel">Revoke anytime — agent re-prompts on next use.</div>
            <BudgetPanel grants={grants} onRevoke={revokeGrant} sessionStart={SESSION_START} />
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
        {stopped.byUser
          ? 'Agent stopped. Nothing else will run.'
          : <>Agent stopped. Consent denied for <span className="stopped-view__tool">{stopped.toolName}</span>.</>}
      </div>
      <div className="outcome-insight">The agent halted cleanly. Nothing ran without your approval.</div>
      <button className="btn btn--reset" onClick={onBack}>
        Back to scenarios
      </button>
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
