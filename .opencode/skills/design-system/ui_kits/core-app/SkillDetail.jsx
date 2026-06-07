/* global React, Icon, Tag, Badge, Button */
// Skill detail view — header, manifest preview, metadata sidebar, usage stats.

function InstallBox({ skill }) {
  const [copied, setCopied] = React.useState(false);
  const cmd = `skillbase stats --skill ${skill.name}@${skill.author}`;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--stone-950)',
        border: '1px solid var(--code-border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 12px 12px 16px',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13.5,
          color: 'var(--stone-100)',
          flex: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        <span style={{ color: 'var(--lime-300)' }}>$</span> {cmd}
      </span>
      <button
        onClick={() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: copied ? 'var(--lime-300)' : 'var(--stone-400)',
          background: 'none',
          border: 0,
          cursor: 'pointer',
          flex: 'none',
        }}
      >
        <Icon name={copied ? 'check' : 'copy'} size={15} />
        {copied ? 'copied' : 'copy'}
      </button>
    </div>
  );
}

function MetaRow({ icon, label, children }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 0',
        borderBottom: '1px solid var(--stone-100)',
      }}
    >
      <Icon name={icon} size={15} style={{ color: 'var(--fg-faint)', flex: 'none' }} />
      <span
        style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-muted)', flex: 1 }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12.5,
          color: 'var(--ink)',
          textAlign: 'right',
        }}
      >
        {children}
      </span>
    </div>
  );
}

function SkillDetail({ skill, onBack }) {
  const [tab, setTab] = React.useState('overview');
  const tabs = [
    ['overview', 'Overview'],
    ['manifest', 'SKILL.md'],
    ['files', 'Files'],
  ];
  return (
    <div style={{ maxWidth: 'var(--maxw-content)', margin: '0 auto', padding: '28px 24px 80px' }}>
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          fontFamily: 'var(--font-sans)',
          fontSize: 13.5,
          color: 'var(--fg-muted)',
          background: 'none',
          border: 0,
          cursor: 'pointer',
          padding: 0,
          marginBottom: 22,
        }}
      >
        <Icon name="arrow-left" size={15} /> Back to skills
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 22 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--lime-50)',
            border: '1px solid var(--lime-200)',
            display: 'grid',
            placeItems: 'center',
            flex: 'none',
          }}
        >
          <Icon name={skill.icon} size={28} style={{ color: 'var(--lime-700)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                fontSize: 24,
                color: 'var(--ink)',
                margin: 0,
              }}
            >
              {skill.name}
              <span style={{ color: 'var(--stone-400)' }}>@</span>
              <span style={{ color: 'var(--fg-muted)' }}>{skill.author}</span>
            </h1>
            {skill.verified && (
              <Badge tone="success" icon="badge-check">
                verified
              </Badge>
            )}
          </div>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 15,
              color: 'var(--fg-muted)',
              lineHeight: 1.55,
              margin: '10px 0 0',
              maxWidth: '62ch',
            }}
          >
            {skill.desc}
          </p>
        </div>
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 288px', gap: 32, alignItems: 'start' }}
      >
        <div>
          <div style={{ marginBottom: 22 }}>
            <InstallBox skill={skill} />
          </div>

          <div
            style={{
              display: 'flex',
              gap: 2,
              borderBottom: '1px solid var(--border)',
              marginBottom: 20,
            }}
          >
            {tabs.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: 'none',
                  border: 0,
                  padding: '10px 14px',
                  color: tab === id ? 'var(--ink)' : 'var(--fg-muted)',
                  borderBottom: `2px solid ${tab === id ? 'var(--lime-400)' : 'transparent'}`,
                  marginBottom: -1,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 14.5,
                lineHeight: 1.65,
                color: 'var(--fg)',
              }}
            >
              <p style={{ marginTop: 0 }}>{skill.long}</p>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 17,
                  color: 'var(--ink)',
                  margin: '24px 0 10px',
                }}
              >
                Compatibility
              </h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {skill.agents.map((a) => (
                  <Badge key={a} tone="info" icon="zap">
                    {a}
                  </Badge>
                ))}
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 17,
                  color: 'var(--ink)',
                  margin: '24px 0 10px',
                }}
              >
                Tags
              </h3>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {skill.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            </div>
          )}

          {tab === 'manifest' && (
            <div
              style={{
                background: 'var(--stone-950)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--code-border)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--code-border)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--stone-500)',
                }}
              >
                SKILL.md
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: '16px 18px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: 'var(--stone-100)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                <span style={{ color: 'var(--stone-500)' }}>---</span>
                {'\n'}
                <span style={{ color: 'var(--lime-300)' }}>name</span>: {skill.name}
                {'\n'}
                <span style={{ color: 'var(--lime-300)' }}>author</span>: {skill.author}
                {'\n'}
                <span style={{ color: 'var(--lime-300)' }}>version</span>: {skill.version}
                {'\n'}
                <span style={{ color: 'var(--lime-300)' }}>license</span>: {skill.license}
                {'\n'}
                <span style={{ color: 'var(--lime-300)' }}>tags</span>: [{skill.tags.join(', ')}]
                {'\n'}
                <span style={{ color: 'var(--stone-500)' }}>---</span>
                {'\n\n'}
                <span style={{ color: '#7fd0ff' }}># {skill.name}</span>
                {'\n\n'}
                {skill.long}
              </pre>
            </div>
          )}

          {tab === 'files' && (
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
              }}
            >
              {[
                ['file-text', 'SKILL.md', '1.2 KB'],
                ['folder', 'scripts/', '2 files'],
                ['folder', 'templates/', '1 file'],
                ['scale', 'LICENSE', '1.1 KB'],
              ].map(([ic, n, s], i) => (
                <div
                  key={n}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    padding: '12px 16px',
                    borderTop: i ? '1px solid var(--stone-100)' : 'none',
                  }}
                >
                  <Icon
                    name={ic}
                    size={16}
                    style={{ color: ic === 'folder' ? 'var(--lime-600)' : 'var(--fg-faint)' }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      color: 'var(--ink)',
                      flex: 1,
                    }}
                  >
                    {n}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11.5,
                      color: 'var(--fg-faint)',
                    }}
                  >
                    {s}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside>
          <Button
            variant="primary"
            icon="download"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 18 }}
          >
            Install skill
          </Button>
          <MetaRow icon="tag" label="Version">
            v{skill.version}
          </MetaRow>
          <MetaRow icon="scale" label="License">
            {skill.license}
          </MetaRow>
          <MetaRow icon="bar-chart-horizontal" label="Invocations">
            {skill.invocations.toLocaleString()}
          </MetaRow>
          <MetaRow icon="user" label="Author">
            {skill.author}
          </MetaRow>
          <MetaRow icon="clock" label="Updated">
            {skill.updated}
          </MetaRow>
          <a
            href="#"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              marginTop: 16,
              fontFamily: 'var(--font-sans)',
              fontSize: 13.5,
              color: 'var(--accent-text)',
              textDecoration: 'none',
            }}
          >
            <Icon name="github" size={15} /> View source
          </a>
        </aside>
      </div>
    </div>
  );
}

Object.assign(window, { SkillDetail });
