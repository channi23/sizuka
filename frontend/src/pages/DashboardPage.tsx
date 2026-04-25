import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { Topbar, Badge, ScoreBar } from '../components/Shell';
import { listJobs } from '../lib/api';
import type { APIJob } from '../types';

const STATUS_LABELS: Record<string, string> = {
  queued: 'Queued', parsing: 'Parsing', discovering: 'Discovering',
  matching: 'Matching', outreach: 'Outreach', complete: 'Complete', failed: 'Failed',
};
const ACTIVE_STATUSES = ['parsing', 'discovering', 'matching', 'outreach'];

const Sparkline = ({ values, color = '#818CF8', width = 80, height = 28 }: { values: number[]; color?: string; width?: number; height?: number }) => {
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} className="kpi-spark">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`${pts} ${width},${height} 0,${height}`} fill={color} opacity="0.10" />
    </svg>
  );
};

interface Props {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  onNav: (v: any) => void;
  onToast: (msg: string) => void;
  onOpenJob: (id: string) => void;
  onNewJob: () => void;
}

export const DashboardPage = ({ theme, setTheme, onNav, onToast, onOpenJob, onNewJob }: Props) => {
  const [jobs, setJobs] = useState<APIJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listJobs().then(setJobs).catch(() => {}).finally(() => setLoading(false));
    const interval = setInterval(() => listJobs().then(setJobs).catch(() => {}), 10000);
    return () => clearInterval(interval);
  }, []);

  const totalCandidates = jobs.reduce((s, j) => s + j.candidateCount, 0);
  const totalSent = jobs.reduce((s, j) => s + j.emailsSent, 0);
  const totalReplies = jobs.reduce((s, j) => s + j.replies, 0);
  const activeJobs = jobs.filter(j => ACTIVE_STATUSES.includes(j.status)).length;

  return (
    <>
      <Topbar theme={theme} setTheme={setTheme} onNav={onNav} onToast={onToast}>
        <div className="greet">
          <h1>Good morning, Lila</h1>
          <p>{activeJobs} jobs running · {totalSent} outreach emails sent · {totalReplies} replies</p>
        </div>
      </Topbar>
      <div className="content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overview</div>
            <h2 style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 600, letterSpacing: '-0.015em' }}>All Jobs</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" onClick={() => onToast('Filter panel · pick by status, source, score range')}><Icon name="filter" size={13} /> Filter</button>
            <button className="btn btn-sm" onClick={() => onToast('Exporting jobs.csv…')}><Icon name="download" size={13} /> Export</button>
            <button className="btn btn-primary" onClick={onNewJob}><Icon name="plus" size={14} /> New Job</button>
          </div>
        </div>

        <div className="kpi-row">
          <div className="kpi">
            <div className="kpi-label"><Icon name="briefcase" /> Total Jobs</div>
            <div className="kpi-value">
              <span>{jobs.length}</span>
              <span className="kpi-trend up"><Icon name="arrowUp" size={11} />{activeJobs} active</span>
            </div>
            <Sparkline values={[1,2,2,3,3,4,4,5,5,6,jobs.length,jobs.length]} color="var(--accent)" />
          </div>
          <div className="kpi">
            <div className="kpi-label"><Icon name="users" /> Candidates Found</div>
            <div className="kpi-value">
              <span>{totalCandidates.toLocaleString()}</span>
            </div>
            <Sparkline values={[0,0,0,1,2,5,8,12,18,25,totalCandidates,totalCandidates]} color="#9333EA" />
          </div>
          <div className="kpi">
            <div className="kpi-label"><Icon name="mail" /> Emails Sent</div>
            <div className="kpi-value">
              <span>{totalSent}</span>
            </div>
            <Sparkline values={[0,0,1,2,4,6,8,10,12,14,totalSent,totalSent]} color="#EA580C" />
          </div>
          <div className="kpi">
            <div className="kpi-label"><Icon name="activity" /> Replies</div>
            <div className="kpi-value">
              <span>{totalReplies}</span>
              {totalSent > 0 && <span className="kpi-trend up"><Icon name="arrowUp" size={11} />{Math.round(totalReplies / totalSent * 100)}%</span>}
            </div>
            <Sparkline values={[0,0,0,1,1,2,3,4,5,totalReplies,totalReplies,totalReplies]} color="var(--success)" />
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Recent Jobs</div>
              <div className="card-sub">{jobs.length} jobs · live pipeline status</div>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={() => { setLoading(true); listJobs().then(setJobs).finally(() => setLoading(false)); }}>
              <Icon name="refresh" size={13} />
            </button>
          </div>
          {loading ? (
            <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-dim)' }}>Loading…</div>
          ) : jobs.length === 0 ? (
            <div className="empty-state" style={{ margin: 20 }}>
              <Icon name="briefcase" size={20} />
              <div style={{ marginTop: 8 }}>No jobs yet</div>
              <div style={{ marginTop: 4 }}>Click "New Job" to start scouting</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 28 }}></th>
                  <th>Job</th>
                  <th>Status</th>
                  <th className="num">Found</th>
                  <th>Match avg</th>
                  <th className="num">Sent</th>
                  <th className="num">Replies</th>
                  <th>Created</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j, i) => (
                  <tr key={j.id} onClick={() => onOpenJob(j.id)}>
                    <td><span className="rank-num">{String(i + 1).padStart(2, '0')}</span></td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{j.jdRaw?.split('\n')[0]?.slice(0, 60) ?? j.id}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>{j.companyName} · <span className="mono">{j.id.slice(0, 8)}</span></div>
                    </td>
                    <td><Badge kind={j.status} label={STATUS_LABELS[j.status] ?? j.status} pulse={ACTIVE_STATUSES.includes(j.status)} /></td>
                    <td className="num">{j.candidateCount || <span className="dim">—</span>}</td>
                    <td>{j.matchAvg ? <ScoreBar value={j.matchAvg} width={90} /> : <span className="dim">—</span>}</td>
                    <td className="num">{j.emailsSent || <span className="dim">—</span>}</td>
                    <td className="num">
                      {j.replies > 0 ? <span style={{ color: 'var(--success)' }}>{j.replies}</span> : <span className="dim">—</span>}
                    </td>
                    <td className="dim" style={{ fontSize: 12 }}>{new Date(j.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-sm" onClick={e => { e.stopPropagation(); onOpenJob(j.id); }}>
                        View <Icon name="chevron" size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};
