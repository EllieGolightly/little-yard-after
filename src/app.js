import { initPwa, getPwaStatus, installApp } from './pwa.js';
import { ITEMS, CATEGORIES, CROPS, RESOURCE_META, STARTER_CART, FOODS, RECIPES, ANIMAL_RULES, DIFFICULTIES, CHAPTERS, CHAPTER_MILESTONES, BROADCASTS } from './data.js';
import { createGame, buyCart, startGame, advanceDay, act, getDerived, getForecast, getCropDuration, getMealPreview, getRecipePreview, getAnimalInfo, getStarterCart } from './engine.js';
import { loadGame, saveGame, exportGame, importGame } from './storage.js';
import { renderScene } from './scene.js';
import { renderWelcome, renderVitals, renderTable, renderAnimals, renderSchedule, renderGoals, renderSeason, renderNeighbors, renderCollection, renderYard, recipeQuote } from './life.js';

const boot = loadGame();
let state = boot.state || createGame();
let view = boot.state ? (state.phase === 'prep' ? 'shop' : 'home') : 'welcome';
let pendingAnimal = null;
let category = 'all', search = '', cart = {}, imported = null, saveStatus = boot.warning ? '存档需留意' : '进度自动保存';
const app = document.querySelector('#app');
const dialog = document.querySelector('#dialog');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = v => Number(v || 0).toLocaleString('zh-CN',{maximumFractionDigits:2});
const money = v => `¥${number(v)}`;
const byId = id => ITEMS.find(i => i.id === id);
const cartTotal = () => Object.entries(cart).reduce((sum,[id,q])=>sum+(byId(id)?.price||0)*q,0);
const cartCount = () => Object.values(cart).reduce((a,b)=>a+b,0);
const paths = {
 home:'M3 11 12 3l9 8M5 9v12h14V9M9 21v-8h6v8',
 shop:'M3 8h18l-2-5H5L3 8Zm1 0v3a3 3 0 0 0 5 2 3 3 0 0 0 6 0 3 3 0 0 0 5-2V8M5 14v7h14v-7M9 21v-6h6v6',
 box:'m3 7 9-4 9 4v11l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v11M7 5l10 4',
 book:'M4 3h12a4 4 0 0 1 4 4v14H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3M4 17h16M8 7h8M8 11h6',
 leaf:'M20 3C8 2 2 10 7 17s16 0 13-14ZM5 21 16 8',
 sun:'M12 3v-2M12 23v-2M3 12H1M23 12h-2M5 5 3 3M21 21l-2-2M5 19l-2 2M21 3l-2 2M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
 arrow:'M4 12h16m-6-6 6 6-6 6',
 check:'m5 12 4 4L19 6',
 plus:'M12 5v14M5 12h14',
 minus:'M5 12h14',
 close:'m6 6 12 12M6 18 18 6',
 water:'M12 2S4 11 4 15a8 8 0 0 0 16 0c0-4-8-13-8-13Zm-4 13a4 4 0 0 0 4 4',
 bolt:'m14 2-9 12h6l-1 8 9-12h-6l1-8',
 heart:'M20 4c-3-3-7-1-8 2-1-3-5-5-8-2-5 5 4 13 8 17 4-4 13-12 8-17Z',
 down:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
 upload:'M12 16V4m-5 5 5-5 5 5M4 17v4h16v-4',
 help:'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 3M12 17h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
 search:'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
 moon:'M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12',
 settings:'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6',
	 people:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
	 star:'M12 3l2.6 6.3 6.7.5-5.1 4.4 1.6 6.5L12 17.3 6.2 20.7l1.6-6.5L2.7 9.8l6.7-.5L12 3Z',
	 flower:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 0V4m0 16v-4M8 12H4m16 0h-4'
};
const icon = (name,cls='') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.leaf}"/></svg>`;
const pill = (text,type='') => `<span class="pill ${type}">${text}</span>`;
const owned = item => item.kind === 'facility' ? state.facilities[item.id]||0 : state.inventory[item.resource]||0;

