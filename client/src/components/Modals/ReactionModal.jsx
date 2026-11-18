import React, { useEffect, useState } from 'react';
import { ShieldAlert, Shield, Check } from 'lucide-react';

export default function ReactionModal({
  pendingAction,
  playerId,
  hand,
  onJustSayNo,
  onAccept
}) {
  const [secondsLeft, setSecondsLeft] = useState(12);

  const isTarget = pendingAction?.targetPlayerIds?.includes(playerId);
  const isSource = pendingAction?.sourcePlayerId === playerId;
  const justSayNoChain = pendingAction?.justSayNoChain || [];
  const lastReaction = justSayNoChain[justSayNoChain.length - 1];

  // Check if I can respond:
  // If target, and last reaction wasn't from me
  // Or if source, and target played Just Say No
  const canRespond = (isTarget && lastReaction?.playerId !== playerId) ||
                     (isSource && lastReaction && lastReaction.playerId !== playerId);

  const jsnCard = hand.find(c => c.actionType === 'just_say_no');

  useEffect(() => {
    if (!pendingAction) return;
    setSecondsLeft(12);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (canRespond) {
            onAccept();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingAction, canRespond]);

  if (!pendingAction || !canRespond) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 font-mono animate-fade-in">
      <div className="bg-[#06190f] border border-emerald-800/80 rounded-xl max-w-md w-full p-6 shadow-2xl text-center relative">
        {/* Countdown badge */}
        <div className="absolute top-4 right-4 bg-zinc-900 border border-zinc-700 text-white font-bold text-xs px-2.5 py-1 rounded-full">
          {secondsLeft}s
        </div>

        <div className="w-12 h-12 bg-emerald-950/60 border border-emerald-700/60 rounded-full flex items-center justify-center mx-auto mb-3">
          <Shield className="w-6 h-6 text-emerald-400" />
        </div>

        <h3 className="text-white font-bold text-base tracking-wider uppercase mb-1">
          ACTION PLAYED AGAINST YOU!
        </h3>

        <div className="my-3 p-3 bg-zinc-900/70 border border-zinc-800 rounded-lg text-xs text-zinc-300 space-y-1">
          <p className="font-bold text-white text-sm">
            {pendingAction.actionCard?.name}
          </p>
          <p className="text-zinc-400">{pendingAction.actionCard?.description}</p>
          {pendingAction.amount && (
            <p className="text-amber-400 font-bold">Amount Demanded: ${pendingAction.amount}M</p>
          )}
        </div>

        {/* Action Chain history if any */}
        {justSayNoChain.length > 0 && (
          <div className="mb-4 text-xs text-amber-300 bg-amber-950/40 p-2 rounded border border-amber-900">
            {justSayNoChain.map((j, idx) => (
              <div key={idx}>&gt; {j.playerName} played Just Say No!</div>
            ))}
          </div>
        )}

        {/* Reaction Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          {jsnCard ? (
            <button
              onClick={() => onJustSayNo(jsnCard.id)}
              className="flex-1 py-3 px-4 bg-white hover:bg-zinc-200 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
            >
              <Shield className="w-4 h-4 fill-black" />
              PLAY "JUST SAY NO!"
            </button>
          ) : (
            <div className="flex-1 text-[11px] text-zinc-500 italic py-2">
              (No "Just Say No" card in hand)
            </div>
          )}

          <button
            onClick={onAccept}
            className="py-3 px-5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg text-xs uppercase font-bold tracking-wider transition-colors flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            ACCEPT
          </button>
        </div>
      </div>
    </div>
  );
}
