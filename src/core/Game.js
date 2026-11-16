// Game: Main engine coordinator, loop manager, and system integrator.

import * as THREE from 'three';
import { Config } from '../config.js';
import { TerrainCollider } from '../world/TerrainCollider.js';
import { Environment } from '../world/Environment.js';
import { PlayerController } from '../entities/PlayerController.js';
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera.js';
import { InputManager } from './InputManager.js';
import { InteractionManager } from '../interaction/InteractionManager.js';
import { NPC } from '../entities/NPC.js';
import { CivilianNPC } from '../entities/CivilianNPC.js';
import { FishingSystem, FishingState } from '../fishing/FishingSystem.js';
import { FishingSpot } from '../fishing/FishingSpot.js';
import { ShopManager } from '../economy/ShopManager.js';
import { PropertyManager } from '../property/PropertyManager.js';
import { PrivatePond } from '../storage/PrivatePond.js';
import { PassiveIncomeManager } from '../economy/PassiveIncomeManager.js';
import { BoatManager } from '../boat/BoatManager.js';
import { Boat } from '../boat/Boat.js';
import { PirateDock } from '../boat/PirateDock.js';
import { WildlifeManager } from '../wildlife/WildlifeManager.js';
import { ZoneManager, WorldZones } from '../world/ZoneManager.js';
import { QuestManager } from '../progression/QuestManager.js';
import { SaveManager } from './SaveManager.js';
import { CharacterCustomization } from '../customization/CharacterCustomization.js';
import { SoundManager } from '../audio/SoundManager.js';
import { ParticleManager } from '../effects/ParticleManager.js';
import { WorldClock } from '../world/WorldClock.js';
import { MountManager } from '../mount/MountManager.js';
import { FastTravelManager, TravelDestinations } from '../transport/FastTravelManager.js';
import { TeleportStation } from '../transport/TeleportStation.js';
import { FishIndex } from '../fishing/FishIndex.js';
import { BackpackManager, CargoManager } from '../inventory/BackpackManager.js';
import { RodManager } from '../fishing/RodManager.js';
import { FishingToolManager } from '../fishing/FishingToolManager.js';
import { ConsumableManager } from '../consumables/ConsumableManager.js';
import { HousingManager } from '../housing/HousingManager.js';
import { CosmeticManager } from '../cosmetics/CosmeticManager.js';
import { ExpansionNPCManager } from '../npc/ExpansionNPCManager.js';
import { ServiceManager } from '../services/ServiceManager.js';
import { ServiceBuilding } from '../services/ServiceBuilding.js';
import { CrewManager } from '../boat/CrewManager.js';
import { GiantFishManager } from '../ocean/GiantFishManager.js';
import { CannonManager } from '../combat/CannonManager.js';
import { BossManager } from '../combat/BossManager.js';
import { TreasureManager } from '../world/TreasureManager.js';
import { BuildingDefinitions, ExpansionNpcDefinitions, IslandHutDefinitions } from '../expansion/content.js';
import { CityBuildingDefinitions, CityNpcDefinitions, CityCivilianDefinitions, CityFishingSpots, CityFerryDefinitions, CityBoatMooring } from '../expansion/cityContent.js';
import { FarmingManager } from '../farming/FarmingManager.js';
import { GatheringManager } from '../gathering/GatheringManager.js';
import { CityIsland } from '../world/cityIsland.js';
import { FrontierIslands, FrontierZones } from '../world/frontierIslands.js';
import { FrontierBuildingDefinitions, FrontierNpcDefinitions, FrontierFishingSpotDefinitions, FrontierFerryDefinitions } from '../expansion/frontierContent.js';
import { FerryPoint } from '../transport/FerryPoint.js';
import { FishDatabase } from '../fishing/FishDatabase.js';
import { StoryJournal } from '../progression/StoryJournal.js';
import { SecretChest } from '../world/SecretChest.js';
import { PiratePatrol } from '../boat/PiratePatrol.js';
import { getGemOffer, GemOffers } from '../economy/gemShop.js';
import { getExpeditionMooring } from '../boat/expeditionBoats.js';

export class Game {
  constructor(canvasContainer = null) {
    this.container = canvasContainer;
    this.config = Config;

    this.isRunning = false;
    this.lastTime = 0;
    this.elapsedTime = 0;
    this.frameCount = 0;
    this.fps = 60;
    this._fpsTimer = 0;

    // Subsystems
    this.terrainCollider = new TerrainCollider(this.config.world);
    this.inputManager = new InputManager(canvasContainer);
    this.player = new PlayerController(this.config.player);
    this.interactionManager = new InteractionManager(this.config.interaction);
    this.fishingSystem = new FishingSystem(this.config.fishing);
    this.npcs = [];
    this.fishingSpots = [];
    this.shopManager = new ShopManager(this.config.economy);
    this.propertyManager = new PropertyManager(this.config.property);
    this.passiveIncomeManager = new PassiveIncomeManager(this.config.passiveIncome);
    this.boatManager = new BoatManager(this.config.boats);
    this.boatManager.cityMooring = { ...CityBoatMooring.position };
    this.boatManager.cityLandAnchor = { ...CityBoatMooring.anchor };
    this.boatManager.onSpawn = (boat) => this._attachBoat(boat);
    this.wildlifeManager = new WildlifeManager({ waterLevel: this.config.world.waterLevel });
    this.zoneManager = new ZoneManager([...WorldZones, ...FrontierZones]);
    this.questManager = new QuestManager();
    this.fishingSystem.zoneManager = this.zoneManager;
    this.fishingSystem.questManager = this.questManager;
    this.zoneManager.onZoneEnter = (zone, isNew) => {
      if (isNew && this.questManager) {
        this.questManager.notifyZoneDiscovered(zone.id);
      }
    };
    this.saveManager = new SaveManager();
    this.characterCustomization = new CharacterCustomization(this.player);
    this.characterProfileKey = 'fishing_adventure_character_v1';
    this.isLobbyOpen = false;
    this.pirateDock = null;
    this.pirateNpc = null;
    this.soundManager = new SoundManager();
    this.particleManager = new ParticleManager(this.scene);

    // Ocean Odyssey expansion systems
    this.worldClock = new WorldClock({ cycleSeconds: 600, startHour: 7.5 });
    this.mountManager = new MountManager();
    this.fastTravelManager = new FastTravelManager({ cooldownSeconds: 4 });
    this.fishIndex = new FishIndex(this.player ? this.player.inventory : null);
    this.teleportStations = [];
    this.expansionSpots = [];
    this.isMountMenuOpen = false;
    this.isTravelOpen = false;
    this.isFishIndexOpen = false;

    // Expansion 2.0 systems
    this.backpackManager = new BackpackManager();
    this.cargoManager = new CargoManager();
    this.rodManager = new RodManager(this.player);
    this.fishingToolManager = new FishingToolManager();
    this.consumableManager = new ConsumableManager();
    this.housingManager = new HousingManager(this.propertyManager);
    this.cosmeticManager = new CosmeticManager();
    this.serviceManager = new ServiceManager();
    this.crewManager = new CrewManager();
    this.giantFishManager = new GiantFishManager();
    this.cannonManager = new CannonManager();
    this.bossManager = new BossManager();
    this.treasureManager = new TreasureManager();
    this.farmingManager = new FarmingManager({
      sampleHeight: (x, z) => this.terrainCollider.sampleHeight(x, z),
    });
    this.gatheringManager = new GatheringManager({
      sampleHeight: (x, z) => this.terrainCollider.sampleHeight(x, z),
    });
    this.expansionNpcManager = new ExpansionNPCManager();
    // Expansion 8.0 progression, world secrets and ambient pirate presence.
    this.storyJournal = new StoryJournal();
    this.storyJournal.onNotification = (message) => this.notify(message);
    this.storyJournal.onUpdate = (summary) => {
      if (typeof this.onStoryUpdate === 'function') this.onStoryUpdate(summary);
    };
    this.secretChest = null;
    this.piratePatrol = null;
    this.isStoryOpen = false;
    this._storyTimer = 0;
    this.onStoryToggle = null;
    this.onStoryUpdate = null;
    this.onDialogueChoices = null;
    this.serviceBuildings = [];
    this.cityBuildings = [];
    this.cityNpcs = [];
    this.cityCivilians = [];
    this.ferries = [];
    this.cityFishingSpots = [];
    this.frontierBuildings = [];
    this.frontierNpcs = [];
    this.frontierFishingSpots = [];
    this.frontierFerries = [];
    this.visitedFrontierIslands = new Set();
    this.frontierCatches = 0;
    this.expansionNpcs = [];
    this.islandHuts = [];
    this.islandHutNpcs = [];
    this.isExpansionOpen = false;
    this.expansionTab = 'backpack';
    this.isCombatMode = false;
    this.activeWeather = null;
    this.expansionDailyCatches = 0;
    this.unlockedTitles = new Set();

    // Expansion UI event hooks
    this.onMountToggle = null;
    this.onTravelToggle = null;
    this.onFishIndexToggle = null;
    this.onExpansionToggle = null;
    this.onCombatToggle = null;
    this.onNotification = null;

    this.fishingSystem.worldClock = this.worldClock;
    this.fishingSystem.setDifficulty('standard');
    this.fishingSystem.setBait('worm');
    this.fishingSystem.onNotification = (message) => this.notify(message);
    this.fishingSystem.buffManager = this.consumableManager;
    this.fishingSystem.onRodXp = (amount) => this.rodManager.addXp(amount);
    this.fishingSystem.toolManager = this.fishingToolManager;
    this.fishingToolManager.onNotification = (message) => this.notify(message);
    this.fishingSystem.onBonusCatch = (fish) => this._recordExpansionCatch(fish);

    this.backpackManager.onChange = () => this._updateCarrySpeed();
    this.consumableManager.onNotification = (message) => this.notify(message);
    this.housingManager.onNotification = (message) => this.notify(message);
    this.housingManager.onFurniturePlaced = () => {
      if (this.expansionNpcManager) this.expansionNpcManager.recordFurniture();
    };
    this.cosmeticManager.onNotification = (message) => this.notify(message);
    this.cosmeticManager.onEquip = (cosmetic) => this.applyCosmetic(cosmetic);
    this.serviceManager.onNotification = (message) => this.notify(message);
    this.crewManager.onNotification = (message) => this.notify(message);
    this.cannonManager.onNotification = (message) => this.notify(message);
    this.cannonManager.crewBonusProvider = (key) => this.crewManager.getBonus(key);
    this.giantFishManager.onNotification = (message) => this.notify(message);
    this.giantFishManager.onDiscover = (creature) => this.notify(`New giant creature discovered: ${creature.name}`);
    this.giantFishManager.onEncounter = (creature) => {
      if (creature.definition.bossId) {
        this.notify(`${creature.name} is a world boss. Open the Ocean Radar and engage when ready.`);
      }
    };
    this.treasureManager.onNotification = (message) => this.notify(message);
    this.farmingManager.onNotification = (message) => this.notify(message);
    this.gatheringManager.onNotification = (message) => this.notify(message);
    this.gatheringManager.contextProvider = () => ({
      backpack: this.backpackManager,
      inventory: this.player ? this.player.inventory : null,
      progression: this.player ? this.player.progression : null,
      economy: this.player ? this.player.economy : null,
    });
    this.farmingManager.onHarvest = () => {
      if (this.particleManager && this.player) {
        this.particleManager.spawnCatchConfetti(this.player.position);
      }
    };
    this.gatheringManager.onResource = () => {
      if (this.particleManager && this.player) {
        this.particleManager.spawnCatchConfetti(this.player.position);
      }
    };
    this.bossManager.onNotification = (message) => this.notify(message);
    this.bossManager.onDefeat = (result) => this._handleBossDefeat(result);
    this.bossManager.onFail = () => {
      this.isCombatMode = false;
      if (typeof this.onCombatToggle === 'function') this.onCombatToggle(false);
    };
    this.expansionNpcManager.onNotification = (message) => this.notify(message);
    this.expansionNpcManager.onService = (serviceId, npcId) => this.openService(serviceId, npcId);
    this.characterCustomization.onNotification = (message) => this.notify(message);
    this.characterCustomization.onChange = () => this._saveCharacterProfile();

    const existingCatchHandler = this.fishingSystem.onCatchSuccess;
    this.fishingSystem.onCatchSuccess = (fish) => {
      if (typeof existingCatchHandler === 'function') existingCatchHandler(fish);
      this._recordExpansionCatch(fish);
    };

    this.mountManager.onSummon = (mount, mesh) => {
      if (mesh && this.scene) this.scene.add(mesh);
      if (this.player && this.player.mesh) this.player.mesh.visible = false;
      this.notify(`${mount.name} summoned`);
    };
    this.mountManager.onDismount = (mount) => {
      if (mount && mount.mesh && mount.mesh.parent) mount.mesh.parent.remove(mount.mesh);
      if (this.player && this.player.mesh) this.player.mesh.visible = true;
    };
    this.mountManager.onLevelUp = (mount, level) => {
      this.notify(`${mount.name} reached level ${level}!`);
      if (this.soundManager) this.soundManager.playLevelUp();
    };
    this.mountManager.onUnlock = (definition) => {
      this.notify(`${definition.name} unlocked!`);
      if (this.soundManager) this.soundManager.playCoinSound();
    };
    this.fastTravelManager.onUnlock = (destination) => {
      this.notify(`Fast travel unlocked: ${destination.name}`);
    };
    this.fastTravelManager.onTravel = (destination) => {
      if (this.cameraRig) this.cameraRig.reset(this.player.position);
      this.notify(`Teleported to ${destination.name}`);
    };

    // Audio & Visual Juice Event Hooks
    this.fishingSystem.onBite = () => {
      this.soundManager.playBiteAlert();
    };
    const expansionCatchHandler = this.fishingSystem.onCatchSuccess;
    this.fishingSystem.onCatchSuccess = (fish) => {
      if (typeof expansionCatchHandler === 'function') expansionCatchHandler(fish);
      this.soundManager.playCatchSuccess();
      if (this.player) {
        this.particleManager.spawnCatchConfetti(this.player.position);
      }
    };
    this.fishingSystem.onCatchFailed = () => {
      this.soundManager.playCatchFailed();
    };
    if (this.player && this.player.progression) {
      this.player.progression.onLevelUp = () => {
        this.soundManager.playLevelUp();
      };
    }

    this.privatePond = null;
    this.isInventoryOpen = false;
    this.isShopOpen = false;
    this.onInventoryToggle = null;
    this.onShopToggle = null;

    // Initial spawn placement: clamp to terrain
    const spawnH = this.terrainCollider.sampleHeight(
      this.config.player.spawnPosition.x,
      this.config.player.spawnPosition.z
    );
    this.player.position.y = spawnH + 0.1;
    this.player.isGrounded = true;

    // Three.js Scene Setup (if running in browser with DOM)
    if (typeof window !== 'undefined' && canvasContainer) {
      this._initThreeJS(canvasContainer);
    } else {
      // Headless / mock setup for unit testing
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
      this.cameraRig = new ThirdPersonCamera(this.camera, this.config.camera);
      this.cameraRig.reset(this.player.position);
    }

    // Restore the lightweight lobby appearance profile before the world is built.
    this._loadCharacterProfile();

    // Populate NPCs and interactable world objects
    this._initWorldEntities();

    this._onWindowResize = this._onWindowResize.bind(this);
    this._loop = this._loop.bind(this);
  }

