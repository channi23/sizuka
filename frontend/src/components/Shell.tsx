import { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';

type View = 'dashboard' | 'shortlist' | 'outreach' | 'settings' | 'jobdetail';
type Theme = 'light' | 'dark';

interface AvatarProps { hue?: number; name?: string; size?: number; }
export const Avatar = ({ hue = 220, name = '?', size = 28 }: AvatarProps) => {
  const init = name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  const bg = `linear-gradient(135deg, oklch(0.55 0.14 ${hue}), oklch(0.40 0.14 ${(hue + 40) % 360}))`;
  return (
    <div className="cand-avatar" style={{ background: bg, width: size, height: size, fontSize: size * 0.40 }}>
      {init}
    </div>
  );
};

interface SourceBadgeProps { source: string; }
export const SourceBadge = ({ source }: SourceBadgeProps) => (
  <span className="source-badge">
    {source === 'GitHub' ? (
      <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10">
        <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.8 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.8-1.4-3.8-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.2 1.2.9-.3 1.9-.4 2.9-.4s2 .1 2.9.4c2.2-1.5 3.2-1.2 3.2-1.2.6 1.7.2 2.9.1 3.2.7.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.5-1.5 7.8-5.8 7.8-10.9C23.5 5.7 18.3.5 12 .5z"/>
      </svg>
    ) : (
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 10, lineHeight: 1, color: '#FB923C' }}>Y</span>
    )}
    {source}
  </span>
);

interface BadgeProps { kind: string; label: string; pulse?: boolean; }
export const Badge = ({ kind, label, pulse }: BadgeProps) => (
  <span className={`badge ${kind}${pulse ? ' pulse' : ''}`}>
    <span className="badge-dot" />
    {label}
  </span>
);

interface ScoreBarProps { value: number; bold?: boolean; width?: number; }
export const ScoreBar = ({ value, bold = false, width = 110 }: ScoreBarProps) => (
  <div className="score-cell" style={{ minWidth: width }}>
    <div className="score-bar">
      <div className="score-bar-fill" style={{ width: `${value}%` }} />
    </div>
    <span className={`score-num${bold ? ' bold' : ''}`}>{value}%</span>
  </div>
);

interface SidebarProps {
  active: View;
  onNav: (v: View) => void;
  counts?: { jobs?: number; shortlist?: number; outreach?: number };
}
export const Sidebar = ({ active, onNav, counts = {} }: SidebarProps) => {
  const items = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: 'home' },
    { id: 'shortlist' as View, label: 'Shortlist', icon: 'star', count: counts.shortlist },
    { id: 'outreach' as View, label: 'Outreach', icon: 'mail', count: counts.outreach },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" />
        <div className="brand-text">
          <div className="brand-name">Sizuka</div>
          <div className="brand-sub">AI Talent Scout</div>
        </div>
      </div>
      <div className="nav-label">Workspace</div>
      {items.map(it => (
        <div key={it.id} className={`nav-item${active === it.id || (active === 'jobdetail' && it.id === 'dashboard') ? ' active' : ''}`} onClick={() => onNav(it.id)}>
          <Icon name={it.icon} />
          <span>{it.label}</span>
          {it.count != null && <span className="nav-count">{it.count}</span>}
        </div>
      ))}
      <div className="nav-label" style={{ marginTop: 6 }}>Account</div>
      <div className={`nav-item${active === 'settings' ? ' active' : ''}`} onClick={() => onNav('settings')}>
        <Icon name="settings" />
        <span>Settings</span>
      </div>
      <div className="sidebar-foot" onClick={() => onNav('settings')} style={{ cursor: 'pointer' }}>
        <Avatar hue={250} name="Lila Park" size={32} />
        <div className="user-info">
          <div className="user-name">Lila Park</div>
          <div className="user-email">lila@yourcorp.com</div>
        </div>
        <Icon name="chevron" size={14} />
      </div>
    </aside>
  );
};

interface TopbarProps {
  children?: React.ReactNode;
  theme: Theme;
  setTheme: (t: Theme) => void;
  onNav: (v: View) => void;
  onToast: (msg: string) => void;
}
export const Topbar = ({ children, theme, setTheme, onNav, onToast }: TopbarProps) => (
  <div className="topbar">
    <div style={{ flex: 1 }}>{children}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div className="search-box">
        <Icon name="search" size={14} />
        <input placeholder="Search candidates, jobs…" readOnly />
        <span className="kbd">⌘K</span>
      </div>
      <ThemeToggle theme={theme} setTheme={setTheme} />
      <button className="icon-btn bordered" title="Notifications" onClick={() => onToast('No new notifications')}>
        <Icon name="bell" />
      </button>
      <ProfileMenu onNav={onNav} onToast={onToast} />
    </div>
  </div>
);

interface ThemeToggleProps { theme: Theme; setTheme: (t: Theme) => void; }
const ThemeToggle = ({ theme, setTheme }: ThemeToggleProps) => (
  <div className="theme-toggle" role="group">
    <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')} title="Light mode"><Icon name="sun" /></button>
    <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')} title="Dark mode"><Icon name="moon" /></button>
  </div>
);

interface ProfileMenuProps { onNav: (v: View) => void; onToast: (msg: string) => void; }
const ProfileMenu = ({ onNav, onToast }: ProfileMenuProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="icon-btn bordered" onClick={() => setOpen(o => !o)} title="Profile">
        <Avatar hue={250} name="Lila Park" size={22} />
      </button>
      {open && (
        <div className="dropdown" style={{ right: 0, top: 40 }}>
          <div className="dropdown-head">
            <Avatar hue={250} name="Lila Park" size={36} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Lila Park</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>lila@yourcorp.com</div>
            </div>
          </div>
          <div className="dropdown-item" onClick={() => { setOpen(false); onToast('Profile · viewing your account'); }}><Icon name="user" /> Your profile</div>
          <div className="dropdown-item" onClick={() => { setOpen(false); onNav('settings'); }}><Icon name="settings" /> Settings</div>
          <div className="dropdown-item" onClick={() => { setOpen(false); onToast('Keyboard shortcuts · Press ? anytime'); }}><Icon name="keyboard" /> Keyboard shortcuts</div>
          <div className="dropdown-item" onClick={() => { setOpen(false); onToast('Help center opened'); }}><Icon name="help" /> Help & docs</div>
          <div className="dropdown-sep" />
          <div className="dropdown-item danger" onClick={() => { setOpen(false); onToast('Signed out'); }}><Icon name="logout" /> Sign out</div>
        </div>
      )}
    </div>
  );
};

interface ToastItem { id: number; message: string; }
interface ToastStackProps { toasts: ToastItem[]; }
export const ToastStack = ({ toasts }: ToastStackProps) => (
  <div className="toast-stack">
    {toasts.map(t => (
      <div key={t.id} className="toast">
        <span className="dot" />
        {t.message}
      </div>
    ))}
  </div>
);
