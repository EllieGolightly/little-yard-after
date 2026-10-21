/* A tiny, living illustration. All artwork is native SVG; no image dependencies. */

import { CROPS, WEATHER } from './data.js';
import { getSeasonIndex } from './engine.js';

const present = (value) => {
  if (typeof value === 'object' && value !== null) return value.owned !== false && value.level !== 0 && value.count !== 0;
  return Boolean(value);
};

function tree(x, y, scale = 1, variant = 0) {
  const colors = variant ? ['#77845b', '#929e71', '#acb78d'] : ['#7f9569', '#9cac7c', '#b5c397'];
  return `<g transform="translate(${x} ${y}) scale(${scale})" aria-hidden="true">
    <ellipse cx="2" cy="8" rx="35" ry="12" fill="#687c4c" opacity=".12"/>
    <path d="M-5 5L-7-65 1-71 6 5Z" fill="#9a8060"/>
    <path d="M0-21L-22-48M1-33L20-61" fill="none" stroke="#9a8060" stroke-width="5" stroke-linecap="round"/>
    <path d="M-37-57C-62-79-42-109-20-109C-20-137 20-137 29-113C57-113 65-82 44-65C43-37 10-29-9-44C-22-35-42-40-37-57Z" fill="${colors[0]}"/>
    <path d="M-40-81C-49-104-20-112-9-102C-11-129 24-132 29-108C49-107 52-85 38-77C18-87-2-74-13-67C-30-58-45-68-40-81Z" fill="${colors[1]}"/>
    <path d="M-13-111C-6-124 14-127 20-111M-32-92C-27-100-20-100-14-95M17-94C27-101 36-96 39-89" fill="none" stroke="${colors[2]}" stroke-width="8" stroke-linecap="round"/>
    <path d="M-18-58L-12-66M21-54L25-64M39-77L46-81" stroke="${colors[2]}" stroke-width="3" stroke-linecap="round"/>
  </g>`;
}

function fence(x1, y1, x2, y2, count = 7) {
  const posts = Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    return `<path d="M${x - 3} ${y}V${y - 30}L${x} ${y - 36}L${x + 3} ${y - 30}V${y}Z" fill="#f7f2df" stroke="#d5d5b8" stroke-width=".8"/>`;
  }).join('');
  return `<g aria-hidden="true"><path d="M${x1} ${y1 - 23}L${x2} ${y2 - 23}M${x1} ${y1 - 9}L${x2} ${y2 - 9}" stroke="#c6ceb1" stroke-width="6"/><path d="M${x1} ${y1 - 24}L${x2} ${y2 - 24}M${x1} ${y1 - 10}L${x2} ${y2 - 10}" stroke="#f4f0dd" stroke-width="4"/>${posts}</g>`;
}

function grass(x, y, color = '#829767', scale = 1) {
  return `<path transform="translate(${x} ${y}) scale(${scale})" d="M-5 0Q-6-6-10-9M0 0Q-2-10 2-13M5 0Q5-6 10-8" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" opacity=".75"/>`;
}

function chicken(x, y, direction = 1, small = false) {
  return `<g class="yard-bird" transform="translate(${x} ${y}) scale(${direction * (small ? .72 : 1)} ${small ? .72 : 1})" aria-hidden="true">
    <ellipse cx="0" cy="9" rx="12" ry="4" fill="#718258" opacity=".15"/>
    <path d="M-4 4L-4 11M3 4L3 11M-6 11H-1M1 11H6" stroke="#b88c42" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M-9-2L-15-12Q-7-13-4-7C5-15 12-8 10-2C8 8-7 9-9-2Z" fill="#fffae9"/>
    <path d="M-8-1Q-2-6 3 0Q-1 5-6 3" fill="#e8ddbe"/>
    <path d="M5-9C1-16 5-18 7-13C9-20 13-16 10-12" fill="#bf7061"/>
    <circle cx="9" cy="-7" r="4.8" fill="#fff9e5"/>
    <path d="M13-8L18-5L13-4" fill="#d7a250"/>
    <circle cx="10" cy="-8" r="1" fill="#575f45"/>
  </g>`;
}

function duck(x, y, direction = 1) {
  return `<g transform="translate(${x} ${y}) scale(${direction} 1)" aria-hidden="true">
    <ellipse cx="0" cy="7" rx="18" ry="4" fill="#86aaa0" opacity=".2"/>
    <path d="M-14 0L-19-6Q-12-6-9-3C-4-9 5-7 7-3L8-11C7-18 17-19 18-12L17 0C14 9-10 10-14 0Z" fill="#f8f0cd"/>
    <path d="M-9-1Q-2-5 5 0Q1 5-7 4" fill="#e7d8a8"/>
    <path d="M17-13L25-11L24-8L17-8" fill="#c99948"/>
    <circle cx="14" cy="-13" r="1.2" fill="#596145"/>
  </g>`;
}