  _initWorldEntities() {
    // 1. Captain Finn (Harbor Master near Pier)
    const finnPos = { x: 3.5, y: 0, z: 2.0 };
    finnPos.y = this.terrainCollider.sampleHeight(finnPos.x, finnPos.z);
    const captainFinn = new NPC({
      id: 'captain_finn',
      name: 'Captain Finn',
      title: 'Harbor Master',
      position: finnPos,
      facingAngle: Math.PI * 0.75,
      coatColor: 0x1e3a5f,
      hatStyle: 'captain',
      backpackStyle: 'satchel',
      hairStyle: 'short',
    });
    this.npcs.push(captainFinn);
    this.interactionManager.register(captainFinn);
    if (this.scene && captainFinn.mesh) {
      this.scene.add(captainFinn.mesh);
    }

    // 2. Fisherman Barnaby (Veteran Angler along the shoreline)
    const barnabyPos = { x: -8.0, y: 0, z: -14.0 };
    barnabyPos.y = this.terrainCollider.sampleHeight(barnabyPos.x, barnabyPos.z);
    const barnaby = new NPC({
      id: 'barnaby',
      name: 'Fisherman Barnaby',
      title: 'Veteran Angler',
      position: barnabyPos,
      facingAngle: 0.3,
      coatColor: 0x884422,
      beardColor: 0x888888,
      hatStyle: 'straw',
      facialHair: 'beard',
      backpackStyle: 'fishing',
      hairStyle: 'wavy',
      dialogue: [
        'The tide is rising! Perfect time to cast your line near the ripples.',
        'Watch your bobber closely. When it splashes underwater, press E to strike and reel in!',
        'The deep ocean holds rare leviathans, but you’ll need a sturdy boat to venture out there.',
      ],
    });
    this.npcs.push(barnaby);
    this.interactionManager.register(barnaby);
    if (this.scene && barnaby.mesh) {
      this.scene.add(barnaby.mesh);
    }

    // 3. Starter Fishing Spots
    // Spot A: Pier Fishing Platform
    const pierSpot = new FishingSpot({
      id: 'spot_pier',
      name: 'Pier Fishing Spot',
      position: { x: 2.5, y: 1.5, z: -10.0 },
      targetWaterPos: new THREE.Vector3(2.5, this.config.world.waterLevel, -16.0),
      habitat: 'pier',
      interactionRange: 3.8,
      onInteract: (player) => this._startFishingAtSpot(pierSpot, player),
    });
    this.fishingSpots.push(pierSpot);
    this.interactionManager.register(pierSpot);
    if (this.scene && pierSpot.mesh) {
      this.scene.add(pierSpot.mesh);
    }

    // Spot B: Coastal Sandy Bank
    const coastSpot = new FishingSpot({
      id: 'spot_coast',
      name: 'Coastline Fishing Spot',
      position: { x: -12.0, y: 0.8, z: -18.0 },
      targetWaterPos: new THREE.Vector3(-15.0, this.config.world.waterLevel, -24.0),
      habitat: 'coast',
      interactionRange: 4.0,
      onInteract: (player) => this._startFishingAtSpot(coastSpot, player),
    });
    this.fishingSpots.push(coastSpot);
    this.interactionManager.register(coastSpot);
    if (this.scene && coastSpot.mesh) {
      this.scene.add(coastSpot.mesh);
    }

    // Expansion fishing hotspots (each habitat opens a new slice of the catalog)
    const expansionSpotData = [
      { id: 'spot_azure', name: 'Azure Bay Shallows', habitat: 'azure', position: { x: 60, z: -222 }, target: { x: 60, z: -256 } },
      { id: 'spot_jungle', name: 'Jungle River Mouth', habitat: 'jungle', position: { x: -236, z: 0 }, target: { x: -274, z: 0 } },
      { id: 'spot_frozen', name: 'Frozen Fjord Ice Hole', habitat: 'frozen', position: { x: -172, z: -172 }, target: { x: -200, z: -200 } },
      { id: 'spot_volcanic', name: 'Ember Coast Vent', habitat: 'volcanic', position: { x: 172, z: -172 }, target: { x: 200, z: -200 } },
      { id: 'spot_ruins', name: 'Ancient Ruins Shallows', habitat: 'ruins', position: { x: 280, z: -258 }, target: { x: 280, z: -246 } },
      { id: 'spot_abyss', name: 'Abyssal Drop-Off', habitat: 'abyss', position: { x: 338, z: -320 }, target: { x: 356, z: -320 } },
      { id: 'spot_celestial', name: 'Celestial Shoreline', habitat: 'celestial', position: { x: -60, z: -232 }, target: { x: -60, z: -280 } },
      { id: 'spot_kelp', name: 'Verdant Kelp Beds', habitat: 'kelp', position: { x: 418, z: 272 }, target: { x: 400, z: 302 } },
      { id: 'spot_mangrove', name: 'Verdant Mangrove Channel', habitat: 'mangrove', position: { x: 462, z: 270 }, target: { x: 490, z: 292 } },
      { id: 'spot_polar', name: 'Frostfall Polar Shelf', habitat: 'polar', position: { x: -446, z: -216 }, target: { x: -462, z: -192 } },
      { id: 'spot_ember', name: 'Ember Isle Vent', habitat: 'volcanic', position: { x: 415, z: -220 }, target: { x: 405, z: -194 } },
      { id: 'spot_sunspire', name: 'Sunspire Kelp Shelf', habitat: 'kelp', position: { x: 318, z: 142 }, target: { x: 310, z: 162 } },
      { id: 'spot_mistveil', name: 'Mistveil Mangrove Roots', habitat: 'mangrove', position: { x: -330, z: 158 }, target: { x: -340, z: 180 } },
      { id: 'spot_glassice', name: 'Glassice Polar Hole', habitat: 'polar', position: { x: -312, z: 10 }, target: { x: -318, z: 32 } },
      { id: 'spot_cinder', name: 'Cinder Cay Vent', habitat: 'volcanic', position: { x: 308, z: -8 }, target: { x: 302, z: 12 } },
    ];

    for (const data of expansionSpotData) {
      const ground = this.terrainCollider.sampleHeight(data.position.x, data.position.z);
      const spot = new FishingSpot({
        id: data.id,
        name: data.name,
        position: { x: data.position.x, y: Math.max(ground, 0) + 0.2, z: data.position.z },
        targetWaterPos: new THREE.Vector3(data.target.x, this.config.world.waterLevel, data.target.z),
        habitat: data.habitat,
        interactionRange: 4.5,
        onInteract: (player) => this._startFishingAtSpot(spot, player),
      });
      this.fishingSpots.push(spot);
      this.expansionSpots.push(spot);
      this.interactionManager.register(spot);
      if (this.scene && spot.mesh) this.scene.add(spot.mesh);
    }

    // Fast-travel gate network (one glowing arch per destination)
    for (const dest of TravelDestinations) {
      const ground = this.terrainCollider.sampleHeight(dest.position.x, dest.position.z);
      const station = new TeleportStation({
        id: `station_${dest.id}`,
        name: dest.name,
        destinationId: dest.id,
        icon: dest.icon,
        position: { x: dest.position.x, y: Math.max(ground, 0), z: dest.position.z },
        isUnlocked: this.fastTravelManager.isUnlocked(dest.id),
        onInteract: () => this.openTravel(dest.id),
      });
      this.teleportStations.push({ station, destination: dest });
      this.interactionManager.register(station);
      if (this.scene && station.mesh) this.scene.add(station.mesh);
    }

    // 4. Merchants
    // Fishmonger Pete (Buys fish at pier dock)
    const petePos = { x: 5.5, y: 1.5, z: -8.0 };
    petePos.y = this.terrainCollider.sampleHeight(petePos.x, petePos.z);
    const pete = new NPC({
      id: 'merchant_pete',
      name: 'Fishmonger Pete',
      title: 'Fish Merchant',
      position: petePos,
      facingAngle: Math.PI * 0.4,
      coatColor: 0x995533,
      isShopkeeper: true,
      apron: true,
      backpackStyle: 'satchel',
      promptAction: 'Sell Fish to',
      dialogue: [
        'Fresh catch? Let me see the bucket. I pay fair coin for anything with scales.',
        'Rare fish fetch a premium — and if you haul in a legendary, the whole harbor will hear about it.',
      ],
      dialogueChoices: [
        { id: 'sell', kind: 'shop', tab: 'sell', label: 'Open the fish market' },
        { id: 'leave', kind: 'leave', label: 'Maybe later' },
      ],
    });
    this.npcs.push(pete);
    this.interactionManager.register(pete);
    if (this.scene && pete.mesh) this.scene.add(pete.mesh);

    // Master Angler Silas (Shopkeeper inside the Tackle Hut)
    const silasPos = { x: -10.0, y: 0, z: 4.8 };
    silasPos.y = this.terrainCollider.sampleHeight(silasPos.x, silasPos.z);
    const silas = new NPC({
      id: 'merchant_silas',
      name: 'Shopkeeper Silas',
      title: 'Tackle & Upgrades',
      position: silasPos,
      facingAngle: 0.0,
      isShopkeeper: true,
      glasses: true,
      apron: true,
      hatStyle: 'merchant',
      backpackStyle: 'satchel',
      hairStyle: 'wavy',
      coatColor: 0x2e6644,
      promptAction: 'Shop & Browse with',
      dialogue: [
        'Welcome to Driftwood Tackle & Supplies! Step inside, out of the wind.',
        'We stock the finest rods and reinforced buckets on the archipelago.',
        'Upgrading your bucket will let you haul more fish before returning to port!',
      ],
      dialogueChoices: [
        { id: 'upgrades', kind: 'shop', tab: 'upgrades', label: 'Browse rods & bucket upgrades' },
        { id: 'leave', kind: 'leave', label: 'Just looking, thanks' },
      ],
    });
    this.npcs.push(silas);
    this.interactionManager.register(silas);
    if (this.scene && silas.mesh) this.scene.add(silas.mesh);

    // Expansion 8.0: the old angler's secret chest, tucked behind Silas inside
    // the tackle hut. Holds the 20,000-coin starter fortune, lootable once.
    const chestPos = { x: -12.4, y: 0, z: 6.4 };
    chestPos.y = this.terrainCollider.sampleHeight(chestPos.x, chestPos.z);
    this.secretChest = new SecretChest({
      id: 'secret_chest_tackle_hut',
      name: "Old Angler's Chest",
      position: chestPos,
      rewardCoins: 20000,
      rewardGems: 2,
    });
    this.secretChest.onOpen = (result) => {
      this.notify(`Secret chest opened: +${result.coins} coins and +${result.gems} gems!`);
      if (this.soundManager) this.soundManager.playCoinSound();
      if (this.particleManager) this.particleManager.spawnCatchConfetti(this.secretChest.position);
    };
    this.interactionManager.register(this.secretChest);
    if (this.scene && this.secretChest.mesh) this.scene.add(this.secretChest.mesh);

    // Marina Master Vance (Boat Dealership at Harbor Dock)
    const vancePos = { x: 5.5, y: 1.0, z: -17.0 };
    vancePos.y = this.terrainCollider.sampleHeight(vancePos.x, vancePos.z);
    const vance = new NPC({
      id: 'merchant_vance',
      name: 'Marina Master Vance',
      title: 'Boat Dealership',
      position: vancePos,
      facingAngle: Math.PI * 0.2,
      coatColor: 0x1f4e79,
      hatStyle: 'captain',
      backpackStyle: 'satchel',
      hairStyle: 'short',
      promptAction: 'Visit Boat Dealership with',
      dialogue: [
        'Welcome to the Marina. Every hull on this dock has a sea story, and most of them are true.',
        'Need speed, storage, or a fishing deck? I can fit you into the right boat.',
      ],
      dialogueChoices: [
        { id: 'boats', kind: 'shop', tab: 'boats', label: 'Browse the boat dealership' },
        { id: 'leave', kind: 'leave', label: 'Not today' },
      ],
    });
    this.npcs.push(vance);
    this.interactionManager.register(vance);
    if (this.scene && vance.mesh) this.scene.add(vance.mesh);

    // Update BoatManager dock mooring & anchor to align with the new Marina dock
    if (this.boatManager) {
      this.boatManager.dockMooring = { x: 8.5, y: 0.0, z: -21.0 };
      this.boatManager.dockLandAnchor = { x: 5.5, y: 1.0, z: -17.0 };
    }

    // Corsair Dock: a permanent pirate pier within easy walking distance of
    // the starter harbor, with Quartermaster Sable selling the pirate fleet.
    const pirateDockPos = { x: -26, y: 0, z: -16 };
    pirateDockPos.y = this.terrainCollider.sampleHeight(pirateDockPos.x, pirateDockPos.z);
    this.pirateDock = new PirateDock({
      id: 'pirate_dock',
      name: 'Corsair Dock',
      position: pirateDockPos,
      onInteract: () => this.openShop('pirate'),
    });
    this.interactionManager.register(this.pirateDock);
    if (this.scene && this.pirateDock.mesh) this.scene.add(this.pirateDock.mesh);

    const sablePos = { x: -22.6, y: 0, z: -13.2 };
    sablePos.y = this.terrainCollider.sampleHeight(sablePos.x, sablePos.z);
    const sable = new NPC({
      id: 'quartermaster_sable',
      name: 'Quartermaster Sable',
      title: 'Pirate Boat Dealer',
      position: sablePos,
      facingAngle: Math.PI * 0.75,
      isPirate: true,
      coatColor: 0x6b1d1d,
      beardColor: 0x2b1b14,
      hatStyle: 'tricorn',
      facialHair: 'beard',
      backpackStyle: 'pirate',
      interactionRange: 4.0,
      promptAction: 'Buy Pirate Boats from',
      dialogue: [
        'Ahoy, angler! Welcome to the Corsair Dock. No harbor taxes, no questions asked.',
        'Me cheapest runner is 50 coins and hits 10 knots. The 150-coin corsair makes 12, and the 400-coin red-sail cutter makes 15.',
        'Buy a hull from me and the sea suddenly gets a lot smaller. Just try not to sail it into a reef.',
      ],
      dialogueChoices: [
        { id: 'pirate', kind: 'shop', tab: 'pirate', label: 'Browse the corsair fleet' },
        { id: 'leave', kind: 'leave', label: 'Keep your barnacles' },
      ],
    });
    sable.isPirate = true;
    // Sable is both a talker and a live dealer. Interacting shows his dialogue
    // and opens the corsair catalog behind it, so old direct-shop play still
    // works while every other NPC is strictly dialogue-first.
    sable.onInteractHandler = (player, context) => {
      if (context && typeof context.openDialogue === 'function') {
        context.openDialogue(sable, sable.getDialogue());
      }
      this.openShop('pirate');
      return true;
    };
    this.pirateNpc = sable;
    this.npcs.push(sable);
    this.interactionManager.register(sable);
    if (this.scene && sable.mesh) this.scene.add(sable.mesh);

    // Captain Redbeard (Pirate Lord & Shipwright on Smuggler's Atoll)
    const redbeardPos = { x: 275.0, y: 0, z: -275.0 };
    redbeardPos.y = this.terrainCollider.sampleHeight(redbeardPos.x, redbeardPos.z);
    const redbeard = new NPC({
      id: 'captain_redbeard',
      name: 'Captain Redbeard',
      title: 'Pirate Lord & Shipwright',
      position: redbeardPos,
      facingAngle: Math.PI * 0.8,
      isPirate: true,
      coatColor: 0x8b1e1e,
      beardColor: 0x992200,
      hatStyle: 'tricorn',
      facialHair: 'beard',
      backpackStyle: 'pirate',
      promptAction: 'Buy Pirate Vessels from',
      dialogue: [
        'Ahoy, brave adventurer! Ye dared cross the pelagic abyss to reach Smuggler’s Atoll!',
        'The seas out here are wild, but me fleet of vessels can conquer any squall.',
        'Looking for a nimble craft or a flagship cruiser? Let us strike a bargain!',
      ],
      dialogueChoices: [
        { id: 'pirate', kind: 'shop', tab: 'pirate', label: 'Strike a bargain' },
        { id: 'leave', kind: 'leave', label: 'Sail on' },
      ],
    });
    this.npcs.push(redbeard);
    this.interactionManager.register(redbeard);
    if (this.scene && redbeard.mesh) this.scene.add(redbeard.mesh);

    // Civilization NPCs (Autonomous villagers wandering the main island)
    this.civilians = [];
    const civilianData = [
      {
        id: 'civilian_emma',
        name: 'Villager Emma',
        title: 'Island Botanist',
        coatColor: 0x2e7d32,
        hairStyle: 'long',
        backpackStyle: 'expedition',
        waypoints: [
          { x: -3.0, z: 2.0 },
          { x: -7.5, z: 3.5 },
          { x: -10.0, z: 12.0 },
          { x: -3.0, z: 12.0 },
          { x: 2.0, z: 5.0 },
        ],
        dialogue: [
          'Good day, angler! The sea lavender is in full bloom today.',
          'Shopkeeper Silas inside the tackle hut always has good advice for beginners.',
          'Driftwood Isle has been our home for generations. It’s a peaceful paradise!',
        ],
      },
      {
        id: 'civilian_joe',
        name: 'Old Angler Joe',
        title: 'Retired Seadog',
        coatColor: 0x5a4a3a,
        beardColor: 0x999999,
        hatStyle: 'straw',
        facialHair: 'beard',
        backpackStyle: 'fishing',
        waypoints: [
          { x: 0.0, z: -3.0 },
          { x: -8.0, z: -8.0 },
          { x: -14.0, z: -14.0 },
          { x: -8.0, z: -5.0 },
        ],
        dialogue: [
          'Aye, the morning tide brings schools of mackerel into the shallows.',
          'Back in my youth, I sailed all the way to Smuggler’s Atoll across the eastern water.',
          'They say an old pirate captain named Redbeard sells legendary craft out there!',
        ],
      },
      {
        id: 'civilian_toby',
        name: 'Dockhand Toby',
        title: 'Harbor Hand',
        coatColor: 0x7c4d28,
        hairStyle: 'short',
        backpackStyle: 'fishing',
        waypoints: [
          { x: 3.5, z: -6.0 },
          { x: 3.5, z: -16.0 },
          { x: 8.0, z: -23.0 },
          { x: 4.5, z: -12.0 },
        ],
        dialogue: [
          'Heavy lifting today! We’re unloading fresh cargo for the marina boardwalk.',
          'If you need a vessel to reach the outer islands, talk to Vance at the dock or visit Redbeard!',
          'Be careful around deep water—the sharks have sharp eyes and sharper fins.',
        ],
      },
      {
        id: 'civilian_marco',
        name: 'Sailor Marco',
        title: 'Coastal Scout',
        coatColor: 0x1e3a5f,
        hatStyle: 'captain',
        hairStyle: 'wavy',
        backpackStyle: 'expedition',
        waypoints: [
          { x: 8.0, z: 0.0 },
          { x: 15.0, z: -5.0 },
          { x: 18.0, z: -12.0 },
          { x: 10.0, z: -6.0 },
        ],
        dialogue: [
          'The horizon is clear today! You can almost make out the skull rock on Pirate Island.',
          'The ocean between here and the atoll is deep. Don’t try swimming it without a boat!',
          'Catching a Golden Sun Trout is the ultimate dream of every angler in the archipelago.',
        ],
      },
    ];

    for (const cData of civilianData) {
      const initialPos = { x: cData.waypoints[0].x, y: 0, z: cData.waypoints[0].z };
      initialPos.y = this.terrainCollider.sampleHeight(initialPos.x, initialPos.z);
      const civilian = new CivilianNPC({
        ...cData,
        position: initialPos,
      });
      this.civilians.push(civilian);
      this.npcs.push(civilian);
      this.interactionManager.register(civilian);
      if (this.scene && civilian.mesh) this.scene.add(civilian.mesh);
    }

    // 5. Claimable Property Plots
    for (const plot of this.propertyManager.getAllPlots()) {
      const groundH = this.terrainCollider.sampleHeight(plot.position.x, plot.position.z);
      plot.position.y = groundH;
      if (plot.mesh) {
        plot.mesh.position.y = groundH;
        if (this.scene) this.scene.add(plot.mesh);
      }
      this.interactionManager.register(plot);
    }

    // 6. Private Fish Pond (Tranquil stone pond near seaside plot)
    const pondPos = { x: 13.5, y: 0.0, z: -3.0 };
    pondPos.y = this.terrainCollider.sampleHeight(pondPos.x, pondPos.z);
    this.privatePond = new PrivatePond({
      id: 'pond_seaside',
      name: 'Private Fish Pond',
      position: pondPos,
    });
    if (this.scene && this.privatePond.mesh) {
      this.scene.add(this.privatePond.mesh);
    }
    this.interactionManager.register(this.privatePond);

    // Expansion 2.0: physical harbor service district. Every building opens a
    // working service panel, and named NPCs with schedules stand outside.
    const cols = 5;
    const startX = -40;
    const startZ = -34;
    const spacingX = 20;
    const spacingZ = 13;
    BuildingDefinitions.forEach((def, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * spacingX;
      const z = startZ - row * spacingZ;
      const ground = this.terrainCollider.sampleHeight(x, z);
      const building = new ServiceBuilding({
        id: def.id,
        name: def.name,
        service: def.service,
        icon: def.icon,
        color: def.color,
        description: def.description,
        position: { x, y: Math.max(ground, 0), z },
        onInteract: () => this.openService(def.service),
      });
      this.serviceBuildings.push(building);
      this.interactionManager.register(building);
      if (this.scene && building.mesh) this.scene.add(building.mesh);
    });

    for (const def of ExpansionNpcDefinitions) {
      const building = this.serviceBuildings.find((b) => b.id === def.building) || this.serviceBuildings[0];
      if (!building) continue;
      const npc = this.expansionNpcManager.spawn(def, building, building.service, this.scene);
      if (npc) {
        this.expansionNpcs.push(npc);
        this.npcs.push(npc);
        this.interactionManager.register(npc);
      }
    }

    // Free built-in island huts and their resident NPCs. These are part of the
    // world from the first frame: no plot purchase, rent, or unlock required.
    for (const def of IslandHutDefinitions) {
      const x = def.position.x;
      const z = def.position.z;
      const ground = this.terrainCollider.sampleHeight(x, z);
      const hut = new ServiceBuilding({
        id: def.id,
        name: def.name,
        service: def.service,
        icon: def.icon,
        color: def.color,
        description: `A free island hut looked after by ${def.resident}.`,
        variant: 'hut',
        position: { x, y: Math.max(ground, 0), z },
        onInteract: () => this.openService(def.service),
      });
      this.islandHuts.push(hut);
      this.interactionManager.register(hut);
      if (this.scene && hut.mesh) this.scene.add(hut.mesh);

      const resident = new NPC({
        id: def.npcId,
        name: def.resident,
        title: def.title,
        position: { x: x + 3.2, y: ground, z: z + 2.2 },
        facingAngle: Math.PI,
        coatColor: def.color,
        interactionRange: 3.6,
        promptAction: 'Talk to',
        dialogue: def.lines,
      });
      this.islandHutNpcs.push(resident);
      this.npcs.push(resident);
      this.interactionManager.register(resident);
      if (this.scene && resident.mesh) this.scene.add(resident.mesh);
    }

    // Expansion 6.0: Aurelia Heights city district, rooftop farms, resource
    // nodes and the two-way harbor ferry.
    this._initCityExpansion();

    // Expansion 7.0: the frontier archipelago, its outposts and ferries.
    this._initFrontierExpansion();

    // Giant creatures and treasure markers live in the world, not in menus.
    this.giantFishManager.attach(this.scene);
    this.treasureManager.attach(this.scene);

    // Add Bobber and Line meshes to scene
    if (this.scene) {
      if (this.fishingSystem.bobberMesh) this.scene.add(this.fishingSystem.bobberMesh);
      if (this.fishingSystem.lineMesh) this.scene.add(this.fishingSystem.lineMesh);
      if (this.wildlifeManager && this.wildlifeManager.container) {
        this.scene.add(this.wildlifeManager.container);
      }
    }

    // Expansion 8.0: exactly one ambient pirate ship — the lowest-tier Jolly
    // Bilge Skiff — endlessly circles the main island as living scenery.
    this.piratePatrol = new PiratePatrol({
      id: 'pirate_patrol_jolly',
      name: 'Jolly Bilge Patrol',
      shipId: 'boat_pirate_jolly',
      center: { x: 0, z: 0 },
      radius: this.config.world.islandRadius + 46,
    });
    if (this.scene && this.piratePatrol.mesh) this.scene.add(this.piratePatrol.mesh);
  }

