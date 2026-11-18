import React from 'react';
import CardView, { PROPERTY_COLORS } from '../Common/CardView';
import { Coins, Layers, RefreshCw, Home, Building } from 'lucide-react';

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

export default function PlayerRow({
  player,
  isMyTurn,
  actionsRemaining,
  turnPhase,
  selectedCard,
  onSelectCard,
  onBank,
  onPlayProperty,
  onPlayAction,
  onMoveWildcard,
  onZoomCard
}) {
  if (!player) return null;

  const totalSets = player.completedSets?.length || 0;
  const bankDenoms = groupBankByDenomination(player.bank);
  const canPlay = isMyTurn && actionsRemaining > 0 && turnPhase === 'action';

  // Filter only owned property sets (cards.length > 0)
  const ownedSets = Object.entries(player.properties).filter(([_, s]) => s.cards && s.cards.length > 0);

  return (
    <div className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl p-3 my-2 font-mono shadow-xl">
      <div className="flex flex-col lg:flex-row gap-3 items-stretch">
        
        {/* 1. THIN COLUMN BOX: BANK VAULT (~14% width) */}
        <div className="w-full lg:w-44 flex-shrink-0 bg-zinc-900/40 border border-zinc-800 rounded-xl p-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800 mb-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                VAULT
              </span>
              <span className="text-xs font-extrabold text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
                ${player.bankValue}M
              </span>
            </div>

            {/* Stacked Denomination Badges in thin column */}
            <div className="flex flex-wrap lg:flex-col gap-1.5 max-h-[160px] overflow-y-auto">
              {bankDenoms.length === 0 ? (
                <div className="text-[10px] text-zinc-600 italic py-6 text-center w-full">
                  Empty
                </div>
              ) : (
                bankDenoms.map(({ val, count, sampleCard }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => onZoomCard && onZoomCard(sampleCard)}
                    title={`Click to zoom $${val}M card`}
                    className="w-full px-2 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-400 text-zinc-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-between"
                  >
                    <span className="font-mono">${val}M</span>
                    <span className="text-zinc-400 font-normal text-[10px] bg-zinc-950 px-1.5 py-0.2 rounded border border-zinc-800">
                      x{count}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="text-[9px] text-zinc-500 pt-1.5 border-t border-zinc-800/80 text-center mt-2">
            {player.bank.length} card(s)
          </div>
        </div>

        {/* 2. OWNED PROPERTIES (NO EMPTY BOXES) (~30% width) */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 bg-zinc-900/40 border border-zinc-800 rounded-xl p-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800 mb-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                MY PROPERTIES
              </span>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-zinc-500 font-bold uppercase">SETS:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                  totalSets > 0 ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                }`}>
                  {totalSets}/3
                </span>
              </div>
            </div>

            {/* Render ONLY owned sets */}
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {ownedSets.length === 0 ? (
                <div className="text-[10px] text-zinc-600 italic py-8 text-center">
                  No properties placed down yet
                </div>
              ) : (
                ownedSets.map(([colorKey, set]) => {
                  const meta = PROPERTY_COLORS[colorKey];
                  const isComplete = player.completedSets?.includes(colorKey);

                  return (
                    <div
                      key={colorKey}
                      className={`p-1.5 rounded-lg border transition-all ${
                        isComplete
                          ? 'border-white bg-zinc-900 shadow-xs'
                          : 'border-zinc-800 bg-zinc-950'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="font-bold uppercase flex items-center gap-1 truncate" style={{ color: meta?.hex || '#fff' }}>
                          {meta?.name || colorKey} ({set.cards.length})
                          {isComplete && (
                            <span className="text-[8px] bg-white text-black font-extrabold px-1 rounded">
                              FULL SET
                            </span>
                          )}
                        </span>

                        {(set.houses > 0 || set.hotels > 0) && (
                          <div className="flex items-center gap-1 text-[8px] font-bold">
                            {set.houses > 0 && (
                              <span className="text-emerald-400 flex items-center gap-0.5">
                                <Home className="w-2.5 h-2.5" /> 1
                              </span>
                            )}
                            {set.hotels > 0 && (
                              <span className="text-red-400 flex items-center gap-0.5">
                                <Building className="w-2.5 h-2.5" /> 1
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Property cards as clickable tags to zoom */}
                      <div className="flex flex-wrap gap-1">
                        {set.cards.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-200"
                          >
                            <button
                              type="button"
                              onClick={() => onZoomCard && onZoomCard(c)}
                              title={`Click to zoom ${c.name}`}
                              className="hover:text-white truncate max-w-[100px] cursor-pointer"
                            >
                              {c.name}
                            </button>

                            {/* Rotate wildcard button if it's my turn */}
                            {c.type === 'wildcard' && isMyTurn && c.colors && c.colors.length > 1 && (
                              <button
                                type="button"
                                title="Switch wildcard color"
                                onClick={() => {
                                  const otherColors = c.colors.filter(col => col !== colorKey);
                                  const nextColor = otherColors[0];
                                  if (nextColor) {
                                    onMoveWildcard(c.id, colorKey, nextColor);
                                  }
                                }}
                                className="p-0.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded"
                              >
                                <RefreshCw className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="text-[9px] text-zinc-500 pt-1.5 border-t border-zinc-800/80 mt-1">
            {ownedSets.length} set(s) on board
          </div>
        </div>

        {/* 3. EXPANDED HAND: FITS 7 CARDS AT A TIME WITHOUT SCROLLING (~56% width) */}
        <div className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-xl p-2.5 flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                MY HAND ({player.hand.length} CARDS)
              </span>
              <span className="text-[9px] text-zinc-500 hidden sm:inline">
                (7 Cards Visible)
              </span>
            </div>

            <div className="text-[10px]">
              {canPlay ? (
                <span className="text-white font-bold bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded tracking-wide">
                  {actionsRemaining} ACTION{actionsRemaining > 1 ? 'S' : ''} REMAINING
                </span>
              ) : (
                <span className="text-zinc-500 italic text-[9px]">
                  {isMyTurn ? 'No actions left' : 'Wait for your turn'}
                </span>
              )}
            </div>
          </div>

          {/* Cards in Hand: Sized so at least 7 cards fit on screen cleanly */}
          <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 items-center justify-start min-h-[175px]">
            {player.hand.length === 0 ? (
              <div className="w-full text-center text-zinc-600 text-xs italic py-8">
                Hand is empty (you will draw 5 cards on your next turn!)
              </div>
            ) : (
              player.hand.map((card) => (
                <CardView
                  key={card.id}
                  card={card}
                  size="md"
                  isSelected={selectedCard?.id === card.id}
                  isSelectable={canPlay}
                  onClick={() => onZoomCard && onZoomCard({ card, isFromHand: true, canPlay })}
                  onZoom={() => onZoomCard && onZoomCard({ card, isFromHand: true, canPlay })}
                  showActions={canPlay}
                  onBank={onBank}
                  onPlayProperty={onPlayProperty}
                  onPlayAction={onPlayAction}
                />
              ))
            )}
          </div>

          <div className="text-[9px] text-zinc-500 pt-1 border-t border-zinc-800/80 flex items-center justify-between">
            <span>Click any card to zoom &amp; inspect • Hover to quick play</span>
            <span className="text-zinc-600 font-bold">Max 7 cards at turn end</span>
          </div>
        </div>

      </div>
    </div>
  );
}
