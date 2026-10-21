import { createGame, buyCart, startGame, advanceDay, act, getStarterCart, suggestMeal, getForecast, getDerived, getWishes, getCropDuration } from './src/engine.js';
const unwrap = r => { if (r.error) throw new Error(r.error); return r.state; };
let s = unwrap(buyCart(createGame(), getStarterCart(createGame())));
s = unwrap(startGame(s));
for (let d = 1; d <= 180; d++) {
  // 收获成熟的地，然后在空地上播种（循环种土豆 + 饲料草）
  for (let i = 0; i < s.plots.length; i++) {
    const p = s.plots[i];
    if (p.crop && p.progress >= getCropDuration(s, p.crop)) s = unwrap(act(s, { type: 'harvest', plot: i }));
  }
  for (let i = 0; i < s.plots.length; i++) {
    const p = s.plots[i];
    if (!p.crop) {
      const crop = i === 0 ? 'fodder' : 'potatoes';
      s = unwrap(act(s, { type: 'plant', plot: i, crop }));
    }
  }
  // 只做当天吃的蒸土豆，生土豆囤积起来（加工品会腐败，生土豆不会），供冬天
  if (s.inventory.boiledPotato < 2 && s.inventory.potatoes >= 1) {
    const batch = Math.min(s.inventory.potatoes, 2);
    s = unwrap(act(s, { type: 'cook', recipe: 'potato', batch }));
  }
  s = unwrap(act(s, { type: 'mealPreset', mode: 'clear' }));
  const plan = suggestMeal(s, 1);
  for (const [k, q] of Object.entries(plan)) s = unwrap(act(s, { type: 'meal', resource: k, amount: q }));
  const r = advanceDay(s);
  if (r.error) throw new Error(r.error);
  s = r.state;
  if ([1, 30, 31, 60, 61, 90, 91, 120, 121, 150, 151, 180].includes(d)) {
    const w = getForecast(d, 1)[0];
    const wishes = getWishes(s);
    const wd = wishes.filter(x => x.done).length;
    console.log(`D${d} ${w.season} ${w.name} ${w.temperature}°C sun${w.sun} | fuel${s.inventory.fuel} mat${s.inventory.materials} foodDays${getDerived(s).foodDays} hp${s.health} cold${s.coldToday} wishes${wd}/3`);
  }
}
console.log('章节节点:', Object.entries(s.chapter.milestones).filter(([, v]) => v).map(([k]) => k).join(','));
console.log('已听广播数:', Object.keys(s.chapter.heard).length);
