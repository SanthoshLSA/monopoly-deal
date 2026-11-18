import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getBaseDeck, PROPERTY_SETS } from './decks/baseDeck.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicCardsDir = path.resolve(__dirname, '../../client/public/cards');

function generateSvg({ name, type, value, description, color, colors }) {
  const displayVal = value !== undefined ? `$${value}M` : '';
  const typeLabel = type.toUpperCase();
  const descSafe = (description || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const nameSafe = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  let primaryHex = '#333333';
  let headerBanner = '';

  if (color && PROPERTY_SETS[color]) {
    primaryHex = PROPERTY_SETS[color].hex;
    const setName = PROPERTY_SETS[color].name.toUpperCase();
    headerBanner = `
    <!-- Solid Color Header Banner -->
    <rect x="10" y="10" width="220" height="58" rx="6" fill="${primaryHex}"/>
    <rect x="10" y="56" width="220" height="12" fill="${primaryHex}"/>
    <line x1="10" y1="68" x2="230" y2="68" stroke="#000000" stroke-width="2"/>
    <text x="120" y="44" fill="#ffffff" font-family="'Inter', -apple-system, sans-serif" font-size="13" font-weight="800" text-anchor="middle" letter-spacing="1" stroke="#000000" stroke-width="0.5">${setName}</text>
    `;
  } else if (colors && colors.length > 0) {
    if (colors.length > 2) {
      // Multi-color gradient
      primaryHex = '#e11d48';
      headerBanner = `
      <defs>
        <linearGradient id="rainbow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#8B4513" />
          <stop offset="14%" stop-color="#87CEEB" />
          <stop offset="28%" stop-color="#D10069" />
          <stop offset="42%" stop-color="#FF7F00" />
          <stop offset="57%" stop-color="#D91023" />
          <stop offset="71%" stop-color="#FBD000" />
          <stop offset="85%" stop-color="#00873E" />
          <stop offset="100%" stop-color="#0038A8" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="220" height="58" rx="6" fill="url(#rainbow)"/>
      <rect x="10" y="56" width="220" height="12" fill="url(#rainbow)"/>
      <line x1="10" y1="68" x2="230" y2="68" stroke="#000000" stroke-width="2"/>
      <text x="120" y="44" fill="#ffffff" font-family="'Inter', -apple-system, sans-serif" font-size="11" font-weight="800" text-anchor="middle" letter-spacing="0.5" stroke="#000000" stroke-width="0.6">WILD PROPERTY (ANY COLOR)</text>
      `;
    } else {
      // Dual-color split
      const c1 = PROPERTY_SETS[colors[0]]?.hex || '#333';
      const c2 = PROPERTY_SETS[colors[1]]?.hex || '#555';
      primaryHex = c1;
      const n1 = PROPERTY_SETS[colors[0]]?.name.toUpperCase();
      const n2 = PROPERTY_SETS[colors[1]]?.name.toUpperCase();
      headerBanner = `
      <rect x="10" y="10" width="110" height="58" rx="6" fill="${c1}"/>
      <rect x="10" y="56" width="110" height="12" fill="${c1}"/>
      <rect x="120" y="10" width="110" height="58" rx="6" fill="${c2}"/>
      <rect x="120" y="56" width="110" height="12" fill="${c2}"/>
      <line x1="10" y1="68" x2="230" y2="68" stroke="#000000" stroke-width="2"/>
      <line x1="120" y1="10" x2="120" y2="68" stroke="#000000" stroke-width="2"/>
      <text x="65" y="44" fill="#ffffff" font-family="'Inter', -apple-system, sans-serif" font-size="11" font-weight="800" text-anchor="middle" stroke="#000" stroke-width="0.4">${n1}</text>
      <text x="175" y="44" fill="#ffffff" font-family="'Inter', -apple-system, sans-serif" font-size="11" font-weight="800" text-anchor="middle" stroke="#000" stroke-width="0.4">${n2}</text>
      `;
    }
  }

  // Word wrap description into max 4 lines
  const words = descSafe.split(' ');
  const lines = [];
  let currentLine = '';
  for (const word of words) {
    if ((currentLine + word).length > 28) {
      lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  }
  if (currentLine) lines.push(currentLine.trim());

  const descSpans = lines.slice(0, 4).map((line, idx) => 
    `<tspan x="120" dy="${idx === 0 ? 0 : 16}">${line}</tspan>`
  ).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 336" width="240" height="336">
  <defs>
    <pattern id="grid" width="12" height="12" patternUnits="userSpaceOnUse">
      <path d="M 12 0 L 0 0 0 12" fill="none" stroke="#181818" stroke-width="0.5"/>
    </pattern>
  </defs>

  <!-- Card Base with Color Accent Border -->
  <rect x="2" y="2" width="236" height="332" rx="10" fill="#0c0c0c" stroke="${primaryHex !== '#333333' ? primaryHex : '#383838'}" stroke-width="${primaryHex !== '#333333' ? '3' : '2'}"/>
  <rect x="8" y="8" width="224" height="320" rx="8" fill="url(#grid)"/>

  <!-- Top Header Banner if Property/Wildcard -->
  ${headerBanner}

  <!-- Value Pill in Corner -->
  <circle cx="34" cy="${headerBanner ? '92' : '30'}" r="15" fill="#000000" stroke="#71717a" stroke-width="2"/>
  <text x="34" y="${headerBanner ? '96' : '34'}" fill="#ffffff" font-family="'Inter', -apple-system, sans-serif" font-size="11" font-weight="800" text-anchor="middle">${displayVal}</text>

  <!-- Type Label -->
  <text x="218" y="${headerBanner ? '94' : '34'}" fill="#a1a1aa" font-family="'Inter', -apple-system, sans-serif" font-size="10" font-weight="700" text-anchor="end" letter-spacing="1.5">${typeLabel}</text>

  <!-- Center Card Title & Symbol -->
  <g transform="translate(120, ${headerBanner ? '160' : '142'})">
    <!-- Decorative Center Icon -->
    <circle cx="0" cy="-22" r="26" fill="#141414" stroke="${primaryHex !== '#333333' ? primaryHex : '#52525b'}" stroke-width="2"/>
    <text x="0" y="-16" fill="#ffffff" font-family="'Inter', -apple-system, sans-serif" font-size="14" font-weight="800" text-anchor="middle">${displayVal || 'MD'}</text>
    
    <!-- Title -->
    <text x="0" y="24" fill="#ffffff" font-family="'Inter', -apple-system, sans-serif" font-size="13" font-weight="700" text-anchor="middle">
      ${nameSafe.length > 22 ? nameSafe.slice(0, 22) + '...' : nameSafe}
    </text>
  </g>

  <!-- Divider Line -->
  <line x1="24" y1="${headerBanner ? '216' : '205'}" x2="216" y2="${headerBanner ? '216' : '205'}" stroke="#333333" stroke-width="1"/>

  <!-- Description Box -->
  <text x="120" y="${headerBanner ? '236' : '230'}" fill="#d4d4d8" font-family="'Inter', -apple-system, sans-serif" font-size="10" font-weight="500" text-anchor="middle">
    ${descSpans}
  </text>

  <!-- Bottom Bar with Value -->
  <rect x="18" y="295" width="204" height="22" rx="4" fill="#171717" stroke="#262626" stroke-width="1"/>
  <text x="28" y="309" fill="#71717a" font-family="'Inter', -apple-system, sans-serif" font-size="9" font-weight="700" letter-spacing="0.5">MONOPOLY DEAL</text>
  <text x="212" y="309" fill="#ffffff" font-family="'Inter', -apple-system, sans-serif" font-size="10" font-weight="800" text-anchor="end">${displayVal}</text>
</svg>`;
}

export function generateAllPlaceholders() {
  const deck = getBaseDeck();
  const createdPaths = new Set();
  let count = 0;

  for (const card of deck) {
    if (!card.image) continue;
    const relPath = card.image.replace(/^\/cards\//, '');
    const fullPath = path.join(publicCardsDir, relPath);
    
    if (createdPaths.has(fullPath)) continue;
    createdPaths.add(fullPath);

    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const svgContent = generateSvg(card);
    fs.writeFileSync(fullPath, svgContent, 'utf8');
    count++;
  }

  // Card back SVG
  const cardBackPath = path.join(publicCardsDir, 'card_back.svg');
  const cardBackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 336" width="240" height="336">
  <defs>
    <pattern id="backgrid" width="16" height="16" patternUnits="userSpaceOnUse">
      <path d="M 0 0 L 16 16 M 16 0 L 0 16" fill="none" stroke="#202020" stroke-width="0.75"/>
    </pattern>
  </defs>
  <rect x="2" y="2" width="236" height="332" rx="10" fill="#09090b" stroke="#3f3f46" stroke-width="2"/>
  <rect x="8" y="8" width="224" height="320" rx="8" fill="url(#backgrid)"/>
  <rect x="14" y="14" width="212" height="308" rx="6" fill="none" stroke="#52525b" stroke-width="1.5"/>
  <circle cx="120" cy="168" r="50" fill="#000000" stroke="#71717a" stroke-width="2"/>
  <text x="120" y="162" fill="#ffffff" font-family="'Inter', -apple-system, sans-serif" font-size="16" font-weight="800" text-anchor="middle" letter-spacing="2">MONOPOLY</text>
  <text x="120" y="184" fill="#a1a1aa" font-family="'Inter', -apple-system, sans-serif" font-size="13" font-weight="700" text-anchor="middle" letter-spacing="4">DEAL</text>
</svg>`;
  fs.writeFileSync(cardBackPath, cardBackSvg, 'utf8');
  count++;

  console.log(`Successfully generated ${count} card placeholder SVG assets with color-coding in: ${publicCardsDir}`);
}

generateAllPlaceholders();
