import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { Topbar, Avatar, SourceBadge, Badge } from '../components/Shell';
import { CandidateDrawer } from '../components/CandidateDrawer';
import { getOutreachCandidates } from '../lib/api';
import { toUICandidate } from '../types';
import type { UICandidate, ConversationTurn } from '../types';

const POLL_INTERVAL_MS = 10_000;

const ConversationThread = ({ c }: { c: UICandidate }) => {
  const history = c.conversationHistory;
  const msgs: Array<{ from: string; time: string; body: string }> = [];
  if (Array.isArray(history) && history.length > 0) {
    const msgs = (history as ConversationTurn[]).map(m => ({
      from: m.from ?? m.role ?? 'recruiter',
      time: m.time ?? (m.timestamp ? new Date(m.timestamp).toLocaleString() : ''),
      body: m.body ?? m.content ?? '',
    }));
    return (
      <div className="thread">
        {msgs.map((m, i) => (
          <div key={i} className={`bubble-wrap ${m.from === 'recruiter' ? 'right' : 'left'}`}>
            <div className={`bubble ${m.from}`}>{m.body}</div>
            <div className="bubble-time">{m.time}</div>
          </div>
        ))}
      </div>
    );
  }
  if (c.outreachBody) msgs.push({ from: 'recruiter', time: new Date(c.createdAt).toLocaleString(), body: c.outreachBody });
  if (c.replyText) msgs.push({ from: 'candidate', time: 'replied', body: c.replyText });
  if (msgs.length === 0) return <div className="empty-state"><Icon name="mail" size={20} /><div style={{ marginTop: 8 }}>No messages yet</div></div>;
  return (
    <div className="thread">
      {msgs.map((m, i) => (
        <div key={i} className={`bubble-wrap ${m.from === 'recruiter' ? 'right' : 'left'}`}>
          <div className={`bubble ${m.from}`}>{m.body}</div>
          <div className="bubble-time">{m.time}</div>
        </div>
      ))}
    </div>
  );
};

interface Props {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  onNav: (v: any) => void;
  onToast: (msg: string) => void;
}

export const OutreachPage = ({ theme, setTheme, onNav, onToast }: Props) => {
  const [candidates, setCandidates] = useState<UICandidate[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [drawerCandidate, setDrawerCandidate] = useState<UICandidate | null>(null);

  useEffect(() => {
    const load = () =>
      getOutreachCandidates().then(list => {
        const ui = list.filter(c => c.emailStatus && c.emailStatus !== 'pending').map((c, i) => toUICandidate(c, i + 1));
        setCandidates(ui);
        setActiveId(prev => prev ?? (ui.length > 0 ? ui[0].id : null));
      }).catch(() => {});
    load();
    const t = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  const sel = candidates.find(c => c.id === activeId) ?? candidates[0];
  const replied = candidates.filter(c => c.emailStatus === 'replied').length;

  return (
    <>
      <Topbar theme={theme} setTheme={setTheme} onNav={onNav} onToast={onToast}>
        <div className="greet">
          <h1>Outreach</h1>
          <p>{candidates.length} active conversations · {replied} replies</p>
        </div>
      </Topbar>
      <div className="content">
        <div className="outreach-split">
          <div className="outreach-list">
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Conversations</div>
              <select className="input" style={{ width: 'auto', padding: '4px 8px', fontSize: 11.5 }}>
                <option>All statuses</option>
                <option>Replied</option>
                <option>Opened</option>
                <option>Sent</option>
              </select>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {candidates.length === 0 ? (
                <div className="empty-state" style={{ margin: 16 }}>
                  <Icon name="mail" size={20} />
                  <div style={{ marginTop: 8 }}>No outreach yet</div>
                  <div style={{ marginTop: 4, fontSize: 11 }}>Emails will appear here once sent</div>
                </div>
              ) : candidates.map(c => (
                <div key={c.id} className={`outreach-row${c.id === activeId ? ' active' : ''}`} onClick={() => setActiveId(c.id)}>
                  <Avatar hue={c.avatarHue} name={c.name} size={32} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="o-top">
                      <span className="o-name">{c.name}</span>
                      <span className="o-time">{c.emailStatus === 'replied' ? 'replied' : '—'}</span>
                    </div>
                    <div className="o-role">{c.companyName ? `${c.companyName} · ` : ''}{c.source}</div>
                    <div className="o-preview">{c.outreachBody || c.replyText || '—'}</div>
                    <div className="o-meta">
                      <Badge kind={c.emailStatus} label={c.emailStatus} pulse={c.emailStatus === 'sent'} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="outreach-thread-pane">
            {sel ? (
              <>
                <div className="outreach-thread-head">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar hue={sel.avatarHue} name={sel.name} size={36} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{sel.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="mono">{sel.email}</span>
                          <SourceBadge source={sel.source} />
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" onClick={() => setDrawerCandidate(sel)}>Open profile</button>
                      <button className="icon-btn" onClick={() => onToast('Opened in mail client')}><Icon name="external" /></button>
                    </div>
                  </div>
                </div>
                <div className="outreach-thread-body">
                  <ConversationThread c={sel} />
                </div>
                <div className="outreach-thread-foot">
                  <Icon name="info" size={13} />
                  Replies are handled automatically by the AI agent. Sizuka will notify you when human action is needed.
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ margin: 28 }}>No conversations yet.</div>
            )}
          </div>
        </div>
      </div>

      {drawerCandidate && (
        <CandidateDrawer
          candidate={drawerCandidate}
          weights={{ match: 0.6, interest: 0.4 }}
          onClose={() => setDrawerCandidate(null)}
          onToast={onToast}
        />
      )}
    </>
  );
};
