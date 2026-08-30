import fs from 'fs';

// Concept 2: Dynamic Continuous 'R' + Forward Play Ribbon SVG
const svgContent = `<svg width="512" height="512" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rd-ribbon-grad" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#A855F7" />
      <stop offset="35%" stop-color="#7C3AED" />
      <stop offset="70%" stop-color="#2563EB" />
      <stop offset="100%" stop-color="#06B6D4" />
    </linearGradient>
    <filter id="rd-ribbon-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#7C3AED" flood-opacity="0.4" />
    </filter>
  </defs>

  <g filter="url(#rd-ribbon-glow)">
    <!-- Main Continuous R-Loop Ribbon -->
    <path
      d="M 18 50 V 22 C 18 16.477 22.477 12 28 12 H 33 C 39.627 12 45 17.373 45 24 C 45 29.8 40.8 34.6 35.3 35.7 L 49.5 42.8 C 51.5 43.8 51.5 46.7 49.5 47.7 L 33 56 C 31.8 56.6 30.3 56.1 29.7 54.9 L 24.5 44.5 H 24 V 50 C 24 51.657 22.657 53 21 53 C 19.343 53 18 51.657 18 50 Z M 24 37 H 32.5 C 36.09 37 39 34.09 39 30.5 C 39 26.91 36.09 24 32.5 24 H 24 V 37 Z"
      fill="url(#rd-ribbon-grad)"
    />
  </g>
</svg>`;

fs.writeFileSync('c:/Users/Piyush/Downloads/Reeldash/public/logo.svg', svgContent);
fs.writeFileSync('c:/Users/Piyush/Downloads/Reeldash/public/favicon.svg', svgContent);
console.log('Concept 2 SVG updated!');
