import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, STARTER_CART, CROPS, RESOURCE_META } from '../src/data.js';
import { createGame, buyCart, startGame, advanceDay, act, getDerived, getForecast, getCropDuration, validateSave } from '../src/engine.js';

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
  assert.equal(price, 24480);
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
  assert.equal(result.state.inventory.food, 6);
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

test('manual care is limited to once a day and prevents duplicate automatic growth', () => {
  let state = started({ coop: 1, feed: 2, tank: 1, water: 2 });
  state = unwrap(act(state, { type: 'plant', plot: 0, crop: 'greens' }));
  state = unwrap(act(state, { type: 'care' }));
  assert.equal(state.plots[0].progress, 1);
  assert.equal(state.livestock.coop, 1);
  assert.equal(state.inventory.feed, 58);
  assert.ok(act(state, { type: 'care' }).error);
  state = unwrap(advanceDay(state));
  assert.equal(state.plots[0].progress, 1);
  assert.equal(state.livestock.coop, 1);
  state = unwrap(act(state, { type: 'settings', key: 'autoCare', value: false }));
  const before = structuredClone(state.inventory);
  state = unwrap(advanceDay(state));
  assert.equal(state.plots[0].progress, 1);
  assert.equal(state.inventory.feed, before.feed);
  state = unwrap(act(state, { type: 'care' }));
  assert.equal(state.plots[0].progress, 2);
  assert.equal(state.inventory.eggs, 2);
  assertValid(state);
});

test('without feed or spare water livestock and plants pause safely with progress preserved', () => {
  let state = started({ coop: 1 });
  state = unwrap(act(state, { type: 'plant', plot: 0, crop: 'greens' }));
  state.inventory.water = 4;
  const result = advanceDay(state);
  assert.equal(result.state.inventory.water, 0);
  assert.equal(result.state.plots[0].progress, 0);
  assert.equal(result.state.livestock.coop, 0);
  assert.equal(result.state.stats.assists, 0);
  assert.ok(result.report.events.some(event => event.includes('暂停')));
  assertValid(result.state);
});

test('all animal production cycles produce food at stated intervals and consume stated inputs', () => {
  let state = started({ coop: 1, ducks: 1, pond: 1, feed: 4, tank: 1, water: 8, battery: 1, solar: 1, fridge: 1 });
  const initialFeed = state.inventory.feed;
  let eggsMade = 0;
  let fishMade = 0;
  for (let day = 0; day < 7; day += 1) {
    const result = advanceDay(state);
    eggsMade += result.report.events.filter(event => event.includes('禽蛋')).reduce((sum, event) => sum + Number(event.match(/(\d+) 份/)[1]), 0);
    fishMade += result.report.events.filter(event => event.includes('鲜鱼')).reduce((sum, event) => sum + Number(event.match(/(\d+) 份/)[1]), 0);
    state = result.state;
  }
  assert.equal(initialFeed - state.inventory.feed, 42);
  assert.equal(eggsMade, 12);
  assert.equal(fishMade, 5);
  assert.equal(state.stats.assists, 0);
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

test('fresh food spoilage occurs after meals only on each fourth day without powered refrigeration', () => {
  let warm = started({ vegetables: 4 });
  let cold = started({ vegetables: 4, fridge: 1, battery: 1, solar: 1 });
  for (let day = 0; day < 4; day += 1) {
    warm = unwrap(advanceDay(warm));
    cold = unwrap(advanceDay(cold));
  }
  assert.equal(warm.inventory.vegetables, 15);
  assert.equal(cold.inventory.vegetables, 20);
  assert.equal(warm.inventory.food, 7);
});

test('cooking has exact input/output conservation and cannot run twice on the same day', () => {
  let state = started({ stove: 1, vegetables: 1, eggs: 1, fuel: 1 });
  const initial = structuredClone(state);
  state = unwrap(act(state, { type: 'cook' }));
  assert.equal(state.inventory.vegetables, initial.inventory.vegetables - 2);
  assert.equal(state.inventory.eggs, initial.inventory.eggs - 1);
  assert.equal(state.inventory.fuel, initial.inventory.fuel - 1);
  assert.equal(state.inventory.food, initial.inventory.food + 6);
  assert.equal(state.mealBonus, 3);
  assert.ok(act(state, { type: 'cook' }).error);
  assert.ok(act(started({ vegetables: 1, eggs: 1, fuel: 1 }), { type: 'cook' }).error);
  assert.equal(initial.lastCookDay, null);
  assertValid(state);
});

test('starter supports 36 deterministic days of mixed gardening without assistance and continues after milestone', () => {
  const run = () => {
    let state = started();
    let milestones = 0;
    for (let day = 0; day < 36; day += 1) {
      state.plots.forEach((plot, index) => {
        if (plot.crop && plot.progress >= getCropDuration(state, plot.crop)) state = unwrap(act(state, { type: 'harvest', plot: index }));
        if (!state.plots[index].crop) state = unwrap(act(state, { type: 'plant', plot: index, crop: ['greens', 'potatoes', 'fodder'][index] }));
      });
      const result = advanceDay(state);
      if (result.report.milestone) milestones += 1;
      state = result.state;
      assertValid(state);
    }
    assert.equal(state.day, 37);
    assert.equal(state.stats.days, 36);
    assert.equal(state.stats.assists, 0);
    assert.ok(state.stats.harvests >= 15);
    assert.equal(milestones, 1);
    assert.equal(state.milestoneSeen, true);
    return state;
  };
  assert.deepEqual(run(), run());
});

test('a completely unprepared home remains playable with explicitly recorded aid', () => {
  let state = unwrap(startGame(createGame()));
  for (let day = 0; day < 45; day += 1) {
    state = unwrap(advanceDay(state));
    assertValid(state);
  }
  assert.equal(state.day, 46);
  assert.ok(state.stats.assists > 0);
  assert.ok(state.logs.some(log => log.text.includes('应急援助')));
  assert.ok(state.milestoneSeen);
});

test('save validation clones valid data and rejects malformed state, unsafe values and impossible capacity', () => {
  const valid = started();
  const copy = validateSave(valid);
  copy.inventory.food += 10;
  assert.notEqual(copy.inventory.food, valid.inventory.food);
  const invalid = [null, [], {}, { ...valid, version: 2 }, { ...valid, day: -1 }, { ...valid, money: 30001 }];
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
    state => { state.livestock.coop = 2; },
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
