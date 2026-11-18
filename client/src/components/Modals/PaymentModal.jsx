import React, { useState } from 'react';
import CardView, { PROPERTY_COLORS } from '../Common/CardView';
import { Coins, Check, AlertCircle, ZoomIn } from 'lucide-react';

export default function PaymentModal({
  pendingAction,
  playerId,
  askingPlayer,
  bank = [],
  properties = {},
  onSubmitPayment,
  onZoomCard
}) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [error, setError] = useState('');

  const isTarget = pendingAction?.targetPlayerIds?.includes(playerId);
  if (!pendingAction || !isTarget || pendingAction.type === 'deal_breaker' || pendingAction.type === 'sly_deal' || pendingAction.type === 'forced_deal') {
    return null;
  }

  const owed = pendingAction.amount || 0;

  // Calculate total selected value
  let totalSelected = 0;
  for (const item of selectedItems) {
    if (item.type === 'bank') {
      const card = bank.find(c => c.id === item.cardId);
      if (card) totalSelected += card.value;
    } else if (item.type === 'property') {
      const card = properties[item.color]?.cards.find(c => c.id === item.cardId);
      if (card) totalSelected += card.value;
    }
  }

  // Calculate total net worth of player
  let totalNetWorth = 0;
  for (const c of bank) totalNetWorth += c.value;
  for (const set of Object.values(properties)) {
    for (const c of set.cards) totalNetWorth += c.value;
  }

  const canSubmit = totalSelected >= owed || (totalNetWorth < owed && totalSelected === totalNetWorth);
  const isFulfilled = totalSelected >= owed;

  const toggleBankCard = (card) => {
    setSelectedItems(prev => {
      const exists = prev.some(item => item.type === 'bank' && item.cardId === card.id);
      if (exists) {
        return prev.filter(item => !(item.type === 'bank' && item.cardId === card.id));
      } else {
        if (totalSelected >= owed) return prev; // Cannot select more cards once fulfilled!
        return [...prev, { type: 'bank', cardId: card.id }];
      }
    });
  };

  const togglePropertyCard = (card, color) => {
    setSelectedItems(prev => {
      const exists = prev.some(item => item.type === 'property' && item.cardId === card.id);
      if (exists) {
        return prev.filter(item => !(item.type === 'property' && item.cardId === card.id));
      } else {
        if (totalSelected >= owed) return prev; // Cannot select more cards once fulfilled!
        return [...prev, { type: 'property', cardId: card.id, color }];
      }
    });
  };

  const handlePay = () => {
    setError('');
    if (!canSubmit) {
      setError(`Payment of $${totalSelected}M is insufficient. You still have assets to pay the remaining debt of $${owed}M.`);
      return;
    }
    onSubmitPayment(selectedItems);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-6 font-mono text-zinc-200 animate-fade-in">
      <div className="bg-zinc-950 border-2 border-zinc-800 rounded-2xl w-full h-full max-w-7xl max-h-[96vh] p-6 shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="pb-4 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-white font-extrabold text-xl sm:text-2xl tracking-wider uppercase flex items-center gap-2">
              <Coins className="w-6 h-6 text-yellow-400" />
              PAYMENT DEMAND: ${owed}M OWED
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Click cards to select for payment. Once debt is fulfilled (${owed}M), remaining cards are locked.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-zinc-500 uppercase font-bold block">TOTAL SELECTED</span>
            <span className={`text-2xl sm:text-3xl font-extrabold ${
              totalSelected >= owed ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              ${totalSelected}M <span className="text-zinc-500 text-lg">/ ${owed}M</span>
            </span>
          </div>
        </div>

        {error && (
          <div className="my-3 p-3 bg-red-950/60 border border-red-700 rounded-lg text-red-200 text-sm flex items-center gap-2 flex-shrink-0">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Cards Selection Area */}
        <div className="flex-1 overflow-y-auto space-y-5 py-3 pr-2 min-h-0">
          
          {/* ASKING PLAYER ASSETS OVERVIEW */}
          {askingPlayer && (
            <div className="bg-zinc-900/70 border border-zinc-700/80 rounded-xl p-3.5 shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-950/70 border border-amber-800 px-2 py-0.5 rounded">
                    RENT DEMANDED BY
                  </span>
                  <span className="text-white font-extrabold text-sm uppercase">
                    {askingPlayer.name}
                  </span>
                  {askingPlayer.completedSetsCount > 0 && (
                    <span className="text-[10px] text-emerald-400 font-extrabold bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                      {askingPlayer.completedSetsCount} / 3 FULL SETS
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 px-2.5 py-1 rounded-md">
                    <Coins className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-zinc-400 font-bold text-[11px]">THEIR BANK:</span>
                    <span className="font-extrabold text-white text-xs">
                      ${askingPlayer.bankValue || 0}M
                    </span>
                  </div>
                </div>
              </div>

              {/* Asking Player's Properties on Board */}
              <div className="mt-2.5">
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block mb-1.5">
                  THEIR PROPERTIES IN PLAY ({Object.values(askingPlayer.properties || {}).reduce((sum, s) => sum + (s.cards?.length || 0), 0)} CARDS):
                </span>

                {Object.values(askingPlayer.properties || {}).every(s => !s.cards || s.cards.length === 0) ? (
                  <div className="text-xs text-zinc-500 italic py-1">
                    {askingPlayer.name} currently has no properties on the board.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(askingPlayer.properties || {}).map(([colorKey, set]) => {
                      if (!set.cards || set.cards.length === 0) return null;
                      const meta = PROPERTY_COLORS[colorKey];
                      const isFull = meta && set.cards.length >= meta.size;
                      return (
                        <div
                          key={colorKey}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                            isFull
                              ? 'bg-zinc-900 border-emerald-500/80 shadow-xs'
                              : 'bg-zinc-950 border-zinc-800'
                          }`}
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: meta?.hex || '#fff' }}
                          />
                          <span className="font-bold text-white uppercase text-[11px]">
                            {meta?.name || colorKey}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-bold">
                            ({set.cards.length}{meta?.size ? `/${meta.size}` : ''})
                          </span>
                          {set.houses > 0 && (
                            <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/60 px-1 rounded">
                              +{set.houses}H
                            </span>
                          )}
                          {set.hotels > 0 && (
                            <span className="text-[9px] text-amber-400 font-bold bg-amber-950/60 px-1 rounded">
                              +HTL
                            </span>
                          )}
                          {isFull && (
                            <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-wider ml-0.5">
                              [FULL SET]
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 1: Bank Cards */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/80">
              <span className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-400" />
                1. BANK VAULT ({bank.length} CARDS AVAILABLE)
              </span>
              <span className="text-xs text-zinc-500">
                Total Bank Value: ${bank.reduce((sum, c) => sum + c.value, 0)}M
              </span>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              {bank.map((card) => {
                const isSelected = selectedItems.some(item => item.type === 'bank' && item.cardId === card.id);
                const isCardDisabled = !isSelected && isFulfilled;
                return (
                  <div
                    key={card.id}
                    className={`relative group cursor-pointer transition-all ${
                      isCardDisabled ? 'opacity-30 cursor-not-allowed scale-95' : 'hover:scale-102'
                    }`}
                    onClick={() => !isCardDisabled && toggleBankCard(card)}
                  >
                    <CardView card={card} size="md" isSelected={isSelected} />
                    {onZoomCard && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onZoomCard(card);
                        }}
                        title="Zoom card"
                        className="absolute top-2 right-2 p-1 bg-black/90 hover:bg-black text-zinc-300 hover:text-white rounded border border-zinc-700 z-20 shadow-md"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
              {bank.length === 0 && (
                <div className="text-sm text-zinc-600 italic py-4">No cards in your bank vault.</div>
              )}
            </div>
          </div>

          {/* Section 2: Property Cards */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/80">
              <span className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
                2. PROPERTIES IN PLAY
              </span>
              <span className="text-xs text-zinc-500">
                Cannot pay with cards from completed sets if you have other cards
              </span>
            </div>

            <div className="space-y-4">
              {Object.entries(properties).map(([colorKey, set]) => {
                if (!set.cards || set.cards.length === 0) return null;
                const meta = PROPERTY_COLORS[colorKey];
                return (
                  <div key={colorKey} className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl">
                    <span className="text-xs font-bold uppercase mb-2.5 block tracking-wider" style={{ color: meta?.hex || '#fff' }}>
                      {meta?.name || colorKey} ({set.cards.length} cards)
                    </span>
                    <div className="flex flex-wrap gap-4 items-center">
                      {set.cards.map((card) => {
                        const isSelected = selectedItems.some(item => item.type === 'property' && item.cardId === card.id);
                        const isCardDisabled = !isSelected && isFulfilled;
                        return (
                          <div
                            key={card.id}
                            className={`relative group cursor-pointer transition-all ${
                              isCardDisabled ? 'opacity-30 cursor-not-allowed scale-95' : 'hover:scale-102'
                            }`}
                            onClick={() => !isCardDisabled && togglePropertyCard(card, colorKey)}
                          >
                            <CardView card={card} size="md" isSelected={isSelected} />
                            {onZoomCard && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onZoomCard(card);
                                }}
                                title="Zoom card"
                                className="absolute top-2 right-2 p-1 bg-black/90 hover:bg-black text-zinc-300 hover:text-white rounded border border-zinc-700 z-20 shadow-md"
                              >
                                <ZoomIn className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {totalNetWorth === 0 && (
                <div className="text-sm text-zinc-500 italic py-4">
                  You have no assets in bank or properties! You can surrender $0M.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between flex-shrink-0">
          <div>
            {isFulfilled ? (
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Debt fulfilled! Click Submit Payment to transfer assets.
              </span>
            ) : totalNetWorth < owed ? (
              <span className="text-xs text-amber-400">
                You only have ${totalNetWorth}M total in play. Surrender all assets to continue.
              </span>
            ) : (
              <span className="text-xs text-zinc-400">
                Select cards until total reaches at least ${owed}M. No change is given.
              </span>
            )}
          </div>

          <button
            onClick={handlePay}
            disabled={!canSubmit}
            className={`py-3 px-8 rounded-xl text-sm uppercase font-extrabold tracking-wider transition-all flex items-center gap-2 ${
              canSubmit
                ? 'bg-white text-black hover:bg-zinc-200 cursor-pointer shadow-xl hover:scale-102'
                : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
            }`}
          >
            <Check className="w-5 h-5" />
            SUBMIT PAYMENT (${totalSelected}M)
          </button>
        </div>
      </div>
    </div>
  );
}
