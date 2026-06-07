// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';
import { initializeSkillDetailTabs } from '@lib/catalog/presentation/skillDetailTabs';

describe('initializeSkillDetailTabs', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('shows the source panel when the SKILL.md tab is clicked', () => {
    renderTabs();

    initializeSkillDetailTabs(document);
    sourceTab().click();

    expect(overviewTab().getAttribute('aria-selected')).toBe('false');
    expect(sourceTab().getAttribute('aria-selected')).toBe('true');
    expect(overviewPanel().hidden).toBe(true);
    expect(sourcePanel().hidden).toBe(false);
  });

  it('moves to the next tab with ArrowRight', () => {
    renderTabs();

    initializeSkillDetailTabs(document);
    overviewTab().focus();
    tablist().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    expect(document.activeElement).toBe(sourceTab());
    expect(sourceTab().getAttribute('aria-selected')).toBe('true');
    expect(sourcePanel().hidden).toBe(false);
  });
});

function renderTabs(): void {
  document.body.innerHTML = `
    <section data-skill-detail-tabs>
      <div role="tablist" aria-label="Skill content">
        <button role="tab" data-tab="overview" aria-selected="true" aria-controls="panel-overview" tabindex="0">Overview</button>
        <button role="tab" data-tab="source" aria-selected="false" aria-controls="panel-source" tabindex="-1">SKILL.md</button>
      </div>
      <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">Overview content</div>
      <div role="tabpanel" id="panel-source" aria-labelledby="tab-source" hidden>Source content</div>
    </section>
  `;
}

function overviewTab(): HTMLButtonElement {
  return requireElement<HTMLButtonElement>('[data-tab="overview"]');
}

function sourceTab(): HTMLButtonElement {
  return requireElement<HTMLButtonElement>('[data-tab="source"]');
}

function tablist(): HTMLElement {
  return requireElement<HTMLElement>('[role="tablist"]');
}

function overviewPanel(): HTMLElement {
  return requireElement<HTMLElement>('#panel-overview');
}

function sourcePanel(): HTMLElement {
  return requireElement<HTMLElement>('#panel-source');
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing test element: ${selector}`);
  }
  return element;
}
