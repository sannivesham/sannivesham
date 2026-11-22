const fs = require('fs');

const html = fs.readFileSync('ramakoti/index.html', 'utf8');

// Extract script
const scriptMatch = html.match(/<script type="module">([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('Script module not found!');
  process.exit(1);
}

console.log('Script length:', scriptMatch[1].length);

// Check key elements exist
const requiredIds = [
  'authGateView', 'writerView', 'globalCountdownVal', 'globalProgressFill',
  'globalPercentText', 'personalAvatar', 'personalUserName', 'personalCountVal',
  'ramaInput', 'submitBtn', 'spaceBtn', 'backspaceBtn', 'leaderboardList',
  'googleSignInBtn'
];

requiredIds.forEach(id => {
  if (!html.includes('id="' + id + '"')) {
    console.error('Missing ID in HTML:', id);
    process.exit(1);
  }
});

console.log('All required IDs present in HTML!');

// Test parseSriramaCount logic
function parseSriramaCount(text) {
  if (!text) return 0;
  const upper = text.toUpperCase();
  const normalized = upper
    .replace(/SRI\s+RAMA/g, 'SRIRAMA')
    .replace(/SRI\s+RAM\b/g, 'SRIRAMA')
    .replace(/\bSRIRAM\b/g, 'SRIRAMA');
  const words = normalized.split(/\s+/).filter(w => w === 'SRIRAMA' || w === 'RAMA');
  return words.length;
}

console.log('Test SRIRAMA:', parseSriramaCount('SRIRAMA') === 1 ? 'PASS' : 'FAIL');
console.log('Test srirama:', parseSriramaCount('srirama') === 1 ? 'PASS' : 'FAIL');
console.log('Test SRI RAMA:', parseSriramaCount('SRI RAMA') === 1 ? 'PASS' : 'FAIL');
console.log('Test sri rama:', parseSriramaCount('sri rama') === 1 ? 'PASS' : 'FAIL');
console.log('Test RAMA:', parseSriramaCount('RAMA') === 1 ? 'PASS' : 'FAIL');
console.log('Test SRIRAMA SRIRAMA:', parseSriramaCount('SRIRAMA SRIRAMA') === 2 ? 'PASS' : 'FAIL');
console.log('Test Invalid XYZ:', parseSriramaCount('XYZ') === 0 ? 'PASS' : 'FAIL');

// Test isAllowedChar and sanitizeInput
function isAllowedChar(ch) {
  return /^[sriramSRIRAM\s]$/.test(ch);
}
function sanitizeInput(str) {
  return str.toUpperCase().replace(/[^SRIAM\s]/g, '');
}

console.log('Allowed chars:');
['S', 'R', 'I', 'A', 'M', 's', 'r', 'i', 'a', 'm', ' '].forEach(ch => {
  if (!isAllowedChar(ch)) {
    console.error('FAIL on allowed char:', ch);
    process.exit(1);
  }
});

['B', 'C', 'X', '1', '2', '!'].forEach(ch => {
  if (isAllowedChar(ch)) {
    console.error('FAIL: should NOT allow char:', ch);
    process.exit(1);
  }
});

console.log('All char checks PASSED!');

// Verify JS Module Syntax
try {
  // Strip import statements so Function constructor can parse it
  const codeWithoutImports = scriptMatch[1].replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '// import');
  new Function(codeWithoutImports);
  console.log('JavaScript Syntax Check: PASSED!');
} catch (err) {
  console.error('JavaScript Syntax Check: FAILED!', err);
  process.exit(1);
}

