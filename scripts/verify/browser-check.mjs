// Fork-only verification: loads the app in a browser and opens every category.
import { chromium } from 'playwright';

const base = process.argv[2];
const screenshot = process.argv[3];
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
page.setDefaultTimeout(10000);
page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) {
        console.log(`console.${message.type()}: ${message.text()}`);
    }
});
page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
page.on('response', (response) => {
    if (response.status() >= 400) {
        problems.push(`${response.status()} ${response.url()}`);
    }
});
page.on('requestfailed', (request) => {
    problems.push(`failed ${request.url()}: ${request.failure()?.errorText}`);
});

try {
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
} catch (error) {
    problems.push(`aborted: ${error.message.split('\n')[0]}`);
    const main = await page.locator('#main').innerHTML();
    console.log(`#main: ${main.slice(0, 500)}`);
}
await page.screenshot({ path: screenshot, fullPage: true });
await browser.close();

console.log(problems.length ? problems.join('\n') : 'no problems found');
process.exit(problems.length ? 1 : 0);
