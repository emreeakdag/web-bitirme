export const isLocalHost =
  typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(window.location.hostname);

export const getRouterBasename = () => {
  if (typeof window === 'undefined') return '/';
  const isLocal = /localhost|127\.0\.0\.1/.test(window.location.hostname);
  if (isLocal) return '/';
  return window.location.pathname.startsWith('/quiz') ? '/quiz' : '/';
};

export const getAppBaseUrl = () => {
  if (typeof window === 'undefined') return '';
  const baseOrigin = window.location.origin;
  const basename = getRouterBasename();

  if (basename === '/') return baseOrigin;
  if (baseOrigin.endsWith(basename)) return baseOrigin;

  return `${baseOrigin}${basename}`;
};

export async function resolveAppBaseUrl() {
  if (typeof window === 'undefined') return '';

  const basename = getRouterBasename();
  const isLocal = /localhost|127\.0\.0\.1/.test(window.location.hostname);

  if (!isLocal) {
    return getAppBaseUrl();
  }

  try {
    const response = await fetch('http://localhost:5000/api/local-ip');
    const data = await response.json();
    const ip = data?.ip || 'localhost';
    const origin = `http://${ip}:5173`;
    if (basename === '/') return origin;
    return `${origin}${basename}`;
  } catch {
    return getAppBaseUrl();
  }
}
