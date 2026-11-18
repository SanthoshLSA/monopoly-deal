import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './models/RoomManager.js';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager();

// Broadcast sanitized state to each player in the room individually
function broadcastGameState(game) {
  if (!game) return;
  for (const player of game.players) {
    const playerSocket = io.sockets.sockets.get(player.id);
    if (playerSocket) {
      playerSocket.emit('game_state_update', game.getSanitizedState(player.id));
    }
  }
}

// REST health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeRooms: roomManager.rooms.size,
    timestamp: new Date().toISOString()
  });
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Create Room
  socket.on('create_room', ({ playerName, edition = 'base' }, callback) => {
    try {
      if (!playerName || !playerName.trim()) {
        return callback?.({ error: 'Player name is required.' });
      }
      const hostPlayer = { id: socket.id, name: playerName.trim() };
      const game = roomManager.createRoom(hostPlayer, edition);
      game.onLogCallback = (entry) => {
        io.to(game.roomCode).emit('new_chat_message', {
          id: entry.id,
          senderName: 'SYSTEM',
          isSystem: true,
          message: entry.message,
          timestamp: entry.time
        });
      };
      socket.join(game.roomCode);

      callback?.({ success: true, roomCode: game.roomCode });
      socket.emit('game_state_update', game.getSanitizedState(socket.id));
      console.log(`Room created: ${game.roomCode} by ${playerName}`);
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Join Room
  socket.on('join_room', ({ roomCode, playerName }, callback) => {
    try {
      if (!roomCode || !playerName || !playerName.trim()) {
        return callback?.({ error: 'Room code and player name are required.' });
      }
      const player = { id: socket.id, name: playerName.trim() };
      const game = roomManager.joinRoom(roomCode, player);
      socket.join(game.roomCode);

      callback?.({ success: true, roomCode: game.roomCode });
      broadcastGameState(game);
      console.log(`${playerName} joined room ${game.roomCode}`);
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Start Game
  socket.on('start_game', (data, callback) => {
    try {
      const game = roomManager.getRoomByPlayerId(socket.id);
      if (!game) return callback?.({ error: 'Not in a game room.' });

      game.startGame(socket.id);
      callback?.({ success: true });
      broadcastGameState(game);
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Draw Cards (manual draw on turn start)
  socket.on('draw_cards', (data, callback) => {
    try {
      const game = roomManager.getRoomByPlayerId(socket.id);
      if (!game) return callback?.({ error: 'Not in a game room.' });

      game.playerDrawCards(socket.id);
      callback?.({ success: true });
      broadcastGameState(game);
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Pick High Card from spread deck
  socket.on('pick_high_card', ({ cardIndex }, callback) => {
    try {
      const game = roomManager.getRoomByPlayerId(socket.id);
      if (!game) return callback?.({ error: 'Not in a game room.' });

      game.pickHighCard(socket.id, cardIndex);
      callback?.({ success: true });
      broadcastGameState(game);
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Auto-pick remaining cards if timer runs out or user clicks auto-pick
  socket.on('auto_pick_high_card', (data, callback) => {
    try {
      const game = roomManager.getRoomByPlayerId(socket.id);
      if (!game) return callback?.({ error: 'Not in a game room.' });

      game.autoPickRemainingHighCards();
      callback?.({ success: true });
      broadcastGameState(game);
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Finish Deck Cut Phase and start regular play
  socket.on('finish_deck_cut', (data, callback) => {
    try {
      const game = roomManager.getRoomByPlayerId(socket.id);
      if (!game) return callback?.({ error: 'Not in a game room.' });

      game.finishDeckCut();
      callback?.({ success: true });
      broadcastGameState(game);
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Chat Message
  socket.on('send_chat_message', ({ message }, callback) => {
    try {
      const game = roomManager.getRoomByPlayerId(socket.id);
      if (!game) return callback?.({ error: 'Not in a room.' });
      const player = game.players.find(p => p.id === socket.id);
      if (!player || !message || !message.trim()) return;

      const chatMsg = {
        id: Date.now() + Math.random().toString(36).substr(2, 4),
        senderId: socket.id,
        senderName: player.name,
        message: message.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      io.to(game.roomCode).emit('new_chat_message', chatMsg);
      callback?.({ success: true });
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Play to Bank
  socket.on('play_to_bank', ({ cardId }, callback) => {
    try {
      const game = roomManager.getRoomByPlayerId(socket.id);
      if (!game) return callback?.({ error: 'Not in a room.' });

      game.playToBank(socket.id, cardId);
      callback?.({ success: true });
      broadcastGameState(game);
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Play Property
  socket.on('play_property', ({ cardId, chosenColor }, callback) => {
    try {
      const game = roomManager.getRoomByPlayerId(socket.id);
      if (!game) return callback?.({ error: 'Not in a room.' });

      game.playProperty(socket.id, cardId, chosenColor);
      callback?.({ success: true });
      broadcastGameState(game);
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Move Wildcard (Free action)
  socket.on('move_wildcard', ({ cardId, fromColor, toColor }, callback) => {
    try {
      const game = roomManager.getRoomByPlayerId(socket.id);
      if (!game) return callback?.({ error: 'Not in a room.' });

      game.moveWildcard(socket.id, cardId, fromColor, toColor);
      callback?.({ success: true });
      broadcastGameState(game);
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Play Building (House / Hotel)
  socket.on('play_building', ({ cardId, targetColor }, callback) => {
    try {
      const game = roomManager.getRoomByPlayerId(socket.id);
      if (!game) return callback?.({ error: 'Not in a room.' });

      game.playBuilding(socket.id, cardId, targetColor);
      callback?.({ success: true });
      broadcastGameState(game);
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Play Pass Go
  socket.on('play_pass_go', ({ cardId }, callback) => {
    try {
      const game = roomManager.getRoomByPlayerId(socket.id);
      if (!game) return callback?.({ error: 'Not in a room.' });

      game.playPassGo(socket.id, cardId);
      callback?.({ success: true });
      broadcastGameState(game);
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Play Rent
  socket.on('play_rent', ({ cardId, chosenColor, doubleRentCardId, targetPlayerId }, callback) => {
    try {
      const game = roomManager.getRoomByPlayerId(socket.id);
      if (!game) return callback?.({ error: 'Not in a room.' });

      game.playRent(socket.id, cardId, chosenColor, doubleRentCardId, targetPlayerId);
      callback?.({ success: true });
      broadcastGameState(game);
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Play Deal Breaker
  socket.on('play_deal_breaker', ({ cardId, targetPlayerId, targetColor }, callback) => {
    try {
      const game = roomManager.getRoomByPlayerId(socket.id);
      if (!game) return callback?.({ error: 'Not in a room.' });

      game.playDealBreaker(socket.id, cardId, targetPlayerId, targetColor);
      callback?.({ success: true });
      broadcastGameState(game);
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Play Sly Deal
  socket.on('play_sly_deal', ({ cardId, targetPlayerId, targetCardId, targetColor }, callback) => {
    try {
      const game = roomManager.getRoomByPlayerId(socket.id);
      if (!game) return callback?.({ error: 'Not in a room.' });

      game.playSlyDeal(socket.id, cardId, targetPlayerId, targetCardId, targetColor);
      callback?.({ success: true });
      broadcastGameState(game);
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Play Forced Deal
  socket.on('play_forced_deal', ({ cardId, targetPlayerId, myCardId, myColor, theirCardId, theirColor }, callback) => {
    try {
      const game = roomManager.getRoomByPlayerId(socket.id);
      if (!game) return callback?.({ error: 'Not in a room.' });

      game.playForcedDeal(socket.id, cardId, targetPlayerId, myCardId, myColor, theirCardId, theirColor);
      callback?.({ success: true });
      broadcastGameState(game);
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Play Debt Collector
  socket.on('play_debt_collector', ({ cardId, targetPlayerId }, callback) => {
    try {
      const game = roomManager.getRoomByPlayerId(socket.id);
      if (!game) return callback?.({ error: 'Not in a room.' });

      game.playDebtCollector(socket.id, cardId, targetPlayerId);
      callback?.({ success: true });
      broadcastGameState(game);
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Play Birthday
  socket.on('play_birthday', ({ cardId }, callback) => {
    try {
      const game = roomManager.getRoomByPlayerId(socket.id);
      if (!game) return callback?.({ error: 'Not in a room.' });

      game.playBirthday(socket.id, cardId);
      callback?.({ success: true });
      broadcastGameState(game);
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Respond Just Say No
  socket.on('respond_just_say_no', ({ cardId }, callback) => {
    try {
      const game = roomManager.getRoomByPlayerId(socket.id);
      if (!game) return callback?.({ error: 'Not in a room.' });

      game.respondJustSayNo(socket.id, cardId);
      callback?.({ success: true });
      broadcastGameState(game);
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Resolve Reaction (e.g. accepted or timer expired)
  socket.on('resolve_reaction', ({ accepted = true }, callback) => {
    try {
      const game = roomManager.getRoomByPlayerId(socket.id);
      if (!game) return callback?.({ error: 'Not in a room.' });

      game.resolveReaction(socket.id, accepted);
      callback?.({ success: true });
      broadcastGameState(game);
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Submit Payment
  socket.on('submit_payment', ({ paymentItems }, callback) => {
    try {
      const game = roomManager.getRoomByPlayerId(socket.id);
      if (!game) return callback?.({ error: 'Not in a room.' });

      game.submitPayment(socket.id, paymentItems);
      callback?.({ success: true });
      broadcastGameState(game);
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Discard Excess Cards
  socket.on('discard_cards', ({ cardIds }, callback) => {
    try {
      const game = roomManager.getRoomByPlayerId(socket.id);
      if (!game) return callback?.({ error: 'Not in a room.' });

      game.discardCards(socket.id, cardIds);
      callback?.({ success: true });
      broadcastGameState(game);
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // End Turn
  socket.on('end_turn', (data, callback) => {
    try {
      const game = roomManager.getRoomByPlayerId(socket.id);
      if (!game) return callback?.({ error: 'Not in a room.' });

      game.endTurn(socket.id);
      callback?.({ success: true });
      broadcastGameState(game);
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    const game = roomManager.leaveRoom(socket.id);
    if (game) {
      broadcastGameState(game);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Monopoly Deal Server running on port ${PORT}`);
});
