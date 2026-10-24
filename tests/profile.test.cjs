const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const images = [...html.matchAll(/<img src="(assets\/screenshots\/[^"]+)"([^>]+)>/g)];
assert.equal(images.length, 11);
for (const [, src, attributes] of images) {
  const file = path.join(root, src);
  assert(fs.readdirSync(path.dirname(file)).includes(path.basename(file)), src);
  const png = fs.readFileSync(file);
  assert.equal(png.readUInt32BE(16), 1290);
  assert.equal(png.readUInt32BE(20), 2796);
  assert.match(attributes, /width="1290" height="2796" loading="lazy" alt="[^"]+"/);
  assert(html.includes(`href="${src}"`), 'Screenshot must open at full size');
}
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'IDs must be unique');
assert(html.indexOf('id="journey"') < html.indexOf('id="skills"'));
assert(html.indexOf('id="skills"') < html.indexOf('id="work"'));
for (const name of ['Neo Glide Launcher', 'Flashcards', 'TripTrack', 'MoshiMoshi', 'PocketDex']) {
  assert(new RegExp(`<h3[^>]*>${name}</h3>`).test(html), name);
}
assert(html.includes('https://github.com/klarkengkoy/klarkengkoy/raw/refs/heads/main/Samson%20CV%202026.pdf'));
assert(html.includes('.companion-strip:hover .companion-track'));
assert(html.includes('@media(prefers-reduced-motion:reduce)'));
assert(!html.includes('motion-toggle'));
assert(html.includes('scrollbar-width:none'));
assert.equal((html.match(/<ul class="tags"/g) || []).length, 5);
assert(html.includes('<p class="tag">July 2021 – March 2023</p>'));
assert(html.includes('<p class="tag">April 2023 – September 2025</p>'));
assert(html.includes('Google:</strong> Android Enterprise Technical Support Expert'));
assert(!html.includes('Project details to confirm'));
assert.equal((html.match(/class="personal-note"/g) || []).length, 5);
assert(html.includes('left:-24px') && html.includes('right:-24px'));
assert.equal((html.match(/>Gemini Notebook</g) || []).length, 2);
assert(!html.includes('formerly NotebookLM'));
assert(html.includes('Currently working on personal Android projects using modern tools and practices while studying Japanese.'));
assert(!html.includes('personal project · in progress'));
assert(!html.includes('.pending-projects{grid-template-columns:repeat(2'));
for (const [, article] of html.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/g)) {
  const order = [article.indexOf('<h3'), article.indexOf('class="status"'),
    article.includes('class="gallery-shell"') ? article.indexOf('class="gallery-shell"') : article.indexOf('[Screenshots to add]'),
    article.indexOf('class="personal-note"'), article.indexOf('<ul class="tags"'), article.indexOf('Source on GitHub')];
  assert(order.every((position, index) => position >= 0 && (index === 0 || position > order[index - 1])), 'Project sections must follow the requested order');
}

