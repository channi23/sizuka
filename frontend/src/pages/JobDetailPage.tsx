import { useEffect, useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { Topbar, Badge, ScoreBar, Avatar, SourceBadge } from '../components/Shell';
import { CandidateDrawer } from '../components/CandidateDrawer';
import { getJob, getShortlist, getPipelineEvents } from '../lib/api';
import { toUICandidate } from '../types';
import type { APIJob, APIPipelineEvent, UICandidate } from '../types';
import { connectSSE } from '../lib/sse';

const STATUS_LABELS: Record<string, string> = {
  queued: 'Queued', parsing: 'Parsing', discovering: 'Discovering',
  matching: 'Matching', outreach: 'Outreach', complete: 'Complete', failed: 'Failed',
};
const ACTIVE_STATUSES = ['parsing', 'discovering', 'matching', 'outreach'];

const STAGES = [
  { name: 'Parsing JD', key: 'parsing' },
  { name: 'Discovering Candidates', key: 'discovering' },
  { name: 'Scoring & Matching', key: 'matching' },
  { name: 'Sending Outreach', key: 'outreach' },
  { name: 'Scoring Interest', key: 'interest' },
  { name: 'Shortlist Ready', key: 'ready' },
];

interface StepEvent { status: 'complete' | 'active' | 'pending'; message: string; time: string; }

// Agent posts these stage keys (in order)
const AGENT_STAGE_KEYS = ['parsing', 'discovery', 'matching', 'outreach', 'scoring', 'complete'];

function eventsToSteps(events: APIPipelineEvent[], jobStatus: string): StepEvent[] {
  const steps: StepEvent[] = STAGES.map(() => ({ status: 'pending' as const, message: '', time: '' }));
  let maxCompletedIdx = -1;

  events.forEach(ev => {
    const idx = AGENT_STAGE_KEYS.indexOf(ev.stage ?? '');
    if (idx >= 0) {
      const time = ev.createdAt
        ? new Date(ev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      steps[idx] = { status: 'complete', message: ev.message ?? '', time };
      if (idx > maxCompletedIdx) maxCompletedIdx = idx;
    }
  });

  // If job still running, mark next stage after last completed as active
  if (!['complete', 'failed'].includes(jobStatus) && maxCompletedIdx < steps.length - 1) {
    const nextIdx = maxCompletedIdx + 1;
    if (steps[nextIdx].status === 'pending') {
      steps[nextIdx] = { status: 'active', message: '', time: '' };
    }
  }

  return steps;
}

const Stepper = ({ events, jobStatus }: { events: APIPipelineEvent[]; jobStatus: string }) => {
  const steps = eventsToSteps(events, jobStatus);
  return (
    <div className="stepper">
      {STAGES.map((s, i) => {
        const ev = steps[i];
        return (
          <div key={i} className={`step ${ev.status}`}>
            <div className="step-icon">
              {ev.status === 'complete' ? <Icon name="check" size={12} stroke={2.5} /> :
               ev.status === 'active' ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} /> :
               <span>{i + 1}</span>}
            </div>
            <div className="step-body">
              <div className="step-name">
                <span>{s.name}</span>
                {ev.time && <span className="step-time">{ev.time}</span>}
              </div>
              {ev.message && <div className="step-msg">{ev.message}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CandidateRow = ({ c, onClick, weights }: { c: UICandidate; onClick: (c: UICandidate) => void; weights: { match: number; interest: number } }) => {
  const final = Math.round(c.matchScore * weights.match + c.interestScore * weights.interest);
  return (
    <tr onClick={() => onClick(c)}>
      <td><span className="rank-num">#{c.rank}</span></td>
      <td>
        <div className="cand-cell">
          <Avatar hue={c.avatarHue} name={c.name} />
          <div style={{ minWidth: 0 }}>
            <div className="cand-name">{c.name}</div>
            <div className="cand-meta">
              <SourceBadge source={c.source} />
              <span className="mono dim" style={{ fontSize: 11 }}>{c.profileUrl}</span>
            </div>
          </div>
        </div>
      </td>
      <td><ScoreBar value={c.matchScore} width={100} /></td>
      <td><ScoreBar value={c.interestScore} width={100} /></td>
      <td><span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{final}%</span></td>
      <td>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 220 }}>
          {c.skillsMatched.slice(0, 3).map(s => <span key={s} className="pill">{s}</span>)}
          {c.skillsMatched.length > 3 && <span className="pill" style={{ background: 'transparent', borderColor: 'var(--border)', color: 'var(--text-dim)' }}>+{c.skillsMatched.length - 3}</span>}
        </div>
      </td>
      <td><Badge kind={c.emailStatus} label={c.emailStatus[0].toUpperCase() + c.emailStatus.slice(1)} pulse={c.emailStatus === 'sent'} /></td>
      <td>
        <button className="btn btn-sm" onClick={e => { e.stopPropagation(); onClick(c); }}>
          {c.emailStatus === 'replied' ? 'View Thread' : 'View'}
        </button>
      </td>
    </tr>
  );
};

interface Props {
  jobId: string;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  onNav: (v: any) => void;
  onToast: (msg: string) => void;
  onBack: () => void;
}

export const JobDetailPage = ({ jobId, theme, setTheme, onNav, onToast, onBack }: Props) => {
  const [job, setJob] = useState<APIJob | null>(null);
  const [events, setEvents] = useState<APIPipelineEvent[]>([]);
  const [candidates, setCandidates] = useState<UICandidate[]>([]);
  const [weights, setWeights] = useState({ match: 0.6, interest: 0.4 });
  const [selected, setSelected] = useState<UICandidate | null>(null);

  useEffect(() => {
    getJob(jobId).then(setJob).catch(() => {});
    getPipelineEvents(jobId).then(setEvents).catch(() => {});
    getShortlist(jobId).then(list => setCandidates(list.map((c, i) => toUICandidate(c, i + 1)))).catch(() => {});

    const close = connectSSE(jobId, (ev) => {
      if (ev.type === 'pipeline_event') {
        setEvents(prev => [...prev, ev.data]);
      }
      if (ev.type === 'complete' || ev.type === 'failed') {
        getShortlist(jobId).then(list => setCandidates(list.map((c, i) => toUICandidate(c, i + 1)))).catch(() => {});
        getJob(jobId).then(setJob).catch(() => {});
      }
    });
    return close;
  }, [jobId]);

  const sorted = useMemo(() =>
    [...candidates].sort((a, b) =>
      (b.matchScore * weights.match + b.interestScore * weights.interest) -
      (a.matchScore * weights.match + a.interestScore * weights.interest)
    ).map((c, i) => ({ ...c, rank: i + 1 })),
    [candidates, weights]
  );

  if (!job) return <div style={{ padding: 48, color: 'var(--text-dim)' }}>Loading…</div>;

  return (
    <>
      <Topbar theme={theme} setTheme={setTheme} onNav={onNav} onToast={onToast}>
        <div className="breadcrumb">
          <a onClick={onBack}>Active Jobs</a>
          <span className="sep">/</span>
          <span className="current">{job.companyName}</span>
          <Badge kind={job.status} label={STATUS_LABELS[job.status] ?? job.status} pulse={ACTIVE_STATUSES.includes(job.status)} />
        </div>
      </Topbar>
      <div className="content">
        <div className="three-col">
          {/* LEFT: pipeline */}
          <div>
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Pipeline</div>
                  <div className="card-sub">Live updates</div>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--success)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }} />
                  SSE
                </span>
              </div>
              <div className="card-pad">
                <Stepper events={events} jobStatus={job.status} />
              </div>
            </div>
          </div>

          {/* CENTER: shortlist */}
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Shortlist <span style={{ color: 'var(--text-dim)', fontWeight: 400, marginLeft: 4 }}>· {sorted.length} candidates</span></div>
                <div className="card-sub">Sorted by final score · weights {Math.round(weights.match * 100)}/{Math.round(weights.interest * 100)}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-sm" onClick={() => onToast('Filter shortlist')}><Icon name="filter" size={13} /> Filter</button>
                <button className="btn btn-sm" onClick={() => onToast('Exporting shortlist.csv…')}><Icon name="download" size={13} /> CSV</button>
              </div>
            </div>
            <div className="table-wrap">
              {sorted.length === 0 ? (
                <div className="empty-state" style={{ margin: 20 }}>
                  <Icon name="users" size={20} />
                  <div style={{ marginTop: 8 }}>{ACTIVE_STATUSES.includes(job.status) ? 'Discovering candidates…' : 'No candidates yet'}</div>
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}>#</th>
                      <th>Candidate</th>
                      <th>Match</th>
                      <th>Interest</th>
                      <th>Final</th>
                      <th>Skills</th>
                      <th>Email</th>
                      <th style={{ width: 100 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map(c => (
                      <CandidateRow key={c.id} c={c} onClick={setSelected} weights={weights} />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* RIGHT: controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title"><Icon name="sliders" size={13} /> Score Weights</div>
                  <div className="card-sub">Sum locked to 100%</div>
                </div>
              </div>
              <div className="card-pad">
                <div className="slider-row"><span className="l">Match</span><span className="v">{Math.round(weights.match * 100)}%</span></div>
                <input type="range" className="weight-slider" min="0" max="100"
                  value={Math.round(weights.match * 100)}
                  onChange={e => { const m = +e.target.value / 100; setWeights({ match: m, interest: 1 - m }); }} />
                <div className="slider-row" style={{ marginTop: 14 }}><span className="l">Interest</span><span className="v">{Math.round(weights.interest * 100)}%</span></div>
                <input type="range" className="weight-slider" min="0" max="100"
                  value={Math.round(weights.interest * 100)}
                  onChange={e => { const it = +e.target.value / 100; setWeights({ match: 1 - it, interest: it }); }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 11.5, color: 'var(--text-dim)' }}>
                  <Icon name="lock" size={11} /> Always sum to 100%
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-head"><div className="card-title">Job Metadata</div></div>
              <div className="card-pad">
                <dl className="kv">
                  <dt>Job ID</dt><dd className="mono">{job.id.slice(0, 8)}…</dd>
                  <dt>Company</dt><dd>{job.companyName}</dd>
                  <dt>Status</dt><dd><Badge kind={job.status} label={STATUS_LABELS[job.status] ?? job.status} /></dd>
                  <dt>Created</dt><dd>{new Date(job.createdAt).toLocaleString()}</dd>
                  <dt>Found</dt><dd className="num">{job.candidateCount}</dd>
                  <dt>Sent</dt><dd className="num">{job.emailsSent}</dd>
                  <dt>Replies</dt><dd className="num">{job.replies}</dd>
                </dl>
              </div>
            </div>

            <div className="card">
              <div className="card-head"><div className="card-title">Job Description</div></div>
              <div className="card-pad">
                <p className="mono" style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.55, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {job.jdRaw}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <CandidateDrawer candidate={selected} weights={weights} onClose={() => setSelected(null)} onToast={onToast} />
      )}
    </>
  );
};
