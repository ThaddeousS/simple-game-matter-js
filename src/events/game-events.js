export class GameEvents {
  // Editor events
  static TOGGLE_EDITOR = "game:toggleEditor";
  static REQUEST_RESET = "game:requestReset";
  static WORLD_RESET = "game:worldReset";
  static BEFORE_RENDER = "game:beforeRender";

  // Game lifecycle events
  static GAME_CREATED = "game:created";
  static GAME_INITIALIZED = "game:initialized";
  static ENTITY_SPAWNED = "game:entitySpawned";
}
