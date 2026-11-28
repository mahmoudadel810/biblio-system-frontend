// Workflow e2e for every role (visitor, member, librarian, assistant, admin) against a running Biblio.
// Drives the real UI in a headless Chromium-family browser and watches every page for uncaught errors,
// CSP violations, console errors and 5xx / 429 responses. It creates accounts, loans and imports, so point it
// at a local or staging stack with the demo accounts (cargo run --bin seed), never at production data.
//
//   E2E_PASSWORD=<demo password> node scripts/e2e-workflows.mjs
//   env: BASE (default http://127.0.0.1:5180)  API (default http://localhost:8090)
//        BROWSER (executable, default google-chrome)  LIBRARIAN_EMAIL / ADMIN_EMAIL (default *@biblio.test)
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://127.0.0.1:5180';
const API = process.env.API ?? 'http://localhost:8090';
const PW = process.env.E2E_PASSWORD;
if (!PW) { console.error('set E2E_PASSWORD'); process.exit(2); }
const LIBRARIAN = process.env.LIBRARIAN_EMAIL ?? 'librarian@biblio.test';
const ADMIN = process.env.ADMIN_EMAIL ?? 'admin@biblio.test';
const SLUG = 'works-on-my-machine';
const stamp = Date.now().toString(36);
const results = [];
let current = null;

function step(name) {
  current = { name, problems: [] };
  results.push(current);
}
const fail = (msg) => current.problems.push(msg);
const check = (cond, msg) => { if (!cond) fail(msg); };

async function api(method, path, token, body) {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: r.status, data };
}
const apiLogin = async (email, password = PW) => (await api('POST', '/auth/login', null, { email, password })).data;

const browser = await chromium.launch({ executablePath: process.env.BROWSER ?? 'google-chrome', headless: true });

async function newPage() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => current && fail(`uncaught: ${e.message.slice(0, 160)}`));
  page.on('console', (m) => {
    if (!current) return;
    const t = m.text();
    if (/Content Security Policy|Refused to/.test(t)) fail(`CSP: ${t.slice(0, 200)}`);
    else if (m.type() === 'error' && !/status of 40[134]/.test(t)) fail(`console: ${t.slice(0, 160)}`);
  });
  page.on('response', (r) => {
    if (current && (r.status() >= 500 || r.status() === 429)) fail(`${r.status()} ${r.request().method()} ${r.url()}`);
  });
  return page;
}

const shown = (loc) => loc.waitFor({ state: 'visible', timeout: 8000 }).then(() => true, () => false);

async function uiLogin(page, email, password = PW) {
  await page.goto(`${BASE}/login?lang=en`);
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 10000 }).catch(() => fail(`login as ${email} did not leave /login`));
}

/** Opens each path and checks it renders a heading and stays on the path (allowed) or is sent away (denied). */
async function visit(page, paths, { allowed = true } = {}) {
  for (const p of paths) {
    await page.goto(`${BASE}${p}?lang=en`);
    await page.waitForLoadState('networkidle').catch(() => {});
    const path = new URL(page.url()).pathname;
    if (allowed) {
      check(path === p, `${p}: redirected to ${path}`);
      check(await page.locator('h1, h2').count() > 0, `${p}: no heading`);
    } else {
      // The guard answers in place with a 403 message, or sends a signed-out visitor to /login.
      const refused = path !== p || (await page.getByText('403: you do not have access to this page.').count()) > 0;
      check(refused, `${p}: should be refused but rendered`);
    }
  }
}

const LIB_PAGES = ['/app', '/catalog', '/loans', '/desk', '/members', '/labels', '/transfers', '/procurement', '/import',
  '/inventory', '/payments', '/analytics', '/reports', '/interlibrary', '/notifications', '/account'];
const ADMIN_PAGES = ['/settings', '/organizations', '/audit', '/digital-admin'];

