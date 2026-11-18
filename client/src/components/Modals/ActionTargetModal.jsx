import React, { useState } from 'react';
import { PROPERTY_COLORS } from '../Common/CardView';
import { X, Check } from 'lucide-react';

export default function ActionTargetModal({
  isOpen,
  onClose,
  card,
  hand,
  myProperties,
  opponents,
  actionsRemaining,
  onSubmitAction
}) {
  if (!isOpen || !card) return null;

  // Calculate an opponent's total assets (bank value + property card values)
  const getOpponentNetWorth = (opp) => {
    if (!opp) return 0;
    const bankVal = opp.bankValue || 0;
    let propVal = 0;
    if (opp.properties) {
      for (const set of Object.values(opp.properties)) {
        if (set && set.cards) {
          propVal += set.cards.reduce((sum, c) => sum + (c.value || 0), 0);
        }
      }
    }
    return bankVal + propVal;
  };

  const hasAssets = (opp) => getOpponentNetWorth(opp) > 0;
  const anyOpponentHasAssets = opponents.some(hasAssets);

  // Default target player to first one with assets, or opponents[0]
  const defaultTarget = opponents.find(hasAssets) || opponents[0];
  const [selectedTargetPlayerId, setSelectedTargetPlayerId] = useState(defaultTarget?.id || '');
  const [selectedColor, setSelectedColor] = useState('');
  const [useDoubleRent, setUseDoubleRent] = useState(false);
  const [mySelectedCardId, setMySelectedCardId] = useState('');
  const [theirSelectedCardId, setTheirSelectedCardId] = useState('');
  const [error, setError] = useState('');

  const doubleRentCard = hand.find(c => c.actionType === 'double_the_rent');
  const canDoubleRent = !!doubleRentCard && actionsRemaining >= 2;

  const targetOpponent = opponents.find(o => o.id === selectedTargetPlayerId);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    try {
      if (card.type === 'wildcard') {
        if (!selectedColor) throw new Error('Please select a property color.');
        const isRainbow = card.colors && card.colors.length > 2;
        if (isRainbow) {
          const hasBaseCard = myProperties[selectedColor]?.cards?.some(c => c.type === 'property' && (!c.colors || c.colors.length <= 2));
          if (!hasBaseCard) {
            throw new Error(`Rainbow wildcard requires a base property card of ${PROPERTY_COLORS[selectedColor]?.name || selectedColor} in play.`);
          }
        }
        onSubmitAction({ action: 'play_property', chosenColor: selectedColor });
      } else if (card.type === 'rent') {
        if (!selectedColor) throw new Error('Please select which property color to collect rent on.');
        if (card.isWildRent) {
          if (!selectedTargetPlayerId) throw new Error('Please select a target player for wild rent.');
          if (targetOpponent && !hasAssets(targetOpponent)) {
            throw new Error(`Cannot charge rent to ${targetOpponent.name} because they have no money or properties in play.`);
          }
        } else {
          if (!anyOpponentHasAssets) {
            throw new Error('None of your opponents have any money or properties to pay rent.');
          }
        }
        onSubmitAction({
          action: 'play_rent',
          chosenColor: selectedColor,
          doubleRentCardId: useDoubleRent && doubleRentCard ? doubleRentCard.id : null,
          targetPlayerId: card.isWildRent ? selectedTargetPlayerId : null
        });
      } else if (card.actionType === 'deal_breaker') {
        if (!selectedTargetPlayerId) throw new Error('Select a target player.');
        if (!selectedColor) throw new Error('Select a complete property set to steal.');
        onSubmitAction({
          action: 'play_deal_breaker',
          targetPlayerId: selectedTargetPlayerId,
          targetColor: selectedColor
        });
      } else if (card.actionType === 'sly_deal') {
        if (!selectedTargetPlayerId) throw new Error('Select a target player.');
        if (!theirSelectedCardId || !selectedColor) throw new Error('Select a property card to steal.');
        onSubmitAction({
          action: 'play_sly_deal',
          targetPlayerId: selectedTargetPlayerId,
          targetCardId: theirSelectedCardId,
          targetColor: selectedColor
        });
      } else if (card.actionType === 'forced_deal') {
        if (!selectedTargetPlayerId) throw new Error('Select a target player.');
        if (!mySelectedCardId) throw new Error('Select a property to give from your collection.');
        if (!theirSelectedCardId) throw new Error("Select a property to take from the opponent's collection.");
        
        // Find my card color
        let myCol = '';
        for (const [col, set] of Object.entries(myProperties)) {
          if (set.cards.some(c => c.id === mySelectedCardId)) {
            myCol = col;
            break;
          }
        }

        // Find their card color
        let theirCol = selectedColor;
        if (!theirCol && targetOpponent) {
          for (const [col, set] of Object.entries(targetOpponent.properties)) {
            if (set.cards.some(c => c.id === theirSelectedCardId)) {
              theirCol = col;
              break;
            }
          }
        }

        if (!myCol) throw new Error('Could not find the color set for your selected property.');
        if (!theirCol) throw new Error("Could not find the color set for the opponent's selected property.");

        onSubmitAction({
          action: 'play_forced_deal',
          targetPlayerId: selectedTargetPlayerId,
          myCardId: mySelectedCardId,
          myColor: myCol,
          theirCardId: theirSelectedCardId,
          theirColor: theirCol
        });
      } else if (card.actionType === 'debt_collector') {
        if (!selectedTargetPlayerId) throw new Error('Select a target player to charge $5M.');
        onSubmitAction({
          action: 'play_debt_collector',
          targetPlayerId: selectedTargetPlayerId
        });
      } else if (card.actionType === 'house' || card.actionType === 'hotel') {
        if (!selectedColor) throw new Error('Select a completed set to build on.');
        onSubmitAction({
          action: 'play_building',
          targetColor: selectedColor
        });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 font-mono">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
          <div>
            <h3 className="text-white font-bold text-sm tracking-wider uppercase">
              PLAY CARD: {card.name}
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">{card.description}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2 bg-red-950/40 border border-red-800 rounded text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Wildcard Property Color Choice */}
          {card.type === 'wildcard' && (
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">
                CHOOSE PROPERTY SET COLOR:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {card.colors.map(col => {
                  const meta = PROPERTY_COLORS[col];
                  const isRainbow = card.colors && card.colors.length > 2;
                  const hasBaseCard = myProperties[col]?.cards?.some(c => c.type === 'property' && (!c.colors || c.colors.length <= 2));
                  const disabled = isRainbow && !hasBaseCard;

                  return (
                    <button
                      key={col}
                      type="button"
                      disabled={disabled}
                      onClick={() => !disabled && setSelectedColor(col)}
                      className={`p-2 rounded border text-xs font-bold uppercase transition-all flex items-center justify-between ${
                        selectedColor === col
                          ? 'border-white bg-zinc-800 text-white'
                          : disabled
                          ? 'border-zinc-900 bg-zinc-950/60 text-zinc-600 opacity-50 cursor-not-allowed'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600 cursor-pointer'
                      }`}
                    >
                      <span style={{ color: disabled ? '#71717a' : meta?.hex || '#fff' }}>
                        {meta?.name || col} {disabled ? ' [Needs base card]' : ''}
                      </span>
                      {selectedColor === col && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Rent Card Target Options */}
          {card.type === 'rent' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">
                  COLLECT RENT ON COLOR:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {card.colors.map(col => {
                    const meta = PROPERTY_COLORS[col];
                    const ownedCount = myProperties[col]?.cards?.length || 0;
                    if (ownedCount === 0) return null;

                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setSelectedColor(col)}
                        className={`p-2 rounded border text-xs font-bold uppercase transition-all flex items-center justify-between ${
                          selectedColor === col
                            ? 'border-white bg-zinc-800 text-white'
                            : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        <span style={{ color: meta?.hex || '#fff' }}>
                          {meta?.name || col} ({ownedCount} owned)
                        </span>
                        {selectedColor === col && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* No assets warning for regular rent */}
              {!card.isWildRent && !anyOpponentHasAssets && (
                <div className="p-2.5 bg-amber-950/40 border border-amber-800 rounded text-amber-300 text-xs">
                  Cannot collect rent: None of your opponents have any money or properties in play.
                </div>
              )}

              {/* Wild Rent Target Player */}
              {card.isWildRent && (
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">
                    TARGET PLAYER (WILD RENT):
                  </label>
                  {!anyOpponentHasAssets ? (
                    <div className="p-2.5 bg-amber-950/40 border border-amber-800 rounded text-amber-300 text-xs">
                      No opponents currently have any money or properties to pay rent.
                    </div>
                  ) : (
                    <select
                      value={selectedTargetPlayerId}
                      onChange={(e) => setSelectedTargetPlayerId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded text-white text-xs font-mono"
                    >
                      {opponents.map(opp => {
                        const eligible = hasAssets(opp);
                        return (
                          <option key={opp.id} value={opp.id} disabled={!eligible}>
                            {opp.name} (${opp.bankValue}M Bank){!eligible ? ' — [No assets]' : ''}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              )}

              {/* Double The Rent Checkbox */}
              {canDoubleRent && (
                <label className="flex items-center gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={useDoubleRent}
                    onChange={(e) => setUseDoubleRent(e.target.checked)}
                    className="accent-white"
                  />
                  <span>
                    Play <strong className="text-white">Double The Rent</strong> with this card (costs 2 actions)
                  </span>
                </label>
              )}
            </div>
          )}

          {/* 3. Debt Collector */}
          {card.actionType === 'debt_collector' && (
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">
                DEMAND $5M FROM:
              </label>
              <div className="space-y-1.5">
                {opponents.map(opp => (
                  <button
                    key={opp.id}
                    type="button"
                    onClick={() => setSelectedTargetPlayerId(opp.id)}
                    className={`w-full p-2.5 rounded border text-xs font-bold uppercase transition-all flex items-center justify-between ${
                      selectedTargetPlayerId === opp.id
                        ? 'border-white bg-zinc-800 text-white'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <span>{opp.name}</span>
                    <span className="text-zinc-500 font-normal">Bank: ${opp.bankValue}M</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Deal Breaker Target Set Selection */}
          {card.actionType === 'deal_breaker' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                  TARGET OPPONENT:
                </label>
                <select
                  value={selectedTargetPlayerId}
                  onChange={(e) => {
                    setSelectedTargetPlayerId(e.target.value);
                    setSelectedColor('');
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded text-white text-xs font-mono"
                >
                  {opponents.map(opp => (
                    <option key={opp.id} value={opp.id}>
                      {opp.name} ({opp.completedSets?.length || 0} completed sets)
                    </option>
                  ))}
                </select>
              </div>

              {targetOpponent && (
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                    SELECT COMPLETED SET TO STEAL:
                  </label>
                  <div className="space-y-1.5">
                    {targetOpponent.completedSets?.map(col => {
                      const meta = PROPERTY_COLORS[col];
                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setSelectedColor(col)}
                          className={`w-full p-2 rounded border text-xs font-bold uppercase flex items-center justify-between ${
                            selectedColor === col
                              ? 'border-white bg-zinc-800 text-white'
                              : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                          }`}
                        >
                          <span style={{ color: meta?.hex || '#fff' }}>{meta?.name || col} SET</span>
                          {selectedColor === col && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                    {(!targetOpponent.completedSets || targetOpponent.completedSets.length === 0) && (
                      <div className="text-xs text-zinc-500 italic py-2">
                        This player has no completed property sets to steal.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. Sly Deal Single Property Selection */}
          {card.actionType === 'sly_deal' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                  TARGET OPPONENT:
                </label>
                <select
                  value={selectedTargetPlayerId}
                  onChange={(e) => {
                    setSelectedTargetPlayerId(e.target.value);
                    setTheirSelectedCardId('');
                    setSelectedColor('');
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded text-white text-xs font-mono"
                >
                  {opponents.map(opp => (
                    <option key={opp.id} value={opp.id}>{opp.name}</option>
                  ))}
                </select>
              </div>

              {targetOpponent && (
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                    SELECT PROPERTY TO STEAL (NOT IN COMPLETE SET):
                  </label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {Object.entries(targetOpponent.properties).map(([col, set]) => {
                      const isComplete = targetOpponent.completedSets?.includes(col);
                      if (isComplete || set.cards.length === 0) return null;

                      return set.cards.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setTheirSelectedCardId(c.id);
                            setSelectedColor(col);
                          }}
                          className={`w-full p-2 rounded border text-xs font-bold flex items-center justify-between ${
                            theirSelectedCardId === c.id
                              ? 'border-white bg-zinc-800 text-white'
                              : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                          }`}
                        >
                          <span>{c.name} ({PROPERTY_COLORS[col]?.name})</span>
                          <span>${c.value}M</span>
                        </button>
                      ));
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5.5 Forced Deal: Swap Properties between you and opponent */}
          {card.actionType === 'forced_deal' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                  1. TARGET OPPONENT TO SWAP WITH:
                </label>
                <select
                  value={selectedTargetPlayerId}
                  onChange={(e) => {
                    setSelectedTargetPlayerId(e.target.value);
                    setTheirSelectedCardId('');
                    setSelectedColor('');
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded text-white text-xs font-mono"
                >
                  {opponents.map(opp => (
                    <option key={opp.id} value={opp.id}>{opp.name}</option>
                  ))}
                </select>
              </div>

              {/* My Property to Give */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                  2. YOUR PROPERTY TO GIVE (CANNOT BE COMPLETE SET):
                </label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {Object.entries(myProperties).map(([col, set]) => {
                    if (!set.cards || set.cards.length === 0) return null;
                    const meta = PROPERTY_COLORS[col];
                    return set.cards.map(c => {
                      const isSelected = mySelectedCardId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setMySelectedCardId(c.id)}
                          className={`w-full p-2 rounded border text-xs font-bold flex items-center justify-between transition-all ${
                            isSelected
                              ? 'border-white bg-zinc-800 text-white shadow-sm'
                              : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta?.hex || '#fff' }} />
                            <span>{c.name} ({meta?.name || col})</span>
                          </div>
                          <span>${c.value}M</span>
                        </button>
                      );
                    });
                  })}
                  {Object.values(myProperties).every(s => !s.cards || s.cards.length === 0) && (
                    <div className="text-xs text-zinc-500 italic py-1">
                      You have no properties in play to trade!
                    </div>
                  )}
                </div>
              </div>

              {/* Opponent Property to Take */}
              {targetOpponent && (
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
                    3. OPPONENT'S PROPERTY TO TAKE (CANNOT BE COMPLETE SET):
                  </label>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {Object.entries(targetOpponent.properties).map(([col, set]) => {
                      const isComplete = targetOpponent.completedSets?.includes(col);
                      if (isComplete || !set.cards || set.cards.length === 0) return null;
                      const meta = PROPERTY_COLORS[col];

                      return set.cards.map(c => {
                        const isSelected = theirSelectedCardId === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setTheirSelectedCardId(c.id);
                              setSelectedColor(col);
                            }}
                            className={`w-full p-2 rounded border text-xs font-bold flex items-center justify-between transition-all ${
                              isSelected
                                ? 'border-white bg-zinc-800 text-white shadow-sm'
                                : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta?.hex || '#fff' }} />
                              <span>{c.name} ({meta?.name || col})</span>
                            </div>
                            <span>${c.value}M</span>
                          </button>
                        );
                      });
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 6. House / Hotel Set Selection */}
          {(card.actionType === 'house' || card.actionType === 'hotel') && (
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">
                SELECT COMPLETED SET FOR {card.actionType.toUpperCase()}:
              </label>
              <div className="space-y-2">
                {Object.entries(myProperties).map(([col, set]) => {
                  if (col === 'railroad' || col === 'utility') return null;
                  const meta = PROPERTY_COLORS[col];
                  const hasHouse = set.houses > 0;
                  const isEligible = card.actionType === 'house' ? !hasHouse : (hasHouse && set.hotels === 0);

                  return (
                    <button
                      key={col}
                      type="button"
                      disabled={!isEligible}
                      onClick={() => setSelectedColor(col)}
                      className={`w-full p-2.5 rounded border text-xs font-bold uppercase transition-all flex items-center justify-between ${
                        selectedColor === col
                          ? 'border-white bg-zinc-800 text-white'
                          : isEligible
                          ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
                          : 'border-zinc-900 bg-black text-zinc-600 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <span style={{ color: meta?.hex || '#fff' }}>{meta?.name || col}</span>
                      <span>
                        {hasHouse ? 'Has House' : 'No House'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded text-xs uppercase font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                (card.type === 'rent' && !anyOpponentHasAssets) ||
                (card.type === 'rent' && card.isWildRent && (!targetOpponent || !hasAssets(targetOpponent)))
              }
              className="px-5 py-2 bg-white hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white text-black rounded text-xs uppercase font-bold tracking-wider"
            >
              Confirm Play
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
