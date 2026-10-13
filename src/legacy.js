// Frozen version-1 reader. Never advances or modifies an old save in place.
import { ITEMS, CROPS, RESOURCE_META } from './data.js';
const resourceKeys = ['food','water','feed','fuel','seeds','vegetables','eggs','fish','power'];
const itemById=Object.fromEntries(ITEMS.map(i=>[i.id,i]));
const cropById=Object.fromEntries(CROPS.map(c=>[c.id,c]));
const animalRules={coop:{days:2},ducks:{days:3},pond:{days:7}};
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
const has=(s,id)=>Boolean(s.facilities[id]);
const round=n=>Math.round(n*10)/10;
const getCropDuration=(s,id)=>Math.max(2,cropById[id].days-(has(s,'greenhouse')?1:0));
function createGame() {
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

export function validateLegacy(raw) {
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
  const derived = {waterCapacity:80+(has(next,'tank')?320:0), powerCapacity:has(next,'battery')?12:0};
  if (next.inventory.water > derived.waterCapacity || next.inventory.power > derived.powerCapacity) bad('物资超过储存容量。');
  return next;
}
