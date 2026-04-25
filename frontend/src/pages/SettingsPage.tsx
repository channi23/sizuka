import { Topbar } from '../components/Shell';

interface Props {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  onNav: (v: any) => void;
  onToast: (msg: string) => void;
}

export const SettingsPage = ({ theme, setTheme, onNav, onToast }: Props) => (
  <>
    <Topbar theme={theme} setTheme={setTheme} onNav={onNav} onToast={onToast}>
      <div className="greet">
        <h1>Settings</h1>
        <p>Workspace, agent, and integrations</p>
      </div>
    </Topbar>
    <div className="content">
      <div className="card card-pad" style={{ maxWidth: 720 }}>
        <div className="section-h" style={{ marginTop: 0 }}>Agent Behavior</div>
        <div className="field">
          <label className="field-label">Outreach Tone</label>
          <select className="input">
            <option>Warm & curious (default)</option>
            <option>Direct & technical</option>
            <option>Formal</option>
          </select>
        </div>
        <div className="field">
          <label className="field-label">Daily send cap per job</label>
          <input className="input" defaultValue="25" />
        </div>
        <div className="field">
          <label className="field-label">Reply detection</label>
          <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>
            Sizuka watches the inbox you connected. Auto-classifies replies as interested / declined / question / OOO.
          </p>
        </div>
        <div className="section-h">Integrations</div>
        <div className="field">
          <label className="field-label">Resend API</label>
          <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>
            Connected · onboarding@resend.dev
          </p>
        </div>
        <div className="field">
          <label className="field-label">GitHub Token</label>
          <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>Connected · used for candidate discovery</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 22 }}>
          <button className="btn btn-primary" onClick={() => onToast('Settings saved')}>Save changes</button>
        </div>
      </div>
    </div>
  </>
);
