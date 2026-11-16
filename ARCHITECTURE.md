# Architecture Document — 3D Open-World Fishing Adventure

## 1. System Overview
The project is built on a clean, decoupled, component-oriented architecture using ES2022 JavaScript and Three.js. It runs natively in any modern web browser and supports full headless automated unit testing in Node.js.

```
                    ┌────────────────────────┐
                    │     index.html / UI    │
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │      src/config.js     │◄──── Centralized Tuning
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │    src/core/Game.js    │◄──── Main Game Loop
                    └─┬─────────┬──────────┬─┘
                      │         │          │
         ┌────────────┘         │          └────────────┐
         ▼                      ▼                       ▼
┌──────────────────┐ ┌────────────────────┐ ┌──────────────────────┐
│  InputManager.js │ │ PlayerController.js│ │ ThirdPersonCamera.js │
└──────────────────┘ └──────────┬─────────┘ └──────────────────────┘
                                │
                     ┌──────────▼──────────┐
                     │ TerrainCollider.js  │
                     └──────────┬──────────┘
                                │
                     ┌──────────▼──────────┐
                     │   Environment.js    │
                     └─────────────────────┘
```

## 2. Key Modules & Classes

### `src/config.js`
- Centralized configuration module for all gameplay constants:
  - Movement: `walkSpeed`, `runSpeed`, `acceleration`, `friction`, `jumpForce`, `gravity`.
  - Camera: `defaultDistance`, `minDistance`, `maxDistance`, `fov`, `lerpSpeed`, `pitchLimits`.
  - World: `worldSize`, `waterLevel`, `terrainResolution`, `dayNightSpeed`.

### `src/core/Game.js`
- Drives the main game loop (`update` & `render`).
- Manages Three.js `Scene`, `PerspectiveCamera`, and `WebGLRenderer`.
- Handles window resizing, animation frame tick with delta time clamping, and restart/reset logic.

### `src/core/InputManager.js`
- Action-oriented input mapping.
- Maps keys (`WASD`, Arrow keys, `Shift`, `Space`, `E`, `Esc`) and mouse look (`PointerLock` / delta movements).
- Exposes normalized input vectors `(moveX, moveZ)`, `isSprinting`, `isJumping`, `interactJustPressed`.

### `src/world/TerrainCollider.js`
- High-performance analytical heightmap & raycaster.
- Provides `sampleHeight(x, z)` and `sampleNormal(x, z)` based on continuous multi-frequency noise & island geometry.
- Enforces ground clamping so the player **never falls through the terrain or drops into a void**.

### `src/world/Environment.js`
- Generates the 3D visual world:
  - Low-poly terrain mesh with slope-based vertex coloring (Sand, Grass, Rock, Snow).
  - Water plane at configured water level with translucent shader & sine-wave ripples.
  - Directional sunlight with soft shadows and hemisphere ambient skylight.
  - Atmospheric fog and horizon dome.

### `src/entities/PlayerController.js`
- Kinematic character controller with smooth acceleration, rotation toward movement direction, variable sprint, jump physics, and terrain adherence.
- Manages stylized character 3D avatar (torso, head, limbs, fishing hat).

### `src/camera/ThirdPersonCamera.js`
- Smooth orbital camera following the player target.
- Handles mouse drag / pointer lock yaw & pitch rotation.
- Features collision prediction: if an obstacle or terrain is between the camera and player, the camera smoothly pulls inward to avoid clipping.

## 3. Ocean Odyssey Expansion Modules

### `src/fishing/FishDatabase.js`
- Authoritative expanded catalog (140 species, 10 rarity tiers, 14 categories).
- `roll(habitat, { timeOfDay, bait, luck, difficultyMul })` weights draws by rarity, bait preference, and time activity.
- Legacy `getAllSpecies()`, `generateCatch()`, and `createCatchRecord()` remain compatible.

