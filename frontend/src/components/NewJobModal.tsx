import { useState } from 'react';
import { Icon } from './Icon';

interface Props {
  onClose: () => void;
  onSubmit: (data: { company: string; jd: string }) => void;
}

export const NewJobModal = ({ onClose, onSubmit }: Props) => {
  const [company, setCompany] = useState('');
  const [jd, setJd] = useState('');

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="drawer wide">
        <div className="drawer-head">
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>New Scouting Job</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Sizuka will parse your JD, discover candidates, score them, and reach out automatically.
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="drawer-body">
          <div className="field">
            <label className="field-label">Company Name</label>
            <input className="input" placeholder="Acme Robotics" value={company} onChange={e => setCompany(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">Job Description</label>
            <textarea
              className="textarea mono"
              rows={16}
              placeholder={"Paste the full JD here.\n\nInclude must-haves, nice-to-haves, location, and any seniority signal — Sizuka picks up structure without templates."}
              value={jd}
              onChange={e => setJd(e.target.value)}
              style={{ fontSize: 12.5, minHeight: 320 }}
            />
            <div className="field-hint">Min 50 chars · plain text or markdown</div>
          </div>
          <div className="field">
            <label className="field-label">Sources</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}><Icon name="git" size={13} /> GitHub <Icon name="check" size={11} /></button>
              <button className="btn btn-sm" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>HN <Icon name="check" size={11} /></button>
              <button className="btn btn-sm dim" disabled>LinkedIn <span className="dim" style={{ fontSize: 10 }}>(soon)</span></button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 22 }}>
            <button className="btn" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={() => { if (company && jd.length >= 50) onSubmit({ company, jd }); }}
              disabled={!company || jd.length < 50}
            >
              Start Scouting <Icon name="arrow" size={13} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
