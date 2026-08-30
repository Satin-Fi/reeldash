import fs from 'fs';

// =========================================================================
// Exact Supahub-Style Kinetic Ribbon Spark Vector SVG
// Matching the exact curvature, weight, and geometry of the uploaded reference
// =========================================================================
const supahubSparkSVG = `<svg width="512" height="512" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path
    d="M 32 10 C 32 18 28 26 14 26 H 12 V 38 H 32 C 32 46 28 54 14 54 H 26 C 36 54 44 46 44 38 H 52 V 26 H 32 C 32 18 36 10 46 10 H 32 Z"
    fill="#8B5CF6"
  />
</svg>`;

// The Exact Supahub Spark (Curved sweeping arms from central horizontal bar)
const preciseSupahubSparkSVG = `<svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M 50 16 C 50 28.5 42 39 23 43 H 14 V 57 H 50 C 50 69.5 42 80 23 84 H 42 C 59 84 71 72 71 57 H 86 V 43 H 50 C 50 30.5 58 20 77 16 H 50 Z"
    fill="#8B5CF6"
  />
</svg>`;

// The Supahub-style 'R' Ribbon Mark (Forming an 'R' + Forward Dash with Supahub curves)
const supahubR_SVG = `<svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Top Curved Arm -->
  <path
    d="M 28 18 H 60 C 74.359 18 86 29.641 86 44 C 86 54.5 79.8 63.6 70.8 67.8 C 55 68 46 54 46 44 H 28 V 18 Z"
    fill="#8B5CF6"
  />
  <!-- Bottom Sweeping Tail & Stem -->
  <path
    d="M 28 36 V 82 H 46 V 56 C 46 64 54 74 72 82 H 88 C 72 72 62 60 62 48 H 46 V 36 H 28 Z"
    fill="#8B5CF6"
  />
</svg>`;

// Write all SVGs to public
fs.writeFileSync('c:/Users/Piyush/Downloads/Reeldash/public/logo.svg', preciseSupahubSparkSVG);
fs.writeFileSync('c:/Users/Piyush/Downloads/Reeldash/public/favicon.svg', preciseSupahubSparkSVG);
fs.writeFileSync('c:/Users/Piyush/Downloads/Reeldash/public/logo-supahub-r.svg', supahubR_SVG);

console.log('Supahub-style vector SVGs generated!');