try {
  // ---------- visitor
  step('visitor: browse public pages');
  let page = await newPage();
  await visit(page, ['/', '/books', `/books/${SLUG}`, '/authors', '/libraries', '/bookstores', '/clubs', '/near', '/library/start', '/credits']);
  await page.goto(`${BASE}/books/${SLUG}?lang=en`);
  check(await page.getByRole('button', { name: 'Borrow' }).or(page.getByRole('link', { name: 'Borrow' })).count() > 0, 'book page has no Borrow action');

  step('visitor: register with a mixed-case email (UI)');
  const memberEmail = `E2E.Reader.${stamp}@Example.com`;
  await page.goto(`${BASE}/register?lang=en`);
  await page.getByPlaceholder('Full name').fill('E2E Reader');
  await page.getByPlaceholder('Email').fill(memberEmail);
  await page.getByPlaceholder('Password (min 8 characters)').fill('reader-pass-1');
  await page.getByRole('button', { name: 'Register' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/register'), { timeout: 10000 }).catch(() => fail('register did not leave /register'));
  const dup = await api('POST', '/auth/register', null, { email: memberEmail.toUpperCase(), password: 'reader-pass-1', full_name: 'Dup' });
  check(dup.status === 409, `same email in upper case should be refused, got ${dup.status}`);
  await page.context().close();

  // ---------- member
  step('member: sign in with the email in lower case (UI)');
  page = await newPage();
  await uiLogin(page, memberEmail.toLowerCase(), 'reader-pass-1');
  await visit(page, ['/app', '/account', '/notifications']);
  await visit(page, ['/desk', '/settings', '/payments'], { allowed: false });

  step('member: borrow a book from its page (UI)');
  await page.goto(`${BASE}/books/${SLUG}?lang=en`);
  await page.getByRole('button', { name: 'Borrow' }).first().click();
  const confirm = page.getByRole('button', { name: 'Borrow this book' });
  if (await shown(confirm)) {
    await confirm.click();
    await page.getByText('Return by').or(page.getByText(/due/i)).first().waitFor({ timeout: 8000 }).catch(() => fail('no due date shown after borrowing'));
  } else fail('borrow dialog did not open');
  const memberTok = await apiLogin(memberEmail.toLowerCase(), 'reader-pass-1');
  const myLoans = await api('GET', '/me/loans', memberTok.access_token);
  check(Array.isArray(myLoans.data) && myLoans.data.length === 1, `member should have 1 loan, has ${JSON.stringify(myLoans.data).slice(0, 80)}`);

  step('member: save another book to the wishlist (UI)');
  const books = await api('GET', '/public/books?per_page=5');
  const other = books.data.items.find((b) => b.slug !== SLUG);
  await page.goto(`${BASE}/books/${other.slug}?lang=en`);
  const wish = page.getByRole('button', { name: /Save to wishlist|Notify me when available/ }).first();
  if (await shown(wish)) {
    await wish.click();
    await page.getByText(/Saved to wishlist|We will notify you/).first().waitFor({ timeout: 8000 }).catch(() => fail('wishlist save not confirmed'));
  } else fail('no wishlist button on book page');

  step('member: download my data and change password (UI)');
  await page.goto(`${BASE}/account?lang=en`);
  const dl = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
  await page.getByRole('button', { name: 'Download my data' }).click();
  check(await dl, 'data download did not start');
  await page.getByLabel('Current password').fill('reader-pass-1').catch(() => fail('no current password field'));
  await page.getByLabel('New password').fill('reader-pass-2').catch(() => fail('no new password field'));
  await page.getByRole('button', { name: 'Change password' }).last().click();
  await page.waitForURL((u) => u.pathname.startsWith('/login'), { timeout: 10000 }).catch(() => fail('not signed out after password change'));
  const oldRefresh = await api('POST', '/auth/refresh', null, { refresh_token: memberTok.refresh_token });
  check(oldRefresh.status === 401, `old session should be revoked after password change, got ${oldRefresh.status}`);
  await uiLogin(page, memberEmail, 'reader-pass-2');
  await page.context().close();

  // ---------- librarian
  step('librarian: every staff page opens, admin pages refused');
  const lib = await apiLogin(LIBRARIAN);
  check(!!lib.access_token, 'librarian demo login failed');
  page = await newPage();
  await uiLogin(page, LIBRARIAN);
  await visit(page, LIB_PAGES);
  await visit(page, ADMIN_PAGES, { allowed: false });

  step('librarian: desk borrow then return (UI)');
  const copies = await api('GET', '/copies/lookup?q=SEED', lib.access_token);
  const free = copies.data.find((c) => c.status === 'available');
  await page.goto(`${BASE}/desk?lang=en`);
  await page.getByPlaceholder('Find a member by name or email').fill('e2e.reader');
  await page.getByText(memberEmail.toLowerCase()).or(page.getByText('E2E Reader')).first().click({ timeout: 8000 }).catch(() => fail('member not found in desk picker'));
  await page.getByPlaceholder('Type or scan a code').fill(free.barcode);
  await page.getByRole('button', { name: 'Look up' }).click();
  await page.getByRole('button', { name: /Borrow for/ }).click({ timeout: 8000 }).catch(() => fail('no "Borrow for" button'));
  await page.getByText('Borrowed').first().waitFor({ timeout: 8000 }).catch(() => fail('desk borrow not confirmed'));
  await page.getByPlaceholder('Type or scan a code').fill(free.barcode);
  await page.getByRole('button', { name: 'Look up' }).click();
  await page.getByRole('button', { name: 'Return this book' }).click({ timeout: 8000 }).catch(() => fail('no "Return this book" button'));
  await page.getByText('Returned').first().waitFor({ timeout: 8000 }).catch(() => fail('desk return not confirmed'));
  await page.context().close();

  step('librarian: lists with filters answer (API)');
  for (const p of ['/loans?open=true&offset=0', '/fines?status=unpaid', '/payments/summary?days=30', '/transfers?status=in_transit',
    '/reports/overdue', '/reports/circulation?days=7', '/stats/overview', '/members?q=e2e', '/analytics']) {
    const r = await api('GET', p, lib.access_token);
    check(r.status === 200, `${p}: ${r.status} ${JSON.stringify(r.data).slice(0, 100)}`);
  }
  const imp = await api('POST', '/import/members', lib.access_token, { csv: `email,full_name,temp_password\nImported.${stamp}@Example.com,Imp One,temp-pass-123`, dry_run: false });
  check(imp.status === 200, `member import: ${imp.status} ${JSON.stringify(imp.data).slice(0, 120)}`);
  const impLogin = await api('POST', '/auth/login', null, { email: `imported.${stamp}@example.com`, password: 'temp-pass-123' });
  check(impLogin.status === 200, `imported member cannot sign in: ${impLogin.status}`);

  // ---------- assistant
  step('assistant: desk pages only');
  const admin = await apiLogin(ADMIN);
  const asstEmail = `asst.${stamp}@example.com`;
  await api('POST', '/auth/register', null, { email: asstEmail, password: 'asst-pass-123', full_name: 'E2E Assistant' });
  const members = await api('GET', `/members?q=${encodeURIComponent(asstEmail)}`, admin.access_token);
  const asstId = members.data[0]?.id;
  const promo = await api('PATCH', `/members/${asstId}`, admin.access_token, { role: 'assistant' });
  check(promo.status === 200, `promote to assistant: ${promo.status}`);
  page = await newPage();
  await uiLogin(page, asstEmail, 'asst-pass-123');
  await visit(page, ['/desk', '/loans', '/members']);
  await visit(page, ['/payments', '/reports', '/settings', '/import'], { allowed: false });
  await page.context().close();

  // ---------- admin
  step('admin: every page opens');
  page = await newPage();
  await uiLogin(page, ADMIN);
  await visit(page, [...LIB_PAGES, ...ADMIN_PAGES]);
  await page.context().close();

  step('admin: role changes apply to a signed-in user at once');
  const asst = await apiLogin(asstEmail, 'asst-pass-123');
  check((await api('GET', '/loans', asst.access_token)).status === 200, 'assistant cannot list loans');
  await api('PATCH', `/members/${asstId}`, admin.access_token, { role: 'member' });
  check((await api('GET', '/members', asst.access_token)).status === 403, 'demoted user still reaches staff lists with the old token');
  await api('PATCH', `/members/${asstId}`, admin.access_token, { is_active: false });
  check((await api('GET', '/me/preferences', asst.access_token)).status === 401, 'deactivated user still signed in');
  const audit = await api('GET', '/audit-logs?entity_type=member&offset=0', admin.access_token);
  check(audit.status === 200 && audit.data.length > 0, `audit log: ${audit.status}`);
} catch (e) {
  fail(`crashed: ${e.message.split('\n')[0]}`);
} finally {
  await browser.close();
}

let bad = 0;
for (const r of results) {
  const ok = r.problems.length === 0;
  if (!ok) bad++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.name}`);
  for (const p of [...new Set(r.problems)]) console.log(`        - ${p}`);
}
console.log(`\n${results.length - bad}/${results.length} workflow steps passed`);
process.exit(bad ? 1 : 0);
