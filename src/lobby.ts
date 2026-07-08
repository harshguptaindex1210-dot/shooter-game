export interface LobbyCallbacks {
  onStartMatch: () => void;
  onSettingsChange: (settings: Record<string, string>) => void;
}

export function showLobby(
  stats: { level: number; xp: number; wins: number; kills: number; matches: number },
  callbacks: LobbyCallbacks
) {
  const existing = document.getElementById('lobby-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'lobby-overlay';
  overlay.style.cssText =
    'position:fixed;inset:0;background:linear-gradient(135deg,#0a0a1a 0%,#1a1a3a 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9998;font-family:sans-serif;color:white;';

  overlay.innerHTML = `
    <h1 style="font-size:48px;margin-bottom:8px;letter-spacing:4px;text-transform:uppercase;color:#4af;text-shadow:0 0 20px rgba(68,170,255,0.3);">ROBOT ARENA</h1>
    <p style="color:#889;margin-bottom:32px;font-size:14px;">Battle Royale — Robot Apocalypse</p>
    <button id="btn-start" style="padding:14px 48px;font-size:18px;background:#4af;color:#000;border:none;border-radius:4px;cursor:pointer;font-weight:bold;text-transform:uppercase;letter-spacing:2px;margin-bottom:24px;">Start Match</button>
    <div id="stats-panel" style="background:rgba(255,255,255,0.05);padding:16px 24px;border-radius:8px;min-width:280px;text-align:center;">
      <h3 style="margin:0 0 12px;color:#8af;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Player Stats</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;">
        <span style="color:#889;">Level</span><span style="color:#fff;">${stats.level}</span>
        <span style="color:#889;">XP</span><span style="color:#fff;">${stats.xp}</span>
        <span style="color:#889;">Wins</span><span style="color:#4f4;">${stats.wins}</span>
        <span style="color:#889;">Kills</span><span style="color:#f44;">${stats.kills}</span>
        <span style="color:#889;">Matches</span><span style="color:#fff;">${stats.matches}</span>
      </div>
    </div>
    <div id="settings-panel" style="margin-top:16px;background:rgba(255,255,255,0.05);padding:12px 24px;border-radius:8px;min-width:280px;text-align:center;">
      <h3 style="margin:0 0 12px;color:#8af;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Settings</h3>
      <div style="display:flex;gap:12px;justify-content:center;">
        <label style="font-size:13px;color:#889;">Quality
          <select id="sel-quality" style="margin-left:6px;padding:4px;background:#222;color:#fff;border:1px solid #444;border-radius:3px;">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
          </select>
        </label>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('btn-start')?.addEventListener('click', () => {
    callbacks.onStartMatch();
    overlay.remove();
  });

  document.getElementById('sel-quality')?.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;
    callbacks.onSettingsChange({ quality: target.value });
  });
}
