import React from 'react';
import { PROPERTY_COLORS } from './CardView';
import { Coins } from 'lucide-react';

export default function HoverCardTooltip({ card }) {
  if (!card) return null;

  const currentColor = card.type === 'wildcard' ? card.currentColor : card.color;
  const colorMeta = currentColor ? PROPERTY_COLORS[currentColor] : null;

  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none transition-all duration-150 animate-fade-in font-mono">
      <div className="bg-zinc-950 border-2 border-white/60 rounded-xl p-3 shadow-[0_0_30px_rgba(0,0,0,0.9)] w-56 flex flex-col items-center text-center backdrop-blur-md">
        {/* Card Artwork */}
        <div className="w-32 h-44 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900 mb-2.5 shadow-md flex items-center justify-center">
          {card.image ? (
            <img
              src={card.image}
              alt={card.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-white text-xs font-bold p-2">{card.name}</div>
          )}
        </div>

        {/* Card Specs */}
        <div className="w-full space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-[10px]">
            <span className="font-bold text-zinc-400 uppercase bg-zinc-900 px-1.5 py-0.2 rounded border border-zinc-800">
              {card.type}
            </span>
            {card.value > 0 && (
              <span className="font-bold text-white bg-zinc-900 px-1.5 py-0.2 rounded border border-zinc-800 flex items-center gap-0.5">
                <Coins className="w-2.5 h-2.5 text-yellow-400" />
                ${card.value}M
              </span>
            )}
          </div>

          <h4 className="text-xs font-extrabold text-white truncate max-w-full">
            {card.name}
          </h4>

          {colorMeta ? (
            <span className="text-[10px] font-bold block uppercase" style={{ color: colorMeta.hex }}>
              SET: {colorMeta.name}
            </span>
          ) : card.colors?.length > 2 ? (
            <span className="text-[10px] font-extrabold block uppercase bg-gradient-to-r from-red-400 via-green-400 to-blue-400 bg-clip-text text-transparent">
              MULTI-COLOR RAINBOW
            </span>
          ) : null}

          {card.rents && (
            <div className="text-[9px] text-zinc-400 bg-zinc-900/60 p-1 rounded border border-zinc-900 flex justify-around font-mono">
              {card.rents.map((r, i) => (
                <span key={i}>
                  {i + 1}x: <strong className="text-white">${r}M</strong>
                </span>
              ))}
            </div>
          )}

          <p className="text-[10px] text-zinc-400 leading-tight line-clamp-3 px-1">
            {card.description}
          </p>
        </div>
      </div>
    </div>
  );
}
