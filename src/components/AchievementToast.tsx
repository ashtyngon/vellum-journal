import { useState, useEffect } from 'react';

interface AchievementToastProps {
  achievement: { name: string; icon: string; description: string };
  onDismiss: () => void;
}

export default function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`fixed top-20 right-4 z-[150] transition-all duration-300 ${
      visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="bg-paper rounded-xl shadow-lifted border border-wood-light/20 p-4 flex items-center gap-3 max-w-sm">
        <span className="text-3xl animate-bounce">{achievement.icon}</span>
        <div className="flex-1">
          <p className="font-mono text-[11px] text-primary uppercase tracking-wider">Achievement Unlocked</p>
          <p className="font-display italic text-base text-ink">{achievement.name}</p>
          <p className="font-body text-sm text-ink/60">{achievement.description}</p>
        </div>
        <button onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }} className="text-pencil/40 hover:text-ink transition-colors shrink-0 self-start">
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  );
}
