import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function SoundToggle() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);
  const oscNodesRef = useRef([]);

  const startAmbience = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.01, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 3);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      // Create warm harmonic drone (atelier loom ambience)
      // Fundamental 108Hz (meditative golden ratio frequency) + subtle harmonics
      const freqs = [108, 162, 216, 324];
      const oscs = freqs.map((freq, i) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Low pass filter to keep it warm and non-intrusive
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);

        oscGain.gain.setValueAtTime(0.2 / (i + 1), ctx.currentTime);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(masterGain);
        osc.start();
        return osc;
      });

      oscNodesRef.current = oscs;
      setIsPlaying(true);
    } catch (err) {
      console.warn('AudioContext not supported', err);
    }
  };

  const stopAmbience = () => {
    if (audioCtxRef.current && gainNodeRef.current) {
      try {
        gainNodeRef.current.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 1);
        setTimeout(() => {
          oscNodesRef.current.forEach(osc => {
            try { osc.stop(); } catch(e) {}
          });
          audioCtxRef.current.close();
          setIsPlaying(false);
        }, 1000);
      } catch (err) {
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(false);
    }
  };

  const toggleSound = () => {
    if (isPlaying) {
      stopAmbience();
    } else {
      startAmbience();
    }
  };

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <button
      onClick={toggleSound}
      title={isPlaying ? "Mute Loom Ambience" : "Play Loom Ambience"}
      className="p-2 text-luxury-ivory hover:text-luxury-gold transition-colors duration-300 relative group flex items-center gap-1.5 text-xs font-sans tracking-wider"
      aria-label="Toggle loom atmosphere"
    >
      {isPlaying ? (
        <>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-luxury-gold opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-luxury-gold"></span>
          </span>
          <Volume2 className="w-4 h-4 text-luxury-gold" />
          <span className="hidden xl:inline text-[11px] uppercase tracking-widest text-luxury-champagne">Ambience On</span>
        </>
      ) : (
        <>
          <VolumeX className="w-4 h-4 opacity-70 group-hover:opacity-100" />
          <span className="hidden xl:inline text-[11px] uppercase tracking-widest text-luxury-ivory/70 group-hover:text-luxury-ivory">Atmosphere</span>
        </>
      )}
    </button>
  );
}
