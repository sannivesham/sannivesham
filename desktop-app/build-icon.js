const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIcoModule = require('png-to-ico');
const pngToIco = pngToIcoModule.default || pngToIcoModule;

const inputPng = path.join(__dirname, '..', 'images', 'logo.png');
const squarePng = path.join(__dirname, 'icon-256.png');
const outputIco = path.join(__dirname, 'icon.ico');

async function build() {
  try {
    // 1. Resize to a 256x256 square PNG
    await sharp(inputPng)
      .resize(256, 256, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(squarePng);

    console.log('Created square PNG at:', squarePng);

    // 2. Convert to multi-resolution .ico
    const buf = await pngToIco(squarePng);
    fs.writeFileSync(outputIco, buf);
    console.log('Successfully created icon.ico at:', outputIco);
  } catch (err) {
    console.error('Build icon error:', err);
    process.exit(1);
  }
}

build();
