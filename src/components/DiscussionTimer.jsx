import { useEffect, useState } from 'react';

export function DiscussionTimer({ seconds, timerKey }) {
  const [left, setLeft] = useState(Number(seconds || 0));

  useEffect(() => {
    setLeft(Number(seconds || 0));
    if (!seconds) return undefined;

    const timer = window.setInterval(() => setLeft((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [seconds, timerKey]);

  if (!seconds) return null;

  return <div className={`progress-pill ${left === 0 ? 'timer-ended' : ''}`}>Discussion timer: {left}s</div>;
}
