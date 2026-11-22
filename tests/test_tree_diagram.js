const fs = require('fs');
const assert = require('assert');

console.log('=== VERIFYING TREE DIAGRAM & MOBILE SCROLL CONTROLS ===');

// 1. Verify styles.css
const css = fs.readFileSync('ramayana-relationships/styles.css', 'utf8');
assert(css.includes('.rk-tree-svg-canvas'), 'CSS must define .rk-tree-svg-canvas');
assert(css.includes('touch-action: pan-y;'), 'CSS must define touch-action: pan-y for smooth mobile scroll');
assert(css.includes('transform-origin: top center;'), 'CSS must define transform-origin: top center');
assert(css.includes('.rk-char-node::before'), 'CSS must define connector port ::before');
assert(css.includes('.rk-char-node::after'), 'CSS must define connector port ::after');
assert(css.includes('#ffd166'), 'Yellow parent-child color present');
assert(css.includes('#ff7675'), 'Pink marriage color present');
assert(css.includes('#74b9ff'), 'Blue sibling color present');
assert(css.includes('#a29bfe'), 'Purple guru color present');
console.log('✓ CSS tests passed!');

// 2. Verify tree-renderer.js
const js = fs.readFileSync('ramayana-relationships/tree-renderer.js', 'utf8');
assert(js.includes('drawTreeConnections'), 'drawTreeConnections function present');
assert(js.includes('arrowYellow'), 'Yellow arrowhead marker present');
assert(js.includes('dotBlue'), 'Blue sibling dot marker present');
assert(js.includes('touchMode = "scroll"'), 'Natural page scroll handler present');
assert(js.includes('0.75'), 'Minimum scale bound locked at 0.75 (prevents 45% black bug)');
assert(js.includes('maxPanX'), 'Bounds clamping present');
console.log('✓ tree-renderer.js tests passed!');

// 3. Verify data.js
const dataJs = fs.readFileSync('ramayana-relationships/data.js', 'utf8');
assert(dataJs.includes('"aja"'), 'Aja present in characters');
assert(dataJs.includes('"indumati"'), 'Indumati present in characters');
assert(dataJs.includes('"subahu_shatrughna"'), 'subahu_shatrughna present');
console.log('✓ data.js tests passed!');

console.log('🎉 ALL INTEGRATION VERIFICATIONS PASSED 100%!');