### `src/fishing/FishIndex.js`
- Read model over the inventory encyclopedia: discovery %, category progress, records, search/filter/sort, and habitat routing.

### `src/world/WorldClock.js`
- Shared 24-hour cycle exposing `getPeriod()` (dawn/day/dusk/night) and light level; consumed by fishing and HUD.

### `src/mount/Mount.js` & `src/mount/MountManager.js`
- Mount entity: procedural quadruped mesh, rider sync, camera-relative movement, stamina/sprint, jumping, terrain affinity, XP levels.
- Manager: ownership, unlock transactions, summon/dismount lifecycle, level persistence.

### `src/transport/FastTravelManager.js` & `TeleportStation.js`
- Destination registry with zone/proximity unlock rules, cooldown, favourites, terrain-clamped travel, and species-habitat routing.
- TeleportStation is an `Interactable` gate that opens the travel map.

### `src/boat/BoatManager.js`
- 30-vessel harbor/pirate catalogue (21 harbor + 9 corsair) plus a separate 10-vessel Aurelia city catalogue. Adds the ship upgrade tree, effective stat calculation, and applies upgrades to the active vessel. `Boat` exposes storage, hull health, radar/sonar, and deck-fishing capability. `onSpawn` lets `Game` attach purchased or loaded vessels to the scene and register them as boardable interactables.

## 4. Mega Expansion 2.0 Modules

### `src/expansion/content.js`
- Single data source for the expansion: 76 rods across 19 families, 21 service buildings, 20 named NPCs and personal requests, 18 giant creatures, four world bosses, 10 cannons, seven ammunition types, seven backpacks, 17 consumables, 35 materials (including 12 farm produce), 18 recipes with single- or multi-material ingredient maps, 12 houses, 24 furniture pieces, 31 fishing tools, eight free built-in island huts, and 64 cosmetics across eight banners.

### `src/world/islands.js` + `TerrainCollider.js`
- Seven compact outer isles (Verdant Crown, Frostfall, Ember, Sunspire Cay, Mistveil Cay, Glassice Cay and Cinder Cay) share one height sampler used by terrain, props, zones and travel. Compact radii keep fishing trips short.
- `frontierIslands.js` adds four remote Expansion 7.0 islands with their own sampler, zones, arrival/dock points and eight fishing platforms. `TerrainCollider` merges frontier heights and uses bounding-box rejection before distance math.
- The environment adds billboard-style waypoint labels above all seven outer isles plus Driftwood Isle, Smuggler's Atoll and the four frontier islands.

### `src/inventory/BackpackManager.js`
- Slot- and weight-based supply inventory with stack limits, backpack upgrades, live overload status, and movement multipliers. `CargoManager` adds per-vessel item/fish storage with a shared capacity.

### `src/fishing/RodManager.js`
- 76-rod collection (19 families × 4 marks), purchase/equip transactions, per-rod XP and 30-level progression, skill ranks, and effective stat/bonus aggregation applied to `FishingSystem`.

### `src/consumables/ConsumableManager.js`
- Timed buffs (capped at four), instant healing/stamina/bait effects, per-item cooldowns, and cooking recipes that consume fish, single materials, or a validated multi-material ingredient map with rare-fish confirmation. Failed multi-material recipes never consume partial ingredients.

### `src/housing/HousingManager.js`
- Seven owned houses with purchase, enter/exit, five upgrade levels, furniture placement visuals, per-house fish/item storage, aquarium stocking, trophies, home teleport point, and private dock unlock.

### `src/services/ServiceManager.js` + `ServiceBuilding.js`
- 21 physical, interactable harbor buildings (no decorative shells), plus eight free built-in island huts with resident NPCs. Guild ranks, research samples/milestones, auction sales, faction reputation, daily requests, and service routing.

### `src/npc/ExpansionNPCManager.js`
- Named NPC models, service dialogue, friendship levels, gifts, day/night schedules, and one persisted personal request per NPC. Requests progress from catches, boss defeats, or furniture placement and grant coins/XP/friendship.

