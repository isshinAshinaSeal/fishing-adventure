// ExpansionUI: command-center interface for Expansion 2.0. It renders live
// manager state and routes every button through the gameplay managers.

import { getItemDefinition } from '../inventory/BackpackManager.js';
import { FrontierIslands } from '../world/frontierIslands.js';

const TABS = [
  { id: 'backpack', icon: '🎒', label: 'Backpack' },
  { id: 'rods', icon: '🎣', label: 'Rod Collection' },
  { id: 'tools', icon: '🧰', label: 'Fishing Tools' },
  { id: 'potions', icon: '🧴', label: 'Consumables' },
  { id: 'crafting', icon: '🧪', label: 'Crafting' },
  { id: 'farming', icon: '🌱', label: 'Farming' },
  { id: 'gathering', icon: '⛏️', label: 'Gathering' },
  { id: 'city_boats', icon: '🛥️', label: 'City Marina' },
  { id: 'expedition_boats', icon: '🚢', label: 'Expedition Fleet' },
  { id: 'gems', icon: '💎', label: 'Gem Exchange' },
  { id: 'frontier', icon: '🧭', label: 'Frontier' },
  { id: 'housing', icon: '🏠', label: 'Housing' },
  { id: 'guild', icon: '🎖️', label: 'Fishing Guild' },
  { id: 'auction', icon: '⚖️', label: 'Auction' },
  { id: 'aquarium', icon: '🐠', label: 'Aquarium' },
  { id: 'wardrobe', icon: '✨', label: 'Wardrobe' },
  { id: 'gacha', icon: '🎁', label: 'Gacha Pavilion' },
  { id: 'cannons', icon: '💣', label: 'Cannons' },
  { id: 'research', icon: '🔬', label: 'Research' },
  { id: 'radar', icon: '📡', label: 'Ocean Radar' },
  { id: 'crew', icon: '🧑‍✈️', label: 'Crew' },
];

const TITLES = {
  backpack: ['Backpack & Cargo', 'Slots, weight, supplies and transfers between bucket, hold and home.'],
  rods: ['Rod Collection', '76 rods with unique stats, levels and skill trees.'],
  tools: ['Fishing Tools', 'Nets, traps, sonar, spears and utility gear that change how you fish.'],
  potions: ['Consumable Pantry', 'Timed buffs, instant effects, cooldowns and quick-use supplies.'],
  crafting: ['Cooking & Crafting', 'Turn fish, produce and materials into food, repair kits, bait and ammunition.'],
  farming: ['Rooftop Farming', 'Plant seeds, water the beds, harvest produce and upgrade watering cans and hoes.'],
  gathering: ['Trees & Quarry', 'Chop trees and mine ore seams with axe and pickaxe tiers, then refine the haul.'],
  city_boats: ['Sky Marina', 'Aurelia Heights’ own ten-vessel fleet, delivered to the city waterfront.'],
  expedition_boats: ['Expedition Fleet', 'Eight frontier-grade hulls delivered to their home island moorings.'],
  gems: ['Gem Exchange', 'Spend hard-won gems on tools, rods and ships that coins cannot buy.'],
  frontier: ['Frontier Archipelago', 'Four remote islands, 24 exclusive fish and eight storm-, aurora-, glass- and reef-side fishing platforms.'],
  housing: ['Housing', 'Buy, enter, upgrade, furnish, store and display your catches.'],
  guild: ['Fishing Guild', 'Ranks, daily harbor requests and faction reputation.'],
  auction: ['Auction House', 'Sell eligible treasures and materials at a 35% premium.'],
  aquarium: ['Aquarium Center', 'Stock catches, decorate tanks and build a living collection.'],
  wardrobe: ['Cosmetic Wardrobe', 'Equip owned skins across rods, ships, mounts and outfits.'],
  gacha: ['Gacha Pavilion', 'Coins-only cosmetic draws with published odds, pity and duplicate tokens.'],
  cannons: ['Cannon Workshop', 'Cannon collection, five upgrade branches and seven ammunition types.'],
  research: ['Research Center', 'Study catches for samples and unlock research rewards.'],
  radar: ['Ocean Radar', 'Track giant roaming creatures and engage world bosses.'],
  crew: ['Ship Crew', 'Recruit specialists and assign real bonuses to your vessel.'],
};

const RARITY_COLORS = {
  Common: '#cbd5e1', Uncommon: '#4ade80', Rare: '#38bdf8', Epic: '#c084fc',
  Legendary: '#fbbf24', Mythical: '#22d3ee', Celestial: '#fef08a',
  Ancient: '#86efac', Abyssal: '#a78bfa', Secret: '#f472b6',
};

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function rarityTag(rarity) {
  return `<span class="rarity-tag" style="color:${RARITY_COLORS[rarity] || '#cbd5e1'}">${esc(rarity)}</span>`;
}

function money(value) {
  return `💰 ${Number(value || 0).toLocaleString()}`;
}

