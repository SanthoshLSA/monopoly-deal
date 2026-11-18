import React from 'react';
import { X, Coins, Plus, Play, Shield } from 'lucide-react';
import { PROPERTY_COLORS } from '../Common/CardView';

export default function CardZoomModal({
  zoomedItem,
  onClose,
  onBank,
  onPlayProperty,
  onPlayAction
}) {
  if (!zoomedItem) return null;

  const card = zoomedItem.card || zoomedItem;
  const isFromHand = zoomedItem.isFromHand;
  const canPlay = zoomedItem.canPlay;

  const currentColor = card.type === 'wildcard' ? card.currentColor : card.color;
  const colorMeta = currentColor ? PROPERTY_COLORS[currentColor] : null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6 font-mono animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#071f13]/95 border-2 border-emerald-800/80 rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.9)] relative flex flex-col max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/90 text-zinc-300 hover:text-white border border-emerald-800/80 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
          
          {/* Left Column: Extra Large Card Image */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-64 h-90 sm:w-72 sm:h-100 rounded-2xl overflow-hidden border-2 border-emerald-700/80 shadow-[0_0_35px_rgba(0,0,0,0.7)] bg-zinc-950 flex items-center justify-center relative">
              {card.image ? (
                <img
                  src={card.image}
                  alt={card.name}
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <div className="w-full h-full flex flex-col justify-between p-6 text-center">
                  <span className="font-extrabold text-white text-2xl">${card.value}M</span>
                  <span className="font-extrabold text-white text-xl">{card.name}</span>
                  <span className="text-zinc-500 text-sm uppercase">{card.type}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Clear, Spacious Instructions & Details */}
          <div className="flex flex-col justify-between space-y-4">
            
            {/* Type & Value Badges */}
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-extrabold px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700/80 text-emerald-300">
                {card.type}
              </span>
              {card.value > 0 && (
                <span className="text-xs font-extrabold px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700/80 text-white flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-yellow-400" />
                  ${card.value}M BANK VALUE
                </span>
              )}
            </div>

            {/* Card Title */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase leading-tight">
                {card.name}
              </h2>

              {colorMeta ? (
                <div className="mt-1.5 inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold uppercase px-2.5 py-1 rounded-md" style={{ backgroundColor: `${colorMeta.hex}25`, border: `1px solid ${colorMeta.hex}80` }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorMeta.hex }} />
                  <span style={{ color: colorMeta.hex }}>
                    {colorMeta.name} Set {colorMeta.size ? `(${colorMeta.size} cards for full set)` : ''}
                  </span>
                </div>
              ) : card.colors?.length > 2 ? (
                <div className="mt-1.5 inline-block text-xs sm:text-sm font-extrabold uppercase px-2.5 py-1 rounded-md bg-gradient-to-r from-red-500/20 via-green-500/20 to-blue-500/20 border border-white/30 text-white">
                  Multi-Color Rainbow Wildcard (Can be any color)
                </div>
              ) : null}
            </div>

            {/* Clear Card Instructions Box */}
            <div className="bg-black/60 border border-emerald-900/80 rounded-xl p-4 shadow-inner">
              <span className="text-xs text-emerald-400 font-extrabold uppercase tracking-wider block mb-1.5">
                CARD INSTRUCTIONS &amp; RULES:
              </span>
              <p className="text-sm sm:text-base text-zinc-100 font-medium leading-relaxed">
                {card.description || 'Standard property card. Collect complete color sets to win.'}
              </p>
            </div>

            {/* Rent Scale Table (if Property) */}
            {card.rents && (
              <div className="bg-black/50 border border-emerald-900/60 rounded-xl p-3.5">
                <span className="text-[11px] text-zinc-400 font-extrabold uppercase tracking-wider block mb-2">
                  RENT COLLECTION SCALE:
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-center">
                  {card.rents.map((rent, idx) => (
                    <div key={idx} className="bg-emerald-950/60 border border-emerald-800/60 p-2 rounded-lg">
                      <span className="text-[10px] text-zinc-400 block font-bold">
                        {idx + 1} Card{idx > 0 ? 's' : ''}
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-white">
                        ${rent}M
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons if zoomed from Hand during your turn */}
            {isFromHand && canPlay && (
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                {card.value > 0 && onBank && (
                  <button
                    onClick={() => {
                      onBank(card);
                      onClose();
                    }}
                    className="flex-1 py-3 px-4 bg-emerald-950/80 hover:bg-emerald-900 text-zinc-100 border border-emerald-700 hover:border-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Coins className="w-4 h-4 text-yellow-400" />
                    BANK (${card.value}M)
                  </button>
                )}

                {(card.type === 'property' || card.type === 'wildcard') && onPlayProperty && (
                  <button
                    onClick={() => {
                      onPlayProperty(card);
                      onClose();
                    }}
                    className="flex-1 py-3 px-4 bg-white hover:bg-zinc-200 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    PLAY PROPERTY
                  </button>
                )}

                {(card.type === 'action' || card.type === 'rent') && onPlayAction && (
                  <button
                    onClick={() => {
                      onPlayAction(card);
                      onClose();
                    }}
                    className="flex-1 py-3 px-4 bg-white hover:bg-zinc-200 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    PLAY ACTION
                  </button>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
