/**
 * Node.js Mock for @minecraft/server
 * Used by test suite and offline validation scripts
 */

export const world = {
  getDynamicProperty: () => undefined,
  setDynamicProperty: () => {},
  getAllPlayers: () => [],
  beforeEvents: {
    entityHurt: { subscribe: () => {} }
  },
  afterEvents: {
    entitySpawn: { subscribe: () => {} },
    entityLoad: { subscribe: () => {} },
    entityDie: { subscribe: () => {} },
    entityHurt: { subscribe: () => {} },
    entityHitEntity: { subscribe: () => {} },
    entityRemove: { subscribe: () => {} }
  }
};

export const system = {
  run: (fn) => fn(),
  runInterval: () => 0,
  runTimeout: () => 0,
  beforeEvents: {
    startup: { subscribe: () => {} }
  },
  afterEvents: {
    scriptEventReceive: { subscribe: () => {} }
  }
};

export const GameMode = {
  Adventure: "Adventure",
  Creative: "Creative",
  Spectator: "Spectator",
  Survival: "Survival"
};

export const CommandPermissionLevel = {
  Any: 0,
  GameDirectors: 1,
  Admin: 2,
  Host: 3,
  Owner: 4
};

export const CustomCommandParamType = {
  String: "String",
  Enum: "Enum",
  Integer: "Integer",
  Float: "Float",
  Boolean: "Boolean"
};

export const CustomCommandStatus = {
  Success: 0,
  Failure: 1
};

export const EquipmentSlot = {
  Mainhand: "Mainhand",
  Offhand: "Offhand",
  Head: "Head",
  Chest: "Chest",
  Legs: "Legs",
  Feet: "Feet"
};

export const BlockPermutation = {
  resolve: (name) => ({ type: name })
};

export const EnchantmentTypes = {
  get: (id) => ({ id, maxLevel: 5 })
};

export class ItemStack {
  constructor(id, count = 1) {
    this.typeId = id;
    this.amount = count;
  }
  getComponent() {
    return null;
  }
}
