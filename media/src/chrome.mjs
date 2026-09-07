// A minimal Chrome DevTools Protocol driver - no npm dependencies.
//
// Why CDP rather than `chrome --headless --screenshot`: it gives exact control
// over viewport size, a transparent backdrop, a guarantee that webfonts have
// finished loading before capture, and getBoundingClientRect measurement so
// transparent lockups can be trimmed to their real ink.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME_CANDIDATES = [
  `${process.env['ProgramFiles']}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env['ProgramFiles(x86)']}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env['LOCALAPPDATA']}\\Google\\Chrome\\Application\\chrome.exe`,
  `${process.env['ProgramFiles(x86)']}\\Microsoft\\Edge\\Application\\msedge.exe`,
  `${process.env['ProgramFiles']}\\Microsoft\\Edge\\Application\\msedge.exe`,
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

export async function launch() {
  const bin = CHROME_CANDIDATES.find((p) => p && existsSync(p));
  if (!bin) throw new Error('No Chrome or Edge binary found; set one in chrome.mjs');

  const profile = mkdtempSync(join(tmpdir(), 'zii-render-'));
  const proc = spawn(bin, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--disable-background-networking', '--disable-sync', '--mute-audio',
    '--force-color-profile=srgb', '--font-render-hinting=none',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: 'ignore' });

  // Chrome writes the port it actually bound to into the profile directory.
  const portFile = join(profile, 'DevToolsActivePort');
  let port = null;
  for (let i = 0; i < 150 && port === null; i++) {
    await sleep(100);
    if (existsSync(portFile)) {
      const line = readFileSync(portFile, 'utf8').split('\n')[0].trim();
      if (line) port = Number(line);
    }
  }
  if (!port) { proc.kill(); throw new Error('Chrome never reported a debugging port'); }

  const version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  const conn = await connect(version.webSocketDebuggerUrl);

  return {
    conn,
    async close() {
      try { conn.ws.close(); } catch {}
      proc.kill();
      await sleep(250);
      try { rmSync(profile, { recursive: true, force: true }); } catch {}
    },
  };
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let id = 0;
    const pending = new Map();

    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      const slot = pending.get(msg.id);
      if (!slot) return;
      pending.delete(msg.id);
      msg.error ? slot.reject(new Error(`${msg.error.message} (${slot.method})`)) : slot.resolve(msg.result);
    });
    ws.addEventListener('error', reject);
    ws.addEventListener('open', () => resolve({
      ws,
      send(method, params = {}, sessionId) {
        return new Promise((res, rej) => {
          const mid = ++id;
          pending.set(mid, { resolve: res, reject: rej, method });
          ws.send(JSON.stringify({ id: mid, method, params, ...(sessionId ? { sessionId } : {}) }));
        });
      },
    }));
  });
}

/** Open one reusable page target and return a renderer bound to it. */
export async function newPage(conn) {
  const { targetId } = await conn.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await conn.send('Target.attachToTarget', { targetId, flatten: true });
  await conn.send('Page.enable', {}, sessionId);
  await conn.send('Runtime.enable', {}, sessionId);

  const S = (m, p) => conn.send(m, p, sessionId);

  /**
   * Render `svg` and return a PNG buffer.
   *  fit 'viewport' - stretch the SVG to exactly width x height (fixed-size assets)
   *  fit 'trim'     - lay the SVG out at its intrinsic `canvas` size, clip to the
   *                   real ink of #content, and scale so the PNG is `width` wide
   */
  return async function render(svg, { width, height, fit = 'viewport', canvas, pad = 0.02 }) {
    const stretch = fit === 'viewport' ? 'width:100vw;height:100vh;' : '';
    const html = `<!doctype html><meta charset="utf-8"><style>
      html,body{margin:0;padding:0;background:transparent;}
      svg{display:block;${stretch}}
    </style>${svg}`;

    const [vw, vh] = fit === 'trim' ? canvas : [width, height];
    await S('Emulation.setDeviceMetricsOverride', {
      width: Math.ceil(vw), height: Math.ceil(vh), deviceScaleFactor: 1, mobile: false,
    });
    await S('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });

    const { frameTree } = await S('Page.getFrameTree');
    await S('Page.setDocumentContent', { frameId: frameTree.frame.id, html });

    // Webfonts are data URIs, but layout still needs a beat to settle.
    await S('Runtime.evaluate', {
      expression: `document.fonts.ready.then(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))`,
      awaitPromise: true,
    });

    let clip;
    if (fit === 'trim') {
      const { result } = await S('Runtime.evaluate', {
        expression: `JSON.stringify((()=>{const b=document.getElementById('content').getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height}})())`,
        returnByValue: true,
      });
      const b = JSON.parse(result.value);
      const p = b.w * pad;
      const box = { x: b.x - p, y: b.y - p, w: b.w + p * 2, h: b.h + p * 2 };
      clip = { x: box.x, y: box.y, width: box.w, height: box.h, scale: width / box.w };
    }

    const shot = await S('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: fit === 'trim', ...(clip ? { clip } : {}),
    });
    return Buffer.from(shot.data, 'base64');
  };
}
