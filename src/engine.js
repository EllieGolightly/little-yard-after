import { ITEMS, CROPS, RESOURCE_META, WEATHER } from './data.js';

const itemById = Object.fromEntries(ITEMS.map(item => [item.id, item]));
const cropById = Object.fromEntries(CROPS.map(crop => [crop.id, crop]));
const resourceKeys = Object.keys(RESOURCE_META);
const fresh = ['vegetables', 'eggs', 'fish'];
const animalRules = {
  coop: { name: '母鸡', feed: 2, water: 3, days: 2, amount: 2, resource: 'eggs' },
  ducks: { name: '鸭子', feed: 3, water: 4, days: 3, amount: 3, resource: 'eggs' },
  pond: { name: '鱼池', feed: 1, water: 3, days: 7, amount: 5, resource: 'fish' },
};
const clone = value => structuredClone(value);
const round = value => Math.round(value * 10) / 10;
const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const has = (state, id) => (state.facilities[id] || 0) > 0;
const fail = (state, error) => ({ state, error });
const edible = state => state.inventory.food + fresh.reduce((sum, key) => sum + state.inventory[key], 0);
const addLog = (state, title, text, kind = 'note') => {
  state.logs.unshift({ day: state.day, title, text, kind });
  state.logs = state.logs.slice(0, 120);
};

export function createGame() {
  return {
    version: 1, phase: 'prep', day: 0, money: 30000,
    inventory: { food: 7, water: 35, feed: 0, fuel: 0, seeds: 6, vegetables: 0, eggs: 0, fish: 0, power: 0 },
    facilities: {}, plots: [{ crop: null, progress: 0 }],
    settings: { generator: true, fridge: true, autoCare: true },
    livestock: { coop: 0, ducks: 0, pond: 0 },
    logs: [{ day: 0, title: '小院的钥匙', text: '一座带小院的房子，三万元预算，还有重新安排生活的时间。家中已有 7 份食物、35 L 水、6 袋种子和一块种植地。', kind: 'story' }],
    stats: { harvests: 0, assists: 0, days: 0 },
    lastCookDay: null, lastCareDay: null, mealBonus: 0,
    fridgeRunning: false, lightsOn: false, milestoneSeen: false,
  };
}

export function getForecast(day, count = 3) {
  const start = Number.isFinite(day) ? Math.max(1, Math.floor(day)) : 1;
  const length = Number.isFinite(count) ? Math.max(0, Math.min(90, Math.floor(count))) : 3;
  return Array.from({ length }, (_, index) => ({ ...WEATHER[(start - 1 + index) % WEATHER.length] }));
}

export function getCropDuration(state, crop) {
  const definition = typeof crop === 'string' ? cropById[crop] : crop;
  return definition ? Math.max(2, definition.days - (has(state, 'greenhouse') ? 1 : 0)) : 0;
}

