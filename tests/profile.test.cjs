const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert(html.includes('Software Developer · Android development focus'));
assert(html.includes('<p class="tag">July 2021 – March 2023</p>'));
assert(html.includes('<p class="tag">April 2023 – September 2025</p>'));
assert.equal((html.match(/<h3>Accenture \/ Google<\/h3>/g) || []).length, 2);
assert.equal((html.match(/class="personal-note"/g) || []).length, 5);
assert(html.includes('because they’re proprietary'));
assert(html.includes('https://github.com/klarkengkoy/klarkengkoy/raw/refs/heads/main/Samson%20CV%202026.pdf'));
console.log('Career and personal-project content checks passed.');

assert(html.indexOf('id="journey"') < html.indexOf('id="skills"'));
assert(html.indexOf('id="skills"') < html.indexOf('id="work"'));
assert.equal((html.match(/>Gemini Notebook</g) || []).length, 2);
assert(html.includes('.companion-strip:hover .companion-track'));
assert(html.includes('.companion-strip:focus-within .companion-track'));
assert(html.includes('@media(prefers-reduced-motion:reduce)'));
assert(html.includes('Skip to content'));
assert(!html.includes('Space Grotesk'));
console.log('Layout, navigation and tools presentation checks passed.');