### `src/ocean/GiantFishManager.js` + `GiantCreature.js`
- Eighteen roaming giant creatures with depth bands, patrol/migration behavior, radar direction/distance reporting, tracking, discoveries, and boss linkage.

### `src/fishing/FishingToolManager.js`
- Twelve permanent tools with purchase/equip validation, passive modifiers (luck, line strength, quality, wait reduction, multi-catch, bait), deployable traps with timed collection, and save serialization.
- Fishing spots always accept interaction, auto-equip the rod on a cast, and surface the real failure reason through the HUD.

### `src/combat/CannonManager.js` + `BossManager.js`
- 10 cannons, seven ammo types, assisted/manual aiming, reload and accuracy, five upgrade branches, boss phase cycles, vulnerability windows, hull damage, capture ammo, rewards, titles, trophies, and cosmetic drops.

### `src/cosmetics/CosmeticManager.js`
- Coins-only cosmetic gacha with published rarity odds, banner pools, explicit previews, ten-draw pity, duplicate-to-token conversion, token redemption, and per-slot wardrobe equipping that updates player/ship/rod/mount visuals.

### `src/ui/ExpansionUI.js`
- 18-tab command center wired directly to managers, context-sensitive NPC service header and quest claim, live carry/survival HUD, boss HUD, quick-bar shortcuts, and cannon controls. Tabs include Backpack, 76-rod collection, 31 fishing tools, consumables, multi-material crafting, Farming, Gathering, City Marina, Frontier, housing, guild, auction, aquarium, wardrobe, gacha, cannons, research, radar and crew. No placeholder actions.

## 5. Expansion 4.0 Modules

### `src/fishing/FishDatabase.js` + `FishIndex.js`
- 140 classic species across 14 categories and 10 rarity tiers, including the 12-species Pirate Waters and 12-species Coral Reef collections. `FullSpeciesCatalog` merges 24 frontier fish for a 164-entry discovery index while `ExpandedSpecies` keeps the exact 140-entry contract.
- Fish Index 3.0 adds base-value sorting, catalog-value stats, bait search, habitat/rarity progress, milestones and travel routing; frontier-only species route to their island via the habitat fallback.
- Lookups use an O(1) `SPECIES_BY_ID` map and per-catalog habitat pools are cached, so strike/bonus rolls never re-filter the catalog.

### `src/boat/PirateDock.js`
- A physical Corsair Dock landmark with a timber deck, skull flag, vendor counter, chests, lanterns and a readable signboard. The dock is an interactable and Quartermaster Sable stands beside it.
- The pirate lineup starts at 50 coins / 10 m/s, then 150 / 12 and 400 / 15, with four heavier corsair ships above that. Harbor dealerships and the Pirate Dock filter their catalogs independently.

### `src/customization/CharacterCustomization.js`
- Six skin tones plus eight shirt, six trouser, six hat and six hat-band palettes. Eight directly purchasable outfits (free starter through 5,000 coins) are owned permanently and equip onto the live player mesh.
- Appearance and owned outfits persist in the player payload and the `expansion2.customization` save section, with a small local profile for the start lobby.

### `index.html` — Start Lobby
- Full-screen start screen with Start, Credits, Skin Shop and Character Customization. The world renders behind the lobby while player input is locked. The HUD includes a Main Menu button to return.
- The Skin Shop and Character Studio render from the live managers, update the coins badge, preview appearance swatches, and apply changes without a reload.

## 6. Expansion 5.0 Modules

### `src/entities/AvatarFactory.js`
- Deterministic, role-seeded avatar detail: face shape, ears, nose, eyes, mouth, hair, hats, belts and modelled backpacks. Both NPCs and the player use the factory, and appearance fields round-trip through player serialization.
- Harbour, pirate and expedition ships in `BoatDefinitions` gain multi-part hulls, cabins, gunwales and sail rigs; `Boat` keeps the shared physics/storage/deck-fishing contract.

