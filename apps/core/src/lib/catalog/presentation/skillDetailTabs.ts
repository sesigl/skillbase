export function initializeSkillDetailTabs(root: ParentNode = document): void {
  const tabRoots = Array.from(root.querySelectorAll<HTMLElement>('[data-skill-detail-tabs]'));

  for (const tabRoot of tabRoots) {
    if (tabRoot.dataset.skillDetailTabsReady === 'true') continue;

    const tablist = tabRoot.querySelector<HTMLElement>('[role="tablist"]');
    if (!tablist) continue;

    const tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    const panels = Array.from(tabRoot.querySelectorAll<HTMLElement>('[role="tabpanel"]'));

    if (tabs.length === 0 || panels.length === 0) continue;

    tabRoot.dataset.skillDetailTabsReady = 'true';

    for (const tab of tabs) {
      tab.addEventListener('click', () => {
        activateTab(tab, tabs, panels);
      });
    }

    tablist.addEventListener('keydown', (event) => {
      activateTabByKey(event, tabs, panels);
    });
  }
}

function activateTabByKey(
  event: KeyboardEvent,
  tabs: HTMLButtonElement[],
  panels: HTMLElement[]
): void {
  const currentIndex = tabs.indexOf(document.activeElement as HTMLButtonElement);
  if (currentIndex === -1) return;

  let nextIndex: number;

  if (event.key === 'ArrowRight') {
    nextIndex = (currentIndex + 1) % tabs.length;
  } else if (event.key === 'ArrowLeft') {
    nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  } else if (event.key === 'Home') {
    nextIndex = 0;
  } else if (event.key === 'End') {
    nextIndex = tabs.length - 1;
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    activateTab(tabs[currentIndex], tabs, panels);
    return;
  } else {
    return;
  }

  event.preventDefault();
  tabs[nextIndex].focus();
  activateTab(tabs[nextIndex], tabs, panels);
}

function activateTab(
  selectedTab: HTMLButtonElement,
  tabs: HTMLButtonElement[],
  panels: HTMLElement[]
): void {
  const selectedId = selectedTab.getAttribute('data-tab');

  for (const tab of tabs) {
    const isSelected = tab.getAttribute('data-tab') === selectedId;
    tab.setAttribute('aria-selected', String(isSelected));
    tab.tabIndex = isSelected ? 0 : -1;

    if (isSelected) {
      tab.classList.add(
        'border-[var(--border)]',
        'bg-[var(--surface)]',
        'text-[var(--accent-text)]',
        'shadow-sm'
      );
      tab.classList.remove('border-transparent', 'text-[var(--fg-muted)]');
    } else {
      tab.classList.add('border-transparent', 'text-[var(--fg-muted)]');
      tab.classList.remove(
        'border-[var(--border)]',
        'bg-[var(--surface)]',
        'text-[var(--accent-text)]',
        'shadow-sm'
      );
    }
  }

  for (const panel of panels) {
    panel.hidden = panel.id !== `panel-${selectedId}`;
  }
}
