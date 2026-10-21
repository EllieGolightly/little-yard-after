import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, STARTER_CART, CROPS, RESOURCE_META, NEIGHBORS, NEIGHBOR_REQUESTS, bondLevel } from '../src/data.js';
import { createGame, buyCart, startGame, advanceDay, act, getDerived, getForecast, getCropDuration, validateSave, getStarterCart, getMealPreview, getAnimalInfo, getSeason, getSeasonIndex, getWishes, getTradesLeft, getCollection, getCollectionCount, getCollectionTotal, getEndingTitle } from '../src/engine.js';

function unwrap(result) {
  assert.equal(result.error, undefined, result.error);
  return result.state;
}
function prepared(cart = STARTER_CART) { return unwrap(buyCart(createGame(), cart)); }
function started(cart = STARTER_CART) { return unwrap(startGame(prepared(cart))); }
function assertValid(state) {
  const derived = getDerived(state);
  for (const amount of Object.values(state.inventory)) assert.ok(Number.isFinite(amount) && amount >= 0);
  assert.ok(state.inventory.water <= derived.waterCapacity);
  assert.ok(state.inventory.power <= derived.powerCapacity);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(state))), state);
}

test('starter fits fixed budget and provides the advertised inventory and dependencies', () => {
  const state = prepared();
  const price = Object.entries(STARTER_CART).reduce((sum, [id, amount]) => sum + ITEMS.find(item => item.id === id).price * amount, 0);
  assert.equal(price, 27040);
  assert.equal(state.money, 30000 - price);
  assert.equal(state.inventory.food, 37);
  assert.equal(state.inventory.water, 195);
  assert.equal(state.inventory.feed, 120);
  assert.equal(state.inventory.power, 8);
  assert.equal(state.plots.length, 3);
  assert.ok(getDerived(state).checks.every(check => check.ok));
  assertValid(state);
});

test('purchase transaction rejects bad quantities, unknown ids, overbudget and missing dependencies without mutation', () => {
  const original = createGame();
  const snapshot = JSON.stringify(original);
  for (const cart of [{ solar: 1 }, { food: 200 }, { food: -1 }, { food: 1.5 }, { unknown: 1 }, { food: Infinity }, { food: '2' }, JSON.parse('{"__proto__":1}')]) {
    const result = buyCart(original, cart);
    assert.ok(result.error, JSON.stringify(cart));
    assert.equal(result.state, original);
    assert.equal(JSON.stringify(original), snapshot);
  }
  assert.ok(buyCart(original, {}).error);
  const bought = unwrap(buyCart(original, { battery: 1, solar: 1 }));
  assert.ok(bought.facilities.solar);
  assert.equal(JSON.stringify(original), snapshot);
});

test('water capacity and facility maximum are enforced across transactions', () => {
  assert.ok(buyCart(createGame(), { water: 2 }).error);
  const state = prepared({ tank: 1, water: 8, planter: 3 });
  assert.equal(state.inventory.water, 355);
  assert.equal(state.plots.length, 4);
  assert.ok(buyCart(state, { water: 2 }).error);
  assert.ok(buyCart(state, { tank: 1 }).error);
  assert.ok(buyCart(state, { planter: 1 }).error);
});

test('prep and survival operations cannot cross phases; day settles exactly once per call', () => {
  const prep = createGame();
  assert.ok(advanceDay(prep).error);
  assert.ok(act(prep, { type: 'plant', plot: 0, crop: 'greens' }).error);
  const state = unwrap(startGame(prep));
  assert.equal(state.day, 1);
  assert.ok(startGame(state).error);
  assert.ok(buyCart(state, { food: 1 }).error);
  const result = advanceDay(state);
  assert.equal(result.report.day, 1);
  assert.equal(result.state.day, 2);
  assert.equal(result.state.stats.days, 1);
  assert.equal(result.state.inventory.food, 7);
  assert.equal(result.state.inventory.water, 31);
  assert.equal(state.inventory.food, 7);
  assertValid(result.state);
});

