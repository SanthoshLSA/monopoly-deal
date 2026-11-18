import { getDeckForEdition, PROPERTY_SETS } from './decks/deckRegistry.js';

const STANDARD_SUITS = [
  { key: 'spades', symbol: '♠', name: 'Spades', color: '#ffffff', power: 4 },
  { key: 'hearts', symbol: '♥', name: 'Hearts', color: '#ef4444', power: 3 },
  { key: 'diamonds', symbol: '♦', name: 'Diamonds', color: '#ef4444', power: 2 },
  { key: 'clubs', symbol: '♣', name: 'Clubs', color: '#ffffff', power: 1 }
];

const STANDARD_RANKS = [
  { rank: '2', value: 2, label: '2' },
  { rank: '3', value: 3, label: '3' },
  { rank: '4', value: 4, label: '4' },
  { rank: '5', value: 5, label: '5' },
  { rank: '6', value: 6, label: '6' },
  { rank: '7', value: 7, label: '7' },
  { rank: '8', value: 8, label: '8' },
  { rank: '9', value: 9, label: '9' },
  { rank: '10', value: 10, label: '10' },
  { rank: 'J', value: 11, label: 'Jack' },
  { rank: 'Q', value: 12, label: 'Queen' },
  { rank: 'K', value: 13, label: 'King' },
  { rank: 'A', value: 14, label: 'Ace' }
];

