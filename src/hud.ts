export function createHUD(): { update: (data: HUDData) => void; remove: () => void } {
  const el = document.createElement('div');
  el.id = 'game-hud';
  el.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:9997;font-family:sans-serif;display:none;';
  el.innerHTML = `
    <div id="hud-top" style="position:absolute;top:12px;left:50%;transform:translateX(-50%);display:flex;gap:24px;background:rgba(0,0,0,0.5);padding:6px 16px;border-radius:4px;color:#fff;font-size:13px;">
      <span id="hud-kills">☠️ 0</span>
      <span id="hud-alive">👥 0 Alive</span>
      <span id="hud-storm" style="display:none;color:#f44;">⚠️ STORM</span>
    </div>
    <div id="hud-bottom" style="position:absolute;bottom:24px;left:50%;transform:translateX(-50%);display:flex;gap:16px;align-items:center;background:rgba(0,0,0,0.5);padding:8px 20px;border-radius:6px;color:#fff;">
      <div style="display:flex;flex-direction:column;gap:4px;min-width:120px;">
        <div style="font-size:11px;color:#aaa;">HEALTH</div>
        <div style="height:8px;width:120px;background:#333;border-radius:4px;overflow:hidden;"><div id="hud-health-bar" style="height:100%;width:100%;background:#4f4;border-radius:4px;transition:width 0.2s;"></div></div>
      </div>
      <div id="hud-weapon" style="text-align:center;">
        <div id="hud-weapon-name" style="font-size:13px;font-weight:bold;">RIFLE</div>
        <div id="hud-ammo" style="font-size:11px;color:#aaa;">30 / 90</div>
      </div>
    </div>
    <div id="hud-damage" style="position:absolute;inset:0;background:radial-gradient(transparent 50%, rgba(255,0,0,0.4) 100%);opacity:0;transition:opacity 0.1s;pointer-events:none;"></div>
  `;
  document.body.appendChild(el);

  return {
    update(data: HUDData) {
      el.style.display = 'block';
      document.getElementById('hud-kills')!.textContent = `☠️ ${data.kills}`;
      document.getElementById('hud-alive')!.textContent = `👥 ${data.alive} Alive`;
      document.getElementById('hud-health-bar')!.style.width = `${data.health}%`;
      document.getElementById('hud-weapon-name')!.textContent = data.weapon;
      document.getElementById('hud-ammo')!.textContent = `${data.ammo} / ${data.reserve}`;
      const stormEl = document.getElementById('hud-storm')!;
      stormEl.style.display = data.inStorm ? 'block' : 'none';
      if (data.justHit) {
        const dmg = document.getElementById('hud-damage')!;
        dmg.style.opacity = '1';
        setTimeout(() => (dmg.style.opacity = '0'), 150);
      }
    },
    remove() {
      el.remove();
    },
  };
}

export interface HUDData {
  kills: number;
  alive: number;
  health: number;
  weapon: string;
  ammo: number;
  reserve: number;
  inStorm: boolean;
  justHit: boolean;
}

export function createMinimap(): { update: (data: MinimapData) => void } {
  const canvas = document.createElement('canvas');
  canvas.id = 'minimap';
  canvas.width = 160;
  canvas.height = 160;
  canvas.style.cssText =
    'position:fixed;top:50px;right:12px;z-index:9997;border:2px solid rgba(255,255,255,0.3);border-radius:4px;background:#1a1a2e;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;

  return {
    update(data: MinimapData) {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, 160, 160);
      const s = 160 / 1000;
      const ox = 80 - data.px * s;
      const oz = 80 - data.pz * s;

      ctx.strokeStyle = '#9932cc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(data.sx * s + ox, data.sz * s + oz, data.sr * s, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#555';
      for (const b of data.buildings) {
        ctx.fillRect(b.x * s + ox - 2, b.z * s + oz - 2, 4, 4);
      }

      ctx.fillStyle = '#f44';
      for (const e of data.enemies) {
        if (!e.alive) continue;
        ctx.beginPath();
        ctx.arc(e.x * s + ox, e.z * s + oz, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.arc(ox, oz, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ox, oz);
      ctx.lineTo(ox + Math.sin(data.pyaw) * 15, oz + Math.cos(data.pyaw) * 15);
      ctx.stroke();
    },
  };
}

export interface MinimapData {
  px: number;
  pz: number;
  pyaw: number;
  sx: number;
  sz: number;
  sr: number;
  buildings: { x: number; z: number }[];
  enemies: { x: number; z: number; alive: boolean }[];
}
