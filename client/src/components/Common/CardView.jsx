import React, { useState } from 'react';

export const PROPERTY_COLORS = {
  brown: { name: 'Brown', hex: '#8B4513', border: 'border-amber-900', bg: 'bg-amber-950/40', size: 2 },
  dark_blue: { name: 'Dark Blue', hex: '#0038A8', border: 'border-blue-900', bg: 'bg-blue-950/40', size: 2 },
  green: { name: 'Green', hex: '#00873E', border: 'border-emerald-800', bg: 'bg-emerald-950/40', size: 3 },
  light_blue: { name: 'Light Blue', hex: '#87CEEB', border: 'border-cyan-800', bg: 'bg-cyan-950/40', size: 3 },
  orange: { name: 'Orange', hex: '#FF7F00', border: 'border-orange-800', bg: 'bg-orange-950/40', size: 3 },
  pink: { name: 'Pink', hex: '#D10069', border: 'border-pink-800', bg: 'bg-pink-950/40', size: 3 },
  railroad: { name: 'Railroad', hex: '#333333', border: 'border-zinc-700', bg: 'bg-zinc-900', size: 4 },
  red: { name: 'Red', hex: '#D91023', border: 'border-red-900', bg: 'bg-red-950/40', size: 3 },
  utility: { name: 'Utility', hex: '#A4C639', border: 'border-lime-900', bg: 'bg-lime-950/40', size: 2 },
  yellow: { name: 'Yellow', hex: '#FBD000', border: 'border-yellow-700', bg: 'bg-yellow-950/40', size: 3 }
};

import { useSocket } from '../../context/SocketContext';

export default function CardView({
  card,
  size = 'md', // 'xs', 'sm', 'md', 'lg', 'xl'
  isSelected = false,
  isSelectable = false,
  onClick,
  onZoom,
  showActions = false,
  onBank,
  onPlayProperty,
  onPlayAction,
  className = ''
}) {
  const { setHoveredCard } = useSocket();
  const [imageError, setImageError] = useState(false);

  if (!card) return null;

  const sizeClasses = {
    xs: 'w-16 h-22 text-[8px]',
    sm: 'w-20 h-28 text-[9px]',
    md: 'w-28 h-40 text-xs',
    lg: 'w-40 h-56 text-sm',
    xl: 'w-48 h-68 text-base',
    fill: 'h-full max-h-full max-w-full aspect-[2.5/3.5] text-xs'
  };

  const currentColor = card.type === 'wildcard' ? card.currentColor : card.color;
  const colorMeta = currentColor ? PROPERTY_COLORS[currentColor] : null;

  const handleCardClick = (e) => {
    // If onZoom is provided, trigger zoom directly!
    if (onZoom) {
      onZoom(card);
    } else if (onClick) {
      onClick(card);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setHoveredCard && setHoveredCard(card)}
      onMouseLeave={() => setHoveredCard && setHoveredCard(null)}
      title="Click or hover to inspect"
      className={`relative group flex-shrink-0 select-none transition-all duration-150 rounded-lg overflow-hidden border cursor-pointer ${
        isSelected
          ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.5)] scale-105 z-10'
          : isSelectable
          ? 'border-zinc-700 hover:border-zinc-300 hover:scale-102'
          : 'border-zinc-800 hover:border-zinc-500 hover:scale-101'
      } ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      {!imageError && card.image ? (
        <img
          src={card.image}
          alt={card.name}
          onError={() => setImageError(true)}
          className="w-full h-full object-contain bg-zinc-950 pointer-events-none"
        />
      ) : (
        // High quality fallback card
        <div className="w-full h-full flex flex-col justify-between p-2 bg-zinc-950 text-zinc-200 border-2 border-zinc-800">
          <div className="flex justify-between items-center">
            <span className="font-bold text-white bg-zinc-900 px-1 rounded border border-zinc-700">
              {card.value ? `$${card.value}M` : '-'}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">
              {card.type}
            </span>
          </div>

          {colorMeta ? (
            <div className={`text-[9px] font-bold text-center py-0.5 rounded border ${colorMeta.border} ${colorMeta.bg}`}>
              {colorMeta.name.toUpperCase()}
            </div>
          ) : card.colors?.length > 2 ? (
            <div className="text-[8px] font-extrabold text-center py-0.5 rounded border border-white/40 bg-zinc-900 text-white">
              RAINBOW WILDCARD
            </div>
          ) : null}

          <div className="text-center my-auto px-1">
            <div className="font-bold text-white line-clamp-2 leading-tight">
              {card.name}
            </div>
          </div>

          <div className="text-[8px] text-zinc-500 text-center truncate border-t border-zinc-800 pt-1">
            MONOPOLY DEAL
          </div>
        </div>
      )}

      {/* Quick Action Overlay on hover (when in Hand) - Docks to bottom so card artwork remains visible */}
      {showActions && (
        <div
          onClick={handleCardClick}
          className="absolute inset-x-0 bottom-0 max-h-[70%] bg-zinc-950/95 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-all duration-150 flex flex-col justify-end items-center gap-1 p-1.5 z-10 rounded-b-lg border-t border-zinc-700 shadow-2xl"
        >
          {/* Action: Bank */}
          {card.value > 0 && onBank && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBank(card);
              }}
              className="w-full py-1 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-zinc-400 rounded transition-colors cursor-pointer"
            >
              + Bank (${card.value}M)
            </button>
          )}

          {/* Action: Place Property */}
          {(card.type === 'property' || card.type === 'wildcard') && onPlayProperty && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPlayProperty(card);
              }}
              className="w-full py-1 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-zinc-400 rounded transition-colors cursor-pointer"
            >
              + Place Property
            </button>
          )}

          {/* Action: Play Action/Rent/Building */}
          {(card.type === 'action' || card.type === 'rent') && onPlayAction && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPlayAction(card);
              }}
              className="w-full py-1 text-[9px] sm:text-[10px] uppercase font-extrabold tracking-wider bg-white hover:bg-zinc-200 text-black border border-white rounded transition-colors cursor-pointer shadow-sm"
            >
              Play Action
            </button>
          )}
        </div>
      )}
    </div>
  );
}