  /** Builds the dialogue choice list for a service NPC. */
  _serviceChoices(serviceId) {
    if (!serviceId) return null;
    const label = ExpansionNPCManager.getServiceLabel(serviceId);
    return [
      { id: 'service', kind: 'service', serviceId, label: `Open ${label}` },
      { id: 'leave', kind: 'leave', label: 'Maybe later' },
    ];
  }

  /**
   * Executes a dialogue choice returned by InteractionManager. This is the one
   * bridge between the dialogue modal and live services, quests and gifts.
   */
  chooseDialogue(index) {
    const choice = this.interactionManager.chooseDialogue(index);
    if (!choice) return { success: false, reason: 'No dialogue choice available' };
    if (choice.kind === 'shop') {
      this.openShop(choice.tab || 'sell');
      return { success: true, choice };
    }
    if (choice.kind === 'service') {
      this.openService(choice.serviceId, choice.npcId || null);
      return { success: true, choice };
    }
    if (choice.kind === 'quest') {
      const result = this.claimNpcQuest(choice.npcId);
      if (!result.success) this.notify(result.reason);
      return { success: result.success, choice, result };
    }
    if (choice.kind === 'gift') {
      return this._giveDialogueGift(choice.npcId);
    }
    return { success: true, choice };
  }

  /** Gives the first eligible backpack item to an NPC from the dialogue flow. */
  _giveDialogueGift(npcId) {
    const items = this.backpackManager.getItems();
    const giftable = items.find((stack) => stack.def && stack.def.category !== 'quest');
    if (!giftable) {
      this.notify('You have nothing suitable to give as a gift.');
      return { success: false, reason: 'No gift item in backpack' };
    }
    const result = this.expansionNpcManager.giveGift(npcId, giftable.itemId, this.backpackManager);
    if (!result.success) this.notify(result.reason);
    return result;
  }

