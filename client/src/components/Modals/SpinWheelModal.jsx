import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles } from 'lucide-react';
import { playTurnStartSound } from '../../utils/audio';

const SLICE_COLORS = [
  '#e11d48', // rose
  '#2563eb', // blue
  '#059669', // emerald
  '#d97706', // amber
  '#7c3aed'  // violet
];

export default function SpinWheelModal({
  isOpen,
  players = [],
  targetIndex = 0,
  onFinished
}) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const canvasRef = useRef(null);

  const numSlices = players.length;

  useEffect(() => {
    if (!isOpen || numSlices < 2) return;

    // Draw the wheel on canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const center = width / 2;
    const radius = center - 8;
    const sliceAngle = (2 * Math.PI) / numSlices;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < numSlices; i++) {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = SLICE_COLORS[i % SLICE_COLORS.length];
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#09090b';
      ctx.stroke();

      // Draw player name text radially
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px "Inter", sans-serif';
      ctx.fillText(players[i].name.toUpperCase(), radius - 20, 5);
      ctx.restore();
    }

    // Center hub
    ctx.beginPath();
    ctx.arc(center, center, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#09090b';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Start spin animation after brief mount delay
    const startTimer = setTimeout(() => {
      setIsSpinning(true);
      
      // Needle is at top (270 deg or -90 deg).
      // Calculate target angle so targetIndex slice ends up directly under the top needle:
      const sliceDeg = 360 / numSlices;
      // Slice center in degrees from 0:
      const sliceCenterDeg = targetIndex * sliceDeg + sliceDeg / 2;
      // Angle to place sliceCenterDeg at 270 deg (top):
      const finalDeg = 270 - sliceCenterDeg;
      // 6 full spins (2160 deg) plus final position
      const totalSpin = 2160 + ((finalDeg % 360) + 360) % 360;

      setRotation(totalSpin);

      // Finish spin after 3.8s
      const finishTimer = setTimeout(() => {
        setIsSpinning(false);
        const selectedWinner = players[targetIndex] || players[0];
        setWinner(selectedWinner);
        playTurnStartSound();

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}

        // Dismiss after announcing
        const dismissTimer = setTimeout(() => {
          onFinished();
        }, 1600);

        return () => clearTimeout(dismissTimer);
      }, 3800);

      return () => clearTimeout(finishTimer);
    }, 400);

    return () => clearTimeout(startTimer);
  }, [isOpen, numSlices, targetIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 font-mono animate-fade-in select-none">
      <div className="bg-zinc-950 border-2 border-white/40 rounded-2xl p-6 sm:p-8 max-w-sm w-full flex flex-col items-center text-center shadow-2xl relative">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-extrabold tracking-widest text-white uppercase">
            WHO GOES FIRST?
          </h2>
        </div>
        <p className="text-xs text-zinc-400 mb-6">
          Spinning the wheel of fortune...
        </p>

        {/* Wheel container */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-6">
          {/* Top Pointer Needle */}
          <div className="absolute -top-3 z-20 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
          </div>

          {/* Canvas Wheel */}
          <canvas
            ref={canvasRef}
            width={256}
            height={256}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 3.8s cubic-bezier(0.12, 0.8, 0.2, 1)' : 'none'
            }}
            className="rounded-full shadow-[0_0_25px_rgba(255,255,255,0.15)]"
          />
        </div>

        {/* Winner Announcement */}
        {winner ? (
          <div className="animate-bounce">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
              FIRST TURN GOES TO:
            </span>
            <span className="text-xl font-extrabold text-white mt-1 block tracking-wider">
              {winner.name.toUpperCase()}
            </span>
          </div>
        ) : (
          <span className="text-xs text-zinc-500 font-bold tracking-wider animate-pulse uppercase">
            SPINNING...
          </span>
        )}
      </div>
    </div>
  );
}
