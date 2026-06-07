/* global React, Logo, Button, Icon */
// Sticky top navigation for the Skillbase marketing site.

function Nav() {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const el = document.querySelector('[data-scroll]') || window;
    const target = el === window ? window : el;
    const onScroll = () => {
      const y = el === window ? window.scrollY : el.scrollTop;
      setScrolled(y > 8);
    };
    target.addEventListener('scroll', onScroll);
    return () => target.removeEventListener('scroll', onScroll);
  }, []);

  const links = ['Skills', 'Docs', 'Self-host', 'Changelog'];
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: scrolled ? 'color-mix(in oklch, var(--paper) 80%, transparent)' : 'transparent',
        backdropFilter: scrolled ? 'saturate(1.4) blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'all var(--dur-base) var(--ease-out)',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--maxw-wide)',
          margin: '0 auto',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 28,
        }}
      >
        <Logo size={26} />
        <nav style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          {links.map((l) => (
            <a
              key={l}
              href="#"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--fg-muted)',
                textDecoration: 'none',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
              }}
              onMouseEnter={(e) => (e.target.style.color = 'var(--ink)')}
              onMouseLeave={(e) => (e.target.style.color = 'var(--fg-muted)')}
            >
              {l}
            </a>
          ))}
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              fontFamily: 'var(--font-mono)',
              fontSize: 12.5,
              color: 'var(--fg-muted)',
              padding: '7px 12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-pill)',
            }}
          >
            <Icon name="star" size={14} style={{ color: 'var(--lime-600)' }} /> 4.2k
          </span>
          <Button variant="secondary" icon="github">
            GitHub
          </Button>
          <Button variant="primary" icon="arrow-right">
            Browse skills
          </Button>
        </div>
      </div>
    </header>
  );
}

Object.assign(window, { Nav });
