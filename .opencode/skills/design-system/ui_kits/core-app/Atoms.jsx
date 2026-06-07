/* global React */
// Shared brand atoms for the Skillbase landing-page UI kit.

function Logo({ size = 28, showText = true, color }) {
  const s = size;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 11,
        color: color || 'var(--ink)',
      }}
    >
      <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden="true">
        <rect x="1.5" y="17" width="13" height="13" rx="3.2" fill="currentColor" />
        <rect x="17.5" y="17" width="13" height="13" rx="3.2" fill="currentColor" />
        <rect x="9.5" y="1.5" width="13" height="13" rx="3.2" fill="#9ee63b" />
      </svg>
      {showText && (
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: s * 0.72,
            letterSpacing: '-0.02em',
          }}
        >
          skillbase
        </span>
      )}
    </span>
  );
}

function Icon({ name, size = 18, style }) {
  // Lucide is created on mount via data-lucide; this renders the placeholder.
  return (
    <i data-lucide={name} style={{ width: size, height: size, display: 'inline-flex', ...style }} />
  );
}

function Eyebrow({ children, style }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--accent-text)',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  as = 'button',
  href,
  onClick,
  style,
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    lineHeight: 1,
    borderRadius: 'var(--radius-md)',
    border: '1px solid transparent',
    transition: 'all var(--dur-fast) var(--ease-out)',
    textDecoration: 'none',
    padding: size === 'lg' ? '14px 22px' : '10px 16px',
    fontSize: size === 'lg' ? 15.5 : 14,
  };
  const variants = {
    primary: { background: 'var(--lime-400)', color: 'var(--ink)' },
    secondary: {
      background: 'var(--surface)',
      color: 'var(--ink)',
      borderColor: 'var(--border-strong)',
    },
    ghost: { background: 'transparent', color: 'var(--fg-muted)' },
    inkfill: { background: 'var(--ink)', color: 'var(--stone-100)' },
  };
  const hoverFor = {
    primary: { background: 'var(--lime-500)' },
    secondary: { borderColor: 'var(--ink)' },
    ghost: { background: 'var(--surface-2)', color: 'var(--ink)' },
    inkfill: { background: 'var(--stone-800)' },
  };
  const [hover, setHover] = React.useState(false);
  const Comp = as;
  return (
    <Comp
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...base, ...variants[variant], ...(hover ? hoverFor[variant] : {}), ...style }}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 18 : 16} />}
      {children}
    </Comp>
  );
}

function Tag({ children, active, onClick, mono = true }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
        fontSize: 12,
        fontWeight: 500,
        padding: '5px 11px',
        borderRadius: 'var(--radius-pill)',
        cursor: onClick ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
        background: active ? 'var(--lime-400)' : 'var(--surface-2)',
        border: `1px solid ${active ? 'var(--lime-400)' : 'var(--stone-200)'}`,
        color: active ? 'var(--ink)' : 'var(--fg-muted)',
        transition: 'all var(--dur-fast) var(--ease-out)',
      }}
    >
      {children}
    </button>
  );
}

function Badge({ children, tone = 'neutral', icon }) {
  const tones = {
    neutral: { bg: 'var(--surface-2)', fg: 'var(--fg-muted)', bd: 'var(--stone-200)' },
    success: { bg: 'var(--success-wash)', fg: 'var(--success)', bd: 'transparent' },
    info: { bg: 'var(--info-wash)', fg: 'var(--info)', bd: 'transparent' },
    warning: { bg: 'var(--warning-wash)', fg: 'var(--warning)', bd: 'transparent' },
  };
  const t = tones[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        fontWeight: 500,
        padding: '4px 9px',
        borderRadius: 'var(--radius-sm)',
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.bd}`,
      }}
    >
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  );
}

Object.assign(window, { Logo, Icon, Eyebrow, Button, Tag, Badge });