  /**
   * Spawns the whole Aurelia Heights expansion: city service buildings and
   * named residents, strolling civilians, rooftop farm beds, harvestable trees
   * and ore seams, plus the two-way harbor ferry.
   */
  _initCityExpansion() {
    for (const def of CityBuildingDefinitions) {
      const ground = this.terrainCollider.sampleHeight(def.position.x, def.position.z);
      const building = new ServiceBuilding({
        id: def.id,
        name: def.name,
        service: def.service,
        icon: def.icon,
        color: def.color,
        description: def.description,
        interactionRange: 5.0,
        position: { x: def.position.x, y: Math.max(ground, 0), z: def.position.z },
        onInteract: () => this.openService(def.service),
      });
      this.cityBuildings.push(building);
      this.interactionManager.register(building);
      if (this.scene && building.mesh) this.scene.add(building.mesh);
    }

    for (const def of CityNpcDefinitions) {
      const ground = this.terrainCollider.sampleHeight(def.position.x, def.position.z);
      const npc = new NPC({
        ...def,
        position: { x: def.position.x, y: ground, z: def.position.z },
        interactionRange: 3.6,
        dialogueChoices: this._serviceChoices(def.service),
      });
      this.cityNpcs.push(npc);
      this.npcs.push(npc);
      this.interactionManager.register(npc);
      if (this.scene && npc.mesh) this.scene.add(npc.mesh);
    }

    for (const def of CityCivilianDefinitions) {
      const start = def.waypoints[0];
      const position = {
        x: start.x,
        y: this.terrainCollider.sampleHeight(start.x, start.z),
        z: start.z,
      };
      const civilian = new CivilianNPC({ ...def, position });
      this.cityCivilians.push(civilian);
      this.npcs.push(civilian);
      this.interactionManager.register(civilian);
      if (this.scene && civilian.mesh) this.scene.add(civilian.mesh);
    }

    for (const plot of this.farmingManager.plots) {
      const ground = this.terrainCollider.sampleHeight(plot.position.x, plot.position.z);
      plot.position.y = ground;
      plot.actionHandler = (target, player) => {
        const result = this.farmingManager.interactWithPlot(target, player, this._farmContext());
        if (result && result.success === false) this.notify(result.reason);
        return result;
      };
      if (plot.mesh) {
        plot.mesh.position.y = ground;
        if (this.scene) this.scene.add(plot.mesh);
      }
      this.interactionManager.register(plot);
    }

    for (const node of this.gatheringManager.nodes) {
      if (this.scene && node.mesh) this.scene.add(node.mesh);
      this.interactionManager.register(node);
    }

    for (const def of CityFerryDefinitions) {
      const ground = this.terrainCollider.sampleHeight(def.position.x, def.position.z);
      const ferry = new FerryPoint({
        ...def,
        position: { x: def.position.x, y: Math.max(ground, 0), z: def.position.z },
        onSail: (destination) => (destination === 'city'
          ? this.travelToCity()
          : this.travelToHarbor()),
      });
      this.ferries.push(ferry);
      this.interactionManager.register(ferry);
      if (this.scene && ferry.mesh) this.scene.add(ferry.mesh);
    }

    for (const data of CityFishingSpots) {
      const ground = this.terrainCollider.sampleHeight(data.position.x, data.position.z);
      const spot = new FishingSpot({
        id: data.id,
        name: data.name,
        position: { x: data.position.x, y: Math.max(ground, 0) + 0.2, z: data.position.z },
        targetWaterPos: new THREE.Vector3(data.target.x, this.config.world.waterLevel, data.target.z),
        habitat: data.habitat,
        interactionRange: 4.5,
        onInteract: (player) => this._startFishingAtSpot(spot, player),
      });
      this.cityFishingSpots.push(spot);
      this.fishingSpots.push(spot);
      this.interactionManager.register(spot);
      if (this.scene && spot.mesh) this.scene.add(spot.mesh);
    }
  }

  /**
   * Builds the four remote frontier islands: outpost buildings, resident
   * service NPCs, expedition ferries and eight frontier fishing platforms.
   * Everything lives in its own arrays so Expansion 6.0 exact counts hold.
   */
  _initFrontierExpansion() {
    for (const def of FrontierBuildingDefinitions) {
      const ground = this.terrainCollider.sampleHeight(def.position.x, def.position.z);
      const building = new ServiceBuilding({
        id: def.id,
        name: def.name,
        service: def.service,
        icon: def.icon,
        color: def.color,
        description: def.description,
        interactionRange: 5.0,
        position: { x: def.position.x, y: Math.max(ground, 0), z: def.position.z },
        onInteract: () => this.openService(def.service),
      });
      this.frontierBuildings.push(building);
      this.interactionManager.register(building);
      if (this.scene && building.mesh) this.scene.add(building.mesh);
    }

    for (const def of FrontierNpcDefinitions) {
      const ground = this.terrainCollider.sampleHeight(def.position.x, def.position.z);
      const npc = new NPC({
        ...def,
        position: { x: def.position.x, y: ground, z: def.position.z },
        interactionRange: 3.8,
        dialogueChoices: this._serviceChoices(def.service),
      });
      this.frontierNpcs.push(npc);
      this.interactionManager.register(npc);
      if (this.scene && npc.mesh) this.scene.add(npc.mesh);
    }

    for (const def of FrontierFishingSpotDefinitions) {
      const ground = this.terrainCollider.sampleHeight(def.position.x, def.position.z);
      const spot = new FishingSpot({
        id: def.id,
        name: def.name,
        islandId: def.islandId,
        catalog: def.catalog,
        position: { x: def.position.x, y: Math.max(ground, 0) + 0.2, z: def.position.z },
        targetWaterPos: new THREE.Vector3(def.target.x, this.config.world.waterLevel, def.target.z),
        habitat: def.habitat,
        interactionRange: 4.6,
        onInteract: (player) => this._startFishingAtSpot(spot, player),
      });
      this.frontierFishingSpots.push(spot);
      this.interactionManager.register(spot);
      if (this.scene && spot.mesh) this.scene.add(spot.mesh);
    }

    for (const def of FrontierFerryDefinitions) {
      const ground = this.terrainCollider.sampleHeight(def.position.x, def.position.z);
      const ferry = new FerryPoint({
        ...def,
        position: { x: def.position.x, y: Math.max(ground, 0), z: def.position.z },
        onSail: (destination) => (destination === 'harbor'
          ? this.travelToHarbor()
          : this.travelToFrontier(destination)),
      });
      this.frontierFerries.push(ferry);
      this.interactionManager.register(ferry);
      if (this.scene && ferry.mesh) this.scene.add(ferry.mesh);
    }
  }