function sprout(x, y, mature = false, kind = '') {
  const tomato = /tomato|番茄|西红柿/.test(kind);
  const carrot = /carrot|萝卜/.test(kind);
  if (mature && kind === 'fodder') {
    return `<g transform="translate(${x} ${y})"><path d="M0 2Q-13-13-8-25Q-3-19 0 2M0 2Q-3-25 3-31Q9-22 0 2M0 2Q8-26 14-22Q16-12 0 2M0 2Q-15-7-17-18Q-8-20 0 2" fill="#a1ad68"/><path d="M0 2L3-24M0 2L-9-16M0 2L11-18" stroke="#ced393" stroke-width="1"/></g>`;
  }
  if (mature && kind === 'pumpkin') {
    return `<g transform="translate(${x} ${y})"><path d="M-11-2Q-25-12-14-18Q-5-19-5-9Q0-25 8-20Q15-12 4-7Q21-16 22-7Q20 2 5 0" fill="#839c62"/><ellipse cx="0" cy="-2" rx="9" ry="8" fill="#dca365"/><ellipse cx="0" cy="-2" rx="4" ry="8" fill="#e4b275"/><path d="M0-10L2-14" stroke="#819059" stroke-width="2" stroke-linecap="round"/></g>`;
  }
  if (mature && tomato) {
    return `<g transform="translate(${x} ${y})"><path d="M0 2V-29" stroke="#b39771" stroke-width="2"/><path d="M0 0Q-9-11-6-21M0-5Q8-14 6-23" fill="none" stroke="#638454" stroke-width="2"/><path d="M-6-11Q-17-20-13-25Q-4-27-5-14M6-17Q16-25 17-17Q14-10 5-10" fill="#789459"/><circle cx="-7" cy="-5" r="4.5" fill="#cd7759"/><circle cx="7" cy="-10" r="4" fill="#dfa26a"/><circle cx="-2" cy="-16" r="3.7" fill="#c56c51"/></g>`;
  }
  if (mature && carrot) {
    return `<g transform="translate(${x} ${y})"><path d="M-3-2L0 5L4-2Z" fill="#d99155"/><path d="M0-1Q-15-12-8-22Q1-16 0-1M0-1Q-2-20 5-26Q11-16 0-1M1-1Q16-14 17-7Q14 0 1-1" fill="#7b965b"/><path d="M0-1L-6-16M0-1L5-21" stroke="#afbf7c" stroke-width="1"/></g>`;
  }
  return mature
    ? `<g transform="translate(${x} ${y})"><path d="M0 0C-12 4-20-7-13-14C-8-17-4-9-1-7C-7-22 4-29 8-17C16-22 23-8 12-3C9 4 3 5 0 0Z" fill="#849e64"/><path d="M0 0Q-12-5-9-11M0 0Q-2-9 4-17M0 0Q9-7 13-10" fill="none" stroke="#becb91" stroke-width="1.5" stroke-linecap="round"/></g>`
    : `<g transform="translate(${x} ${y})"><path d="M0 1V-7" stroke="#75905a" stroke-width="1.5"/><path d="M0-5Q-12-5-10-13Q0-14 0-5M0-6Q1-16 9-15Q12-7 0-6" fill="#90a66c"/><path d="M0-6L6-11" stroke="#bac990" stroke-width="1"/></g>`;
}

function gardenBed(x, y, plot, index, enabled, greenhouse) {
  const crop = plot?.crop;
  const kind = typeof crop === 'string' ? crop : crop?.id || crop?.name || '';
  const growing = Boolean(crop);
  const duration = Math.max(2, (CROPS.find((entry) => entry.id === kind)?.days || 4) - (greenhouse ? 1 : 0));
  const mature = growing && ((Number(plot?.progress) || 0) >= duration || plot?.ready || plot?.harvestable);
  const plants = [[23, 8], [47, 13], [71, 18], [36, 25], [61, 30]];
  return `<g transform="translate(${x} ${y})">
    <path d="M-3 12L41-8L104 11L61 37Z" fill="#596c42" opacity=".12" transform="translate(2 8)"/>
    <path d="M0 8L42-10L103 9L60 30Z" fill="${enabled ? '#b28c67' : '#b0b48e'}"/>
    <path d="M0 8V16L60 36V30Z" fill="${enabled ? '#bb9b73' : '#bfc4a0'}"/>
    <path d="M60 30V36L103 15V9Z" fill="${enabled ? '#957957' : '#a9b18a'}"/>
    <path d="M6 8L42-7L96 9L60 26Z" fill="${enabled ? '#897354' : '#c3c7a1'}"/>
    ${enabled ? '<path d="M22 8L73 23M34 2L86 17M11 13L61 28" stroke="#6e6049" stroke-width="1" opacity=".35"/>' : '<path d="M28 10L61 20M39 5L72 15" stroke="#a9b18a" stroke-width="1" stroke-dasharray="3 3"/>'}
    ${growing && Number(plot?.progress) > 0 ? plants.map(([px, py]) => sprout(px, py - 3, mature, kind)).join('') : enabled ? '<path d="M44 4L46 3M60 8L62 7M39 17L41 16M68 16L70 15" stroke="#c3ad82" stroke-width="2" stroke-linecap="round"/>' : ''}
    ${enabled && greenhouse ? '<path d="M1 7Q8-31 40-30L102-10V9L60 31Q62-5 40-10Z" fill="#e0eadc" fill-opacity=".17" stroke="#b4c7af" stroke-width="1.5"/><path d="M21 14Q23-21 61-23M42 23Q44-12 82-16" fill="none" stroke="#b4c7af" stroke-width="1"/>' : ''}
    <path d="M90 11V-6" stroke="#aa8b64" stroke-width="2"/><path d="M82-8L96-4V3L82-1Z" fill="#f1e5c9"/><path d="M85-4L92-2" stroke="#b29a73" stroke-width="1"/>
  </g>`;
}