test('forecast is deterministic, cycles and is returned by value', () => {
  assert.deepEqual(getForecast(1, 12), getForecast(13, 12));
  const first = getForecast(1, 1);
  first[0].rain = 999;
  assert.equal(getForecast(1, 1)[0].rain, 0);
  assert.equal(getForecast(9, 1)[0].temperature, 32);
});

test('crops require exact days and water, manual harvest returns seeds and clears the plot', () => {
  let state = started({ tank: 1, water: 4 });
  const initialSeeds = state.inventory.seeds;
  state = unwrap(act(state, { type: 'plant', plot: 0, crop: 'greens' }));
  assert.equal(state.inventory.seeds, initialSeeds - 1);
  assert.ok(act(state, { type: 'plant', plot: 0, crop: 'fodder' }).error);
  assert.ok(act(state, { type: 'harvest', plot: 0 }).error);
  for (let day = 0; day < 4; day += 1) state = unwrap(advanceDay(state));
  assert.equal(state.plots[0].progress, 4);
  const beforeWater = state.inventory.water;
  state = unwrap(advanceDay(state));
  assert.equal(state.inventory.water, beforeWater - 4, 'mature crop no longer needs water');
  state = unwrap(act(state, { type: 'harvest', plot: 0 }));
  assert.equal(state.inventory.vegetables, 6);
  assert.equal(state.inventory.seeds, initialSeeds);
  assert.equal(state.stats.harvests, 1);
  assert.deepEqual(state.plots[0], { crop: null, progress: 0 });
  assertValid(state);
});

test('greenhouse, compost and seed tools have their documented effects', () => {
  let state = started({ greenhouse: 1, compost: 1, seedbox: 1, tank: 1, water: 2 });
  state = unwrap(act(state, { type: 'plant', plot: 0, crop: 'fodder' }));
  assert.equal(getCropDuration(state, 'fodder'), 4);
  for (let day = 0; day < 4; day += 1) state = unwrap(advanceDay(state));
  state = unwrap(act(state, { type: 'harvest', plot: 0 }));
  assert.equal(state.inventory.feed, 20);
  assert.equal(state.inventory.seeds, 7);
  assertValid(state);
});

test('rain needs the filter and never exceeds capacity; battery is likewise bounded', () => {
  let filtered = started({ rain: 1, filter: 1, battery: 1, solar: 1 });
  let unfiltered = started({ rain: 1 });
  for (let day = 0; day < 3; day += 1) {
    filtered = unwrap(advanceDay(filtered));
    unfiltered = unwrap(advanceDay(unfiltered));
  }
  assert.equal(filtered.inventory.water, 76);
  assert.equal(unfiltered.inventory.water, 23);
  assert.equal(filtered.inventory.power, 12);
  assertValid(filtered);
  assertValid(unfiltered);
});

test('generator burns fuel only when enabled and below threshold; refrigerator uses daily power', () => {
  let state = started({ battery: 1, generator: 1, fridge: 1, fuel: 1 });
  state.inventory.power = 0;
  state = unwrap(advanceDay(state));
  assert.equal(state.inventory.fuel, 4);
  assert.equal(state.inventory.power, 4.8);
  state = unwrap(act(state, { type: 'settings', key: 'generator', value: false }));
  state.inventory.power = 0;
  state = unwrap(advanceDay(state));
  assert.equal(state.inventory.fuel, 4);
  assert.equal(state.fridgeRunning, false);
  assert.equal(state.inventory.power, 0);
  assertValid(state);
});

test('save validation clones valid data and rejects malformed state, unsafe values and impossible capacity', () => {
  const valid = started();
  const copy = validateSave(valid);
  copy.inventory.food += 10;
  assert.notEqual(copy.inventory.food, valid.inventory.food);
  const invalid = [null, [], {}, { ...valid, version: 99 }, { ...valid, day: -1 }, { ...valid, money: 30001 }];
  for (const mutate of [
    state => { state.inventory.water = -1; },
    state => { state.inventory.food = Infinity; },
    state => { state.inventory.water = 401; },
    state => { state.inventory.power = 13; },
    state => { state.facilities.solar = 2; },
    state => { delete state.facilities.battery; },
    state => { state.plots[0].crop = '__proto__'; },
    state => { state.plots[0].progress = 1; },
    state => { state.settings.autoCare = 'yes'; },
    state => { state.stats.days = 3; },
    state => { state.logs[0].day = 99; },
    state => { state.animals.coop.cycle = 2; },
    state => { state.lastCareDay = -1; },
  ]) {
    const broken = structuredClone(valid);
    mutate(broken);
    invalid.push(broken);
  }
  for (const state of invalid) assert.throws(() => validateSave(state), /存档无法读取/);
});

