import fs from 'fs';

// =========================================================================
// STYLE 1: The Runway/Raycast Continuous Monoline 'R' (Matching Reference 1)
// Clean thick pill loop + rounded dynamic kick
// =========================================================================
const runwayR_SVG = `<svg width="512" height="512" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path
    d="M 22 12 H 34 C 41.732 12 48 18.268 48 26 C 48 31.8 44.5 36.7 39.5 38.8 L 47.5 48.8 C 48.8 50.4 47.6 52 45.5 52 H 39 C 37.8 52 36.7 51.3 36 50.4 L 28.5 40 H 22 V 48 C 22 50.2 20.2 52 18 52 C 15.8 52 14 50.2 14 48 V 16 C 14 13.8 15.8 12 18 12 H 22 Z M 22 20 V 32 H 34 C 37.314 32 40 29.314 40 26 C 40 22.686 37.314 20 34 20 H 22 Z"
    fill="#FFFFFF"
  />
</svg>`;

// =========================================================================
// STYLE 2: The Linear Folded Kinetic Facets (Matching Reference 2)
// Two interlocking geometric folded triangles in electric violet / cyan
// =========================================================================
const linearFacets_SVG = `<svg width="512" height="512" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="linear-facet-1" x1="16" y1="12" x2="32" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#A855F7" />
      <stop offset="100%" stop-color="#7C3AED" />
    </linearGradient>
    <linearGradient id="linear-facet-2" x1="32" y1="20" x2="48" y2="52" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="100%" stop-color="#3B82F6" />
    </linearGradient>
  </defs>
  <!-- Top Left Triangle -->
  <path
    d="M 31 13 C 31.8 11.7 33.7 11.7 34.5 13 L 47.5 32 C 48.4 33.3 47.4 35 45.8 35 H 18.2 C 16.6 35 15.6 33.3 16.5 32 L 29.5 13 Z"
    fill="url(#linear-facet-1)"
  />
  <!-- Bottom Right Intersecting Triangle -->
  <path
    d="M 34.5 51 C 33.7 52.3 31.8 52.3 31 51 L 18 32 C 17.1 30.7 18.1 29 19.7 29 H 47.3 C 48.9 29 49.9 30.7 49 32 L 36 51 Z"
    fill="url(#linear-facet-2)"
    style="mix-blend-mode: screen;"
  />
</svg>`;

// =========================================================================
// STYLE 3: The Sliced Speed Sphere / Reel Aperture (Matching Reference 3)
// Dark violet OLED sphere with 4 clean diagonal speed cutouts
// =========================================================================
const slicedSphere_SVG = `<svg width="512" height="512" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="sphere-grad" cx="65%" cy="35%" r="60%">
      <stop offset="0%" stop-color="#A855F7" />
      <stop offset="50%" stop-color="#7C3AED" />
      <stop offset="100%" stop-color="#3B0764" />
    </radialGradient>
    <linearGradient id="slice-glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C084FC" />
      <stop offset="100%" stop-color="#6B21A8" />
    </linearGradient>
  </defs>
  <mask id="sphere-mask">
    <!-- Base full circle -->
    <circle cx="32" cy="32" r="24" fill="white" />
    <!-- Cutout slits -->
    <rect x="8" y="24" width="36" height="3" rx="1.5" transform="rotate(-38 26 25)" fill="black" />
    <rect x="8" y="32" width="36" height="3" rx="1.5" transform="rotate(-38 26 33)" fill="black" />
    <rect x="8" y="40" width="36" height="3" rx="1.5" transform="rotate(-38 26 41)" fill="black" />
  </mask>
  <circle cx="32" cy="32" r="24" fill="url(#sphere-grad)" mask="url(#sphere-mask)" />
  <!-- Subtle top-right ambient glow ring -->
  <circle cx="32" cy="32" r="23.5" stroke="#E9D5FF" stroke-opacity="0.25" stroke-width="1" />
</svg>`;

// Write all 3 to public for immediate inspection
fs.writeFileSync('c:/Users/Piyush/Downloads/Reeldash/public/logo-runway-r.svg', runwayR_SVG);
fs.writeFileSync('c:/Users/Piyush/Downloads/Reeldash/public/logo-linear-facets.svg', linearFacets_SVG);
fs.writeFileSync('c:/Users/Piyush/Downloads/Reeldash/public/logo-sliced-sphere.svg', slicedSphere_SVG);

// Set Style 1 (Runway R) as default logo & favicon
fs.writeFileSync('c:/Users/Piyush/Downloads/Reeldash/public/logo.svg', runwayR_SVG);
fs.writeFileSync('c:/Users/Piyush/Downloads/Reeldash/public/favicon.svg', runwayR_SVG);

console.log('Reference-matched SVGs generated successfully!');