export function getDerived(state) {
  const weather = getForecast(state.day || 1, 1)[0];
  const personalWater = weather.temperature >= 30 && !has(state, 'insulation') ? 6 : 4;
  const cropWater = state.plots.reduce((sum, plot) => {
    const crop = cropById[plot.crop];
    return sum + (crop && plot.progress < getCropDuration(state, crop) ? crop.water : 0);
  }, 0);
  const animals = Object.entries(animalRules).filter(([id]) => has(state, id));
  const animalWater = animals.reduce((sum, [, rule]) => sum + rule.water, 0);
  const feed = animals.reduce((sum, [, rule]) => sum + rule.feed, 0);
  const careWater = state.lastCareDay === state.day ? 0 : cropWater + animalWater;
  const dailyWater = personalWater + (state.settings.autoCare ? careWater : 0);
  const source = (has(state, 'rain') && has(state, 'filter')) || (has(state, 'well') && has(state, 'filter'));
  let comfort = 35;
  for (const [id, points] of Object.entries({ books: 8, bed: 10, radio: 5, insulation: 7, rug: 6, stove: 4 })) {
    if (has(state, id)) comfort += points;
  }
  if (has(state, 'lamp') && (state.lightsOn || state.inventory.power >= 0.2)) comfort += 5;
  if (state.mealBonus > 0) comfort += 10;
  if (edible(state) >= 7) comfort += 5;
  if (state.inventory.water >= 28) comfort += 5;
  return {
    waterCapacity: 80 + (has(state, 'tank') ? 320 : 0),
    powerCapacity: has(state, 'battery') ? 12 : 0,
    foodDays: Math.floor(edible(state)), waterDays: Math.floor(state.inventory.water / Math.max(1, dailyWater)),
    comfort: Math.min(100, comfort), plots: 1 + (state.facilities.planter || 0),
    dailyNeeds: { water: dailyWater, food: 1, feed: state.settings.autoCare && state.lastCareDay !== state.day ? feed : 0, power: round((has(state, 'fridge') && state.settings.fridge ? 1.2 : 0) + (has(state, 'lamp') ? 0.2 : 0)), personalWater, careWater },
    cropWater, animalWater, totalFood: edible(state),
    checks: [
      { label: '一周口粮', ok: edible(state) >= 7, hint: `目前共有 ${Math.floor(edible(state))} 份可食用储备，每天消耗 1 份。` },
      { label: '储水缓冲', ok: state.inventory.water >= 40, hint: `目前有 ${state.inventory.water} L 水；个人每天需要 4–6 L，种植养殖另计。` },
      { label: '持续水源', ok: source, hint: '集雨器 + 净水器，或浅井 + 净水器，可以持续补水。' },
      { label: '长期供电', ok: has(state, 'battery') && (has(state, 'solar') || (has(state, 'generator') && state.inventory.fuel > 0)), hint: '蓄电池搭配太阳能，或有燃料的发电机。' },
      { label: '种植准备', ok: state.inventory.seeds > 0, hint: '每次播种耗 1 袋种子，收获会返还种子。' },
      { label: '动物口粮', ok: feed === 0 || state.inventory.feed >= feed * 7, hint: feed ? `动物每天需要 ${feed} 份饲料；当前可用 ${Math.floor(state.inventory.feed / feed)} 天。` : '还没有养殖设施，可以以后再尝试另一种布置。' },
    ],
  };
}

export function buyCart(state, cart) {
  if (state.phase !== 'prep') return fail(state, '采购阶段已经结束，宅家后不能再从商店购买。');
  if (!cart || typeof cart !== 'object' || Array.isArray(cart)) return fail(state, '购物车格式不正确。');
  const entries = Object.entries(cart);
  if (!entries.some(([, quantity]) => quantity > 0)) return fail(state, '先选几样想带回家的东西吧。');
  let cost = 0;
  const next = clone(state);
  for (const [id, quantity] of entries) {
    if (!own(itemById, id) || !Number.isSafeInteger(quantity) || quantity < 0 || quantity > 10000) return fail(state, '购物车里有无法识别的商品或数量。');
    const item = itemById[id];
    cost += item.price * quantity;
    if (item.kind === 'facility') {
      const amount = (next.facilities[id] || 0) + quantity;
      if (amount > item.max) return fail(state, `${item.name}最多可以拥有 ${item.max} 件。`);
      if (amount) next.facilities[id] = amount;
    }
  }
  if (cost > state.money) return fail(state, `预算还差 ¥${cost - state.money}，调整一下购物车吧。`);
  for (const [id, quantity] of entries) {
    if (!quantity) continue;
    const item = itemById[id];
    for (const required of item.requires || []) {
      if (!has(next, required)) return fail(state, `${item.name}需要搭配${itemById[required].name}，可以一起购买。`);
    }
    if (item.kind === 'supply') next.inventory[item.resource] += item.amount * quantity;
    if (id === 'battery') next.inventory.power = 8;
  }
  if (next.inventory.water > getDerived(next).waterCapacity) return fail(state, `购买后将有 ${next.inventory.water} L 水，超过 ${getDerived(next).waterCapacity} L 容量；减少饮用水或加购大储水箱。`);
  while (next.plots.length < 1 + (next.facilities.planter || 0)) next.plots.push({ crop: null, progress: 0 });
  next.money -= cost;
  const count = entries.reduce((sum, [, quantity]) => sum + quantity, 0);
  const message = `${count} 件物资已送到家，花费 ¥${cost}。`;
  addLog(next, '又安心了一些', message, 'purchase');
  return { state: next, message };
}

