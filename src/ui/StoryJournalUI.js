// StoryJournalUI: the full "story book" modal.
//
// Ten chapters with locked/unlocked/read state, live progress bars against the
// real campaign metrics, one-time rewards and a read toggle. Everything is
// rendered from StoryJournal state; the UI holds no game logic of its own.

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

const METRIC_LABELS = {
  catches: 'fish caught',
  species: 'species discovered',
  zones: 'zones charted',
  islands: 'frontier islands visited',
  boats: 'vessels owned',
  rods: 'rods owned',
  tools: 'tools owned',
  bosses: 'bosses defeated',
  quests: 'quests completed',
  furniture: 'furniture placed',
};

function money(value) {
  return `💰 ${Number(value || 0).toLocaleString()}`;
}

export function initStoryJournalUI(game, options = {}) {
  const modal = document.getElementById(options.modalId || 'story-modal');
  const list = document.getElementById('story-chapter-list');
  const detail = document.getElementById('story-detail');
  const progress = document.getElementById('story-progress');
  const closeBtn = document.getElementById('btn-close-story');
  if (!modal || !list || !detail || !game || !game.storyJournal) return null;

  let selectedId = null;

  function selectedChapter(chapters) {
    if (selectedId) {
      const found = chapters.find((chapter) => chapter.id === selectedId);
      if (found) return found;
    }
    const active = game.storyJournal.getActiveChapter();
    selectedId = active ? active.id : chapters[0]?.id || null;
    return chapters.find((chapter) => chapter.id === selectedId) || chapters[0] || null;
  }

  function chapterCard(chapter) {
    const state = chapter.unlocked ? (chapter.read ? 'read' : 'new') : 'locked';
    return `
      <button class="story-chapter ${state} ${chapter.id === selectedId ? 'active' : ''}" data-chapter="${chapter.id}">
        <span class="story-chapter-mark">${chapter.unlocked ? (chapter.read ? '✓' : '✦') : '🔒'}</span>
        <span class="story-chapter-text">
          <span class="story-chapter-title">${esc(chapter.title)}</span>
          <span class="story-chapter-sub">${esc(chapter.subtitle)} · ${chapter.current}/${chapter.target} ${esc(METRIC_LABELS[chapter.metric] || chapter.metric)}</span>
        </span>
        <span class="story-chapter-percent">${chapter.percent}%</span>
      </button>
    `;
  }

  function renderDetail(chapter) {
    if (!chapter) {
      detail.innerHTML = '<div class="story-empty">No chapters available.</div>';
      return;
    }
    const rewardBits = [];
    if (chapter.rewardCoins) rewardBits.push(money(chapter.rewardCoins));
    if (chapter.rewardGems) rewardBits.push(`💎 ${chapter.rewardGems}`);
    if (chapter.rewardXp) rewardBits.push(`⭐ ${chapter.rewardXp} XP`);

    detail.innerHTML = `
      <div class="story-detail-kicker">Chapter ${game.storyJournal.chapters.findIndex((c) => c.id === chapter.id) + 1} · ${esc(chapter.subtitle)}</div>
      <h3 class="story-detail-title">${esc(chapter.title)}</h3>
      <p class="story-detail-body">${chapter.unlocked ? esc(chapter.entry) : 'This page is still blank. Keep fishing, exploring and sailing — the ink will appear when the moment arrives.'}</p>
      <div class="story-progress-row">
        <span>${chapter.current} / ${chapter.target} ${esc(METRIC_LABELS[chapter.metric] || chapter.metric)}</span>
        <span>${chapter.percent}%</span>
      </div>
      <div class="story-progress-track"><div class="story-progress-fill" style="width:${chapter.percent}%"></div></div>
      <div class="story-rewards">
        <span class="label">Reward</span>
        <span>${chapter.unlocked ? (chapter.rewarded ? 'Collected' : rewardBits.join(' · ')) : rewardBits.join(' · ')}</span>
      </div>
      <div class="story-detail-actions">
        ${chapter.unlocked && !chapter.read
          ? `<button class="primary" data-action="mark-story-read" data-id="${chapter.id}">Mark as read</button>`
          : '<button disabled>' + (chapter.unlocked ? 'Chapter read' : 'Locked') + '</button>'}
      </div>
    `;
  }

  function render() {
    const summary = game.storyJournal.getSummary();
    if (progress) progress.textContent = `${summary.unlocked} / ${summary.total} chapters · ${summary.read} read`;
    const chapters = game.storyJournal.getChapters();
    const chapter = selectedChapter(chapters);
    list.innerHTML = chapters.map((entry) => chapterCard(entry)).join('');
    renderDetail(chapter);
  }

  list.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-chapter]');
    if (!btn) return;
    selectedId = btn.dataset.chapter;
    render();
  });

  detail.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-action="mark-story-read"]');
    if (!btn) return;
    const result = game.markStoryRead(btn.dataset.id);
    if (!result.success && typeof options.showToast === 'function') options.showToast(result.reason);
    render();
  });

  if (closeBtn) closeBtn.addEventListener('click', () => game.closeStoryJournal());

  game.onStoryToggle = (isOpen) => {
    modal.style.display = isOpen ? 'flex' : 'none';
    if (isOpen) {
      game.storyJournal.snapshot(game);
      render();
    }
  };

  const previousStoryUpdate = game.onStoryUpdate;
  game.onStoryUpdate = (summary) => {
    if (typeof previousStoryUpdate === 'function') previousStoryUpdate(summary);
    if (game.isStoryOpen) render();
  };

  return { render };
}

export default { initStoryJournalUI };
