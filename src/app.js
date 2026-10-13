import { ITEMS, CATEGORIES, CROPS, RESOURCE_META, STARTER_CART } from './data.js';
import { createGame, buyCart, startGame, advanceDay, act, getDerived, getForecast, getCropDuration } from './engine.js';
import { loadGame, saveGame, exportGame, importGame } from './storage.js';
import { renderScene } from './scene.js';

const boot = loadGame();
let state = boot.state || createGame();
let view = state.phase === 'prep' ? 'shop' : 'home';
let category = 'all', search = '', cart = {}, imported = null, saveStatus = boot.warning ? '存档需留意' : '进度自动保存';
const app = document.querySelector('#app');
const dialog = document.querySelector('#dialog');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number = v => Number(v || 0).toLocaleString('zh-CN',{maximumFractionDigits:1});
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
 settings:'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6'
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
 return `<aside class="sidebar"><a class="brand" href="#" data-action="nav" data-view="home"><span class="brand-mark">${icon('home')}</span><span>小院之后<small>A LITTLE LIFE, AFTER</small></span></a><div class="chapter"><span class="chapter-dot"></span>${prep?'序章 · 好好准备':`第一章 · 好好生活`}<small>${prep?'末日尚未来临':`宅家生活的第 ${state.day} 天`}</small></div><nav aria-label="游戏页面">${navButton('home','我的小院','home')}${navButton('shop','采购手册','shop',prep?'OPEN':'已打烊')}${navButton('inventory','储物间','box')}${navButton('journal','生活手记','book')}</nav><div class="sidebar-note">${icon('leaf')}<p>外面的世界变了。<br>这里的日子，<br>还可以慢慢过。</p><div class="tiny-flower">✳</div></div><div class="side-bottom"><button class="quiet" data-action="guide">${icon('help')} 新住户指南</button><button class="quiet" data-action="save-menu">${icon('settings')} 存档与设置</button><span class="save-indicator"><i></i>${saveStatus}</span><span class="version">小院之后 / v1.0</span></div></aside>
 <div class="workspace"><header class="topbar"><span class="breadcrumb">我的避风港 <span>/</span> ${{home:'我的小院',shop:'采购手册',inventory:'储物间',journal:'生活手记'}[view]}</span><div class="topbar-right"><span class="top-comfort">${icon('heart')} 舒适 ${number(derived.comfort)}</span><button class="quiet" data-action="export">${icon('down')}<span>导出存档</span></button><button class="quiet" data-action="guide" aria-label="新住户指南">${icon('help')}</button><button class="quiet" data-action="save-menu" aria-label="存档与设置">${icon('settings')}</button></div></header><div class="page-layout ${aside?'with-aside':''}"><main>${content}</main>${aside?`<aside class="right-panel" id="side-panel">${aside}</aside>`:''}</div>${prep&&view==='shop'?`<button class="mobile-cart" data-action="show-cart">${icon('shop')}<span>购物袋 ${cartCount()?`· ${cartCount()} 件`:"· 还没想好就看看基础清单"}</span><b>${money(cartTotal())}</b>${icon('arrow')}</button>`:''}${!prep?`<button class="mobile-turn" data-action="next-day">${icon('moon')}<span>第 ${state.day} 天 · ${esc(getForecast(state.day,1)[0].name)}</span><b>结束这一天</b>${icon('arrow')}</button>`:''}<footer class="page-footer"><span>一人 · 一屋 · 慢慢生活</span><span>每一次准备，都是对明天的照顾。</span></footer></div>`;
}
function resourceStrip() {
 const d=getDerived(state);
 return `<div class="resource-strip">${[
 ['box','食物储备',`${number(d.foodDays)}<small> 天</small>`,'把好吃的留下来'],
 ['water','生活用水',`${number(state.inventory.water)}<small> / ${number(d.waterCapacity)} L</small>`,'饮用、种植与喂养'],
 ['bolt','蓄电余量',`${number(state.inventory.power)}<small> / ${number(d.powerCapacity)}</small>`,'阳光，也可以存起来'],
 ['heart','家的舒适',`${number(d.comfort)}<small> 分</small>`,'日子不只有生存']
 ].map(([i,label,value,note])=>`<div class="resource"><span class="resource-icon ${i}">${icon(i)}</span><div><span>${label}</span><strong>${value}</strong><small class="resource-note">${note}</small></div></div>`).join('')}</div>`;
}
function hero(mode='shop') {
 const prep=state.phase==='prep';
 return `<section class="hero ${mode==='home'?'home-hero':''}"><div class="hero-copy"><div class="eyebrow"><span></span>${prep?'末日前的采购时光':'属于你的小小世界'}</div><h1>${prep?'把以后，准备成<br>喜欢的日子。':`今天，也好好生活。`}</h1><p>${prep?'存一点食物，种一点希望。<br>从一张采购单开始，安顿未来的自己。':'菜在生长，水箱在等待下一场雨。<br>关上院门，把日子过得有声有色。'}</p><div class="hero-tag">${icon('leaf')}${prep?'不用赶时间，准备好了再出发。':`第 ${state.day} 天 · ${esc(getForecast(state.day,1)[0].name)} · ${getForecast(state.day,1)[0].temperature}°C`}</div></div><div class="scene-wrap">${renderScene(state,{compact:mode==='shop'})}<span class="scene-caption">${prep?'你的院子，会随着准备慢慢丰盛':'点击小院里的区域，照看你的生活'}</span></div></section>`;
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
 return `<div class="facility ${has?'':'unbuilt'}"><span>${esc(i.icon)}</span><div><b>${esc(i.name)}</b><p>${has?esc(i.detail):'尚未安置'}</p>${has&&cycle&&state.phase==='survival'?`<small class="animal-progress">本轮照料 ${state.livestock[id]} / ${cycle} 天 · ${state.settings.autoCare?'每天自动照料':'等待手动照料'}</small>`:''}</div>${pill(has?'已安置':'未购入',has?'green':'')}</div>`;
}
function home() {
 return `${hero('home')}${resourceStrip()}${state.phase==='prep'?`<div class="notice">${icon('leaf')}<div><b>先把家准备好，再开始新的日子。</b><span>购入的设施会出现在院子里。种植与生产将在关门后开始。</span></div><button class="secondary" data-action="nav" data-view="shop">继续采购 ${icon('arrow')}</button></div>`:''}${gardens()}<div class="two-panels"><section class="panel" id="water-section"><div class="section-heading"><h2>水与电，心里的底气</h2>${icon('bolt')}</div>${['rain','filter','tank','solar','battery','generator'].map(facilityCard).join('')}<div class="toggle-row"><label for="generator-setting">允许燃油发电<small>按需补电，会消耗储备燃料</small></label><input class="switch" id="generator-setting" type="checkbox" data-setting="generator" ${state.settings.generator?'checked':''} ${state.phase==='prep'||!state.facilities.generator?'disabled':''} /></div></section><section class="panel" id="animals-section"><div class="section-heading"><h2>院子里的小住户</h2>${icon('heart')}</div>${['coop','ducks','pond'].map(facilityCard).join('')}<div class="toggle-row"><label for="care-setting">每天自动浇水与喂养<small>水或饲料不够时，生产会暂停</small></label><input class="switch" id="care-setting" type="checkbox" data-setting="autoCare" ${state.settings.autoCare?'checked':''} ${state.phase==='prep'?'disabled':''}/></div>${!state.settings.autoCare&&state.phase==='survival'?`<button class="secondary full manual-care" data-action="care" ${state.lastCareDay===state.day?'disabled':''}>${state.lastCareDay===state.day?'今天已经照料过了':'现在给小院浇水、喂食'}</button>`:''}<div class="home-kitchen" id="home-section"><span>🍲</span><h3>好好吃饭，就是好好生活</h3><p>有炉具时，用 2 份蔬菜、1 份蛋或鱼、1 L 燃料，做出 6 份耐储熟食；3 天内舒适度 +10。</p><button class="secondary full" data-action="cook" ${state.phase==='prep'||!state.facilities.stove||state.lastCookDay===state.day?'disabled':''}>${state.lastCookDay===state.day?'今天已经好好吃过饭':!state.facilities.stove?'还没有安置灶台':'今天做一锅热饭'}</button></div>${state.facilities.fridge?`<div class="toggle-row"><label for="fridge-setting">让冰箱保持运行<small>${esc(byId('fridge').detail)}</small></label><input class="switch" id="fridge-setting" type="checkbox" data-setting="fridge" ${state.settings.fridge?'checked':''} ${state.phase==='prep'?'disabled':''}/></div>`:''}</section></div>`;
}
function dayPanel() {
 const forecasts=getForecast(state.day,3),d=getDerived(state);
 return `<section class="today-card"><span class="eyebrow">日子一页页翻过</span><div class="day-number">${String(state.day).padStart(2,'0')}<span>天</span></div><h3>${state.day===1?'新的生活，从今天开始。':'院门以内，生活照常。'}</h3><p>完成今天的安排后，再让时间前进。</p><button class="primary full" data-action="next-day">${icon('moon')} 过完这一天 ${icon('arrow')}</button><small>今日预计消耗 ${d.dailyNeeds.food} 份食物 · ${d.dailyNeeds.water} L 水</small></section><section class="forecast-card"><div class="section-heading"><h3>未来三天天气</h3>${icon('sun')}</div>${forecasts.map((f,n)=>`<div class="forecast-row"><span>${n===0?'今天':n===1?'明天':'后天'}<small>第 ${state.day+n} 天</small></span><span class="weather-icon">${esc(f.icon)}</span><b>${esc(f.name)}<small>${f.temperature}°C · 日照 ${Math.round(f.sun*100)}%<br>${f.rain?`雨量 ${f.rain} mm`:'无雨'}</small></b></div>`).join('')}<p class="fine-print">晴天蓄电，雨天存水。提前安排，心里不慌。</p></section><section class="milestone-card"><span class="eyebrow">慢慢扎下根来</span><h3>${state.day>30?'这里，已经是家了':'在小院生活 30 天'}</h3><div class="progress"><span style="width:${Math.min(100,(state.day-1)/30*100)}%"></span></div><p>已度过 ${state.day-1} 天 · 收获 ${state.stats.harvests} 次</p>${state.stats.assists?`<small>收到应急补给 ${state.stats.assists} 次</small>`:''}</section>`;
}
function inventory() {
 return `${pageHeading('家里有这些，就很安心。','一格一格存下的，是未来的每一个普通日子。')}${resourceStrip()}<section class="panel"><div class="section-heading"><h2>储备一览</h2>${pill('每天结算 · 实时记录')}</div><div class="inventory-grid">${Object.entries(RESOURCE_META).filter(([key])=>key in state.inventory).map(([key,m])=>`<div class="inventory-item"><span>${esc(m.icon)}</span><div><h3>${esc(m.name)}</h3><strong>${number(state.inventory[key])}<small> ${esc(m.unit)}</small></strong></div></div>`).join('')}</div></section><section class="panel"><div class="section-heading"><h2>已经安置好的设施</h2><span class="muted">家的每一部分，都有来处</span></div><div class="owned-grid">${ITEMS.filter(i=>i.kind==='facility'&&state.facilities[i.id]).map(i=>`<article><span>${esc(i.icon)}</span><h3>${esc(i.name)} ${state.facilities[i.id]>1?`×${state.facilities[i.id]}`:''}</h3><p>${esc(i.detail)}</p></article>`).join('')||'<p class="muted">家里还有很多空位，等你慢慢添置。</p>'}</div></section>`;
}
function journal() {
 return `${pageHeading('那些平凡的日子，值得记下。','第一棵菜、第一枚蛋，和末日里一碗热腾腾的饭。')}<div class="journal-banner">${icon('book')}<div><h3>小院生活手记</h3><p>度过 ${Math.max(0,state.day-1)} 天 · 收获 ${state.stats.harvests} 次 · 应急补给 ${state.stats.assists} 次</p></div><button class="secondary" data-action="export">把回忆存下来 ${icon('down')}</button></div><div class="journal-list">${[...state.logs].map(l=>`<article class="journal-entry"><span class="journal-date">${l.day?`DAY ${String(l.day).padStart(2,'0')}`:'序章'}</span><div><h3>${esc(l.title)}</h3><p>${esc(l.text)}</p></div><span class="journal-stamp">${l.kind==='harvest'?'✳':'✧'}</span></article>`).join('')||'<div class="empty-state">故事还没开始，先为自己添置一点东西吧。</div>'}</div>`;
}
function render() {
 const content={shop,home,inventory,journal}[view]();
 const aside=state.phase==='prep'?(view==='shop'?cartPanel():`<section class="return-card"><span>🌱</span><h2>小院慢慢丰盛起来</h2><p>准备金还有 ${money(state.money)}，继续挑些未来用得上的东西吧。</p><button class="primary full" data-action="nav" data-view="shop">翻开采购手册 ${icon('arrow')}</button><button class="secondary full" data-action="start">准备好了，关上院门</button></section>`):dayPanel();
 app.innerHTML=shell(content,aside);
}
function guide() {
 modal('欢迎，未来的小院主人。',`<p class="lead">你有 30,000 元准备金、一栋小房子，以及足够慢慢挑选的时间。</p><div class="guide-step"><b>01</b><div><h3>为未来采购</h3><p>商品写明了价格、用途和每日消耗。可以多次结算，设备自动安置；购物车里的东西尚未买入。基础清单提供一套水电与种植起步方案。</p></div></div><div class="guide-step"><b>02</b><div><h3>准备好了，就关上院门</h3><p>此后无法继续购物，剩余的钱会留作纪念。没有准备倒计时，可以先看检查提示再出发。</p></div></div><div class="guide-step"><b>03</b><div><h3>照顾一个能长久生活的家</h3><p>点击空菜地播种，成熟后手动收获。默认每天自动照料作物与动物。每天按“过完这一天”才结算消耗、发电、集雨与生产，离开页面不会流逝时间。</p></div></div><div class="guide-step"><b>04</b><div><h3>给日子留一点余地</h3><p>天气和生产有固定规则，三日预报可提前安排。缺水缺粮时会收到少量应急补给，并记入手记；作物和动物暂停生产，方便你继续调整。度过 30 天后可以一直生活下去。</p></div></div><p class="soft-note">进度保存在当前浏览器。换设备、清理浏览器前，请导出存档；在另一个浏览器导入即可接着玩。</p>`,`<button class="primary" data-action="close">知道啦，慢慢来 ${icon('leaf')}</button>`);
}
function startConfirm() {
 if(cartCount()){toast('购物袋里还有东西，先采购安置，或清空后再关门。');view='shop';render();return;}
 const d=getDerived(state);
 modal('把院门关上，把生活留下。',`<p>准备金还剩 <b>${money(state.money)}</b>。关门后商店将停止营业，种植、养殖与每日生活开始运转。</p><div class="confirm-checks">${d.checks.map(c=>`<p class="${c.ok?'positive':'muted'}">${c.ok?'✓':'○'} ${esc(c.label)} <small>${esc(c.hint)}</small></p>`).join('')}</div><p class="soft-note">${d.checks.every(c=>c.ok)?'看起来，已经有了好好生活的底气。':'还有一些准备尚未完成。你可以回去补充，也可以带着现有的东西开始。'}</p>`,`<button class="secondary" data-action="close">再看看</button><button class="primary" data-action="confirm-start">开始宅家生活 ${icon('arrow')}</button>`);
}
function nextDay() {
 const before=state, result=advanceDay(state);
 if(result.error){toast(result.error);return;}
 state=result.state;persist();render();
 const changes=Object.entries(RESOURCE_META).filter(([k])=>Math.abs((state.inventory[k]||0)-(before.inventory[k]||0))>.01).map(([k,m])=>{const diff=state.inventory[k]-before.inventory[k];return `<div class="day-change"><span>${esc(m.icon)} ${esc(m.name)}</span><b class="${diff>0?'positive':'used'}">${diff>0?'+':''}${number(diff)} ${esc(m.unit)}</b></div>`}).join('');
 const entries=[{title:result.report.title,text:[result.report.text,...result.report.events].join('\n')}];
 modal(state.day===31?'三十天过去，这里已经是家。':'晚安，小院。',`<p class="lead">第 ${before.day} 天 · ${esc(getForecast(before.day,1)[0].name)}<br><small>明天是第 ${state.day} 天，新的生活继续。</small></p><div class="day-changes">${changes||'<p>储备没有变化。</p>'}</div><div class="report-entries">${entries.map(l=>`<p><b>${esc(l.title)}</b><span>${esc(l.text)}</span></p>`).join('')}</div>${state.day===31?'<p class="soft-note">这一页结束了，但日子没有。你可以继续照看小院，等下一批菜长大。</p>':''}`,`<button class="primary" data-action="close">${state.day===31?'继续过我的小日子':'迎接新的一天'} ${icon('sun')}</button>`);
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
 case 'starter':cart=Object.fromEntries(Object.entries(STARTER_CART).map(([key,q])=>[key,Math.max(0,q-(byId(key)?.kind==='facility'?(state.facilities[key]||0):0))]).filter(([,q])=>q>0));render();toast('基础清单已装入购物袋，可以按喜好增减。');break;
 case 'checkout':if(commit(buyCart(state,cart),'东西都带回家了。小院又踏实了一点。')){cart={};render();}break;
 case 'start':startConfirm();break;
 case 'confirm-start':dialog.close();if(commit(startGame(state))){view='home';render();window.scrollTo({top:0,behavior:'instant'});}break;
 case 'plant':commit(act(state,{type:'plant',plot:Number(button.dataset.plot),crop:button.dataset.crop}));break;
 case 'harvest':commit(act(state,{type:'harvest',plot:Number(button.dataset.plot)}));break;
 case 'care':commit(act(state,{type:'care'}));break;
 case 'cook':commit(act(state,{type:'cook'}));break;
 case 'next-day':nextDay();break;
 case 'close':dialog.close();break;
 case 'guide':guide();break;
 case 'export':exportSave();break;
 case 'save-menu':modal('把这段日子，好好收着。',`<p>小院会自动保存在当前浏览器，离线时间不会推进游戏。导出文件可以备份进度，也可以带到另一台设备。</p><div class="save-actions"><button class="secondary" data-action="export">${icon('down')} 导出当前存档</button><button class="secondary" data-action="import">${icon('upload')} 导入已有存档</button></div><div class="reset-area"><h3>想从头布置另一个小院？</h3><p>重新开始会替换当前进度，建议先导出存档。</p><button class="text-button danger" data-action="reset">重新开始</button></div>`);break;
 case 'import':document.querySelector('#save-file').click();break;
 case 'confirm-import':if(imported){state=imported;imported=null;cart={};view=state.phase==='prep'?'shop':'home';const saved=persist();render();dialog.close();if(saved)toast('熟悉的小院，欢迎回来。');}break;
 case 'reset':modal('重新开始一段生活？','<p>当前小院将被新的准备期替换。如果还想保留它，可以先导出存档。</p>','<button class="secondary" data-action="export">先导出存档</button><button class="danger-button" data-action="confirm-reset">确认重新开始</button>');break;
 case 'confirm-reset':state=createGame();cart={};view='shop';category='all';search='';if(persist())toast('新的小院，新的期待。');render();dialog.close();break;
 }
});
document.addEventListener('change',event=>{
 if(event.target.dataset.setting)commit(act(state,{type:'settings',key:event.target.dataset.setting,value:event.target.checked}));
});
document.addEventListener('keydown',event=>{const target=event.target.closest('[data-scene]');if(target&&(event.key==='Enter'||event.key===' ')){event.preventDefault();target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
document.addEventListener('input',event=>{if(event.target.id==='search'){const pos=event.target.selectionStart;search=event.target.value;render();const field=document.querySelector('#search');field.focus();field.setSelectionRange(pos,pos);}});
document.querySelector('#save-file').addEventListener('change',async event=>{
 const file=event.target.files[0];if(!file)return;
 try {if(file.size>1048576)throw new Error('存档文件太大了，请选择小院导出的 JSON 文件。');imported=importGame(await file.text());modal('找到了你的另一座小院。',`<p>这是${imported.phase==='prep'?'准备期':`第 ${imported.day} 天`}的存档，准备金 ${money(imported.money)}。导入后会替换当前进度。</p>`,'<button class="secondary" data-action="close">暂不导入</button><button class="primary" data-action="confirm-import">确认恢复存档</button>');}catch(error){toast(error.message||'这个文件不是有效的小院存档。');}event.target.value='';
});
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
render();
if(boot.warning)setTimeout(()=>toast(boot.warning),250);
