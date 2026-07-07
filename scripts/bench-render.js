import puppeteer from 'puppeteer';

const QUALITY = process.argv[2] || 'low';
const FPS_TARGET = QUALITY === 'low' ? 30 : 60;
const FRAME_COUNT = 600;

async function bench() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 576 });

  await page.goto(`http://localhost:4173?quality=${QUALITY}`, { waitUntil: 'networkidle0' });

  const fps = await page.evaluate(async (frameCount) => {
    const frames = [];
    return new Promise((resolve) => {
      function tick() {
        frames.push(performance.now());
        if (frames.length < frameCount) {
          requestAnimationFrame(tick);
        } else {
          resolve(frames);
        }
      }
      requestAnimationFrame(tick);
    });
  }, FRAME_COUNT);

  await browser.close();

  if (fps.length < 2) {
    console.error('Not enough frames');
    process.exit(1);
  }

  const diffs = [];
  for (let i = 1; i < fps.length; i++) {
    diffs.push(fps[i] - fps[i - 1]);
  }

  diffs.sort((a, b) => a - b);
  const median = diffs[Math.floor(diffs.length / 2)];
  const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const fpsMean = 1000 / mean;
  const fpsMedian = 1000 / median;

  console.log(`Preset: ${QUALITY}`);
  console.log(`Frames: ${fps.length}`);
  console.log(`Mean frame time: ${mean.toFixed(2)} ms (${fpsMean.toFixed(1)} fps)`);
  console.log(`Median frame time: ${median.toFixed(2)} ms (${fpsMedian.toFixed(1)} fps)`);

  if (fpsMedian < FPS_TARGET) {
    console.error(`FAIL (${QUALITY}): median fps ${fpsMedian.toFixed(1)} < ${FPS_TARGET}`);
    process.exit(1);
  }
  console.log(`PASS (${QUALITY}): median fps ${fpsMedian.toFixed(1)} >= ${FPS_TARGET}`);
}

bench().catch((err) => {
  console.error(err);
  process.exit(1);
});
