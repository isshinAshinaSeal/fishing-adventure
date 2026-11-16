# Test Plan — 3D Open-World Fishing Adventure

## Master Acceptance Criteria & Test Matrix (Phases 1–14)

### Phase 1: Foundation
| Test ID | Category | Description | Expected Result | Automated Test File | Status |
|---|---|---|---|---|---|
| TC-01 | Movement | Move in 8 cardinal and diagonal directions | Character position moves accurately according to camera forward/right vectors | `tests/player.test.js` | **PASS** |
| TC-02 | Movement | Walk vs Sprint velocity | Sprinting increases velocity to configured `runSpeed` (9.0 m/s vs 4.8 m/s) | `tests/player.test.js` | **PASS** |
| TC-03 | Movement | Jump physics and gravity | Spacebar applies impulse; gravity pulls down; player lands grounded | `tests/player.test.js` | **PASS** |
| TC-04 | Collision | Terrain collision & void prevention | Character elevation never sinks below `sampleHeight(x, z)` | `tests/terrain.test.js` | **PASS** |
| TC-05 | Camera | Camera smooth rotation | Yaw and pitch respond to mouse delta; pitch clamps to [-40°, 71°] | `tests/camera.test.js` | **PASS** |
| TC-06 | Camera | Camera distance & collision damping | Camera does not penetrate terrain; pulls in when obstructed | `tests/camera.test.js` | **PASS** |
| TC-07 | Lifecycle | Scene restart & reset | Calling `restart()` resets player position, resets velocities, preserves system stability | `tests/gameLoop.test.js` | **PASS** |
| TC-08 | Build | Zero compilation / import errors | All ES modules resolve cleanly with 0 syntax or import errors | `tests/gameLoop.test.js` | **PASS** |

### Phase 2: Interaction System
| Test ID | Category | Description | Expected Result | Automated Test File | Status |
|---|---|---|---|---|---|
| TC-09 | Interaction | NPC Approach & Proximity Detection | Interaction prompt appears when player is within configured range (3.2m) | `tests/interaction.test.js` | **PASS** |
| TC-10 | Interaction | Prompt Dismissal on Exit | Prompt disappears immediately when player moves beyond interaction range | `tests/interaction.test.js` | **PASS** |
| TC-11 | Interaction | NPC Dialogue Execution | Pressing interaction key (E) invokes `onInteract` and opens dialogue modal | `tests/interaction.test.js` | **PASS** |
| TC-12 | Interaction | Accidental Multi-Trigger Debounce | Repeated/spammed interaction inputs trigger exactly once within debounce window | `tests/interaction.test.js` | **PASS** |
| TC-13 | Interaction | Ineligible / Disabled Objects | Inactive interactables (`enabled = false`) do not display prompt or trigger | `tests/interaction.test.js` | **PASS** |
| TC-14 | Interaction | Dialogue Page Advance & Close | Dialogue advances sequentially and closes cleanly upon reaching final line | `tests/interaction.test.js` | **PASS** |

### Phase 3: Fishing System
| Test ID | Category | Description | Expected Result | Automated Test File | Status |
|---|---|---|---|---|---|
| TC-15 | Equipment | Fishing Rod Equip / Unequip | Player toggles rod equipment state and attaches 3D rod mesh to hand | `tests/fishing.test.js` | **PASS** |
| TC-16 | Casting | Water Proximity Casting | Player casts fishing line and bobber into water from valid pier/shore spot | `tests/fishing.test.js` | **PASS** |
| TC-17 | Bites | Dynamic Bite Timing & Alert | Fish bite occurs after wait duration, bobber splashes, and alert triggers | `tests/fishing.test.js` | **PASS** |
| TC-18 | Reeling | Hook Strike & Tension Minigame | Striking on bite enters reeling; keeping tension in sweet spot catches fish | `tests/fishing.test.js` | **PASS** |
| TC-19 | Validation | Location & Equip Validation | Casting without rod or far from water is strictly rejected | `tests/fishing.test.js` | **PASS** |
| TC-20 | Concurrency | Single Fishing Action Guard | Starting a cast while already fishing or reeling is blocked | `tests/fishing.test.js` | **PASS** |
| TC-21 | Escapes | Premature Strike & Line Snap | Striking before bite or overtensioning snaps line and fish escapes | `tests/fishing.test.js` | **PASS** |

