import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, Crown, ArrowRight, Dices } from 'lucide-react';
import { playCardSnapSound, playTurnStartSound } from '../../utils/audio';

export default function HighCardCutModal({
  isOpen,
  deckCut,
  players = [],
  selfId,
  onPickCard,
  onAutoPick,
  onFinish
}) {
  const [countdown, setCountdown] = useState(4);

  const picks = deckCut?.picks || {};
  const rankings = deckCut?.rankings || [];
  const isResolved = deckCut?.resolved || false;
  const myPick = picks[selfId];
  const hasIPicked = !!myPick;

  // Track celebration
  useEffect(() => {
    if (isResolved) {
      playTurnStartSound();
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#34d399', '#ffffff', '#10b981', '#fbbf24']
        });
      } catch (e) {
        // ignore
      }

      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            onFinish();
            return 0;
          }
          return c - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isResolved]);

  if (!isOpen || !deckCut) return null;

  const totalCards = deckCut.totalCards || 52;
  const cardIndices = Array.from({ length: totalCards }, (_, i) => i);

  // Map cardIndex to pick info
  const pickByIndex = {};
  for (const pick of Object.values(picks)) {
    pickByIndex[pick.cardIndex] = pick;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6 font-mono text-white select-none animate-fade-in overflow-hidden">
      <div className="bg-felt-panel border-2 border-emerald-800/80 rounded-2xl w-full h-full max-w-7xl max-h-[96vh] p-4 sm:p-6 shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col justify-between overflow-hidden relative">
        
        {/* HEADER SECTION */}
        <div className="text-center pb-3 border-b border-emerald-900/60 flex-shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[10px] font-extrabold uppercase tracking-widest mb-1.5 shadow-sm">
            <Dices className="w-3.5 h-3.5 text-emerald-400" />
            <span>CUT FOR HIGH CARD • DETERMINES TURN ORDER</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-wider uppercase mt-0.5">
            {isResolved ? 'TURN ORDER DECIDED!' : 'PICK A CARD FROM THE SPREAD'}
          </h2>

          <p className="text-xs text-zinc-300 mt-1 max-w-xl mx-auto">
            {isResolved
              ? 'The player with the highest card goes first, second highest goes second!'
              : hasIPicked
              ? 'You have chosen your card! Waiting for other players to pick...'
              : 'The deck is spread out below. Click any face-down card to cut for your turn order!'}
          </p>
        </div>

        {/* PLAYERS & REVEALED CARDS STATUS GRID */}
        <div className="my-2.5 flex-shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-4xl mx-auto">
            {players.map((p, idx) => {
              const pick = picks[p.id];
              const ranking = rankings.find(r => r.playerId === p.id);
              const isMe = p.id === selfId;

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-between transition-all ${
                    ranking?.rank === 1
                      ? 'bg-emerald-950/90 border-2 border-emerald-400 ring-2 ring-emerald-400/40 shadow-[0_0_20px_rgba(52,211,153,0.35)]'
                      : pick
                      ? 'bg-black/60 border-emerald-800/70 shadow-sm'
                      : isMe
                      ? 'bg-emerald-950/40 border-dashed border-emerald-500/80 animate-pulse'
                      : 'bg-black/40 border-dashed border-emerald-900/50'
                  }`}
                >
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase truncate max-w-[95px] text-zinc-200">
                      {isMe ? `${p.name} (YOU)` : p.name}
                    </span>
                    {ranking ? (
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                        ranking.rank === 1
                          ? 'bg-emerald-400 text-black shadow-xs'
                          : ranking.rank === 2
                          ? 'bg-white text-black'
                          : 'bg-emerald-950/80 text-zinc-300 border border-emerald-800/60'
                      }`}>
                        {ranking.rank === 1 ? '1ST • GOES FIRST' : `${ranking.rank}${ranking.rank === 2 ? 'ND' : ranking.rank === 3 ? 'RD' : 'TH'}`}
                      </span>
                    ) : (
                      <span className="text-[9px] text-zinc-500 font-bold">SEAT {idx + 1}</span>
                    )}
                  </div>

                  {/* Picked Card Graphic — Crisp Playing Card Face */}
                  {pick ? (
                    <div className="w-20 h-28 rounded-xl bg-white border-2 border-zinc-200 p-2 flex flex-col justify-between shadow-xl relative select-none text-zinc-900">
                      {/* Top left rank & suit */}
                      <div className="text-left leading-none">
                        <span className="font-black text-sm block" style={{ color: pick.card.suitColor || '#000' }}>
                          {pick.card.rank}
                        </span>
                        <span className="text-xs" style={{ color: pick.card.suitColor || '#000' }}>
                          {pick.card.suitSymbol}
                        </span>
                      </div>

                      {/* Center big suit symbol */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-4xl drop-shadow-xs" style={{ color: pick.card.suitColor || '#000' }}>
                          {pick.card.suitSymbol}
                        </span>
                      </div>

                      {/* Bottom right rank & suit inverted */}
                      <div className="text-right leading-none rotate-180">
                        <span className="font-black text-sm block" style={{ color: pick.card.suitColor || '#000' }}>
                          {pick.card.rank}
                        </span>
                        <span className="text-xs" style={{ color: pick.card.suitColor || '#000' }}>
                          {pick.card.suitSymbol}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-28 rounded-xl border-2 border-dashed border-emerald-900/60 bg-black/40 flex flex-col items-center justify-center text-center p-2">
                      <span className="text-[10px] text-emerald-600/80 font-bold uppercase">
                        {isMe ? 'CLICK A CARD BELOW' : 'WAITING...'}
                      </span>
                    </div>
                  )}

                  {pick && (
                    <span className="text-[10px] text-emerald-300 font-bold mt-2 truncate max-w-full">
                      {pick.card.label} of {pick.card.suitName}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SPREAD OUT 52 CARDS DECK AREA ON FELT */}
        <div className="flex-1 min-h-0 bg-black/40 border border-emerald-900/60 rounded-xl p-3 flex flex-col justify-center items-center overflow-x-auto relative shadow-inner">
          <div className="text-[10px] uppercase tracking-widest font-extrabold mb-2 flex items-center gap-2">
            <span className="text-zinc-400">SPREAD DECK (52 CARDS)</span>
            {!hasIPicked && (
              <span className="text-emerald-400 animate-pulse bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/60">
                CLICK ANY CARD TO CUT
              </span>
            )}
          </div>

          {/* Ribbon / Spread container: overlapping cards across width */}
          <div className="w-full max-w-5xl flex items-center justify-center py-6 px-4 overflow-x-auto min-h-[140px]">
            <div className="flex items-center -space-x-8 sm:-space-x-11 hover:-space-x-5 transition-all duration-300">
              {cardIndices.map((idx) => {
                const pick = pickByIndex[idx];
                const isPicked = !!pick;
                const isMyPickCard = pick?.playerId === selfId;

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isPicked || hasIPicked}
                    onClick={() => {
                      if (!isPicked && !hasIPicked) {
                        playCardSnapSound();
                        onPickCard(idx);
                      }
                    }}
                    title={isPicked ? `Picked by ${pick.playerName}` : hasIPicked ? 'You already picked' : `Pick Card #${idx + 1}`}
                    className={`relative w-14 sm:w-16 h-24 sm:h-28 rounded-xl transition-all duration-200 transform cursor-pointer flex-shrink-0 select-none ${
                      isPicked
                        ? '-translate-y-8 z-30 opacity-95 scale-105 shadow-[0_0_20px_rgba(0,0,0,0.8)]'
                        : hasIPicked
                        ? 'opacity-40 hover:opacity-40 cursor-default'
                        : 'hover:-translate-y-6 hover:scale-115 hover:z-40 hover:ring-2 hover:ring-emerald-400 hover:shadow-[0_0_25px_rgba(52,211,153,0.5)]'
                    }`}
                  >
                    {isPicked ? (
                      /* Face-up picked card (Standard playing card face) */
                      <div className="w-full h-full rounded-xl bg-white border-2 border-emerald-400 p-1 flex flex-col justify-between shadow-2xl relative overflow-hidden text-zinc-900">
                        <div className="text-left leading-none">
                          <span className="font-extrabold text-xs block" style={{ color: pick.card.suitColor || '#000' }}>
                            {pick.card.rank}
                          </span>
                          <span className="text-[10px]" style={{ color: pick.card.suitColor || '#000' }}>
                            {pick.card.suitSymbol}
                          </span>
                        </div>
                        <div className="text-center font-bold text-lg" style={{ color: pick.card.suitColor || '#000' }}>
                          {pick.card.suitSymbol}
                        </div>
                        <div className="text-right leading-none rotate-180">
                          <span className="font-extrabold text-xs block" style={{ color: pick.card.suitColor || '#000' }}>
                            {pick.card.rank}
                          </span>
                        </div>
                        {/* Player name badge */}
                        <div className="absolute inset-x-0 bottom-0 bg-emerald-950 text-[8px] font-extrabold text-center py-0.5 truncate text-emerald-300 border-t border-emerald-800">
                          {pick.playerName}
                        </div>
                      </div>
                    ) : (
                      /* Face-down card using the official card back */
                      <div className="w-full h-full rounded-xl border-2 border-emerald-800/80 bg-zinc-950 shadow-md flex items-center justify-center overflow-hidden relative">
                        <img
                          src="/cards/card_back.png"
                          alt="Deck Card"
                          className="w-full h-full object-contain pointer-events-none"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION / CONFIRMATION FOOTER */}
        <div className="pt-3 border-t border-emerald-900/60 flex items-center justify-between flex-shrink-0">
          <div>
            {isResolved ? (
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300">
                  {rankings[0]?.playerName} drew the highest card ({rankings[0]?.card.rank}{rankings[0]?.card.suitSymbol}) and goes first!
                </span>
              </div>
            ) : (
              <span className="text-xs text-zinc-400">
                {Object.keys(picks).length} of {players.length} players picked
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isResolved && (
              <button
                type="button"
                onClick={onAutoPick}
                className="px-4 py-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-200 rounded-xl text-xs uppercase font-extrabold tracking-wider transition-colors cursor-pointer"
              >
                Auto-Pick Remaining
              </button>
            )}

            {isResolved && (
              <button
                type="button"
                onClick={onFinish}
                className="px-6 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-black rounded-xl text-xs uppercase font-black tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_25px_rgba(52,211,153,0.4)] hover:scale-102 cursor-pointer"
              >
                <span>START GAME ({countdown}s)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
