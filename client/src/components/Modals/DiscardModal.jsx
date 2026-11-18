import React, { useState } from 'react';
import CardView from '../Common/CardView';
import { Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function DiscardModal({
  isOpen,
  hand,
  onDiscardCards
}) {
  const [selectedCardIds, setSelectedCardIds] = useState([]);

  if (!isOpen || hand.length <= 7) return null;

  const excessCount = hand.length - 7;
  const isReady = selectedCardIds.length === excessCount;

  const toggleCard = (cardId) => {
    setSelectedCardIds(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      } else {
        if (prev.length < excessCount) {
          return [...prev, cardId];
        }
        return prev;
      }
    });
  };

  const handleConfirm = () => {
    if (isReady) {
      onDiscardCards(selectedCardIds);
      setSelectedCardIds([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6 font-mono animate-fade-in">
      <div className="w-full h-full max-w-7xl max-h-[96vh] bg-zinc-950 border-2 border-zinc-700 rounded-2xl flex flex-col p-5 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.9)] relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-800/80 text-red-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-white font-extrabold text-base sm:text-xl tracking-wider uppercase flex items-center gap-2">
                DISCARD PHASE: HAND LIMIT EXCEEDED
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Maximum hand size is <span className="text-white font-bold">7 cards</span>. You have <span className="text-white font-bold">{hand.length} cards</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-xl border text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all ${
              isReady
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300'
            }`}>
              {isReady && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              <span>DISCARDING: {selectedCardIds.length} / {excessCount}</span>
            </div>
          </div>
        </div>

        {/* Instructions banner */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-2.5 my-3 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-zinc-300">
            Click on the cards below to choose which <strong className="text-white">{excessCount} card{excessCount > 1 ? 's' : ''}</strong> you want to discard to the center pile.
          </span>
          <span className="text-xs font-bold text-zinc-500">
            {isReady ? 'Ready to discard!' : `Pick ${excessCount - selectedCardIds.length} more card${excessCount - selectedCardIds.length > 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Spacious card grid showing all cards fully */}
        <div className="flex-1 overflow-y-auto p-2 min-h-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4 justify-items-center">
            {hand.map((card) => {
              const isSelected = selectedCardIds.includes(card.id);
              return (
                <div
                  key={card.id}
                  onClick={() => toggleCard(card.id)}
                  className={`group relative rounded-xl transition-all duration-150 cursor-pointer p-1.5 flex flex-col items-center select-none ${
                    isSelected
                      ? 'bg-red-950/80 ring-3 ring-red-500 scale-103 shadow-[0_0_20px_rgba(239,68,68,0.35)]'
                      : 'hover:bg-zinc-900/80 hover:ring-2 hover:ring-zinc-600'
                  }`}
                >
                  {/* Selected check badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-20 bg-red-600 text-white rounded-full p-1 shadow-md animate-bounce-short">
                      <Trash2 className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <CardView card={card} size="md" isSelected={isSelected} />

                  <div className="mt-2 text-center w-full">
                    <span className={`text-[11px] font-extrabold block truncate ${
                      isSelected ? 'text-red-300' : 'text-zinc-300 group-hover:text-white'
                    }`}>
                      {card.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-bold block">
                      {card.value > 0 ? `$${card.value}M • ` : ''}{card.type.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with action button */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between flex-shrink-0 mt-2">
          <div className="text-xs text-zinc-500">
            {selectedCardIds.length === 0 ? (
              <span>No cards selected yet.</span>
            ) : isReady ? (
              <span className="text-emerald-400 font-bold">All {excessCount} card{excessCount > 1 ? 's' : ''} selected. Ready to finish turn.</span>
            ) : (
              <span>Selected {selectedCardIds.length} of {excessCount} required cards.</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isReady}
            className={`py-3 px-8 rounded-xl text-xs sm:text-sm uppercase font-extrabold tracking-wider transition-all flex items-center gap-2 shadow-lg ${
              isReady
                ? 'bg-red-600 hover:bg-red-500 text-white cursor-pointer hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] scale-102'
                : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed opacity-60'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>
              {isReady
                ? `DISCARD ${excessCount} CARD${excessCount > 1 ? 'S' : ''} & END TURN`
                : `SELECT ${excessCount - selectedCardIds.length} MORE TO DISCARD`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
