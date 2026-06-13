import { useEffect, useState } from 'react';

export function TurnTimer({ seconds, timerKey, onFinish }) {
  const duration = Number(seconds || 0);
  const [left, setLeft] = useState(duration);

  useEffect(() => {
    setLeft(duration);
    if (!duration) return undefined;

    const id = window.setInterval(() => {
      setLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(id);
  }, [duration, timerKey]);

  useEffect(() => {
    if (duration > 0 && left === 0) onFinish?.();
  }, [duration, left, onFinish]);

  if (!duration) return null;

  return <div className={`progress-pill ${left === 0 ? 'timer-ended' : ''}`}>Time: {left}s</div>;
}
