// Fork-only verification: loads the app in a browser and opens every category.
import { chromium } from 'playwright';

const base = process.argv[2];
const categories = [
    'hello',
    'composition',
    'child',
    'parent',
    'misc',
    'party',
    'lightDom',
    'externalWc'
];
const problems = [];

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
page.on('response', (response) => {
    if (response.url().startsWith(base) && response.status() >= 400) {
        problems.push(`${response.status()} ${response.url()}`);
    }
});
page.on('requestfailed', (request) => {
    if (request.url().startsWith(base)) {
        problems.push(`failed ${request.url()}`);
    }
});

await page.goto(base, { waitUntil: 'networkidle' });
for (const category of categories) {
    await page.locator(`a[data-item="${category}"]`).click();
    await page.waitForLoadState('networkidle');
    const cards = await page.locator('article ui-card').count();
    console.log(`${category}: ${cards} recipes`);
    if (cards === 0) {
        problems.push(`no recipes rendered in ${category}`);
    }
}
await browser.close();

console.log(problems.length ? problems.join('\n') : 'no problems found');
process.exit(problems.length ? 1 : 0);