## 7. Expansion 6.0 Modules

### `src/world/cityIsland.js` + `CityEnvironment.js` + `cityContent.js`
- `cityIsland.js` is the single analytical height sampler for Aurelia Heights (`aurelia_city`), a radius-112 plateau at `(-430, 430)`; `TerrainCollider` merges it with the starter isle, atoll and seven outer isles.
- `CityEnvironment` builds 16 towers (tallest 150 m), the avenue grid, plaza/fountain, lamps, greenery, pier and waterfront labels.
- `cityContent.js` holds 12 service buildings, 12 named NPC definitions, 18 civilian routes, the 10-vessel city catalogue, two city fishing spots, two ferry points and the city boat mooring. City buildings and NPCs reuse the standard `ServiceBuilding`, `NPC` and `CivilianNPC` contracts, while ferries use the lightweight `FerryPoint` interactable.

### `src/transport/FerryPoint.js`
- Interactable sign/pier that calls back into `Game.travelToCity()`, `Game.travelToHarbor()` or `Game.travelToFrontier()`. Travel dismounts mounts/boats, terrain-clamps the landing, preserves inventory/economy/progression through `PlayerController.teleport()`, resets the camera and interaction state, and reports the destination.

### `src/farming/crops.js` + `FarmPlot.js` + `FarmingManager.js`
- Content: 12 crops with seed cost, grow time, yield range, produce item, XP and coin reward; 8 watering cans/hoes with growth/yield bonuses.
- Runtime: 14 plots (6 harbor, 8 city rooftop). `FarmPlot` owns crop/growth/water state and visuals; `FarmingManager` owns transactions, growth multipliers, harvest payout, tool ownership, stats and serialization. Harvests add produce through the shared backpack and award XP/coins through the player context.

### `src/gathering/resources.js` + `ResourceNode.js` + `GatheringManager.js`
- Content: 10 axe/pickaxe tiers, 11 tree/ore templates with required tier, HP, respawn, XP and weighted drops, plus 21 fixed placements (14 harbor, 7 city).
- Runtime: `ResourceNode` builds tree/rock meshes, tracks HP, depletion and respawn, and exposes prompts; `GatheringManager` validates tool tier, applies strike power, rolls drops into the backpack, awards XP, accumulates lifetime stats and persists node/tool state.

### `src/core/Game.js` integration
- `_initCityExpansion()` spawns city buildings, named NPCs, civilians, farm beds, resource nodes, ferries and city fishing spots, then registers everything with `InteractionManager`.
- `_attachBoat()` is the `BoatManager.onSpawn` hook: it adds the vessel to the scene, widens interaction range and registers an E-to-board handler. `purchaseCityBoat()` uses the city mooring/anchor; `travelToCity()`/`travelToHarbor()` wrap `_ferryTravel()`.
- `update()` advances farm growth and gathering respawns; `restart()` resets both managers; `getDiagnostics()` exposes plot/node/city counts.
- `SaveManager` adds an `expansion6` section containing farm plots/tools/crops/stats and gathering nodes/tools/equipment/stats.

## 8. Expansion 7.0 Modules

### `src/world/frontierIslands.js`
- Single source of truth for Tempest Spire, Aurora Isle, Glasswind Cay and Serpent Reef: centres, radii, peaks, palettes, zone ids, arrival/dock points and two fishing platforms per island.
- `sampleFrontierIslandHeight(x, z)` returns the highest frontier surface with bounding-box rejection; `TerrainCollider.sampleHeight()` merges it with the starter isle, atoll, seven outer isles and Aurelia Heights.

### `src/expansion/frontierContent.js`
- Four service outposts and four resident NPC definitions (rodwarden, potion keeper, artisan, market warden), eight frontier fishing-spot definitions with `catalog: 'frontier'`, and eight expedition ferries (outbound and return per island).
- Kept separate from harbor and city catalogs so Expansion 3.0/6.0 exact-count tests remain valid.