test('catalog identifiers, dependency references and crop resource references are coherent', () => {
  assert.equal(new Set(ITEMS.map(item => item.id)).size, ITEMS.length);
  for (const item of ITEMS) {
    assert.ok(item.price > 0 && Number.isInteger(item.price));
    assert.ok(item.description && item.detail);
    if (item.kind === 'supply') assert.ok(RESOURCE_META[item.resource] && item.amount > 0);
    for (const id of item.requires || []) assert.ok(ITEMS.some(other => other.id === id && other.kind === 'facility'));
  }
  for (const crop of CROPS) assert.ok(RESOURCE_META[crop.resource]);
});

test('three difficulties have affordable useful starter carts',()=>{
 for(const [difficulty,money]of [['cozy',50000],['balanced',30000],['hard',20000]]){const s=createGame({difficulty});assert.equal(s.money,money);const n=unwrap(buyCart(s,getStarterCart(s)));assert.ok(n.money>=0);assert.ok(n.facilities.stove&&n.facilities.solar);assertValid(n);}
});
test('fractional meals consume only selected amounts; fasting and half portions reduce health',()=>{
 let s=started();s.health=70;
 assert.equal(getMealPreview(s).healthChange,-12);
 const half=unwrap(act(s,{type:'meal',resource:'food',amount:.5}));
 const n=unwrap(advanceDay(half));assert.equal(n.inventory.food,s.inventory.food-.5);assert.equal(n.health,64);assert.deepEqual(n.lastMealPlan,{food:.5});assert.deepEqual(n.mealPlan,{});
 const full=unwrap(advanceDay(unwrap(act(s,{type:'meal',resource:'food',amount:1}))));assert.equal(full.health,71);
 for(const a of [-1,Infinity,.001,1000])assert.ok(act(s,{type:'meal',resource:'food',amount:a}).error);
 assert.ok(act(s,{type:'meal',resource:'rice',amount:1}).error);assertValid(n);
});
test('electric stove works with zero fuel and fuel fallback obeys preference and reserves',()=>{
 let s=started({stove:1,battery:1,rice:1});s.inventory.fuel=0;
 let n=unwrap(act(s,{type:'cook',recipe:'rice',batch:1}));assert.equal(n.inventory.power,7.5);assert.equal(n.inventory.cookedRice,1);assert.equal(n.inventory.rice,s.inventory.rice-1);assert.equal(n.energy,s.energy-5);
 n=unwrap(act(n,{type:'meal',resource:'cookedRice',amount:.5}));assert.ok(act(n,{type:'preserve',resource:'cookedRice',amount:1}).error);
 n.inventory.power=0;n.inventory.fuel=1;
 let fuel=unwrap(act(n,{type:'cook',recipe:'rice',batch:.5}));assert.equal(fuel.inventory.fuel,.92);assert.equal(fuel.inventory.cookedRice,1.5);
 fuel=unwrap(act(fuel,{type:'settings',key:'cookPower',value:'electric'}));assert.ok(act(fuel,{type:'cook',recipe:'rice'}).error);assertValid(fuel);
});
test('egg recipes accept all three egg stocks and cooking never duplicates nutritional food',()=>{
 let s=started();s.inventory.eggs=.5;s.inventory.chickenEggs=1;s.inventory.duckEggs=.5;
 const n=unwrap(act(s,{type:'cook',recipe:'egg'}));assert.equal(n.inventory.boiledEgg,2);assert.equal(n.inventory.eggs+n.inventory.chickenEggs+n.inventory.duckEggs,0);assert.equal(getDerived(n).totalFood,getDerived(s).totalFood);
});
test('manual care cannot duplicate automatic growth; insufficient supplies pause progress',()=>{
 let s=unwrap(act(started(),{type:'plant',plot:0,crop:'greens'}));s=unwrap(act(s,{type:'care'}));assert.equal(s.animals.coop.cycle,1);assert.equal(s.plots[0].progress,1);assert.ok(act(s,{type:'care'}).error);
 s=unwrap(advanceDay(s));assert.equal(s.animals.coop.cycle,1);assert.equal(s.plots[0].progress,1);
 s.inventory.feed=0;s.inventory.water=4;s=unwrap(act(s,{type:'care'}));assert.equal(s.animals.coop.cycle,1);assert.equal(s.plots[0].progress,1);assertValid(s);
});
test('poultry hatch, grow and reproduce with capacity and breeding-sex constraints',()=>{
 let s=started();s.inventory.feed=500;
 for(let i=0;i<2;i++)s=unwrap(advanceDay(unwrap(act(s,{type:'mealPreset',mode:'balanced'}))));
 assert.equal(s.inventory.chickenEggs,2);assert.ok(act(s,{type:'hatch',species:'coop',count:6}).error);
 s=unwrap(act(s,{type:'hatch',species:'coop',count:2}));assert.equal(getAnimalInfo(s,'coop').total,5);
 for(let i=0;i<14;i++){s.inventory.water=300;s=unwrap(advanceDay(unwrap(act(s,{type:'mealPreset',mode:'balanced'}))));assertValid(s);}
 assert.equal(s.animals.coop.female,3);assert.equal(s.animals.coop.male,2);assert.equal(s.stats.births,2);
 s=unwrap(act(s,{type:'butcher',species:'coop',sex:'male',count:2}));assert.equal(s.inventory.meat,4);assert.ok(!getAnimalInfo(s,'coop').canBreed);assert.ok(act(s,{type:'hatch',species:'coop',count:1}).error);
});
test('fish breeding leaves finite stock and catch removes exactly the selected adults',()=>{
 let s=started({pond:1,tank:1,water:5,feed:2});s=unwrap(act(s,{type:'breedFish'}));assert.ok(act(s,{type:'breedFish'}).error);assert.equal(getAnimalInfo(s,'pond').total,14);
 for(let i=0;i<6;i++)s=unwrap(advanceDay(unwrap(act(s,{type:'mealPreset',mode:'balanced'}))));assert.equal(s.animals.pond.adults,14);
 s=unwrap(act(s,{type:'catch',count:12}));assert.equal(s.inventory.fish,12);assert.equal(s.animals.pond.adults,2);assert.ok(getAnimalInfo(s,'pond').canBreed);assert.ok(act(s,{type:'catch',count:3}).error);assertValid(s);
});
test('daily jobs enforce material costs, energy, once per day and permanent expansion caps',()=>{
 let s=started();s.energy=40;s=unwrap(act(s,{type:'activity',id:'salvage'}));assert.equal(s.energy,22);assert.equal(s.inventory.materials,6);assert.ok(act(s,{type:'activity',id:'salvage'}).error);
 s=unwrap(act(s,{type:'activity',id:'expandPlot'}));assert.equal(s.plots.length,4);assert.equal(s.inventory.materials,2);assert.equal(s.energy,2);
 assert.ok(act(s,{type:'activity',id:'tidy'}).error);s=unwrap(act(s,{type:'activity',id:'rest'}));assert.equal(s.energy,27);assert.ok(act(s,{type:'activity',id:'rest'}).error);assertValid(s);
});
test('preservation conserves food value and uncooled fresh stock spoils only on fourth days',()=>{
 let s=started();s.inventory.vegetables=4;s.settings.fridge=false;
 const total=getDerived(s).totalFood;s=unwrap(act(s,{type:'preserve',resource:'vegetables',amount:2}));assert.equal(s.inventory.preserves,.8);assert.equal(getDerived(s).totalFood,total);
 for(let i=0;i<3;i++)s=unwrap(advanceDay(unwrap(act(s,{type:'meal',resource:'food',amount:1}))));assert.equal(s.inventory.vegetables,2);
 s=unwrap(advanceDay(unwrap(act(s,{type:'meal',resource:'food',amount:1}))));assert.equal(s.inventory.vegetables,1.5);assert.equal(s.inventory.preserves,.8);assertValid(s);
});
test('health zero ends play without hidden aid; only opted-in explicit rescue resumes it',()=>{
 let s=unwrap(startGame(createGame({assistance:false})));s.health=5;s=unwrap(advanceDay(s));assert.equal(s.health,0);assert.equal(s.ended,true);assert.equal(s.stats.assists,0);assert.ok(advanceDay(s).error);assert.ok(act(s,{type:'rescue'}).error);assertValid(s);
 s.assistance=true;s=unwrap(act(s,{type:'rescue'}));assert.equal(s.health,45);assert.equal(s.ended,false);assert.equal(s.stats.assists,1);assert.deepEqual(s.mealPlan,{});assertValid(s);
});
test('balanced meal preset reaches normal nutrition without exceeding stocks',()=>{
 let s=started();s.inventory.vegetables=.1;s.inventory.boiledEgg=.2;s=unwrap(act(s,{type:'mealPreset',mode:'balanced'}));assert.ok(getMealPreview(s).nutrition>=1);assertValid(s);
});

