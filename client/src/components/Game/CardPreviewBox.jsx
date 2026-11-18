import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Eye } from 'lucide-react';
import { PROPERTY_COLORS } from '../Common/CardView';

export default function CardPreviewBox() {
  const { hoveredCard } = useSocket();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [hoveredCard?.id]);

  return (
    <div className="h-full w-full bg-felt-panel border border-emerald-900/50 rounded-2xl p-1.5 flex flex-col items-center justify-center font-mono shadow-md overflow-hidden relative select-none">
      {hoveredCard ? (
        <div className="w-full h-full flex items-center justify-center p-0.5 animate-fade-in overflow-hidden">
          {!imageError && hoveredCard.image ? (
            <img
              src={hoveredCard.image}
              alt={hoveredCard.name}
              onError={() => setImageError(true)}
              className="w-full h-full object-contain rounded-xl drop-shadow-[0_0_30px_rgba(255,255,255,0.18)] transition-all duration-150"
            />
          ) : (
            // Monospace Minimalist Fallback Card - Scales 100% to fill container
            <div className="h-full w-full max-w-sm aspect-[2.5/3.5] bg-zinc-900 border-2 border-zinc-700 rounded-xl p-4 flex flex-col justify-between shadow-2xl">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <span className="font-extrabold text-white text-lg">
                  {hoveredCard.value ? `$${hoveredCard.value}M` : '-'}
                </span>
                <span className="text-xs uppercase font-bold tracking-wider text-zinc-400">
                  {hoveredCard.type}
                </span>
              </div>
              <div className="my-auto text-center py-4">
                <h3 className="font-extrabold text-white text-lg uppercase tracking-wider mb-2">
                  {hoveredCard.name}
                </h3>
                {hoveredCard.description && (
                  <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
                    {hoveredCard.description}
                  </p>
                )}
              </div>
              <div className="pt-2 border-t border-zinc-800 text-[10px] text-zinc-500 uppercase text-center font-bold">
                {hoveredCard.color || hoveredCard.actionType || hoveredCard.type}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-emerald-800/60 text-center p-4">
          <div className="w-24 h-36 border-2 border-dashed border-emerald-900/40 rounded-xl flex items-center justify-center mb-3">
            <Eye className="w-8 h-8 text-zinc-700" />
          </div>
          <span className="text-xs font-bold tracking-widest uppercase text-zinc-500">
            CARD PREVIEW
          </span>
          <span className="text-[10px] text-zinc-600 mt-1">
            Hover any card on board to inspect
          </span>
        </div>
      )}
    </div>
  );
}
