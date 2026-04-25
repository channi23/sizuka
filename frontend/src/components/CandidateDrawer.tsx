import { Icon } from './Icon';
import { Avatar, SourceBadge, Badge } from './Shell';
import type { UICandidate, ConversationTurn } from '../types';

interface ScoreGaugeProps { value: number; label: string; color?: string; }
const ScoreGauge = ({ value, label, color = 'var(--accent)' }: ScoreGaugeProps) => {
  const r = 32, c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="gauge-card">
      <svg className="gauge-svg" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dashoffset 400ms cubic-bezier(.2,.7,.2,1)' }} />
        <text x="40" y="46" textAnchor="middle" fontSize="17" fontWeight="600" fill="var(--text)" fontFamily="Inter">{value}</text>
      </svg>
      <div className="gauge-label">{label}</div>
    </div>
  );
};

const ConversationThread = ({ messages }: { messages: Array<{ from: string; time: string; body: string }> }) => {
  if (!messages || messages.length === 0) {
    return (
      <div className="empty-state">
        <Icon name="mail" size={20} />
        <div style={{ marginTop: 8 }}>Awaiting reply…</div>
        <div style={{ fontSize: 11, marginTop: 4, color: 'var(--text-dim)' }}>The candidate hasn't responded yet.</div>
      </div>
    );
  }
  return (
    <div className="thread">
      {messages.map((m, i) => (
        <div key={i} className={`bubble-wrap ${m.from === 'recruiter' ? 'right' : 'left'}`}>
          <div className={`bubble ${m.from}`}>{m.body}</div>
          <div className="bubble-time">{m.time}</div>
        </div>
      ))}
    </div>
  );
};

interface Props {
  candidate: UICandidate;
  weights: { match: number; interest: number };
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const CandidateDrawer = ({ candidate: c, weights, onClose, onToast }: Props) => {
  const final = Math.round(c.matchScore * weights.match + c.interestScore * weights.interest);
  const conversation = buildConversation(c);

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <Avatar hue={c.avatarHue} name={c.name} size={36} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>{c.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <SourceBadge source={c.source} />
                <a className="mono" style={{ color: 'var(--accent)', textDecoration: 'none' }} href={`https://${c.profileUrl}`} target="_blank" rel="noreferrer">
                  {c.profileUrl} <Icon name="external" size={10} />
                </a>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="icon-btn" title="Copy" onClick={() => onToast('Profile URL copied')}><Icon name="copy" /></button>
            <button className="icon-btn" onClick={onClose} title="Close"><Icon name="x" /></button>
          </div>
        </div>
        <div className="drawer-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '0 0 6px' }}>
            <div className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.email}</div>
            <Badge kind={c.emailStatus} label={`Email ${c.emailStatus}`} pulse={c.emailStatus === 'sent'} />
          </div>

          <div className="section-h">Score Breakdown</div>
          <div className="gauges">
            <ScoreGauge value={c.matchScore} label="Match" color="#818CF8" />
            <ScoreGauge value={c.interestScore} label="Interest" color="#FB923C" />
            <ScoreGauge value={final} label="Final" color="#22C55E" />
          </div>

          {c.matchExplanation && (
            <>
              <div className="section-h">Match Explanation</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, margin: '0 0 14px' }}>{c.matchExplanation}</p>
            </>
          )}

          <div className="section-h">Skills</div>
          <div className="skill-row" style={{ marginBottom: 6 }}>
            {c.skillsMatched.map(s => <span key={s} className="pill">{s}</span>)}
            {c.skillsMissing.map(s => <span key={s} className="pill miss">{s}</span>)}
          </div>
          {c.skillsMissing.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>Strikethrough = required but missing</div>
          )}

          <div className="section-h">Conversation</div>
          <ConversationThread messages={conversation} />

          {c.emailStatus === 'replied' && c.interestExplanation && (
            <>
              <div className="section-h">Interest Explanation</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>{c.interestExplanation}</p>
            </>
          )}
        </div>
      </div>
    </>
  );
};

/** Normalise conversation history to a uniform display shape.
 *  Handles both the Python JSONB shape {role, content, timestamp}
 *  and any legacy {from, body, time} shape.
 */
function buildConversation(c: UICandidate): Array<{ from: string; time: string; body: string }> {
  const history = c.conversationHistory;
  if (Array.isArray(history) && history.length > 0) {
    return history.map((m: ConversationTurn) => ({
      from: m.from ?? m.role ?? 'recruiter',
      time: m.time ?? (m.timestamp ? new Date(m.timestamp).toLocaleString() : ''),
      body: m.body ?? m.content ?? '',
    }));
  }
  const msgs: Array<{ from: string; time: string; body: string }> = [];
  if (c.outreachBody) {
    msgs.push({ from: 'recruiter', time: new Date(c.createdAt).toLocaleString(), body: c.outreachBody });
  }
  if (c.replyText) {
    msgs.push({ from: 'candidate', time: 'replied', body: c.replyText });
  }
  return msgs;
}