  _farmContext() {
    return {
      economy: this.player ? this.player.economy : null,
      backpack: this.backpackManager,
      inventory: this.player ? this.player.inventory : null,
      progression: this.player ? this.player.progression : null,
    };
  }

  travelToCity() {
    return this._ferryTravel(CityIsland.arrival, 'Aurelia Heights');
  }

  travelToHarbor() {
    return this._ferryTravel({ x: 12, z: -22 }, 'Driftwood Harbor');
  }

  /**
   * Sails to one of the four Expansion 7.0 frontier islands. Each island is a
   * real terrain-clamped landmass with its own outpost, NPC and fishing spots.
   */
  travelToFrontier(islandId) {
    const island = FrontierIslands.find((entry) => entry.id === islandId);
    if (!island) {
      this.notify('That frontier island is not charted.');
      return { success: false, reason: 'Unknown frontier island' };
    }

    const result = this._ferryTravel(island.arrival, island.name);
    if (result.success) {
      this.visitedFrontierIslands.add(island.id);
      const zone = this.zoneManager.getZoneAt(island.center.x, island.center.z);
      if (zone && this.zoneManager.discoveredZones) {
        const isNew = !this.zoneManager.discoveredZones.has(zone.id);
        this.zoneManager.discoveredZones.add(zone.id);
        // Move the current zone immediately so the next update does not fire a
        // second entry event for the same arrival.
        this.zoneManager.currentZone = zone;
        if (typeof this.zoneManager.onZoneEnter === 'function') {
          this.zoneManager.onZoneEnter(zone, isNew);
        }
      }
    }
    return result;
  }

  _ferryTravel(target, label) {
    if (this.mountManager && this.mountManager.isMounted()) this.dismountMount();
    if (this.player.isMountedBoat) {
      const boat = this.boatManager.getActiveBoat();
      if (boat) boat.dismount(this.player);
    }
    const ground = this.terrainCollider.sampleHeight(target.x, target.z);
    this.player.teleport({ x: target.x, y: ground + 0.1, z: target.z });
    if (this.cameraRig) this.cameraRig.reset(this.player.position);
    this.interactionManager.reset();
    this.closeExpansion();
    this.notify(`Ferry arrived at ${label}`);
    return { success: true, destination: label };
  }

  /** Adds a freshly purchased or loaded vessel to the world and lets E board it. */
  _attachBoat(boat) {
    if (!boat) return;
    if (this.scene && boat.mesh && boat.mesh.parent !== this.scene) {
      this.scene.add(boat.mesh);
    }
    boat.interactionRange = Math.max(boat.interactionRange || 0, 6.0);
    boat.onInteractHandler = () => {
      if (boat.isMounted) {
        return { success: true, message: 'Use Q to leave the helm.' };
      }
      const result = boat.mount(this.player);
      if (result.success) {
        if (this.cameraRig) this.cameraRig.reset(this.player.position);
        this.notify(`Boarded ${boat.name}`);
      } else {
        this.notify(result.reason);
      }
      return result;
    };
    this.interactionManager.register(boat);
  }

  /**
   * City boats launch from the Sky Marina waterfront rather than the harbor
   * mooring used by the original 30-vessel catalog.
   */
  purchaseCityBoat(boatId) {
    const position = this.boatManager.cityMooring || CityBoatMooring.position;
    const anchor = this.boatManager.cityLandAnchor || CityBoatMooring.anchor;
    const result = this.boatManager.purchaseBoat(boatId, this.player.economy, {
      position: { ...position },
      anchor: {
        ...anchor,
        y: this.terrainCollider.sampleHeight(anchor.x, anchor.z),
      },
    });
    if (!result.success) {
      this.notify(result.reason);
    } else {
      this.notify(`${result.boat.name} delivered to the Sky Marina`);
      if (this.soundManager) this.soundManager.playCoinSound();
    }
    return result;
  }

  /**
   * Purchases one of the eight Expansion 8.0 expedition hulls and delivers it to
   * its frontier mooring so it can be boarded in the world.
   */
  purchaseExpeditionBoat(boatId) {
    const def = this.boatManager.getBoatDef(boatId);
    if (!def) return { success: false, reason: 'Unknown expedition boat' };
    const mooring = getExpeditionMooring(def.homeIsland);
    const position = mooring ? { ...mooring.position } : { ...this.boatManager.dockMooring };
    const anchor = {
      ...(mooring ? mooring.anchor : this.boatManager.dockLandAnchor),
    };
    anchor.y = this.terrainCollider.sampleHeight(anchor.x, anchor.z);
    const result = this.boatManager.purchaseBoat(boatId, this.player.economy, {
      position,
      anchor,
    });
    if (!result.success) {
      this.notify(result.reason);
    } else {
      const islandName = mooring ? mooring.islandName : 'the frontier';
      this.notify(`${result.boat.name} delivered to ${islandName}`);
      if (this.soundManager) this.soundManager.playCoinSound();
    }
    return result;
  }

  /** Gem Exchange catalog with live affordability flags for the UI. */
  getGemCatalog() {
    const economy = this.player ? this.player.economy : null;
    return GemOffers.map((offer) => ({
      ...offer,
      canAfford: economy ? economy.canAffordGems(offer.gems) : false,
      isOwned: this._gemOfferOwned(offer),
    }));
  }

  _gemOfferOwned(offer) {
    if (!offer || !offer.grant) return false;
    if (offer.grant.tool) {
      return Boolean(this.fishingToolManager && this.fishingToolManager.ownedToolIds.has(offer.grant.tool));
    }
    if (offer.grant.rod) {
      return Boolean(this.rodManager && this.rodManager.ownedRodIds.has(offer.grant.rod));
    }
    if (offer.grant.boat) {
      return Boolean(this.boatManager && this.boatManager.isBoatOwned(offer.grant.boat));
    }
    return false;
  }

  /**
   * Spends gems on a Gem Exchange offer and applies its grant exactly once.
   * Coins cannot buy these rewards; gems only come from story chapters, bosses
   * and rare world caches.
   */
  purchaseGemOffer(offerId) {
    const offer = getGemOffer(offerId);
    if (!offer) return { success: false, reason: 'Unknown Gem Exchange offer' };
    const economy = this.player ? this.player.economy : null;
    if (!economy) return { success: false, reason: 'Economy unavailable' };
    if (this._gemOfferOwned(offer)) return { success: false, reason: 'Reward already owned' };
    if (!economy.canAffordGems(offer.gems)) {
      return { success: false, reason: `Need ${offer.gems} gems` };
    }

    const grant = offer.grant || {};
    let spawnedBoat = null;
    if (grant.boat) {
      const def = this.boatManager.getBoatDef(grant.boat);
      if (!def) return { success: false, reason: 'Unknown boat reward' };
      if (this.boatManager.isBoatOwned(grant.boat)) return { success: false, reason: 'Boat already owned' };
    }

    if (!economy.spendGems(offer.gems)) return { success: false, reason: 'Gem transaction failed' };

    if (grant.coins) economy.addCoins(grant.coins);
    if (grant.xp && this.player.progression) this.player.progression.addXp(grant.xp);
    if (grant.tool && this.fishingToolManager) {
      this.fishingToolManager.ownedToolIds.add(grant.tool);
      if (!this.fishingToolManager.equippedToolId) this.fishingToolManager.equippedToolId = grant.tool;
    }
    if (grant.rod && this.rodManager) {
      this.rodManager.ownedRodIds.add(grant.rod);
      if (typeof this.rodManager._changed === 'function') this.rodManager._changed();
    }
    if (grant.boat) {
      const def = this.boatManager.getBoatDef(grant.boat);
      const mooring = getExpeditionMooring(def.homeIsland);
      const position = mooring ? { ...mooring.position } : { ...this.boatManager.dockMooring };
      const anchor = { ...(mooring ? mooring.anchor : this.boatManager.dockLandAnchor) };
      anchor.y = this.terrainCollider.sampleHeight(anchor.x, anchor.z);
      this.boatManager.ownedBoatIds.add(grant.boat);
      spawnedBoat = this.boatManager.spawnBoat(grant.boat, position, anchor);
    }

    this.notify(`Gem Exchange: ${offer.name} unlocked`);
    if (this.soundManager) this.soundManager.playLevelUp();
    return {
      success: true,
      offer,
      spentGems: offer.gems,
      gems: economy.getGems(),
      spawnedBoat,
    };
  }

  toggleStoryJournal(forced = null) {
    this.isStoryOpen = forced !== null ? forced : !this.isStoryOpen;
    if (this.isStoryOpen) {
      this.closeTravel();
      this.closeMountMenu();
      this.toggleFishIndex(false);
      if (this.interactionManager && this.interactionManager.isInteracting()) {
        this.interactionManager.closeDialogue();
      }
    }
    if (typeof this.onStoryToggle === 'function') this.onStoryToggle(this.isStoryOpen);
    if (this.isStoryOpen && typeof this.onStoryUpdate === 'function') {
      this.onStoryUpdate(this.storyJournal.getSummary());
    }
    return this.isStoryOpen;
  }

  closeStoryJournal() {
    this.isStoryOpen = false;
    if (typeof this.onStoryToggle === 'function') this.onStoryToggle(false);
    return false;
  }

  markStoryRead(chapterId) {
    const result = this.storyJournal.markRead(chapterId);
    if (typeof this.onStoryUpdate === 'function') this.onStoryUpdate(this.storyJournal.getSummary());
    return result;
  }