export function startGame(state) {
  if (state.phase !== 'prep') return fail(state, '小院生活已经开始了。');
  const next = clone(state);
  next.phase = 'survival';
  next.day = 1;
  addLog(next, '门关上，日子开始', '城里的供水供电停了下来。院门内，是你亲手准备的小世界。今天起每天结算一日生活；种植与养殖按设置自动照料，成熟的作物需要亲手收获。', 'story');
  return { state: next, message: '欢迎回家。第一天，慢慢来。' };
}

function care(state, events) {
  if (state.lastCareDay === state.day) return;
  const reservedWater = getDerived(state).dailyNeeds.personalWater;
  for (const [id, rule] of Object.entries(animalRules)) {
    if (!has(state, id)) continue;
    if (state.inventory.feed < rule.feed || state.inventory.water - reservedWater < rule.water) {
      events.push(`${rule.name}的水或饲料不足，今天暂停产出，进度保留。`);
      continue;
    }
    state.inventory.feed -= rule.feed;
    state.inventory.water -= rule.water;
    state.livestock[id] += 1;
    if (state.livestock[id] >= rule.days) {
      state.livestock[id] -= rule.days;
      state.inventory[rule.resource] += rule.amount;
      events.push(`${rule.name}送来了 ${rule.amount} 份${RESOURCE_META[rule.resource].name}。`);
    }
  }
  state.plots.forEach((plot, index) => {
    const crop = cropById[plot.crop];
    if (!crop || plot.progress >= getCropDuration(state, crop)) return;
    if (state.inventory.water - reservedWater < crop.water) {
      events.push(`第 ${index + 1} 块地暂时缺水，${crop.name}生长暂停，进度保留。`);
      return;
    }
    state.inventory.water -= crop.water;
    plot.progress += 1;
    if (plot.progress === getCropDuration(state, crop)) events.push(`第 ${index + 1} 块地的${crop.name}成熟了，随时可以收获。`);
  });
  state.lastCareDay = state.day;
}

