export function getApiBaseUrl(): string {
  // ブラウザでRailway上で動いている場合は同一オリジン
  if (typeof window !== 'undefined' && window.location.hostname.includes('railway.app')) {
    return '';
  }
  // localhost（開発中）
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return '';
  }
  // ネイティブアプリ（Capacitor）からはRailwayを直接叩く
  return 'https://episode-werewolf-production.up.railway.app';
}
