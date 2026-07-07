export function showAd(skipAfterMs: number = 10000): Promise<void> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.id = 'ad-overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;background:#000;display:flex;align-items:center;justify-content:center;z-index:9999;flex-direction:column;';
    overlay.innerHTML = `
      <div style="color:#888;font-family:sans-serif;font-size:24px;">Advertisement</div>
      <div style="color:#555;font-family:sans-serif;font-size:14px;margin-top:12px;">(placeholder — skippable in ${skipAfterMs / 1000}s)</div>
    `;
    document.body.appendChild(overlay);

    const skipBtn = document.createElement('button');
    skipBtn.textContent = 'Skip →';
    skipBtn.style.cssText =
      'margin-top:24px;padding:8px 24px;font-size:16px;cursor:pointer;opacity:0.5;transition:opacity 0.3s;';
    skipBtn.disabled = true;
    overlay.appendChild(skipBtn);

    const timer = setTimeout(() => {
      skipBtn.disabled = false;
      skipBtn.style.opacity = '1';
      skipBtn.style.cursor = 'pointer';
    }, skipAfterMs);

    skipBtn.onclick = () => {
      clearTimeout(timer);
      overlay.remove();
      resolve();
    };
  });
}