export function act(state, action) {
  if (state.phase !== 'survival') return fail(state, '等开始宅家生活后，再安排院子里的事情吧。');
  if (!action || typeof action !== 'object') return fail(state, '这个操作暂时无法识别。');
  const next = clone(state);
  let message;
  if (action.type === 'settings') {
    if (!['generator', 'fridge', 'autoCare'].includes(action.key) || typeof action.value !== 'boolean') return fail(state, '设置内容不正确。');
    next.settings[action.key] = action.value;
    return { state: next, message: '生活安排已保存。' };
  }
  if (action.type === 'plant' || action.type === 'harvest') {
    if (!Number.isInteger(action.plot) || action.plot < 0 || action.plot >= state.plots.length) return fail(state, '没有找到这块种植地。');
    const plot = next.plots[action.plot];
    if (action.type === 'plant') {
      if (!own(cropById, action.crop)) return fail(state, '没有这种作物。');
      if (plot.crop) return fail(state, '这块地已经种了东西，等收获之后再播种吧。');
      const crop = cropById[action.crop];
      if (next.inventory.seeds < crop.seedCost) return fail(state, '种子不足，收获其他作物后会返还种子。');
      next.inventory.seeds -= crop.seedCost;
      plot.crop = crop.id;
      plot.progress = 0;
      message = `第 ${action.plot + 1} 块地种下了${crop.name}，照料 ${getCropDuration(next, crop)} 天后成熟。`;
    } else {
      const crop = cropById[plot.crop];
      if (!crop) return fail(state, '这块地还没有种东西。');
      if (plot.progress < getCropDuration(next, crop)) return fail(state, `${crop.name}还需要 ${getCropDuration(next, crop) - plot.progress} 天照料。`);
      const amount = crop.yield + (has(next, 'compost') ? 2 : 0);
      const seeds = 1 + (has(next, 'seedbox') ? 1 : 0);
      next.inventory[crop.resource] += amount;
      next.inventory.seeds += seeds;
      next.stats.harvests += 1;
      next.plots[action.plot] = { crop: null, progress: 0 };
      message = `收获${crop.name}：${amount} 份${RESOURCE_META[crop.resource].name}，并留下 ${seeds} 袋种子。`;
    }
  } else if (action.type === 'cook') {
    if (!has(next, 'stove')) return fail(state, '需要先有一座小院灶台。');
    if (next.lastCookDay === next.day) return fail(state, '今天已经做过一顿饭了，明天再开火吧。');
    if (next.inventory.vegetables < 2 || next.inventory.eggs + next.inventory.fish < 1 || next.inventory.fuel < 1) return fail(state, '做饭需要 2 份蔬菜、1 份蛋或鱼，以及 1 L 燃料。');
    next.inventory.vegetables -= 2;
    next.inventory[next.inventory.eggs >= 1 ? 'eggs' : 'fish'] -= 1;
    next.inventory.fuel -= 1;
    next.inventory.food += 6;
    next.mealBonus = 3;
    next.lastCookDay = next.day;
    message = '灶台咕嘟作响。做好了 6 份耐储熟食，暖意会陪伴接下来的 3 天。';
  } else if (action.type === 'care') {
    if (next.lastCareDay === next.day) return fail(state, '今天已经照料过小院了，明天再来。');
    const events = [];
    care(next, events);
    message = events.length ? `今天的小院照料好了。${events.join('')}` : '给作物浇水，也检查了动物的食水，今天的小院照料好了。';
  } else return fail(state, '这个操作暂时无法识别。');
  addLog(next, action.type === 'harvest' ? '把收获带回屋里' : action.type === 'cook' ? '今天好好吃饭' : '小院里的小事', message, action.type);
  return { state: next, message };
}

const dayStories = [
  '你把门口最后一个纸箱拆开，屋子里开始有了自己的秩序。',
  '外面的街道比往常安静。你给窗边的杯子续上水，日子还长。',
  '雨滴落在屋檐上。原来听雨，也可以是一件很踏实的事。',
  '午后的光照在地板上，你没有赶时间，慢慢收拾了一角屋子。',
  '翻了几页旧书，记起以前总觉得没有空。今天恰好有空。',
  '雨下得很认真。屋里干燥而安静，你坐了一会儿，什么也没做。',
  '在本子上划去又一天。小院里的生活，开始有了熟悉的节奏。',
  '晚霞落在院墙上。今天也有一些很小、但值得记下的事情。',
  '午后有点热，你把事情留到傍晚，给自己留了一个长长的午休。',
  '空气里有泥土的气息。你站在门廊下，等这一阵雨过去。',
  '今天没有发生大事。这样的普通一天，也很好。',
  '你在窗边吃完今天的饭，远处渐渐暗下来。明天还会继续。',
];

