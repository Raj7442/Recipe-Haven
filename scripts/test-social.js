/*
 Simple Puppeteer test to simulate clicking the Google social sign-in and verifying the app receives a token.
 Usage:
 1) Install puppeteer: npm i -D puppeteer
 2) Start dev server: npm start
 3) Run: node scripts/test-social.js

 The script assumes the app is at http://localhost:3000 and the GOOGLE auth url points to
 public/oauth-sim.html?token=demo-google (this repo includes that simulator page).
*/

const http = require('http');
const puppeteer = require('puppeteer');

const URL = 'http://localhost:3000';

async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await new Promise((res, rej) => {
        const req = http.get(url, (r) => {
          r.resume();
          res();
        });
        req.on('error', rej);
      });
      return;
    } catch (e) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error('Server did not respond in time');
}

(async () => {
  try {
    console.log('Waiting for dev server at', URL);
    await waitForServer(URL);
    console.log('Server up — launching headless browser');

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    await page.goto(URL, { waitUntil: 'networkidle2' });
    console.log('App loaded — clicking Google sign-in');

    await page.waitForSelector('.social-btn.google', { timeout: 10000 });

    // Listen for a new popup (targetcreated)
    const popupPromise = new Promise((resolve) =>
      browser.once('targetcreated', async (target) => {
        const p = await target.page();
        resolve(p);
      })
    );

    await page.click('.social-btn.google');

    const popup = await popupPromise;
    if (!popup) throw new Error('Popup did not open');

    console.log('Popup opened — waiting for simulator to be ready');
    await popup.waitForSelector('#sendBtn', { timeout: 10000 });

    // Click send (simulator auto-sends if token param provided, but click to be explicit)
    await popup.click('#sendBtn');

    // Wait for main page to show auth user ('.auth-user') — or token in localStorage
    await page.waitForSelector('.auth-user', { timeout: 10000 });

    const usernameText = await page.$eval('.auth-user', el => el.textContent);
    console.log('Social sign-in simulation succeeded:', usernameText);

    await browser.close();
    console.log('Test completed — browser closed');
  } catch (err) {
    console.error('Test failed:', err.message || err);
    process.exit(1);
  }
})();