import { Button, ConsentFrame, TierChip } from '@mcp-consent/react';
import { MODE, MODE_META } from '../agent.js';

const TIERS = [
  { tier: 'read', text: 'Runs silently. You see it after.' },
  { tier: 'write', text: 'Shows what it will write. Asks first.' },
  { tier: 'scope-creep', text: 'Asking for more is a new decision.' },
  { tier: 'destructive', text: 'Stops every time. Never remembered.' },
];

function TierSample({ tier, text }) {
  if (tier === 'destructive') {
    return (
      <ConsentFrame tier={tier} panel={<div><TierChip tier={tier} onPanel /></div>}>
        <p>{text}</p>
      </ConsentFrame>
    );
  }
  return (
    <ConsentFrame tier={tier}>
      <p>{text}</p>
    </ConsentFrame>
  );
}

/** Thesis 2 and 5: the human sees how the system tiers risk before anything runs. */
export function Landing({ onSelect }) {
  return (
    <div className="landing">
      <div className="landing__intro">
        <h1 className="landing__headline">Agents move fast. People decide slowly.</h1>
        <p className="landing__sub">The card gets heavier and warmer as the stakes go up.</p>
      </div>

      <div className="landing__legend">
        {TIERS.map(item => <TierSample key={item.tier} {...item} />)}
      </div>
      <p className="landing__footer">Revoke any permission at any time. The agent asks again next time.</p>

      <div className="landing__choose">
        <div className="landing__choose-label">CHOOSE A SCENARIO</div>
        <div className="landing__grid">
          {Object.values(MODE).map(mode => (
            <section key={mode} className={`landing-scenario${mode === MODE.MULTI_HOP ? ' landing-scenario--wide' : ''}`}>
              <h2 className="landing-scenario__label">{MODE_META[mode].label}</h2>
              <p className="landing-scenario__description">{MODE_META[mode].description}</p>
              <Button variant="secondary" icon="arrow-right" onClick={() => onSelect(mode)}>Run</Button>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
