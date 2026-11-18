import test from 'node:test';
import assert from 'node:assert';
import { GameState } from '../GameState.js';
import { getBaseDeck, PROPERTY_SETS } from '../decks/baseDeck.js';

test('Base Deck contains exactly 106 cards with valid specifications', () => {
  const deck = getBaseDeck();
  assert.strictEqual(deck.length, 106, 'Base deck must have exactly 106 cards');

  const moneyCards = deck.filter(c => c.type === 'money');
  const actionCards = deck.filter(c => c.type === 'action');
  const propertyCards = deck.filter(c => c.type === 'property');
  const wildcardCards = deck.filter(c => c.type === 'wildcard');
  const rentCards = deck.filter(c => c.type === 'rent');

  assert.strictEqual(moneyCards.length, 20, '20 money cards');
  assert.strictEqual(actionCards.length, 34, '34 action cards');
  assert.strictEqual(propertyCards.length, 28, '28 standard property cards');
  assert.strictEqual(wildcardCards.length, 11, '11 property wildcards');
  assert.strictEqual(rentCards.length, 13, '13 rent cards');
});

test('Game setup, dealing, and manual draw at start of turn', () => {
  const game = new GameState('TEST1', { id: 'p1', name: 'Alice' });
  game.addPlayer({ id: 'p2', name: 'Bob' });
  assert.strictEqual(game.players.length, 2);

  game.startGame('p1');
  assert.strictEqual(game.status, 'in_progress');

  // Both players received 5 initial cards
  const startingPlayer = game.getCurrentPlayer();
  const otherPlayer = game.players.find(p => p.id !== startingPlayer.id);

  assert.strictEqual(startingPlayer.hand.length, 5);
  assert.strictEqual(otherPlayer.hand.length, 5);
  assert.strictEqual(game.turnPhase, 'draw');

  // Drawing cards manually
  game.playerDrawCards(startingPlayer.id);
  assert.strictEqual(startingPlayer.hand.length, 7);
  assert.strictEqual(game.turnPhase, 'action');

  // Remaining draw pile = 106 - 5 - 5 - 2 = 94 cards
  assert.strictEqual(game.drawPile.length, 94);
  assert.strictEqual(game.turnActionsRemaining, 3);
});

test('Playing money to bank updates player bank and actions remaining after drawing', () => {
  const game = new GameState('TEST2', { id: 'p1', name: 'Alice' });
  game.addPlayer({ id: 'p2', name: 'Bob' });
  game.startGame('p1');

  const currentPlayer = game.getCurrentPlayer();
  // Must draw cards first
  game.playerDrawCards(currentPlayer.id);

  const moneyCard = { id: 'custom_m5', name: '$5M Money', type: 'money', value: 5 };
  currentPlayer.hand.push(moneyCard);

  game.playToBank(currentPlayer.id, 'custom_m5');
  assert.strictEqual(currentPlayer.bank.length, 1);
  assert.strictEqual(currentPlayer.bank[0].value, 5);
  assert.strictEqual(game.turnActionsRemaining, 2);
  assert.strictEqual(game.turnActionsPlayed, 1);
});

test('Rent card cannot be used on player who has no money or properties', () => {
  const game = new GameState('TEST_RENT', { id: 'p1', name: 'Alice' });
  game.addPlayer({ id: 'p2', name: 'Bob' });
  game.startGame('p1');

  const alice = game.getCurrentPlayer();
  const bob = game.players.find(p => p.id !== alice.id);

  game.playerDrawCards(alice.id);

  // Give Alice a property and matching rent card
  alice.properties.dark_blue = { cards: [{ id: 'blue_1', name: 'Park Place', type: 'property', color: 'dark_blue', value: 4 }], houses: 0, hotels: 0 };
  const rentCard = { id: 'rent_blue', name: 'Blue & Green Rent', type: 'rent', colors: ['dark_blue', 'green'], value: 1 };
  alice.hand.push(rentCard);

  // Bob has empty bank and empty properties
  bob.bank = [];
  bob.properties = {};

  assert.throws(() => {
    game.playRent(alice.id, 'rent_blue', 'dark_blue', null);
  }, /None of your opponents have any money or properties to pay rent/);
});

