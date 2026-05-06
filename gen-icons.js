const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function makePNG(width, height, pixels) {
  const rowSize = width * 4;
  const rawData = Buffer.alloc((rowSize + 1) * height);
  for (let y = 0; y < height; y++) {
    rawData[y * (rowSize + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const i = y * (rowSize + 1) + 1 + x * 4;
      const pi = (y * width + x) * 4;
      rawData[i]   = pixels[pi];
      rawData[i+1] = pixels[pi+1];
      rawData[i+2] = pixels[pi+2];
      rawData[i+3] = pixels[pi+3];
    }
  }
  const compressed = zlib.deflateSync(rawData, {level: 9});

  function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function chunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
    return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; ihdrData[9] = 6;
  ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0;

  return Buffer.concat([sig, chunk('IHDR', ihdrData), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

function drawIcon(size) {
  const pixels = new Uint8Array(size * size * 4);

  function setPixel(x, y, r, g, b, a) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 4;
    pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b; pixels[i+3] = a;
  }

  // Background: #0f1117
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      setPixel(x, y, 15, 17, 23, 255);

  // Phone body: #4fc3f7
  const pw = Math.round(size * 0.3), ph = Math.round(size * 0.5);
  const px = Math.floor((size - pw) / 2), py = Math.floor((size - ph) / 2);
  for (let y = py; y < py + ph; y++)
    for (let x = px; x < px + pw; x++)
      setPixel(x, y, 79, 195, 247, 255);

  // Screen: #0a0c12
  for (let y = py + 3; y < py + ph - 5; y++)
    for (let x = px + 2; x < px + pw - 2; x++)
      setPixel(x, y, 10, 12, 18, 255);

  // Signal dot: #ef5350, circle
  const cx = Math.round(size * 0.72), cy = Math.round(size * 0.28), r = Math.round(size * 0.1);
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++)
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r)
        setPixel(x, y, 239, 83, 80, 255);

  return Array.from(pixels);
}

const dir = path.join(__dirname, 'icons');
fs.mkdirSync(dir, { recursive: true });

for (const size of [16, 48, 128]) {
  const png = makePNG(size, size, drawIcon(size));
  const outPath = path.join(dir, `icon${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`Written ${outPath} (${png.length} bytes)`);
}

console.log('All icons generated successfully.');
