import fs from 'fs';

const svgContent = `<svg width="512" height="512" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="rd-grad" x1="4" y1="8" x2="60" y2="56" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#9333EA" />
      <stop offset="35%" stop-color="#7C3AED" />
      <stop offset="70%" stop-color="#4F46E5" />
      <stop offset="100%" stop-color="#06B6D4" />
    </linearGradient>
    <linearGradient id="rd-specular" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
    </linearGradient>
    <filter id="rd-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#7C3AED" flood-opacity="0.45" />
    </filter>
  </defs>

  <g filter="url(#rd-glow)">
    <!-- Speed Dash Horizontal Blades (Aerodynamic trail) -->
    <path d="M 28 12 H 44 C 45.5 12 46 13 45 14 L 43.5 15.5 C 43 16 42 16 41 16 H 25 Z" fill="url(#rd-grad)" />
    <path d="M 33 18.5 H 49 C 50.5 18.5 51 19.5 50 20.5 L 48.5 22 C 48 22.5 47 22.5 46 22.5 H 30 Z" fill="url(#rd-grad)" />
    <path d="M 35 25 H 56 C 57.5 25 58 26 57 27 L 55 29 C 54.5 29.5 53.5 29.5 52.5 29.5 H 32 Z" fill="url(#rd-grad)" />
    <path d="M 33 32 H 48 C 49.5 32 50 33 49 34 L 47.5 35.5 C 47 36 46 36 45 36 H 29 Z" fill="url(#rd-grad)" />
    <path d="M 28 38.5 H 41 C 42.5 38.5 43 39.5 42 40.5 L 40.5 42 C 40 42.5 39 42.5 38 42.5 H 24 Z" fill="url(#rd-grad)" />

    <!-- Main Spool Wheel Compound Path -->
    <path fill-rule="evenodd" clip-rule="evenodd" d="
      M 24 8 
      C 32.8366 8 40 15.1634 40 24 
      C 40 32.8366 32.8366 40 24 40 
      C 15.1634 40 8 32.8366 8 24 
      C 8 15.1634 15.1634 8 24 8 Z
      
      M 24 21
      C 22.3431 21 21 22.3431 21 24
      C 21 25.6569 22.3431 27 24 27
      C 25.6569 27 27 25.6569 27 24
      C 27 22.3431 25.6569 21 24 21 Z

      M 24 11.5
      C 21.7909 11.5 20 13.2909 20 15.5
      C 20 17.7091 21.7909 19.5 24 19.5
      C 26.2091 19.5 28 17.7091 28 15.5
      C 28 13.2909 26.2091 11.5 24 11.5 Z

      M 14.5 27.5
      C 12.8431 27.5 11.5 28.8431 11.5 30.5
      C 11.5 32.1569 12.8431 33.5 14.5 33.5
      C 16.1569 33.5 17.5 32.1569 17.5 30.5
      C 17.5 28.8431 16.1569 27.5 14.5 27.5 Z

      M 33.5 27.5
      C 31.8431 27.5 30.5 28.8431 30.5 30.5
      C 30.5 32.1569 31.8431 33.5 33.5 33.5
      C 35.1569 33.5 36.5 32.1569 36.5 30.5
      C 36.5 28.8431 35.1569 27.5 33.5 27.5 Z
    " fill="url(#rd-grad)" />

    <!-- Specular Highlight Overlay -->
    <path fill-rule="evenodd" clip-rule="evenodd" d="
      M 24 8 C 32.8366 8 40 15.1634 40 24 C 40 24.5 39.95 25 39.87 25.5 C 38.6 17.8 32 12 24 12 C 16.5 12 10.2 17.2 8.3 24.3 C 8.1 23.5 8 22.8 8 22 C 8 14.3 15.2 8 24 8 Z
    " fill="url(#rd-specular)" />
  </g>
</svg>`;

fs.writeFileSync('c:/Users/Piyush/Downloads/Reeldash/public/logo.svg', svgContent);
fs.writeFileSync('c:/Users/Piyush/Downloads/Reeldash/public/favicon.svg', svgContent);
console.log('SVG files written successfully!');
