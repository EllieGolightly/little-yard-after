import { createGame, buyCart, startGame, advanceDay, act, getStarterCart, suggestMeal, getCropDuration, getDerived } from './src/engine.js';
import { NEIGHBOR_REQUESTS, NEIGHBORS } from './src/data.js';
const unwrap = r => { if (r.error) throw new Error(r.error); return r.state; };
let s = unwrap(buyCart(createGame(), getStarterCart(createGame())));
s = unwrap(startGame(s));
// 送礼前保留的安全库存（不影响生存与求助）
const SAFE = { chickenEggs: 20, food: 10, fuel: 5, vegetables: 5, fish: 2 };
function obtain(s, resource, amount) {
  const plans = { fuel: [['zhou', 0]], vegetables: [['he', 2]], fish: [['chen', 4]] };
  const list = plans[resource];
  if (!list) return s;
  let guard = 0;
  while ((s.inventory[resource] - (s.mealPlan[resource] || 0)) + 1e-8 < amount && guard++ < 12) {
    let moved = false;
    for (const [nid, ti] of list) {
      if (!s.neighbors.met.includes(nid) || s.neighbors.tradesLeft[nid] <= 0) continue;
      const r = act(s, { type: 'trade', neighbor: nid, tradeIndex: ti });
      if (!r.error) { s = r.state; moved = true; break; }
    }
    if (!moved) break;
  }
  return s;
}
let helped = 0, traded = 0;
for (let d = 1; d <= 180; d++) {
  for (let i = 0; i < s.plots.length; i++) {
    const p = s.plots[i];
    if (p.crop && p.progress >= getCropDuration(s, p.crop)) s = unwrap(act(s, { type: 'harvest', plot: i }));
  }
  for (let i = 0; i < s.plots.length; i++) {
    if (!s.plots[i].crop) s = unwrap(act(s, { type: 'plant', plot: i, crop: i === 0 ? 'fodder' : 'potatoes' }));
  }
  if (s.inventory.boiledPotato < 2 && s.inventory.potatoes >= 1) s = unwrap(act(s, { type: 'cook', recipe: 'potato', batch: Math.min(s.inventory.potatoes, 2) }));
  // 完成激活的求助（物资不够先交换）
  for (const req of NEIGHBOR_REQUESTS) {
    if (s.neighbors.requests[req.id] === 'active') {
      s = obtain(s, req.need.resource, req.need.amount);
      const r = act(s, { type: 'helpRequest', requestId: req.id });
      if (!r.error) { s = r.state; helped++; }
    }
  }
  // 只在扣除安全库存后仍有富余时送礼
  for (const def of NEIGHBORS) {
    if (s.neighbors.met.includes(def.id) && s.neighbors.giftLeft[def.id] > 0) {
      const g = def.gift;
      const free = s.inventory[g.resource] - (s.mealPlan[g.resource] || 0) - (SAFE[g.resource] || 0);
      if (free >= g.amount) {
        const r = act(s, { type: 'gift', neighbor: def.id });
        if (!r.error) s = r.state;
      }
    }
  }
  traded = s.neighbors.traded;
  s = unwrap(act(s, { type: 'mealPreset', mode: 'clear' }));
  for (const [k, q] of Object.entries(suggestMeal(s, 1))) s = unwrap(act(s, { type: 'meal', resource: k, amount: q }));
  s = advanceDay(s).state;
  if ([130, 140, 150, 160, 170, 180].includes(d)) {
    const bonds = NEIGHBORS.map(def => `${def.name}:${s.neighbors.bond[def.id]}`).join(' ');
    console.log(`D${d} ${bonds} | helped${helped} traded${traded} foodDays${getDerived(s).foodDays} hp${s.health}`);
  }
}
console.log('最终求助状态:', Object.entries(s.neighbors.requests).map(([k, v]) => `${k}:${v}`).join(', '));
