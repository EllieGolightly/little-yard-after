import { DIFFICULTIES, FOODS, RECIPES, RESOURCE_META, ANIMAL_RULES, ACTIVITIES, ITEMS, SEASON_LENGTH, NEIGHBORS, NEIGHBOR_REQUESTS, bondLevel, DECORATIONS, FESTIVALS, ENDINGS } from './data.js';
import { getMealPreview, getRecipePreview, getAnimalInfo, getObjectives, getDerived, getSeason, getWishes, getCollection, getCollectionCount, getCollectionTotal, getEndingTitle } from './engine.js';
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number(n||0).toLocaleString('zh-CN',{maximumFractionDigits:2});
const sign=n=>`${n>0?'+':''}${num(n)}`;
export function renderWelcome(s){return `<section class="welcome-panel"><div class="eyebrow">序章 · 好好准备</div><h1>这一次，想怎样过日子？</h1><p class="welcome-intro">先平安度过 <b>30 天</b>，再把这里经营成能长久生活的家。<br>采购没有倒计时，准备满意了，再关上院门。</p><div class="difficulty-grid">${DIFFICULTIES.map(d=>`<label class="difficulty-option"><input type="radio" name="difficulty" value="${d.id}" ${d.id==='balanced'?'checked':''}><span class="difficulty-icon">${d.icon}</span><h3>${d.name}</h3><strong>¥${num(d.money)}</strong><p>${d.description}</p></label>`).join('')}</div><label class="aid-choice"><input id="new-assistance" type="checkbox" checked><span><b>保留应急援助</b><small>食水不足时可主动求助，并计入记录。不会替你吃饭，也不会自动抵消挨饿的影响。</small></span></label><div class="welcome-goals"><span>🌱 种下第一季菜</span><span>🍚 好好安排餐桌</span><span>🐣 迎接新的小生命</span></div><button class="primary full" data-action="begin-run">拿上钥匙，开始准备 →</button><p class="fine-print">想接着旧的小院玩？顶部“存档与设置”可以导入旧存档，自动升级。</p></section>`;}
export function renderVitals(s){const m=getMealPreview(s);return `<div class="vitals-strip"><div><span>♡ 健康</span><strong>${num(s.health)}<small> / 100</small></strong><div class="progress"><span style="width:${s.health}%;background:${s.health<35?'#bd8b71':'#9aaa85'}"></span></div><small>长期饮食、饮水和休息的积累</small></div><div><span>ϟ 精力</span><strong>${num(s.energy)}<small> / 100</small></strong><div class="progress"><span style="width:${s.energy}%;background:#c3ac7b"></span></div><small>播种、烹饪、繁育和扩建时使用</small></div><div><span>♧ 今日餐桌</span><strong>${Math.round(m.nutrition*100)}<small>% 食量</small></strong><div class="progress"><span style="width:${Math.min(100,m.nutrition*100)}%;background:#9db4a1"></span></div><small>${m.label} · 正常每日需求为 100%</small></div></div>`;}
export function recipeQuote(s,id,batch=1){const p=getRecipePreview(s,id,batch);if(!p.recipe)return e(p.error);return `<span>${Object.entries(p.recipe.inputs).map(([k,q])=>`${k==='egg'?'鸡鸭蛋':RESOURCE_META[k].name} ${num(q*batch)}`).join(' + ')}</span><span>用电 ${num(p.power)} kWh / 燃料 ${num(p.fuel)} L · 精力 ${num(p.energy)}</span><b class="${p.error?'muted':'positive'}">${p.error?e(p.error):`将用${p.heat.name}，得到 ${num(p.output)} ${RESOURCE_META[p.recipe.output].unit}${RESOURCE_META[p.recipe.output].name}`}</b>`;}
export function renderTable(s){
 const m=getMealPreview(s),ready=Object.keys(FOODS).filter(k=>FOODS[k].ready&&s.inventory[k]>0),raw=Object.keys(FOODS).filter(k=>!FOODS[k].ready&&s.inventory[k]>0),fresh=Object.keys(FOODS).filter(k=>FOODS[k].fresh&&s.inventory[k]>0);
 return `<div class="page-heading"><div class="eyebrow">慢慢吃，好好过</div><h1>今天，想吃点什么？</h1><p>自由选择食物和份量。结束这一天时统一食用，预留在餐桌上的食物不会被做菜挪走。</p></div>${renderVitals(s)}<section class="panel table-panel"><div class="section-heading"><div><span class="eyebrow">你的选择，会成为今天的一部分</span><h2>今日餐桌</h2></div><span class="pill">${m.label}</span></div><div class="meal-tools"><button class="secondary" data-action="meal-preset" data-mode="balanced">帮我搭配</button><button class="secondary" data-action="meal-preset" data-mode="light">省着吃一点</button><button class="secondary" data-action="meal-preset" data-mode="hearty">丰盛一点</button><button class="secondary" data-action="meal-preset" data-mode="yesterday">沿用昨天</button><button class="text-button" data-action="meal-preset" data-mode="clear">清空餐桌</button></div><div class="food-rows">${ready.map(k=>{const f=FOODS[k],r=RESOURCE_META[k];return `<div class="food-row"><span class="food-emoji">${r.icon}</span><div class="food-info"><b>${r.name}</b><small>库存 ${num(s.inventory[k])} ${r.unit} · 每份食量 ${Math.round(f.nutrition*100)}% · ${f.group}</small></div><div class="portion-control"><button data-action="meal-adjust" data-resource="${k}" data-delta="-0.25" aria-label="少吃四分之一份${r.name}">−</button><input type="number" step="0.01" min="0" max="${s.inventory[k]}" value="${s.mealPlan[k]||0}" data-meal="${k}" aria-label="${r.name}食用量"><button data-action="meal-adjust" data-resource="${k}" data-delta="0.25" aria-label="多吃四分之一份${r.name}">+</button></div></div>`}).join('')||'<div class="empty-state">还没有可直接吃的食物。看看下面的厨房，或者在储备不足时申请应急补给。</div>'}</div><div class="meal-preview"><div><span>今天安排的食量</span><strong>${Math.round(m.nutrition*100)}%</strong></div><div><span>饮食对健康的影响</span><strong class="${m.healthChange<0?'used':'positive'}">${sign(m.healthChange)}</strong></div><div><span>今晚可恢复精力</span><strong>+${Math.min(100-s.energy,m.recovery)}</strong></div></div><p class="section-note">可吃半份、四分之一份，也可不吃；输入框支持自定小数份量。吃得过多不会无限提高恢复。健康最多 100，缺水另行扣减健康。</p></section><section class="panel kitchen-panel"><div class="section-heading"><div><span class="eyebrow">把小院的收获，端上自己的桌子</span><h2>两用厨房</h2></div><label class="heat-choice">能源<select data-setting="cookPower" aria-label="灶台能源"><option value="auto" ${s.settings.cookPower==='auto'?'selected':''}>优先用电</option><option value="electric" ${s.settings.cookPower==='electric'?'selected':''}>只用电</option><option value="fuel" ${s.settings.cookPower==='fuel'?'selected':''}>只用燃料</option></select></label></div><div class="kitchen-supply"><span>⚡ 现有电量 ${num(s.inventory.power)} kWh</span><span>🛢 燃料 ${num(s.inventory.fuel)} L</span><span>冰箱每晚需 1.2 kWh</span></div>${!s.facilities.stove?'<p class="soft-note">没有灶台时，可以吃耐储食品、方便食品、零食或蔬菜。已有灶台的旧存档自动升级为两用。</p>':''}<div class="raw-pantry">${raw.map(k=>`<span>${RESOURCE_META[k].icon} ${RESOURCE_META[k].name} <b>${num(s.inventory[k])}</b></span>`).join('')||'<span>生食材用完了，可以等下一次收获。</span>'}</div><div class="recipe-grid">${RECIPES.map(r=>`<article class="recipe-card" data-recipe-card="${r.id}"><div class="recipe-title"><span>${r.icon}</span><div><h3>${r.name}</h3><small>每份成品食量 ${Math.round(FOODS[r.output].nutrition*100)}%</small></div></div><div class="recipe-quote">${recipeQuote(s,r.id)}</div><div class="recipe-actions"><label>做几锅<input type="number" min="0.01" step="0.25" value="1" class="recipe-batch" aria-label="${r.name}烹饪批数" data-recipe="${r.id}"></label><button class="secondary" data-action="cook-recipe" data-recipe="${r.id}" ${!s.facilities.stove||s.ended?'disabled':''}>开始做饭</button></div></article>`).join('')}</div><div class="preserve-box"><div><h3>🫙 给收获多留一点时间</h3><p>将鲜食加工成耐储食品，保留原有食量。每份原料用电 0.4 kWh 或燃料 0.12 L，另需 4 + 原料份数的精力。</p></div><div class="preserve-controls"><select id="preserve-resource" aria-label="要保存的鲜食">${fresh.map(k=>`<option value="${k}">${RESOURCE_META[k].name} · ${num(s.inventory[k])}</option>`).join('')}</select><input id="preserve-amount" aria-label="加工保存份量" type="number" value="1" min="0.01" step="0.25"><button class="secondary" data-action="preserve" ${!fresh.length||!s.facilities.stove?'disabled':''}>加工保存</button></div></div></section>`;
}
export function renderAnimals(s){return `<section class="panel animals-panel" id="animals-section"><div class="section-heading"><div><span class="eyebrow">一点一点，长成热闹的小家庭</span><h2>院子里的小住户</h2></div><span class="pill">饲料 ${num(s.inventory.feed)} 份</span></div><div class="animal-grid">${Object.entries(ANIMAL_RULES).map(([id,r])=>{const a=s.animals[id],info=getAnimalInfo(s,id);if(!s.facilities[id])return `<article class="animal-card unowned"><span>${r.icon}</span><h3>${r.name==='鱼'?'小鱼池':`${r.name}舍`}还空着</h3><p>这一局没有采购，先好好照顾已有的小院。</p></article>`;return `<article class="animal-card" data-animal-card="${id}"><div class="section-heading"><h3>${r.icon} ${id==='pond'?'小鱼池':`${r.name}的小家`}</h3><span class="pill">${info.total} / ${info.capacity} 位</span></div><p class="animal-count">${id==='pond'?`成鱼 ${a.adults} 条`:`母${r.name} ${a.female} · 公${r.name} ${a.male}`}<span>幼崽 ${info.young}${info.eggs?` · 孵化中 ${info.eggs} 枚`:''}</span></p><p class="animal-needs">每日 ${num(info.feed)} 份饲料 · ${num(info.water)} L 水<br>${id==='pond'?'至少保留 2 条成鱼，可继续繁育。':`本轮产蛋 ${a.cycle} / ${r.cycle} 个照料日 · 自家种蛋 ${num(s.inventory[r.egg])} 枚`}</p><div class="animal-batches">${(a.incubating||[]).map(b=>`<span>🥚 ${b.count} 枚 · 出壳还需 ${r.hatch-b.days} 天</span>`).join('')}${a.young.map(b=>`<span>🐣 ${id==='pond'?b.count:b.female+b.male} 只幼崽 · 长大还需 ${r.grow-b.days} 天</span>`).join('')||''}</div>${id==='pond'?`<button class="secondary full" data-action="breed-fish" ${!info.canBreed||info.total+4>info.capacity?'disabled':''}>繁育 4 条鱼苗 · 6 精力</button>`:`<div class="hatch-row"><label>留几枚种蛋<input class="hatch-count" type="number" min="1" step="1" value="2" aria-label="${r.name}种蛋孵化数量"></label><button class="secondary" data-action="hatch" data-species="${id}" ${!info.canBreed||s.inventory[r.egg]<1||info.total>=info.capacity?'disabled':''}>孵化 · 5 精力</button></div><p class="section-note">自家种蛋才能孵化；${r.hatch} 天出壳，${r.grow} 天长大。商店蛋可用来做饭。</p>`}<div class="animal-harvest"><span>${id==='pond'?'捕捞成鱼':'获得禽肉'}</span>${id!=='pond'?`<select class="animal-sex" aria-label="${r.name}的处理对象"><option value="female">母${r.name}（${a.female}）</option><option value="male">公${r.name}（${a.male}）</option></select>`:''}<input class="animal-quantity" type="number" min="1" step="1" value="1" aria-label="${r.name}的处理数量"><button class="text-button" data-action="animal-harvest" data-species="${id}">选择</button></div><p class="section-note">处理会减少活体数量。可以留种、扩大种群，也可以获得食材。</p></article>`}).join('')}</div><div class="toggle-row"><label for="care-setting">每天自动浇水与喂养<small>照料成熟与繁育进度；资源不足时保留进度，不会随机死亡。</small></label><input class="switch" id="care-setting" type="checkbox" data-setting="autoCare" ${s.settings.autoCare?'checked':''} ${s.phase==='prep'?'disabled':''}></div>${!s.settings.autoCare&&s.phase==='survival'?`<button class="secondary manual-care" data-action="care" ${s.lastCareDay===s.day?'disabled':''}>${s.lastCareDay===s.day?'今天已经照料过了':'亲自照料小院 · 5 精力'}</button>`:''}</section>`;}
export function renderSchedule(s){return `<section class="panel" id="schedule-section"><div class="section-heading"><div><span class="eyebrow">院门以内，也有新的可能</span><h2>今日安排</h2></div><span class="pill">材料 ${num(s.inventory.materials)} 份</span></div><p class="section-note">同一项安排每天一次。播种 3 精力、收获 2 精力；烹饪和养殖另计。可以留精力做事，也可以安心休息。</p><div class="activity-grid">${ACTIVITIES.map(a=>{const done=s.activitiesDone.includes(a.id),missing=a.requires&&!s.facilities[a.requires];return `<article class="activity-card"><span>${a.icon}</span><div><h3>${a.name}</h3><p>${a.description}${a.id==='salvage'?` 剩余 ${s.salvageLeft} 次。`:''}</p><small>${a.gain?`恢复 ${a.gain} 精力、${a.health||0} 健康`:`消耗 ${a.energy} 精力`}${a.materials?` · ${a.materials} 材料`:''}</small></div><button class="secondary" data-action="activity" data-id="${a.id}" ${done||missing||s.phase==='prep'||s.ended?'disabled':''}>${done?'已完成':missing?'缺少设施':'安排'}</button></article>`}).join('')}</div></section>`;}
export function renderGoals(s){return `<section class="panel goals-panel"><div class="section-heading"><div><span class="eyebrow">给这段日子，一点方向</span><h2>${s.milestoneSeen?'第一段生活完成，继续慢慢经营':'这一局，先过好 30 天'}</h2></div><span class="pill">${DIFFICULTIES.find(d=>d.id===s.difficulty).name}</span></div><div class="goal-list">${getObjectives(s).map(g=>`<div class="goal-row ${g.done?'done':''}"><span>${g.done?'✓':'○'}</span><div><b>${g.name}</b><small>${g.detail}</small></div></div>`).join('')}</div><p class="section-note">健康降至 0 时结束这一段生活。完成 30 天后可继续经营；应急援助${s.assistance?'已开启，需主动申请':'已关闭'}，已使用 ${s.stats.assists} 次。</p></section>`;}
export function renderSeason(s){
 if(!s.settings.seasons)return '';
 const season=getSeason(s.day);
 const dayInSeason=((s.day-1)%SEASON_LENGTH)+1;
 const daysLeft=SEASON_LENGTH-dayInSeason;
 const wishes=getWishes(s);
 const doneCount=wishes.filter(w=>w.done).length;
 return `<section class="panel season-panel" id="season-section"><div class="section-heading"><div><span class="eyebrow">日子有了四季的轮转</span><h2>${season.icon} ${season.name} · 季节心愿</h2></div><span class="pill">${daysLeft>0?`${daysLeft} 天后换季`:'明天换季'}</span></div><p class="season-tip">${season.tip}</p><div class="wish-list">${wishes.map(w=>`<div class="wish-row ${w.done?'done':''}"><span>${w.done?'✓':'○'}</span><div class="wish-body"><b>${w.desc}</b><small>${w.done?'已完成':`进度 ${w.progress} / ${w.target}`}</small><div class="progress"><span style="width:${Math.min(100,w.progress/w.target*100)}%"></span></div></div></div>`).join('')}</div><p class="section-note">每个心愿达成 +1 材料；整季全部完成额外 +2 材料、+1 种子。本季心愿 ${doneCount}/3。</p></section>`;
}
export function renderNeighbors(s){
 const head=`<div class="page-heading"><div class="eyebrow">院门之外，也有人在好好过日子</div><h1>邻里</h1><p>联络员沿着山脚敲开了附近住户的门。和邻居互通有无、彼此帮衬；帮过的忙、送过的心意，都会记在情分里。</p></div>`;
 if(!s.settings.neighbors)return `<div class="page-heading"><div class="eyebrow">邻里</div><h1>邻里往来已关闭</h1><p>你可以在“存档与设置”里重新开启邻里系统。</p></div>`;
 if(s.neighbors.met.length===0)return `<div class="page-heading"><div class="eyebrow">邻里</div><h1>还没有人来敲门</h1><p>继续把日子过下去。到了时候，联络员会沿着山脚找到这里。</p></div>`;
 const nb=s.neighbors;
 const avail=(s,k)=>s.inventory[k]-(s.mealPlan[k]||0);
 const cards=NEIGHBORS.filter(d=>nb.met.includes(d.id)).map(d=>{
  const bond=nb.bond[d.id],lvl=bondLevel(bond),tradesLeft=nb.tradesLeft[d.id],giftLeft=nb.giftLeft[d.id];
  return `<article class="panel neighbor-card">
   <div class="neighbor-head"><span class="neighbor-icon">${d.icon}</span><div class="neighbor-id"><h3>${d.name}</h3><small>${d.title}</small></div><span class="pill bond-pill">${lvl.name}</span></div>
   <p class="neighbor-greeting">“${d.greeting}”</p>
   <div class="bond-row"><div class="progress"><span style="width:${bond}%"></span></div><small>好感 ${bond} / 100 · ${lvl.name}</small></div>
   <div class="trade-list">${d.trades.map((t,i)=>{
    const canGive=avail(s,t.give.resource)+1e-8>=t.give.amount,disabled=tradesLeft<=0||!canGive||s.ended;
    return `<button class="trade-row ${canGive?'':'lack'}" data-action="trade" data-neighbor="${d.id}" data-index="${i}" ${disabled?'disabled':''}><span class="trade-give">${RESOURCE_META[t.give.resource].icon} ${t.give.amount} ${RESOURCE_META[t.give.resource].name}</span><span class="trade-arrow">→</span><span class="trade-get">${RESOURCE_META[t.get.resource].icon} ${t.get.amount} ${RESOURCE_META[t.get.resource].name}</span></button>`;
   }).join('')}</div>
   <div class="neighbor-foot"><small>今日还可交换 <b>${tradesLeft}</b> 次</small><button class="secondary gift-btn" data-action="gift" data-neighbor="${d.id}" ${giftLeft<=0||s.ended?'disabled':''}>${giftLeft>0?`送 ${d.gift.amount} ${RESOURCE_META[d.gift.resource].name} · 好感+${d.gift.bond}`:'今天已送过礼'}</button></div>
  </article>`;
 }).join('');
 const reqCard=(r,status)=>{
  const d=NEIGHBORS.find(x=>x.id===r.neighbor);
  if(status==='active'){
   const canHelp=avail(s,r.need.resource)+1e-8>=r.need.amount;
   return `<div class="request-row active"><div class="request-head"><span>${d.icon} ${d.name} 的求助</span><span class="pill">限时</span></div><p>${r.desc}</p><div class="request-detail"><span>需要 ${RESOURCE_META[r.need.resource].icon} ${r.need.amount} ${RESOURCE_META[r.need.resource].name}（现可匀 ${Math.max(0,Math.floor(avail(s,r.need.resource)))}）</span><span>回礼 ${RESOURCE_META[r.reward.resource].icon} ${r.reward.amount} ${RESOURCE_META[r.reward.resource].name} · 好感+${r.bond}</span></div><button class="primary full" data-action="help" data-request="${r.id}" ${!canHelp||s.ended?'disabled':''}>${canHelp?'帮这个忙':'物资还不够'}</button></div>`;
  }
  return `<div class="request-row ${status}"><span class="request-mini">${d.icon} ${d.name}</span><small>${r.desc}</small><b>${status==='done'?'已帮忙':'错过了'}</b></div>`;
 };
 const active=NEIGHBOR_REQUESTS.filter(r=>nb.requests[r.id]==='active');
 const done=NEIGHBOR_REQUESTS.filter(r=>nb.requests[r.id]==='done');
 const expired=NEIGHBOR_REQUESTS.filter(r=>nb.requests[r.id]==='expired');
 const requests=`<section class="panel requests-panel"><div class="section-heading"><div><span class="eyebrow">谁家有难处，搭把手</span><h2>邻居求助</h2></div><span class="pill">${active.length} 个待帮</span></div>${active.length?active.map(r=>reqCard(r,'active')).join(''):'<div class="empty-state">眼下没有待帮的求助。谁家有需要，会托人捎话来。</div>'}${done.length?`<div class="request-history"><h4>已帮过（${done.length}）</h4>${done.map(r=>reqCard(r,'done')).join('')}</div>`:''}${expired.length?`<div class="request-history"><h4>错过了（${expired.length}）</h4>${expired.map(r=>reqCard(r,'expired')).join('')}</div>`:''}</section>`;
 return head+cards+requests;
}