### Phase 4: Fish & Inventory
| Test ID | Category | Description | Expected Result | Automated Test File | Status |
|---|---|---|---|---|---|
| TC-22 | Inventory | Add Caught Fish | Correct species item added to bucket after successful catch | `tests/inventory.test.js` | **PASS** |
| TC-23 | Inventory | Capacity Enforcement | Fish bucket strictly rejects additions once capacity ceiling is reached | `tests/inventory.test.js` | **PASS** |
| TC-24 | Inventory | Data Preservation | Weight, value, rarity, and timestamp preserved without truncation | `tests/inventory.test.js` | **PASS** |
| TC-25 | Inventory | Aggregate Metrics | Total bucket weight and total market value calculated accurately | `tests/inventory.test.js` | **PASS** |
| TC-26 | Database | Schema Consistency | All catch records match database rarity weight tables | `tests/inventory.test.js` | **PASS** |
| TC-27 | Encyclopedia | Discovery Logging | First catch logs discovery in encyclopedia with personal records | `tests/inventory.test.js` | **PASS** |
| TC-28 | Inventory | Item Removal | Individual fish removal and clear bucket operate atomically | `tests/inventory.test.js` | **PASS** |

### Phase 5: Economy & Merchants
| Test ID | Category | Description | Expected Result | Automated Test File | Status |
|---|---|---|---|---|---|
| TC-29 | Economy | Sell Individual Fish | Selling removes fish from bucket and credits correct coin amount | `tests/economy.test.js` | **PASS** |
| TC-30 | Security | Anti-Duplication | Re-selling previously sold fish instanceId is strictly blocked | `tests/economy.test.js` | **PASS** |
| TC-31 | Economy | Sell All Fish | Computes aggregate total, empties bucket, and credits economy | `tests/economy.test.js` | **PASS** |
| TC-32 | Shop | Affordability Check | Players cannot purchase upgrades exceeding current coin balance | `tests/economy.test.js` | **PASS** |
| TC-33 | Upgrades | Rod Upgrades | Applying rod upgrade updates level, reelSpeed, and luckBonus | `tests/economy.test.js` | **PASS** |
| TC-34 | Upgrades | Bucket Upgrades | Bucket upgrades expand player fish carrying capacity | `tests/economy.test.js` | **PASS** |
| TC-35 | Shop | Inventory Listing | Merchant shop shows owned vs unowned status dynamically | `tests/economy.test.js` | **PASS** |

### Phase 6: Property & House
| Test ID | Category | Description | Expected Result | Automated Test File | Status |
|---|---|---|---|---|---|
| TC-36 | Real Estate | Unowned Plot Prompt | Unowned plot shows purchase prompt with exact cost | `tests/property.test.js` | **PASS** |
| TC-37 | Real Estate | Insufficient Coins | Plot purchase rejected when player cannot afford plot cost | `tests/property.test.js` | **PASS** |
| TC-38 | Real Estate | Ownership Transfer | Plot purchase deducts coins and marks plot owned | `tests/property.test.js` | **PASS** |
| TC-39 | Real Estate | 3D Visual Transition | For Sale sign disappears and 3D cottage structure appears | `tests/property.test.js` | **PASS** |
| TC-40 | Real Estate | Interior / Exterior | Player enters and exits house, safely repositioning player | `tests/property.test.js` | **PASS** |
| TC-41 | Real Estate | Non-Owner Gate | Non-owners cannot enter an unowned house | `tests/property.test.js` | **PASS** |
| TC-42 | Persistence | Plot Serialization | Plot ownership serializes and restores accurately | `tests/property.test.js` | **PASS** |

### Phase 7: Fish Storage & Private Pond
| Test ID | Category | Description | Expected Result | Automated Test File | Status |
|---|---|---|---|---|---|
| TC-43 | Storage | Transfer to Chest | Fish transferred from bucket into 50-slot storage chest | `tests/storage.test.js` | **PASS** |
| TC-44 | Storage | Withdraw to Bucket | Fish moved from storage back to bucket, respecting bucket capacity | `tests/storage.test.js` | **PASS** |
| TC-45 | Pond | Live Fish Placement | Fish placed into private pond stone basin | `tests/storage.test.js` | **PASS** |
| TC-46 | Pond | Capacity Limit | Private pond strictly enforces 8-fish capacity limit | `tests/storage.test.js` | **PASS** |
| TC-47 | Pond | Boundary Clamping | Swimming fish orbit strictly bounded within pond radius | `tests/storage.test.js` | **PASS** |

### Phase 8: Passive Income
| Test ID | Category | Description | Expected Result | Automated Test File | Status |
|---|---|---|---|---|---|
| TC-48 | Income | Real-Time Accrual | Pond fish generate money over time based on species value | `tests/passiveIncome.test.js` | **PASS** |
| TC-49 | Income | Balance Collection | Collecting earnings transfers coins to economy balance | `tests/passiveIncome.test.js` | **PASS** |
| TC-50 | Income | Offline Generation | Offline time produces income up to maximum cap ceiling | `tests/passiveIncome.test.js` | **PASS** |
| TC-51 | Income | Empty Pond Zero Rate | Empty pond produces zero passive coins | `tests/passiveIncome.test.js` | **PASS** |
| TC-52 | Income | Value & Rarity Scaling | Generation rate scales with fish rarity and market value | `tests/passiveIncome.test.js` | **PASS** |

