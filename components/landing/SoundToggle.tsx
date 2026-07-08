'use client';

/**
 * SoundToggle — opt-in ambient audio (browser policy requires the gesture).
 * Off by default; the choice persists across visits.
 */

import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { goldSound } from './soundEngine';

const KEY = 'cardiq-sound';

export default function SoundToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(KEY) !== 'on') return;
    const arm = () => {
      goldSound.enable();
      setOn(true);
    };
    window.addEventListener('pointerdown', arm, { once: true });
    return () => window.removeEventListener('pointerdown', arm);
  }, []);

  const toggle = () => {
    if (on) {
      goldSound.disable();
      localStorage.setItem(KEY, 'off');
      setOn(false);
    } else {
      goldSound.enable();
      localStorage.setItem(KEY, 'on');
      setOn(true);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? 'Turn sound off' : 'Turn sound on'}
      data-sound-toggle
      className={`inline-flex items-center gap-1.5 rounded-sm border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
        on
          ? 'border-[rgba(245,200,66,0.45)] text-gold-400 bg-[rgba(245,200,66,0.07)]'
          : 'border-[#1E2D45] text-slate-500 hover:text-slate-300 hover:border-[rgba(192,200,216,0.35)]'
      }`}
    >
      {on ? <Volume2 size={13} /> : <VolumeX size={13} />}
      <span className="hidden sm:inline">{on ? 'Sound on' : 'Sound'}</span>
    </button>
  );
}
