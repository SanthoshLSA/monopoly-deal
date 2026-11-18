import React from 'react';
import { PROPERTY_COLORS } from '../Common/CardView';
import { Coins, Layers, Home, Building, CheckCircle2 } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

function groupBankByDenomination(bankCards = []) {
  const map = new Map();
  for (const card of bankCards) {
    const val = card.value || 0;
    if (!map.has(val)) {
      map.set(val, { val, count: 0, sampleCard: card });
    }
    map.get(val).count++;
  }
  return Array.from(map.values()).sort((a, b) => b.val - a.val);
}

export default function OpponentArea({
  opponents = [],
  currentTurnPlayerId,
  onSelectProperty,
  onSelectSet,
  selectedSetTarget,
  selectedPropertyTarget,
  onZoomCard,
  slots = [0, 1, 2, 3]
}) {
  const { setHoveredCard } = useSocket();
  const isSingleCol = slots.length === 2;

  return (
    <div className={`grid ${isSingleCol ? 'grid-cols-1 grid-rows-2' : 'grid-cols-2 grid-rows-2'} gap-2 h-full w-full font-mono`}>
      {slots.map((idx) => {
        const opp = opponents[idx];
        if (!opp) {
          return (
            <div
              key={`empty-seat-${idx}`}
              className="bg-emerald-950/20 border-2 border-dashed border-emerald-900/40 rounded-xl flex items-center justify-center text-emerald-800/50 text-xs italic select-none"
            >
              Seat {idx + 1} (Empty)
            </div>
          );
        }

        const isCurrentTurn = opp.id === currentTurnPlayerId;
        const totalSets = opp.completedSets?.length || 0;
        const bankDenoms = groupBankByDenomination(opp.bank);
        const ownedSets = Object.entries(opp.properties).filter(([_, s]) => s.cards && s.cards.length > 0);

        return (
          <div
            key={opp.id}
            className={`bg-felt-panel rounded-xl p-2.5 border flex flex-col justify-between overflow-hidden transition-all duration-200 ${
              isCurrentTurn
                ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-1 ring-white/60'
                : 'border-emerald-900/50 hover:border-emerald-700/60'
            }`}
          >
            {/* Header: Opponent Info & Bank Value */}
            <div className="flex items-center justify-between pb-1.5 border-b border-emerald-900/40 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${opp.connected ? 'bg-emerald-400' : 'bg-red-500'}`} />
                <span className="font-extrabold text-white text-xs sm:text-sm truncate max-w-[130px]">
                  {opp.name}
                </span>
                {opp.isHost && (
                  <span className="text-[9px] uppercase tracking-wider text-amber-400 font-extrabold bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-900">
                    HOST
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                {/* Hand Cards Count Badge */}
                <div
                  className="flex items-center gap-1 bg-black/60 border border-emerald-700/60 px-2 py-0.5 rounded-md text-white font-extrabold text-[10px]"
                  title={`${opp.handCount ?? opp.hand?.length ?? 0} cards in hand`}
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>HAND: <strong className="text-emerald-300 text-xs">{opp.handCount ?? opp.hand?.length ?? 0}</strong></span>
                </div>

                <span className="font-extrabold text-white bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1 text-[11px]">
                  <Coins className="w-3 h-3 text-yellow-400" />
                  ${opp.bankValue}M
                </span>
                <span className={`font-extrabold px-1.5 py-0.5 rounded text-xs ${
                  totalSets > 0 ? 'bg-white text-black' : 'bg-emerald-950/60 text-zinc-400 border border-emerald-900/50'
                }`}>
                  {totalSets}/3
                </span>
              </div>
            </div>

            {/* Properties — no boxes, no color labels, no color dots. Just card images grouped */}
            <div className="flex-1 overflow-y-auto my-1 pr-1 min-h-0">
              {ownedSets.length === 0 ? (
                <div className="h-full flex items-center justify-center text-emerald-800/50 text-xs italic py-4 text-center">
                  No properties on board
                </div>
              ) : (
                <div className="space-y-1">
                  {ownedSets.map(([colorKey, set], idx) => {
                    const isComplete = opp.completedSets?.includes(colorKey);
                    const isSetTargeted = selectedSetTarget?.playerId === opp.id && selectedSetTarget?.color === colorKey;

                    return (
                      <div key={colorKey}>
                        {/* Thin divider between groups */}
                        {idx > 0 && <div className="border-t border-emerald-900/25 my-0.5" />}

                        {/* Status badges only — right-aligned */}
                        <div className="flex items-center gap-1 mb-0.5 justify-end text-[8px] font-bold">
                          {isComplete && (
                            <span className="bg-white text-black font-extrabold px-1 rounded flex items-center gap-0.5">
                              <CheckCircle2 className="w-2 h-2" /> FULL
                            </span>
                          )}
                          {set.houses > 0 && <span className="text-emerald-400 bg-emerald-950/60 px-1 rounded border border-emerald-900">H</span>}
                          {set.hotels > 0 && <span className="text-red-400 bg-red-950/60 px-1 rounded border border-red-900">HOTEL</span>}
                        </div>

                        {/* Card images grouped side-by-side — BIGGER */}
                        <div
                          className={`flex items-center gap-1.5 overflow-x-auto py-0.5 ${
                            isSetTargeted ? 'ring-2 ring-white rounded-lg bg-white/10' : ''
                          }`}
                          onClick={() => {
                            if (onSelectSet && isComplete) onSelectSet(opp.id, colorKey);
                          }}
                        >
                          {set.cards.map((c) => {
                            const isCardTargeted = selectedPropertyTarget?.cardId === c.id;
                            const isWild = c.type === 'wildcard';
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onMouseEnter={() => setHoveredCard && setHoveredCard(c)}
                                onMouseLeave={() => setHoveredCard && setHoveredCard(null)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onSelectProperty && !isComplete) {
                                    onSelectProperty(opp.id, c.id, colorKey, c.name);
                                  } else if (onZoomCard) {
                                    onZoomCard(c);
                                  }
                                }}
                                className={`group relative flex-shrink-0 rounded-md overflow-hidden border cursor-pointer transition-transform hover:scale-105 shadow-md ${
                                  isCardTargeted
                                    ? 'border-white ring-2 ring-white scale-105'
                                    : 'border-emerald-800/50 hover:border-white/70'
                                }`}
                                title={`${c.name} ($${c.value}M)`}
                              >
                                <div className="w-11 h-15 sm:w-12 sm:h-17 bg-zinc-900/50 flex items-center justify-center relative">
                                  {c.image ? (
                                    <img src={c.image} alt={c.name} className="w-full h-full object-contain pointer-events-none" />
                                  ) : (
                                    <div className="w-full h-full p-0.5 flex flex-col justify-between text-center text-[7px]">
                                      <span className="font-bold text-white">${c.value}M</span>
                                      <span className="truncate text-white">{c.name}</span>
                                    </div>
                                  )}
                                  {isWild && (
                                    <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[6px] text-center font-extrabold text-amber-300 py-0.5 truncate">
                                      WILD
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bank Denominations */}
            <div className="pt-1.5 border-t border-emerald-900/40 flex items-center gap-1.5 overflow-x-auto text-xs flex-shrink-0">
              <span className="text-emerald-700/80 font-bold uppercase text-[9px] mr-0.5">VAULT:</span>
              {bankDenoms.length === 0 ? (
                <span className="text-emerald-800/50 italic text-[10px]">Empty</span>
              ) : (
                bankDenoms.map(({ val, count, sampleCard }) => (
                  <button
                    key={val}
                    type="button"
                    onMouseEnter={() => sampleCard && setHoveredCard && setHoveredCard(sampleCard)}
                    onMouseLeave={() => setHoveredCard && setHoveredCard(null)}
                    onClick={() => onZoomCard && onZoomCard(sampleCard)}
                    className="px-1.5 py-0.5 rounded bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-800/50 hover:border-emerald-600/60 text-zinc-200 font-bold font-mono transition-colors cursor-pointer whitespace-nowrap text-[10px]"
                    title={`$${val}M (x${count})`}
                  >
                    ${val}M <span className="text-zinc-500 font-normal">x{count}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
