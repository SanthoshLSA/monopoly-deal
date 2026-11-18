import React from 'react';
import { X, BookOpen, CheckCircle, ShieldAlert } from 'lucide-react';

export default function RulesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold tracking-wider text-white">MONOPOLY DEAL // OFFICIAL RULES</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-zinc-300 leading-relaxed font-mono">
          <div>
            <h3 className="text-white font-bold text-base mb-1 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              1. OBJECTIVE (WIN CONDITION)
            </h3>
            <p className="text-zinc-400 pl-5">
              Be the first player to collect <span className="text-white font-bold">3 complete property sets</span> of different colors.
            </p>
          </div>

          <div>
            <h3 className="text-white font-bold text-base mb-1 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              2. TURN STRUCTURE
            </h3>
            <div className="space-y-1 text-zinc-400 pl-5">
              <p><span className="text-white font-bold">Step 1 - Draw:</span> Draw 2 cards from the draw pile (draw 5 cards if your hand is empty).</p>
              <p><span className="text-white font-bold">Step 2 - Play:</span> Play up to 3 cards from your hand (Bank, Properties, Actions/Rent).</p>
              <p><span className="text-white font-bold">Step 3 - End Turn:</span> If you hold more than 7 cards at the end of your turn, discard excess cards to the discard pile.</p>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold text-base mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              3. ACTION CARDS & DEFENSE
            </h3>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-5">
              <li><span className="text-white font-bold">Deal Breaker:</span> Steal an entire completed property set (including houses/hotels).</li>
              <li><span className="text-white font-bold">Just Say No:</span> Play anytime someone targets you with an action card to cancel it. Can be countered with another Just Say No!</li>
              <li><span className="text-white font-bold">Sly Deal:</span> Steal 1 property card (cannot be from a complete set).</li>
              <li><span className="text-white font-bold">Forced Deal:</span> Swap 1 of your properties for an opponent's property (neither can be in a complete set).</li>
              <li><span className="text-white font-bold">Rent / Wild Rent:</span> Charge players rent based on how many cards you own in that color set.</li>
              <li><span className="text-white font-bold">Debt Collector:</span> Force 1 player to pay you $5M.</li>
              <li><span className="text-white font-bold">It's My Birthday:</span> All players must give you $2M.</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-base mb-1">
              4. PAYMENTS & CHANGE
            </h3>
            <p className="text-zinc-400 pl-5">
              Cards can only be paid from your <span className="text-white font-bold">Bank</span> or <span className="text-white font-bold">Properties</span> in play. You never pay from your hand. <span className="text-white font-bold">No change is given</span> if you pay with a larger bill. If you have no cards in your Bank or Properties, you pay nothing.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-black font-bold text-xs uppercase tracking-wider rounded hover:bg-zinc-200 transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