function toast(message) {
 const node=document.querySelector('#toast'); node.textContent=message;node.classList.add('show');
 clearTimeout(toast.timer);toast.timer=setTimeout(()=>node.classList.remove('show'),3600);
}
function persist() {
 const result=saveGame(state);saveStatus=result.ok?'进度已保存':'暂未保存';
 if(!result.ok) toast(result.error||'无法保存，请导出存档备份。');
 return result.ok;
}
function commit(result,message) {
 if(result.error){toast(result.error);render();return false;}
 state=result.state;const saved=persist();render();if(saved&&(message||result.message))toast(message||result.message);return true;
}
function modal(title,body,footer='') {
 dialog.innerHTML=`<button class="dialog-close icon-button" data-action="close" aria-label="关闭">${icon('close')}</button><div class="eyebrow">小院之后 · 生活手册</div><h2>${title}</h2><div class="dialog-body">${body}</div>${footer?`<div class="dialog-footer">${footer}</div>`:''}`;
 if(!dialog.open)dialog.showModal();
}
function navButton(id,label,symbol,small='') {return `<button class="nav-item ${view===id?'active':''}" data-action="nav" data-view="${id}">${icon(symbol)}<span>${label}</span>${small?`<small>${small}</small>`:''}</button>`;}
function shell(content,aside) {
 const derived=getDerived(state), prep=state.phase==='prep';
 return `<aside class="sidebar"><a class="brand" href="#" data-action="nav" data-view="home"><span class="brand-mark">${icon('home')}</span><span>小院之后<small>A LITTLE LIFE, AFTER</small></span></a><div class="chapter"><span class="chapter-dot"></span>${prep?'序章 · 好好准备':`第一章 · 好好生活`}<small>${prep?'末日尚未来临':`宅家生活的第 ${state.day} 天`}</small></div><nav aria-label="游戏页面">${navButton('home','我的小院','home')}${navButton('shop','采购手册','shop',prep?'OPEN':'已打烊')}${navButton('table','今日餐桌','heart')}${navButton('inventory','储物间','box')}${navButton('journal','生活手记','book')}${navButton('neighbors','邻里','people')}${navButton('yard','院子与日子','flower')}${navButton('collection','小院图鉴','star')}${navButton('chapter','章节广播','moon')}</nav><div class="sidebar-note">${icon('leaf')}<p>外面的世界变了。<br>这里的日子，<br>还可以慢慢过。</p><div class="tiny-flower">✳</div></div><div class="side-bottom"><button class="quiet" data-action="guide">${icon('help')} 新住户指南</button><button class="quiet" data-action="save-menu">${icon('settings')} 存档与设置</button><span class="save-indicator"><i></i>${saveStatus}</span><span class="version">小院之后 / v2.0</span></div></aside>
 <div class="workspace"><header class="topbar"><span class="breadcrumb">我的避风港 <span>/</span> ${{home:'我的小院',shop:'采购手册',inventory:'储物间',journal:'生活手记',neighbors:'邻里',yard:'院子与日子',collection:'小院图鉴',chapter:'章节广播',table:'今日餐桌',welcome:'新的生活'}[view]}</span><div class="topbar-right"><span class="top-comfort">${icon('heart')} 舒适 ${number(derived.comfort)}</span><button class="quiet" data-action="export">${icon('down')}<span>导出存档</span></button><button class="quiet" data-action="guide" aria-label="新住户指南">${icon('help')}</button><button class="quiet" data-action="save-menu" aria-label="存档与设置">${icon('settings')}</button></div></header><div class="page-layout ${aside?'with-aside':''}"><main>${content}</main>${aside?`<aside class="right-panel" id="side-panel">${aside}</aside>`:''}</div>${prep&&view==='shop'?`<button class="mobile-cart" data-action="show-cart">${icon('shop')}<span>购物袋 ${cartCount()?`· ${cartCount()} 件`:"· 还没想好就看看基础清单"}</span><b>${money(cartTotal())}</b>${icon('arrow')}</button>`:''}${!prep&&view!=='welcome'?`<button class="mobile-turn" data-action="next-day">${icon('moon')}<span>第 ${state.day} 天 · ${esc(getForecast(state.day,1)[0].name)}</span><b>${state.ended?'查看本局总结':'结束这一天'}</b>${icon('arrow')}</button>`:''}<footer class="page-footer"><span>一人 · 一屋 · 慢慢生活</span><span>每一次准备，都是对明天的照顾。</span></footer></div>`;
}
function resourceStrip() {
 const d=getDerived(state);
 return `<div class="resource-strip">${[
 ['box','食物储备',`${number(d.foodDays)}<small> 天</small>`,'按正常食量估算，含生食材'],
 ['water','生活用水',`${number(state.inventory.water)}<small> / ${number(d.waterCapacity)} L</small>`,'饮用、种植与喂养'],
 ['bolt','蓄电余量',`${number(state.inventory.power)}<small> / ${number(d.powerCapacity)}</small>`,'阳光，也可以存起来'],
 ['heart','家的舒适',`${number(d.comfort)}<small> 分</small>`,'日子不只有生存']
 ].map(([i,label,value,note])=>`<div class="resource"><span class="resource-icon ${i}">${icon(i)}</span><div><span>${label}</span><strong>${value}</strong><small class="resource-note">${note}</small></div></div>`).join('')}</div>`;
}
function hero(mode='shop') {
 const prep=state.phase==='prep';
 return `<section class="hero ${mode==='home'?'home-hero':''}"><div class="hero-copy"><div class="eyebrow"><span></span>${prep?'末日前的采购时光':'属于你的小小世界'}</div><h1>${prep?'把以后，准备成<br>喜欢的日子。':`今天，也好好生活。`}</h1><p>${prep?'存一点食物，种一点希望。<br>从一张采购单开始，安顿未来的自己。':'菜在生长，水箱在等待下一场雨。<br>关上院门，把日子过得有声有色。'}</p><div class="hero-tag">${icon('leaf')}${prep?'先过好 30 天，之后可以一直生活。':`第 ${state.day} 天 · ${esc(getForecast(state.day,1)[0].name)} · ${getForecast(state.day,1)[0].temperature}°C`}</div></div><div class="scene-wrap">${renderScene(state,{compact:mode==='shop'})}<span class="scene-caption">${prep?'你的院子，会随着准备慢慢丰盛':'点击小院里的区域，照看你的生活'}</span></div></section>`;
}
function productCard(item) {
 const qty=cart[item.id]||0, have=owned(item), maxed=item.max && have+qty>=item.max;
 return `<article class="product"><div class="product-top"><span class="product-picture cat-${esc(item.category)}" aria-hidden="true">${esc(item.icon)}</span>${have>0?pill(item.kind==='facility'?`已安置 ${have}`:`储备 ${number(have)}${RESOURCE_META[item.resource]?.unit||''}`,'owned'):pill(item.kind==='facility'?'小院设施':'日常储备')}</div><h3>${esc(item.name)}</h3><p>${esc(item.description)}</p><div class="product-detail">${esc(item.detail)}</div><div class="product-bottom"><strong>${money(item.price)}</strong>${qty?`<div class="stepper"><button data-action="minus" data-id="${item.id}" aria-label="减少${esc(item.name)}">−</button><span>${qty}</span><button data-action="add" data-id="${item.id}" ${maxed?'disabled':''} aria-label="增加${esc(item.name)}">+</button></div>`:`<button class="add-button" data-action="add" data-id="${item.id}" ${maxed?'disabled':''} aria-label="加入${esc(item.name)}">${icon(maxed?'check':'plus')}</button>`}</div></article>`;
}
function shop() {
 if(state.phase!=='prep')return `${pageHeading('采购手册','那趟满载而归的采购，已经成了生活的一部分。')}<div class="closed-shop"><span>🏡</span><h2>商店的灯已经熄了</h2><p>院子里留下的东西，会陪你度过接下来的日子。<br>去看看长大的菜，或者给自己做一顿饭吧。</p><button class="primary" data-action="nav" data-view="home">回到我的小院 ${icon('arrow')}</button></div>`;
 const products=ITEMS.filter(i=>(category==='all'||i.category===category)&&(!search||`${i.name}${i.description}${i.detail}`.includes(search)));
 return `${hero()}<section class="catalog"><div class="section-heading"><div><span class="eyebrow">为未来，挑选一点踏实</span><h2>小院采购手册 <span class="count">${ITEMS.length} 件好物</span></h2></div><label class="search-box">${icon('search')}<input id="search" placeholder="找点什么…" value="${esc(search)}" aria-label="搜索商品" /></label></div><div class="category-list" role="group" aria-label="商品分类"><button class="category ${category==='all'?'active':''}" data-action="category" data-id="all">全部好物</button>${CATEGORIES.map(c=>`<button class="category ${category===c.id?'active':''}" data-action="category" data-id="${c.id}">${esc(c.label)}</button>`).join('')}</div><div class="product-grid">${products.length?products.map(productCard).join(''):'<div class="empty-search">这里暂时没有找到它，换个名字试试。</div>'}</div></section>`;
}
function cartPanel() {
 const total=cartTotal(), d=getDerived(state);
 return `<section class="budget-card"><span class="eyebrow">我的准备金</span><strong>${money(state.money)}</strong><p>不求什么都有，够过喜欢的生活就好。</p><div><span>本次预计支出</span><b>− ${money(total)}</b></div><div class="budget-left"><span>采购后剩余</span><b class="${total>state.money?'negative':''}">${money(state.money-total)}</b></div></section><section class="cart-card"><div class="section-heading"><h2>这次想带回家 <span class="count">${cartCount()}</span></h2>${cartCount()?'<button class="text-button" data-action="clear-cart">清空</button>':''}</div>${cartCount()?`<div class="cart-list">${Object.entries(cart).filter(([,q])=>q>0).map(([id,q])=>{const i=byId(id);return `<div class="cart-row"><span class="cart-emoji">${esc(i.icon)}</span><div><b>${esc(i.name)}</b><small>${money(i.price*q)}</small></div><div class="stepper small"><button data-action="minus" data-id="${id}" aria-label="购物车减少${esc(i.name)}">−</button><span>${q}</span><button data-action="add" data-id="${id}" aria-label="购物车增加${esc(i.name)}">+</button></div></div>`}).join('')}</div>`:`<div class="empty-cart">${icon('shop')}<p>购物袋还空着</p><span>喜欢的东西，先放进来。<br>结算前都可以慢慢调整。</span></div>`}<button class="primary full" data-action="checkout" ${!cartCount()||total>state.money?'disabled':''}>${cartCount()?`采购并安置 · ${money(total)}`:'等你挑选第一件好物'} ${icon('arrow')}</button><button class="starter-button" data-action="starter">${icon('leaf')} 不知从哪开始？装入基础清单</button></section><section class="readiness"><div class="section-heading"><h3>准备得怎么样了</h3><span>${d.checks.filter(c=>c.ok).length} / ${d.checks.length}</span></div>${d.checks.map(c=>`<div class="check-row ${c.ok?'done':''}"><span>${c.ok?'✓':'·'}</span><div><b>${esc(c.label)}</b><small>${esc(c.hint)}</small></div></div>`).join('')}<button class="secondary full" data-action="start">准备好了，关上院门 ${icon('arrow')}</button><p class="fine-print">关门后停止采购，开始宅家生活。</p></section>`;
}
function pageHeading(title,subtitle) {return `<div class="page-heading"><div class="eyebrow">A LITTLE LIFE, AFTER</div><h1>${title}</h1><p>${subtitle}</p></div>`;}
function gardens() {
 return `<section class="panel" id="garden-section"><div class="section-heading"><div><span class="eyebrow">把希望种进土里</span><h2>院子里的菜地</h2></div>${pill(`种子 ${number(state.inventory.seeds)} 袋`)}</div><div class="garden-grid">${state.plots.map((plot,n)=>{
 const crop=CROPS.find(c=>c.id===plot.crop), duration=crop?getCropDuration(state,crop.id):0, ready=crop&&plot.progress>=duration;
 return `<article class="plot ${crop?'growing':''}"><div class="plot-art">${crop?esc(crop.icon):'<span class="soil-lines">〰<br>〰</span>'}${crop?`<span>${ready?'可以收获啦':`生长 ${plot.progress} / ${duration} 天`}</span>`:'<span>一小块期待</span>'}</div><div class="plot-body"><h3>${n+1} 号菜地 ${crop?`· ${esc(crop.name)}`:''}</h3>${crop?`<div class="progress"><span style="width:${Math.min(100,plot.progress/duration*100)}%"></span></div><p>每天 ${crop.water} L 水 · 收获 ${crop.yield+(state.facilities.compost?2:0)} ${RESOURCE_META[crop.resource]?.unit||'份'}${RESOURCE_META[crop.resource]?.name||''}</p><button class="${ready?'primary':'secondary'} full" data-action="harvest" data-plot="${n}" ${!ready||state.phase==='prep'?'disabled':''}>${ready?'收进储物间':'等它慢慢长大'}</button>`:`<p>${state.phase==='prep'?'末日来临后，就从播下一粒种子开始。':'今天，想种点什么？'}</p><div class="plant-options">${CROPS.map(c=>`<button data-action="plant" data-plot="${n}" data-crop="${c.id}" ${state.phase==='prep'?'disabled':''} title="${esc(c.name)}：${getCropDuration(state,c.id)}天，每天${c.water}L水，种子${c.seedCost}">${esc(c.icon)} ${esc(c.name)}<small>${getCropDuration(state,c.id)} 天 · ${c.seedCost} 袋种子</small></button>`).join('')}</div>`}</div></article>`;
 }).join('')}</div><p class="section-note">收获时会留下种子，下一季仍有期待。水不足时暂停生长，不会凭空枯死。</p></section>`;
}
function facilityCard(id) {
 const i=byId(id);if(!i)return '';
 const has=state.facilities[id]>0;
 const cycle={coop:2,ducks:3,pond:7}[id];
 return `<div class="facility ${has?'':'unbuilt'}"><span>${esc(i.icon)}</span><div><b>${esc(i.name)}</b><p>${has?esc(i.detail):'尚未安置'}</p></div>${pill(has?'已安置':'未购入',has?'green':'')}</div>`;
}
function home() {
 const prep=state.phase==='prep';
 return `${hero('home')}${prep?'':renderVitals(state)}${resourceStrip()}${prep?`<div class="notice">${icon('leaf')}<div><b>先过好 30 天，再把小院经营成长久的家。</b><span>采购完毕后，还能种菜、繁育、做饭，以及使用材料扩建设施。</span></div><button class="secondary" data-action="nav" data-view="shop">继续采购 →</button></div>`:`<div class="notice meal-notice"><span class="notice-emoji">🍚</span><div><b>${Object.keys(state.mealPlan).length?'今日餐桌已安排':'今天的餐桌，还等着你'}</b><span>${Object.keys(state.mealPlan).length?`共 ${Math.round(getMealPreview(state).nutrition*100)}% 正常食量，结束一天时食用。`:'先选吃什么、吃多少。也可以沿用昨天的搭配。'}</span></div><button class="primary" data-action="nav" data-view="table">去餐桌看看 →</button></div>`}${gardens()}${renderSeason(state)}${renderAnimals(state)}${renderSchedule(state)}<section class="panel" id="water-section"><div class="section-heading"><h2>水与电，心里的底气</h2>${icon('bolt')}</div><div class="utilities-grid">${['rain','filter','tank','well','solar','battery','generator'].map(facilityCard).join('')}</div><div class="toggle-row"><label for="generator-setting">允许燃油备用发电<small>蓄电低于 3 kWh 时，使用 1 L 燃料补电</small></label><input class="switch" id="generator-setting" type="checkbox" data-setting="generator" ${state.settings.generator?'checked':''} ${prep||!state.facilities.generator?'disabled':''}></div>${state.facilities.fridge?`<div class="toggle-row"><label for="fridge-setting">保持冰箱运行<small>每晚需 1.2 kWh 电；没有电时，鲜食按固定日期损耗</small></label><input class="switch" id="fridge-setting" type="checkbox" data-setting="fridge" ${state.settings.fridge?'checked':''} ${prep?'disabled':''}></div>`:''}</section>${renderGoals(state)}`;
}
function dayPanel() {
 const forecasts=getForecast(state.day,3),d=getDerived(state),m=getMealPreview(state);
 return `<section class="today-card"><span class="eyebrow">先平安度过 30 天 · 然后慢慢生活</span><div class="day-number">${String(state.day).padStart(2,'0')}<span>天</span></div><div class="daily-body"><span>健康 <b>${number(state.health)}</b></span><span>精力 <b>${number(state.energy)}</b></span></div><h3>${state.ended?'这一段生活，暂时停在这里。':m.nutrition?'今天，也记得好好吃饭。':'今天的餐桌还没有安排。'}</h3><p>${state.ended?'小院与存档都保留着，可以回看记录。':`今日食量 ${Math.round(m.nutrition*100)}% · 饮食影响健康 ${m.healthChange>0?'+':''}${m.healthChange}`}</p><button class="secondary full" data-action="nav" data-view="table">🍚 安排今日餐桌</button><button class="primary full" data-action="next-day">${icon('moon')} ${state.ended?'查看本局总结':'过完这一天'} ${icon('arrow')}</button><small>预计生活用水 ${number(d.dailyNeeds.water)} L · 饲料 ${number(d.dailyNeeds.feed)} 份</small></section><section class="forecast-card"><div class="section-heading"><h3>未来三天天气</h3>${icon('sun')}</div>${forecasts.map((f,n)=>`<div class="forecast-row"><span>${n===0?'今天':n===1?'明天':'后天'}<small>第 ${state.day+n} 天</small></span><span class="weather-icon">${esc(f.icon)}</span><b>${esc(f.name)}<small>${f.temperature}°C · 日照 ${Math.round(f.sun*100)}%<br>${f.rain?`雨量 ${f.rain} mm`:'无雨'}</small></b></div>`).join('')}<p class="fine-print">晴天蓄电，雨天存水。今天烹饪使用的是现有蓄电。</p></section><section class="milestone-card"><span class="eyebrow">${DIFFICULTIES.find(x=>x.id===state.difficulty).name}</span><h3>${state.milestoneSeen?'这里，已经是家了':'在小院生活 30 天'}</h3><div class="progress"><span style="width:${Math.min(100,state.stats.days/30*100)}%"></span></div><p>已生活 ${state.stats.days} 天 · 收获 ${state.stats.harvests} 次<br>新生命 ${state.stats.births} 只 · 做饭 ${state.stats.mealsCooked} 次</p><small>援助${state.assistance?'已开启':'已关闭'} · 使用 ${state.stats.assists} 次</small>${state.assistance?`<button class="text-button aid-button" data-action="${state.ended?'rescue':'aid'}">${state.ended?'申请援助休养':'食水不足？申请应急补给'}</button>`:''}</section>`;
}
function inventory() {
 return `${pageHeading('家里有这些，就很安心。','一格一格存下的，是未来的每一个普通日子。')}${resourceStrip()}<section class="panel"><div class="section-heading"><h2>储备一览</h2>${pill('每天结算 · 实时记录')}</div><div class="inventory-grid">${Object.entries(RESOURCE_META).filter(([key])=>state.inventory[key]>0||['food','water','feed','fuel','seeds','power','materials'].includes(key)).map(([key,m])=>`<div class="inventory-item"><span>${esc(m.icon)}</span><div><h3>${esc(m.name)}</h3><strong>${number(state.inventory[key])}<small> ${esc(m.unit)}</small></strong></div></div>`).join('')}</div></section><section class="panel"><div class="section-heading"><h2>已经安置好的设施</h2><span class="muted">家的每一部分，都有来处</span></div><div class="owned-grid">${ITEMS.filter(i=>i.kind==='facility'&&state.facilities[i.id]).map(i=>`<article><span>${esc(i.icon)}</span><h3>${esc(i.name)} ${state.facilities[i.id]>1?`×${state.facilities[i.id]}`:''}</h3><p>${esc(i.detail)}</p></article>`).join('')||'<p class="muted">家里还有很多空位，等你慢慢添置。</p>'}</div></section>`;
}
function journal() {
 return `${pageHeading('那些平凡的日子，值得记下。','第一棵菜、第一枚蛋，和末日里一碗热腾腾的饭。')}<div class="journal-banner">${icon('book')}<div><h3>小院生活手记</h3><p>度过 ${Math.max(0,state.day-1)} 天 · 收获 ${state.stats.harvests} 次 · 应急补给 ${state.stats.assists} 次</p></div><button class="secondary" data-action="export">把回忆存下来 ${icon('down')}</button></div><div class="journal-list">${[...state.logs].map(l=>`<article class="journal-entry"><span class="journal-date">${l.day?`DAY ${String(l.day).padStart(2,'0')}`:'序章'}</span><div><h3>${esc(l.title)}</h3><p>${esc(l.text)}</p></div><span class="journal-stamp">${l.kind==='harvest'?'✳':'✧'}</span></article>`).join('')||'<div class="empty-state">故事还没开始，先为自己添置一点东西吧。</div>'}</div>`;
}
function chapter() {
 const prep=state.phase==='prep';
 const current=CHAPTERS.find(c=>state.day>=c.start&&state.day<=c.end)||CHAPTERS[0];
 const curIdx=CHAPTERS.indexOf(current);
 const hasRadio=state.facilities.radio>0;
 const heard=BROADCASTS.filter(b=>state.chapter.heard[b.day]);
 return `${pageHeading('章节与远方的广播','收音机里的故事，和世界慢慢恢复的脚步。')}
 <section class="panel chapter-now"><div class="section-heading"><div><span class="eyebrow">当前章节</span><h2>${current.name}</h2></div>${pill(`${curIdx+1} / 6`)}</div><p>${current.scene}</p>${prep?'<p class="soft-note">关上院门后，章节才会开始。</p>':''}</section>
 <section class="panel"><div class="section-heading"><h2>章节时间线</h2></div><div class="chapter-steps">${CHAPTERS.map((c,i)=>`<div class="chapter-step ${i===curIdx?'current':''}${i<curIdx?'done':''}"><span>${i<curIdx?'✓':i+1}</span><div><b>${c.name}</b><small>${c.scene}</small></div></div>`).join('')}</div></section>
 <section class="panel"><div class="section-heading"><div><span class="eyebrow">世界在恢复</span><h2>关键节点</h2></div></div><div class="milestone-list">${CHAPTER_MILESTONES.map(m=>`<div class="milestone-row ${state.chapter.milestones[m.id]?'done':''}"><span>${state.chapter.milestones[m.id]?'✓':'○'}</span><div><b>${m.name}</b><small>第 ${m.day} 天 · ${m.desc}</small></div></div>`).join('')}</div></section>
 <section class="panel"><div class="section-heading"><div><span class="eyebrow">${hasRadio?'📻 广播记录《世界在恢复》':'需要收音机'}</span><h2>广播记录</h2></div>${pill(`${heard.length} / ${BROADCASTS.length}`)}</div>${!hasRadio?'<p class="soft-note">这一局没有采购手摇收音机，无法收到广播；世界的变化仍会在节点中记录。</p>':''}<div class="broadcast-entries">${heard.map(b=>`<div class="broadcast-entry"><span class="broadcast-day">D${b.day}</span><p>${esc(b.text)}</p></div>`).join('')||'<p class="soft-note">还没有收到广播，随着日子推进，收音机里会有新的故事。</p>'}</div></section>`;
}
function render() {
 const content={shop,home,inventory,journal,neighbors:()=>renderNeighbors(state),yard:()=>renderYard(state),collection:()=>renderCollection(state),chapter,table:()=>state.phase==='prep'?`${pageHeading('未来的餐桌，也从准备开始。','关上院门后，可以在这里搭配每一天的食物。')}${renderGoals(state)}`:renderTable(state),welcome:()=>renderWelcome(state)}[view]();
 const aside=view==='welcome'?'':state.phase==='prep'?(view==='shop'?cartPanel():`<section class="return-card"><span>🌱</span><h2>小院慢慢丰盛起来</h2><p>准备金还有 ${money(state.money)}，继续挑些未来用得上的东西吧。</p><button class="primary full" data-action="nav" data-view="shop">翻开采购手册 ${icon('arrow')}</button><button class="secondary full" data-action="start">准备好了，关上院门</button></section>`):dayPanel();
 app.innerHTML=shell(content,aside);
}
function guide() {
 modal('欢迎回家，日子慢慢过。',`<p class="lead">先平安度过 30 天，再慢慢经营。健康降至 0 时结束这一段生活，存档不会被删除。</p><div class="guide-step"><b>01</b><div><h3>预算与准备</h3><p>安心囤货 5 万、精打细算 3 万、紧日子 2 万。应急援助可独立开关，只在新开局设置。采购没有倒计时；开始生活后可利用材料扩建。</p></div></div><div class="guide-step"><b>02</b><div><h3>今天吃什么，由你决定</h3><p>去餐桌选食物和份量，支持小数份量。结束一天时统一吃饭。生米、土豆、蛋和肉需要先烹饪。两用灶台可选电或燃料；餐桌预留的食物不会被做菜挪用。</p></div></div><div class="guide-step"><b>03</b><div><h3>照料小院，也照料自己</h3><p>食量不足会降低健康，缺水另扣健康；吃饱、搭配丰富和休息帮助恢复。精力用于种植、做饭、繁育和扩建，每晚恢复。水电、作物、幼崽和动物继续按设置自动照料。</p></div></div><div class="guide-step"><b>04</b><div><h3>留种，长大，再作选择</h3><p>鸡鸭需要公母种禽；自产种蛋可吃或孵化，幼崽固定天数后长大。鱼池至少留 2 条成鱼可繁育。圈舍容量和食水消耗随数量变化；也可以处理成年禽类或捕捞获得食材。</p></div></div><p class="soft-note">低储备时可主动申请已开启的援助，计入记录；援助不会替你吃饭。旧存档自动升级且保留初次升级前的浏览器备份。离线期间时间不会流逝。</p>`,`<button class="primary" data-action="close">知道啦，慢慢来 ${icon('leaf')}</button>`);
}
function startConfirm() {
 if(cartCount()){toast('购物袋里还有东西，先采购安置，或清空后再关门。');view='shop';render();return;}
 const d=getDerived(state);
 modal('把院门关上，把生活留下。',`<p>准备金还剩 <b>${money(state.money)}</b>。关门后商店将停止营业，种植、养殖与每日生活开始运转。</p><div class="confirm-checks">${d.checks.map(c=>`<p class="${c.ok?'positive':'muted'}">${c.ok?'✓':'○'} ${esc(c.label)} <small>${esc(c.hint)}</small></p>`).join('')}</div><p class="soft-note">${d.checks.every(c=>c.ok)?'看起来，已经有了好好生活的底气。':'还有一些准备尚未完成。你可以回去补充，也可以带着现有的东西开始。'}</p>`,`<button class="secondary" data-action="close">再看看</button><button class="primary" data-action="confirm-start">开始宅家生活 ${icon('arrow')}</button>`);
}
function ending() {
 modal('这一段生活，暂时停在这里。',`<p class="lead">你在小院生活了 ${state.stats.days} 天。</p><p>收获 ${state.stats.harvests} 次，做饭 ${state.stats.mealsCooked} 次，迎接 ${state.stats.births} 个新生命。健康已经耗尽，院子和存档都还在。</p><p class="soft-note">${state.assistance?'这一局开启了援助，可以申请休养后继续，会记录援助次数。':'这一局关闭了援助。可以导出这段生活的记录，再尝试另一种准备。'}</p>`,`<button class="secondary" data-action="export">导出这段记录</button>${state.assistance?'<button class="primary" data-action="rescue">援助休养后继续</button>':'<button class="primary" data-action="reset">开始新的小院</button>'}`);
}
function nextDay(confirmed=false) {
 const invalid=document.querySelector('[data-meal]:invalid');if(invalid){invalid.reportValidity();toast('请先把食用量调整为库存内的非负数，最多两位小数。');return;}
 if(state.ended){ending();return;}
 const planned=getMealPreview(state);
 if(!confirmed&&planned.nutrition<.9){modal(planned.nutrition===0?'今天还没有安排食物。':'今天，准备省着吃一点。',`<p>餐桌上是正常食量的 <b>${Math.round(planned.nutrition*100)}%</b>，饮食预计让健康 <b>${planned.healthChange}</b>。可以回去搭配，也可以按这个安排过一天。</p><p class="soft-note">应急援助不会替你吃饭。持续吃得不足，会逐渐耗尽健康。</p>`,'<button class="secondary" data-action="back-table">去安排餐桌</button><button class="primary" data-action="confirm-day">就按这个安排过一天</button>');return;}
 const before=state,result=advanceDay(state);if(result.error){toast(result.error);return;}
 state=result.state;persist();render();
 const changes=Object.entries(result.report.changes).filter(([,q])=>Math.abs(q)>=.01).map(([k,q])=>`<div class="day-change"><span>${RESOURCE_META[k].icon} ${RESOURCE_META[k].name}</span><b class="${q>0?'positive':'used'}">${q>0?'+':''}${number(q)} ${RESOURCE_META[k].unit}</b></div>`).join('');
 modal(result.report.ended?'小院的这一页，暂时停下。':result.report.milestone?'三十天过去，这里已经是家。':'晚安，小院。',`<p class="lead">第 ${before.day} 天 · ${result.report.weather.name}<br><small>健康 ${number(state.health)}（${result.report.healthChange>0?'+':''}${result.report.healthChange}） · 精力 ${number(state.energy)}（+${number(result.report.energyChange)}）</small></p><div class="day-changes">${changes||'<p>物资没有变化。</p>'}</div><div class="report-entries"><p><b>${esc(result.report.title)}</b><span>${esc([result.report.text,...result.report.events].join('\n'))}</span></p></div>${result.report.milestone?'<p class="soft-note">30 天目标已完成。明天仍然可以继续经营，看看下一批幼崽和作物会长成什么样。</p>':''}`,`<button class="primary" data-action="${state.ended?'ending':'close'}">${state.ended?'看看这段生活的总结':result.report.milestone?'继续过我的小日子':'迎接新的一天'} ${icon('sun')}</button>`);
}
function exportSave() {
 const url=URL.createObjectURL(new Blob([exportGame(state)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download=`小院之后-${state.phase==='prep'?'准备期':`第${state.day}天`}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('存档已导出，记得把它放在安心的地方。');
}
document.addEventListener('click',event=>{
 const scene=event.target.closest('[data-scene]');
 if(scene){view='home';render();const id={garden:'garden',water:'water',power:'water',animals:'animals',home:'home'}[scene.dataset.scene];document.querySelector(`#${id}-section`)?.scrollIntoView({behavior:'smooth',block:'center'});return;}
 const button=event.target.closest('[data-action]');if(!button||button.disabled)return;
 event.preventDefault();const action=button.dataset.action,id=button.dataset.id;
 switch(action){
 case 'nav':view=button.dataset.view;render();window.scrollTo({top:0,behavior:'instant'});break;
 case 'category':category=id;render();break;
 case 'show-cart':document.querySelector('#side-panel').scrollIntoView({behavior:'smooth',block:'start'});break;
 case 'add':{const i=byId(id);if(!i)return;const max=i.max||999;if((i.kind==='facility'?owned(i):0)+(cart[id]||0)>=max){toast('这个已经准备足够啦。');return;}cart[id]=(cart[id]||0)+1;render();break;}
 case 'minus':if(cart[id]>1)cart[id]--;else delete cart[id];render();break;
 case 'clear-cart':cart={};render();break;
 case 'starter':cart=Object.fromEntries(Object.entries(getStarterCart(state)).map(([key,q])=>[key,Math.max(0,q-(byId(key)?.kind==='facility'?(state.facilities[key]||0):0))]).filter(([,q])=>q>0));render();toast('基础清单已装入购物袋，可以按喜好增减。');break;
 case 'checkout':if(commit(buyCart(state,cart),'东西都带回家了。小院又踏实了一点。')){cart={};render();}break;
 case 'start':startConfirm();break;
 case 'confirm-start':dialog.close();if(commit(startGame(state))){view='home';render();window.scrollTo({top:0,behavior:'instant'});}break;
 case 'plant':commit(act(state,{type:'plant',plot:Number(button.dataset.plot),crop:button.dataset.crop}));break;
 case 'harvest':commit(act(state,{type:'harvest',plot:Number(button.dataset.plot)}));break;
 case 'care':commit(act(state,{type:'care'}));break;
 case 'cook':view='table';render();break;
 case 'next-day':nextDay();break;
 case 'confirm-day':dialog.close();nextDay(true);break;
 case 'back-table':dialog.close();view='table';render();window.scrollTo({top:0,behavior:'instant'});break;
 case 'ending':ending();break;
 case 'aid':commit(act(state,{type:'aid'}));break;
 case 'rescue':if(commit(act(state,{type:'rescue'})))dialog.close();break;
 case 'meal-preset':commit(act(state,{type:'mealPreset',mode:button.dataset.mode}));break;
 case 'meal-adjust':{const k=button.dataset.resource,q=Math.max(0,Math.min(state.inventory[k],Math.round(((state.mealPlan[k]||0)+Number(button.dataset.delta))*100)/100));commit(act(state,{type:'meal',resource:k,amount:q}));break;}
 case 'cook-recipe':{const batch=Number(button.closest('.recipe-card').querySelector('.recipe-batch').value);commit(act(state,{type:'cook',recipe:button.dataset.recipe,batch}));break;}
 case 'preserve':commit(act(state,{type:'preserve',resource:document.querySelector('#preserve-resource').value,amount:Number(document.querySelector('#preserve-amount').value)}));break;
 case 'activity':commit(act(state,{type:'activity',id}));break;
 case 'trade':commit(act(state,{type:'trade',neighbor:button.dataset.neighbor,tradeIndex:Number(button.dataset.index)}));break;
 case 'gift':commit(act(state,{type:'gift',neighbor:button.dataset.neighbor}));break;
 case 'help':commit(act(state,{type:'helpRequest',requestId:button.dataset.request}));break;
 case 'build-decoration':commit(act(state,{type:'buildDecoration',decoration:button.dataset.decoration}));break;
 case 'celebrate':commit(act(state,{type:'celebrateFestival',festival:button.dataset.festival}));break;
 case 'choose-ending':commit(act(state,{type:'chooseEnding',choice:button.dataset.choice}));break;
 case 'hatch':commit(act(state,{type:'hatch',species:button.dataset.species,count:Number(button.closest('.animal-card').querySelector('.hatch-count').value)}));break;
 case 'breed-fish':commit(act(state,{type:'breedFish'}));break;
 case 'animal-harvest':{const species=button.dataset.species,card=button.closest('.animal-card'),count=Number(card.querySelector('.animal-quantity').value),sex=card.querySelector('.animal-sex')?.value;const group=state.animals[species],available=species==='pond'?group.adults:group[sex];if(!Number.isInteger(count)||count<1||count>available){toast('请填写不超过现有成年动物的整数数量。');break;}pendingAnimal={type:species==='pond'?'catch':'butcher',species,sex,count};const r=ANIMAL_RULES[species];const future=species==='pond'?group.adults-count>=2:(sex==='female'?group.female-count>0&&group.male>0:group.male-count>0&&group.female>0);modal(species==='pond'?'把这次捕获带进厨房。':'为今天的餐桌作一个选择。',`<p>将${species==='pond'?'捕捞':'处理'} ${count} 只${sex==='female'?'母':sex==='male'?'公':''}${r.name}，得到 ${count*r.meat} 份${species==='pond'?'鲜鱼':'禽肉'}，消耗 ${Math.min(35,4+count*2)} 精力。</p><p class="soft-note">${future?'剩余种群仍满足繁育条件。':'这次处理后，种群将无法继续繁育。可以减少数量，留下种禽或种鱼。'}食材需要烹饪后才能上桌。</p>`,'<button class="secondary" data-action="close">再想想</button><button class="primary" data-action="confirm-animal">确认获得食材</button>');break;}
 case 'confirm-animal':if(pendingAnimal&&commit(act(state,pendingAnimal))){pendingAnimal=null;dialog.close();}break;
 case 'begin-run':{const difficulty=document.querySelector('input[name="difficulty"]:checked')?.value||'balanced',assistance=document.querySelector('#new-assistance').checked;state=createGame({difficulty,assistance});cart={};view='shop';category='all';search='';persist();render();window.scrollTo({top:0,behavior:'instant'});break;}

 case 'close':dialog.close();break;
 case 'guide':guide();break;
 case 'export':exportSave();break;
 case 'install':installApp().then(toast).catch(()=>toast('请从浏览器菜单选择添加到主屏幕。'));break;
 case 'save-menu':modal('把这段日子，好好收着。',`<p>小院会自动保存在当前浏览器，离线时间不会推进游戏。导出文件可以备份进度，也可以带到另一台设备。</p><div class="pwa-info"><h3>把小院放到主屏幕</h3><p data-pwa-status>${esc(getPwaStatus())}</p><button class="secondary" data-action="install">安装到手机 / 主屏幕</button><p>iPhone：Safari 分享 → 添加到主屏幕。安卓：浏览器菜单 → 安装应用。存档保存在当前设备；换设备请导出后导入。</p></div><div class="save-actions"><button class="secondary" data-action="export">${icon('down')} 导出当前存档</button><button class="secondary" data-action="import">${icon('upload')} 导入已有存档</button></div><div class="reset-area"><h3>想从头布置另一个小院？</h3><p>重新开始会替换当前进度，建议先导出存档。</p><button class="text-button danger" data-action="reset">重新开始</button></div>`);break;
 case 'import':document.querySelector('#save-file').click();break;
 case 'confirm-import':if(imported){state=imported;imported=null;cart={};view=state.phase==='prep'?'shop':'home';const saved=persist();render();dialog.close();if(saved)toast('熟悉的小院，欢迎回来。');}break;
 case 'reset':modal('重新开始一段生活？','<p>当前小院将被新的准备期替换。如果还想保留它，可以先导出存档。</p>','<button class="secondary" data-action="export">先导出存档</button><button class="danger-button" data-action="confirm-reset">确认重新开始</button>');break;
 case 'confirm-reset':view='welcome';render();dialog.close();window.scrollTo({top:0,behavior:'instant'});break;
 }
});
document.addEventListener('change',event=>{
 if(event.target.dataset.setting)commit(act(state,{type:'settings',key:event.target.dataset.setting,value:event.target.dataset.setting==='cookPower'?event.target.value:event.target.checked}));

 if(event.target.name==='difficulty'){const d=DIFFICULTIES.find(d=>d.id===event.target.value);document.querySelector('#new-assistance').checked=d.assistance;}


});
document.addEventListener('keydown',event=>{const target=event.target.closest('[data-scene]');if(target&&(event.key==='Enter'||event.key===' ')){event.preventDefault();target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
document.addEventListener('input',event=>{
 if(event.target.classList.contains('recipe-batch')){const box=event.target.closest('.recipe-card');box.querySelector('.recipe-quote').innerHTML=recipeQuote(state,event.target.dataset.recipe,Number(event.target.value));}
 if(event.target.dataset.meal){
  const result=act(state,{type:'meal',resource:event.target.dataset.meal,amount:Number(event.target.value)});
  if(result.error){event.target.setCustomValidity(result.error);return;}event.target.setCustomValidity('');state=result.state;persist();
  const template=document.createElement('template');template.innerHTML=renderTable(state);
  for(const selector of ['.vitals-strip','.meal-preview','.table-panel .section-heading .pill']){const current=document.querySelector(selector),fresh=template.content.querySelector(selector);if(current&&fresh)current.replaceWith(fresh);}
  const aside=document.querySelector('#side-panel');if(aside)aside.innerHTML=dayPanel();
  document.querySelectorAll('.recipe-card').forEach(card=>{card.querySelector('.recipe-quote').innerHTML=recipeQuote(state,card.dataset.recipeCard,Number(card.querySelector('.recipe-batch').value));});
 }
 if(event.target.id==='search'){const pos=event.target.selectionStart;search=event.target.value;render();const field=document.querySelector('#search');field.focus();field.setSelectionRange(pos,pos);}});
document.querySelector('#save-file').addEventListener('change',async event=>{
 const file=event.target.files[0];if(!file)return;
 try {if(file.size>1048576)throw new Error('存档文件太大了，请选择小院导出的 JSON 文件。');imported=importGame(await file.text());modal('找到了你的另一座小院。',`<p>这是${imported.phase==='prep'?'准备期':`第 ${imported.day} 天`}的存档，准备金 ${money(imported.money)}。导入后会替换当前进度。</p>`,'<button class="secondary" data-action="close">暂不导入</button><button class="primary" data-action="confirm-import">确认恢复存档</button>');}catch(error){toast(error.message||'这个文件不是有效的小院存档。');}event.target.value='';
});
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
render();
if(boot.warning)setTimeout(()=>toast(boot.warning),250);
else if(state.migratedFrom===1&&boot.state)setTimeout(()=>toast('旧小院已升级：灶台两用、种禽补齐。记得在今日餐桌安排食物。'),350);

initPwa();
