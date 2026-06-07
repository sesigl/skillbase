/* global React, Logo, Icon, Button */
// Core-app top bar with inline search.

function AppBar({ query, onQuery, onSubmit }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--maxw-wide)',
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <a href="#" style={{ textDecoration: 'none', flex: 'none' }}>
          <Logo size={24} />
        </a>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--fg-faint)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-pill)',
            padding: '3px 9px',
            flex: 'none',
          }}
        >
          skills
        </span>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit && onSubmit();
          }}
          style={{
            flex: 1,
            maxWidth: 520,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            padding: '9px 13px',
            border: `1px solid ${focus ? 'var(--lime-500)' : 'var(--border-strong)'}`,
            boxShadow: focus ? '0 0 0 3px var(--ring)' : 'none',
            transition: 'all var(--dur-fast) var(--ease-out)',
          }}
        >
          <Icon name="search" size={16} style={{ color: 'var(--fg-faint)' }} />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            placeholder="Search skills by name or description"
            style={{
              flex: 1,
              border: 0,
              outline: 0,
              background: 'transparent',
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              color: 'var(--ink)',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--fg-faint)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xs)',
              padding: '2px 6px',
              flex: 'none',
            }}
          >
            ↵
          </span>
        </form>

        <nav
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flex: 'none',
          }}
        >
          <a
            href="#"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--fg-muted)',
              textDecoration: 'none',
              padding: '8px 12px',
            }}
          >
            Docs
          </a>
          <Button variant="secondary" icon="plus">
            Add skill
          </Button>
          <a
            href="#"
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--fg-muted)',
              flex: 'none',
            }}
          >
            <Icon name="github" size={17} />
          </a>
        </nav>
      </div>
    </header>
  );
}

Object.assign(window, { AppBar });