/** Settlement order: weather sources → personal emergency reserve → power → care → daily meal/water → perishables. */
export function advanceDay(state) {
  if (state.phase !== 'survival') return fail(state, '先完成采购，开始宅家生活吧。');
  const next = clone(state);
  const day = next.day;
  const weather = getForecast(day, 1)[0];
  const events = [];
  const before = { ...next.inventory };
  const derived = getDerived(next);
  const collected = has(next, 'filter') ? (has(next, 'rain') ? weather.rain * 4 : 0) + (has(next, 'well') ? 12 : 0) : 0;
  if (collected > 0) {
    const stored = Math.min(collected, derived.waterCapacity - next.inventory.water);
    next.inventory.water += stored;
    if (stored) events.push(`补充 ${stored} L 清洁水${collected > stored ? '，多余的水从溢流口流走了' : ''}。`);
  }
  if (has(next, 'solar') && has(next, 'battery')) next.inventory.power = round(Math.min(derived.powerCapacity, next.inventory.power + 8 * weather.sun));
  let assisted = false;
  if (next.inventory.water < derived.dailyNeeds.personalWater) {
    next.inventory.water = Math.min(derived.waterCapacity, next.inventory.water + 28);
    assisted = true;
    events.push('应急援助送来 28 L 清洁水，已记入援助次数。');
  }
  if (has(next, 'generator') && next.settings.generator && next.inventory.power < 3 && next.inventory.fuel >= 1) {
    next.inventory.fuel -= 1;
    next.inventory.power = round(Math.min(derived.powerCapacity, next.inventory.power + 6));
    events.push('备用发电机消耗 1 L 燃料，发电 6 kWh。');
  }
  next.fridgeRunning = has(next, 'fridge') && next.settings.fridge && next.inventory.power >= 1.2;
  if (next.fridgeRunning) next.inventory.power = round(next.inventory.power - 1.2);
  else if (has(next, 'fridge') && next.settings.fridge) events.push('电量不足，冰箱今天暂停保鲜。');
  next.lightsOn = has(next, 'lamp') && next.inventory.power >= 0.2;
  if (next.lightsOn) next.inventory.power = round(next.inventory.power - 0.2);
  if (next.settings.autoCare) care(next, events);
  if (edible(next) < 1) {
    next.inventory.food += 7;
    assisted = true;
    events.push('应急援助送来 7 份食物，已记入援助次数。');
  }
  if (assisted) next.stats.assists += 1;
  next.inventory.water -= derived.dailyNeeds.personalWater;
  const meal = [...fresh, 'food'].find(key => next.inventory[key] >= 1);
  next.inventory[meal] -= 1;
  if (!next.fridgeRunning && day % 4 === 0) {
    for (const key of fresh) {
      if (next.inventory[key] < 1) continue;
      const loss = Math.max(1, Math.floor(next.inventory[key] * 0.25));
      next.inventory[key] -= loss;
      events.push(`未保鲜的${RESOURCE_META[key].name}损耗 ${loss} 份。`);
    }
  }
  if (has(next, 'radio') && day % 5 === 0) events.push('收音机传来社区播报：“雨水系统可以继续使用，大家照顾好自己。明天同一时间再见。”');
  next.stats.days += 1;
  next.mealBonus = Math.max(0, next.mealBonus - 1);
  const milestone = day === 30 && !next.milestoneSeen;
  if (milestone) {
    next.milestoneSeen = true;
    events.push(`小院已经陪你度过 30 天，共收获 ${next.stats.harvests} 次、使用 ${next.stats.assists} 次应急援助。故事没有结束，明天仍然可以继续生活。`);
  }
  const title = milestone ? '第三十天，家已经有了自己的节奏' : `第 ${day} 天 · ${weather.name}`;
  const text = dayStories[(day - 1) % dayStories.length];
  addLog(next, title, `${text}${events.length ? '\n' + events.join('\n') : ''}`, milestone ? 'milestone' : assisted ? 'assistance' : 'day');
  const changes = Object.fromEntries(resourceKeys.map(key => [key, round(next.inventory[key] - before[key])]));
  next.day += 1;
  return { state: next, message: milestone ? '30 天的小院生活完成了。你可以继续，慢慢把日子过下去。' : `第 ${day} 天结束了，明天见。`, report: { day, weather, title, text, events, changes, milestone, assisted, meal: RESOURCE_META[meal].name } };
}

