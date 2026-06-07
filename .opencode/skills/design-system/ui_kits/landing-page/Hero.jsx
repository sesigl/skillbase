/* global React, Eyebrow, Button, Icon */
// Centered hero with a code-I/O product visual — the dev-tool standard.

function CommandPill() {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
        background: 'var(--stone-950)',
        border: '1px solid var(--code-border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px 12px 16px',
        fontFamily: 'var(--font-mono)',
        fontSize: 14,
        color: 'var(--stone-100)',
      }}
    >
      <span style={{ color: 'var(--lime-300)' }}>$</span>
      <span>
        skillbase stats <span style={{ color: '#7fd0ff' }}>--repo=acme/skills</span>
      </span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginLeft: 6,
          color: copied ? 'var(--lime-300)' : 'var(--stone-500)',
        }}
      >
        <Icon name={copied ? 'check' : 'copy'} size={15} />
      </span>
    </button>
  );
}

function HeroVisual() {
  const rows = [
    {
      ic: 'git-commit-horizontal',
      n: 'commit-helper',
      a: 'anthropic',
      d: 'Conventional Commits from your staged diff',
      t: ['git', 'automation'],
    },
    {
      ic: 'flask-conical',
      n: 'test-runner',
      a: 'community',
      d: 'Run Vitest and explain failures in plain language',
      t: ['testing', 'vitest'],
    },
    {
      ic: 'file-search',
      n: 'spec-writer',
      a: 'skillbase',
      d: 'Scaffold a spec from a one-line description',
      t: ['specs', 'docs'],
    },
  ];
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--stone-200)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        width: 'min(680px, 92vw)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '13px 16px',
          borderBottom: '1px solid var(--stone-100)',
        }}
      >
        <Icon name="search" size={16} style={{ color: 'var(--fg-faint)' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-muted)' }}>
          git
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--fg-faint)',
          }}
        >
          3 of 1,284 skills
        </span>
      </div>
      {rows.map((r, i) => (
        <div
          key={r.n}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '15px 18px',
            borderBottom: i < rows.length - 1 ? '1px solid var(--stone-100)' : 'none',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'var(--lime-50)',
              border: '1px solid var(--lime-200)',
              display: 'grid',
              placeItems: 'center',
              flex: 'none',
            }}
          >
            <Icon name={r.ic} size={18} style={{ color: 'var(--lime-700)' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              {r.n}
              <span style={{ color: 'var(--stone-400)' }}>@</span>
              <span style={{ color: 'var(--fg-muted)' }}>{r.a}</span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: 'var(--fg-muted)',
                marginTop: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {r.d}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flex: 'none' }}>
            {r.t.map((t) => (
              <span
                key={t}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  padding: '3px 9px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--stone-200)',
                  color: 'var(--fg-muted)',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Hero() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          backgroundImage: 'radial-gradient(var(--stone-200) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          opacity: 0.5,
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, #000 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, #000 30%, transparent 75%)',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 'var(--maxw-content)',
          margin: '0 auto',
          padding: '84px 28px 72px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Eyebrow style={{ marginBottom: 22 }}>// open source · MIT · self-hostable</Eyebrow>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            color: 'var(--ink)',
            fontSize: 'clamp(2.6rem, 5.2vw + 1rem, 4.4rem)',
            lineHeight: 1.04,
            letterSpacing: '-0.03em',
            margin: 0,
            maxWidth: 14 + 'ch',
          }}
        >
          One base for every
          <br />
          <span style={{ color: 'var(--lime-600)' }}>coding skill.</span>
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'clamp(1rem, 0.6vw + 0.9rem, 1.2rem)',
            lineHeight: 1.6,
            color: 'var(--fg-muted)',
            maxWidth: '52ch',
            margin: '22px 0 0',
          }}
        >
          Skillbase is the governance and analytics tool for{' '}
          <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>Claude Code</strong> and{' '}
          <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>OpenCode</strong> skills. Point
          it at your repo, see what's used, and measure what helps.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 30,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Button variant="primary" size="lg" icon="arrow-right">
            View on GitHub
          </Button>
          <Button variant="secondary" size="lg" icon="book-open">
            Read the docs
          </Button>
        </div>
        <div style={{ marginTop: 18 }}>
          <CommandPill />
        </div>
        <div style={{ marginTop: 56, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Hero, HeroVisual, CommandPill });
