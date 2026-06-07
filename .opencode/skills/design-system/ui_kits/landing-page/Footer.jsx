/* global React, Logo, Icon */
// Site footer with GitHub, license, and sponsor links.

function Footer() {
  const cols = [
    { h: 'Product', links: ['Browse skills', 'Governance rules', 'Changelog', 'Status'] },
    { h: 'Develop', links: ['Documentation', 'Skill format', 'Self-hosting', 'API reference'] },
    { h: 'Community', links: ['GitHub', 'Discussions', 'Contributing', 'Code of conduct'] },
  ];
  return (
    <footer style={{ background: 'var(--bg-sunk)', borderTop: '1px solid var(--border)' }}>
      <div
        style={{
          maxWidth: 'var(--maxw-content)',
          margin: '0 auto',
          padding: '56px 28px 36px',
          display: 'grid',
          gridTemplateColumns: '1.4fr repeat(3, 1fr)',
          gap: 32,
        }}
      >
        <div>
          <Logo size={26} />
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13.5,
              color: 'var(--fg-muted)',
              lineHeight: 1.6,
              margin: '16px 0 0',
              maxWidth: '30ch',
            }}
          >
            Governance and analytics for AI coding skills. Built by the community.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            {['github', 'twitter', 'rss'].map((i) => (
              <a
                key={i}
                href="#"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--fg-muted)',
                  textDecoration: 'none',
                }}
              >
                <Icon name={i} size={16} />
              </a>
            ))}
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.h}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11.5,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--fg-faint)',
                marginBottom: 14,
              }}
            >
              {c.h}
            </div>
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {c.links.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 14,
                      color: 'var(--fg-muted)',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => (e.target.style.color = 'var(--ink)')}
                    onMouseLeave={(e) => (e.target.style.color = 'var(--fg-muted)')}
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <div
          style={{
            maxWidth: 'var(--maxw-content)',
            margin: '0 auto',
            padding: '20px 28px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--fg-faint)' }}
          >
            © 2026 Skillbase · MIT License
          </span>
          <div style={{ display: 'flex', gap: 18 }}>
            <a
              href="#"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: 'var(--fg-muted)',
                textDecoration: 'none',
              }}
            >
              <Icon name="heart" size={14} style={{ color: 'var(--lime-600)' }} /> Sponsor
            </a>
            <a
              href="#"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: 'var(--fg-muted)',
                textDecoration: 'none',
              }}
            >
              Privacy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Footer });