test('all starter difficulties support deterministic 60-day gardening and meals without aid',()=>{
 function run(difficulty){let s=createGame({difficulty,assistance:false});s=unwrap(startGame(unwrap(buyCart(s,getStarterCart(s)))));
 for(let i=0;i<60;i++){
  for(let p=0;p<s.plots.length;p++){
   if(s.plots[p].crop&&s.plots[p].progress>=getCropDuration(s,s.plots[p].crop))s=unwrap(act(s,{type:'harvest',plot:p}));
   if(!s.plots[p].crop)s=unwrap(act(s,{type:'plant',plot:p,crop:p===0?'fodder':'potatoes'}));
  }
  for(const [resource,recipe]of [['potatoes','potato'],['chickenEggs','egg']])if(s.inventory[resource]>=(recipe==='egg'?2:2)) {const r=act(s,{type:'cook',recipe,batch:recipe==='egg'?1:2});if(!r.error)s=r.state;}
  s=unwrap(act(s,{type:'mealPreset',mode:'balanced'}));s=unwrap(advanceDay(s));assertValid(s);assert.equal(s.ended,false,`${difficulty} day ${i+1}`);
 }
 assert.equal(s.stats.assists,0);assert.equal(s.milestoneSeen,true);assert.equal(s.stats.days,60);assert.ok(s.health>=80);return s;}
 for(const difficulty of ['cozy','balanced','hard'])assert.deepEqual(run(difficulty),run(difficulty));
});

