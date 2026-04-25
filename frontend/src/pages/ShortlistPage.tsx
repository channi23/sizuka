import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { Topbar, Avatar, SourceBadge, Badge, ScoreBar } from '../components/Shell';
import { CandidateDrawer } from '../components/CandidateDrawer';
import { getOutreachCandidates } from '../lib/api';
import { toUICandidate } from '../types';
import type { UICandidate } from '../types';

interface Props {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  onNav: (v: any) => void;
  onToast: (msg: string) => void;
}

export const ShortlistPage = ({ theme, setTheme, onNav, onToast }: Props) => {
  const [candidates, setCandidates] = useState<UICandidate[]>([]);
  const [drawerCandidate, setDrawerCandidate] = useState<UICandidate | null>(null);
  const weights = { match: 0.6, interest: 0.4 };

  useEffect(() => {
    getOutreachCandidates().then(list => {
      const ui = list
        .sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0))
        .slice(0, 50)
        .map((c, i) => toUICandidate(c, i + 1));
      setCandidates(ui);
    }).catch(() => {});
  }, []);

  return (
    <>
      <Topbar theme={theme} setTheme={setTheme} onNav={onNav} onToast={onToast}>
        <div className="greet">
          <h1>Shortlist</h1>
          <p>Top candidates across all jobs · ranked by final score</p>
        </div>
      </Topbar>
      <div className="content">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Cross-Job Shortlist</div>
              <div className="card-sub">{candidates.length} candidates</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-sm" onClick={() => onToast('Filter')}><Icon name="filter" size={13} /> Filter</button>
              <button className="btn btn-sm" onClick={() => onToast('Exporting shortlist.csv…')}><Icon name="download" size={13} /> CSV</button>
            </div>
          </div>
          {candidates.length === 0 ? (
            <div className="empty-state" style={{ margin: 20 }}>
              <Icon name="star" size={20} />
              <div style={{ marginTop: 8 }}>No scored candidates yet</div>
              <div style={{ marginTop: 4, fontSize: 11 }}>Create a job to start discovering</div>
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
                {candidates.map(c => {
                  const final = Math.round(c.matchScore * weights.match + c.interestScore * weights.interest);
                  return (
                    <tr key={c.id} onClick={() => setDrawerCandidate(c)}>
                      <td><span className="rank-num">#{c.rank}</span></td>
                      <td>
                        <div className="cand-cell">
                          <Avatar hue={c.avatarHue} name={c.name} />
                          <div style={{ minWidth: 0 }}>
                            <div className="cand-name">{c.name}</div>
                            <div className="cand-meta">
                              <SourceBadge source={c.source} />
                              {c.companyName && <span className="dim" style={{ fontSize: 11 }}>{c.companyName}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td><ScoreBar value={c.matchScore} width={100} /></td>
                      <td><ScoreBar value={c.interestScore} width={100} /></td>
                      <td><span style={{ fontSize: 14, fontWeight: 600 }}>{final}%</span></td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 220 }}>
                          {c.skillsMatched.slice(0, 3).map(s => <span key={s} className="pill">{s}</span>)}
                          {c.skillsMatched.length > 3 && <span className="pill" style={{ background: 'transparent', borderColor: 'var(--border)', color: 'var(--text-dim)' }}>+{c.skillsMatched.length - 3}</span>}
                        </div>
                      </td>
                      <td><Badge kind={c.emailStatus} label={c.emailStatus[0].toUpperCase() + c.emailStatus.slice(1)} pulse={c.emailStatus === 'sent'} /></td>
                      <td>
                        <button className="btn btn-sm" onClick={e => { e.stopPropagation(); setDrawerCandidate(c); }}>View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {drawerCandidate && (
        <CandidateDrawer
          candidate={drawerCandidate}
          weights={weights}
          onClose={() => setDrawerCandidate(null)}
          onToast={onToast}
        />
      )}
    </>
  );
};