export function initExpansionUI(game, showToast) {
  const modal = document.getElementById('expansion-modal');
  const nav = document.getElementById('expansion-nav');
  const content = document.getElementById('expansion-content');
  const titleEl = document.getElementById('expansion-title');
  const subtitleEl = document.getElementById('expansion-subtitle');
  const kickerEl = document.getElementById('expansion-kicker');
  if (!modal || !nav || !content) return null;

  let activeTab = 'backpack';
  let activeNpcId = null;
  let selectedHouseId = null;
  let lastDrawResults = [];

  const notify = (message) => {
    if (typeof showToast === 'function') showToast(message);
  };

  // Build navigation once.
  nav.innerHTML = TABS.map((tab) =>
    `<button data-tab="${tab.id}"><span>${tab.icon}</span><span>${tab.label}</span></button>`
  ).join('');
  nav.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tab]');
    if (!button) return;
    activeTab = button.dataset.tab;
    render();
  });

  document.getElementById('btn-close-expansion').addEventListener('click', () => game.closeExpansion());

  // Quick bar shortcuts.
  const quick = {
    'quick-btn-backpack': 'backpack',
    'quick-btn-rods': 'rods',
    'quick-btn-tools': 'tools',
    'quick-btn-farming': 'farming',
    'quick-btn-gathering': 'gathering',
    'quick-btn-city-boats': 'city_boats',
    'quick-btn-frontier': 'frontier',
    'quick-btn-housing': 'housing',
    'quick-btn-wardrobe': 'wardrobe',
    'quick-btn-radar': 'radar',
    'quick-btn-crew': 'crew',
  };
  for (const [id, tab] of Object.entries(quick)) {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', () => game.openExpansion(tab));
  }

  game.onExpansionToggle = (isOpen, tab, npcId) => {
    if (!isOpen) {
      modal.style.display = 'none';
      return;
    }
    activeTab = tab || 'backpack';
    activeNpcId = npcId || null;
    modal.style.display = 'flex';
    render();
  };

  game.onCombatToggle = (isActive) => {
    updateBossHud();
    if (isActive) notify('Cannon stations ready. Space fires, X switches aim mode.');
  };

  function getSelectedHouse() {
    const houses = game.housingManager.getHouses();
    if (selectedHouseId) {
      const current = houses.find((h) => h.id === selectedHouseId);
      if (current) return current;
    }
    const owned = houses.find((h) => h.isOwned);
    selectedHouseId = owned ? owned.id : houses[0]?.id;
    return houses.find((h) => h.id === selectedHouseId) || null;
  }

  function greeting() {
    if (!activeNpcId) return '';
    const npc = game.expansionNpcManager.getNPC(activeNpcId);
    if (!npc) return '';
    const friendship = game.expansionNpcManager.getFriendship(activeNpcId);
    const quest = game.expansionNpcManager.getQuest(activeNpcId);
    const items = game.backpackManager.getItems();
    const giftOptions = items.length
      ? items.map((stack) => `<option value="${esc(stack.itemId)}">${esc(stack.def.icon)} ${esc(stack.def.name)} ×${stack.qty}</option>`).join('')
      : '<option value="">No gift items</option>';
    return `
      <div class="service-greeting">
        <div style="font-size:1.7rem">${npc.isPirate ? '🏴‍☠️' : '🧑‍🔧'}</div>
        <div style="flex:1">
          <strong>${esc(npc.name)}</strong> · ${esc(npc.title)} <span style="opacity:.7">(${esc(friendship?.level || 'Stranger')})</span><br>
          “${esc(game.expansionNpcManager.state[activeNpcId]?.lines?.[0] || 'How can I help?')}”
          <div class="expansion-actions">
            <select id="gift-select" class="pill-select" style="padding:4px 8px;font-size:.72rem">${giftOptions}</select>
            <button data-action="gift-npc">Give Gift</button>
          </div>
          ${quest ? `
            <div class="npc-quest">
              <div class="label">Personal request · ${esc(quest.name)}</div>
              <div class="muted">${esc(quest.description)} — ${quest.progress}/${quest.target}</div>
              <div class="load-track"><div class="load-fill" style="width:${quest.percent}%"></div></div>
              <div class="expansion-actions">
                <button class="gold" data-action="claim-npc-quest" ${quest.canClaim ? '' : 'disabled'}>${quest.claimed ? 'Request Completed' : quest.canClaim ? `Claim ${money(quest.reward)} + ${quest.xp} XP` : 'In Progress'}</button>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  function render() {
    const [title, subtitle] = TITLES[activeTab] || TITLES.backpack;
    titleEl.textContent = title;
    subtitleEl.textContent = subtitle;
    kickerEl.textContent = activeNpcId ? 'HARBOR SERVICE' : 'EXPANSION 2.0 COMMAND CENTER';
    for (const button of nav.querySelectorAll('[data-tab]')) {
      button.classList.toggle('active', button.dataset.tab === activeTab);
    }
    const renderers = {
      backpack: renderBackpack,
      rods: renderRods,
      tools: renderTools,
      potions: renderPotions,
      crafting: renderCrafting,
      farming: renderFarming,
      gathering: renderGathering,
      city_boats: renderCityBoats,
      expedition_boats: renderExpeditionBoats,
      gems: renderGemExchange,
      frontier: renderFrontier,
      housing: renderHousing,
      guild: renderGuild,
      auction: renderAuction,
      aquarium: renderAquarium,
      wardrobe: renderWardrobe,
      gacha: renderGacha,
      cannons: renderCannons,
      research: renderResearch,
      radar: renderRadar,
      crew: renderCrew,
    };
    const body = (renderers[activeTab] || renderBackpack)();
    content.innerHTML = greeting() + body;
  }

  function weightPanel() {
    const inv = game.player.inventory;
    const load = game.backpackManager.getLoad(inv);
    const cls = load.status === 'overweight' ? 'overweight' : load.status === 'heavy' ? 'heavy' : '';
    return `
      <div class="weight-panel">
        <div>
          <div class="label">Carrying weight</div>
          <div class="big">${load.weight.toFixed(1)} / ${load.capacityWeight} kg</div>
          <div class="load-track"><div class="load-fill ${cls}" style="width:${Math.min(100, load.weightPercent)}%"></div></div>
        </div>
        <div>
          <div class="label">Slots used</div>
          <div class="big">${load.slots} / ${load.capacitySlots}</div>
          <div class="load-track"><div class="load-fill ${cls}" style="width:${Math.min(100, load.slotPercent)}%"></div></div>
        </div>
        <div>
          <div class="label">Movement / status</div>
          <div class="big" style="color:${load.status === 'normal' ? '#4ade80' : load.status === 'light' ? '#fbbf24' : '#f87171'}">${esc(load.status)}</div>
          <div class="muted" style="font-size:.7rem;color:#94a3b8">${load.status === 'normal' ? 'No penalty' : load.status === 'overweight' ? 'Cannot collect items — store or release cargo' : 'Movement slowed by cargo'}</div>
        </div>
      </div>
    `;
  }

  function renderBackpack() {
    const inv = game.player.inventory;
    const bag = game.backpackManager;
    const boat = game.boatManager.getActiveBoat();
    const house = getSelectedHouse();
    const cargo = boat ? game.cargoManager.getState(boat) : null;
    const homeStorage = house && house.isOwned ? game.housingManager.getStorageState(house.id) : null;
    const items = bag.getItems();
    const catalog = bag.getCatalog();

    const itemRows = items.length ? items.map((stack) => `
      <div class="item-row">
        <span class="icon">${esc(stack.def.icon)}</span>
        <span class="item-name">${esc(stack.def.name)} <span class="item-meta">×${stack.qty} · ${stack.def.weight} kg</span></span>
        <span class="item-actions">
          ${stack.def.category === 'consumable' ? `<button class="mini-btn primary" data-action="use-item" data-id="${esc(stack.itemId)}">Use</button>` : ''}
          ${boat ? `<button class="mini-btn" data-action="item-to-cargo" data-id="${esc(stack.itemId)}">Ship</button>` : ''}
          ${house && house.isOwned ? `<button class="mini-btn" data-action="item-to-home" data-id="${esc(stack.itemId)}">Home</button>` : ''}
        </span>
      </div>
    `).join('') : '<div class="muted" style="padding:10px">No carried supplies. Buy potions or craft them at the Bait Laboratory.</div>';

    const bucketRows = inv.bucket.length ? inv.bucket.map((fish) => `
      <div class="item-row">
        <span class="icon">${esc(fish.icon)}</span>
        <span class="item-name">${esc(fish.name)} <span class="item-meta">${fish.weight} kg</span></span>
        <span class="item-actions">
          ${boat ? `<button class="mini-btn" data-action="fish-to-cargo" data-id="${esc(fish.instanceId)}">Ship</button>` : ''}
          ${house && house.isOwned ? `<button class="mini-btn" data-action="fish-to-home" data-id="${esc(fish.instanceId)}">Home</button>` : ''}
        </span>
      </div>
    `).join('') : '<div class="muted" style="padding:10px">Bucket empty.</div>';

    const cargoFishRows = cargo && cargo.fish.length ? cargo.fish.map((fish) => `
      <div class="item-row">
        <span class="icon">${esc(fish.icon)}</span>
        <span class="item-name">${esc(fish.name)} <span class="item-meta">${fish.weight} kg</span></span>
        <button class="mini-btn" data-action="fish-from-cargo" data-id="${esc(fish.instanceId)}">Take</button>
      </div>
    `).join('') : '<div class="muted" style="padding:10px">Cargo hold empty.</div>';

    const cargoItemRows = cargo && Object.keys(cargo.items).length ? Object.entries(cargo.items).map(([itemId, qty]) => {
      const def = bag.getItems().find((s) => s.itemId === itemId)?.def || { name: itemId, icon: '📦', weight: 0 };
      return `
        <div class="item-row">
          <span class="icon">${esc(def.icon)}</span>
          <span class="item-name">${esc(def.name)} <span class="item-meta">×${qty}</span></span>
          <button class="mini-btn" data-action="item-from-cargo" data-id="${esc(itemId)}">Take</button>
        </div>
      `;
    }).join('') : '<div class="muted" style="padding:10px">No supplies in the hold.</div>';

    const homeFishRows = homeStorage && homeStorage.fish.length ? homeStorage.fish.map((fish) => `
      <div class="item-row">
        <span class="icon">${esc(fish.icon)}</span>
        <span class="item-name">${esc(fish.name)} <span class="item-meta">${fish.weight} kg</span></span>
        <button class="mini-btn" data-action="fish-from-home" data-id="${esc(fish.instanceId)}">Take</button>
      </div>
    `).join('') : '<div class="muted" style="padding:10px">Home chest empty.</div>';

    return `
      ${weightPanel()}
      <div class="expansion-section"><h3>Carried Supplies</h3><div class="panel-box">${itemRows}</div></div>
      <div class="three-col">
        <div class="panel-box"><h4>🪣 Bucket · ${inv.getCount()} / ${inv.getCapacity()}</h4>${bucketRows}</div>
        <div class="panel-box"><h4>⛵ Ship Cargo ${cargo ? `· ${cargo.usedWeight.toFixed(1)} / ${cargo.capacity} kg` : ''}</h4>${cargo ? cargoFishRows + cargoItemRows : '<div class="muted" style="padding:10px">No active ship. Buy and launch a vessel at the Shipyard.</div>'}</div>
        <div class="panel-box"><h4>🏠 Home Chest ${homeStorage ? `· ${homeStorage.fish.length} fish` : ''}</h4>${homeStorage ? homeFishRows : '<div class="muted" style="padding:10px">Own a house to unlock home storage.</div>'}</div>
      </div>
      <div class="expansion-section" style="margin-top:18px"><h3>Backpack Upgrades</h3>
        <div class="expansion-grid">
          ${catalog.map((b) => `
            <div class="expansion-card ${b.isEquipped ? 'active' : b.isOwned ? 'owned' : ''}">
              <h4>${b.icon} ${esc(b.name)}</h4>
              <div class="muted">${b.slots} slots · ${b.weight} kg capacity</div>
              <div class="expansion-actions">
                ${b.isEquipped ? '<button disabled>Equipped</button>' :
                  b.isOwned ? `<button data-action="equip-backpack" data-id="${b.id}">Equip</button>` :
                  `<button class="gold" data-action="buy-backpack" data-id="${b.id}" ${game.player.economy.canAfford(b.cost) ? '' : 'disabled'}>Buy ${money(b.cost)}</button>`}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderRods() {
    const playerLevel = game.player.progression.getLevel();
    const catalog = game.rodManager.getCatalog(playerLevel);
    const equipped = game.rodManager.getEquippedRod();
    const stats = game.rodManager.getEffectiveStats();
    const progress = game.rodManager.getProgress(game.rodManager.equippedRodId);
    return `
      <div class="weight-panel" style="grid-template-columns:1.4fr 1fr 1fr">
        <div><div class="label">Equipped rod</div><div class="big">${esc(equipped?.name)}</div><div class="muted">${esc(stats?.ability)}</div></div>
        <div><div class="label">Rod level</div><div class="big">Lv ${progress.level} / 30</div><div class="load-track"><div class="load-fill" style="width:${Math.round((progress.xp / game.rodManager.getXpForNextLevel(progress.level)) * 100)}%"></div></div><div class="muted">${progress.xp} / ${game.rodManager.getXpForNextLevel(progress.level)} XP</div></div>
        <div><div class="label">Stats</div><div class="muted">Reel ${stats?.reelSpeed}× · Luck +${Math.round((stats?.luckBonus || 0) * 100)}%<br>Line ${stats?.lineStrength} · Control ${stats?.fishControl}</div></div>
      </div>
      <div class="expansion-section"><h3>Skill Tree — ${esc(equipped?.name)}</h3>
        <div class="expansion-grid">
          ${(equipped?.skills || []).map((skill) => {
            const rank = progress.skills?.[skill.id] || 0;
            const unlocked = progress.level >= skill.requiredLevel;
            return `<div class="expansion-card ${rank > 0 ? 'owned' : ''}">
              <h4>${esc(skill.name)} <span class="muted">Rank ${rank}/${skill.maxRank}</span></h4>
              <div class="muted">${esc(skill.description)}</div>
              <div class="expansion-actions">
                <button data-action="unlock-skill" data-id="${skill.id}" ${!unlocked || rank >= skill.maxRank ? 'disabled' : ''}>${unlocked ? (rank >= skill.maxRank ? 'Mastered' : 'Unlock') : `Requires Lv ${skill.requiredLevel}`}</button>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="expansion-section"><h3>Rod Collection · ${game.rodManager.ownedRodIds.size} / ${catalog.length}</h3>
        <div class="expansion-grid">
          ${catalog.map((rod) => `
            <div class="expansion-card ${rod.isEquipped ? 'active' : rod.isOwned ? 'owned' : ''}">
              <h4>${esc(rod.name)}</h4>
              ${rarityTag(rod.rarity)} <span class="muted">Lv ${rod.level} · requires angler Lv ${rod.levelRequirement}</span>
              <div class="stat-line"><span>Reel / Luck</span><span>${rod.stats.reelSpeed}× / +${Math.round(rod.stats.luckBonus * 100)}%</span></div>
              <div class="stat-line"><span>Line / Control</span><span>${rod.stats.lineStrength} / ${rod.stats.fishControl}</span></div>
              <div class="muted">${esc(rod.ability)}</div>
              <div class="expansion-actions">
                ${rod.isEquipped ? '<button disabled>Equipped</button>' :
                  rod.isOwned ? `<button data-action="equip-rod" data-id="${rod.id}">Equip</button>` :
                  `<button class="gold" data-action="buy-rod" data-id="${rod.id}" ${rod.meetsLevel && game.player.economy.canAfford(rod.price) ? '' : 'disabled'}>${rod.meetsLevel ? money(rod.price) : `Lv ${rod.levelRequirement}`}</button>`}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderTools() {
    const catalog = game.fishingToolManager.getCatalog();
    const equipped = game.fishingToolManager.getEquippedTool();
    const mods = game.fishingToolManager.getModifiers();
    const traps = game.fishingToolManager.getTraps();
    const ready = traps.filter((trap) => trap.ready).length;
    return `
      <div class="weight-panel" style="grid-template-columns:1.4fr 1fr 1fr">
        <div><div class="label">Equipped tool</div><div class="big">${equipped ? `${esc(equipped.icon)} ${esc(equipped.name)}` : 'None'}</div><div class="muted">${esc(equipped?.description || 'Buy and equip a fishing tool.')}</div></div>
        <div><div class="label">Tool modifiers</div><div class="muted">Luck +${Math.round((mods.luck || 0) * 100)}% · Line +${mods.lineStrength || 0}<br>Quality +${Math.round((mods.quality || 0) * 100)}% · Multi-catch ${Math.round((mods.multiCatch || 0) * 100)}%<br>Wait −${Math.round((mods.waitReduction || 0) * 100)}% · Bait +${Math.round((mods.baitBonus || 0) * 100)}%<br>Finder +${Math.round((mods.finder || 0) * 100)}%</div></div>
        <div><div class="label">Deployed traps</div><div class="big">${traps.length} / ${game.fishingToolManager.getTrapCapacity()}</div><div class="muted">${ready} ready to collect</div>
          <div class="expansion-actions"><button data-action="collect-traps" ${ready ? '' : 'disabled'}>Collect Ready (${ready})</button></div></div>
      </div>
      <div class="expansion-section" style="margin-top:16px"><h3>Deployed Traps</h3>
        ${traps.length ? `<div class="expansion-grid">${traps.map((trap) => `
          <div class="expansion-card ${trap.ready ? 'active' : ''}">
            <h4>${esc(trap.name)}</h4>
            <div class="muted">Habitat: ${esc(trap.habitat)}</div>
            <div class="stat-line"><span>Status</span><span>${trap.ready ? 'Ready to collect' : `${trap.remaining}s remaining`}</span></div>
          </div>
        `).join('')}</div>` : '<div class="muted" style="padding:8px">No traps deployed. Equip a trap and deploy it from this tab.</div>'}
      </div>
      <div class="expansion-section"><h3>Tool Collection · ${game.fishingToolManager.ownedToolIds.size} / ${catalog.length}</h3>
        <div class="expansion-grid">
          ${catalog.map((tool) => `
            <div class="expansion-card ${tool.isEquipped ? 'active' : tool.isOwned ? 'owned' : ''}">
              <h4>${tool.icon} ${esc(tool.name)}</h4>
              ${rarityTag(tool.rarity)} ${tool.trap ? `<span class="muted">${tool.trap.duration}s trap · ${tool.trap.yield} fish</span>` : ''}
              <div class="muted">${esc(tool.description)}</div>
              <div class="expansion-actions">
                ${tool.isEquipped ? '<button disabled>Equipped</button>' : tool.isOwned ? `<button data-action="equip-tool" data-id="${tool.id}">Equip</button>` : `<button class="gold" data-action="buy-tool" data-id="${tool.id}" ${game.player.economy.canAfford(tool.cost) ? '' : 'disabled'}>Buy ${money(tool.cost)}</button>`}
                ${tool.deployable && tool.isOwned ? `<button data-action="deploy-trap" data-id="${tool.id}">Deploy Trap</button>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderPotions() {
    const buffs = game.consumableManager.getActiveBuffs();
    const catalog = game.consumableManager.getCatalog('consumable');
    const items = game.backpackManager.getItems('consumable');
    return `
      <div class="two-col">
        <div class="panel-box">
          <h4>Active Buffs (${buffs.length}/4)</h4>
          <div class="buff-list">${buffs.length ? buffs.map((b) => `<span class="buff-pill">${b.icon} ${esc(b.name)} · ${b.remaining.toFixed(0)}s</span>`).join('') : '<span class="muted">No active buffs.</span>'}</div>
          <div class="muted">Buffs are capped at four. Consumable effects are validated through the manager and persisted in saves.</div>
        </div>
        <div class="panel-box">
          <h4>Quick-Use Supplies</h4>
          ${items.length ? items.map((stack) => `<div class="item-row"><span class="icon">${stack.def.icon}</span><span class="item-name">${esc(stack.def.name)} ×${stack.qty}</span><span class="item-meta">${game.consumableManager.getCooldown(stack.itemId) > 0 ? `${game.consumableManager.getCooldown(stack.itemId)}s CD` : 'Ready'}</span><button class="mini-btn primary" data-action="use-item" data-id="${stack.itemId}">Use</button></div>`).join('') : '<div class="muted" style="padding:8px">Nothing to use. Visit the Potion Shop.</div>'}
        </div>
      </div>
      <div class="expansion-section" style="margin-top:16px"><h3>Potion Shop</h3>
        <div class="expansion-grid">
          ${catalog.map((item) => `
            <div class="expansion-card">
              <h4>${item.icon} ${esc(item.name)}</h4>
              <div class="muted">${esc(item.description)}</div>
              <div class="stat-line"><span>Weight / cooldown</span><span>${item.weight} kg / ${item.cooldown}s</span></div>
              <div class="expansion-actions">
                <button class="gold" data-action="buy-consumable" data-id="${item.id}" ${game.player.economy.canAfford(item.price) ? '' : 'disabled'}>Buy ${money(item.price)}</button>
                <button data-action="use-item" data-id="${item.id}" ${game.backpackManager.getCount(item.id) > 0 ? '' : 'disabled'}>Use (${game.backpackManager.getCount(item.id)})</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderCrafting() {
    const recipes = game.consumableManager.getRecipes();
    return `
      <div class="muted" style="margin-bottom:14px">Rare fish require explicit confirmation before they are consumed. Collection records stay in the Fish Index even when a physical catch is used.</div>
      <div class="expansion-grid">
        ${recipes.map((recipe) => {
          let requirementText;
          if (recipe.materials && Object.keys(recipe.materials).length) {
            requirementText = Object.entries(recipe.materials).map(([itemId, qty]) => {
              const def = getItemDefinition(itemId);
              return `${game.backpackManager.getCount(itemId)}/${qty} × ${esc(def?.name || itemId)}`;
            }).join(' · ');
          } else if (recipe.fish) {
            requirementText = recipe.fish.join(' / ');
          } else {
            requirementText = `${esc(recipe.material)} ×${recipe.materialQty}`;
          }
          const outputDef = getItemDefinition(recipe.output);
          return `
            <div class="expansion-card">
              <h4>${recipe.icon} ${esc(recipe.name)}</h4>
              <div class="muted">${esc(recipe.description)}</div>
              <div class="stat-line"><span>Requires</span><span>${requirementText}</span></div>
              <div class="stat-line"><span>Output</span><span>${recipe.outputQty}× ${esc(outputDef?.name || recipe.output)}</span></div>
              <div class="expansion-actions"><button class="gold" data-action="craft" data-id="${recipe.id}">Craft · ${money(recipe.coins)}</button></div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderFarming() {
    const manager = game.farmingManager;
    const summary = manager.getSummary();
    const economy = game.player.economy;
    const crops = manager.getCropCatalog();
    const tools = manager.getToolCatalog();
    const plots = manager.getPlots();
    const selected = crops.find((crop) => crop.isSelected) || crops[0];

    return `
      <div class="weight-panel" style="grid-template-columns:1.2fr 1fr 1fr">
        <div><div class="label">Selected seed</div><div class="big">${selected.icon} ${esc(selected.name)}</div><div class="muted">${esc(selected.description)}</div></div>
        <div><div class="label">Farm beds</div><div class="big">${summary.ready} ready · ${summary.growing} growing</div><div class="muted">${summary.empty} empty · ${summary.watered} watered · ${summary.totalPlots} total</div></div>
        <div><div class="label">Harvest bonuses</div><div class="big">+${Math.round(summary.growthBonus * 100)}% growth</div><div class="muted">+${summary.yieldBonus} yield · ${summary.ownedTools} tools owned<br>${esc(summary.equippedCan)} · ${esc(summary.equippedHoe)}</div></div>
      </div>
      <div class="expansion-section"><h3>Choose a Seed</h3>
        <div class="expansion-grid">
          ${crops.map((crop) => `
            <div class="expansion-card ${crop.isSelected ? 'active' : ''}">
              <h4>${crop.icon} ${esc(crop.name)}</h4>
              ${rarityTag(crop.rarity)}
              <div class="muted">${esc(crop.description)}</div>
              <div class="stat-line"><span>Seed / grow time</span><span>${money(crop.cost)} / ${crop.growTime}s</span></div>
              <div class="stat-line"><span>Harvest</span><span>${crop.yieldMin}-${crop.yieldMax} produce · +${crop.xp} XP · +${crop.coinReward} coins</span></div>
              <div class="expansion-actions">
                <button data-action="select-crop" data-id="${crop.id}" ${crop.isSelected ? 'disabled' : ''}>${crop.isSelected ? 'Selected' : 'Select Seed'}</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="expansion-section"><h3>Farm Beds · ${summary.totalPlots}</h3>
        <div class="expansion-grid">
          ${plots.map((plot) => {
            const crop = plot.crop;
            let action;
            if (!crop) {
              action = `<button class="gold" data-action="farm-plant" data-id="${plot.id}" ${economy.canAfford(selected.cost) ? '' : 'disabled'}>Plant ${esc(selected.name)} · ${money(selected.cost)}</button>`;
            } else if (plot.ready) {
              action = `<button class="gold" data-action="farm-harvest" data-id="${plot.id}">Harvest ${esc(crop.name)}</button>`;
            } else if (!plot.watered) {
              action = `<button data-action="farm-water" data-id="${plot.id}">Water Crop</button>`;
            } else {
              action = `<button disabled>Growing · ${plot.progress}%</button>`;
            }
            return `
              <div class="expansion-card ${plot.ready ? 'active' : crop ? 'owned' : ''}" style="border-color:${plot.ready ? '#fbbf24' : 'rgba(148,163,184,.2)'}">
                <h4>${crop ? crop.icon : '🟫'} ${esc(plot.name)}</h4>
                <div class="muted">${esc(plot.zoneLabel)} · ${esc(plot.stageLabel)}</div>
                ${crop ? `<div class="stat-line"><span>${esc(crop.name)}</span><span>${plot.progress}% · ${plot.remaining}s</span></div>
                <div class="load-track"><div class="load-fill" style="width:${plot.progress}%"></div></div>` : '<div class="stat-line"><span>Soil</span><span>Ready to plant</span></div>'}
                <div class="expansion-actions">${action}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      <div class="expansion-section"><h3>Farm Tools</h3>
        <div class="expansion-grid">
          ${tools.map((tool) => `
            <div class="expansion-card ${tool.isEquipped ? 'active' : tool.isOwned ? 'owned' : ''}">
              <h4>${tool.icon} ${esc(tool.name)}</h4>
              <div class="muted">${tool.type === 'watering_can' ? 'Watering can' : 'Hoe'} · ${esc(tool.description)}</div>
              <div class="stat-line"><span>Growth / yield</span><span>+${Math.round((tool.growthBonus || 0) * 100)}% / +${tool.yieldBonus || 0}</span></div>
              <div class="expansion-actions">
                ${tool.isEquipped ? '<button disabled>Equipped</button>' : tool.isOwned ? `<button data-action="equip-farm-tool" data-id="${tool.id}">Equip</button>` : `<button class="gold" data-action="buy-farm-tool" data-id="${tool.id}" ${economy.canAfford(tool.cost) ? '' : 'disabled'}>Buy ${money(tool.cost)}</button>`}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderGathering() {
    const manager = game.gatheringManager;
    const summary = manager.getSummary();
    const economy = game.player.economy;
    const tools = manager.getToolCatalog();
    const nodes = manager.getNodes().slice().sort((a, b) => a.zone.localeCompare(b.zone) || a.name.localeCompare(b.name));

    return `
      <div class="weight-panel" style="grid-template-columns:1.2fr 1fr 1fr">
        <div><div class="label">Equipped tools</div><div class="big">${esc(summary.equippedAxe)}</div><div class="muted">${esc(summary.equippedPickaxe)}</div></div>
        <div><div class="label">Nodes ready</div><div class="big">${summary.ready} / ${summary.totalNodes}</div><div class="muted">${summary.trees} trees · ${summary.rocks} ore seams · ${summary.depleted} respawning</div></div>
        <div><div class="label">Lifetime gathering</div><div class="big">${summary.nodesFelled} felled</div><div class="muted">${summary.itemsGathered} items · ${summary.xpEarned} XP · ${summary.strikes} swings</div></div>
      </div>
      <div class="expansion-section"><h3>Resource Nodes</h3>
        <div class="expansion-grid">
          ${nodes.map((node) => `
            <div class="expansion-card ${node.depleted ? '' : node.canHarvest ? 'owned' : ''}">
              <h4>${node.icon} ${esc(node.name)}</h4>
              <div class="muted">${esc(node.zoneLabel)} · ${node.kind === 'tree' ? 'Timber' : 'Ore'} · requires tier ${node.requiredTier}</div>
              <div class="stat-line"><span>Node HP</span><span>${node.hp} / ${node.maxHp}</span></div>
              <div class="load-track"><div class="load-fill" style="width:${Math.round((node.hp / Math.max(1, node.maxHp)) * 100)}%"></div></div>
              <div class="expansion-actions">
                ${node.depleted
                  ? `<button disabled>Respawns in ${node.respawnRemaining}s</button>`
                  : `<button class="${node.canHarvest ? 'gold' : ''}" data-action="gather-strike" data-id="${node.id}" ${node.canHarvest ? '' : 'disabled'}>${node.kind === 'tree' ? 'Chop' : 'Mine'} · ${node.hp} HP</button>`}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="expansion-section"><h3>Axe & Pickaxe Tiers</h3>
        <div class="expansion-grid">
          ${tools.map((tool) => `
            <div class="expansion-card ${tool.isEquipped ? 'active' : tool.isOwned ? 'owned' : ''}">
              <h4>${tool.icon} ${esc(tool.name)}</h4>
              <div class="muted">${tool.type === 'axe' ? 'Axe' : 'Pickaxe'} · tier ${tool.tier} · power ${tool.power}</div>
              <div class="muted">${esc(tool.description)}</div>
              <div class="expansion-actions">
                ${tool.isEquipped ? '<button disabled>Equipped</button>' : tool.isOwned ? `<button data-action="equip-gather-tool" data-id="${tool.id}">Equip</button>` : `<button class="gold" data-action="buy-gather-tool" data-id="${tool.id}" ${economy.canAfford(tool.cost) ? '' : 'disabled'}>Buy ${money(tool.cost)}</button>`}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderCityBoats() {
    const catalog = game.boatManager.getCityCatalog();
    const economy = game.player.economy;
    const active = game.boatManager.getActiveBoat();
    const owned = catalog.filter((boat) => boat.isOwned).length;
    return `
      <div class="weight-panel" style="grid-template-columns:1.2fr 1fr 1fr">
        <div><div class="label">Sky Marina fleet</div><div class="big">${owned} / ${catalog.length} owned</div><div class="muted">Purchased city hulls launch at the Aurelia waterfront pier.</div></div>
        <div><div class="label">Active vessel</div><div class="big">${active ? esc(active.name) : 'None at sea'}</div><div class="muted">${active ? `${active.maxSpeed} m/s · ${active.capacity} berths` : 'Buy a vessel to launch it.'}</div></div>
        <div><div class="label">Fleet features</div><div class="muted">Fishing decks · radar · sonar · light broadsides<br>City boats are separate from the 30 harbor and pirate hulls.</div></div>
      </div>
      <div class="expansion-section"><h3>Aurelia Heights Fleet</h3>
        <div class="expansion-grid">
          ${catalog.map((boat) => `
            <div class="expansion-card ${boat.isOwned ? 'owned' : ''}">
              <h4>🛥️ ${esc(boat.name)}</h4>
              <div class="muted">Tier ${boat.tier} · ${boat.capacity} berths · ${esc(boat.description)}</div>
              <div class="stat-line"><span>Speed / turn</span><span>${boat.maxSpeed} m/s / ${boat.turnRate}</span></div>
              <div class="stat-line"><span>Features</span><span>${[boat.hasFishingDeck ? 'Deck' : '', boat.hasSonar ? 'Sonar' : '', boat.hasRadar ? 'Radar' : '', boat.hasCannons ? 'Cannons' : ''].filter(Boolean).join(' · ') || 'Coastal'}</span></div>
              <div class="expansion-actions">
                ${boat.isOwned
                  ? `<button disabled>${active && active.id === boat.id ? 'Active Vessel' : 'In Your Fleet'}</button>`
                  : `<button class="gold" data-action="buy-city-boat" data-id="${boat.id}" ${economy.canAfford(boat.cost) ? '' : 'disabled'}>Buy ${money(boat.cost)}</button>`}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderExpeditionBoats() {
    const catalog = game.boatManager.getExpeditionCatalog();
    const economy = game.player.economy;
    const active = game.boatManager.getActiveBoat();
    const owned = catalog.filter((boat) => boat.isOwned).length;
    return `
      <div class="weight-panel" style="grid-template-columns:1.2fr 1fr 1fr">
        <div><div class="label">Expedition fleet</div><div class="big">${owned} / ${catalog.length} owned</div><div class="muted">Every hull is delivered to its home-island mooring in the frontier.</div></div>
        <div><div class="label">Active vessel</div><div class="big">${active ? esc(active.name) : 'None at sea'}</div><div class="muted">${active ? `${active.maxSpeed} m/s · ${active.capacity} berths` : 'Buy a vessel to launch it.'}</div></div>
        <div><div class="label">Hard-water fleet</div><div class="muted">Storm cutters, aurora flagships, glasswake explorers and the Leviathan Hunter.<br>Two hulls can also be bought with gems.</div></div>
      </div>
      <div class="expansion-section"><h3>Frontier-Grade Hulls</h3>
        <div class="expansion-grid">
          ${catalog.map((boat) => `
            <div class="expansion-card ${boat.isOwned ? 'owned' : ''}">
              <h4>🚢 ${esc(boat.name)}</h4>
              <div class="muted">Tier ${boat.tier} · ${boat.capacity} berths · ${esc(boat.description)}</div>
              <div class="stat-line"><span>Speed / turn</span><span>${boat.maxSpeed} m/s / ${boat.turnRate}</span></div>
              <div class="stat-line"><span>Home mooring</span><span>${esc(boat.homeIslandName || boat.homeIsland)}</span></div>
              <div class="stat-line"><span>Features</span><span>${[boat.hasFishingDeck ? 'Deck' : '', boat.hasSonar ? 'Sonar' : '', boat.hasRadar ? 'Radar' : '', boat.hasCannons ? 'Cannons' : ''].filter(Boolean).join(' · ') || 'Coastal'}</span></div>
              <div class="expansion-actions">
                ${boat.isOwned
                  ? `<button disabled>${active && active.id === boat.id ? 'Active Vessel' : 'In Your Fleet'}</button>`
                  : `<button class="gold" data-action="buy-expedition-boat" data-id="${boat.id}" ${economy.canAfford(boat.cost) ? '' : 'disabled'}>Buy ${money(boat.cost)}</button>`}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderGemExchange() {
    const offers = game.getGemCatalog();
    const economy = game.player.economy;
    const story = game.storyJournal ? game.storyJournal.getSummary() : null;
    return `
      <div class="weight-panel" style="grid-template-columns:1.2fr 1fr 1fr">
        <div><div class="label">Your gems</div><div class="big">💎 ${economy.getGems()}</div><div class="muted">Gems drop from story chapters, world bosses and rare caches — never from ordinary fish.</div></div>
        <div><div class="label">Story progress</div><div class="big">${story ? `${story.unlocked} / ${story.total} chapters` : '—'}</div><div class="muted">Open the story book with <kbd class="kbd">L</kbd> to read chapters and collect rewards.</div></div>
        <div><div class="label">Hard currency</div><div class="muted">Gem-locked tools cannot be bought with coins at any price. Coins and XP exchanges are one-way.</div></div>
      </div>
      <div class="expansion-section"><h3>Gem Exchange</h3>
        <div class="expansion-grid">
          ${offers.map((offer) => `
            <div class="expansion-card ${offer.isOwned ? 'owned' : ''}">
              <h4>${offer.icon} ${esc(offer.name)}</h4>
              <div class="muted">${esc(offer.description)}</div>
              <div class="stat-line"><span>Price</span><span style="color:#a78bfa">💎 ${offer.gems}</span></div>
              <div class="expansion-actions">
                ${offer.isOwned
                  ? '<button disabled>Owned</button>'
                  : `<button class="gold" data-action="buy-gem-offer" data-id="${offer.id}" ${offer.canAfford ? '' : 'disabled'}>Exchange 💎 ${offer.gems}</button>`}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderFrontier() {
    const visited = game.visitedFrontierIslands || new Set();
    const spots = game.frontierFishingSpots || [];
    const catches = game.frontierCatches || 0;

    return `
      <div class="weight-panel" style="grid-template-columns:1.2fr 1fr 1fr">
        <div><div class="label">Frontier archipelago</div><div class="big">${visited.size} / ${FrontierIslands.length} islands visited</div><div class="muted">Storm, aurora, glass and reef outposts beyond the shipping lanes.</div></div>
        <div><div class="label">Frontier catches</div><div class="big">${catches}</div><div class="muted">24 exclusive species · ${spots.length} fishing platforms · 4 service outposts</div></div>
        <div><div class="label">Expedition note</div><div class="muted">Sail from the harbor ferry or the button below. Fish from each island’s glowing platforms to roll the frontier catalog.</div></div>
      </div>
      <div class="expansion-section"><h3>Frontier Islands</h3>
        <div class="expansion-grid">
          ${FrontierIslands.map((island) => {
            const islandSpots = spots.filter((spot) => spot.islandId === island.id);
            const habitatSpecies = game.fishIndex
              ? game.fishIndex.getEntries({ habitat: island.habitat }).length
              : 0;
            const isVisited = visited.has(island.id);
            return `
              <div class="expansion-card ${isVisited ? 'owned' : ''}">
                <h4>${island.biome === 'storm' ? '⚡' : island.biome === 'aurora' ? '🌌' : island.biome === 'glass' ? '💎' : '🐍'} ${esc(island.name)}</h4>
                <span class="rarity-tag" style="color:${isVisited ? '#4ade80' : '#94a3b8'}">${isVisited ? 'Charted' : 'Uncharted'}</span>
                <div class="muted">${esc(island.description)}</div>
                <div class="stat-line"><span>Habitat / species</span><span>${esc(island.habitat)} · ${habitatSpecies} fish</span></div>
                <div class="stat-line"><span>Fishing platforms</span><span>${islandSpots.map((spot) => esc(spot.name)).join(' · ') || 'None'}</span></div>
                <div class="expansion-actions">
                  <button class="gold" data-action="travel-frontier" data-id="${island.id}">Sail to ${esc(island.name)}</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderHousing() {
    const houses = game.housingManager.getHouses();
    const selected = getSelectedHouse();
    const economy = game.player.economy;
    const furniture = game.housingManager.getFurnitureCatalog();
    const state = selected ? game.housingManager.getHouseState(selected.id) : null;
    const storage = selected && selected.isOwned ? game.housingManager.getStorageState(selected.id) : null;
    const requirements = selected ? game.housingManager.getUpgradeRequirements(selected.id) : null;
    const inv = game.player.inventory;

    return `
      <div class="expansion-grid">
        ${houses.map((house) => `
          <div class="expansion-card ${house.isOwned ? 'owned' : ''} ${house.id === selected?.id ? 'active' : ''}">
            <h4>${esc(house.name)}</h4>
            <span class="rarity-tag" style="color:#fbbf24">${esc(house.type)}</span> <span class="muted">Lv ${house.level}/${house.maxLevel}</span>
            <div class="muted">${esc(house.description)}</div>
            <div class="stat-line"><span>Furniture / aquarium</span><span>${house.furnitureCount} / ${house.aquariumCount}</span></div>
            <div class="expansion-actions">
              ${!house.isOwned ? `<button class="gold" data-action="buy-house" data-id="${house.id}" ${economy.canAfford(house.plotCost) ? '' : 'disabled'}>Buy ${money(house.plotCost)}</button>` : `
                <button data-action="enter-house" data-id="${house.id}">${house.isInside ? 'Exit' : 'Enter'}</button>
                <button data-action="select-house" data-id="${house.id}">Manage</button>
                <button data-action="set-home" data-id="${house.id}" ${house.homeSet ? 'disabled' : ''}>${house.homeSet ? 'Home Set' : 'Set Home'}</button>
              `}
            </div>
          </div>
        `).join('')}
      </div>
      ${selected && selected.isOwned ? `
        <div class="housing-hero" style="margin-top:16px">
          <div><strong>${esc(selected.name)}</strong><div class="muted">Level ${selected.level}/5 · ${selected.homeSet ? 'Personal teleport point active' : 'No home teleport point set'} · ${selected.dockUnlocked ? 'Private dock unlocked' : 'Dock unlocks at level 5'}</div></div>
          <div class="expansion-actions">
            <button class="gold" data-action="upgrade-house" data-id="${selected.id}" ${selected.level >= 5 ? 'disabled' : ''}>${selected.level >= 5 ? 'Max Level' : `Upgrade · ${money(requirements?.coins)}`}</button>
            <button data-action="teleport-home" ${selected.homeSet ? '' : 'disabled'}>Teleport Home</button>
          </div>
        </div>
        <div class="muted" style="margin-bottom:10px">Next level requires ${requirements?.furniture || 0} placed furniture items. Current: ${selected.furnitureCount}.</div>
        <div class="expansion-section"><h3>Furniture Collection</h3>
          <div class="expansion-grid">
            ${furniture.map((item) => {
              const placed = state?.furniture.includes(item.id);
              return `<div class="expansion-card ${placed ? 'owned' : ''}">
                <h4>${item.icon} ${esc(item.name)}</h4>
                <div class="muted">${esc(item.room)} · ${item.weight} kg</div>
                <div class="expansion-actions">
                  <button data-action="place-furniture" data-id="${item.id}" ${placed ? 'disabled' : ''}>${placed ? 'Placed' : `Place · ${money(item.cost)}`}</button>
                  ${placed ? `<button data-action="remove-furniture" data-id="${item.id}">Remove</button>` : ''}
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
        <div class="two-col" style="margin-top:16px">
          <div class="panel-box"><h4>🏠 Home Chest · ${storage?.fish.length || 0} fish</h4>
            ${storage?.fish.length ? storage.fish.map((fish) => `<div class="item-row"><span class="icon">${fish.icon}</span><span class="item-name">${esc(fish.name)} <span class="item-meta">${fish.weight} kg</span></span><button class="mini-btn" data-action="fish-from-home" data-id="${fish.instanceId}">Take</button></div>`).join('') : '<div class="muted" style="padding:8px">Empty.</div>'}
            <h4 style="margin-top:10px">Store bucket fish</h4>
            ${inv.bucket.slice(0, 10).map((fish) => `<div class="item-row"><span class="icon">${fish.icon}</span><span class="item-name">${esc(fish.name)}</span><button class="mini-btn" data-action="fish-to-home" data-id="${fish.instanceId}">Store</button></div>`).join('') || '<div class="muted">Bucket empty.</div>'}
          </div>
          <div class="panel-box"><h4>🐠 Aquarium · ${state?.aquarium.length || 0}/12</h4>
            ${selected.level >= 4 ? `
              ${state.aquarium.map((fish) => `<div class="item-row"><span class="icon">${fish.icon}</span><span class="item-name">${esc(fish.name)}</span><span class="item-meta">${fish.weight} kg</span></div>`).join('') || '<div class="muted">No fish on display.</div>'}
              <h4 style="margin-top:10px">Stock from bucket</h4>
              ${inv.bucket.slice(0, 8).map((fish) => `<div class="item-row"><span class="icon">${fish.icon}</span><span class="item-name">${esc(fish.name)}</span><button class="mini-btn" data-action="stock-aquarium" data-id="${fish.instanceId}">Display</button></div>`).join('') || '<div class="muted">Bucket empty.</div>'}
            ` : '<div class="muted">Upgrade this house to level 4 to unlock the aquarium room.</div>'}
          </div>
        </div>
      ` : '<div class="muted" style="margin-top:16px;padding:14px;border:1px dashed rgba(148,163,184,.3);border-radius:10px">Purchase a house to unlock furniture, storage, aquarium displays, trophies, private dock and a personal teleport point.</div>'}
    `;
  }

  function renderGuild() {
    const guild = game.serviceManager.getGuildState(game.player.inventory);
    const daily = game.serviceManager.getDailyState();
    return `
      <div class="two-col">
        <div class="panel-box"><h4>Guild Rank · ${esc(guild.rank.name)}</h4>
          <div class="muted">${guild.totalCatches} lifetime catches · ${guild.next ? `${guild.next.minCatches - guild.totalCatches} to ${guild.next.name}` : 'Maximum rank'}</div>
          <div class="load-track"><div class="load-fill" style="width:${guild.progress}%"></div></div>
          <div class="expansion-actions"><button class="gold" data-action="claim-guild" ${guild.canClaim ? '' : 'disabled'}>${guild.canClaim ? `Claim ${money(guild.reward)}` : 'No rank reward available'}</button></div>
        </div>
        <div class="panel-box"><h4>Daily Harbor Request</h4>
          <div class="muted">Catch 3 fish today. Progress: ${daily.catches}/3.</div>
          <div class="load-track"><div class="load-fill" style="width:${Math.min(100, (daily.catches / 3) * 100)}%"></div></div>
          <div class="expansion-actions"><button class="gold" data-action="claim-daily" ${daily.canClaim ? '' : 'disabled'}>${daily.claimed ? 'Claimed Today' : `Claim ${money(daily.reward)}`}</button></div>
        </div>
      </div>
      <div class="expansion-section" style="margin-top:16px"><h3>Faction Reputation</h3>
        <div class="expansion-grid">
          ${game.serviceManager.getReputations().map((rep) => `<div class="expansion-card">
            <h4>${esc(rep.label)} <span class="muted">Lv ${rep.level} · ${esc(rep.name)}</span></h4>
            <div class="load-track"><div class="load-fill" style="width:${rep.progress}%"></div></div>
            <div class="muted">${rep.points} points${rep.next ? ` / ${rep.next} to next level` : ' · maximum'}</div>
          </div>`).join('')}
        </div>
      </div>
    `;
  }

  function renderAuction() {
    const items = game.serviceManager.getAuctionItems(game.backpackManager);
    return `
      <div class="muted" style="margin-bottom:12px">Auction House pays 135% of base value for eligible treasures, materials and miscellaneous goods.</div>
      ${items.length ? `<div class="expansion-grid">${items.map((stack) => `<div class="expansion-card">
        <h4>${stack.def.icon} ${esc(stack.def.name)} ×${stack.qty}</h4>
        <div class="muted">${esc(stack.def.category)} · base ${money(stack.def.price)}</div>
        <div class="stat-line"><span>Auction price</span><span>${money(Math.round(stack.def.price * 1.35))}</span></div>
        <div class="expansion-actions"><button class="gold" data-action="auction-sell" data-id="${stack.itemId}">Sell One</button></div>
      </div>`).join('')}</div>` : '<div class="panel-box muted">No eligible items. Fish are sold at the Fish Market; treasures and materials appear here.</div>'}
    `;
  }

  function renderAquarium() {
    const houses = game.housingManager.getHouses().filter((h) => h.isOwned);
    const selected = getSelectedHouse();
    const state = selected && selected.isOwned ? game.housingManager.getHouseState(selected.id) : null;
    const inv = game.player.inventory;
    const decorations = game.cosmeticManager.getCollection().ownedItems.filter((c) => c.slot === 'aquarium');
    return `
      ${houses.length ? `
        <div class="expansion-actions" style="margin-bottom:12px">
          ${houses.map((h) => `<button data-action="select-house" data-id="${h.id}" class="${h.id === selected?.id ? 'primary' : ''}">${esc(h.name)} · Lv${h.level}</button>`).join('')}
        </div>
        ${selected.level >= 4 ? `
          <div class="two-col">
            <div class="panel-box"><h4>Display Tank · ${state.aquarium.length}/12</h4>
              ${state.aquarium.map((fish) => `<div class="item-row"><span class="icon">${fish.icon}</span><span class="item-name">${esc(fish.name)}</span><span class="item-meta">${fish.rarity} · ${fish.weight} kg</span></div>`).join('') || '<div class="muted">No fish yet.</div>'}
            </div>
            <div class="panel-box"><h4>Stock from Bucket</h4>
              ${inv.bucket.map((fish) => `<div class="item-row"><span class="icon">${fish.icon}</span><span class="item-name">${esc(fish.name)}</span><button class="mini-btn" data-action="stock-aquarium" data-id="${fish.instanceId}">Display</button></div>`).join('') || '<div class="muted">Catch something first.</div>'}
            </div>
          </div>
          <div class="expansion-section" style="margin-top:16px"><h3>Aquarium Decorations</h3>
            <div class="muted">Equip aquarium cosmetics from the Gacha Pavilion to decorate this tank.</div>
            <div class="buff-list">${decorations.length ? decorations.map((c) => `<span class="buff-pill">${c.name}${c.isEquipped ? ' ✓' : ''}</span>`).join('') : '<span class="muted">No aquarium cosmetics owned.</span>'}</div>
          </div>
        ` : '<div class="panel-box muted">This house needs level 4 to unlock an aquarium room. Upgrade it in Housing.</div>'}
      ` : '<div class="panel-box muted">Own a house to build an aquarium. The Housing Office sells seven house types.</div>'}
    `;
  }

  function renderWardrobe() {
    const collection = game.cosmeticManager.getCollection();
    const slots = ['rod', 'ship', 'character', 'mount', 'backpack', 'effect', 'aquarium', 'legendary'];
    return `
      <div class="weight-panel" style="grid-template-columns:1fr 1fr 1fr">
        <div><div class="label">Collection</div><div class="big">${collection.owned} / ${collection.total}</div><div class="muted">${collection.percent}% complete</div></div>
        <div><div class="label">Equipped slots</div><div class="muted">${slots.map((slot) => `${slot}: ${game.cosmeticManager.getEquipped(slot)?.name || '—'}`).join('<br>')}</div></div>
        <div><div class="label">Cosmetic tokens</div><div class="big">${game.cosmeticManager.tokens}</div><div class="muted">Duplicates convert to tokens for exchange.</div></div>
      </div>
      <div class="expansion-section"><h3>Owned Cosmetics</h3>
        ${collection.ownedItems.length ? `<div class="expansion-grid">${collection.ownedItems.map((cos) => `
          <div class="expansion-card ${cos.isEquipped ? 'active' : ''}">
            <h4>${esc(cos.name)}</h4>
            ${rarityTag(cos.rarity)} <span class="muted">${esc(cos.slot)} slot</span>
            <div class="expansion-actions">
              ${cos.isEquipped ? `<button data-action="unequip-cosmetic" data-id="${cos.slot}">Unequip</button>` : `<button class="primary" data-action="equip-cosmetic" data-id="${cos.id}">Equip</button>`}
            </div>
          </div>
        `).join('')}</div>` : '<div class="panel-box muted">No cosmetics owned. Visit the Gacha Pavilion.</div>'}
      </div>
    `;
  }

  function renderGacha() {
    const banners = game.cosmeticManager.getBanners();
    const preview = game.cosmeticManager.getPreview('banner_rods');
    const odds = game.cosmeticManager.getDropRates();
    return `
      <div class="two-col">
        <div class="panel-box">
          <h4>Collection Pity Meter · ${game.cosmeticManager.pity}/10</h4>
          <div class="pity-track"><div class="pity-fill" style="width:${(game.cosmeticManager.pity / 10) * 100}%"></div></div>
          <div class="muted">Every 10th draw guarantees the featured cosmetic. Duplicates become tokens. No paid currency, no cash-out.</div>
          <div class="stat-line"><span>Tokens</span><span>${game.cosmeticManager.tokens}</span></div>
        </div>
        <div class="panel-box">
          <h4>Published Drop Rates</h4>
          ${Object.entries(odds).map(([rarity, chance]) => `<div class="stat-line"><span>${rarityTag(rarity)}</span><span>${(chance * 100).toFixed(1)}%</span></div>`).join('')}
          <div class="muted" style="margin-top:8px">Exact pool: ${preview.poolSize || 0} cosmetics in the Rod banner.</div>
        </div>
      </div>
      <div class="expansion-section" style="margin-top:16px"><h3>Banners</h3>
        <div class="expansion-grid">
          ${banners.map((banner) => `<div class="expansion-card">
            <h4>${banner.icon} ${esc(banner.name)}</h4>
            <div class="muted">${esc(banner.description)}</div>
            <div class="stat-line"><span>Owned in banner</span><span>${banner.ownedCount}/${banner.poolSize}</span></div>
            <div class="expansion-actions">
              <button class="gold" data-action="draw-gacha" data-banner="${banner.id}" data-count="1" ${game.player.economy.canAfford(120) ? '' : 'disabled'}>Draw 1 · ${money(120)}</button>
              <button class="primary" data-action="draw-gacha" data-banner="${banner.id}" data-count="10" ${game.player.economy.canAfford(1080) ? '' : 'disabled'}>Draw 10 · ${money(1080)}</button>
              <button data-action="redeem-token" data-banner="${banner.id}" ${game.cosmeticManager.tokens >= 120 ? '' : 'disabled'}>Redeem · 120 tokens</button>
            </div>
          </div>`).join('')}
        </div>
      </div>
      ${lastDrawResults.length ? `<div class="expansion-section"><h3>Latest Draw Results</h3><div class="draw-results">${lastDrawResults.map((item) => `<div class="draw-result"><strong>${esc(item.name)}</strong><br>${rarityTag(item.rarity)}<br>${item.isDuplicate ? `Duplicate · +${item.tokens} tokens` : 'New cosmetic'}</div>`).join('')}</div></div>` : ''}
    `;
  }

  function renderCannons() {
    const stats = game.cannonManager.getStats();
    const catalog = game.cannonManager.getCatalog();
    const ammo = game.cannonManager.getAmmo();
    const upgrades = game.cannonManager.getUpgrades();
    return `
      <div class="weight-panel" style="grid-template-columns:1.2fr 1fr 1fr">
        <div><div class="label">Equipped cannon</div><div class="big">${esc(stats?.name)}</div><div class="muted">${esc(stats?.description)}</div></div>
        <div><div class="label">Combat stats</div><div class="muted">Damage ${stats?.damage} · Reload ${stats?.reload}s<br>Accuracy ${Math.round((stats?.accuracy || 0) * 100)}% · Stability ${Math.round((stats?.stability || 0) * 100)}%</div></div>
        <div><div class="label">Aim mode / ammo</div><div class="big">${game.cannonManager.mode === 'assisted' ? 'Assisted' : 'Manual'}</div><div class="muted">${game.cannonManager.ammo[game.cannonManager.selectedAmmo] || 0} × ${game.cannonManager.selectedAmmo}</div><div class="expansion-actions"><button data-action="toggle-cannon-mode">Toggle Mode</button></div></div>
      </div>
      <div class="expansion-section"><h3>Ammunition</h3>
        <div class="expansion-grid">
          ${ammo.map((a) => `<div class="expansion-card ${a.isSelected ? 'active' : ''}">
            <h4>${a.icon} ${esc(a.name)} · ${a.count}</h4>
            <div class="muted">${esc(a.description)}</div>
            <div class="expansion-actions"><button data-action="select-ammo" data-id="${a.id}" ${a.count <= 0 ? 'disabled' : ''}>${a.isSelected ? 'Selected' : 'Load'}</button></div>
          </div>`).join('')}
        </div>
      </div>
      <div class="expansion-section"><h3>Upgrade Tree — ${esc(stats?.name)}</h3>
        <div class="expansion-grid">
          ${upgrades.map((u) => `<div class="expansion-card ${u.isMax ? 'owned' : ''}">
            <h4>${esc(u.name)} <span class="muted">Lv ${u.level}/${u.maxLevel}</span></h4>
            <div class="muted">${esc(u.description)}</div>
            <div class="expansion-actions"><button class="gold" data-action="upgrade-cannon" data-id="${u.id}" ${u.isMax || !game.player.economy.canAfford(u.cost) ? 'disabled' : ''}>${u.isMax ? 'MAX' : money(u.cost)}</button></div>
          </div>`).join('')}
        </div>
      </div>
      <div class="expansion-section"><h3>Cannon Collection · ${game.cannonManager.ownedCannonIds.size}/${catalog.length}</h3>
        <div class="expansion-grid">
          ${catalog.map((c) => `<div class="expansion-card ${c.isEquipped ? 'active' : c.isOwned ? 'owned' : ''}">
            <h4>${esc(c.name)}</h4>
            ${rarityTag(c.rarity)} <span class="muted">${esc(c.description)}</span>
            <div class="stat-line"><span>Damage / reload</span><span>${c.damage} / ${c.reload}s</span></div>
            <div class="expansion-actions">
              ${c.isEquipped ? '<button disabled>Equipped</button>' : c.isOwned ? `<button data-action="equip-cannon" data-id="${c.id}">Equip</button>` : `<button class="gold" data-action="buy-cannon" data-id="${c.id}" ${game.player.economy.canAfford(c.cost) ? '' : 'disabled'}>${money(c.cost)}</button>`}
            </div>
          </div>`).join('')}
        </div>
      </div>
    `;
  }

  function renderResearch() {
    const research = game.serviceManager.getResearchState(game.player.inventory);
    return `
      <div class="two-col">
        <div class="panel-box"><h4>Research Samples · ${research.samples}</h4>
          <div class="muted">Study catches to turn physical fish into research samples. Collection records remain intact.</div>
          ${research.bucket.slice(0, 12).map((fish) => `<div class="item-row"><span class="icon">${fish.icon}</span><span class="item-name">${esc(fish.name)}</span><span class="item-meta">${fish.rarity}</span><button class="mini-btn" data-action="research-sample" data-id="${fish.instanceId}">Study</button></div>`).join('') || '<div class="muted" style="padding:8px">Bucket empty.</div>'}
        </div>
        <div class="panel-box"><h4>Research Milestones</h4>
          ${research.rewards.map((reward, index) => `<div class="item-row"><span class="icon">🧪</span><span class="item-name">${esc(reward.label)}<br><span class="item-meta">${reward.samples} samples</span></span><button class="mini-btn ${reward.canClaim ? 'primary' : ''}" data-action="claim-research" data-index="${index}" ${reward.canClaim ? '' : 'disabled'}>${reward.isClaimed ? 'Claimed' : money(reward.coins)}</button></div>`).join('')}
        </div>
      </div>
    `;
  }

  function renderRadar() {
    const boat = game.boatManager.getActiveBoat();
    const radar = game.giantFishManager.getRadar(game.player.position, { range: 520 });
    const bosses = game.bossManager.getBosses();
    return `
      <div class="muted" style="margin-bottom:12px">Radar range scales with ship radar upgrades and assigned lookout/navigator crew. ${boat ? `Active ship: ${esc(boat.name)} · hull ${Math.round(boat.health)}/${boat.maxHealth}.` : 'You need an active ship to engage a boss.'}</div>
      <div class="expansion-section"><h3>Nearby Giants</h3>
        ${radar.length ? `<div class="expansion-grid">${radar.map((entry) => `<div class="expansion-card ${entry.isTracked ? 'active' : ''}">
          <h4>${entry.icon} ${esc(entry.name)}</h4>
          <div class="muted">${esc(entry.category)} · ${esc(entry.depth)} depth · ${esc(entry.stateLabel)}</div>
          <div class="stat-line"><span>Direction / distance</span><span>${entry.direction} · ${entry.distance}m (${entry.distanceBand})</span></div>
          <div class="stat-line"><span>Status</span><span>${esc(entry.status)}</span></div>
          <div class="expansion-actions">
            <button data-action="track-creature" data-id="${entry.id}">${entry.isTracked ? 'Tracked' : 'Track'}</button>
            ${entry.canEngage ? `<button class="danger" data-action="engage-boss" data-id="${entry.bossId}">Engage Boss</button>` : ''}
          </div>
        </div>`).join('')}</div>` : '<div class="panel-box muted">No giant creatures in radar range. Sail further from shore.</div>'}
      </div>
      <div class="expansion-section"><h3>World Bosses</h3>
        <div class="expansion-grid">
          ${bosses.map((boss) => `<div class="expansion-card ${boss.record ? 'owned' : ''}">
            <h4>${boss.icon} ${esc(boss.name)}</h4>
            ${rarityTag(boss.difficulty)} <span class="muted">${esc(boss.location)}</span>
            <div class="muted">${boss.maxHealth} HP · ${boss.phases} phases · ${esc(boss.title)}</div>
            <div class="stat-line"><span>Record</span><span>${boss.record ? `${boss.record.defeats} defeat(s)` : 'Undefeated'}</span></div>
            <div class="expansion-actions"><button class="danger" data-action="engage-boss" data-id="${boss.id}" ${boat ? '' : 'disabled'}>Engage · ${esc(boss.name)}</button></div>
          </div>`).join('')}
        </div>
      </div>
      ${game.unlockedTitles.size ? `<div class="expansion-section"><h3>Titles Earned</h3><div class="buff-list">${Array.from(game.unlockedTitles).map((t) => `<span class="buff-pill">🏅 ${esc(t)}</span>`).join('')}</div></div>` : ''}
    `;
  }

  function renderCrew() {
    const roles = game.crewManager.getRoles();
    const catalog = game.crewManager.getCatalog();
    const bonuses = [
      ['reload', 'Cannon reload'], ['accuracy', 'Cannon accuracy'], ['repair', 'Hull repair'],
      ['radar', 'Radar range'], ['cargo', 'Cargo bonus'], ['fishing', 'Passive fishing'], ['heal', 'Crew healing'],
    ];
    return `
      <div class="expansion-section"><h3>Assigned Stations</h3>
        <div class="expansion-grid">
          ${roles.map((role) => `<div class="expansion-card ${role.crew ? 'owned' : ''}">
            <h4>${role.icon} ${esc(role.name)}</h4>
            <div class="muted">${esc(role.description)}</div>
            <div class="stat-line"><span>Assigned</span><span>${role.crew ? esc(role.crew.name) : 'Empty'}</span></div>
            ${role.crew ? `<div class="expansion-actions"><button data-action="unassign-crew" data-id="${role.id}">Unassign</button></div>` : ''}
          </div>`).join('')}
        </div>
      </div>
      <div class="two-col">
        <div class="panel-box"><h4>Active Bonuses</h4>${bonuses.map(([key, label]) => `<div class="stat-line"><span>${label}</span><span>${game.crewManager.getBonus(key).toFixed(2)}</span></div>`).join('')}</div>
        <div class="panel-box"><h4>Crew Notes</h4><div class="muted">Crew bonuses apply live to cannon reload/accuracy, radar range and cargo. Recruit with in-game coins; assign one specialist per station.</div></div>
      </div>
      <div class="expansion-section" style="margin-top:16px"><h3>Crew for Hire</h3>
        <div class="expansion-grid">
          ${catalog.map((crew) => `<div class="expansion-card ${crew.isOwned ? 'owned' : ''}">
            <h4>${crew.icon} ${esc(crew.name)}</h4>
            <div class="muted">${esc(crew.roleInfo?.name || crew.role)} · skill ${crew.skill}</div>
            <div class="expansion-actions">
              ${crew.isAssigned ? '<button disabled>On Duty</button>' : crew.isOwned ? `<button data-action="assign-crew" data-id="${crew.id}">Assign</button>` : `<button class="gold" data-action="recruit-crew" data-id="${crew.id}" ${game.player.economy.canAfford(crew.cost) ? '' : 'disabled'}>Recruit ${money(crew.cost)}</button>`}
            </div>
          </div>`).join('')}
        </div>
      </div>
    `;
  }

  content.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    handleAction(button.dataset.action, button.dataset, button);
  });

  function handleAction(action, data, button) {
    const inv = game.player.inventory;
    const eco = game.player.economy;
    let result = null;
    switch (action) {
      case 'claim-npc-quest': result = activeNpcId ? game.claimNpcQuest(activeNpcId) : { success: false, reason: 'Talk to an NPC first' }; break;
      case 'gift-npc': {
        const select = document.getElementById('gift-select');
        if (select && select.value && activeNpcId) result = game.expansionNpcManager.giveGift(activeNpcId, select.value, game.backpackManager);
        else result = { success: false, reason: 'Select a gift item first' };
        break;
      }
      case 'use-item': result = game.quickUseItem(data.id); break;
      case 'item-to-cargo': {
        const boat = game.boatManager.getActiveBoat();
        result = boat ? game.cargoManager.depositItem(boat, game.backpackManager, data.id, 1) : { success: false, reason: 'No active ship' };
        break;
      }
      case 'item-from-cargo': {
        const boat = game.boatManager.getActiveBoat();
        result = boat ? game.cargoManager.withdrawItem(boat, game.backpackManager, data.id, 1) : { success: false, reason: 'No active ship' };
        break;
      }
      case 'item-to-home': {
        const house = getSelectedHouse();
        result = house ? game.housingManager.storeItem(house.id, game.backpackManager, data.id, 1) : { success: false, reason: 'No house selected' };
        break;
      }
      case 'fish-to-cargo': {
        const boat = game.boatManager.getActiveBoat();
        result = boat ? game.cargoManager.depositFish(boat, inv, data.id) : { success: false, reason: 'No active ship' };
        break;
      }
      case 'fish-from-cargo': {
        const boat = game.boatManager.getActiveBoat();
        result = boat ? game.cargoManager.withdrawFish(boat, inv, data.id) : { success: false, reason: 'No active ship' };
        break;
      }
      case 'fish-to-home': {
        const house = getSelectedHouse();
        result = house ? game.housingManager.storeFish(house.id, inv, data.id) : { success: false, reason: 'No house selected' };
        break;
      }
      case 'fish-from-home': {
        const house = getSelectedHouse();
        result = house ? game.housingManager.withdrawFish(house.id, inv, data.id) : { success: false, reason: 'No house selected' };
        break;
      }
      case 'buy-backpack': result = game.backpackManager.purchaseBackpack(data.id, eco); break;
      case 'equip-backpack': result = game.backpackManager.equipBackpack(data.id); break;
      case 'buy-rod': result = game.rodManager.buyRod(data.id, eco, game.player.progression.getLevel()); break;
      case 'equip-rod': result = game.rodManager.equipRod(data.id); if (result.success) game.fishingSystem.buffManager = game.consumableManager; break;
      case 'buy-tool': result = game.fishingToolManager.buyTool(data.id, eco); break;
      case 'equip-tool': result = game.fishingToolManager.equip(data.id); break;
      case 'deploy-trap': result = game.deployFishingTrap(data.id); break;
      case 'collect-traps': result = game.collectFishingTraps(); break;
      case 'unlock-skill': result = game.rodManager.unlockSkill(data.id); break;
      case 'buy-consumable': result = game.consumableManager.buy(data.id, eco, game.backpackManager, inv); break;
      case 'craft': {
        if (data.id === 'cook_golden_sushi' || data.id === 'cook_magma_stew') {
          if (!window.confirm('This recipe will consume a rare fish. Continue?')) return;
        }
        result = game.consumableManager.craft(data.id, { backpack: game.backpackManager, inventory: inv, economy: eco, confirmRare: true });
        break;
      }
      case 'select-crop': result = game.farmingManager.selectCrop(data.id); break;
      case 'farm-plant': result = game.farmingManager.plant(data.id, game.farmingManager.selectedCropId, eco); break;
      case 'farm-water': result = game.farmingManager.water(data.id); break;
      case 'farm-harvest': result = game.farmingManager.harvest(data.id, {
        economy: eco,
        backpack: game.backpackManager,
        inventory: inv,
        progression: game.player.progression,
      }); break;
      case 'buy-farm-tool': result = game.farmingManager.buyTool(data.id, eco); break;
      case 'equip-farm-tool': result = game.farmingManager.equipTool(data.id); break;
      case 'gather-strike': result = game.gatheringManager.strike(data.id); break;
      case 'buy-gather-tool': result = game.gatheringManager.buyTool(data.id, eco); break;
      case 'equip-gather-tool': result = game.gatheringManager.equipTool(data.id); break;
      case 'buy-city-boat': result = game.purchaseCityBoat(data.id); break;
      case 'buy-expedition-boat': result = game.purchaseExpeditionBoat(data.id); break;
      case 'buy-gem-offer': result = game.purchaseGemOffer(data.id); break;
      case 'travel-frontier': result = game.travelToFrontier(data.id); if (result?.success) return; break;
      case 'buy-house': result = game.housingManager.purchase(data.id, game.player); selectedHouseId = data.id; break;
      case 'select-house': selectedHouseId = data.id; break;
      case 'enter-house': {
        const house = game.housingManager.getHouses().find((h) => h.id === data.id);
        result = house?.isInside ? game.housingManager.exit(data.id, game.player) : game.housingManager.enter(data.id, game.player);
        if (result?.success) {
          if (game.cameraRig) game.cameraRig.reset(game.player.position);
          game.closeExpansion();
          return;
        }
        break;
      }
      case 'upgrade-house': result = game.housingManager.upgrade(data.id, eco); break;
      case 'set-home': result = game.housingManager.setHome(data.id); break;
      case 'teleport-home': result = game.teleportHome(); if (result?.success) return; break;
      case 'place-furniture': result = game.housingManager.placeFurniture(selectedHouseId, data.id, eco); break;
      case 'remove-furniture': result = game.housingManager.removeFurniture(selectedHouseId, data.id); break;
      case 'stock-aquarium': result = game.housingManager.stockAquarium(selectedHouseId, inv, data.id); break;
      case 'claim-guild': result = game.serviceManager.claimGuildRank(inv, eco); break;
      case 'claim-daily': result = game.serviceManager.claimDaily(eco); break;
      case 'claim-research': result = game.serviceManager.claimResearch(Number(data.index), inv, eco); break;
      case 'research-sample': result = game.serviceManager.sampleFish(inv, data.id); break;
      case 'auction-sell': result = game.serviceManager.sellAuctionItem(data.id, game.backpackManager, eco); break;
      case 'equip-cosmetic': result = game.cosmeticManager.equip(data.id); break;
      case 'unequip-cosmetic': result = game.cosmeticManager.unequip(data.id); break;
      case 'draw-gacha': {
        const draw = game.cosmeticManager.draw(data.banner, Number(data.count), eco);
        if (draw.success) {
          lastDrawResults = draw.rewards;
          notify(`Draw complete — ${draw.rewards.filter((r) => !r.isDuplicate).length} new cosmetic(s)`);
        }
        result = draw;
        break;
      }
      case 'redeem-token': result = game.cosmeticManager.redeemToken(data.banner, eco); break;
      case 'buy-cannon': result = game.cannonManager.purchaseCannon(data.id, eco); break;
      case 'equip-cannon': result = game.cannonManager.equipCannon(data.id); break;
      case 'upgrade-cannon': result = game.cannonManager.purchaseUpgrade(game.cannonManager.equippedCannonId, data.id, eco); break;
      case 'select-ammo': result = game.cannonManager.selectAmmo(data.id); break;
      case 'toggle-cannon-mode': result = { success: true, mode: game.cannonManager.toggleMode() }; break;
      case 'track-creature': result = game.giantFishManager.track(data.id); break;
      case 'engage-boss': {
        result = game.startBossEncounter(data.id);
        if (result?.success) return;
        break;
      }
      case 'recruit-crew': result = game.crewManager.recruit(data.id, eco); break;
      case 'assign-crew': result = game.crewManager.assign(data.id); break;
      case 'unassign-crew': result = game.crewManager.unassign(data.id); break;
      default:
        return;
    }
    if (result && result.success === false) notify(result.reason);
    render();
    updateSurvivalHud();
  }

  // ---------- Combat HUD ----------
  const bossHud = document.getElementById('boss-hud');
  const bossName = document.getElementById('boss-name');
  const bossTitle = document.getElementById('boss-title');
  const bossPhase = document.getElementById('boss-phase');
  const bossHealthFill = document.getElementById('boss-health-fill');
  const bossHealthText = document.getElementById('boss-health-text');
  const shipHealthFill = document.getElementById('ship-health-fill');
  const shipHealthText = document.getElementById('ship-health-text');
  const bossAmmo = document.getElementById('boss-ammo');
  const bossReload = document.getElementById('boss-reload');
  const bossMode = document.getElementById('boss-mode');
  const bossDuration = document.getElementById('boss-duration');

  function updateBossHud() {
    if (!bossHud) return;
    const boat = game.boatManager.getActiveBoat();
    const hud = game.bossManager.activeBoss ? game.bossManager.getHudState(boat) : null;
    if (!hud) {
      bossHud.style.display = 'none';
      return;
    }
    bossHud.style.display = 'block';
    bossName.textContent = hud.name;
    bossTitle.textContent = `${hud.title.toUpperCase()} · ${hud.vulnerability ? 'VULNERABLE' : 'HOSTILE'}`;
    bossPhase.textContent = `Phase ${hud.phase} · ${hud.phaseName}`;
    bossHealthFill.style.width = `${hud.healthPercent}%`;
    bossHealthText.textContent = `${hud.healthPercent}%`;
    shipHealthFill.style.width = `${hud.shipPercent}%`;
    shipHealthText.textContent = `${hud.shipPercent}%`;
    const ammo = game.cannonManager.getAmmo().find((a) => a.isSelected);
    bossAmmo.textContent = `${ammo?.icon || '⚫'} ${ammo?.name || 'Standard'} · ${ammo?.count || 0}`;
    bossReload.textContent = game.cannonManager.reloadRemaining > 0
      ? `Reloading ${game.cannonManager.reloadRemaining.toFixed(1)}s`
      : 'Ready to fire';
    bossMode.textContent = game.cannonManager.mode === 'assisted' ? 'Assisted aim' : 'Manual aim';
    bossDuration.textContent = `${hud.duration.toFixed(1)}s`;
  }

  const fireBtn = document.getElementById('btn-cannon-fire');
  if (fireBtn) fireBtn.addEventListener('click', () => {
    const result = game.fireCannon();
    if (result && result.success === false) notify(result.reason);
    updateBossHud();
  });
  const modeBtn = document.getElementById('btn-cannon-mode');
  if (modeBtn) modeBtn.addEventListener('click', () => {
    const mode = game.cannonManager.toggleMode();
    notify(`Cannon mode: ${mode === 'assisted' ? 'Assisted' : 'Manual'}`);
    updateBossHud();
  });
  const leftBtn = document.getElementById('btn-cannon-left');
  if (leftBtn) leftBtn.addEventListener('click', () => game.cannonManager.aim(-0.14));
  const rightBtn = document.getElementById('btn-cannon-right');
  if (rightBtn) rightBtn.addEventListener('click', () => game.cannonManager.aim(0.14));
  const retreatBtn = document.getElementById('btn-boss-retreat');
  if (retreatBtn) retreatBtn.addEventListener('click', () => {
    const result = game.retreatBoss();
    if (result?.success === false) notify(result.reason);
    updateBossHud();
  });

  // ---------- Survival HUD ----------
  const healthFill = document.getElementById('survival-health-fill');
  const staminaFill = document.getElementById('survival-stamina-fill');
  const carryText = document.getElementById('survival-carry');
  const buffText = document.getElementById('survival-buffs');

  function updateSurvivalHud() {
    if (!game.player) return;
    const p = game.player;
    if (healthFill) healthFill.style.width = `${Math.max(0, Math.min(100, (p.health / p.maxHealth) * 100))}%`;
    if (staminaFill) staminaFill.style.width = `${Math.max(0, Math.min(100, (p.stamina / p.maxStamina) * 100))}%`;
    if (carryText) {
      const load = game.backpackManager.getLoad(p.inventory);
      carryText.textContent = `${load.weight.toFixed(1)} / ${load.capacityWeight} kg · ${load.status}`;
    }
    if (buffText) {
      const buffs = game.consumableManager.getActiveBuffs();
      buffText.textContent = buffs.length ? buffs.map((b) => `${b.icon}${b.remaining.toFixed(0)}`).join(' ') : 'No buffs';
    }
  }

  setInterval(() => {
    if (!game || !game.isRunning) return;
    updateBossHud();
    updateSurvivalHud();
  }, 100);

  render();
  updateBossHud();
  updateSurvivalHud();
  return { render, updateBossHud, updateSurvivalHud };
}

export default initExpansionUI;