// 图鉴：收获、做饭、繁育、相遇都记下来
export function renderCollection(s){
 const col=getCollection(s),count=getCollectionCount(s),total=getCollectionTotal(s);
 const groups=[
  {name:'种过的作物',items:col.crops},
  {name:'做过的菜',items:col.recipes},
  {name:'养过的动物',items:col.animals},
  {name:'认识的人',items:col.neighbors},
 ];
 const head=`<div class="page-heading"><div class="eyebrow">把日子过熟，一样一样记下来</div><h1>小院图鉴</h1><p>第一次收获、第一次做饭、迎接新生命、遇见新的人，都会记在这里。已经见过 <b>${count} / ${total}</b> 样。</p><div class="collection-progress"><div class="progress"><span style="width:${total?count/total*100:0}%"></span></div></div></div>`;
 const sections=groups.map(g=>{
  const found=g.items.filter(i=>i.found).length;
  return `<section class="panel collection-group"><div class="section-heading"><div><span class="eyebrow">${g.name}</span><h2>${found} / ${g.items.length}</h2></div></div><div class="collection-grid">${g.items.map(i=>`<div class="collection-item ${i.found?'found':'unknown'}"><span class="collection-icon">${i.found?i.icon:'❔'}</span><div class="collection-body"><h3>${i.found?i.name:'还没发现'}</h3><small>${i.found?i.hint:'继续把日子过下去，总会遇见。'}</small></div>${i.found?'<span class="collection-check">✓</span>':''}</div>`).join('')}</div></section>`;
 }).join('');
 return head+sections;
}

