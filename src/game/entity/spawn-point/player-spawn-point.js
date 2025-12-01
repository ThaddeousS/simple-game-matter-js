import { SpawnPoint } from "./spawn-point.js";
import { Player } from "../player/player.js";

export class PlayerSpawnPoint extends SpawnPoint {
  constructor(config, world) {
    const playerSpawnConfig = {
      color: "#ffcc0044", // Semi-transparent yellow
      label: "player_spawn",
      entityType: "player_spawn",
      spawnType: "player",
      width: 40,
      height: 80,
      ...config,
    };

    super(playerSpawnConfig, world);
  }

  spawnPlayer(playerConfig, world) {
    // Spawn the player at this location with the provided config
    return this.spawn(Player, playerConfig, world);
  }
}
