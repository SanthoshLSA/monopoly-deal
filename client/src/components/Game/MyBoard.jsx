import React from 'react';
import CardView, { PROPERTY_COLORS } from '../Common/CardView';
import { Coins, RefreshCw, Home, Building } from 'lucide-react';

export default function MyBoard({
  player,
  isMyTurn,
  onMoveWildcard
}) {
  if (!player) return null;

  const totalSets = player.completedSets?.length || 0;

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 my-2">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800 mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase font-bold tracking-widest text-zinc-400">
            YOUR COLLECTION
          </span>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-500 font-bold uppercase">SETS COMPLETED:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-xs ${
              totalSets > 0 ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-700'
            }`}>
              {totalSets}/3
            </span>
          </div>
        </div>

        {/* Total Bank Value */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-400 text-xs font-bold uppercase">BANK TOTAL:</span>
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 px-2.5 py-1 rounded text-white font-bold text-sm">
            <Coins className="w-4 h-4 text-yellow-400" />
            ${player.bankValue}M
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left: Bank Cards (Cols 1-4) */}
        <div className="lg:col-span-4 bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-2.5 flex flex-col">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
            BANK VAULT ({player.bank.length} CARDS)
          </span>

          <div className="flex-1 flex gap-2 overflow-x-auto pb-1 items-center min-h-[90px]">
            {player.bank.length === 0 ? (
              <div className="w-full text-center text-zinc-600 text-xs italic py-4">
                No money banked yet. Play money or action cards to your bank to pay rents.
              </div>
            ) : (
              player.bank.map((c) => (
                <CardView key={c.id} card={c} size="sm" />
              ))
            )}
          </div>
        </div>

        {/* Right: Property Sets (Cols 5-12) */}
        <div className="lg:col-span-8 bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-2.5">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 block">
            PROPERTY SETS
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {Object.entries(player.properties).map(([colorKey, set]) => {
              const meta = PROPERTY_COLORS[colorKey];
              const isComplete = player.completedSets?.includes(colorKey);
              const cardCount = set.cards.length;

              if (cardCount === 0) {
                return (
                  <div
                    key={colorKey}
                    className="p-2 rounded border border-dashed border-zinc-800/60 bg-zinc-950/40 flex flex-col justify-between min-h-[100px] opacity-40 hover:opacity-75 transition-opacity"
                  >
                    <span className="text-[10px] font-bold uppercase truncate" style={{ color: meta?.hex || '#777' }}>
                      {meta?.name || colorKey}
                    </span>
                    <span className="text-[9px] text-zinc-600 italic text-center">Empty</span>
                    <span className="text-[8px] text-zinc-600 text-right">0/{set.maxSetSize || 3}</span>
                  </div>
                );
              }

              return (
                <div
                  key={colorKey}
                  className={`p-2 rounded-lg border transition-all flex flex-col justify-between min-h-[110px] ${
                    isComplete
                      ? 'border-white bg-zinc-900 shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                      : 'border-zinc-700 bg-zinc-950'
                  }`}
                >
                  {/* Set Header */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="font-bold uppercase truncate" style={{ color: meta?.hex || '#fff' }}>
                        {meta?.name || colorKey}
                      </span>
                      {isComplete && (
                        <span className="text-[8px] font-extrabold bg-white text-black px-1 rounded">
                          FULL
                        </span>
                      )}
                    </div>

                    {/* Buildings */}
                    {(set.houses > 0 || set.hotels > 0) && (
                      <div className="flex items-center gap-1 text-[8px] font-bold text-zinc-300 mb-1">
                        {set.houses > 0 && (
                          <span className="flex items-center gap-0.5 bg-emerald-950/60 border border-emerald-700 text-emerald-300 px-1 rounded">
                            <Home className="w-2.5 h-2.5" /> 1
                          </span>
                        )}
                        {set.hotels > 0 && (
                          <span className="flex items-center gap-0.5 bg-red-950/60 border border-red-700 text-red-300 px-1 rounded">
                            <Building className="w-2.5 h-2.5" /> 1
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Cards inside set */}
                  <div className="space-y-1 my-1">
                    {set.cards.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200"
                      >
                        <span className="truncate max-w-[80px]" title={c.name}>
                          {c.name}
                        </span>

                        {/* Rotate wildcard button if it's my turn */}
                        {c.type === 'wildcard' && isMyTurn && c.colors && c.colors.length > 1 && (
                          <button
                            type="button"
                            title="Move wildcard to another color"
                            onClick={() => {
                              const otherColors = c.colors.filter(col => col !== colorKey);
                              const nextColor = otherColors[0];
                              if (nextColor) {
                                onMoveWildcard(c.id, colorKey, nextColor);
                              }
                            }}
                            className="p-0.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded ml-1"
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Count footer */}
                  <div className="text-[8px] text-zinc-500 text-right pt-1 border-t border-zinc-800/60">
                    {cardCount} card(s)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