### Phase 9: Boat System
| Test ID | Category | Description | Expected Result | Automated Test File | Status |
|---|---|---|---|---|---|
| TC-53 | Boats | Boat Purchase | Player buys boat from dealership with sufficient funds | `tests/boat.test.js` | **PASS** |
| TC-54 | Boats | Unowned Guard | Unowned boat cannot be boarded; purchase fails if unaffordable | `tests/boat.test.js` | **PASS** |
| TC-55 | Boats | Mount & Dismount | Player boards boat at dock mooring and dismounts cleanly | `tests/boat.test.js` | **PASS** |
| TC-56 | Boats | Water Physics | Mounted boat navigates across water with throttle and steering | `tests/boat.test.js` | **PASS** |
| TC-57 | Boats | Shoreline Collision | Boat forward motion stops at shoreline; cannot drive on land | `tests/boat.test.js` | **PASS** |
| TC-58 | Boats | Safe Exit Landing | Dismounting safely deposits player at dock land anchor | `tests/boat.test.js` | **PASS** |

### Phase 10: Sharks & Wildlife AI
| Test ID | Category | Description | Expected Result | Automated Test File | Status |
|---|---|---|---|---|---|
| TC-59 | Wildlife | Ocean Spawning | Sharks and fauna spawn in outer ocean at submerged depths | `tests/wildlife.test.js` | **PASS** |
| TC-60 | Wildlife | Patrol State | Shark follows orbital waypoints in absence of nearby players | `tests/wildlife.test.js` | **PASS** |
| TC-61 | Wildlife | Curious Observation | Shark enters CURIOUS state when player/boat enters detection radius | `tests/wildlife.test.js` | **PASS** |
| TC-62 | Wildlife | Flee Burst Reaction | Shark enters FLEE state with burst speed when approached too closely | `tests/wildlife.test.js` | **PASS** |
| TC-63 | Wildlife | Depth Boundaries | Shark elevation strictly remains between waterLevel and seabed | `tests/wildlife.test.js` | **PASS** |

### Phase 11: Open-World Biomes & Zones
| Test ID | Category | Description | Expected Result | Automated Test File | Status |
|---|---|---|---|---|---|
| TC-64 | Biomes | Zone Detection | ZoneManager identifies correct zone for given coordinates | `tests/zones.test.js` | **PASS** |
| TC-65 | Biomes | First-Time Discovery | Entering new zone triggers discovery event and records history | `tests/zones.test.js` | **PASS** |
| TC-66 | Biomes | Idempotent Discovery | Re-entering discovered zone does not duplicate discovery | `tests/zones.test.js` | **PASS** |
| TC-67 | Biomes | Exploration Metric | Exploration percentage calculates accurately across total zones | `tests/zones.test.js` | **PASS** |
| TC-68 | Biomes | Zone Habitat Pool | Fish caught in specific zone belong to that zone's habitat pool | `tests/zones.test.js` | **PASS** |

### Phase 12: Quests & Progression
| Test ID | Category | Description | Expected Result | Automated Test File | Status |
|---|---|---|---|---|---|
| TC-69 | Progression | Catch XP Award | Catching fish awards XP and increments progression | `tests/progression.test.js` | **PASS** |
| TC-70 | Progression | Level Up Threshold | Crossing XP threshold triggers level up and scales requirement | `tests/progression.test.js` | **PASS** |
| TC-71 | Quests | Objective Tracking | Quests track progress for species, weight, and zone discoveries | `tests/progression.test.js` | **PASS** |
| TC-72 | Quests | Reward Turn-In | Claiming completed quest awards coins + XP and marks claimed | `tests/progression.test.js` | **PASS** |
| TC-73 | Quests | Double-Claim Guard | Incomplete quests cannot be claimed; quests cannot be claimed twice | `tests/progression.test.js` | **PASS** |

### Phase 13: Save & Load Persistence
| Test ID | Category | Description | Expected Result | Automated Test File | Status |
|---|---|---|---|---|---|
| TC-74 | Persistence | Schema Validation | Save creates complete schema-valid payload with version & timestamp | `tests/saveLoad.test.js` | **PASS** |
| TC-75 | Persistence | Player State Restore | Loading restores player coins, position, and equipment exactly | `tests/saveLoad.test.js` | **PASS** |
| TC-76 | Persistence | Containers Restore | Loading restores bucket, storage chest, and pond fish with metadata | `tests/saveLoad.test.js` | **PASS** |
| TC-77 | Persistence | World State Restore | Loading restores owned plots, boats, zones, level, and quests | `tests/saveLoad.test.js` | **PASS** |
| TC-78 | Persistence | Graceful Error Handling | Missing or corrupt save data handles gracefully without crashing | `tests/saveLoad.test.js` | **PASS** |