function generateStandardDeck() {
  const deck = [];
  for (const suit of STANDARD_SUITS) {
    for (const rank of STANDARD_RANKS) {
      deck.push({
        id: `std_${rank.rank}_${suit.key}`,
        rank: rank.rank,
        label: rank.label,
        value: rank.value,
        suit: suit.key,
        suitSymbol: suit.symbol,
        suitName: suit.name,
        suitColor: suit.color,
        suitPower: suit.power,
        score: rank.value * 10 + suit.power // 21 to 144, strictly unique
      });
    }
  }
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export class GameState {
  constructor(roomCode, hostPlayer, edition = 'base') {
    this.roomCode = roomCode;
    this.edition = edition;
    this.status = 'waiting'; // 'waiting', 'in_progress', 'completed'
    this.players = [
      {
        id: hostPlayer.id,
        name: hostPlayer.name,
        isHost: true,
        hand: [],
        bank: [],
        properties: this.createEmptyProperties(),
        connected: true
      }
    ];
    this.currentTurnIndex = 0;
    this.turnActionsRemaining = 3;
    this.turnActionsPlayed = 0;
    this.turnPhase = 'action'; // 'action', 'pending_reaction', 'pending_payment', 'discard'
    this.drawPile = [];
    this.discardPile = [];
    this.log = [];
    this.winner = null;

    // Reaction & Payment State
    this.pendingAction = null; 
    /*
      pendingAction: {
        type: 'rent' | 'deal_breaker' | 'sly_deal' | 'forced_deal' | 'debt_collector' | 'its_my_birthday',
        sourcePlayerId: string,
        targetPlayerIds: string[], // list of targeted players who still need to resolve
        targetColor?: string,
        targetCardId?: string,
        myCardId?: string,
        amount?: number,
        actionCard: object,
        doubleRentCard?: object,
        justSayNoChain: [ { playerId: string, card: object } ]
      }
    */
  }

  createEmptyProperties() {
    const props = {};
    for (const key of Object.keys(PROPERTY_SETS)) {
      props[key] = {
        cards: [],
        houses: 0,
        hotels: 0
      };
    }
    return props;
  }

  addPlayer(player) {
    if (this.status !== 'waiting') {
      throw new Error('Game has already started.');
    }
    if (this.players.length >= 5) {
      throw new Error('Room is full (maximum 5 players).');
    }
    if (this.players.some(p => p.id === player.id)) {
      return;
    }
    this.players.push({
      id: player.id,
      name: player.name,
      isHost: false,
      hand: [],
      bank: [],
      properties: this.createEmptyProperties(),
      connected: true
    });
    this.addLog(`${player.name} joined the room.`);
  }

  removePlayer(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return;

    if (this.status === 'waiting') {
      this.players = this.players.filter(p => p.id !== playerId);
      if (player.isHost && this.players.length > 0) {
        this.players[0].isHost = true;
      }
      this.addLog(`${player.name} left the room.`);
    } else {
      player.connected = false;
      this.addLog(`${player.name} disconnected.`);
      // Check if current turn player disconnected
      if (this.getCurrentPlayer()?.id === playerId) {
        this.endTurn(playerId, true);
      }
    }
  }

  startGame(hostPlayerId) {
    if (this.status !== 'waiting') throw new Error('Game already started.');
    const host = this.players.find(p => p.id === hostPlayerId);
    if (!host || !host.isHost) throw new Error('Only the host can start the game.');
    if (this.players.length < 2) throw new Error('Need at least 2 players to start.');

    this.status = 'in_progress';
    this.initializeDeck();
    this.dealInitialHands();
    this.initializeDeckCut();
    this.startingPlayerIndex = 0;
    this.currentTurnIndex = 0;
    this.startTurn();
    this.addLog(`Game started! Spread out deck of cards to determine turn order by high card.`);
  }

  initializeDeckCut() {
    this.deckCut = {
      active: true,
      resolved: false,
      deck: generateStandardDeck(),
      picks: {},
      rankings: []
    };
  }

  pickHighCard(playerId, cardIndex) {
    if (!this.deckCut || !this.deckCut.active) {
      throw new Error('Deck cut phase is not active.');
    }
    const player = this.players.find(p => p.id === playerId);
    if (!player) throw new Error('Player not found.');

    if (this.deckCut.picks[playerId]) {
      throw new Error('You have already picked a card from the deck.');
    }

    if (cardIndex < 0 || cardIndex >= this.deckCut.deck.length) {
      throw new Error('Invalid card index in deck spread.');
    }

    const isAlreadyPicked = Object.values(this.deckCut.picks).some(p => p.cardIndex === cardIndex);
    if (isAlreadyPicked) {
      throw new Error('That card has already been picked by another player.');
    }

    const card = this.deckCut.deck[cardIndex];
    this.deckCut.picks[playerId] = {
      playerId,
      playerName: player.name,
      cardIndex,
      card
    };

    this.addLog(`${player.name} picked a card from the spread: ${card.rank}${card.suitSymbol}`);

    // If all players have picked, automatically resolve turn order
    if (Object.keys(this.deckCut.picks).length >= this.players.length) {
      this.resolveHighCardOrder();
    }
  }

  autoPickRemainingHighCards() {
    if (!this.deckCut || !this.deckCut.active) return;
    const pickedIndices = new Set(Object.values(this.deckCut.picks).map(p => p.cardIndex));
    const availableIndices = [];
    for (let i = 0; i < this.deckCut.deck.length; i++) {
      if (!pickedIndices.has(i)) availableIndices.push(i);
    }

    for (const player of this.players) {
      if (!this.deckCut.picks[player.id] && availableIndices.length > 0) {
        const randIdx = Math.floor(Math.random() * availableIndices.length);
        const cardIndex = availableIndices.splice(randIdx, 1)[0];
        const card = this.deckCut.deck[cardIndex];
        this.deckCut.picks[player.id] = {
          playerId: player.id,
          playerName: player.name,
          cardIndex,
          card
        };
        this.addLog(`${player.name} drew ${card.rank}${card.suitSymbol} from the spread.`);
      }
    }

    this.resolveHighCardOrder();
  }

  resolveHighCardOrder() {
    if (!this.deckCut || this.deckCut.resolved) return;

    // Sort picks by score descending (high card first)
    const sortedPicks = Object.values(this.deckCut.picks).sort((a, b) => b.card.score - a.card.score);
    this.deckCut.rankings = sortedPicks.map((pick, idx) => ({
      ...pick,
      rank: idx + 1
    }));
    this.deckCut.resolved = true;

    // Reorder this.players according to high card ranking
    const orderedPlayers = [];
    for (const pick of sortedPicks) {
      const p = this.players.find(x => x.id === pick.playerId);
      if (p) orderedPlayers.push(p);
    }
    // Add any remaining
    for (const p of this.players) {
      if (!orderedPlayers.some(x => x.id === p.id)) orderedPlayers.push(p);
    }

    this.players = orderedPlayers;
    this.startingPlayerIndex = 0;
    this.currentTurnIndex = 0;

    const summary = sortedPicks.map((p, i) => `${i + 1}. ${p.playerName} (${p.card.rank}${p.card.suitSymbol})`).join(' | ');
    this.addLog(`High card order: ${summary}. ${this.getCurrentPlayer().name} goes first!`);
  }

  finishDeckCut() {
    if (this.deckCut) {
      if (!this.deckCut.resolved) {
        this.autoPickRemainingHighCards();
      }
      this.deckCut.active = false;
    }
  }

  initializeDeck() {
    const deck = getDeckForEdition(this.edition);
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    this.drawPile = deck;
    this.discardPile = [];
  }

  dealInitialHands() {
    // Each player starts with 5 cards
    for (let i = 0; i < 5; i++) {
      for (const player of this.players) {
        if (this.drawPile.length === 0) this.reshuffleDiscardIntoDraw();
        const card = this.drawPile.pop();
        if (card) player.hand.push(card);
      }
    }
  }

  reshuffleDiscardIntoDraw() {
    if (this.discardPile.length === 0) return;
    const cards = [...this.discardPile];
    this.discardPile = [];
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    this.drawPile = cards;
    this.addLog('Draw pile was empty. Reshuffled discard pile into draw pile.');
  }

  drawCards(player, count) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
      if (this.drawPile.length === 0) this.reshuffleDiscardIntoDraw();
      if (this.drawPile.length > 0) {
        const card = this.drawPile.pop();
        player.hand.push(card);
        drawn.push(card);
      }
    }
    return drawn;
  }

  getCurrentPlayer() {
    return this.players[this.currentTurnIndex];
  }

  startTurn() {
    const player = this.getCurrentPlayer();
    if (!player) return;

    this.turnActionsRemaining = 3;
    this.turnActionsPlayed = 0;
    this.turnPhase = 'draw';
    this.pendingAction = null;
    this.addLog(`${player.name}'s turn started. Click the draw pile to draw cards.`);
  }

  playerDrawCards(playerId) {
    this.validateTurn(playerId, true);
    if (this.turnPhase !== 'draw') {
      throw new Error('Cards have already been drawn for this turn.');
    }
    const player = this.getCurrentPlayer();
    const cardsToDraw = player.hand.length === 0 ? 5 : 2;
    this.drawCards(player, cardsToDraw);
    this.turnPhase = 'action';
    this.addLog(`${player.name} drew ${cardsToDraw} card(s) from the draw pile.`);
  }

  spendAction() {
    if (this.turnActionsRemaining <= 0) {
      throw new Error('No actions remaining this turn.');
    }
    this.turnActionsRemaining--;
    this.turnActionsPlayed++;
  }

  discardCard(card) {
    this.discardPile.push(card);
  }

  addLog(message) {
    const entry = {
      id: Date.now() + Math.random().toString(36).substr(2, 4),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message
    };
    this.latestCommentary = {
      id: entry.id,
      text: message,
      timestamp: Date.now()
    };
    this.log.unshift(entry);
    if (this.log.length > 80) this.log.pop();
    if (this.onLogCallback) {
      this.onLogCallback(entry);
    }
  }

  // --- ACTIONS ---

  // 1. Play Money or Action card into Bank
  playToBank(playerId, cardId) {
    this.validateTurn(playerId);
    const player = this.getCurrentPlayer();
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) throw new Error('Card not found in hand.');

    const card = player.hand[cardIndex];
    if (card.value <= 0) {
      throw new Error('This card has no monetary value and cannot be banked.');
    }

    this.spendAction();
    player.hand.splice(cardIndex, 1);
    player.bank.push(card);
    this.addLog(`${player.name} banked ${card.name} (Value: $${card.value}M).`);
    this.checkWinCondition();
  }

  // 2. Play Property or Wildcard to Property Area
  playProperty(playerId, cardId, chosenColor) {
    this.validateTurn(playerId);
    const player = this.getCurrentPlayer();
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) throw new Error('Card not found in hand.');

    const card = player.hand[cardIndex];
    if (card.type !== 'property' && card.type !== 'wildcard') {
      throw new Error('Card is not a property or property wildcard.');
    }

    let targetColor = chosenColor;
    if (card.type === 'property') {
      targetColor = card.color;
    } else if (card.type === 'wildcard') {
      if (!card.colors.includes(chosenColor)) {
        throw new Error(`Wildcard cannot be used as color: ${chosenColor}`);
      }
      // Only rainbow wildcards (multi-color) require a base property card of chosenColor in play.
      // Double wildcards (dual-color) can be played freely to start or join a set.
      const isRainbow = card.colors.length > 2;
      if (isRainbow) {
        const toSet = player.properties[chosenColor];
        const hasBaseCard = toSet && toSet.cards.some(c => c.type === 'property' && (!c.colors || c.colors.length <= 2));
        if (!hasBaseCard) {
          throw new Error(`Rainbow wildcard cannot be placed in ${PROPERTY_SETS[chosenColor]?.name || chosenColor} because you do not have a base property card of that color in play.`);
        }
      }
      card.currentColor = chosenColor;
    }

    this.spendAction();
    player.hand.splice(cardIndex, 1);
    player.properties[targetColor].cards.push(card);
    this.addLog(`${player.name} placed ${card.name} in their ${PROPERTY_SETS[targetColor]?.name || targetColor} property set.`);
    this.checkWinCondition();
  }

  // 3. Move/Reassign Wildcard between Sets (Free action per rules)
  moveWildcard(playerId, cardId, fromColor, toColor) {
    this.validateTurn(playerId);
    const player = this.getCurrentPlayer();
    const fromSet = player.properties[fromColor];
    if (!fromSet) throw new Error('Source property set does not exist.');

    const cardIndex = fromSet.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) throw new Error('Card not found in source set.');

    const card = fromSet.cards[cardIndex];
    if (card.type !== 'wildcard') throw new Error('Only wildcard properties can be moved.');
    if (!card.colors.includes(toColor)) throw new Error('Wildcard is not valid for the target color.');

    // Only rainbow wildcards (multi-color) require a base property card of toColor to be in play.
    // Double wildcards (dual-color) can be changed freely even without a base card and even in complete sets!
    const isRainbow = card.colors.length > 2;
    if (isRainbow) {
      const toSet = player.properties[toColor];
      const hasBaseCard = toSet && toSet.cards.some(c => c.type === 'property' && (!c.colors || c.colors.length <= 2));
      if (!hasBaseCard) {
        throw new Error(`Cannot move rainbow wildcard to ${PROPERTY_SETS[toColor]?.name || toColor} because you do not have a base property card of that color in play.`);
      }
    }

    // If fromSet had houses/hotels and removing this card breaks the set size below full,
    // safely remove the houses/hotels so the game never gets stuck
    const setSize = PROPERTY_SETS[fromColor]?.size || 2;
    if (fromSet.cards.length - 1 < setSize) {
      if (fromSet.hotels > 0) {
        fromSet.hotels = 0;
        this.addLog(`${player.name}'s ${PROPERTY_SETS[fromColor]?.name || fromColor} set is no longer full. Hotel removed.`);
      }
      if (fromSet.houses > 0) {
        fromSet.houses = 0;
        this.addLog(`${player.name}'s ${PROPERTY_SETS[fromColor]?.name || fromColor} set is no longer full. House removed.`);
      }
    }

    fromSet.cards.splice(cardIndex, 1);
    card.currentColor = toColor;
    if (!player.properties[toColor]) {
      player.properties[toColor] = { cards: [], houses: 0, hotels: 0 };
    }
    player.properties[toColor].cards.push(card);
    this.addLog(`${player.name} moved ${card.name} from ${PROPERTY_SETS[fromColor].name} to ${PROPERTY_SETS[toColor].name}.`);
    this.checkWinCondition();
  }

  // 4. Play House or Hotel
  playBuilding(playerId, cardId, targetColor) {
    this.validateTurn(playerId);
    const player = this.getCurrentPlayer();
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) throw new Error('Card not found in hand.');

    const card = player.hand[cardIndex];
    const set = player.properties[targetColor];
    const setInfo = PROPERTY_SETS[targetColor];
    if (!set || !setInfo) throw new Error('Invalid color set.');

    if (targetColor === 'railroad' || targetColor === 'utility') {
      throw new Error('Houses and Hotels cannot be placed on Railroads or Utilities.');
    }

    const isComplete = this.isSetComplete(set.cards, targetColor);
    if (!isComplete) {
      throw new Error(`You must have a completed ${setInfo.name} set before adding buildings.`);
    }

    if (card.actionType === 'house') {
      if (set.houses >= 1) throw new Error('This set already has a House.');
      this.spendAction();
      player.hand.splice(cardIndex, 1);
      set.houses = 1;
      this.discardCard(card);
      this.addLog(`${player.name} added a House to their complete ${setInfo.name} set!`);
    } else if (card.actionType === 'hotel') {
      if (set.houses === 0) throw new Error('Must have a House on this set before adding a Hotel.');
      if (set.hotels >= 1) throw new Error('This set already has a Hotel.');
      this.spendAction();
      player.hand.splice(cardIndex, 1);
      set.hotels = 1;
      this.discardCard(card);
      this.addLog(`${player.name} added a Hotel to their complete ${setInfo.name} set!`);
    } else {
      throw new Error('Invalid building card.');
    }
  }

  // 5. Play Pass Go
  playPassGo(playerId, cardId) {
    this.validateTurn(playerId);
    const player = this.getCurrentPlayer();
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) throw new Error('Card not found in hand.');

    const card = player.hand[cardIndex];
    if (card.actionType !== 'pass_go') throw new Error('Not a Pass Go card.');

    this.spendAction();
    player.hand.splice(cardIndex, 1);
    this.discardCard(card);
    const drawn = this.drawCards(player, 2);
    this.addLog(`${player.name} played Pass Go and drew 2 cards.`);
  }

  // 6. Play Rent Card
  playRent(playerId, cardId, chosenColor, doubleRentCardId, targetPlayerId) {
    this.validateTurn(playerId);
    const player = this.getCurrentPlayer();
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) throw new Error('Rent card not found in hand.');

    const card = player.hand[cardIndex];
    if (card.type !== 'rent') throw new Error('Not a rent card.');

    // Check color validity
    if (!card.colors.includes(chosenColor)) {
      throw new Error(`This rent card cannot be used for ${chosenColor}`);
    }

    const set = player.properties[chosenColor];
    if (!set || set.cards.length === 0) {
      throw new Error(`You do not own any properties in ${PROPERTY_SETS[chosenColor]?.name || chosenColor} to collect rent on.`);
    }

    // Calculate rent base
    const setInfo = PROPERTY_SETS[chosenColor];
    const count = Math.min(set.cards.length, setInfo.size);
    let rentAmount = setInfo.rents[count - 1] || 1;

    // Add house / hotel bonus
    if (set.houses > 0) rentAmount += 3;
    if (set.hotels > 0) rentAmount += 4;

    // Determine target players and validate they have assets BEFORE spending actions
    let targets = [];
    if (card.isWildRent) {
      if (!targetPlayerId) throw new Error('Wild Rent requires selecting a target player.');
      if (targetPlayerId === playerId) throw new Error('Cannot target yourself.');
      const targetP = this.players.find(p => p.id === targetPlayerId);
      if (!targetP) throw new Error('Target player not found.');
      if (this.calculatePlayerNetWorth(targetP) === 0) {
        throw new Error(`Cannot charge rent to ${targetP.name} because they have no money or properties in play.`);
      }
      targets = [targetPlayerId];
    } else {
      const eligibleTargets = this.players
        .filter(p => p.id !== playerId && p.connected && this.calculatePlayerNetWorth(p) > 0)
        .map(p => p.id);
      if (eligibleTargets.length === 0) {
        throw new Error('None of your opponents have any money or properties to pay rent.');
      }
      targets = eligibleTargets;
    }

    // Check Double The Rent
    let doubleCard = null;
    let actionsNeeded = 1;
    if (doubleRentCardId) {
      actionsNeeded = 2;
      if (this.turnActionsRemaining < 2) {
        throw new Error('Need at least 2 actions remaining to play Rent with Double The Rent.');
      }
      const doubleIdx = player.hand.findIndex(c => c.id === doubleRentCardId && c.actionType === 'double_the_rent');
      if (doubleIdx === -1) throw new Error('Double The Rent card not found in hand.');
      doubleCard = player.hand[doubleIdx];
      rentAmount *= 2;
    } else {
      this.spendAction();
    }

    if (doubleCard) {
      this.spendAction();
      this.spendAction();
      // Remove double card
      const dIdx = player.hand.findIndex(c => c.id === doubleRentCardId);
      player.hand.splice(dIdx, 1);
      this.discardCard(doubleCard);
    }

    // Remove rent card
    const rIdx = player.hand.findIndex(c => c.id === cardId);
    player.hand.splice(rIdx, 1);
    this.discardCard(card);

    this.pendingAction = {
      type: 'rent',
      sourcePlayerId: playerId,
      targetPlayerIds: targets,
      amount: rentAmount,
      chosenColor,
      actionCard: card,
      justSayNoChain: []
    };
    this.turnPhase = 'pending_reaction';

    this.addLog(`${player.name} played Rent for ${setInfo.name}! Charging ${targets.length === 1 ? 'player' : 'all players'} $${rentAmount}M.`);
  }

  // 7. Play Deal Breaker (steal complete set)
  playDealBreaker(playerId, cardId, targetPlayerId, targetColor) {
    this.validateTurn(playerId);
    const player = this.getCurrentPlayer();
    const cardIndex = player.hand.findIndex(c => c.id === cardId && c.actionType === 'deal_breaker');
    if (cardIndex === -1) throw new Error('Deal Breaker card not in hand.');

    const targetPlayer = this.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer || targetPlayer.id === playerId) throw new Error('Invalid target player.');

    const targetSet = targetPlayer.properties[targetColor];
    if (!targetSet || !this.isSetComplete(targetSet.cards, targetColor)) {
      throw new Error(`Target does not have a complete ${PROPERTY_SETS[targetColor]?.name} set.`);
    }

    this.spendAction();
    const card = player.hand[cardIndex];
    player.hand.splice(cardIndex, 1);
    this.discardCard(card);

    this.pendingAction = {
      type: 'deal_breaker',
      sourcePlayerId: playerId,
      targetPlayerIds: [targetPlayerId],
      targetColor,
      actionCard: card,
      justSayNoChain: []
    };
    this.turnPhase = 'pending_reaction';

    this.addLog(`${player.name} played Deal Breaker targeting ${targetPlayer.name}'s complete ${PROPERTY_SETS[targetColor].name} set!`);
  }

  // 8. Play Sly Deal (steal single property not in complete set)
  playSlyDeal(playerId, cardId, targetPlayerId, targetCardId, targetColor) {
    this.validateTurn(playerId);
    const player = this.getCurrentPlayer();
    const cardIndex = player.hand.findIndex(c => c.id === cardId && c.actionType === 'sly_deal');
    if (cardIndex === -1) throw new Error('Sly Deal card not in hand.');

    const targetPlayer = this.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer || targetPlayer.id === playerId) throw new Error('Invalid target player.');

    const targetSet = targetPlayer.properties[targetColor];
    if (!targetSet) throw new Error('Target color set not found.');
    if (this.isSetComplete(targetSet.cards, targetColor)) {
      throw new Error('Cannot steal from a complete set with Sly Deal.');
    }

    const cardToSteal = targetSet.cards.find(c => c.id === targetCardId);
    if (!cardToSteal) throw new Error('Card to steal not found in target set.');

    this.spendAction();
    const card = player.hand[cardIndex];
    player.hand.splice(cardIndex, 1);
    this.discardCard(card);

    this.pendingAction = {
      type: 'sly_deal',
      sourcePlayerId: playerId,
      targetPlayerIds: [targetPlayerId],
      targetCardId,
      targetColor,
      cardName: cardToSteal.name,
      actionCard: card,
      justSayNoChain: []
    };
    this.turnPhase = 'pending_reaction';

    this.addLog(`${player.name} played Sly Deal to steal ${cardToSteal.name} from ${targetPlayer.name}!`);
  }

  // 9. Play Forced Deal (swap properties not in complete sets)
  playForcedDeal(playerId, cardId, targetPlayerId, myCardId, myColor, theirCardId, theirColor) {
    this.validateTurn(playerId);
    const player = this.getCurrentPlayer();
    const cardIndex = player.hand.findIndex(c => c.id === cardId && c.actionType === 'forced_deal');
    if (cardIndex === -1) throw new Error('Forced Deal card not in hand.');

    const targetPlayer = this.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer || targetPlayer.id === playerId) throw new Error('Invalid target player.');

    const mySet = player.properties[myColor];
    if (!mySet || this.isSetComplete(mySet.cards, myColor)) {
      throw new Error('Cannot give a card from a complete set in Forced Deal.');
    }
    const myCard = mySet.cards.find(c => c.id === myCardId);
    if (!myCard) throw new Error('Your selected card was not found.');

    const theirSet = targetPlayer.properties[theirColor];
    if (!theirSet || this.isSetComplete(theirSet.cards, theirColor)) {
      throw new Error('Cannot take a card from a complete set in Forced Deal.');
    }
    const theirCard = theirSet.cards.find(c => c.id === theirCardId);
    if (!theirCard) throw new Error("Target player's selected card was not found.");

    this.spendAction();
    const card = player.hand[cardIndex];
    player.hand.splice(cardIndex, 1);
    this.discardCard(card);

    this.pendingAction = {
      type: 'forced_deal',
      sourcePlayerId: playerId,
      targetPlayerIds: [targetPlayerId],
      myCardId,
      myColor,
      theirCardId,
      theirColor,
      actionCard: card,
      justSayNoChain: []
    };
    this.turnPhase = 'pending_reaction';

    this.addLog(`${player.name} played Forced Deal: swapping ${myCard.name} for ${targetPlayer.name}'s ${theirCard.name}!`);
  }

  // 10. Play Debt Collector ($5M from one player)
  playDebtCollector(playerId, cardId, targetPlayerId) {
    this.validateTurn(playerId);
    const player = this.getCurrentPlayer();
    const cardIndex = player.hand.findIndex(c => c.id === cardId && c.actionType === 'debt_collector');
    if (cardIndex === -1) throw new Error('Debt Collector card not in hand.');

    const targetPlayer = this.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer || targetPlayer.id === playerId) throw new Error('Invalid target player.');

    this.spendAction();
    const card = player.hand[cardIndex];
    player.hand.splice(cardIndex, 1);
    this.discardCard(card);

    this.pendingAction = {
      type: 'debt_collector',
      sourcePlayerId: playerId,
      targetPlayerIds: [targetPlayerId],
      amount: 5,
      actionCard: card,
      justSayNoChain: []
    };
    this.turnPhase = 'pending_reaction';

    this.addLog(`${player.name} played Debt Collector demanding $5M from ${targetPlayer.name}!`);
  }

  // 11. Play It's My Birthday ($2M from all players)
  playBirthday(playerId, cardId) {
    this.validateTurn(playerId);
    const player = this.getCurrentPlayer();
    const cardIndex = player.hand.findIndex(c => c.id === cardId && c.actionType === 'its_my_birthday');
    if (cardIndex === -1) throw new Error("It's My Birthday card not in hand.");

    const targets = this.players.filter(p => p.id !== playerId && p.connected).map(p => p.id);
    if (targets.length === 0) {
      throw new Error('No opponents available.');
    }

    this.spendAction();
    const card = player.hand[cardIndex];
    player.hand.splice(cardIndex, 1);
    this.discardCard(card);

    this.pendingAction = {
      type: 'its_my_birthday',
      sourcePlayerId: playerId,
      targetPlayerIds: targets,
      amount: 2,
      actionCard: card,
      justSayNoChain: []
    };
    this.turnPhase = 'pending_reaction';

    this.addLog(`${player.name} played It's My Birthday! Demanding $2M from all players.`);
  }

  // --- REACTION & RESOLUTION SYSTEM ---

  // Player responds with Just Say No
  respondJustSayNo(playerId, cardId) {
    if (!this.pendingAction) throw new Error('No active action to respond to.');
    const respondingPlayer = this.players.find(p => p.id === playerId);
    if (!respondingPlayer) throw new Error('Player not found.');

    const cardIndex = respondingPlayer.hand.findIndex(c => c.id === cardId && c.actionType === 'just_say_no');
    if (cardIndex === -1) throw new Error('Just Say No card not in hand.');

    const card = respondingPlayer.hand[cardIndex];
    respondingPlayer.hand.splice(cardIndex, 1);
    this.discardCard(card);

    this.pendingAction.justSayNoChain.push({
      playerId,
      playerName: respondingPlayer.name,
      card
    });

    this.addLog(`${respondingPlayer.name} played: "JUST SAY NO!"`);

    const action = this.pendingAction;
    const isTarget = action.targetPlayerIds.includes(playerId);
    const sourcePlayer = this.players.find(p => p.id === action.sourcePlayerId);

    // If target played JSN and source cannot counter, resolve immediately!
    if (isTarget) {
      const sourceHasJsn = sourcePlayer && sourcePlayer.hand.some(c => c.actionType === 'just_say_no');
      if (!sourceHasJsn) {
        this.addLog(`Action ${action.type.replace(/_/g, ' ')} against ${respondingPlayer.name} was successfully cancelled by Just Say No!`);
        action.targetPlayerIds = action.targetPlayerIds.filter(id => id !== playerId);
        if (action.targetPlayerIds.length === 0) {
          this.pendingAction = null;
          this.turnPhase = 'action';
          this.addLog(`Action was completely blocked.`);
        }
        return;
      }
    }
  }

  // Player accepts action or counter window expires
  resolveReaction(playerId, accepted = true) {
    if (!this.pendingAction) return;
    const action = this.pendingAction;

    // Check the reaction chain: if the last reaction was from a target defending, it is BLOCKED!
    const lastReaction = action.justSayNoChain[action.justSayNoChain.length - 1];
    if (lastReaction && lastReaction.playerId !== action.sourcePlayerId) {
      const targetName = lastReaction.playerName || 'Target';
      this.addLog(`Action ${action.type.replace(/_/g, ' ')} against ${targetName} was successfully blocked by Just Say No!`);
      action.targetPlayerIds = action.targetPlayerIds.filter(id => id !== lastReaction.playerId);
      if (action.targetPlayerIds.length === 0) {
        this.pendingAction = null;
        this.turnPhase = 'action';
        return;
      }
    }

    // Action goes through for remaining targets!
    if (['rent', 'debt_collector', 'its_my_birthday'].includes(action.type)) {
      this.turnPhase = 'pending_payment';
    } else if (action.type === 'deal_breaker') {
      this.executeDealBreaker(action);
      this.pendingAction = null;
      this.turnPhase = 'action';
      this.checkWinCondition();
    } else if (action.type === 'sly_deal') {
      this.executeSlyDeal(action);
      this.pendingAction = null;
      this.turnPhase = 'action';
      this.checkWinCondition();
    } else if (action.type === 'forced_deal') {
      this.executeForcedDeal(action);
      this.pendingAction = null;
      this.turnPhase = 'action';
      this.checkWinCondition();
    }
  }

  executeDealBreaker(action) {
    const source = this.players.find(p => p.id === action.sourcePlayerId);
    const target = this.players.find(p => p.id === action.targetPlayerIds[0]);
    if (!source || !target) return;

    const stolenSet = target.properties[action.targetColor];
    if (!stolenSet) return;

    // Transfer all cards and buildings
    if (!source.properties[action.targetColor]) {
      source.properties[action.targetColor] = { cards: [], houses: 0, hotels: 0 };
    }
    source.properties[action.targetColor].cards.push(...stolenSet.cards);
    source.properties[action.targetColor].houses += stolenSet.houses;
    source.properties[action.targetColor].hotels += stolenSet.hotels;

    target.properties[action.targetColor] = {
      cards: [],
      houses: 0,
      hotels: 0
    };

    this.addLog(`${source.name} successfully stole ${target.name}'s entire ${PROPERTY_SETS[action.targetColor]?.name || action.targetColor} set!`);
  }

  executeSlyDeal(action) {
    const source = this.players.find(p => p.id === action.sourcePlayerId);
    const target = this.players.find(p => p.id === action.targetPlayerIds[0]);
    if (!source || !target) return;

    const targetSet = target.properties[action.targetColor];
    if (!targetSet) return;
    const cardIndex = targetSet.cards.findIndex(c => c.id === action.targetCardId);
    if (cardIndex === -1) return;

    const [stolenCard] = targetSet.cards.splice(cardIndex, 1);
    const color = stolenCard.type === 'wildcard' ? (stolenCard.currentColor || action.targetColor) : stolenCard.color;
    if (!source.properties[color]) {
      source.properties[color] = { cards: [], houses: 0, hotels: 0 };
    }
    stolenCard.currentColor = color;
    source.properties[color].cards.push(stolenCard);

    this.addLog(`${source.name} successfully stole ${stolenCard.name} from ${target.name}!`);
  }

  executeForcedDeal(action) {
    const source = this.players.find(p => p.id === action.sourcePlayerId);
    const target = this.players.find(p => p.id === action.targetPlayerIds[0]);
    if (!source || !target) return;

    const mySet = source.properties[action.myColor];
    if (!mySet) return;
    const myCardIndex = mySet.cards.findIndex(c => c.id === action.myCardId);
    if (myCardIndex === -1) return;

    const theirSet = target.properties[action.theirColor];
    if (!theirSet) return;
    const theirCardIndex = theirSet.cards.findIndex(c => c.id === action.theirCardId);
    if (theirCardIndex === -1) return;

    const [myCard] = mySet.cards.splice(myCardIndex, 1);
    const [theirCard] = theirSet.cards.splice(theirCardIndex, 1);

    const theirNewColor = myCard.type === 'wildcard' ? (myCard.currentColor || action.myColor) : myCard.color;
    if (!target.properties[theirNewColor]) {
      target.properties[theirNewColor] = { cards: [], houses: 0, hotels: 0 };
    }
    myCard.currentColor = theirNewColor;
    target.properties[theirNewColor].cards.push(myCard);

    const myNewColor = theirCard.type === 'wildcard' ? (theirCard.currentColor || action.theirColor) : theirCard.color;
    if (!source.properties[myNewColor]) {
      source.properties[myNewColor] = { cards: [], houses: 0, hotels: 0 };
    }
    theirCard.currentColor = myNewColor;
    source.properties[myNewColor].cards.push(theirCard);

    this.addLog(`${source.name} swapped ${myCard.name} for ${target.name}'s ${theirCard.name}!`);
  }

  // --- PAYMENT SUBMISSION ---
  submitPayment(payerId, paymentItems) {
    /*
      paymentItems: [
        { type: 'bank', cardId: '...' },
        { type: 'property', cardId: '...', color: '...' }
      ]
    */
    if (!this.pendingAction) throw new Error('No pending payment.');
    const action = this.pendingAction;
    const payer = this.players.find(p => p.id === payerId);
    const recipient = this.players.find(p => p.id === action.sourcePlayerId);
    if (!payer || !recipient) throw new Error('Invalid payer or recipient.');

    const owed = action.amount || 0;
    let totalPaid = 0;
    const transferredCards = [];

    // Check payer's total asset value to verify if they are bankrupting what they have
    const totalAssets = this.calculatePlayerNetWorth(payer);

    for (const item of paymentItems) {
      if (item.type === 'bank') {
        const bIdx = payer.bank.findIndex(c => c.id === item.cardId);
        if (bIdx !== -1) {
          const [card] = payer.bank.splice(bIdx, 1);
          totalPaid += card.value;
          recipient.bank.push(card);
          transferredCards.push(card);
        }
      } else if (item.type === 'property') {
        const pSet = payer.properties[item.color];
        if (pSet) {
          const pIdx = pSet.cards.findIndex(c => c.id === item.cardId);
          if (pIdx !== -1) {
            const [card] = pSet.cards.splice(pIdx, 1);
            totalPaid += card.value;
            const destColor = card.type === 'wildcard' ? card.currentColor : card.color;
            recipient.properties[destColor].cards.push(card);
            transferredCards.push(card);
          }
        }
      }
    }

    if (totalPaid < owed && totalAssets > totalPaid) {
      throw new Error(`Payment of $${totalPaid}M is insufficient. You still have assets to pay the remaining debt of $${owed}M.`);
    }

    this.addLog(`${payer.name} paid $${totalPaid}M (${transferredCards.map(c => c.name).join(', ') || 'nothing'}) to ${recipient.name}.`);

    // Remove payer from target list
    action.targetPlayerIds = action.targetPlayerIds.filter(id => id !== payerId);
    if (action.targetPlayerIds.length === 0) {
      this.pendingAction = null;
      this.turnPhase = 'action';
    }

    this.checkWinCondition();
  }

  calculatePlayerNetWorth(player) {
    let sum = 0;
    for (const card of player.bank) sum += card.value;
    for (const key of Object.keys(player.properties)) {
      for (const card of player.properties[key].cards) sum += card.value;
    }
    return sum;
  }

  // --- DISCARD & TURN ENDING ---
  endTurn(playerId, force = false) {
    if (!force) {
      this.validateTurn(playerId);
      if (this.turnPhase === 'pending_reaction' || this.turnPhase === 'pending_payment') {
        throw new Error('Cannot end turn while an action is pending.');
      }
    }

    const player = this.getCurrentPlayer();
    if (player.hand.length > 7) {
      this.turnPhase = 'discard';
      this.addLog(`${player.name} has ${player.hand.length} cards and must discard down to 7.`);
      return;
    }

    this.advanceTurn();
  }

  discardCards(playerId, cardIds) {
    this.validateTurn(playerId);
    const player = this.getCurrentPlayer();
    if (this.turnPhase !== 'discard' && player.hand.length <= 7) {
      throw new Error('Not in discard phase.');
    }

    for (const cardId of cardIds) {
      const idx = player.hand.findIndex(c => c.id === cardId);
      if (idx !== -1) {
        const [card] = player.hand.splice(idx, 1);
        this.discardCard(card);
      }
    }

    if (player.hand.length > 7) {
      throw new Error(`You still need to discard ${player.hand.length - 7} more card(s).`);
    }

    this.addLog(`${player.name} discarded excess cards.`);
    this.advanceTurn();
  }

  advanceTurn() {
    this.checkWinCondition();
    if (this.winner) return;

    let nextIndex = (this.currentTurnIndex + 1) % this.players.length;
    // Skip disconnected players if possible
    let attempts = 0;
    while (!this.players[nextIndex].connected && attempts < this.players.length) {
      nextIndex = (nextIndex + 1) % this.players.length;
      attempts++;
    }

    this.currentTurnIndex = nextIndex;
    this.startTurn();
  }

  // --- WIN CONDITION CHECK ---
  isSetComplete(cards, color) {
    const setInfo = PROPERTY_SETS[color];
    if (!setInfo || !cards) return false;
    return cards.length >= setInfo.size;
  }

  checkWinCondition() {
    if (this.status !== 'in_progress') return;

    for (const player of this.players) {
      let completeSetsCount = 0;
      for (const color of Object.keys(PROPERTY_SETS)) {
        if (this.isSetComplete(player.properties[color].cards, color)) {
          completeSetsCount++;
        }
      }

      if (completeSetsCount >= 3) {
        this.status = 'completed';
        this.winner = {
          id: player.id,
          name: player.name,
          completeSetsCount
        };
        this.addLog(`GAME OVER! ${player.name} won the game with 3 complete property sets!`);
        return;
      }
    }
  }

  validateTurn(playerId, allowDrawPhase = false) {
    if (this.status !== 'in_progress') throw new Error('Game is not in progress.');
    const current = this.getCurrentPlayer();
    if (!current || current.id !== playerId) throw new Error("It is not your turn.");
    if (!allowDrawPhase && this.turnPhase === 'draw') {
      throw new Error("You must click the draw pile to draw cards before taking actions!");
    }
  }

  // Sanitize state for client (hiding opponents' private hand cards)
  getSanitizedState(forPlayerId) {
    return {
      roomCode: this.roomCode,
      edition: this.edition,
      status: this.status,
      currentTurnIndex: this.currentTurnIndex,
      currentTurnPlayerId: this.getCurrentPlayer()?.id,
      currentTurnPlayerName: this.getCurrentPlayer()?.name,
      turnActionsRemaining: this.turnActionsRemaining,
      turnActionsPlayed: this.turnActionsPlayed,
      turnPhase: this.turnPhase,
      pendingAction: this.pendingAction,
      startingPlayerIndex: this.startingPlayerIndex ?? 0,
      latestCommentary: this.latestCommentary || null,
      drawPileCount: this.drawPile.length,
      discardPileTop: this.discardPile[this.discardPile.length - 1] || null,
      winner: this.winner,
      deckCut: this.deckCut ? {
        active: this.deckCut.active,
        resolved: this.deckCut.resolved,
        totalCards: 52,
        picks: this.deckCut.picks,
        rankings: this.deckCut.rankings || []
      } : null,
      log: this.log.slice(0, 30),
      players: this.players.map(p => {
        const isSelf = p.id === forPlayerId;
        return {
          id: p.id,
          name: p.name,
          isHost: p.isHost,
          connected: p.connected,
          // Hide cards in opponents' hands, only reveal count
          handCount: p.hand.length,
          hand: isSelf ? p.hand : [],
          bank: p.bank,
          bankValue: p.bank.reduce((sum, c) => sum + (c.value || 0), 0),
          properties: p.properties,
          completedSets: Object.keys(PROPERTY_SETS).filter(color => 
            this.isSetComplete(p.properties[color]?.cards, color)
          )
        };
      })
    };
  }
}
