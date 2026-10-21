import { createGame, buyCart, startGame, advanceDay, act, getStarterCart, suggestMeal, getCropDuration } from './src/engine.js';
import { renderSeason } from './src/life.js';
const unwrap = r => { if (r.error) throw new Error(r.error); return r.state; };
let s = unwrap(buyCart(createGame(), getStarterCart(createGame())));
s = unwrap(startGame(s));
const targets = [1, 45, 95, 130, 175];
for (let d = 1; d <= 180; d++) {
  for (let i = 0; i < s.plots.length; i++) {
    const p = s.plots[i];
    if (p.crop && p.progress >= getCropDuration(s, p.crop)) s = unwrap(act(s, { type: 'harvest', plot: i }));
  }
  for (let i = 0; i < s.plots.length; i++) {
    if (!s.plots[i].crop) s = unwrap(act(s, { type: 'plant', plot: i, crop: i === 0 ? 'fodder' : 'potatoes' }));
  }
  if (s.inventory.boiledPotato < 2 && s.inventory.potatoes >= 1) s = unwrap(act(s, { type: 'cook', recipe: 'potato', batch: Math.min(s.inventory.potatoes, 2) }));
  s = unwrap(act(s, { type: 'mealPreset', mode: 'clear' }));
  for (const [k, q] of Object.entries(suggestMeal(s, 1))) s = unwrap(act(s, { type: 'meal', resource: k, amount: q }));
  s = advanceDay(s).state;
  if (targets.includes(d)) {
    const html = renderSeason(s);
    const wishRows = (html.match(/wish-row/g) || []).length;
    console.log(`D${d} panel:${html.length} wishRows:${wishRows} ok:${html.includes('season-section')}`);
  }
}
