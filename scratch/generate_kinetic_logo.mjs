import fs from 'fs';

// Option 1: The Interlocking Kinetic Diamond Glyph (Linear / Raycast tier)
const svgInterlocking = `<svg width="512" height="512" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Left Diamond: Electric Ultraviolet -->
  <path
    d="M 23 11 L 37 25 L 23 39 L 9 25 Z"
    stroke="#8B5CF6"
    stroke-width="5"
    stroke-linejoin="miter"
  />
  <!-- Right Diamond: Cyber White / Cyan Accent -->
  <path
    d="M 41 25 L 55 39 L 41 53 L 27 39 Z"
    stroke="#FFFFFF"
    stroke-width="5"
    stroke-linejoin="miter"
  />
</svg>`;

// Option 2: The Swiss Precision Folded 'R' Glyph
const svgSwissR = `<svg width="512" height="512" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="swiss-r-grad" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#06B6D4" />
      <stop offset="100%" stop-color="#8B5CF6" />
    </linearGradient>
  </defs>
  <!-- Vertical Stem -->
  <rect x="14" y="10" width="8" height="44" rx="2" fill="#8B5CF6" />
  <!-- Upper Loop -->
  <path d="M 22 10 H 38 C 45 10 49 14.5 49 21 C 49 27.5 45 32 38 32 H 22 V 10 Z M 22 17 V 25 H 36 C 39.5 25 41.5 23.5 41.5 21 C 41.5 18.5 39.5 17 36 17 H 22 Z" fill="#06B6D4" />
  <!-- Diagonal Kick -->
  <path d="M 27 28 L 47 54 H 38 L 22 33 Z" fill="url(#swiss-r-grad)" />
</svg>`;

fs.writeFileSync('c:/Users/Piyush/Downloads/Reeldash/public/logo.svg', svgInterlocking);
fs.writeFileSync('c:/Users/Piyush/Downloads/Reeldash/public/favicon.svg', svgInterlocking);
console.log('Interlocking Kinetic Diamond SVG generated!');
