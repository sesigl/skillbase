/* global React, Icon, Tag, Badge */
// Filter rail, skill card, results grid, and empty state.

function RailSection({ title, children }) {
  return (
    <div style={{ paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--fg-faint)',
          marginBottom: 13,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function CheckRow({ label, count, checked, onToggle }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '5px 0',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: 'var(--radius-xs)',
          flex: 'none',
          border: `1.5px solid ${checked ? 'var(--lime-500)' : 'var(--border-strong)'}`,
          background: checked ? 'var(--lime-400)' : 'transparent',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {checked && <Icon name="check" size={11} style={{ color: 'var(--ink)' }} />}
      </span>
      <input type="checkbox" checked={checked} onChange={onToggle} style={{ display: 'none' }} />
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'var(--fg)', flex: 1 }}>
        {label}
      </span>
      {count != null && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--fg-faint)' }}>
          {count}
        </span>
      )}
    </label>
  );
}

function FilterRail({ filters, setFilters, counts }) {
  const toggle = (key, val) =>
    setFilters((f) => {
      const set = new Set(f[key]);
      set.has(val) ? set.delete(val) : set.add(val);
      return { ...f, [key]: [...set] };
    });
  return (
    <aside style={{ width: 232, flex: 'none' }}>
      <RailSection title="Agent">
        {window.ALL_AGENTS.map((a) => (
          <CheckRow
            key={a}
            label={a}
            count={counts.agents[a] || 0}
            checked={filters.agents.includes(a)}
            onToggle={() => toggle('agents', a)}
          />
        ))}
      </RailSection>
      <RailSection title="License">
        {window.ALL_LICENSES.map((l) => (
          <CheckRow
            key={l}
            label={l}
            count={counts.licenses[l] || 0}
            checked={filters.licenses.includes(l)}
            onToggle={() => toggle('licenses', l)}
          />
        ))}
      </RailSection>
      <RailSection title="Tags">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {window.ALL_TAGS.slice(0, 9).map((t) => (
            <Tag key={t} active={filters.tags.includes(t)} onClick={() => toggle('tags', t)}>
              {t}
            </Tag>
          ))}
        </div>
      </RailSection>
      {filters.agents.length + filters.licenses.length + filters.tags.length > 0 && (
        <button
          onClick={() => setFilters({ agents: [], licenses: [], tags: [] })}
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            color: 'var(--accent-text)',
            background: 'none',
            border: 0,
            cursor: 'pointer',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Icon name="x" size={14} /> Clear filters
        </button>
      )}
    </aside>
  );
}

function SkillCard({ skill, onOpen }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={() => onOpen(skill)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        font: 'inherit',
        background: 'var(--surface)',
        border: '1px solid var(--stone-200)',
        borderColor: hover ? 'var(--border-strong)' : 'var(--stone-200)',
        borderRadius: 'var(--radius-lg)',
        padding: 18,
        boxShadow: hover ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'all var(--dur-base) var(--ease-out)',
        display: 'flex',
        flexDirection: 'column',
        gap: 11,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-md)',
            background: 'var(--lime-50)',
            border: '1px solid var(--lime-200)',
            display: 'grid',
            placeItems: 'center',
            flex: 'none',
          }}
        >
          <Icon name={skill.icon} size={19} style={{ color: 'var(--lime-700)' }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--ink)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {skill.name}
            <span style={{ color: 'var(--stone-400)' }}>@</span>
            <span style={{ color: 'var(--fg-muted)' }}>{skill.author}</span>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--fg-faint)',
              marginTop: 2,
            }}
          >
            v{skill.version}
          </div>
        </div>
        {skill.verified && (
          <span style={{ marginLeft: 'auto', flex: 'none' }}>
            <Icon name="badge-check" size={17} style={{ color: 'var(--lime-600)' }} />
          </span>
        )}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 13.5,
          lineHeight: 1.5,
          color: 'var(--fg-muted)',
        }}
      >
        {skill.desc}
      </div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 2 }}>
        {skill.tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 16,
          paddingTop: 11,
          borderTop: '1px solid var(--stone-100)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11.5,
          color: 'var(--fg-faint)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Icon name="bar-chart-horizontal" size={13} />
          {skill.invocations.toLocaleString()}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Icon name="scale" size={13} />
          {skill.license}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
          <Icon name="clock" size={13} />
          {skill.updated}
        </span>
      </div>
    </button>
  );
}

function EmptyState({ query, onClear }) {
  return (
    <div
      style={{
        gridColumn: '1 / -1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '64px 24px',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 'var(--radius-lg)',
          background: 'var(--surface-2)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Icon name="search-x" size={24} style={{ color: 'var(--fg-faint)' }} />
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 19,
          color: 'var(--ink)',
        }}
      >
        No skills match that search
      </div>
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          color: 'var(--fg-muted)',
          maxWidth: '42ch',
          lineHeight: 1.5,
        }}
      >
        {query ? (
          <>
            Nothing for{' '}
            <code
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12.5,
                background: 'var(--accent-wash)',
                color: 'var(--accent-text)',
                padding: '1px 6px',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              {query}
            </code>{' '}
            yet. Try a broader term, or contribute the first one.
          </>
        ) : (
          'Try broadening your filters.'
        )}
      </div>
      <button
        onClick={onClear}
        style={{
          marginTop: 6,
          fontFamily: 'var(--font-sans)',
          fontSize: 13.5,
          fontWeight: 600,
          color: 'var(--ink)',
          background: 'var(--surface)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-md)',
          padding: '9px 15px',
          cursor: 'pointer',
        }}
      >
        Reset search
      </button>
    </div>
  );
}

Object.assign(window, { FilterRail, SkillCard, EmptyState });
