# Monopoly Deal Online (Minimalist B&W Edition)

A full-stack, real-time multiplayer implementation of **Monopoly Deal** built with **Node.js, Express, Socket.IO, React (Vite), and Tailwind CSS**.

Designed with a sleek, minimalist dark black-and-white theme using monospace **Ubuntu Mono** typography.

---

## Features
- **Private Room Matchmaking**:
  - Anyone can create a private room with a clean room code (e.g., `M8K2P`).
  - Friends join by entering the room code and their nickname.
  - Accommodates 2 to 5 players per room.
- **Ephemeral State**:
  - In-memory Node.js state machine with Socket.IO; zero persistent clutter after the game ends.
- **Full Monopoly Deal Rules Engine**:
  - Complete 106-card base deck (Money, Properties, Dual/Multi Wildcards, Rent, Action cards).
  - Turn flow: Draw 2 cards (or 5 if hand empty), up to 3 actions per turn.
  - Action cards with full interactions:
    - **Deal Breaker** (steal a complete property set)
    - **Just Say No** (real-time reaction counter window)
    - **Sly Deal** (steal an incomplete property)
    - **Forced Deal** (swap properties)
    - **Debt Collector** ($5M demand)
    - **It's My Birthday** ($2M gift from all players)
    - **Pass Go** (draw 2 cards)
    - **House & Hotel** (rent boosters)
    - **Double The Rent** (combine with rent cards)
  - Interactive payment selector (pay from Bank or Properties, no change given).
  - Wildcard rotation between colors anytime on your turn without using an action.
  - Discard down to 7 cards limit enforced at turn end.
  - Win condition: First player to assemble 3 complete property sets of different colors!
- **Extensible Architecture**:
  - Deck registry designed to cleanly plug in future editions (**Harry Potter Edition**, **No Mercy Edition**).

---

## Quick Start

### 1. Start the Backend Server (Port 3001)
```bash
cd server
npm start
```

### 2. Start the Frontend Client (Port 5173)
```bash
cd client
npm run dev
```

Visit `http://localhost:5173` in your browser. Open multiple browser tabs (or share your local IP / host) to play with friends!

---

## Replacing Card Images

All card images are stored in clean SVG format under:
```
client/public/cards/
├── actions/
│   ├── deal_breaker.svg
│   ├── debt_collector.svg
│   ├── double_the_rent.svg
│   ├── forced_deal.svg
│   ├── hotel.svg
│   ├── house.svg
│   ├── its_my_birthday.svg
│   ├── just_say_no.svg
│   ├── pass_go.svg
│   └── sly_deal.svg
├── money/
│   ├── money_1m.svg
│   ├── money_2m.svg
│   ├── money_3m.svg
│   ├── money_4m.svg
│   ├── money_5m.svg
│   └── money_10m.svg
├── properties/
│   ├── brown_baltic_avenue.svg
│   ├── brown_mediterranean_avenue.svg
│   ├── dark_blue_boardwalk.svg
│   ├── dark_blue_park_place.svg
│   ├── green_north_carolina_avenue.svg
│   ├── ... (all 28 standard properties)
├── rent/
│   ├── dark_blue_green_rent.svg
│   ├── light_blue_brown_rent.svg
│   ├── pink_orange_rent.svg
│   ├── railroad_utility_rent.svg
│   ├── red_yellow_rent.svg
│   └── wild_rent.svg
├── wildcards/
│   ├── dark_blue_green.svg
│   ├── green_railroad.svg
│   ├── light_blue_brown.svg
│   ├── light_blue_railroad.svg
│   ├── multi_wildcard.svg
│   ├── pink_orange.svg
│   ├── red_yellow.svg
│   └── utility_railroad.svg
└── card_back.svg
```

> **How to replace with your custom images**:
> Simply drop your PNG, JPG, or SVG files into the corresponding folder with the matching file name.

To regenerate all default placeholder SVGs at any time:
```bash
npm run generate:cards
```

---

## Running Tests
Run the deterministic game engine unit tests:
```bash
npm run test:server
```