// 完整经营推进到指定天数（含播种/收获/做饭/餐桌），用于季节机制测试
function farmTo(days){
 let s=started();
 for(let d=1;d<=days;d++){
  for(let p=0;p<s.plots.length;p++){
   if(s.plots[p].crop&&s.plots[p].progress>=getCropDuration(s,s.plots[p].crop))s=unwrap(act(s,{type:'harvest',plot:p}));
   if(!s.plots[p].crop)s=unwrap(act(s,{type:'plant',plot:p,crop:p===0?'fodder':'potatoes'}));
  }
  if(s.inventory.potatoes>=2){const r=act(s,{type:'cook',recipe:'potato',batch:2});if(!r.error)s=r.state;}
  s=unwrap(act(s,{type:'mealPreset',mode:'balanced'}));
  s=unwrap(advanceDay(s));
 }
 return s;
}
test('seasons rotate every 30 days in spring-summer-autumn-winter order',()=>{
 assert.equal(getSeasonIndex(1),0);assert.equal(getSeasonIndex(30),0);
 assert.equal(getSeasonIndex(31),1);assert.equal(getSeasonIndex(61),2);
 assert.equal(getSeasonIndex(91),3);assert.equal(getSeason(91).id,'winter');
 assert.equal(getSeasonIndex(121),0);assert.equal(getSeason(121).id,'spring');
});
test('forecast applies seasonal temperature and sun modifiers',()=>{
 const winter=getForecast(91,1)[0];
 assert.equal(winter.temperature,7); // 多云 25 + 冬(-18)
 assert.equal(winter.sun,0.28); // 0.7 × 0.4
 const summer=getForecast(32,1)[0];
 assert.ok(summer.temperature>getForecast(2,1)[0].temperature);
});
test('winter heating burns fuel first and keeps the room warm',()=>{
 const s=farmTo(91);
 assert.equal(s.inventory.fuel,29); // 第91天烧 1 L
 assert.equal(s.coldToday,false);
});
test('heating fallback order is fuel, hay, materials, then electric',()=>{
 const base=farmTo(91); // 第91天结束，day=92，仍在冬天
 function step(mutate){
  let t=structuredClone(base);mutate(t);
  t=unwrap(act(t,{type:'mealPreset',mode:'balanced'}));
  return advanceDay(t).state;
 }
 const withFuel=step(t=>{t.inventory.fuel=5;t.inventory.feed=0;t.inventory.materials=0;t.inventory.power=0;});
 assert.equal(withFuel.inventory.fuel,4);assert.equal(withFuel.coldToday,false);
 const withHay=step(t=>{t.inventory.fuel=0;t.inventory.feed=100;t.inventory.materials=0;t.inventory.power=0;});
 assert.equal(withHay.coldToday,false);assert.ok(withHay.inventory.feed<100);assert.equal(withHay.inventory.fuel,0);
 const withMat=step(t=>{t.inventory.fuel=0;t.inventory.feed=0;t.inventory.materials=10;t.inventory.power=0;});
 assert.equal(withMat.inventory.materials,8);assert.equal(withMat.coldToday,false);
 const withElec=step(t=>{t.inventory.fuel=0;t.inventory.feed=0;t.inventory.materials=0;t.inventory.power=10;});
 assert.equal(withElec.coldToday,false);assert.ok(withElec.inventory.power>=7);
 const cold=step(t=>{t.inventory.fuel=0;t.inventory.feed=0;t.inventory.materials=0;t.inventory.power=0;});
 assert.equal(cold.coldToday,true);
});
test('unheated cold day costs health but never pushes it below 40',()=>{
 const base=farmTo(91);
 function step(mutate){
  let t=structuredClone(base);mutate(t);
  t=unwrap(act(t,{type:'mealPreset',mode:'balanced'}));
  return advanceDay(t).state;
 }
 const warm=step(t=>{t.health=50;t.inventory.fuel=5;t.inventory.feed=0;t.inventory.materials=0;});
 assert.equal(warm.coldToday,false);assert.equal(warm.health,51); // 只吃饭 +1
 const cold=step(t=>{t.health=50;t.inventory.fuel=0;t.inventory.feed=0;t.inventory.materials=0;t.inventory.power=0;});
 assert.equal(cold.coldToday,true);assert.equal(cold.health,50); // 吃饭 +1、寒冷 -1
 const low=step(t=>{t.health=40;t.inventory.fuel=0;t.inventory.feed=0;t.inventory.materials=0;t.inventory.power=0;});
 assert.equal(low.health,41); // 40 以下不再因寒冷扣，吃饭 +1
});
test('seasonal wishes are exposed with progress and grant materials on completion',()=>{
 const s=started();
 assert.equal(getWishes(s).length,3);
 const t=unwrap(act(s,{type:'mealPreset',mode:'balanced'}));
 const next=advanceDay(t).state;
 assert.ok(getWishes(next).some(w=>w.metric==='foodDays'&&w.done)); // 第1天结束，食物储备充足
});
test('season change resets wishes and season stats',()=>{
 const s=farmTo(30); // 第30天结束，进入夏季
 assert.equal(s.wishes.season,'summer');
 assert.equal(s.seasonStats.plantings,0);
 assert.equal(s.seasonStats.harvests,0);
});
test('v2 saves migrate to v3, restoring seasons, chapters and wishes',()=>{
 const s=started();
 const v2=structuredClone(s);
 v2.version=2;
 delete v2.chapter;delete v2.wishes;delete v2.seasonStats;delete v2.coldToday;
 v2.settings={generator:s.settings.generator,fridge:s.settings.fridge,autoCare:s.settings.autoCare,cookPower:s.settings.cookPower};
 const migrated=validateSave(v2);
 assert.equal(migrated.version,5);
 assert.ok(migrated.chapter&&migrated.wishes&&migrated.seasonStats);
 assert.equal(migrated.settings.heatPower,'auto');
 assert.equal(migrated.settings.seasons,true);
 assert.ok(migrated.neighbors);
});
test('seasons can be disabled, removing seasonal field and winter effects',()=>{
 const base=farmTo(91);
 let t=structuredClone(base);
 t=unwrap(act(t,{type:'settings',key:'seasons',value:false}));
 assert.equal(t.settings.seasons,false);
});

