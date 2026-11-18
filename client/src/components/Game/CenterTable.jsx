import React from 'react';
import CardView from '../Common/CardView';
import { ArrowRight, Layers } from 'lucide-react';

export default function CenterTable({
  gameState,
  isMyTurn,
  onEndTurn,
  onDrawCards,
  onZoomCard,
  loading
}) {
  const {
    drawPileCount = 0,
    discardPileTop = null,
    currentTurnPlayerName,
    turnActionsRemaining = 3,
    turnActionsPlayed = 0,
    turnPhase
  } = gameState;

  const canDraw = isMyTurn && turnPhase === 'draw';

  return (
    <div className="h-full w-full bg-felt-panel border border-emerald-900/50 rounded-2xl p-2 flex flex-col justify-between font-mono shadow-md overflow-hidden">
      {/* 1. TOP SECTION: Maximized Draw Pile & Discard Pile (Takes ~85% height) */}
      <div className="flex-1 grid grid-cols-2 gap-2 min-h-0 items-center justify-center p-1 overflow-hidden">
        
        {/* Draw Pile (Clickable to draw when it's your turn in draw phase) */}
        <div 
          onClick={() => {
            if (canDraw && onDrawCards) {
              onDrawCards();
            }
          }}
          className={`h-full w-full bg-emerald-950/40 rounded-xl p-1 flex items-center justify-center relative overflow-hidden select-none transition-all ${
            canDraw 
              ? 'border-2 border-emerald-400 ring-2 ring-emerald-400/50 shadow-[0_0_20px_rgba(52,211,153,0.35)] cursor-pointer hover:scale-[1.02] active:scale-[0.98]' 
              : 'border border-emerald-800/50'
          }`}
        >
          <div className={`relative h-full max-h-full max-w-full aspect-[2.5/3.5] rounded-xl overflow-hidden shadow-lg flex items-center justify-center transition-all ${
            canDraw ? 'border-2 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]' : 'border-2 border-zinc-700 bg-zinc-950'
          }`}>
            {/* Card back graphic */}
            <img
              src="/cards/card_back.png"
              alt="Deck"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />

            {/* Green Draw Card Indicator */}
            {canDraw && (
              <div className="absolute bottom-2 left-1.5 right-1.5 bg-emerald-400 text-black text-[10px] font-black py-1 px-1.5 rounded-lg uppercase tracking-wider text-center shadow-lg animate-pulse flex items-center justify-center gap-1">
                <span>CLICK TO DRAW</span>
              </div>
            )}
          </div>
        </div>

        {/* Discard Pile (Maximized top card, no top/bottom text) */}
        <div
          onClick={() => discardPileTop && onZoomCard && onZoomCard(discardPileTop)}
          title={discardPileTop ? `Click to inspect ${discardPileTop.name}` : 'Discard pile empty'}
          className="h-full w-full bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-1 flex items-center justify-center relative overflow-hidden cursor-pointer hover:border-emerald-600/50 transition-colors select-none"
        >
          {discardPileTop ? (
            <div className="h-full max-h-full max-w-full aspect-[2.5/3.5] flex items-center justify-center overflow-hidden">
              <CardView
                card={discardPileTop}
                size="fill"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="h-full max-h-full max-w-full aspect-[2.5/3.5] rounded-xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-700 text-xs">
              EMPTY
            </div>
          )}
        </div>

      </div>

      {/* 2. BOTTOM SECTION: Slim Compact Current Turn Bar */}
      <div className="h-10 flex-shrink-0 bg-emerald-950/60 border border-emerald-800/50 rounded-xl px-2.5 flex items-center justify-between mt-1 text-xs">
        <div className="flex items-center gap-2 truncate">
          <span className="text-[9px] text-zinc-500 uppercase font-bold hidden sm:inline">
            TURN:
          </span>
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded border tracking-wider truncate max-w-[110px] ${
              isMyTurn
                ? 'bg-white text-black border-white animate-pulse'
                : 'bg-emerald-950/60 text-zinc-300 border-emerald-800/60'
            }`}
          >
            {isMyTurn ? 'YOUR TURN' : currentTurnPlayerName}
          </span>

          {/* 3 Action Pips */}
          <div className="flex items-center gap-1 ml-1" title={`${turnActionsPlayed}/3 actions played`}>
            {[0, 1, 2].map((idx) => {
              const isPlayed = idx < turnActionsPlayed;
              return (
                <div
                  key={idx}
                  className={`w-3 h-1.5 rounded-sm transition-colors ${
                    isPlayed ? 'bg-white' : 'bg-emerald-950/80 border border-emerald-800/60'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* End Turn Button if My Turn */}
        {isMyTurn && (
          <button
            onClick={onEndTurn}
            disabled={loading || turnPhase === 'discard'}
            className={`py-1 px-2.5 rounded text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 transition-all ${
              turnPhase === 'discard'
                ? 'bg-amber-900/50 text-amber-300 border border-amber-700 cursor-not-allowed'
                : 'bg-white text-black hover:bg-zinc-200 cursor-pointer shadow-sm hover:scale-102'
            }`}
          >
            <span>END</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
