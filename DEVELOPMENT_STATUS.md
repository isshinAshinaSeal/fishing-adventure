# Development Status — 3D Open-World Fishing Adventure

## 1. Project Information
- **Project Name:** 3D Open-World Fishing Adventure
- **Genre:** Open-World Adventure, Fishing Simulation, Sandbox Exploration, Tycoon/Economy
- **Target Platform:** Desktop / Web (Modern Browsers supporting WebGL 2.0 / WebGPU)
- **Engine:** Three.js (v0.186.x) with custom modular Entity-Component-System & Physics layers
- **Runtime Environment:** Node.js v24.x, ES2022+ Native Modules
- **Rendering Style:** Stylized 3D (warm palette, dynamic lighting, vertex wave water, low-poly environmental art)
- **Camera Perspective:** Third-person orbit/follow camera with collision avoidance and smooth pitch/yaw damping

## 2. Current Architecture
- **Core Loop:** Decoupled `Game.js` driving `requestAnimationFrame` with fixed timestep sub-stepping for physics and render interpolation.
- **Input System:** Abstract action mapper in `InputManager.js` supporting Keyboard (WASD/Shift/Space/E/F/R/B/T/J/K/V/H/O/C/X/L), Mouse (drag/look, wheel zoom), and Pointer Lock.
- **World & Physics:** `Environment.js` managing procedural stylized terrain, procedural water, sky dome, and directional sunlight. `TerrainCollider.js` providing mathematical elevation sampling and raycast normal calculation (guaranteeing zero void drops).
- **Player Controller:** `PlayerController.js` handling 8-direction velocity calculation, acceleration, drag, sprint modifiers, jump arc, grounded state clamping, equippable rod tool, boat piloting, and leveling progression.
- **Camera Rig:** `ThirdPersonCamera.js` providing smooth orbit follow, distance damping, pitch clamp, and obstacle collision retraction.
- **Interaction System:** `InteractionManager.js` and `Interactable.js` managing proximity detection, single-target prioritization, debounced input triggers, and modal dialogue system.
- **NPC System:** `NPC.js` and `CivilianNPC.js` featuring stylized 3D meshes (Captain Finn, Fisherman Barnaby, Fishmonger Pete, Shopkeeper Silas inside the Tackle Hut, Marina Master Vance, Captain Redbeard on Pirate Island, and autonomous wandering civilians: Villager Emma, Old Angler Joe, Dockhand Toby, Sailor Marco), dynamic waypoint patrolling, leg/arm walking animations, breathing idle animation, dynamic head-tracking, and dialogue trees.
- **World & Archipelago:** `Environment.js` and `TerrainCollider.js` featuring the Main Island (Village, Tackle Hut, Marina Wharf, Farmlands, Central Ridge) and a Second Island across open sea (Smuggler's Atoll & Pirate Cove) with deep navigable water channels, docks, palm trees, and pirate encampments.
- **Fishing System:** `FishingSystem.js`, `FishingSpot.js`, `FishingRod.js`, and `FishDatabase.js` implementing rod equipping, casting parabolic arcs, bite alert cues, dynamic tension-meter reeling minigames, and weighted species catch results linked to zone habitats.
- **Inventory & Satchel:** `InventoryManager.js` managing player bucket capacity, item storage, and fish encyclopedia records.
- **Economy & Merchants:** `EconomyManager.js` and `ShopManager.js` providing exploit-safe double-sale prevention, rod/bucket upgrades, and multi-tier vessel dealerships.
- **Property & Real Estate:** `PropertyManager.js` and `PropertyPlot.js` providing claimable plots, 3D cottage exterior/interior transitions, and ownership persistence.
- **Storage & Pond:** `StorageManager.js` and `PrivatePond.js` managing a 50-fish storage chest, stone pond basin with live swimming fish bounded strictly by perimeter constraints.
- **Passive Income:** `PassiveIncomeManager.js` calculating real-time and offline passive coin accumulation up to configured caps.
- **Boat System:** `BoatManager.js` and `Boat.js` implementing 30 harbor/pirate vessels, a separate 10-vessel Aurelia Sky Marina fleet and eight expedition hulls, water buoyancy, a smoothed-rudder helm with speed-scaled authority, boost and lateral slip, and shoreline land-collision blocks.
- **City Island:** `cityIsland.js`, `CityEnvironment.js` and `cityContent.js` building Aurelia Heights: a radius-112 plateau city with 16 towers (up to 150 m), avenue/plaza layout, 12 service buildings, 12 named residents, 18 strolling civilians, two fishing spots, a Sky Marina pier and a two-way harbor ferry.
- **Farming:** `FarmingManager.js`, `FarmPlot.js` and `crops.js` providing 12 crops, 14 plantable beds (6 harbor + 8 rooftop), watering/growth timers, harvest produce, XP/coin rewards, eight watering-can/hoe upgrades and persistence.
- **Gathering:** `GatheringManager.js`, `ResourceNode.js` and `resources.js` providing 10 axe/pickaxe tiers, 21 harvestable tree and ore nodes across harbor and city, tool-tier gating, weighted drops, node HP, respawn timers, XP and persistence.
- **Frontier Archipelago:** `frontierIslands.js`, `frontierContent.js` and `frontierSpecies.js` adding four remote terrain-clamped islands (Tempest Spire, Aurora Isle, Glasswind Cay and Serpent Reef), four service outposts and residents, eight expedition fishing platforms, eight ferries and 24 exclusive fish across four new categories.
- **Performance Pass:** spatial-hash zone lookup, bounding-box terrain rejection, shared ripple geometries, cached species/habitat pools, shared island prop assets and cached diagnostic aggregates reduce per-frame work across the expanded world.
- **Wildlife AI:** `WildlifeManager.js` and `SharkAI.js` implementing pelagic predators with 3-state AI (PATROL, CURIOUS, FLEE), fin articulation kinematics, and water depth clamping.
- **Open-World Biomes:** `ZoneManager.js` tracking 15 classic geographic zones plus four Expansion 7.0 frontier regions, with discovery triggers, exploration percentages, habitat-linked catch tables and a spatial-hash lookup index.
- **Quests & Leveling:** `QuestManager.js` and `ProgressionManager.js` tracking level curves, XP formulas, and multifaceted quest milestones.
- **Save & Load Persistence:** `SaveManager.js` providing unified JSON serialization and schema validation across all subsystems.
- **Polish & Audio:** `SoundManager.js` (Web Audio API synthesis for splash, bites, reels, fanfare, and coins) and `ParticleManager.js` (object-pooled water splashes, wakes, and catch confetti).

## 3. Implemented Phases (All 14 Phases Complete)

### Phase 1: Foundation
- [x] Initial project inspection & architecture setup
- [x] Centralized configuration (`src/config.js`) for physics, camera, and world balance
- [x] Modular Three.js scene, camera, and renderer lifecycle in `src/core/Game.js`
- [x] Third-person orbital camera controller with yaw, pitch, distance damping, and terrain clearance (`src/camera/ThirdPersonCamera.js`)
- [x] 8-Directional player kinematic controller with walking, running, and jumping (`src/entities/PlayerController.js`)
- [x] Continuous terrain collision & heightmap clamping preventing falling through ground (`src/world/TerrainCollider.js`)
- [x] Basic stylized open-world environment with sky dome, lighting, sun, and water surface (`src/world/Environment.js`)
- [x] Scene reset & restart lifecycle support (`restart()`)
- [x] Responsive browser UI and live diagnostic HUD (`index.html`, `styles.css`)

### Phase 2: Interaction System
- [x] Proximity detection and automatic interactable candidate prioritization
- [x] Dynamic floating UI interaction prompt pill with action labels (`[E] Talk to Captain Finn`)
- [x] Input debouncing strictly preventing accidental double-triggering or key-repeat spam
- [x] Stylized 3D low-poly NPCs (Captain Finn, Fisherman Barnaby) with breathing animation and head orientation tracking
- [x] Interactive dialogue modal window with sequential multi-page reading, advancing, and closing

### Phase 3: Fishing System
- [x] Equippable 3D fishing rod (`FishingRod.js`) with toggle key (`F`) and hand attachment
- [x] Pier and coastal fishing spots (`FishingSpot.js`) with animated water ripple rings
- [x] Cast line mechanics with parabolic trajectory and bobber placement in water
- [x] Random wait duration and bite detection with splash effects and exclamation alert (`!`)
- [x] Dynamic reeling minigame with tension meter, sweet spot zone, and catch progress bar
- [x] Weighted fish species database (`FishDatabase.js`) with Common, Uncommon, Rare, and Legendary tiers, weights, and coin values
- [x] Catch success modal presenting caught fish details, weight, and monetary reward
- [x] Validation rejecting invalid locations (too far from water or unequipped rod) and blocking concurrent fishing sessions

### Phase 4: Fish and Inventory
- [x] FishDatabase schema verification with rarity drop tables
- [x] Player fish bucket capacity management with full data preservation
- [x] Fish encyclopedia discovery records with personal catch records and weights
- [x] Inventory modal UI with Fish Bucket tab and Encyclopedia tab

### Phase 5: Economy and Merchants
- [x] Authoritative coin economy system (`EconomyManager.js`)
- [x] Individual fish sales and Sell All Fish batch operations
- [x] Anti-duplication exploit protection
- [x] Fishmonger Pete (buys fish at pier dock) and Master Angler Silas (tackle upgrades)
- [x] Equipment upgrade paths (rod reel speed/luck, bucket capacity)

### Phase 6: Property and House
- [x] Claimable real estate plots (`PropertyPlot.js`, `PropertyManager.js`)
- [x] Purchase validation and transaction handling
- [x] 3D visual transition from 'For Sale' signage to furnished cozy cottage
- [x] Seamless entrance into cottage interior and exit back outside
- [x] Non-owner access restrictions and ownership serialization

### Phase 7: Fish Storage and Private Pond
- [x] 50-slot storage chest with transfers to and from player bucket
- [x] Private stone pond holding up to 8 live fish
- [x] Procedural 3D swimming fish simulations strictly bounded within pond radius

### Phase 8: Passive Income
- [x] Real-time passive coin generation based on pond fish values
- [x] Offline earnings accumulation with time caps
- [x] Collection of accumulated earnings into player economy balance
- [x] Zero-rate verification for empty ponds and value scaling for rare species

### Phase 9: Boat System
- [x] 7 Boat categories (Rowboat, Dinghy, Skiff, Trawler, Catamaran, Yacht, Steam Cruiser)
- [x] Boat dealership with Marina Master Vance
- [x] Boarding and disembarking at dock moorings
- [x] Water surface buoyancy, throttle acceleration, and steering physics
- [x] Shoreline land-collision prevention blocking boats from driving onto dry ground

### Phase 10: Sharks and Wildlife AI
- [x] Pelagic Great White Shark, Hammerhead Shark, and Tiger Shark spawning in outer waters
- [x] 3-state AI finite state machine: PATROL, CURIOUS, and FLEE
- [x] Submerged depth clamping strictly between water level and seabed

### Phase 11: Open-World Expansion
- [x] 6 Open-world zones (Emerald Cove, Highland Springs, Whispering Shallows, Sunken Reef, Misty Atolls, Midnight Abyss)
- [x] Zone detection, discovery events, and exploration percentage calculation
- [x] Dynamic fishing habitat linkage matching catches to regional biomes

### Phase 12: Quests and Progression
- [x] Angler level progression with non-linear XP thresholds
- [x] XP rewards for fish catches, quest completions, and exploration
- [x] Multifaceted quest contracts (species bounties, weight challenges, zone discovery)
- [x] Reward claim handling with duplicate claim protection

### Phase 13: Save and Load System
- [x] Unified JSON serialization across all game subsystems (`SaveManager.js`)
- [x] LocalStorage persistence with fallback in-memory adapter
- [x] Full state restoration (player position, coins, equipment, bucket, storage, pond, properties, boats, zones, level, quests)
- [x] Graceful error recovery for corrupt or missing save files

### Phase 14: Polish and Optimization
- [x] Procedural Web Audio API sound synthesizer (`SoundManager.js`)
- [x] Particle splash, boat wake, and golden catch confetti (`ParticleManager.js`)
- [x] Integrated UI layer with Level/XP, Zone banner, Boat dealership, Sound controls, and Save/Load buttons
- [x] 1,000-frame performance stress test confirming 0 NaN values, 0 memory leaks, and high frame rates

## 4. Ocean Odyssey Expansion (Foundation)
An expansion layer sits on top of all 14 phases and is fully persisted:

- **Fishing 2.0:** three difficulty modes (Casual/Standard/Expert), nine bait profiles with habitat/time attraction, fish stamina and behavior-driven tension, perfect-catch value/XP bonuses, quick cast, and a shared day/night clock (dawn/day/dusk/night) that gates fish activity.
- **Expanded Catalog:** 140 species across 10 rarity tiers (Common → Abyssal) and 14 categories, each with habitat, preferred bait, active time, depth, behavior, weight range, and price. The legacy six-species API remains intact for old saves.
- **Fish Index 3.0:** global discovery percentage, per-category/habitat/rarity progress, biggest/rarest/most-caught records, first discovery, bait/category/habitat search, category/habitat/rarity/value sorting, catalog-value stats, completion milestones, field hints, discovered-only mode, and “Travel to Habitat” routing.
- **Fishing Tools:** 31 purchasable/equippable tools with passive casting modifiers, deployable fish traps with timed collection, three trap slots, and persisted ownership/equipment.
- **Mount System:** eight rideable mounts (Island Horse, Giant Turtle, Coconut Crab, Jungle Boar, Crystal Deer, Golden Fox, Snow Wolf, Ancient Lizard) with unlock costs/levels, summon/dismount, camera-relative riding, sprint + stamina, jumping, terrain affinity, XP/level scaling, and procedural 3D bodies.
- **Fast Travel Network:** 15 unlockable gates (Harbor, Coral, Jungle, Frozen, Volcano, Deep Sea, Ancient, Celestial plus Verdant Crown, Frostfall, Ember, Sunspire, Mistveil, Glassice and Cinder), zone/proximity unlocking, cooldowns, favourites, safe terrain-clamped landings, and habitat routing for Fish Index travel.
- **Ship Expansion:** 40 vessels total: 21 harbor boats, nine corsair vessels at the Pirate Dock and ten Aurelia city boats at the Sky Marina. All use the eight-branch shipyard upgrade tree (engine, hull, storage, fishing deck, radar, sonar, navigation, anchor), effective stat application, and deck fishing.
- **World Content:** 19 fishing hotspots (17 harbor/outer-isle plus two Aurelia city spots), seven compact outer isles, and floating island waypoint labels above every isle, Driftwood Isle and Smuggler's Atoll.
- **Persistence:** mounts, mount progress, fast-travel unlocks/favourites, ship upgrades, and the world clock serialize through `SaveManager`.
- **UI:** quick-access bar, mount stable, mount stamina HUD, travel map, Fish Index browser, shipyard upgrade panel, bait/difficulty selectors, notifications, and clock/index diagnostics.

## 5. Mega Expansion 2.0 (Foundation)
Expansion 2.0 is integrated into the world, not a menu-only prototype:

- **Physical Service District:** 21 interactable harbor buildings (including the tool shed, cartographer's loft, tavern, hatchery, quest board and lighthouse) plus 20 named NPCs with models, schedules, service dialogue, friendship, gifts, and persisted personal requests.
- **Free Island Huts:** eight built-in, non-purchasable huts around the starter isle, each with a resident NPC and an open service panel (guild, crafting, market, tools, potions, housing, mounts, aquarium).
- **Housing:** 12 purchasable/enterable houses, five upgrade levels gated by furniture, 24 furniture pieces rendered inside the home, home fish/item storage, aquarium display room and decorations, trophy hall, private dock, and a settable home teleport point.
- **Rod Collection:** 76 rods across 19 families/tiers with distinct reel, luck, line-strength, control and ability stats, purchase/equip validation, rod XP, 30 levels, and unlockable skills that feed `FishingSystem`.
- **Backpack & Cargo:** seven backpack upgrades with slot capacity, stack limits and weight; live normal/light/heavy/overweight states; movement penalty; per-vessel cargo for fish and supplies.
- **Consumables & Cooking:** 17 items with timed buffs, instant effects, cooldowns, a four-buff cap, quick-use supplies, and recipes that consume fish/materials (including multi-material farm and quarry recipes) with rare-fish confirmation.
- **Cosmetics:** 64 cosmetics in eight banners, coins-only draws, published odds, pool previews, ten-draw pity, duplicate-to-token conversion, token redemption, and wardrobe equipment for rod, ship, character, mount, backpack, effect and aquarium slots.
- **Giant Creatures:** 18 roaming giants with depth/behavior states, radar direction/distance bands, tracking, discovery records, and world-boss linkages.
- **Cannon Combat:** 10 cannons, seven ammo types, assisted/manual aim, reload/accuracy/stability, five upgrade branches, and four multi-phase bosses with vulnerability windows, hull damage, rewards, titles, trophies and cosmetic drops.
- **Crew:** eight recruitable specialists across eight stations with live bonuses to reload, accuracy, repair, radar, cargo, passive fishing and healing.
- **Persistence:** all Expansion 2.0 managers serialize under `expansion2` while `SaveManager.schemaVersion` remains `2`; old saves without the section still load.

## 6. Expansion 4.0 — Lobby, Corsair Dock & Character Studio
- **Start Lobby:** a full-screen ocean-scene entry point with working Start, Credits, Skin Shop and Character Customization buttons. The world stays visible behind the lobby while player controls are locked; Main Menu returns to it at any time.
- **Pirate Dock:** the physical Corsair Dock near the starter harbor, staffed by Quartermaster Sable. It opens a dedicated Pirate Dock tab containing nine corsair vessels, separate from the 21-boat harbor dealership.
- **Paid Pirate Fleet:** the entry lineup is 50 coins / 10 m/s, 150 coins / 12 m/s and 400 coins / 15 m/s, followed by four heavier corsair ships up to 28 m/s. Purchases are real coin transactions and persist in the active fleet save.
- **Skin Shop:** eight directly purchasable angler outfits from free to 5,000 coins, shown with colour swatches, owned/equipped states and exact coin prices. No paid currency or gambling.
- **Character Customization:** live colour palettes for skin, shirt, trousers, hat and hat band, plus a randomize control and CSS avatar preview. Changes apply to the 3D player immediately.
- **New Fish:** 12 Pirate Waters and 12 Coral Reef species bring the catalog to 140 fish across 14 categories; both are fully searchable/indexed with value sorting.
- **Persistence:** owned outfits, equipped skin, custom appearance and pirate vessel ownership survive save/load. The lobby also stores a lightweight appearance profile for instant restoration.

## 7. Expansion 5.0 — Detailed Avatars & Expedition Fleet
- **Detailed NPC Avatars:** every NPC has a deterministic, role-based face with ears, nose, eyes, mouth, tool belt and a modelled backpack; the player can customize face, hair, facial hair, hat and backpack.
- **Expedition Fleet:** the harbor and pirate catalogues now contain 30 fully modelled ships, including expedition hulls with cabins, gunwales and multi-sail rigs, all using the existing upgrade tree.
- **Expanded Fishing Tools:** the fishing-tool catalogue grew from 19 to 31 tools with finder, luck, line-strength, multi-catch and bait modifiers, plus the Skyline/Rooftop/Quarry/Neon/Orchard/Aurelia rod families.

## 8. Expansion 6.0 — Aurelia Heights, Farming & Gathering
- **Aurelia Heights:** a separate south-west skyline island at `(-430, 430)`, radius 112 and plateau height ~12, merged into `TerrainCollider` and `ZoneManager`. It features 16 towers (the tallest at 150 m), an avenue grid, central plaza and fountain, street lamps, park planters, a waterfront pier and its own boat mooring.
- **City Life:** 12 service buildings (City Hall, Sky Marina, Rooftop Farm, Quarry Guild, market, rodworks, toolworks, café, aquarium, bank/auction, workshop, observatory), 12 named residents (Mayor Aurelia, Rosa, Gideon, Niko, Vega and others) and 18 strolling civilians, for 69 NPCs total.
- **Travel:** two physical ferry points connect Driftwood Harbor and Aurelia Heights in both directions; city arrivals are terrain-clamped and dismount mounts/boats cleanly.
- **Farming:** 12 crops (turnip through Aurelia Sunflower) on 14 beds; planting costs coins, watering boosts growth, and harvests yield produce, coins and XP. Eight farm tools upgrade watering growth and harvest yield.
- **Gathering:** 21 resource nodes (12 trees, 9 ore seams) across harbor woodland, quarry and city terraces; 10 axe/pickaxe tiers gate by node difficulty, with weighted material drops, node HP, respawn timers, XP and lifetime stats.
- **Rods & Crafting:** 76 rods across 19 families (including six city families) and 31 fishing tools; 12 produce items, 14 gathering materials and 10 new multi-material recipes feed cooking, repair kits, luck charms and weather lenses. Multi-material crafting validates the whole ingredient list before consuming anything.
- **City Marina:** 10 additional city vessels (`boat_city_taxi` through `boat_city_flagship`) in a separate catalogue, launched at the Sky Marina and boardable via the standard E interaction; the original 30-vessel catalogue is unchanged.
- **Persistence:** farming plots/tools/crops and gathering nodes/tools/stats serialize under `expansion6`; city boat ownership reuses the existing fleet save.
- **UI:** new Farming, Gathering and City Marina tabs, three quick-bar buttons, live crop/node state, tool shops and crafting previews showing owned/required materials.

## 9. Expansion 7.0 - Frontier Archipelago
- **Four Remote Islands:** Tempest Spire `(525, -525)`, Aurora Isle `(525, 525)`, Glasswind Cay `(-525, -525)` and Serpent Reef `(40, 525)`. Each has its own analytical height sampler merged into `TerrainCollider`, a real walkable beach/plateau, a dedicated zone (`tempest_reach`, `aurora_shelf`, `glasswind_sound`, `serpent_reef_zone`) and a dock/arrival point.
- **Outposts & Residents:** four service outposts (Stormwatch Outpost, Aurora Light, Glasswind Workshop, Serpent Reef Market) and four named residents (Stormwarden Kai, Keeper Elara, Glasswright Mira, Reefkeeper Soren), all registered interactables with dialogue and service routing.
- **Fishing Platforms:** eight frontier fishing spots — two per island — with glowing ripple markers, terrain-clamped positions and their own `frontier` catalog selection. The full cast → wait → bite → strike → tension/reel → catch loop is verified on every platform.
- **24 New Fish:** six species per island across the Stormfront, Aurora Deep, Glasswind and Serpent Reef categories, from common fry to Secret/Abyssal apex catches. `ExpandedSpecies` stays at 140; the combined index catalog is 164.
- **Travel:** eight expedition ferry points (one outbound and one return per island) plus a Frontier tab with direct sail buttons. Habitat travel from the Fish Index falls back to the matching frontier island when no classic gate exists.
- **State Preservation:** ferry travel now uses a state-preserving player teleport instead of the restart path, so coins, inventory, XP and storage survive every crossing.
- **Persistence & UI:** `expansion7.frontier` stores visited island ids and frontier catch totals; the command center gains an 18th Frontier tab and the quick bar gains a 🧭 Frontier button.
- **Performance:** spatial-hash zone lookup, terrain bounding-box rejection, shared ripple geometry, cached habitat pools and shared frontier prop assets keep the expanded world inexpensive to update.

## 10. Expansion 8.0 - Expedition Season, Gems & Story (Current)
- **Starter Fortune:** every new game starts with 1,000 coins and 0 gems. A one-time secret chest tucked behind Shopkeeper Silas inside the tackle hut pays 20,000 coins and 2 gems, serializes its opened state and re-seals on a full restart.
- **Gems (hard currency):** gems come from story chapters, world bosses, the secret chest and rare caches. The eight-offer Gem Exchange (`src/economy/gemShop.js`) sells coin pouches, an XP chart, two gem-locked fishing tools, the Worldheart Celestial Rod and two celestial hulls. Gem-locked tools reject coin purchases outright.
- **Expedition Fleet:** eight frontier hulls (Tempest Tidecat through Aurora Expedition Flagship and Leviathan Hunter) sold from a new Expedition Fleet tab and delivered to their home-island mooring. The original 30 harbor/pirate vessels and 10 city vessels remain untouched.
- **Expedition Rods & Tools:** 16 new rods (92 live) with habitat/rarity/large-fish bonuses and cast distances of 58–112, plus 12 new tools (43 live) including two gem-locked arrays. Base catalogs stay at exactly 76 rods and 31 tools.
- **Deeper Fishing:** casts now reach 5.5–13.5 m based on rod cast distance; four frontier baits stack with rod habitat bonuses; hookset timing grades perfect (≤0.5 s, +18% reel), clean (≤1.2 s, +6%) and late (>1.2 s, −10%).
- **Real Helm:** `Boat.js` now models a smoothed rudder, speed-scaled steering authority, reverse steering, lateral slip, Shift boost with a rechargeable reserve, and shoreline collision telemetry. Yaw is never set directly from input.
- **Story Book:** ten chapters unlock from live campaign metrics (catches, species, zones, islands, boats, rods, tools, bosses, quests, furniture), grant coins/gems/XP exactly once, track read state and persist under `expansion8`. `L` opens the book.
- **Objectives Card:** a top-left card below the header shows the next two chapters with live progress bars, unlocked chapter count and gem balance, plus a direct Story Book button.
- **Dialogue That Works:** every NPC conversation ends in real choices — open the shop, open the service panel, claim the NPC quest, give a gift or leave. Quartermaster Sable still opens his corsair catalog immediately to preserve the direct-shop flow.
- **Pirate Patrol:** exactly one ambient pirate ship, the lowest-tier Jolly Bilge Skiff (tier 19), endlessly circles the starter island at 326 m with a tangent heading and gentle bob/roll. It is not purchasable and never docks.
- **Persistence & UI:** `expansion8` stores the story journal, chest state and patrol bearing; diagnostics add gem and story counters; the command center gains Expedition Fleet and Gem Exchange tabs, and the quick bar gains a Story button.

## 11. Current Quality Assurance Status
- **Automated Tests:** 175 / 175 Passing (100% pass rate across 32 test suites, including the Expansion 8.0 suite)
- **Headless Smoke Test:** `scripts/smoke-expansion8.mjs` passes 44/44 checks covering starter purse, merged catalogs, chest payout/one-time guard, a real story-unlocking catch with perfect hookset, gem exchange, expedition boat delivery, pirate patrol orbit, helm physics, NPC dialogue choices, `expansion8` save/load and 120 update frames. `scripts/smoke-expansion7.mjs` remains at 53/53 and `scripts/smoke-expansion6.mjs` at 36/36.
- **Browser Smoke Test:** the start lobby, Credits, skin shop, character studio, Start flow and harbor/Corsair Dock interactions were previously verified in Chrome headless with 0 console errors. The Expansion 8.0 HUD, story modal and dialogue choices are covered by the automated suites and headless smoke script; a fresh in-browser pass is recommended on the next UI review. Current scene totals: 164 fish / 14 index categories, 92 rods, 43 tools, 40 harbor/city vessels + 8 expedition hulls, 73 NPCs, 21 harbor buildings + 12 city buildings + 4 frontier outposts, 8 free huts, 27 fishing platforms, 14 farm beds, 21 resource nodes, 18 giants, 1 pirate patrol.
- **Known Bugs:** 0 open bugs. Fishing-spot handler overrides, shipyard tab routing, boat attachment, catch-hook overwrites, ferry state preservation and the Sable direct-shop flow remain covered by regression tests.
- **Overall Project Status:** **EXPANSION 8.0 EXPEDITION SEASON COMPLETE**
- **Not Included:** authoritative multiplayer/server play, paid gacha or real-money currency, recorded voice/lip-sync, production high-poly NPC art, audio assets beyond procedural cues, and a full 200-species catalog.
- **Next Backlog:** multiplayer/social systems, seasonal live events, additional giant species, higher-fidelity NPC art/voice, farming/gathering quests and broader balance/performance tuning on target hardware.