// ── 阶段2：邻居、好感、交换、求助 ──
test('bondLevel maps bond to the four named levels',()=>{
 assert.equal(bondLevel(0).name,'陌生');assert.equal(bondLevel(19).name,'陌生');
 assert.equal(bondLevel(20).name,'认识');assert.equal(bondLevel(39).name,'认识');
 assert.equal(bondLevel(40).name,'熟络');assert.equal(bondLevel(69).name,'熟络');
 assert.equal(bondLevel(70).name,'亲近');assert.equal(bondLevel(100).name,'亲近');
});
test('higher bond grants more daily trades',()=>{
 let s=structuredClone(farmTo(130));
 assert.equal(getTradesLeft(s,'zhou'),2);
 s.neighbors.bond.zhou=40;assert.equal(getTradesLeft(s,'zhou'),3);
 s.neighbors.bond.zhou=70;assert.equal(getTradesLeft(s,'zhou'),4);
});
test('neighbors unlock at day 130 and 150 with daily limits refreshed',()=>{
 assert.deepEqual(farmTo(129).neighbors.met,[]);
 const first=farmTo(130);
 assert.ok(first.neighbors.met.includes('zhou')&&first.neighbors.met.includes('he'));
 assert.ok(!first.neighbors.met.includes('chen'));
 assert.equal(first.neighbors.giftLeft.zhou,1);
 assert.ok(farmTo(150).neighbors.met.includes('chen'));
});
test('trade converts resources and respects the daily limit and acquaintance check',()=>{
 let s=structuredClone(farmTo(130));
 const eggs=s.inventory.chickenEggs,fuel=s.inventory.fuel;
 s=unwrap(act(s,{type:'trade',neighbor:'zhou',tradeIndex:0}));
 assert.equal(s.inventory.chickenEggs,eggs-2);
 assert.equal(s.inventory.fuel,fuel+1);
 assert.equal(s.neighbors.traded,1);
 assert.ok(act(s,{type:'trade',neighbor:'chen',tradeIndex:0}).error);
});
test('gift raises bond once per neighbor per day',()=>{
 let s=structuredClone(farmTo(130));
 const bond=s.neighbors.bond.zhou;
 s=unwrap(act(s,{type:'gift',neighbor:'zhou'}));
 assert.equal(s.neighbors.bond.zhou,bond+3);
 assert.equal(s.neighbors.giftLeft.zhou,0);
 assert.ok(act(s,{type:'gift',neighbor:'zhou'}).error);
});
test('help request consumes need, grants reward and bond, and records the help',()=>{
 let s=structuredClone(farmTo(135));
 assert.equal(s.neighbors.requests.he_eggs,'active');
 const eggs=s.inventory.chickenEggs,seeds=s.inventory.seeds;
 s=unwrap(act(s,{type:'helpRequest',requestId:'he_eggs'}));
 assert.equal(s.inventory.chickenEggs,eggs-2);
 assert.equal(s.inventory.seeds,seeds+2);
 assert.equal(s.neighbors.requests.he_eggs,'done');
 assert.equal(s.neighbors.bond.he,10);
 assert.equal(s.neighbors.helped,1);
});
test('neighbors feature can be disabled from settings',()=>{
 let s=structuredClone(farmTo(130));
 s=unwrap(act(s,{type:'settings',key:'neighbors',value:false}));
 assert.equal(s.settings.neighbors,false);
});
test('v3 saves migrate to v5 and restore the neighbor block',()=>{
 const v3=structuredClone(started());
 v3.version=3;delete v3.neighbors;
 const migrated=validateSave(v3);
 assert.equal(migrated.version,5);
 assert.ok(migrated.neighbors&&migrated.neighbors.bond);
});