test('Deck cut determines player turn order by high card', () => {
  const game = new GameState('TEST_CUT', { id: 'p1', name: 'Alice' });
  game.addPlayer({ id: 'p2', name: 'Bob' });
  game.startGame('p1');

  assert.strictEqual(game.deckCut.active, true);
  assert.strictEqual(game.deckCut.deck.length, 52);

  // Manually pick cards for Alice and Bob
  // Let's give Alice an Ace of Spades (score 144) and Bob a 9 of Hearts (score 93)
  const aceIdx = game.deckCut.deck.findIndex(c => c.rank === 'A' && c.suit === 'spades');
  const nineIdx = game.deckCut.deck.findIndex(c => c.rank === '9' && c.suit === 'hearts');

  game.pickHighCard('p1', aceIdx);
  assert.strictEqual(game.deckCut.resolved, false);

  game.pickHighCard('p2', nineIdx);
  // All players picked -> automatically resolved!
  assert.strictEqual(game.deckCut.resolved, true);
  assert.strictEqual(game.deckCut.rankings[0].playerName, 'Alice');
  assert.strictEqual(game.deckCut.rankings[1].playerName, 'Bob');
  assert.strictEqual(game.getCurrentPlayer().name, 'Alice');
});

test('Double wildcards can be changed without base card, but rainbow wildcards require base card', () => {
  const game = new GameState('TEST_WILD', { id: 'p1', name: 'Alice' });
  game.addPlayer({ id: 'p2', name: 'Bob' });
  game.startGame('p1');
  const alice = game.getCurrentPlayer();
  game.playerDrawCards(alice.id);

  // 1. Double wild card (e.g. Red & Yellow) in red set with 0 yellow cards
  const doubleWild = {
    id: 'wild_red_yellow_1',
    name: 'Red & Yellow Wildcard',
    type: 'wildcard',
    colors: ['red', 'yellow'],
    currentColor: 'red',
    value: 3
  };
  alice.properties.red.cards.push(doubleWild);
  assert.strictEqual(alice.properties.yellow.cards.length, 0);

  // Should succeed moving double wild card to yellow even though alice has 0 yellow cards
  game.moveWildcard(alice.id, doubleWild.id, 'red', 'yellow');
  assert.strictEqual(alice.properties.yellow.cards.length, 1);
  assert.strictEqual(alice.properties.red.cards.length, 0);

  // 2. Rainbow wildcard (10 colors) in brown set
  const rainbowWild = {
    id: 'wild_rainbow_1',
    name: 'Multi-Color Wildcard',
    type: 'wildcard',
    colors: ['brown', 'dark_blue', 'green', 'light_blue', 'orange', 'pink', 'railroad', 'red', 'utility', 'yellow'],
    currentColor: 'brown',
    value: 0
  };
  alice.properties.brown.cards.push(rainbowWild);
  assert.strictEqual(alice.properties.green.cards.length, 0);

  // Trying to move rainbow wild to green when alice has NO base green cards should fail
  assert.throws(() => {
    game.moveWildcard(alice.id, rainbowWild.id, 'brown', 'green');
  }, /Cannot move rainbow wildcard to Green because you do not have a base property card/);

  // Now give alice a base green card
  alice.properties.green.cards.push({
    id: 'prop_green_1',
    name: 'Pacific Avenue',
    type: 'property',
    color: 'green',
    value: 4
  });

  // Moving rainbow wild to green should now succeed
  game.moveWildcard(alice.id, rainbowWild.id, 'brown', 'green');
  assert.strictEqual(alice.properties.green.cards.length, 2);
  assert.strictEqual(alice.properties.brown.cards.length, 0);
});

test('Win condition is triggered when a player completes 3 full sets', () => {
  const game = new GameState('TEST3', { id: 'p1', name: 'Alice' });
  game.addPlayer({ id: 'p2', name: 'Bob' });
  game.startGame('p1');

  const alice = game.players[0];

  // Complete Dark Blue set (2 cards)
  alice.properties.dark_blue.cards.push(
    { id: 'db1', name: 'Boardwalk', type: 'property', color: 'dark_blue', value: 4 },
    { id: 'db2', name: 'Park Place', type: 'property', color: 'dark_blue', value: 4 }
  );

  // Complete Brown set (2 cards)
  alice.properties.brown.cards.push(
    { id: 'br1', name: 'Med Ave', type: 'property', color: 'brown', value: 1 },
    { id: 'br2', name: 'Baltic Ave', type: 'property', color: 'brown', value: 1 }
  );

  // Complete Utility set (2 cards)
  alice.properties.utility.cards.push(
    { id: 'ut1', name: 'Electric', type: 'property', color: 'utility', value: 2 },
    { id: 'ut2', name: 'Water Works', type: 'property', color: 'utility', value: 2 }
  );

  game.checkWinCondition();
  assert.strictEqual(game.status, 'completed');
  assert.strictEqual(game.winner.name, 'Alice');
  assert.strictEqual(game.winner.completeSetsCount, 3);
});
