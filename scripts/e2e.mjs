// Browser E2E smoke run: headless Chrome over the DevTools protocol, no extra dependencies.
// For each viewport (390, 1280) and language (en, ar) it opens public, member and admin pages and checks:
// no horizontal overflow, <html lang/dir> matches, a title and an h1 exist, no uncaught errors,
// no 5xx responses. Needs the API and the Vite dev server (or a preview build) to be running.
//
//   E2E_PASSWORD=... node scripts/e2e.mjs
//   env: BASE (default http://127.0.0.1:5180)  API (default http://localhost:8090)  SHOTS (dir, optional)
//        BOOK_SLUG (default works-on-my-machine)  MEMBER_EMAIL / ADMIN_EMAIL (default *@biblio.test)
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const BASE = process.env.BASE ?? 'http://127.0.0.1:5180';
const API = process.env.API ?? 'http://localhost:8090';
const SLUG = process.env.BOOK_SLUG ?? 'works-on-my-machine';
const PASSWORD = process.env.E2E_PASSWORD;
const SHOTS = process.env.SHOTS;
if (!PASSWORD) { console.error('set E2E_PASSWORD'); process.exit(2); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function login(email) {
  const r = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: PASSWORD }) });
  if (!r.ok) throw new Error(`login ${email}: ${r.status}`);
  return r.json();
}
const tokens = {
  public: null,
  member: await login(process.env.MEMBER_EMAIL ?? 'member@biblio.test'),
  admin: await login(process.env.ADMIN_EMAIL ?? 'admin@biblio.test'),
};
const ROUTES = [
  ['public', '/'], ['public', '/books'], ['public', `/books/${SLUG}`], ['public', '/authors'],
  ['public', '/libraries'], ['public', '/near'], ['public', '/bookstores'], ['public', '/library/start'],
  ['member', '/app'], ['member', `/read/${SLUG}`], ['member', '/library/start'],
  ['admin', '/organizations'], ['admin', '/settings'],
];

const port = 9800 + Math.floor(Math.random() * 100);
const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, 'about:blank'], { stdio: 'ignore' });
let targets;
for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch { /* retry */ } await sleep(250); }
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); let errors = []; let bad = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); return; }
  if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.text + ' ' + (d.params.exceptionDetails.exception?.description ?? '').slice(0, 120));
  if (d.method === 'Network.responseReceived' && d.params.response.status >= 500) bad.push(`${d.params.response.status} ${d.params.response.url}`);
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
const evalJs = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;

const rows = [];
for (const width of [390, 1280]) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
  for (const lang of ['en', 'ar']) {
    for (const [who, path] of ROUTES) {
      errors = []; bad = [];
      await send('Page.navigate', { url: `${BASE}/login` }); await sleep(150);
      const t = tokens[who];
      await evalJs(`localStorage.clear(); localStorage.setItem('biblio.lang', '${lang}'); ${t ? `localStorage.setItem('biblio.access_token', ${JSON.stringify(t.access_token)}); localStorage.setItem('biblio.refresh_token', ${JSON.stringify(t.refresh_token)});` : ''}`);
      await send('Page.navigate', { url: `${BASE}${path}?lang=${lang}` });
      await sleep(1000);
      const s = await evalJs(`({ over: document.documentElement.scrollWidth - window.innerWidth, lang: document.documentElement.lang, dir: document.documentElement.dir, title: document.title, h1: !!document.querySelector('h1,h2'), path: location.pathname })`);
      const fails = [];
      if (s.over > 1) fails.push(`overflow ${s.over}px`);
      if (s.lang !== lang) fails.push(`lang ${s.lang}`);
      if (s.dir !== (lang === 'ar' ? 'rtl' : 'ltr')) fails.push(`dir ${s.dir}`);
      if (!s.title) fails.push('no title');
      if (!s.h1 && !path.startsWith('/read/')) fails.push('no heading'); // /read shows a plain message without an active digital loan
      if (s.path !== path) fails.push(`redirected to ${s.path}`);
      if (errors.length) fails.push(`errors: ${errors[0]}`);
      if (bad.length) fails.push(`5xx: ${bad[0]}`);
      if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); const shot = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${SHOTS}/${width}-${lang}-${who}${path.replace(/\//g, '_')}.png`, Buffer.from(shot.result.data, 'base64')); }
      rows.push({ width, lang, who, path, ok: fails.length === 0, fails });
    }
  }
}
chrome.kill();
for (const r of rows) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${String(r.width).padStart(4)} ${r.lang}  ${r.who.padEnd(6)} ${r.path}${r.ok ? '' : '  <- ' + r.fails.join('; ')}`);
const failed = rows.filter((r) => !r.ok).length;
console.log(`\n${rows.length - failed}/${rows.length} passed`);
process.exit(failed ? 1 : 0);
