import { useEffect, useRef, useState } from 'react';

const COUNTDOWN_BUTTONS = new Set([
  'Confirm & Reveal',
  'Play Again',
  'Tap to reveal role',
  'Tap to Reveal',
]);

const RESET_BUTTONS = new Set([
  'Reset',
  'Reset Word History',
  'New Setup',
]);

const SKIP_BUTTONS = new Set([
  'Vote to skip word',
]);

function getButtonText(button) {
  return (button?.textContent || '').replace(/\s+/g, ' ').trim();
}

function isResetButton(button, text) {
  return button?.getAttribute('aria-label') === 'Reset game' || RESET_BUTTONS.has(text);
}

function isSkipButton(text) {
  return SKIP_BUTTONS.has(text);
}

function getCountdownLabel(text) {
  if (text === 'Tap to reveal role' || text === 'Tap to Reveal') return 'Reveal in';
  if (text === 'Play Again') return 'Next round in';
  if (text === 'Confirm & Reveal') return 'Round starts in';
  return 'Starting in';
}

function scrollSetupToTopNow() {
  const reset = () => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.querySelector('.phone-frame')?.scrollTo?.({ top: 0, left: 0, behavior: 'auto' });
  };

  reset();
  window.requestAnimationFrame(reset);
  window.setTimeout(reset, 0);
}

export function GameGuards() {
  const [countdown, setCountdown] = useState(null);
  const bypassRef = useRef(false);
  const loadingTimersRef = useRef(new Map());

  useEffect(() => {
    function startLoadingLabel(button, label) {
      if (!button || loadingTimersRef.current.has(button)) return;
      const original = getButtonText(button);
      button.textContent = label;
      const timer = window.setInterval(() => {
        if (!document.body.contains(button)) {
          window.clearInterval(timer);
          loadingTimersRef.current.delete(button);
          return;
        }
        if (!button.disabled && getButtonText(button) === label) {
          button.textContent = original;
          window.clearInterval(timer);
          loadingTimersRef.current.delete(button);
          return;
        }
        if (button.disabled) button.textContent = label;
      }, 120);
      loadingTimersRef.current.set(button, timer);
      window.setTimeout(() => {
        const activeTimer = loadingTimersRef.current.get(button);
        if (activeTimer) {
          window.clearInterval(activeTimer);
          loadingTimersRef.current.delete(button);
        }
      }, 12000);
    }

    function runCountdown(button, label) {
      let value = 3;
      setCountdown({ value, label });
      const timer = window.setInterval(() => {
        value -= 1;
        if (value <= 0) {
          window.clearInterval(timer);
          setCountdown(null);
          bypassRef.current = true;
          button.click();
          window.setTimeout(() => { bypassRef.current = false; }, 0);
          return;
        }
        setCountdown({ value, label });
      }, 700);
    }

    function onClick(event) {
      if (bypassRef.current) return;
      const button = event.target.closest('button');
      if (!button || button.disabled) return;

      if (button.closest('.setup-bottom-nav')) {
        scrollSetupToTopNow();
      }

      const text = getButtonText(button);

      if (isResetButton(button, text)) {
        const ok = window.confirm('Are you sure? This can reset or leave the current game state.');
        if (!ok) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation?.();
        }
        return;
      }

      if (isSkipButton(text)) {
        const ok = window.confirm('Vote to skip this word? Do not tell other players you voted skip.');
        if (!ok) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation?.();
        }
        return;
      }

      if (COUNTDOWN_BUTTONS.has(text)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        runCountdown(button, getCountdownLabel(text));
        return;
      }

      if (text === 'Create Code') startLoadingLabel(button, 'Creating...');
      if (text === 'Join Session') startLoadingLabel(button, 'Joining...');
    }

    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      loadingTimersRef.current.forEach((timer) => window.clearInterval(timer));
      loadingTimersRef.current.clear();
    };
  }, []);

  if (!countdown) return null;

  return (
    <div className="countdown-overlay" role="status" aria-live="assertive">
      <div className="countdown-card">
        <span>{countdown.label}</span>
        <strong>{countdown.value}</strong>
      </div>
    </div>
  );
}
