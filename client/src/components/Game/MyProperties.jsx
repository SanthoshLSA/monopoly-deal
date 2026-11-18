import React, { useState } from 'react';
import { PROPERTY_COLORS } from '../Common/CardView';
import { useSocket } from '../../context/SocketContext';
import { RefreshCw, Home, Building, X, Palette, CheckCircle2, AlertCircle } from 'lucide-react';

export default function MyProperties({
  player,
  isMyTurn,
  onMoveWildcard,
  onZoomCard
}) {
  const { setHoveredCard } = useSocket();
  const [rainbowPicker, setRainbowPicker] = useState(null);

  if (!player) return null;
  const totalSets = player.completedSets?.length || 0;
  const ownedSets = Object.entries(player.properties).filter(([_, s]) => s.cards && s.cards.length > 0);

  const handleWildcardRotate = (card, fromColor) => {
    if (!isMyTurn) return;
    const isRainbow = card.colors && card.colors.length > 2;
    if (isRainbow) {
      setRainbowPicker({ cardId: card.id, fromColor, card });
    } else {
      const otherColors = card.colors.filter(col => col !== fromColor);
      const nextColor = otherColors[0];
      if (nextColor) onMoveWildcard(card.id, fromColor, nextColor);
    }
  };

  const handleSelectRainbowColor = (targetColor) => {
    if (rainbowPicker) {
      onMoveWildcard(rainbowPicker.cardId, rainbowPicker.fromColor, targetColor);
      setRainbowPicker(null);
    }
  };

  return (
    <div className="h-full w-full bg-felt-panel border border-emerald-900/50 rounded-xl p-2 flex flex-col justify-between font-mono shadow-md overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-emerald-900/40 mb-1.5 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-extrabold text-white uppercase tracking-wider">
            MY PROPERTIES
          </span>
          <span className="text-[10px] text-zinc-500">
            ({ownedSets.reduce((sum, [_, s]) => sum + s.cards.length, 0)})
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className={`font-extrabold px-2 py-0.5 rounded text-xs transition-colors ${
            totalSets >= 3
              ? 'bg-emerald-400 text-black shadow-[0_0_10px_rgba(52,211,153,0.5)]'
              : totalSets > 0
              ? 'bg-white text-black'
              : 'bg-emerald-950/60 text-zinc-400 border border-emerald-900/50'
          }`}>
            {totalSets}/3 SETS
          </span>
        </div>
      </div>

      {/* Property cards — no boxes, no color labels, no dots. Just grouped cards with dividers */}
      <div className="flex-1 overflow-y-auto pr-1 min-h-0">
        {ownedSets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-emerald-800 text-xs italic py-8 text-center">
            <span className="text-sm mb-1">No properties in play yet.</span>
            <span className="text-[10px] text-emerald-900/70">Play property cards during your turn!</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {ownedSets.map(([colorKey, set], idx) => {
              const isComplete = player.completedSets?.includes(colorKey);
              const meta = PROPERTY_COLORS[colorKey];

              return (
                <div key={colorKey}>
                  {/* Thin separator between groups (not for first) */}
                  {idx > 0 && <div className="border-t border-emerald-900/30 my-1" />}

                  {/* Status badges only — no color name, no dot */}
                  <div className="flex items-center gap-1 mb-1 justify-end">
                    {isComplete && (
                      <span className="bg-white text-black text-[8px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> FULL SET
                      </span>
                    )}
                    {set.houses > 0 && (
                      <span className="text-emerald-400 bg-emerald-950/70 border border-emerald-800 text-[8px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5">
                        <Home className="w-2.5 h-2.5" /> HOUSE
                      </span>
                    )}
                    {set.hotels > 0 && (
                      <span className="text-red-400 bg-red-950/70 border border-red-800 text-[8px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5">
                        <Building className="w-2.5 h-2.5" /> HOTEL
                      </span>
                    )}
                  </div>

                  {/* Cards side-by-side — BIGGER miniature images */}
                  <div className="flex items-center gap-2 overflow-x-auto py-0.5">
                    {set.cards.map((c) => {
                      const isWildcard = c.type === 'wildcard';
                      const isRainbow = isWildcard && c.colors && c.colors.length > 2;
                      const otherColor = c.colors?.find(col => col !== colorKey);

                      return (
                        <div
                          key={c.id}
                          onMouseEnter={() => setHoveredCard && setHoveredCard(c)}
                          onMouseLeave={() => setHoveredCard && setHoveredCard(null)}
                          onClick={() => onZoomCard && onZoomCard(c)}
                          className="group relative flex-shrink-0 cursor-pointer transition-transform hover:scale-105"
                          title={`${c.name} ($${c.value}M)`}
                        >
                          {/* Bigger PNG Card */}
                          <div className="w-16 h-22 sm:w-18 sm:h-25 rounded-md overflow-hidden border border-emerald-800/60 group-hover:border-white shadow-md transition-colors flex items-center justify-center relative bg-zinc-900/50">
                            {c.image ? (
                              <img src={c.image} alt={c.name} className="w-full h-full object-contain pointer-events-none" />
                            ) : (
                              <div className="w-full h-full p-1 flex flex-col justify-between text-center text-[8px]">
                                <span className="font-bold text-white">${c.value}M</span>
                                <span className="font-extrabold truncate text-white leading-tight">{c.name}</span>
                              </div>
                            )}
                            {isWildcard && (
                              <div className="absolute bottom-0 inset-x-0 bg-black/85 text-[7px] text-center font-extrabold text-amber-300 py-0.5 truncate border-t border-amber-900/40">
                                {isRainbow ? 'RAINBOW' : 'DUAL'}
                              </div>
                            )}
                          </div>

                          {/* Rotate button for wildcards */}
                          {isWildcard && isMyTurn && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWildcardRotate(c, colorKey);
                              }}
                              className={`absolute -top-1.5 -right-1.5 z-10 p-0.5 rounded-full shadow-md flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
                                isRainbow
                                  ? 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-white'
                                  : 'bg-white hover:bg-zinc-200 text-black'
                              }`}
                            >
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-[9px] text-emerald-800/80 pt-1 border-t border-emerald-900/30 flex items-center justify-between mt-1 flex-shrink-0">
        <span>Hover to preview • Click to zoom</span>
        <span>{ownedSets.length} groups</span>
      </div>

      {/* Rainbow Wildcard Color Picker Popover */}
      {rainbowPicker && (
        <div className="absolute inset-0 z-30 bg-black/95 backdrop-blur-md p-4 flex flex-col justify-between animate-fade-in font-mono rounded-xl">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <span className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-yellow-400" />
              SWITCH WILDCARD TO OWNED COLOR SET
            </span>
            <button onClick={() => setRainbowPicker(null)} className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {(() => {
            const eligibleColors = Object.entries(PROPERTY_COLORS).filter(([colorKey]) => {
              if (colorKey === rainbowPicker.fromColor) return false;
              const setCards = player.properties[colorKey]?.cards || [];
              return setCards.some(c => c.type === 'property' && (!c.colors || c.colors.length <= 2));
            });

            if (eligibleColors.length === 0) {
              return (
                <div className="my-auto text-center py-6 px-4">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs text-zinc-300 font-bold mb-1">No base property colors in play</p>
                  <p className="text-[10px] text-zinc-500">Rainbow wildcards can only be moved to colors of base properties you currently have on the board.</p>
                </div>
              );
            }

            return (
              <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 my-2.5 pr-1">
                {eligibleColors.map(([colorKey, meta]) => {
                  const cardCount = player.properties[colorKey]?.cards?.length || 0;
                  return (
                    <button
                      key={colorKey}
                      onClick={() => handleSelectRainbowColor(colorKey)}
                      className="p-2.5 rounded-lg border border-zinc-700 bg-zinc-900 hover:border-white hover:bg-zinc-800 text-white cursor-pointer shadow-sm flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: meta.hex }} />
                        <span className="truncate font-bold text-xs">{meta.name}</span>
                      </div>
                      <span className="text-[9px] text-emerald-400 px-1.5 py-0.5 rounded bg-zinc-950 font-extrabold border border-emerald-900">
                        {cardCount} card{cardCount > 1 ? 's' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })()}

          <button onClick={() => setRainbowPicker(null)} className="w-full py-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-800 rounded-lg bg-zinc-950 uppercase tracking-wider font-bold cursor-pointer">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
