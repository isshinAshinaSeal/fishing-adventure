// ObjectivesHUD: compact top-left objective card fed by StoryJournal.
//
// The card shows the next locked chapters as live progress bars plus story and
// gem counters. It is deliberately read-only — every action route stays in the
// journal modal so the HUD never steals a keypress from fishing.

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

const METRIC_LABELS = {
  catches: 'fish caught',
  species: 'species discovered',
  zones: 'zones charted',
  islands: 'frontier islands',
  boats: 'vessels owned',
  rods: 'rods owned',
  tools: 'tools owned',
  bosses: 'bosses defeated',
  quests: 'quests completed',
  furniture: 'furniture placed',
};

export function initObjectivesHUD(game, options = {}) {
  const host = document.getElementById(options.containerId || 'objectives-list');
  const storyBadge = document.getElementById('objectives-story-count');
  const gemBadge = document.getElementById('objectives-gem-count');
  const chapterBadge = document.getElementById('objectives-chapter');
  if (!host || !game || !game.storyJournal) return null;

  let lastSignature = '';

  function render() {
    const journal = game.storyJournal;
    const summary = journal.getSummary();
    const active = summary.active;
    const lines = journal.getObjectiveLines(2);

    if (storyBadge) storyBadge.textContent = `${summary.unlocked}/${summary.total}`;
    if (gemBadge) {
      const gems = game.player && game.player.economy ? game.player.economy.getGems() : 0;
      gemBadge.textContent = `💎 ${gems}`;
    }
    if (chapterBadge) {
      chapterBadge.textContent = active ? esc(active.title) : 'All chapters complete';
    }

    const rows = lines.length
      ? lines.map((line) => {
        const metric = METRIC_LABELS[line.metric] || line.metric;
        return `
          <div class="objective-row">
            <div class="objective-head">
              <span class="objective-title">${esc(line.title)}</span>
              <span class="objective-count">${line.current}/${line.target}</span>
            </div>
            <div class="objective-track"><div class="objective-fill" style="width:${line.percent}%"></div></div>
            <div class="objective-meta">${esc(metric)}</div>
          </div>
        `;
      }).join('')
      : '<div class="objective-meta">Every chapter of the story book is complete.</div>';

    const signature = JSON.stringify({ lines, unlocked: summary.unlocked, gems: game.player?.economy?.getGems?.() });
    if (signature === lastSignature) return;
    lastSignature = signature;
    host.innerHTML = rows;
  }

  const previousStoryUpdate = game.onStoryUpdate;
  game.onStoryUpdate = (summary) => {
    if (typeof previousStoryUpdate === 'function') previousStoryUpdate(summary);
    render();
    if (typeof options.onUpdate === 'function') options.onUpdate(summary);
  };

  const openBtn = document.getElementById('objectives-open-story');
  if (openBtn) {
    openBtn.addEventListener('click', () => game.toggleStoryJournal(true));
  }

  game.storyJournal.snapshot(game);
  render();
  // Story rewards can arrive between throttled manager ticks; refresh once a
  // second from the HUD so the card is live even before the first notification.
  const timer = setInterval(render, 1000);
  return {
    render,
    dispose() {
      clearInterval(timer);
      game.onStoryUpdate = null;
    },
  };
}

export default { initObjectivesHUD };