### `src/fishing/frontierSpecies.js`
- 24 species, six per island, across the Stormfront, Aurora Deep, Glasswind and Serpent Reef categories. Includes Common through Legendary, plus Secret, Mythical and Abyssal apex fish.
- All entries carry `frontier: true`; catch records preserve the flag so the save and diagnostics can track frontier progress.

### `src/fishing/FishingSystem.js` + `FishingSpot.js`
- A fishing spot can declare `catalog: 'frontier'`; `_activeCatalog()` resolves it to `FishDatabase.getFrontierSpecies()`. The same override is applied to normal strikes, direct catches and tool bonus catches.
- Ripple ring geometries are shared module-level buffers; per-spot materials still animate independently.

### `src/core/Game.js` integration
- `_initFrontierExpansion()` creates outposts, residents, platforms and ferries in their own arrays (`frontierBuildings`, `frontierNpcs`, `frontierFishingSpots`, `frontierFerries`) and registers them all with `InteractionManager`.
- `travelToFrontier(islandId)` sails via the state-preserving `_ferryTravel()`, marks the island visited and discovers its zone. `travelToFishHabitat()` falls back to the matching frontier island for species outside the classic gate network.
- `update()` advances frontier buildings, NPCs, ripple markers and ferries. `getDiagnostics()` reports visited islands, outpost/resident/platform counts, frontier catches and the 24-species total.
- `SaveManager` adds `expansion7.frontier` with visited island ids and catch totals; `PlayerController.teleport()` preserves coins, inventory, XP and storage across ferries.

## 9. Expansion 8.0 Modules

### `src/fishing/expeditionRods.js`
- 16 expedition rods across eight families (Tidewatch, Harpoonsong, Glasswind, Auroralight, Stormforge, Serpentcoil, Wayfarer, Worldheart), levels 1–2. `RodManager.catalog` merges them with the original 76 rods for 92 live rods; `RodDefinitions.length` stays exactly 76.
- Every entry carries real `stats` (reel, luck, line, control, cast distance 58–112) plus a `bonus` profile (`habitat`, `rarity`, `largeFish`, `giant`, `ancient`, `celestial`, `legendary`) consumed by `FishingSystem`.

### `src/fishing/expeditionTools.js`
- 12 expedition tools, two gem-locked (`tool_gem_finder`, `tool_prism_net`). `FishingToolManager.catalog` merges them with the original 31 tools for 43 live tools; `FishingToolDefinitions.length` stays exactly 31.
- `FishingToolManager.buyTool()` checks `gemCost` first and spends gems through `EconomyManager.spendGems()`, so coins can never buy gem-locked gear.

### `src/boat/expeditionBoats.js` + `src/boat/BoatManager.js`
- Eight frontier hulls delivered to named island moorings. `BoatManager` keeps the 30-vessel harbor/pirate catalog and the 10-vessel city catalog untouched, adding `expeditionCatalog`, `getExpeditionCatalog()`, `getBoatDef()` and mooring metadata.
- `Game.purchaseExpeditionBoat()` wraps `purchaseBoat()` with the home-island position/anchor.

### `src/boat/Boat.js` — real helm
- Rudder angle eases toward A/D input (`rudderResponse`), steering authority scales with speed and flips in reverse, the hull carries lateral slip through turns, Shift boost drains a rechargeable reserve, and shoreline contact zeroes speed and increments `collisionCount`. `getSteeringState()` exposes heading, rudder, slip, boost and collision telemetry.

### `src/progression/StoryJournal.js`
- Ten chapters keyed to live campaign metrics (catches, species, zones, islands, boats, rods, tools, bosses, quests, furniture). `snapshot(game)` rebuilds metrics from managers, `update(game)` unlocks newly completed chapters and grants coins/gems/XP exactly once, `markRead()` and `serialize()/deserialize()` persist the book.
- `getObjectiveLines(limit)` feeds the top-left HUD card.