const buttons = [-1, 1].map(direction => ({
  dataset: { direction: String(direction) },
  addEventListener(event, callback) { this.click = callback; }
}));
const card = { clientWidth: 680 };
const shell = { style: {}, parentElement: card };
let scrollLeft = 0;
const gallery = {
  id: 'test-gallery', scrollWidth: 1496, children: Array(7), parentElement: shell,
  get clientWidth() { return parseFloat(shell.style.width) || 600; },
  get scrollLeft() { return scrollLeft; },
  set scrollLeft(value) { scrollLeft = Math.max(0, Math.min(value, this.scrollWidth - this.clientWidth)); },
  querySelector: () => ({ getBoundingClientRect: () => ({ width: 200 }) }),
  scrollBy({ left }) { this.scrollLeft += left; },
  listeners: {},
  addEventListener(event, callback) { this.listeners[event] = callback; },
  focus() { document.activeElement = this; }
};
const nav = {
  addEventListener() {}, querySelectorAll: () => [],
  getAttribute: () => 'false', setAttribute() {}, classList: { toggle() {}, remove() {} }
};
let contentHeight = 313.5;
const content = { getBoundingClientRect: () => ({ height: contentHeight }) };
const hero = { style: {}, querySelector: () => content };
const resizeObservers = new Map();
const viewerImage = { removeAttribute(name) { delete this[name]; } };
const closeButton = { addEventListener(event, callback) { this.click = callback; } };
const viewer = {
  open: false, listeners: {},
  querySelector: selector => selector === 'img' ? viewerImage : closeButton,
  addEventListener(event, callback) { this.listeners[event] = callback; },
  showModal() { this.open = true; },
  close() { this.open = false; this.listeners.close(); }
};
const document = {
  activeElement: null,
  getElementById: () => nav,
  querySelector: selector => selector === '.hero' ? hero : selector === '.image-viewer' ? viewer : nav,
  querySelectorAll: selector => selector === '.app-gallery' ? [gallery] : buttons
};
vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], {
  document,
  getComputedStyle: element => element === hero ? { paddingTop: '112px', paddingBottom: '96px' }
    : element === card ? { paddingLeft: '16px', paddingRight: '16px' } : { columnGap: '16px' },
  ResizeObserver: class {
    constructor(callback) { this.callback = callback; }
    observe(target) { resizeObservers.set(target, this.callback); this.callback(); }
  }
});
assert.equal(buttons[0].hidden, true);
assert.equal(buttons[1].hidden, false);
assert.equal(shell.style.width, '632px', 'Three whole screenshots fit in the centered gallery');
buttons[1].click();
assert.equal(gallery.scrollLeft, 216);
gallery.listeners.scroll();
assert.equal(buttons[0].hidden, false);
buttons[0].click();
assert.equal(gallery.scrollLeft, 0);
gallery.scrollLeft = gallery.scrollWidth - gallery.clientWidth;
document.activeElement = buttons[1];
gallery.listeners.scroll();
assert.equal(buttons[1].hidden, true);
assert.equal(document.activeElement, gallery);
gallery.scrollWidth = gallery.clientWidth;
gallery.scrollLeft = 0;
resizeObservers.get(card)();
assert(buttons.every(button => button.hidden));
gallery.scrollWidth = 1496;
gallery.listeners.load();
assert.equal(buttons[1].hidden, false);
gallery.scrollLeft = 235;
card.clientWidth = 480;
resizeObservers.get(card)();
assert.equal(shell.style.width, '416px');
assert.equal(gallery.scrollLeft, 216, 'Resize keeps the gallery aligned to whole screenshots');
card.clientWidth = 256;
resizeObservers.get(card)();
assert.equal(shell.style.width, '200px');
card.clientWidth = 2000;
resizeObservers.get(card)();
assert.equal(shell.style.width, '1496px', 'Do not reserve space for nonexistent screenshots');
assert(buttons.every(button => button.hidden));
assert.equal(hero.style.height, '560px');
contentHeight = 360;
resizeObservers.get(content)();
assert.equal(hero.style.height, '600px');
contentHeight = 352;
resizeObservers.get(content)();
assert.equal(hero.style.height, '560px');
const link = { href: 'https://example.test/screenshot.png', querySelector: () => ({ alt: 'Kanji study deck' }) };
let prevented = false;
const imageClick = { target: { closest: () => link }, button: 0, preventDefault() { prevented = true; } };
gallery.listeners.click(imageClick);
assert.equal(viewer.open, true);
assert.equal(viewerImage.src, link.href);
assert.equal(viewerImage.alt, 'Kanji study deck');
assert.equal(prevented, true);
closeButton.click();
assert.equal(viewer.open, false);
assert.equal(viewerImage.src, undefined);
prevented = false;
gallery.listeners.click({ ...imageClick, ctrlKey: true });
assert.equal(viewer.open, false);
assert.equal(prevented, false);
console.log('Profile checks passed: assets, career entries, notes, galleries, image viewer, focus and grid rows.');