// 院子与日子：装饰、节日、结局
export function renderYard(s){
 const avail=(s,k)=>s.inventory[k]-(s.mealPlan[k]||0);
 const head=`<div class="page-heading"><div class="eyebrow">把院子，过成自己喜欢的样子</div><h1>院子与日子</h1><p>用材料布置院子，按时过节；等道路打通，再认真做一次选择。做了选择，日子也还会继续。</p></div>`;
 // 装饰
 const decorations=`<section class="panel"><div class="section-heading"><div><span class="eyebrow">布置院子 · 材料 ${num(s.inventory.materials)} 份</span><h2>把家收拾得舒服些</h2></div></div><div class="decoration-grid">${DECORATIONS.map(d=>{
  const owned=s.decorations[d.id]||0,maxed=owned>=d.max,missing=d.requires&&!s.facilities[d.requires],lack=s.inventory.materials<d.materials;
  const reqName=d.requires?ITEMS.find(i=>i.id===d.requires)?.name:'';
  const disabled=maxed||missing||lack||s.ended||s.phase==='prep';
  const btn=maxed?'已布置好':missing?`需要${reqName}`:lack?'材料不够':'布置';
  return `<article class="decoration-card"><div class="decoration-head"><span class="decoration-icon">${d.icon}</span><div><h3>${d.name}</h3><small>已布置 ${owned} / ${d.max}</small></div></div><p>${d.desc}</p><small>需要 ${d.materials} 材料 · 永久舒适 +${d.comfort}</small><button class="secondary" data-action="build-decoration" data-decoration="${d.id}" ${disabled?'disabled':''}>${btn}</button></article>`;
 }).join('')}</div></section>`;
 // 节日
 const festivals=`<section class="panel"><div class="section-heading"><div><span class="eyebrow">时令</span><h2>节日</h2></div></div><div class="festival-list">${FESTIVALS.map(f=>{
  const st=s.festivals[f.id],c=f.cost;
  const costText=`${RESOURCE_META[c.resource].icon} ${c.amount} ${RESOURCE_META[c.resource].name}`;
  const rewardText=`${f.reward.resource?`${RESOURCE_META[f.reward.resource].icon} ${f.reward.amount} ${RESOURCE_META[f.reward.resource].name} · `:''}舒适 +${f.reward.comfort}`;
  if(st==='active'){
   const can=avail(s,c.resource)+1e-8>=c.amount;
   return `<div class="festival-row active"><div class="festival-head"><span class="festival-icon">${f.icon}</span><div><h3>${f.name}</h3><small>就在这几天</small></div></div><p>${f.desc}</p><small>花费 ${costText} · 换来 ${rewardText}</small><button class="primary" data-action="celebrate" data-festival="${f.id}" ${!can||s.ended?'disabled':''}>${can?'过这个节':'物资还不够'}</button></div>`;
  }
  const label=st==='celebrated'?'已经过了':st==='missed'?'今年错过了':f.repeat?'每年此时':`第 ${f.day} 天前后`;
  return `<div class="festival-row ${st||'pending'}"><div class="festival-head"><span class="festival-icon">${f.icon}</span><div><h3>${f.name}</h3><small>${label}</small></div></div><p>${f.desc}</p></div>`;
 }).join('')}</div></section>`;
 // 结局
 let ending;
 if(!s.ending.unlocked){
  ending=`<section class="panel ending-panel"><div class="section-heading"><div><span class="eyebrow">远方</span><h2>道路还没打通</h2></div></div><p class="section-note">等镇上的路一段一段修通，你会面临一次选择：是回到人群，还是守住这片土地。在那之前，好好过日子。</p></section>`;
 }else if(s.ending.choice){
  const def=ENDINGS.find(e=>e.id===s.ending.choice);
  ending=`<section class="panel ending-panel ending-done"><div class="section-heading"><div><span class="eyebrow">你的选择</span><h2>${def.icon} ${def.name}</h2></div></div><h3 class="ending-title">${getEndingTitle(s)}</h3><p class="section-note">选择已经做出，日子还在继续。小院会一直在，你可以接着把它过下去。</p></section>`;
 }else{
  ending=`<section class="panel ending-panel"><div class="section-heading"><div><span class="eyebrow">道路打通了</span><h2>是离开，还是留下？</h2></div></div><p class="section-note">不用急，慢慢想。无论怎么选，之后都可以继续经营这座小院。</p><div class="ending-choice">${ENDINGS.map(en=>`<button class="ending-option" data-action="choose-ending" data-choice="${en.id}" ${s.ended?'disabled':''}><span class="ending-icon">${en.icon}</span><h3>${en.name}</h3><p>${en.desc}</p></button>`).join('')}</div></section>`;
 }
 return head+decorations+festivals+ending;
}