### `src/world/SecretChest.js`
- One-time interactable chest at `(-12.4, 6.4)` inside the tackle hut, paying 20,000 coins and 2 gems. `opened` serializes under `expansion8` and resets with the player purse on a full restart.

### `src/boat/PiratePatrol.js`
- Exactly one ambient pirate ship — the lowest-tier `boat_pirate_jolly` (tier 19) — circles the starter island at `islandRadius + 46 = 326 m`. It is scenery: never dockable, never purchasable, position/yaw derived from the orbital angle.

### `src/economy/gemShop.js` + `EconomyManager`
- Eight Gem Exchange offers (coin pouches, XP chart, two gem tools, the Worldheart rod and two celestial hulls). Gems live alongside coins with `getGems`, `canAffordGems`, `addGems`, `spendGems`/`deductGems`, are serialized, and reset with the purse. Non-finite saved coins/gems fall back to the configured starters instead of corrupting the economy.

### `src/core/Game.js` integration
- Constructs `StoryJournal`, spawns the secret chest and `PiratePatrol`, hooks `storyJournal.update()` on a throttled tick, and keeps the patrol moving every frame.
- Adds `purchaseExpeditionBoat()`, `getGemCatalog()`, `purchaseGemOffer()`, `toggleStoryJournal()`, `closeStoryJournal()`, `markStoryRead()` and `chooseDialogue()`.
- `restart()` resets the journal, re-seals the chest, returns the patrol to its start bearing and restores the 1,000-coin / 0-gem starter purse.

### `src/ui/ObjectivesHUD.js` + `src/ui/StoryJournalUI.js` + `index.html`
- The top-left objectives card shows the next two locked chapters with live progress bars, story count and gem count, plus an "Open Story Book" button.
- The story modal lists all ten chapters with locked/unlocked/read state, progress against real metrics, one-time reward previews and a read toggle. `L` toggles it from anywhere.
- Dialogue buttons render at the end of every conversation and route through `Game.chooseDialogue()` into shops, services, quest claims and gifts.

## 10. Data Flow
1. **Input:** `InputManager` samples browser events and computes normalized movement intent relative to the camera's current horizontal bearing. Expansion hotkeys (M/T/J/Q/K/V/H/O/C/X/L) are consumed by `Game`.
2. **Kinematics:** `PlayerController` updates horizontal and vertical velocities, tests collisions with `TerrainCollider`, and clamps ground elevation. While mounted, `Mount.update()` drives the rider instead. Boat movement uses the smoothed-rudder helm in `Boat.update()`.
3. **Camera Follow:** `ThirdPersonCamera` reads player position, calculates ideal spherical offset, checks line-of-sight against `TerrainCollider`, and updates camera transform.
4. **World:** `ZoneManager` discovery feeds `FastTravelManager` unlocks, `WorldClock` feeds fish activity, and fishing spots resolve habitats for `FishDatabase.roll()`. `PiratePatrol` orbits the starter island each frame.
5. **Persistence:** `SaveManager` serializes player, property, pond, passive income, boats/upgrades, zones, quests, mounts, fast travel, clock, the `expansion2` section (backpack, cargo, rods, tools, consumables, housing, cosmetics, character customization, services, crew, cannons, giants, treasures, titles, NPC friendship/requests, and boss records), the `expansion6` section (farming and gathering), the `expansion7` section (visited frontier islands and frontier catch totals) and the `expansion8` section (story journal, secret chest, pirate patrol bearing).
6. **Rendering:** `Game.js` coordinates renderer draw calls and UI HUD updates, including the start lobby, character studio, skin shop, expansion command center (now with Expedition Fleet and Gem Exchange tabs), service district NPCs/buildings, Aurelia Heights skyline, farm beds and resource nodes, frontier archipelago, survival HUD, boss/cannon HUD, mount stable, travel map, Fish Index, objectives card, story book, and harbor, pirate, city and frontier boat/ferry routes.
