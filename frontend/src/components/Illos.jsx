// Free animated illustrations from https://illos.dev (free licence: use and modify).
// They are inlined so the colours can follow the app theme and dark mode.
// Each file is loaded on demand so the illustrations do not inflate the main bundle.
import { useEffect, useState } from 'react';

const ART = {
  search: {
    theme: 'illos-hud',
    load: () => import('../assets/illos/search-index.svg?raw'),
  },
  analytics: {
    theme: 'illos-iso',
    load: () => import('../assets/illos/analytics-funnel.svg?raw'),
  },
  notifications: {
    theme: 'illos-iso',
    load: () => import('../assets/illos/notifications.svg?raw'),
  },
};

export default function Illos({ kind = 'search', className = '' }) {
  const [svg, setSvg] = useState('');
  const art = ART[kind];

  useEffect(() => {
    let cancelled = false;
    if (!art) return undefined;

    art.load().then((module) => {
      if (!cancelled) setSvg(module.default);
    }).catch(() => {
      /* an illustration is decorative; ignore load failures */
    });

    return () => {
      cancelled = true;
    };
  }, [art]);

  if (!art) return null;

  return (
    <div
      aria-hidden="true"
      className={`illos ${art.theme} ${className}`.trim()}
      style={{ aspectRatio: '720 / 460' }}
    >
      {svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : null}
    </div>
  );
}