function solarPanels(owned) {
  if (!owned) return '';
  return `<g aria-hidden="true">
    <path d="M450 146L507 121L553 176L496 201Z" fill="#775d48" opacity=".25" transform="translate(2 4)"/>
    <path d="M450 143L507 118L553 173L496 198Z" fill="#d8ded0" stroke="#b9c9c0" stroke-width="2.5"/>
    <path d="M454 144L506 121L549 172L497 195Z" fill="#647f7f"/>
    <path d="M471 137L514 188M488 129L532 180M468 160L520 137M482 177L535 154" stroke="#b8cfbf" stroke-width="1.5"/>
    <path d="M454 144L506 121L522 140L469 163Z" fill="#c5e1d4" opacity=".13"/>
  </g>`;
}

function pond(owned, hasDucks, fishCount, duckCount) {
  return `<g aria-hidden="true">
    <ellipse cx="730" cy="350" rx="79" ry="39" fill="#829865" opacity=".12"/>
    <path d="M665 344C663 323 692 304 725 313C750 291 801 308 801 332C829 351 796 376 765 370C728 387 670 374 665 344Z" fill="${owned ? '#b9b798' : '#bdc6a2'}"/>
    <path d="M672 342C671 325 696 313 726 321C756 301 792 313 793 336C813 351 787 367 762 362C727 379 678 367 672 342Z" fill="${owned ? 'url(#yard-water)' : '#cdd2ae'}"/>
    ${owned ? `<path d="M691 344Q703 340 715 344M749 350Q761 346 774 350M720 331Q730 328 742 331" fill="none" stroke="#e4edcf" stroke-width="2" stroke-linecap="round" opacity=".85"/>
    <g class="yard-fish" opacity="${fishCount>0?1:0}"><path d="M718 354Q726 346 736 351L743 348L742 356L736 354Q726 362 718 354Z" fill="#dcac78" opacity=".85"/><path d="M769 331Q765 326 757 330L752 327V334L757 332Q765 335 769 331Z" fill="#e8c488"/></g>
    <path d="M689 357Q700 346 710 354Q712 365 699 366Q689 366 689 357Z" fill="#88a377"/><path d="M700 354L700 360L710 360" fill="none" stroke="#aac194" stroke-width="1"/>
    <path d="M780 329Q789 319 796 326Q799 334 789 337Q780 337 780 329Z" fill="#8aa87a"/>` : '<path d="M715 344Q730 336 747 344" fill="none" stroke="#a9b48c" stroke-width="1.5" stroke-dasharray="4 5"/>'}
    <g fill="#d8d4b9"><ellipse cx="671" cy="336" rx="8" ry="5" transform="rotate(-30 671 336)"/><ellipse cx="691" cy="319" rx="10" ry="5" transform="rotate(-20 691 319)"/><ellipse cx="725" cy="316" rx="8" ry="4"/><ellipse cx="766" cy="310" rx="10" ry="5"/><ellipse cx="798" cy="328" rx="5" ry="7"/><ellipse cx="797" cy="358" rx="9" ry="5" transform="rotate(-30 797 358)"/><ellipse cx="757" cy="371" rx="10" ry="4"/><ellipse cx="711" cy="373" rx="9" ry="4"/><ellipse cx="677" cy="361" rx="7" ry="4" transform="rotate(30 677 361)"/></g>
    <path d="M791 307Q786 292 790 283M795 308Q797 290 801 282M787 307Q779 297 780 291" fill="none" stroke="#82935e" stroke-width="2" stroke-linecap="round"/><path d="M790 285L789 280M801 284L802 278" stroke="#9f8760" stroke-width="4" stroke-linecap="round"/>
    ${hasDucks && !owned ? '<ellipse cx="745" cy="343" rx="26" ry="14" fill="#a5b4a0"/><ellipse cx="745" cy="339" rx="26" ry="13" fill="#c2cdb4"/><ellipse cx="745" cy="339" rx="22" ry="10" fill="#9bbab0"/>' : ''}
    ${hasDucks ? Array.from({length:Math.min(4,duckCount)},(_,i)=>duck(746+i*20,329+i*14,i%2?1:-1)).join('') : ''}
  </g>`;
}