  _initThreeJS(container) {
    this.scene = new THREE.Scene();

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(
      this.config.camera.fov,
      aspect,
      this.config.camera.near,
      this.config.camera.far
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(this.renderer.domElement);

    // Initialize Camera Rig
    this.cameraRig = new ThirdPersonCamera(this.camera, this.config.camera);
    this.cameraRig.reset(this.player.position);

    // Initialize 3D Environment & World
    this.environment = new Environment(this.scene, this.terrainCollider);

    // Add Player 3D mesh to scene
    if (this.player.mesh) {
      this.scene.add(this.player.mesh);
    }

    window.addEventListener('resize', this._onWindowResize);
  }

  _onWindowResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    this.restart();

    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(this._loop);
    }
  }

  stop() {
    this.isRunning = false;
  }

  _loop(currentTime) {
    if (!this.isRunning) return;

    const now = currentTime || ((typeof performance !== 'undefined') ? performance.now() : Date.now());
    let dt = (now - this.lastTime) / 1000.0;
    this.lastTime = now;

    // Safety clamp delta time against alt-tab or hitching
    dt = Math.min(dt, 0.08);

    this.update(dt);
    this.render();

    // FPS calculation
    this.frameCount++;
    this._fpsTimer += dt;
    if (this._fpsTimer >= 0.5) {
      this.fps = Math.round(this.frameCount / this._fpsTimer);
      this.frameCount = 0;
      this._fpsTimer = 0;
    }

    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(this._loop);
    }
  }

  /**
   * Main game physics and logic update cycle.
   * @param {number} dt - Delta time in seconds.
   */
  update(dt) {
    this.elapsedTime += dt;

    // Check restart trigger (e.g. R key)
    if (this.inputManager.consumeRestart()) {
      this.restart();
      return;
    }

    // Check inventory toggle (B or I key)
    if (this.inputManager.consumeInventoryToggle()) {
      this.toggleInventory();
    }

    // 1. Process Camera Mouse Look & Distance Zoom
    const mouseDelta = this.inputManager.consumeMouseDelta();
    if (mouseDelta.x !== 0 || mouseDelta.y !== 0) {
      this.cameraRig.handleInput(mouseDelta.x, mouseDelta.y);
    }
    const wheelDelta = this.inputManager.consumeWheelDelta();
    if (wheelDelta !== 0) {
      this.cameraRig.adjustDistance(wheelDelta);
    }

    // Expansion hotkeys
    if (this.inputManager.consumeMountToggle()) this.toggleMountMenu();
    if (this.inputManager.consumeTravelToggle()) this.openTravel();
    if (this.inputManager.consumeFishIndexToggle()) this.toggleFishIndex();
    if (this.inputManager.consumeBackpackToggle()) this.openExpansion('backpack');
    if (this.inputManager.consumeWardrobeToggle()) this.openExpansion('wardrobe');
    if (this.inputManager.consumeHousingToggle()) this.openExpansion('housing');
    if (this.inputManager.consumeRadarToggle()) this.openExpansion('radar');
    if (this.inputManager.consumeCombatToggle()) this.toggleCombatMode();
    if (this.inputManager.consumeStoryToggle()) this.toggleStoryJournal();

    // Advance the shared day/night clock (drives fish activity).
    this.worldClock.update(dt);
    this.fastTravelManager.update(dt);
    this.consumableManager.update(dt);
    this.farmingManager.update(dt, 1 + this.consumableManager.getModifier('farming'));
    this.gatheringManager.update(dt);
    if (this.consumableManager.getModifier('weather') <= 0) this.activeWeather = null;
    this._updateCarrySpeed();
    this.serviceManager.updateDaily(this.worldClock.getDay(), this.expansionDailyCatches);

    // Expansion 8.0: ambient pirate patrol + throttled story bookkeeping.
    if (this.piratePatrol) this.piratePatrol.update(dt);
    this._storyTimer += dt;
    if (this._storyTimer >= 1.0) {
      this._storyTimer = 0;
      this.storyJournal.update(this);
    }

    // 2. Update Kinematic Player (freeze input if in dialogue, fishing, mounted, or in a modal)
    const isMounted = this.mountManager.isMounted();
    const isLocked = this.interactionManager.isInteracting() ||
      this.fishingSystem.state !== FishingState.IDLE ||
      Boolean(this.player.isMountedBoat) ||
      isMounted ||
      this.isLobbyOpen ||
      this.isInventoryOpen ||
      this.isShopOpen ||
      this.isMountMenuOpen ||
      this.isTravelOpen ||
      this.isFishIndexOpen ||
      this.isStoryOpen ||
      this.isExpansionOpen;
    const effectiveInput = isLocked ? null : this.inputManager;
    if (isMounted) {
      this.mountManager.update(dt, this.inputManager, this.cameraRig, this.terrainCollider);
    } else {
      this.player.update(dt, effectiveInput, this.cameraRig, this.terrainCollider);
    }

    // 3. Update Third-Person Camera Follow & Obstacle Clearance
    this.cameraRig.update(dt, this.player.position, this.terrainCollider);

    // 4. Update NPCs & Civilization (breathing, orientation toward player, autonomous patrols)
    for (const npc of this.npcs) {
      if (npc instanceof CivilianNPC) {
        npc.update(dt, this.player.position, this.terrainCollider);
      } else {
        npc.update(dt, this.player.position);
      }
    }
    this.expansionNpcManager.update(dt, this.worldClock);

    // 5. Update Fishing Spots, service buildings & Teleport Gates
    for (const spot of this.fishingSpots) {
      spot.update(dt);
    }
    for (const building of this.serviceBuildings) {
      building.update(dt, this.elapsedTime);
    }
    for (const entry of this.teleportStations) {
      entry.station.update(dt);
      entry.station.isUnlocked = this.fastTravelManager.isUnlocked(entry.destination.id);
    }
    for (const building of this.cityBuildings) {
      building.update(dt, this.elapsedTime);
    }
    for (const ferry of this.ferries) {
      ferry.update(dt, this.elapsedTime);
    }
    // Expansion 7.0 frontier outposts, residents, platforms and ferries.
    for (const building of this.frontierBuildings) {
      building.update(dt, this.elapsedTime);
    }
    for (const npc of this.frontierNpcs) {
      npc.update(dt, this.player.position);
    }
    for (const spot of this.frontierFishingSpots) {
      spot.update(dt);
    }
    for (const ferry of this.frontierFerries) {
      ferry.update(dt, this.elapsedTime);
    }
    for (const plot of this.farmingManager.plots) {
      plot.update(dt, this.elapsedTime);
    }
    for (const node of this.gatheringManager.nodes) {
      node.update(dt, this.elapsedTime);
    }

    // 6. Update Fishing System (casting, biting, tension reeling)
    this.fishingSystem.update(dt, this.inputManager);

    // 7. Update Interaction Manager (proximity check, prompt events, debounced interact triggers)
    this.interactionManager.update(dt, this.player, this.inputManager);

    // 8. Update Private Fish Pond swimming simulations
    if (this.privatePond) {
      this.privatePond.update(dt);
    }

    // 9. Update Passive Income generation from pond fish
    if (this.passiveIncomeManager && this.privatePond) {
      this.passiveIncomeManager.update(dt, this.privatePond);
    }

    // 10. Update Environmental Effects (Ocean waves, etc.)
    if (this.environment) {
      this.environment.update(this.elapsedTime);
    }

    // 11. Update Active Boat Navigation, Buoyancy & deck fishing
    const activeBoat = this.boatManager ? this.boatManager.getActiveBoat() : null;
    if (activeBoat) {
      activeBoat.update(dt, this.inputManager, this.terrainCollider);
      if (this.player.isMountedBoat) {
        if (this.inputManager.consumeDismount()) {
          activeBoat.dismount(this.player);
        } else if (this.inputManager.consumeInteract()) {
          // Ignore E while a fishing session is already in progress (reeling uses
          // the same key), otherwise cast from the deck or step ashore.
          if (this.fishingSystem.state === FishingState.IDLE) {
            const canDeckFish = activeBoat.hasFishingDeck && this.player.isRodEquipped;
            if (canDeckFish) {
              const cast = this.fishingSystem.startCasting(this.player, null);
              if (!cast.success) this.notify(cast.reason);
            } else {
              activeBoat.disembarkOrDock(this.player);
            }
          }
        }
      }
    }

    // 12. Update Marine Wildlife and giant roaming creatures
    if (this.wildlifeManager) {
      this.wildlifeManager.update(dt, this.player, activeBoat, this.terrainCollider);
    }
    this.giantFishManager.update(dt, {
      player: this.player,
      boat: activeBoat,
    });
    this.treasureManager.update(this.player, (result) => {
      this.player.economy.addCoins(result.coins);
      if (result.item) this.backpackManager.addItem(result.item, 1, this.player.inventory);
      this.serviceManager.addReputation('harbor_community', 5);
    });

    // 12b. Ship combat: cannons, boss phases and ammunition.
    if (activeBoat) {
      if (this.cannonManager.boat !== activeBoat) {
        this.cannonManager.attachToBoat(activeBoat, this.scene);
      }
      if (this.cannonManager.cannonMesh && activeBoat.mesh && this.cannonManager.cannonMesh.parent !== activeBoat.mesh) {
        this.cannonManager.attachToBoat(activeBoat, this.scene);
      }
    }
    this.giantFishManager.setRadarBonus(
      (activeBoat && activeBoat.upgradeLevels ? (activeBoat.upgradeLevels.radar || 0) * 55 : 0) +
      this.crewManager.getBonus('radar')
    );
    this.cannonManager.update(dt);
    if (this.isCombatMode && this.bossManager.activeBoss && activeBoat) {
      this._updateShipCombat(dt, activeBoat);
      this.bossManager.update(dt, activeBoat);
    } else if (this.bossManager.activeBoss && !activeBoat) {
      this.bossManager.retreat();
    }

    // 13. Update Zone Exploration, Discovery & Fast-Travel unlocks
    if (this.zoneManager) {
      this.zoneManager.update(this.player.position);
      this.fastTravelManager.updateDiscoveries(this.zoneManager, this.player.progression.getLevel());
    }
    this.fastTravelManager.updateProximity(this.player);

    // 14. Update Procedural Particle System (splashes, boat wakes, catch confetti)
    if (this.particleManager) {
      this.particleManager.update(dt);
      if (activeBoat && Math.abs(activeBoat.speed) > 1.5) {
        this.particleManager.spawnBoatWake(activeBoat.position, 1);
      }
    }
  }

  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Acceptance Test: Restarting the scene works cleanly without state corruption.
   */
  restart() {
    // Reset player to safe spawn height on terrain
    const spawnX = this.config.player.spawnPosition.x;
    const spawnZ = this.config.player.spawnPosition.z;
    const groundH = this.terrainCollider.sampleHeight(spawnX, spawnZ);

    this.player.reset({ x: spawnX, y: groundH + 0.1, z: spawnZ });
    this.player.isGrounded = true;

    // Reset camera rig behind player
    this.cameraRig.reset(this.player.position);

    // Clear any stuck inputs, interactions, and active fishing sessions
    this.inputManager.reset();
    this.interactionManager.reset();
    this.fishingSystem.reset();
    if (this.privatePond) this.privatePond.reset();
    if (this.passiveIncomeManager) this.passiveIncomeManager.reset();
    if (this.boatManager && this.boatManager.activeBoat && this.boatManager.activeBoat.isMounted) {
      this.boatManager.activeBoat.dismount(this.player);
    }
    if (this.wildlifeManager) this.wildlifeManager.reset();
    if (this.zoneManager) this.zoneManager.reset();
    if (this.questManager) this.questManager.reset();
    if (this.particleManager) this.particleManager.reset();
    if (this.mountManager) this.mountManager.reset();
    if (this.fastTravelManager) this.fastTravelManager.reset();
    if (this.farmingManager) this.farmingManager.reset();
    if (this.gatheringManager) this.gatheringManager.reset();
    if (this.storyJournal) this.storyJournal.reset();
    if (this.secretChest) this.secretChest.reset();
    if (this.piratePatrol) this.piratePatrol.reset();
    if (this.visitedFrontierIslands) this.visitedFrontierIslands.clear();
    this.frontierCatches = 0;
    if (this.worldClock) this.worldClock.reset();
    if (this.player && this.player.mesh) this.player.mesh.visible = true;
    this.toggleInventory(false);
    this.closeShop();
    this.closeTravel();
    this.closeMountMenu();
    this.toggleFishIndex(false);
    this.closeStoryJournal();
    this.closeExpansion();
    if (this.bossManager && this.bossManager.activeBoss) this.bossManager.retreat();
    this.isCombatMode = false;
    this.cannonManager.isAiming = false;
    if (this.player) this.player.speedMultiplier = 1;
    if (typeof this.onCombatToggle === 'function') this.onCombatToggle(false);
  }

  toggleInventory(forcedState = null) {
    this.isInventoryOpen = forcedState !== null ? forcedState : !this.isInventoryOpen;
    if (typeof this.onInventoryToggle === 'function') {
      this.onInventoryToggle(this.isInventoryOpen, this.player.inventory);
    }
    return this.isInventoryOpen;
  }

  openLobby() {
    this.closeShop();
    this.closeTravel();
    this.closeMountMenu();
    this.toggleFishIndex(false);
    this.closeExpansion();
    this.isLobbyOpen = true;
    return true;
  }

  beginAdventure() {
    this.isLobbyOpen = false;
    this.inputManager.reset();
    return true;
  }

  applyCharacterAppearance(patch = {}) {
    const appearance = this.characterCustomization.applyCustom(patch);
    this._saveCharacterProfile();
    return appearance;
  }

  _saveCharacterProfile() {
    try {
      if (typeof globalThis === 'undefined' || !globalThis.localStorage) return false;
      const payload = {
        appearance: this.player.getAppearance(),
        customization: this.characterCustomization.serialize(),
      };
      globalThis.localStorage.setItem(this.characterProfileKey, JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }

  _loadCharacterProfile() {
    try {
      if (typeof globalThis === 'undefined' || !globalThis.localStorage) return false;
      const raw = globalThis.localStorage.getItem(this.characterProfileKey);
      if (!raw) return false;
      const payload = JSON.parse(raw);
      if (payload.appearance) this.player.setAppearance(payload.appearance);
      if (payload.customization) this.characterCustomization.deserialize(payload.customization);
      return true;
    } catch {
      return false;
    }
  }

  openShop(initialTab = 'sell') {
    this.isShopOpen = true;
    if (typeof this.onShopToggle === 'function') {
      this.onShopToggle(true, initialTab, this.player.economy, this.player.inventory, this.shopManager);
    }
    return this.isShopOpen;
  }

  closeShop() {
    this.isShopOpen = false;
    if (typeof this.onShopToggle === 'function') {
      this.onShopToggle(false);
    }
    return this.isShopOpen;
  }

  /** Pushes a transient HUD notification. */
  notify(message) {
    if (typeof this.onNotification === 'function' && message) {
      this.onNotification(message);
    }
  }

  toggleMountMenu(forced = null) {
    this.isMountMenuOpen = forced !== null ? forced : !this.isMountMenuOpen;
    if (this.isMountMenuOpen) {
      this.closeTravel();
      this.toggleFishIndex(false);
    }
    if (typeof this.onMountToggle === 'function') this.onMountToggle(this.isMountMenuOpen);
    return this.isMountMenuOpen;
  }

  closeMountMenu() {
    this.isMountMenuOpen = false;
    if (typeof this.onMountToggle === 'function') this.onMountToggle(false);
  }

  summonMount(id) {
    const result = this.mountManager.summon(id, this.player, this.terrainCollider, this.config.world.waterLevel);
    if (result.success) {
      this.closeMountMenu();
      this.cameraRig.adjustDistance(1.6);
      this.soundManager.playLevelUp();
    } else {
      this.notify(result.reason);
    }
    return result;
  }

  dismountMount() {
    const result = this.mountManager.dismount(this.player, this.terrainCollider);
    if (result.success) this.closeMountMenu();
    return result;
  }

  unlockMount(id) {
    const result = this.mountManager.purchaseMount(
      id,
      this.player.economy,
      this.player.progression.getLevel()
    );
    if (!result.success) this.notify(result.reason);
    return result;
  }

  openTravel(preselectId = null) {
    this.isTravelOpen = true;
    this.isMountMenuOpen = false;
    this.isFishIndexOpen = false;
    if (typeof this.onMountToggle === 'function') this.onMountToggle(false);
    if (typeof this.onFishIndexToggle === 'function') this.onFishIndexToggle(false);
    if (typeof this.onTravelToggle === 'function') this.onTravelToggle(true, preselectId);
    return this.isTravelOpen;
  }

  closeTravel() {
    this.isTravelOpen = false;
    if (typeof this.onTravelToggle === 'function') this.onTravelToggle(false, null);
    return this.isTravelOpen;
  }

  fastTravel(destinationId) {
    if (this.mountManager.isMounted()) this.dismountMount();
    if (this.player.isMountedBoat) {
      const boat = this.boatManager.getActiveBoat();
      if (boat) boat.dismount(this.player);
    }
    const result = this.fastTravelManager.travel(this.player, destinationId, this.terrainCollider);
    if (result.success) {
      this.closeTravel();
      this.soundManager.playLevelUp();
    } else {
      this.notify(result.reason);
    }
    return result;
  }

  toggleFishIndex(forced = null) {
    this.isFishIndexOpen = forced !== null ? forced : !this.isFishIndexOpen;
    if (this.isFishIndexOpen) {
      this.closeTravel();
      this.closeMountMenu();
    }
    if (typeof this.onFishIndexToggle === 'function') this.onFishIndexToggle(this.isFishIndexOpen);
    return this.isFishIndexOpen;
  }

  travelToFishHabitat(speciesId) {
    const species = FishDatabase.getSpeciesById(speciesId);
    const destination = this.fishIndex.getHabitatDestination(speciesId, this.fastTravelManager);

    if (!destination) {
      // Frontier fish live outside the classic teleport network. Route the
      // angler to the matching frontier island by habitat.
      const frontierIsland = species
        ? FrontierIslands.find((island) => island.habitat === species.habitat[0])
        : null;
      if (frontierIsland) return this.travelToFrontier(frontierIsland.id);
      this.notify('No teleport gate is connected to this habitat yet.');
      return { success: false, reason: 'No travel gate near this habitat' };
    }
    if (!this.fastTravelManager.isUnlocked(destination.id)) {
      this.notify(`Discover ${destination.name} first.`);
      return { success: false, reason: 'Destination locked' };
    }
    return this.fastTravel(destination.id);
  }

  _recordExpansionCatch(fish) {
    this.expansionDailyCatches++;
    if (fish && fish.frontier) {
      this.frontierCatches++;
      // A catch proves the angler reached that island even on a loaded save.
      const zone = this.zoneManager ? this.zoneManager.getCurrentZone() : null;
      const island = zone ? FrontierIslands.find((entry) => entry.zoneId === zone.id) : null;
      if (island) this.visitedFrontierIslands.add(island.id);
    }
    if (this.expansionNpcManager) this.expansionNpcManager.recordCatch(fish);
    this.serviceManager.addReputation('fishing_guild', 1);
    if (fish && ['Rare', 'Epic', 'Legendary', 'Mythical', 'Celestial', 'Ancient', 'Abyssal'].includes(fish.rarity)) {
      this.serviceManager.addReputation('ocean_researchers', 1);
    }
    this._updateCarrySpeed();
  }

  _updateCarrySpeed() {
    if (!this.player) return;
    const load = this.backpackManager.getLoad(this.player.inventory);
    const buffSpeed = this.consumableManager ? this.consumableManager.getSpeedMultiplier() : 1;
    this.player.speedMultiplier = load.speedMultiplier * buffSpeed;
  }

  claimNpcQuest(npcId) {
    const result = this.expansionNpcManager.claimQuest(npcId, this.player.economy, this.player.progression);
    if (!result.success) this.notify(result.reason);
    return result;
  }

  _startFishingAtSpot(spot, player = this.player) {
    const result = this.fishingSystem.quickCast(player, spot);
    if (!result.success) this.notify(result.reason);
    return result;
  }

  deployFishingTrap(toolId) {
    const zone = this.zoneManager.getCurrentZone();
    const habitat = zone && zone.habitat ? zone.habitat : 'coast';
    const trap = this.fishingToolManager.deployTrap(toolId, habitat, this.player.position);
    if (!trap.success) this.notify(trap.reason);
    return trap;
  }

  collectFishingTraps() {
    const result = this.fishingToolManager.collectReady(this.player.inventory);
    if (!result.success) {
      this.notify(result.reason);
      return result;
    }
    for (const fish of result.catches) {
      this._recordExpansionCatch(fish);
      if (this.soundManager) this.soundManager.playCatchSuccess();
    }
    this.notify(`Collected ${result.catches.length} fish from traps`);
    return result;
  }

  quickUseItem(itemId) {
    const result = this.consumableManager.useFromBackpack(itemId, {
      player: this.player,
      backpack: this.backpackManager,
      inventory: this.player.inventory,
      fishingSystem: this.fishingSystem,
      boat: this.boatManager.getActiveBoat(),
      mountManager: this.mountManager,
      cannonManager: this.cannonManager,
      game: this,
    });
    if (!result.success) this.notify(result.reason);
    return result;
  }

  openExpansion(tab = 'backpack', npcId = null) {
    if (this.isExpansionOpen && this.expansionTab === tab) {
      this.closeExpansion();
      return false;
    }
    this.isExpansionOpen = true;
    this.expansionTab = tab;
    this.activeServiceNpc = npcId;
    this.closeTravel();
    this.closeMountMenu();
    this.toggleFishIndex(false);
    this.toggleInventory(false);
    if (typeof this.onExpansionToggle === 'function') this.onExpansionToggle(true, tab, npcId);
    return true;
  }

  closeExpansion() {
    this.isExpansionOpen = false;
    this.activeServiceNpc = null;
    if (typeof this.onExpansionToggle === 'function') this.onExpansionToggle(false, this.expansionTab, null);
    return false;
  }

  openService(serviceId, npcId = null) {
    if (!serviceId) return false;
    this.serviceManager.addReputation('harbor_community', 1);
    if (serviceId === 'shipyard') {
      this.openShop('boats');
      return true;
    }
    if (serviceId === 'pirate') {
      this.openShop('pirate');
      return true;
    }
    if (serviceId === 'market') {
      this.openShop('sell');
      return true;
    }
    if (serviceId === 'mounts') {
      this.toggleMountMenu(true);
      return true;
    }
    if (serviceId === 'travel') {
      this.openTravel('harbor');
      return true;
    }
    return this.openExpansion(serviceId, npcId);
  }

  teleportHome() {
    const result = this.housingManager.teleportHome(this.player);
    if (result.success) {
      if (this.cameraRig) this.cameraRig.reset(this.player.position);
      this.closeExpansion();
      this.notify(`Welcome home: ${result.house.name}`);
    } else {
      this.notify(result.reason);
    }
    return result;
  }

  applyCosmetic(cosmetic) {
    if (!cosmetic) return;
    if (cosmetic.slot === 'rod' && this.player.rod && typeof this.player.rod.setVisualStyle === 'function') {
      this.player.rod.setVisualStyle({ color: cosmetic.color });
    }
    if (cosmetic.slot === 'character' && this.player.shirtMaterial) {
      this.player.shirtMaterial.color.setHex(cosmetic.color);
    }
    if (cosmetic.slot === 'ship') {
      const boat = this.boatManager.getActiveBoat();
      if (boat && boat.hullMesh && boat.hullMesh.material) boat.hullMesh.material.color.setHex(cosmetic.color);
    }
    if (cosmetic.slot === 'mount' && this.mountManager.activeMount && this.mountManager.activeMount.mesh) {
      this.mountManager.activeMount.mesh.traverse((child) => {
        if (child.isMesh && child.material && child.material.color) child.material.color.setHex(cosmetic.color);
      });
    }
    if (cosmetic.slot === 'effect') this.castEffectColor = cosmetic.color;
    if (cosmetic.slot === 'aquarium') {
      const house = this.housingManager.getHouses().find((h) => h.isOwned);
      if (house) this.housingManager.decorateAquarium(house.id, cosmetic.id);
    }
  }

  toggleCombatMode() {
    if (!this.bossManager.activeBoss) {
      this.openExpansion('radar');
      this.notify('Choose a world boss from Ocean Radar to begin a cannon battle.');
      return false;
    }
    this.isCombatMode = !this.isCombatMode;
    this.cannonManager.isAiming = this.isCombatMode;
    if (typeof this.onCombatToggle === 'function') this.onCombatToggle(this.isCombatMode);
    return this.isCombatMode;
  }

  startBossEncounter(bossId) {
    const boat = this.boatManager.getActiveBoat();
    if (!boat) {
      this.notify('Buy and launch a ship before challenging a world boss.');
      return { success: false, reason: 'No active ship' };
    }
    if (!this.player.isMountedBoat) {
      boat.mount(this.player);
      this.cameraRig.adjustDistance(-2);
    }
    this.cannonManager.attachToBoat(boat, this.scene);
    const result = this.bossManager.startEncounter(bossId, boat, this.scene, this.player);
    if (result.success) {
      this.isCombatMode = true;
      this.cannonManager.isAiming = true;
      this.closeExpansion();
      if (typeof this.onCombatToggle === 'function') this.onCombatToggle(true);
    } else {
      this.notify(result.reason);
    }
    return result;
  }

  retreatBoss() {
    const result = this.bossManager.retreat();
    this.isCombatMode = false;
    this.cannonManager.isAiming = false;
    if (typeof this.onCombatToggle === 'function') this.onCombatToggle(false);
    return result;
  }

  fireCannon() {
    const boss = this.bossManager.activeBoss;
    const boat = this.boatManager.getActiveBoat();
    if (!boss || !boat) return { success: false, reason: 'No active boss encounter' };
    const targetAngle = Math.atan2(boss.position.x - boat.position.x, boss.position.z - boat.position.z);
    const shot = this.cannonManager.fire(targetAngle, boss.position);
    if (!shot.success) {
      this.notify(shot.reason);
      return shot;
    }
    if (!shot.hit) {
      this.notify('Cannon shot missed — adjust your aim or switch to assisted mode (X).');
      return shot;
    }
    const result = this.bossManager.applyDamage(shot.damage, shot.ammoDef, {
      boat,
      stability: this.cannonManager.getStats().stability,
      capture: shot.ammo === 'capture',
    });
    if (result.success && this.soundManager) this.soundManager.playCatchSuccess();
    return { ...shot, bossDamage: result };
  }

  _updateShipCombat(dt, boat) {
    this.cannonManager.isAiming = true;
    if (this.inputManager.consumeAimModeToggle()) {
      const mode = this.cannonManager.toggleMode();
      this.notify(`Cannon mode: ${mode === 'assisted' ? 'Assisted' : 'Manual'}`);
    }
    const boss = this.bossManager.activeBoss;
    if (!boss) return;
    const targetAngle = Math.atan2(boss.position.x - boat.position.x, boss.position.z - boat.position.z);
    let steer = 0;
    if (this.inputManager.isKeyDown('ArrowLeft')) steer += 1;
    if (this.inputManager.isKeyDown('ArrowRight')) steer -= 1;
    if (steer !== 0) this.cannonManager.aim(steer * dt * 1.4);
    if (this.cannonManager.mode === 'assisted') {
      let diff = (targetAngle - this.cannonManager.aimAngle + Math.PI * 3) % (Math.PI * 2) - Math.PI;
      this.cannonManager.aimAngle += diff * Math.min(1, dt * 5);
    }

    if (this.inputManager.consumeFire()) {
      this.fireCannon();
    }
  }

  _handleBossDefeat({ boss, record, boat }) {
    const rewards = boss.rewards;
    if (this.expansionNpcManager) this.expansionNpcManager.recordBossDefeat();
    this.player.economy.addCoins(rewards.coins);
    this.player.progression.addXp(rewards.xp);
    this.serviceManager.addReputation('pirate_crew', 50);
    this.serviceManager.addReputation('ancient_guardians', 20);
    const fishRecord = FishDatabase.createCatchRecord(boss.rewardSpecies, 0.82);
    this.player.inventory.recordDiscovery(fishRecord);
    for (const [material, qty] of Object.entries(rewards.materials || {})) {
      this.backpackManager.addItem(material, qty, this.player.inventory);
    }
    const cosmeticMap = {
      ship_phantom: 'Phantom Ship',
      mount_kraken: 'Kraken Saddle',
      rod_stormcaller_4: 'Stormglass Rod',
      rod_celestial_4: 'Aurora Celestial Rod',
    };
    const cosmeticName = cosmeticMap[rewards.cosmetic];
    if (cosmeticName) this.cosmeticManager.grantByName(cosmeticName);
    this.unlockedTitles.add(rewards.title);
    const home = this.housingManager.getHouses().find((h) => h.isOwned);
    if (home) {
      this.housingManager.addTrophy(home.id, {
        id: `trophy_${boss.id}`,
        name: `${boss.name} Trophy`,
        title: rewards.title,
        defeatedAt: Date.now(),
      });
    }
    if (boat) boat.health = Math.min(boat.maxHealth, boat.health + 30);
    this.isCombatMode = false;
    this.cannonManager.isAiming = false;
    if (typeof this.onCombatToggle === 'function') this.onCombatToggle(false);
    this.notify(`${boss.name} defeated! +${rewards.coins} coins, +${rewards.xp} XP, title: ${rewards.title}`);
  }

  saveGame() {
    return this.saveManager.saveGame(this);
  }

  loadGame(forcedPayload = null) {
    return this.saveManager.loadGame(this, forcedPayload);
  }

  hasSaveFile() {
    return this.saveManager.hasSaveFile();
  }

  deleteSaveFile() {
    return this.saveManager.deleteSaveFile();
  }

  /**
   * Retrieves live diagnostic state for HUD and acceptance testing.
   */
  getDiagnostics() {
    const pState = this.player.getState();
    const groundH = this.terrainCollider.sampleHeight(pState.position.x, pState.position.z);
    const distToWater = pState.position.y - this.config.world.waterLevel;
    const inv = this.player.inventory;
    const eco = this.player.economy;

    // Cache repeated aggregate calls: each getSummary()/getLoad() walks the
    // catalog or backpack contents, and diagnostics runs every HUD frame.
    const fishSummary = this.fishIndex ? this.fishIndex.getSummary() : null;
    const carryLoad = this.backpackManager ? this.backpackManager.getLoad(inv) : null;
    const farmSummary = this.farmingManager ? this.farmingManager.getSummary() : null;
    const gatherSummary = this.gatheringManager ? this.gatheringManager.getSummary() : null;

    return {
      fps: this.fps,
      position: {
        x: pState.position.x.toFixed(2),
        y: pState.position.y.toFixed(2),
        z: pState.position.z.toFixed(2),
      },
      speed: pState.speed.toFixed(2),
      isGrounded: pState.isGrounded,
      isSprinting: pState.isSprinting,
      groundHeight: groundH.toFixed(2),
      distToWater: distToWater.toFixed(2),
      cameraDistance: this.cameraRig.distance.toFixed(2),
      cameraYaw: (this.cameraRig.yaw * (180 / Math.PI)).toFixed(1),
      cameraPitch: (this.cameraRig.pitch * (180 / Math.PI)).toFixed(1),
      activePrompt: this.interactionManager.activeInteractable
        ? this.interactionManager.activeInteractable.getPromptText()
        : 'None',
      isDialogueOpen: this.interactionManager.isInteracting(),
      isRodEquipped: this.player.isRodEquipped,
      fishingState: this.fishingSystem.state,
      catchProgress: this.fishingSystem.catchProgress.toFixed(0),
      tension: this.fishingSystem.tension.toFixed(0),
      bucketCount: inv ? inv.getCount() : 0,
      bucketCapacity: inv ? inv.getCapacity() : 10,
      bucketValue: inv ? inv.getTotalValue() : 0,
      discoveredCount: inv ? inv.getDiscoveryCount() : 0,
      coins: eco ? eco.getCoins() : 0,
      gems: eco && typeof eco.getGems === 'function' ? eco.getGems() : 0,
      storyChapters: this.storyJournal ? this.storyJournal.getSummary().unlocked : 0,
      isShopOpen: this.isShopOpen,
      ownedProperties: this.propertyManager ? this.propertyManager.getOwnedPlots().length : 0,
      pondFishCount: this.privatePond ? this.privatePond.getCount() : 0,
      storageFishCount: this.player && this.player.storage ? this.player.storage.getCount() : 0,
      passiveCoins: this.passiveIncomeManager ? this.passiveIncomeManager.getAccumulatedCoins() : 0,
      passiveRate: this.passiveIncomeManager && this.privatePond
        ? this.passiveIncomeManager.calculatePerSecondRate(this.privatePond)
        : 0,
      isMountedBoat: Boolean(this.player.isMountedBoat),
      boatSpeed: this.boatManager && this.boatManager.activeBoat && this.player.isMountedBoat
        ? this.boatManager.activeBoat.speed.toFixed(2)
        : '0.00',
      ownedBoatsCount: this.boatManager ? this.boatManager.ownedBoatIds.size : 0,
      wildlifeCount: this.wildlifeManager ? this.wildlifeManager.getCreatures().length : 0,
      currentZone: this.zoneManager ? this.zoneManager.getCurrentZone().name : 'Emerald Cove',
      explorationProgress: this.zoneManager ? `${this.zoneManager.getExplorationPercentage()}%` : '0%',
      playerLevel: this.player && this.player.progression ? this.player.progression.getLevel() : 1,
      playerXp: this.player && this.player.progression
        ? `${this.player.progression.getXp()}/${this.player.progression.getXpForNextLevel()}`
        : '0/0',
      activeQuestsCount: this.questManager ? this.questManager.getActiveQuests().length : 0,
      clock: this.worldClock ? this.worldClock.getTimeString() : '07:30',
      dayPeriod: this.worldClock ? this.worldClock.getPeriod() : 'day',
      isMountedMount: this.mountManager ? this.mountManager.isMounted() : false,
      activeMountName: this.mountManager && this.mountManager.activeMount
        ? this.mountManager.activeMount.name
        : null,
      mountStamina: this.mountManager && this.mountManager.activeMount
        ? this.mountManager.activeMount.getStaminaPercent()
        : 0,
      mountLevel: this.mountManager && this.mountManager.activeMount
        ? this.mountManager.activeMount.level
        : 0,
      unlockedTravelCount: this.fastTravelManager ? this.fastTravelManager.unlockedIds.size : 1,
      totalTravelCount: this.fastTravelManager ? this.fastTravelManager.destinations.length : 0,
      fishIndexCount: fishSummary ? fishSummary.discovered : 0,
      fishIndexTotal: fishSummary ? fishSummary.total : 0,
      fishIndexPercent: fishSummary ? fishSummary.percent : 0,
      fishingDifficulty: this.fishingSystem ? this.fishingSystem.difficulty : 'standard',
      activeBait: this.fishingSystem ? this.fishingSystem.bait : 'worm',
      fishStamina: this.fishingSystem ? this.fishingSystem.fishStamina : 0,
      shipUpgrades: this.boatManager && this.boatManager.activeBoat
        ? this.boatManager.activeBoat.upgradeLevels
        : {},
      carryWeight: carryLoad ? carryLoad.weight : 0,
      carryCapacity: carryLoad ? carryLoad.capacityWeight : 0,
      carryStatus: carryLoad ? carryLoad.status : 'normal',
      backpackSlots: carryLoad ? carryLoad.slots : 0,
      backpackSlotCapacity: carryLoad ? carryLoad.capacitySlots : 0,
      activeBuffs: this.consumableManager ? this.consumableManager.getActiveBuffs().length : 0,
      farmPlots: farmSummary ? farmSummary.totalPlots : 0,
      farmReady: farmSummary ? farmSummary.ready : 0,
      farmGrowing: farmSummary ? farmSummary.growing : 0,
      gatheringNodes: gatherSummary ? gatherSummary.totalNodes : 0,
      gatheringReady: gatherSummary ? gatherSummary.ready : 0,
      cityBuildings: this.cityBuildings ? this.cityBuildings.length : 0,
      cityResidents: this.cityNpcs ? this.cityNpcs.length : 0,
      frontierIslands: this.visitedFrontierIslands ? this.visitedFrontierIslands.size : 0,
      frontierOutposts: this.frontierBuildings ? this.frontierBuildings.length : 0,
      frontierResidents: this.frontierNpcs ? this.frontierNpcs.length : 0,
      frontierFishingSpots: this.frontierFishingSpots ? this.frontierFishingSpots.length : 0,
      frontierCatches: this.frontierCatches || 0,
      frontierFishTotal: FishDatabase.getFrontierSpecies().length,
      ownedRods: this.rodManager ? this.rodManager.ownedRodIds.size : 0,
      cosmeticsOwned: this.cosmeticManager ? this.cosmeticManager.ownedIds.size : 0,
      giantCreatures: this.giantFishManager ? this.giantFishManager.getCreatures().length : 0,
      activeBoss: this.bossManager && this.bossManager.activeBoss
        ? this.bossManager.activeBoss.definition.name
        : 'None',
      bossPhase: this.bossManager && this.bossManager.activeBoss
        ? this.bossManager.activeBoss.phase
        : 0,
      cannonMode: this.cannonManager ? this.cannonManager.mode : 'assisted',
      cannonReload: this.cannonManager ? this.cannonManager.reloadRemaining : 0,
      cannonAmmo: this.cannonManager ? this.cannonManager.ammo[this.cannonManager.selectedAmmo] || 0 : 0,
      crewAssigned: this.crewManager ? Object.keys(this.crewManager.assigned).length : 0,
      cargoWeight: this.boatManager && this.boatManager.activeBoat && this.cargoManager
        ? this.cargoManager.getState(this.boatManager.activeBoat).usedWeight
        : 0,
    };
  }

  dispose() {
    this.stop();
    this.inputManager.detach();
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this._onWindowResize);
    }
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
  }
}

export default Game;
