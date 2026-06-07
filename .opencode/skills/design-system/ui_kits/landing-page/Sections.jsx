/* global React, Eyebrow, Button, Icon */
// Trust bar, feature mini-products, how-it-works, and CTA band.

function TrustBar() {
  const stats = [
    { v: '1,284', l: 'invocations tracked' },
    { v: '4.2k', l: 'GitHub stars' },
    { v: '320+', l: 'contributors' },
    { v: 'MIT', l: 'licensed' },
  ];
  return (
    <section
      style={{
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-sunk)',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--maxw-content)',
          margin: '0 auto',
          padding: '26px 28px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 28,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12.5,
            color: 'var(--fg-faint)',
            letterSpacing: '0.04em',
          }}
        >
          Works with the agents you already run
        </span>
        <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap' }}>
          {stats.map((s) => (
            <div key={s.l} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 22,
                  color: 'var(--ink)',
                  letterSpacing: '-0.02em',
                }}
              >
                {s.v}
              </span>
              <span
                style={{ fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--fg-muted)' }}
              >
                {s.l}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, body, span }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        gridColumn: span ? 'span 2' : 'span 1',
        background: 'var(--surface)',
        border: '1px solid var(--stone-200)',
        borderColor: hover ? 'var(--border-strong)' : 'var(--stone-200)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        boxShadow: hover ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'all var(--dur-base) var(--ease-out)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-md)',
          background: 'var(--ink)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Icon name={icon} size={20} style={{ color: 'var(--lime-400)' }} />
      </div>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 19,
          color: 'var(--ink)',
          margin: '4px 0 0',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 14.5,
          lineHeight: 1.55,
          color: 'var(--fg-muted)',
          margin: 0,
        }}
      >
        {body}
      </p>
    </div>
  );
}

function Features() {
  return (
    <section
      style={{ maxWidth: 'var(--maxw-content)', margin: '0 auto', padding: '92px 28px 40px' }}
    >
      <div style={{ maxWidth: '44ch', marginBottom: 40 }}>
        <Eyebrow>// what you get</Eyebrow>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 'clamp(1.9rem, 2vw + 1rem, 2.6rem)',
            color: 'var(--ink)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            margin: '14px 0 0',
          }}
        >
          A single place for the skills your agent runs.
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <FeatureCard
          icon="search"
          title="Point at your repo"
          body="Configure a GitHub plugin repo and Skillbase reads every SKILL.md manifest. Always in sync — no publishing step."
        />
        <FeatureCard
          icon="box"
          title="See what's used"
          body="Track which named skills are invoked, how often, and by whom. Dead skills surface at a glance."
        />
        <FeatureCard
          icon="terminal"
          title="Governance gates"
          body="Enforce metadata rules: required tags, version format, license compliance. Non-compliant skills are flagged."
        />
        <FeatureCard
          icon="git-branch"
          title="Version history"
          body="Every skill change is tracked via git history. See what changed, when, and by whom — alongside usage data."
        />
        <FeatureCard
          icon="server"
          title="Self-host everything"
          body="PostgreSQL + Astro SSR. Your skill data and analytics stay on your infrastructure. No cloud telemetry unless you opt in."
        />
        <FeatureCard
          icon="shield-check"
          title="Quality scores"
          body="Measure whether skills improve outcomes. Fewer errors, faster completions — quantified and ranked."
        />
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: '01',
      t: 'Find a skill',
      d: 'Search or browse your skill inventory. Filter by agent, tag, or license.',
    },
    {
      n: '02',
      t: 'Install it',
      d: 'Run one command. Skillbase resolves the manifest and supporting files.',
    },
    { n: '03', t: 'Ship', d: "Your agent loads the skill. Run pnpm run verify and you're done." },
  ];
  return (
    <section
      style={{ maxWidth: 'var(--maxw-content)', margin: '0 auto', padding: '52px 28px 92px' }}
    >
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}
      >
        <div>
          <Eyebrow>// how it works</Eyebrow>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(1.8rem, 1.6vw + 1rem, 2.3rem)',
              color: 'var(--ink)',
              letterSpacing: '-0.02em',
              lineHeight: 1.12,
              margin: '14px 0 28px',
            }}
          >
            From search to shipped in three steps.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {steps.map((s) => (
              <div
                key={s.n}
                style={{
                  display: 'flex',
                  gap: 18,
                  padding: '16px 0',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--lime-600)',
                    flex: 'none',
                    width: 28,
                  }}
                >
                  {s.n}
                </span>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      fontSize: 17,
                      color: 'var(--ink)',
                    }}
                  >
                    {s.t}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 14,
                      color: 'var(--fg-muted)',
                      marginTop: 3,
                      lineHeight: 1.5,
                    }}
                  >
                    {s.d}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            background: 'var(--stone-950)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px 22px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--code-border)',
          }}
        >
          <div style={{ display: 'flex', gap: 7, marginBottom: 16 }}>
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e' }} />
            <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
          </div>
          <pre
            style={{
              margin: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: 13.5,
              lineHeight: 1.8,
              color: 'var(--stone-100)',
              whiteSpace: 'pre-wrap',
            }}
          >
            <span style={{ color: 'var(--stone-500)' }}># search your skills</span>
            {'\n'}
            <span style={{ color: 'var(--lime-300)' }}>$</span> pnpm skillbase search{' '}
            <span style={{ color: '#7fd0ff' }}>git</span>
            {'\n'}
            <span style={{ color: 'var(--stone-400)' }}> commit-helper@anthropic v0.4.2</span>
            {'\n'}
            <span style={{ color: 'var(--stone-400)' }}> pr-describer@community v0.2.0</span>
            {'\n\n'}
            <span style={{ color: 'var(--stone-500)' }}># check governance</span>
            {'\n'}
            <span style={{ color: 'var(--lime-300)' }}>$</span> skillbase governance{' '}
            <span style={{ color: '#7fd0ff' }}>--repo=acme/skills</span>
            {'\n'}
            <span style={{ color: '#9ee63b' }}>✓</span> 5 skills · 100% compliant{'\n'}
            <span style={{ color: '#9ee63b' }}>✓</span> 284 invocations across 12 users
          </pre>
        </div>
      </div>
    </section>
  );
}

function CTABand() {
  return (
    <section style={{ background: 'var(--ink)', position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(oklch(1 0 0 / 0.05) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div
        style={{
          position: 'relative',
          maxWidth: 'var(--maxw-content)',
          margin: '0 auto',
          padding: '80px 28px',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 'clamp(2rem, 3vw + 1rem, 3rem)',
            color: 'var(--stone-100)',
            letterSpacing: '-0.025em',
            lineHeight: 1.08,
            margin: 0,
          }}
        >
          Build on a base, not from scratch.
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 16.5,
            color: 'var(--stone-400)',
            maxWidth: '46ch',
            margin: '18px auto 0',
            lineHeight: 1.6,
          }}
        >
          Skillbase is free and open source. Point it at your repo, or self-host it on your own
          infrastructure today.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 30,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Button variant="primary" size="lg" icon="arrow-right">
            View on GitHub
          </Button>
          <Button
            variant="secondary"
            size="lg"
            icon="github"
            style={{
              background: 'transparent',
              color: 'var(--stone-100)',
              borderColor: 'var(--stone-700)',
            }}
          >
            Star on GitHub
          </Button>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { TrustBar, Features, FeatureCard, HowItWorks, CTABand });