function coop(owned, group) {
  if (!owned) return `<g aria-hidden="true"><path d="M564 409L599 393L646 410L610 428Z" fill="#b5c09b" opacity=".65"/><path d="M570 409L599 396L639 410L610 424Z" fill="none" stroke="#9eae84" stroke-dasharray="3 5"/></g>`;
  return `<g aria-hidden="true">
    <ellipse cx="599" cy="415" rx="53" ry="18" fill="#687a4d" opacity=".13"/>
    <path d="M571 402V423M609 413V434M641 395V416" stroke="#a78b65" stroke-width="5"/>
    <path d="M563 367L611 383V417L563 401Z" fill="#dfbd85"/>
    <path d="M611 383L647 366V400L611 417Z" fill="#c1a16e"/>
    <path d="M563 367L585 340L611 383Z" fill="#e7c998"/>
    <path d="M556 367L584 335L620 385L611 388Z" fill="#8e9f77"/>
    <path d="M584 335L621 320L656 368L620 385Z" fill="#9eae86"/>
    <path d="M598 342L634 328M610 358L645 344" stroke="#bac69f" stroke-width="1.5"/>
    <path d="M560 366L582 340" stroke="#bac69f" stroke-width="2"/>
    <path d="M579 407V388Q587 376 595 393V412Z" fill="#7f7752"/>
    <path d="M579 407L595 412L581 433L561 427Z" fill="#ccab77"/>
    <path d="M576 413L591 418M571 419L586 424M565 425L581 430" stroke="#a68a60" stroke-width="2"/>
    <path d="M625 384L637 378V391L625 397Z" fill="#7c8260"/><path d="M631 381V394M625 391L637 385" stroke="#e2c799" stroke-width="1.5"/>
    <path d="M566 380L573 382M566 391L573 393M599 391L607 394M599 402L607 405" stroke="#c6a670" stroke-width="1"/>
    ${Array.from({length:Math.min(4,(group?.female||0)+(group?.male||0))},(_,i)=>chicken(650-i*19,425+(i%2)*18,i%2?1:-1)).join('')}${Array.from({length:Math.min(3,group?.young?.reduce((n,b)=>n+b.female+b.male,0)||0)},(_,i)=>chicken(653+i*15,447,1,true)).join('')}
    <ellipse cx="670" cy="405" rx="9" ry="4" fill="#d7c398"/><path d="M661 404V408Q670 414 679 408V404" fill="#b9956c"/>
  </g>`;
}

