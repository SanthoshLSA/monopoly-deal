import React from 'react';
import { Coins } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

function groupBankByDenomination(bankCards = []) {
  const map = new Map();
  for (const card of bankCards) {
    const val = card.value || 0;
    if (!map.has(val)) {
      map.set(val, { val, count: 0, sampleCard: card });
    }
    map.get(val).count++;
  }
  return Array.from(map.values()).sort((a, b) => b.val - a.val);
}

export default function MyBank({ player, onZoomCard }) {
  const { setHoveredCard } = useSocket();
  if (!player) return null;
  const bankDenoms = groupBankByDenomination(player.bank);

  return (
    <div className="h-full w-full bg-felt-panel border border-emerald-900/50 rounded-xl p-2 flex flex-col justify-between font-mono shadow-md overflow-hidden">
      <div className="flex items-center justify-between pb-1 border-b border-emerald-900/40 flex-shrink-0">
        <span className="text-[11px] font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5 text-yellow-400" />
          MY BANK VAULT
        </span>
        <span className="text-xs font-extrabold text-white bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
          ${player.bankValue}M
        </span>
      </div>

      {/* Denominations Badges */}
      <div className="flex-1 flex flex-wrap gap-1.5 overflow-y-auto py-1 items-center min-h-0">
        {bankDenoms.length === 0 ? (
          <span className="text-[10px] text-emerald-800/50 italic py-0.5">Vault is currently empty</span>
        ) : (
          bankDenoms.map(({ val, count, sampleCard }) => (
            <button
              key={val}
              type="button"
              onMouseEnter={() => sampleCard && setHoveredCard && setHoveredCard(sampleCard)}
              onMouseLeave={() => setHoveredCard && setHoveredCard(null)}
              onClick={() => onZoomCard && onZoomCard(sampleCard)}
              title={`$${val}M (x${count}) - Hover to preview`}
              className="px-2 py-1 rounded-md bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-800/50 hover:border-white text-zinc-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs font-mono"
            >
              <span>${val}M</span>
              <span className="text-zinc-500 font-normal text-[10px]">x{count}</span>
            </button>
          ))
        )}
      </div>

      <div className="text-[8px] text-emerald-800/60 pt-0.5 border-t border-emerald-900/30 text-right flex-shrink-0">
        {player.bank.length} card(s) stored
      </div>
    </div>
  );
}