export function validateSave(raw) {
  const bad = message => { throw new Error(`存档无法读取：${message}`); };
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const integer = (value, min, max = 1000000000) => Number.isSafeInteger(value) && value >= min && value <= max;
  if (!object(raw)) bad('文件中没有有效的游戏数据。');
  if (raw.version !== 1) bad('存档版本不兼容。');
  if (!['prep', 'survival'].includes(raw.phase)) bad('游戏阶段不正确。');
  if (!integer(raw.day, raw.phase === 'prep' ? 0 : 1, raw.phase === 'prep' ? 0 : 1000000)) bad('日期不正确。');
  if (!integer(raw.money, 0, 30000)) bad('预算不正确。');
  if (!object(raw.inventory)) bad('缺少物资清单。');
  const next = createGame();
  next.phase = raw.phase;
  next.day = raw.day;
  next.money = raw.money;
  for (const key of resourceKeys) {
    const value = raw.inventory[key];
    if (!Number.isFinite(value) || value < 0 || value > 1000000000 || (key !== 'power' && !Number.isSafeInteger(value))) bad(`${RESOURCE_META[key].name}数量不正确。`);
    next.inventory[key] = key === 'power' ? round(value) : value;
  }
  if (!object(raw.facilities)) bad('缺少设施清单。');
  next.facilities = {};
  for (const [id, amount] of Object.entries(raw.facilities)) {
    const item = own(itemById, id) ? itemById[id] : null;
    if (!item || item.kind !== 'facility' || !integer(amount, 0, item.max)) bad('设施或设施数量不正确。');
    if (amount) next.facilities[id] = amount;
  }
  for (const [id, amount] of Object.entries(next.facilities)) {
    if (amount && (itemById[id].requires || []).some(required => !has(next, required))) bad(`${itemById[id].name}缺少配套设施。`);
  }
  if (!Array.isArray(raw.plots) || raw.plots.length !== 1 + (next.facilities.planter || 0)) bad('种植地数量不正确。');
  next.plots = raw.plots.map(plot => {
    if (!object(plot) || !(plot.crop === null || own(cropById, plot.crop))) bad('种植信息不正确。');
    if (!integer(plot.progress, 0, plot.crop ? getCropDuration(next, plot.crop) : 0)) bad('作物进度不正确。');
    return { crop: plot.crop, progress: plot.progress };
  });
  if (!object(raw.settings)) bad('缺少生活安排。');
  for (const key of ['generator', 'fridge', 'autoCare']) {
    if (typeof raw.settings[key] !== 'boolean') bad('生活安排不正确。');
    next.settings[key] = raw.settings[key];
  }
  if (!object(raw.stats) || !integer(raw.stats.days, 0) || !integer(raw.stats.harvests, 0) || !integer(raw.stats.assists, 0) || raw.stats.assists > raw.stats.days || raw.stats.days !== (raw.phase === 'prep' ? 0 : raw.day - 1)) bad('生活记录统计不正确。');
  next.stats = { days: raw.stats.days, harvests: raw.stats.harvests, assists: raw.stats.assists };
  if (!Array.isArray(raw.logs) || raw.logs.length > 120) bad('生活日记不正确。');
  next.logs = raw.logs.map(log => {
    if (!object(log) || !integer(log.day, 0, raw.day) || typeof log.title !== 'string' || log.title.length > 300 || typeof log.text !== 'string' || log.text.length > 12000 || (log.kind !== undefined && (typeof log.kind !== 'string' || log.kind.length > 50))) bad('日记内容不正确。');
    return { day: log.day, title: log.title, text: log.text, ...(log.kind === undefined ? {} : { kind: log.kind }) };
  });
  if (!object(raw.livestock)) bad('缺少养殖进度。');
  for (const [id, rule] of Object.entries(animalRules)) {
    if (!integer(raw.livestock[id], 0, rule.days - 1) || (!has(next, id) && raw.livestock[id] !== 0)) bad('养殖进度不正确。');
    next.livestock[id] = raw.livestock[id];
  }
  for (const key of ['lastCookDay', 'lastCareDay']) {
    if (!(raw[key] === null || (raw.phase === 'survival' && integer(raw[key], 1, raw.day)))) bad('每日操作记录不正确。');
    next[key] = raw[key];
  }
  if (!integer(raw.mealBonus, 0, 3)) bad('烹饪记录不正确。');
  next.mealBonus = raw.mealBonus;
  for (const key of ['fridgeRunning', 'lightsOn', 'milestoneSeen']) {
    if (typeof raw[key] !== 'boolean') bad('设备或阶段记录不正确。');
    next[key] = raw[key];
  }
  const derived = getDerived(next);
  if (next.inventory.water > derived.waterCapacity || next.inventory.power > derived.powerCapacity) bad('物资超过储存容量。');
  return next;
}