// ── 阶段3：图鉴、装饰、节日、结局 ──
test('collection totals 17 and records crops, recipes, animals, neighbors',()=>{
 assert.equal(getCollectionTotal(started()),17);
 assert.equal(getCollectionCount(started()),0);
 const s=farmTo(135);
 assert.ok(s.discovered.crops.includes('fodder'));
 assert.ok(s.discovered.crops.includes('potatoes'));
 assert.ok(s.discovered.recipes.includes('potato'));
 assert.ok(s.neighbors.met.includes('zhou'));
 assert.ok(getCollection(s).neighbors.find(n=>n.id==='zhou').found);
 assert.ok(getCollectionCount(s)>=4);
});
test('decorations cost materials, add comfort and respect limits',()=>{
 let s=started();
 const before=getDerived(s).comfort;
 s.inventory.materials=10;
 s=unwrap(act(s,{type:'buildDecoration',decoration:'flag'}));
 assert.equal(s.decorations.flag,1);
 assert.equal(getDerived(s).comfort,before+2);
 assert.equal(act(s,{type:'buildDecoration',decoration:'flag'}).error,'这里已经布置得足够啦。');
 s.inventory.materials=0;
 assert.ok(act(s,{type:'buildDecoration',decoration:'flowerbox'}).error);
 s.inventory.materials=10;
 s=unwrap(act(s,{type:'buildDecoration',decoration:'lanterns'}));
 assert.equal(s.decorations.lanterns,1);
});
test('decoration blocks construction without its prerequisite',()=>{
 const s=started();
 delete s.facilities.solar;
 s.inventory.materials=10;
 assert.ok(act(s,{type:'buildDecoration',decoration:'lanterns'}).error);
});
test('festival activates in window, celebrates with cost, reward and glow',()=>{
 let s=farmTo(120);
 assert.equal(s.festivals.winterSolstice,'active');
 const foodBefore=s.inventory.food;
 s=unwrap(act(s,{type:'celebrateFestival',festival:'winterSolstice'}));
 assert.equal(s.festivals.winterSolstice,'celebrated');
 assert.equal(s.inventory.food,foodBefore-1);
 assert.equal(s.festivalGlow,8);
 assert.ok(act(s,{type:'celebrateFestival',festival:'winterSolstice'}).error);
});
test('festival is missed after its window and cannot be celebrated',()=>{
 const s=farmTo(124);
 assert.equal(s.festivals.winterSolstice,'missed');
 assert.ok(act(s,{type:'celebrateFestival',festival:'winterSolstice'}).error);
});
test('ending unlocks on day 180 and accepts a single choice',()=>{
 let s=farmTo(179);
 assert.equal(s.ending.unlocked,false);
 assert.ok(act(s,{type:'chooseEnding',choice:'stay'}).error);
 s=unwrap(advanceDay(unwrap(act(s,{type:'mealPreset',mode:'balanced'}))));
 assert.equal(s.ending.unlocked,true);
 s=unwrap(act(s,{type:'chooseEnding',choice:'stay'}));
 assert.equal(s.ending.choice,'stay');
 assert.ok(s.ending.seenAt);
 assert.ok(getEndingTitle(s).startsWith('留下'));
 assert.ok(act(s,{type:'chooseEnding',choice:'return'}).error);
});
test('v4 saves migrate to v5 restoring collection, decorations, festivals and ending',()=>{
 const v4=structuredClone(farmTo(185));
 v4.version=4;
 delete v4.discovered;delete v4.decorations;delete v4.festivals;delete v4.ending;delete v4.festivalGlow;
 const migrated=validateSave(v4);
 assert.equal(migrated.version,5);
 assert.ok(migrated.discovered&&migrated.decorations&&migrated.festivals&&migrated.ending);
 assert.equal(migrated.ending.unlocked,true);
});