const YARD_GROUND_PATH = 'M114 281C115 225 241 177 372 174C474 167 527 160 643 191C765 201 836 272 825 345C867 402 775 458 670 473C535 497 392 493 244 463C151 444 55 384 77 329C80 307 94 291 114 281Z';
// 地面季节色：冬天铺一层薄雪、秋天染一层暖色。绘制在地面之后、物体之前
function seasonGround(state) {
  if (!state.settings?.seasons) return '';
  const idx = getSeasonIndex(Number(state.day) || 1);
  if (idx === 3) return `<path d="${YARD_GROUND_PATH}" fill="#f1f5ec" opacity=".78"/>`;
  if (idx === 2) return `<path d="${YARD_GROUND_PATH}" fill="#e2c99f" opacity=".16"/>`;
  return '';
}
// 季节氛围：冬天飘雪、秋天落叶。只是叠加层，不改变原有绘制
function seasonOverlay(state) {
  if (!state.settings?.seasons) return '';
  const idx = getSeasonIndex(Number(state.day) || 1);
  if (idx === 3) {
    const flakes = Array.from({ length: 24 }, (_, i) => {
      const x = (i * 61) % 880 + 10, y = (i * 43) % 470 + 12;
      return `<circle class="snowflake" cx="${x}" cy="${y}" r="${2.2 + (i % 3) * .8}" fill="#fffef8" opacity=".85"/>`;
    }).join('');
    return `<g aria-hidden="true">${flakes}</g>`;
  }
  if (idx === 2) {
    const leaves = Array.from({ length: 12 }, (_, i) => {
      const x = (i * 73) % 880 + 10, y = (i * 47) % 440 + 15;
      return `<path class="falling-leaf" d="M${x} ${y} q5 -3 9 0 q-4 4 -9 0Z" fill="${i % 2 ? '#d4a259' : '#c08a52'}" opacity=".6"/>`;
    }).join('');
    return `<g aria-hidden="true">${leaves}</g>`;
  }
  return '';
}
/** Render a self-contained SVG. Scene events are delegated through data-scene. */
export function renderScene(state = {}, { compact = false } = {}) {
  const f = state.facilities || {};
  const has = (id) => present(f[id]);
  const plots = Array.isArray(state.plots) ? state.plots : [];
  const plotCount = Math.max(4, Math.min(plots.length, 6));
  const activeGarden = plots.length > 0;
  const phase = state.phase || 'prep';
  const day = Number(state.day) || 1;
  const rainy = phase !== 'prep' && WEATHER[(Math.max(1, day) - 1) % WEATHER.length].rain > 0;
  const zones = (id, label) => `class="yard-zone" data-scene="${id}" role="button" tabindex="0" aria-label="${label}"`;
  const bedLocations = [[124, 331], [226, 352], [93, 371], [195, 392], [64, 413], [166, 434]];

  return `<svg class="home-scene${compact ? ' home-scene--compact' : ''}" viewBox="0 0 900 530" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="你的小院，点击房屋、菜地、池塘或设备查看经营情况">
  <defs>
    <linearGradient id="yard-lawn" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#dfe6bf"/><stop offset="1" stop-color="#c8d4a9"/></linearGradient>
    <linearGradient id="yard-roof" x1=".1" y1="0" x2=".9" y2="1"><stop stop-color="#d49c78"/><stop offset="1" stop-color="#bd805f"/></linearGradient>
    <linearGradient id="yard-water" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b2cbb6"/><stop offset="1" stop-color="#8fac9e"/></linearGradient>
    <linearGradient id="yard-window" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f5de9c"/><stop offset="1" stop-color="#eebc76"/></linearGradient>
    <pattern id="yard-roof-tiles" width="27" height="21" patternUnits="userSpaceOnUse" patternTransform="rotate(-23)"><path d="M0 21V17Q13.5 24 27 17V21M0 0V17" fill="none" stroke="#a57054" stroke-width="1" opacity=".28"/><path d="M1 1H27" stroke="#e5b492" stroke-width="1" opacity=".3"/></pattern>
    <filter id="yard-shadow" x="-20%" y="-20%" width="150%" height="150%"><feDropShadow dx="0" dy="8" stdDeviation="9" flood-color="#7c865e" flood-opacity=".1"/></filter>
  </defs>
  <style>
    .home-scene{width:100%;height:auto;display:block;overflow:visible;isolation:isolate}
    .yard-zone{cursor:pointer;outline:none}
    .yard-zone .zone-marker{opacity:0;transition:opacity .18s ease}
    .yard-zone:hover .zone-marker,.yard-zone:focus-visible .zone-marker{opacity:1}
    .yard-zone:focus-visible{filter:drop-shadow(0 0 3px #788457)}
    .yard-smoke{animation:yard-drift 7s ease-in-out infinite;transform-origin:540px 65px}
    .yard-smoke:nth-child(2){animation-delay:-3s}
    .yard-fish{animation:yard-swim 9s ease-in-out infinite;transform-origin:733px 351px}
    .yard-leaf{animation:yard-sway 5s ease-in-out infinite;transform-origin:center;transform-box:fill-box}
    @keyframes yard-drift{0%,100%{transform:translate(0,0);opacity:.3}50%{transform:translate(6px,-7px);opacity:.55}}
    @keyframes yard-swim{0%,100%{transform:translateX(0)}50%{transform:translateX(7px)}}
    @keyframes yard-sway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
    .snowflake{animation:yard-snow 7s ease-in-out infinite}
    @keyframes yard-snow{0%,100%{transform:translateY(-4px)}50%{transform:translateY(8px)}}
    .falling-leaf{animation:yard-leaf-fall 9s ease-in-out infinite}
    @keyframes yard-leaf-fall{0%,100%{transform:translateY(-3px) rotate(0)}50%{transform:translateY(9px) rotate(25deg)}}
    @media(prefers-reduced-motion:reduce){.yard-smoke,.yard-fish,.yard-leaf,.snowflake,.falling-leaf{animation:none}.yard-zone .zone-marker{transition:none}}
  </style>

  <g aria-hidden="true">
    <circle cx="748" cy="78" r="30" fill="${rainy ? '#e5e5ce' : '#f1dfac'}" opacity=".65"/>
    <path d="M121 99Q114 85 129 78Q130 58 151 66Q166 52 180 73Q197 75 191 91Z" fill="#fffdf0" opacity=".66"/>
    <path d="M683 138Q676 127 691 120Q688 105 706 105Q719 90 734 111Q753 106 755 126Z" fill="#fffdf0" opacity=".6"/>
    <path d="M249 118Q255 111 261 117M267 103Q273 97 279 103" fill="none" stroke="#a0ac87" stroke-width="2" stroke-linecap="round"/>
    <path d="M114 292C115 236 241 188 372 185C474 178 527 171 643 202C765 212 836 283 825 356C867 413 775 469 670 484C535 508 392 504 244 474C151 455 55 395 77 340C80 318 94 302 114 292Z" fill="#7e8f5f" opacity=".07" transform="translate(0 14)"/>
    <path d="M114 281C115 225 241 177 372 174C474 167 527 160 643 191C765 201 836 272 825 345C867 402 775 458 670 473C535 497 392 493 244 463C151 444 55 384 77 329C80 307 94 291 114 281Z" fill="url(#yard-lawn)"/>
    <path d="M102 353C126 409 237 451 361 468M567 477Q711 467 783 421" fill="none" stroke="#e1e8c8" stroke-width="3" stroke-linecap="round" opacity=".7"/>
    <path d="M410 345C416 367 377 382 371 405C365 437 442 454 462 487L525 489C511 444 427 429 425 407C423 387 465 371 457 354Z" fill="#e9dfbd"/>
    <path d="M406 407Q410 418 427 427M460 452L481 458M468 474L490 470M389 393L414 398" fill="none" stroke="#d8cca8" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="490" cy="351" rx="170" ry="46" fill="#6f7c51" opacity=".12"/>
  </g>
  ${seasonGround(state)}

  ${fence(126, 264, 280, 201, 10)}
  ${fence(612, 172, 789, 250, 10)}
  ${tree(160, 278, .94)}
  ${tree(710, 240, 1.06, 1)}
  ${tree(770, 278, .62)}

  <g ${zones('home', '房屋与日常生活')}>
    <title>我的小屋 · 生活与储备</title>
    <path d="M286 221L503 262V379L286 338Z" fill="#f5e8c8"/>
    <path d="M503 262L638 205V324L503 379Z" fill="#dfd8b7"/>
    <path d="M286 221L392 121L503 262Z" fill="#f9efd5"/>
    <path d="M286 321L503 362V379L286 338Z" fill="#ded1af"/>
    <path d="M503 362L638 307V324L503 379Z" fill="#c4c2a0"/>
    <path d="M292 339L500 378L648 318L657 322L502 389L283 347Z" fill="#c4bda0"/>
    <path d="M286 243L503 284M286 277L503 318M286 308L503 349" stroke="#e8dbb9" stroke-width="1"/>
    <path d="M520 270L634 222M520 303L634 255M520 336L634 288" stroke="#cdcaaa" stroke-width="1"/>
    <path d="M390 125L526 69L653 207L507 273Z" fill="#8c6c50" opacity=".16" transform="translate(0 5)"/>
    <path d="M392 121L526 65L653 204L503 267Z" fill="url(#yard-roof)"/>
    <path d="M392 121L526 65L653 204L503 267Z" fill="url(#yard-roof-tiles)"/>
    <path d="M277 224L391 111L510 263L503 272L392 131L286 232Z" fill="#b7815d"/>
    <path d="M277 224L391 111L526 56L534 64L394 122" fill="#dfb28b"/>
    <path d="M503 267L653 204L656 211L505 275Z" fill="#a87555"/>
    <path d="M287 231L391 131L497 264" fill="none" stroke="#f8ecd0" stroke-width="5"/>

    <path d="M525 99V58L545 63V107Z" fill="#ceb38c"/>
    <path d="M545 63L559 56V99L545 107Z" fill="#ad9270"/>
    <path d="M520 57L538 49L563 55L545 65Z" fill="#e0c8a4"/>
    <path d="M526 57L538 53L556 57L545 61Z" fill="#897b61"/>
    <path d="M526 72L545 77M526 86L545 91M535 60V74M535 88V101M546 78L558 72M546 94L558 88" stroke="#b69872" stroke-width="1"/>
    ${has('stove') ? '<g fill="none" stroke="#e8e4d3" stroke-width="9" stroke-linecap="round"><path class="yard-smoke" d="M539 44C525 32 552 28 539 14"/><path class="yard-smoke" d="M550 39C560 27 547 21 555 10"/></g>' : ''}

    <ellipse cx="389" cy="199" rx="22" ry="25" fill="#b6ad87" transform="rotate(-11 389 199)"/>
    <ellipse cx="389" cy="198" rx="17" ry="20" fill="url(#yard-window)" transform="rotate(-11 389 198)"/>
    <path d="M389 179V217M373 195L405 201" stroke="#f7e9c8" stroke-width="3"/>
    <path d="M313 255L358 263V308L313 300Z" fill="#afaa83"/>
    <path d="M317 260L354 267V302L317 295Z" fill="url(#yard-window)"/>
    <path d="M335 263V299M317 278L354 285" stroke="#f8edce" stroke-width="3"/>
    <path d="M302 253L311 255V300L302 298ZM361 265L370 267V311L361 309Z" fill="#8b9c76"/>
    <path d="M303 263L310 265M303 273L310 275M303 283L310 285M362 275L369 277M362 285L369 287M362 295L369 297" stroke="#b1bc91" stroke-width="1"/>
    <path d="M308 303L363 313L363 318L308 308Z" fill="#d2bd95"/>
    <path d="M310 309L362 319L358 329L315 321Z" fill="#b88867"/>
    <g fill="#8ba06b"><path d="M319 311Q311 296 324 299Q329 291 333 307Q344 298 345 315Z"/><path d="M344 316Q342 297 352 307Q361 304 358 317Z"/></g>
    <g fill="#e8c28c"><circle cx="322" cy="300" r="3"/><circle cx="337" cy="306" r="3"/><circle cx="352" cy="307" r="3"/></g>

    <path d="M397 271L449 280V366L397 356Z" fill="#bdac82"/>
    <path d="M402 277L445 285V362L402 354Z" fill="#8e9d78"/>
    <path d="M409 286L438 291V320L409 315Z" fill="#d9d7ac"/>
    <path d="M423 289V317M409 300L438 305" stroke="#8e9d78" stroke-width="3"/>
    <path d="M408 324L439 330V350L408 344Z" fill="none" stroke="#aab492" stroke-width="1.5"/>
    <circle cx="437" cy="330" r="2.6" fill="#e5c382"/>
    <path d="M390 358L449 369L462 366L403 354Z" fill="#f1e4c2"/>
    <path d="M390 358V364L449 375V369Z" fill="#c9bea0"/>
    <path d="M385 365L449 377L461 373L396 361Z" fill="#e0d4b3"/>
    <path d="M385 365V370L449 382V377Z" fill="#c0b697"/>
    <ellipse cx="423" cy="375" rx="22" ry="5" fill="#b3a480" transform="rotate(10 423 375)"/>

    <path d="M551 260L603 238V288L551 310Z" fill="#a6a783"/>
    <path d="M556 263L598 245V284L556 302Z" fill="url(#yard-window)"/>
    <path d="M577 254V293M556 282L598 264" stroke="#efe5c4" stroke-width="3"/>
    <path d="M546 311L606 286V292L546 317Z" fill="#c9bd95"/>
    ${has('fridge') ? '<path d="M586 260L597 255V282L586 287Z" fill="#f5efda" opacity=".9"/><path d="M586 273L597 268" stroke="#b4bca7" stroke-width="1"/>' : ''}
    ${has('books') ? '<path d="M558 291L563 289V300L558 302Z" fill="#a2765a"/><path d="M564 286L569 284V297L564 299Z" fill="#889275"/><path d="M570 289L574 287V295L570 297Z" fill="#c49b68"/>' : ''}
    <path d="M466 271V286" stroke="#929676" stroke-width="2"/><path d="M459 284L467 279L475 287L471 300L462 299Z" fill="#ddc99e" stroke="#9b9674" stroke-width="1.2"/><path d="M463 286L471 287L469 296L464 295Z" fill="#f7dfa4"/>
    <path d="M478 366V344M476 355Q457 349 462 341Q472 339 478 354M479 354Q477 335 487 336Q494 348 479 354" fill="#8da175"/>
    <path d="M467 362L488 366L485 380L471 377Z" fill="#c4946f"/>
    <path class="zone-marker" d="M283 348L503 389L657 323" fill="none" stroke="#6f8654" stroke-width="3" stroke-linecap="round"/>
  </g>

  <g ${zones('power', '供电设备与用电安排')}>
    <title>供电 · 让小屋一直亮着</title>
    ${solarPanels(has('solar'))}
    ${has('battery') ? '<g aria-hidden="true"><path d="M515 343L536 334L557 342L535 352Z" fill="#dddcca"/><path d="M515 343V370L535 378V352Z" fill="#b6bda7"/><path d="M535 352L557 342V369L535 378Z" fill="#9ca992"/><path d="M519 348L531 353V360L519 355Z" fill="#6f8a75"/><path d="M523 352L527 353" stroke="#d3e5ad" stroke-width="2"/><path d="M542 354L551 350M542 359L551 355M542 364L551 360" stroke="#788e76" stroke-width="1"/></g>' : ''}
    ${has('generator') ? '<g aria-hidden="true"><path d="M493 390L517 379L543 388L519 399Z" fill="#c3b185"/><path d="M493 390V408L519 417V399Z" fill="#a6a078"/><path d="M519 399L543 388V407L519 417Z" fill="#878e6d"/><path d="M501 389V381L521 386V394M530 390V382" fill="none" stroke="#777e62" stroke-width="3"/><ellipse cx="506" cy="403" rx="7" ry="8" fill="#80866b" transform="rotate(-15 506 403)"/><ellipse cx="506" cy="403" rx="3" ry="4" fill="#b8bd96"/><path d="M525 401L537 396M525 406L537 401" stroke="#bbc49c" stroke-width="1.5"/></g>' : ''}
    ${!has('solar') && !has('battery') && !has('generator') ? '<g aria-hidden="true"><path d="M522 341V365M518 350H526" stroke="#a4ad89" stroke-width="2"/><path d="M520 337L526 335L529 340L523 342Z" fill="#bac1a0"/></g>' : ''}
    <ellipse class="zone-marker" cx="533" cy="382" rx="36" ry="13" fill="none" stroke="#718858" stroke-width="2" stroke-dasharray="3 4"/>
  </g>

  <g ${zones('water', '供水、储水与净水设备')}>
    <title>供水 · 把雨天存下来</title>
    ${has('rain') ? '<path d="M507 276L642 219V313" fill="none" stroke="#899b87" stroke-width="4" stroke-linejoin="round"/><path d="M508 274L640 218" stroke="#c8d0b4" stroke-width="1.5"/>' : ''}
    ${has('tank') || has('rain') ? '<g aria-hidden="true"><ellipse cx="656" cy="327" rx="25" ry="10" fill="#768760" opacity=".13"/><path d="M635 286V323C635 337 675 337 675 323V286Z" fill="#a2b2a0"/><ellipse cx="655" cy="286" rx="20" ry="8" fill="#c3cdb7"/><ellipse cx="655" cy="286" rx="16" ry="5.5" fill="#a9baa7"/><path d="M636 298C640 308 671 308 674 298M636 316C640 326 671 326 674 316" fill="none" stroke="#7f9686" stroke-width="2"/><path d="M642 292V321" stroke="#c1cdb6" stroke-width="2" opacity=".7"/><path d="M669 321H678V327" fill="none" stroke="#84957e" stroke-width="3" stroke-linecap="round"/></g>' : '<g aria-hidden="true"><ellipse cx="655" cy="321" rx="17" ry="7" fill="#b6bf99"/><path d="M649 312H661M655 307V317" stroke="#96a580" stroke-width="1.5" stroke-linecap="round"/></g>'}
    ${has('filter') ? '<g aria-hidden="true"><path d="M683 304V326Q691 335 699 326V304Z" fill="#e8e5ce"/><ellipse cx="691" cy="304" rx="8" ry="4" fill="#aab7a0"/><path d="M685 313Q691 317 697 313" fill="none" stroke="#c3d2bd" stroke-width="4"/><path d="M700 321H704V325" fill="none" stroke="#91a58d" stroke-width="2"/></g>' : ''}
    <ellipse class="zone-marker" cx="660" cy="335" rx="37" ry="13" fill="none" stroke="#718858" stroke-width="2" stroke-dasharray="3 4"/>
  </g>

  <g ${zones('garden', '菜园，播种与收获')}>
    <title>菜园 · 等一颗种子长成一餐饭</title>
    ${bedLocations.slice(0, plotCount).map(([x, y], i) => gardenBed(x, y, plots[i], i, i < plots.length, has('greenhouse'))).join('')}
    ${has('compost') ? '<g transform="translate(0 -30)" aria-hidden="true"><path d="M259 326L278 318L295 324L276 333Z" fill="#a7b086"/><path d="M259 326V347L276 353V333Z" fill="#8b9c74"/><path d="M276 333L295 324V345L276 353Z" fill="#798d66"/><path d="M262 335L273 339M262 342L273 346M280 338L291 333M280 345L291 340" stroke="#b3bc96" stroke-width="1.5"/></g>' : ''}
    ${activeGarden ? '<g aria-hidden="true"><path d="M103 418L113 410L128 415L118 424Z" fill="#a0b293"/><path d="M103 418V430L118 436V424Z" fill="#94a987"/><path d="M118 424L128 415V429L118 436Z" fill="#7e987b"/><path d="M108 414V407Q115 399 121 408V415" fill="none" stroke="#a1b390" stroke-width="3"/><path d="M104 423L92 417L88 421L104 431Z" fill="#94a987"/><path d="M88 417L87 423" stroke="#b4c29b" stroke-width="3"/></g>' : ''}
    <path class="zone-marker" d="M102 360L154 337M92 410L253 456L303 432" fill="none" stroke="#718858" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 4"/>
  </g>

  <g ${zones('animals', '养殖区，鸡鸭与鱼池')}>
    <title>养殖 · 小院里的新邻居</title>
    ${pond(has('pond'),has('ducks'),(state.animals?.pond?.adults||0)+(state.animals?.pond?.young?.length||0),(state.animals?.ducks?.female||0)+(state.animals?.ducks?.male||0)+(state.animals?.ducks?.young?.length||0))}
    ${coop(has('coop'),state.animals?.coop)}
    <ellipse class="zone-marker" cx="635" cy="442" rx="66" ry="19" fill="none" stroke="#718858" stroke-width="2" stroke-dasharray="3 4"/>
  </g>

  <g aria-hidden="true">
    ${grass(132, 310)}${grass(205, 299, '#8ca270', .8)}${grass(277, 445)}${grass(324, 418, '#91a671', .8)}${grass(533, 463)}${grass(709, 418)}${grass(780, 402)}${grass(763, 276, '#899963', .7)}${grass(107, 350, '#92a375', .6)}
    <g fill="#f0e8c6"><circle cx="180" cy="305" r="2.5"/><circle cx="184" cy="310" r="2"/><circle cx="736" cy="431" r="2.5"/><circle cx="741" cy="425" r="2"/><circle cx="549" cy="445" r="2"/></g>
    <g fill="#d7be85"><circle cx="180" cy="305" r=".8"/><circle cx="736" cy="431" r=".8"/></g>
    <path d="M739 440L754 434L766 437L750 444Z" fill="#b7b59a"/><path d="M304 462L316 459L326 463L313 467Z" fill="#b9b99c"/>
  </g>
  ${fence(119, 408, 251, 458, 9)}
  ${fence(661, 470, 773, 418, 8)}
  <g aria-hidden="true">
    <path d="M458 475V499M464 476V500" stroke="#ad9870" stroke-width="3"/>
    <path d="M450 462L480 468V484L450 478Z" fill="#eee2c1" stroke="#c4b18c" stroke-width="1"/>
    <path d="M457 469L472 472M457 473L467 475" stroke="#9ca27c" stroke-width="1.5" stroke-linecap="round"/>
  </g>
  ${rainy ? '<g aria-hidden="true" stroke="#a5bab1" stroke-width="1.5" stroke-linecap="round" opacity=".35"><path d="M204 155L200 166M248 189L244 200M714 99L710 110M771 179L767 190M171 369L167 380M702 464L698 475M794 303L790 314"/></g>' : ''}
  ${seasonOverlay(state)}
  </svg>`;
}

export default renderScene;
