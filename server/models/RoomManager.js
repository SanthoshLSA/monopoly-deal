import { GameState } from '../engine/GameState.js';

export class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomCode -> GameState
    this.playerRooms = new Map(); // socketId -> roomCode
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    do {
      code = '';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(hostPlayer, edition = 'base') {
    const roomCode = this.generateRoomCode();
    const game = new GameState(roomCode, hostPlayer, edition);
    this.rooms.set(roomCode, game);
    this.playerRooms.set(hostPlayer.id, roomCode);
    return game;
  }

  getRoom(roomCode) {
    if (!roomCode) return null;
    return this.rooms.get(roomCode.toUpperCase().trim());
  }

  getRoomByPlayerId(playerId) {
    const code = this.playerRooms.get(playerId);
    return code ? this.rooms.get(code) : null;
  }

  joinRoom(roomCode, player) {
    const game = this.getRoom(roomCode);
    if (!game) {
      throw new Error(`Room with code "${roomCode}" was not found.`);
    }
    game.addPlayer(player);
    this.playerRooms.set(player.id, game.roomCode);
    return game;
  }

  leaveRoom(playerId) {
    const roomCode = this.playerRooms.get(playerId);
    if (!roomCode) return null;

    const game = this.rooms.get(roomCode);
    this.playerRooms.delete(playerId);

    if (game) {
      game.removePlayer(playerId);
      // If room is empty or all players disconnected, clean up room
      const activePlayers = game.players.filter(p => p.connected);
      if (activePlayers.length === 0) {
        this.rooms.delete(roomCode);
        console.log(`Room ${roomCode} closed (empty).`);
      }
    }
    return game;
  }

  deleteRoom(roomCode) {
    const game = this.rooms.get(roomCode);
    if (game) {
      for (const p of game.players) {
        this.playerRooms.delete(p.id);
      }
      this.rooms.delete(roomCode);
    }
  }
}
