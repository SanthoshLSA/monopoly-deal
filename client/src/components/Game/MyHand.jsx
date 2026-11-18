import React from 'react';
import CardView from '../Common/CardView';
import { Layers, ChevronDown } from 'lucide-react';

export default function MyHand({
  hand = [],
  isMyTurn,
  actionsRemaining,
  turnPhase,
  selectedCard,
  onSelectCard,
  onBank,
  onPlayProperty,
  onPlayAction,
  onZoomCard
}) {
  const canPlay = isMyTurn && actionsRemaining > 0 && turnPhase === 'action';

  // Always show in multiples of 4 (minimum 8 slots = 2 rows of 4)
  // If > 8 cards (e.g. 9 to 12 cards = 3 rows, 13 to 16 cards = 4 rows), user can scroll down
  const slotCount = Math.max(8, Math.ceil(hand.length / 4) * 4);
  const slots = Array.from({ length: slotCount }, (_, i) => i);
  const hasExtraCards = hand.length > 8;

  return (
    <div className="h-full w-full bg-felt-panel border border-emerald-900/50 rounded-2xl p-2 flex flex-col justify-between font-mono shadow-md overflow-hidden select-none">
      {/* Hand Header - Compact single line */}
      <div className="flex items-center justify-between pb-1 border-b border-emerald-900/40 mb-1 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-emerald-400/80" />
          <span className="font-extrabold text-white uppercase tracking-wider text-xs">
            MY CARDS ({hand.length})
          </span>
          {hasExtraCards && (
            <span className="text-[9px] font-extrabold text-amber-400 bg-amber-950/70 border border-amber-800 px-1.5 py-0.2 rounded flex items-center gap-0.5 animate-pulse">
              <ChevronDown className="w-3 h-3" /> SCROLL DOWN FOR MORE
            </span>
          )}
        </div>

        <div>
          {canPlay ? (
            <span className="text-white font-extrabold bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded text-[10px] tracking-wider shadow-xs">
              {actionsRemaining} ACTION{actionsRemaining > 1 ? 'S' : ''} REMAINING
            </span>
          ) : isMyTurn && turnPhase === 'draw' ? (
            <span className="text-zinc-200 font-extrabold bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded text-[10px]">
              DRAW PHASE
            </span>
          ) : turnPhase === 'discard' ? (
            <span className="text-amber-400 font-extrabold bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded text-[10px]">
              DISCARD PHASE (KEEP MAX 7)
            </span>
          ) : (
            <span className="text-emerald-700/80 italic text-[10px]">
              {isMyTurn ? 'No actions remaining' : 'Waiting for turn'}
            </span>
          )}
        </div>
      </div>

      {/* Cards Grid: Exactly 2 rows visible at a time; smooth scrolling down for 3+ rows */}
      <div
        className="flex-1 min-h-0 grid grid-cols-4 gap-1.5 overflow-y-auto pr-1"
        style={{
          gridAutoRows: 'calc((100% - 0.375rem) / 2)'
        }}
      >
        {slots.map((idx) => {
          const card = hand[idx];
          if (card) {
            return (
              <div key={card.id} className="w-full h-full min-h-0 flex items-center justify-center p-0.5">
                <CardView
                  card={card}
                  size="fill"
                  isSelected={selectedCard?.id === card.id}
                  isSelectable={canPlay}
                  onClick={() => onZoomCard && onZoomCard({ card, isFromHand: true, canPlay })}
                  onZoom={() => onZoomCard && onZoomCard({ card, isFromHand: true, canPlay })}
                  showActions={canPlay}
                  onBank={onBank}
                  onPlayProperty={onPlayProperty}
                  onPlayAction={onPlayAction}
                />
              </div>
            );
          }

          // Empty Card Slot (dashed border with slot number)
          return (
            <div key={`empty-slot-${idx}`} className="w-full h-full min-h-0 flex items-center justify-center p-0.5">
              <div className="h-full max-h-full max-w-full aspect-[2.5/3.5] rounded-xl border border-dashed border-emerald-900/40 bg-emerald-950/20 flex items-center justify-center text-emerald-800/50 text-xs font-bold">
                {idx + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