### Phase 14: Polish & Optimization
| Test ID | Category | Description | Expected Result | Automated Test File | Status |
|---|---|---|---|---|---|
| TC-79 | Audio | Sound Synthesis | SoundManager synthesizes all procedural sound cues without error | `tests/polish.test.js` | **PASS** |
| TC-80 | Audio | Volume & Muting | Master volume adjustment and mute toggles function correctly | `tests/polish.test.js` | **PASS** |
| TC-81 | Effects | Particle Pooling | ParticleManager spawns splashes and recycles expired particles | `tests/polish.test.js` | **PASS** |
| TC-82 | Optimization | 1,000 Frame Stress Test | 1,000 engine frames execute under budget with 0 NaN or memory leaks | `tests/polish.test.js` | **PASS** |

### Expansion 7.0: Frontier Archipelago
| Test ID | Category | Description | Expected Result | Automated Test File | Status |
|---|---|---|---|---|---|
| E7-01 | World | Frontier Terrain & Zones | Four remote islands rise above water, clamp to terrain and own distinct zones | `tests/expansion7.test.js` | **PASS** |
| E7-02 | Content | Outposts, Residents & Platforms | 4 outposts, 4 residents, 8 ferries and 8 fishing platforms are registered interactables | `tests/expansion7.test.js` | **PASS** |
| E7-03 | Catalog | Frontier Species Merge | 24 frontier fish extend the index to 164 while the classic catalog stays at 140 | `tests/expansion7.test.js` | **PASS** |
| E7-04 | Travel | Expedition Ferries | Every frontier island is reachable, discovered and visited without losing coins/XP | `tests/expansion7.test.js` | **PASS** |
| E7-05 | Fishing | Frontier Cast & Catch Loop | Cast, wait, bite, strike and reel land a frontier fish on all eight platforms | `tests/expansion7.test.js` | **PASS** |
| E7-06 | Persistence | Frontier Save & Habitat Routing | Visited islands/catches survive load; frontier species route to their island | `tests/expansion7.test.js` | **PASS** |

### Expansion 8.0: Expedition Season, Gems & Story
| Test ID | Category | Description | Expected Result | Automated Test File | Status |
|---|---|---|---|---|---|
| E8-01 | Catalog | Merged Content Counts | New rods/tools/boats merge in while every legacy exact count stays intact | `tests/expansion8.test.js` | **PASS** |
| E8-02 | Economy | Starter Purse & Gems | New games start at 1,000 coins / 0 gems; gem balance is isolated from coins | `tests/expansion8.test.js` | **PASS** |
| E8-03 | World | Secret Chest | The tackle-hut chest pays 20,000 coins and 2 gems exactly once and persists | `tests/expansion8.test.js` | **PASS** |
| E8-04 | Story | Chapter Unlock & Rewards | Live metrics unlock chapters, rewards pay once, read state round-trips | `tests/expansion8.test.js` | **PASS** |
| E8-05 | World | Pirate Patrol | Exactly one lowest-tier pirate ship circles the island at a fixed radius | `tests/expansion8.test.js` | **PASS** |
| E8-06 | Boat | Real Helm Physics | Rudder eases, speed scales authority, turns create slip, boost drains reserve | `tests/expansion8.test.js` | **PASS** |
| E8-07 | Fishing | Cast Distance & Hooksets | Longer rods cast farther; perfect/clean/late hooksets change reel progress | `tests/expansion8.test.js` | **PASS** |
| E8-08 | Economy | Gem Exchange | Gems buy exclusive rewards; gem-locked tools reject coin purchases | `tests/expansion8.test.js` | **PASS** |
| E8-09 | NPC | Dialogue Choices | NPCs are dialogue-first and their choices open shops, services and gifts | `tests/expansion8.test.js` | **PASS** |
| E8-10 | Fleet | Expedition Boats | Coin and gem hulls spawn owned at their home-island mooring | `tests/expansion8.test.js` | **PASS** |
| E8-11 | Persistence | Expansion 8.0 Save/Load | Story, chest and purse survive a full save/load round-trip | `tests/expansion8.test.js` | **PASS** |
| E8-12 | Lifecycle | Restart Reset | Restart restores the starter purse, re-seals the chest and clears story progress | `tests/expansion8.test.js` | **PASS** |

---

### Master Execution Summary
- **Total Test Suites:** 32
- **Total Tests Executed:** 175
- **Passed:** 175 (100% Pass Rate)
- **Failed:** 0
- **Duration:** ~5s
- **Smoke Checks:** `smoke-expansion6.mjs` 36/36, `smoke-expansion7.mjs` 53/53, `smoke-expansion8.mjs` 44/44
