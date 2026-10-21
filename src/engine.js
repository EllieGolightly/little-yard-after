import { ITEMS, CROPS, RESOURCE_META, WEATHER, DIFFICULTIES, FOODS, RECIPES, ANIMAL_RULES, ACTIVITIES, STARTER_CART, HARD_STARTER_CART, SEASON_LENGTH, SEASONS, BROADCASTS, CHAPTERS, CHAPTER_MILESTONES, WISHES, NEIGHBORS, NEIGHBOR_REQUESTS, BOND_LEVELS, bondLevel, DECORATIONS, FESTIVALS, ENDINGS } from './data.js';
import { validateLegacy } from './legacy.js';

const items=Object.fromEntries(ITEMS.map(i=>[i.id,i]));
const crops=Object.fromEntries(CROPS.map(i=>[i.id,i]));
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const clone=s=>structuredClone(s);
const round=n=>Math.round(n*100)/100;
const has=(s,k)=>Boolean(s.facilities[k]);
const fail=(state,error)=>({state,error});
const totalFood=s=>round(Object.entries(FOODS).reduce((n,[k,f])=>n+s.inventory[k]*f.nutrition,0));
const addLog=(s,title,text,kind='note')=>{s.logs.unshift({day:s.day,title,text,kind});s.logs=s.logs.slice(0,120);};
const finite=(n,min=0,max=1000000)=>Number.isFinite(n)&&n>=min&&n<=max&&Math.abs(n-round(n))<1e-7;
const eggKeys=['eggs','chickenEggs','duckEggs'];
const available=(s,k)=>round(s.inventory[k]-(s.mealPlan[k]||0));
const emptyAnimals=()=>({coop:{female:0,male:0,cycle:0,young:[],incubating:[],expansions:0},ducks:{female:0,male:0,cycle:0,young:[],incubating:[],expansions:0},pond:{adults:0,young:[],expansions:0}});
const emptyNeighbors=()=>({met:[],bond:Object.fromEntries(NEIGHBORS.map(n=>[n.id,0])),requests:{},activeSince:{},tradesLeft:Object.fromEntries(NEIGHBORS.map(n=>[n.id,0])),giftLeft:Object.fromEntries(NEIGHBORS.map(n=>[n.id,0])),helped:0,traded:0,gifted:0});
const emptyDiscovered=()=>({crops:[],recipes:[],animals:[]});
const emptyDecorations=()=>Object.fromEntries(DECORATIONS.map(d=>[d.id,0]));
const emptyFestivals=()=>({});
const emptyEnding=()=>({unlocked:false,choice:null,seenAt:null});
// 图鉴：记录已发现的条目
export function getCollection(s){
 const d=s.discovered||emptyDiscovered();
 return {
  crops:CROPS.map(c=>({id:c.id,name:c.name,icon:c.icon,found:d.crops.includes(c.id),hint:`收获后记录 · ${c.days} 天成熟`})),
  recipes:RECIPES.map(r=>({id:r.id,name:r.name,icon:r.icon,found:d.recipes.includes(r.id),hint:'亲手做过一次'})),
  animals:Object.entries(ANIMAL_RULES).map(([id,r])=>({id,name:r.name,icon:r.icon,found:(d.animals||[]).includes(id),hint:'繁育过一次'})),
  neighbors:NEIGHBORS.map(n=>({id:n.id,name:n.name,icon:n.icon,found:(s.neighbors.met||[]).includes(n.id),hint:'在日子里相遇'})),
 };
}
export function getCollectionCount(s){const c=getCollection(s);return Object.values(c).flat().filter(x=>x.found).length;}
export function getCollectionTotal(s){return Object.values(getCollection(s)).flat().length;}
// 结局标题：根据关系、收集、援助给出收尾
export function getEndingTitle(s){
 const totalBond=NEIGHBORS.reduce((n,d)=>n+(s.neighbors.bond[d.id]||0),0);
 const found=getCollectionCount(s);
 if(s.ending.choice==='return'){
  if(totalBond>=180)return '归来：小镇的灯，有一盏是为你留的';
  if(s.stats.assists===0)return '归来：一个人走了很远，终于回到人群';
  return '归来：带着一座小院的故事，回到小镇';
 }
 if(totalBond>=180)return '留下：这里有了一整片新的家人';
 if(found>=14)return '留下：把这片土地，一寸一寸地过熟';
 if(s.stats.assists===0)return '留下：一个人，也把日子过成了家';
 return '留下：小院之后，日子还长';
}
// 某邻居当前每日可交换次数：好感越高，次数越多
export function getTradesLeft(s,id){
 const bond=s.neighbors?.bond[id]||0;
 return bond>=70?4:bond>=40?3:bond>=20?2:2;
}
function populate(s,id){if(id==='coop'||id==='ducks'){s.animals[id].female=2;s.animals[id].male=1;}if(id==='pond')s.animals.pond.adults=10;}

export function createGame(options={}) {
 const difficulty=DIFFICULTIES.find(d=>d.id===options.difficulty)||DIFFICULTIES[1];
 const inventory=Object.fromEntries(Object.keys(RESOURCE_META).map(k=>[k,0]));
 Object.assign(inventory,{food:7,water:35,seeds:6,materials:4});
 return {version:5,phase:'prep',day:0,difficulty:difficulty.id,initialMoney:difficulty.money,money:difficulty.money,assistance:options.assistance??difficulty.assistance,
 inventory,facilities:{},plots:[{crop:null,progress:0}],settings:{generator:true,fridge:true,autoCare:true,cookPower:'auto',heatPower:'auto',seasons:true,neighbors:true},animals:emptyAnimals(),neighbors:emptyNeighbors(),
 discovered:emptyDiscovered(),decorations:emptyDecorations(),festivals:emptyFestivals(),ending:emptyEnding(),
 health:100,energy:80,mealPlan:{},lastMealPlan:{},activitiesDone:[],tidyDays:0,salvageLeft:8,mealBonus:0,festivalGlow:0,lastCareDay:null,lastAidDay:null,
 fridgeRunning:false,lightsOn:false,milestoneSeen:false,ended:false,migratedFrom:null,
 chapter:{heard:{},milestones:{}},wishes:{season:'spring',done:{},allDone:false},
 seasonStats:{plantings:0,harvests:0,meals:0,births:0,aidFree:0,heartyMeal:0},coldToday:false,
 stats:{days:0,harvests:0,assists:0,mealsCooked:0,births:0,noAidStreak:0,bestNoAidStreak:0,foodGroups:[],meatHarvests:0},
 logs:[{day:0,title:'小院的钥匙',text:`${difficulty.name} · 准备金 ¥${difficulty.money}。先平安生活 30 天，再慢慢把小院过成家。已有 7 份口粮、35 L 水、6 袋种子、4 份材料和一块地。`,kind:'story'}]};
}
export function getStarterCart(s){return clone(s.difficulty==='hard'?HARD_STARTER_CART:STARTER_CART);}
export function getSeasonIndex(day){return Math.floor((Math.max(1,Math.floor(day))-1)/SEASON_LENGTH)%SEASONS.length;}
export function getSeason(day){return SEASONS[getSeasonIndex(day)];}
function applySeason(base,seasonIndex,day){
 const s=SEASONS[seasonIndex];
 const rain=Math.round(base.rain*s.rainFactor);
 const winter=seasonIndex===3, snowy=winter&&rain>0;
 return {name:snowy?'雪天':base.name,icon:snowy?'🌨️':base.icon,rain,
  sun:round(Math.min(1.1,base.sun*s.sunFactor)),temperature:base.temperature+s.tempDelta,season:s.id};
}
export function getForecast(day,count=3){const start=Math.max(1,Math.floor(day)||1);return Array.from({length:Math.max(0,Math.min(90,Math.floor(count)||0))},(_,n)=>{const d=start+n;return applySeason(WEATHER[(d-1)%WEATHER.length],getSeasonIndex(d),d);});}
export function getCropDuration(s,c){const d=typeof c==='string'?crops[c]:c;return d?Math.max(2,d.days-(has(s,'greenhouse')?1:0)):0;}
export function getAnimalInfo(s,id){
 const a=s.animals[id],r=ANIMAL_RULES[id];if(!a||!r)return null;
 const adult=id==='pond'?a.adults:a.female+a.male;
 const young=a.young.reduce((n,b)=>n+(id==='pond'?b.count:b.female+b.male),0);
 const eggs=id==='pond'?0:a.incubating.reduce((n,b)=>n+b.count,0);
 return {adult,young,eggs,total:adult+young+eggs,capacity:r.capacity+a.expansions*(id==='pond'?8:4),
 feed:round(adult*r.feed+young*(id==='pond'?.1:.25)),water:round(adult*r.water+young*.25),canBreed:id==='pond'?adult>=2:a.female>0&&a.male>0};
}
export function getDerived(s){
 const w=getForecast(s.day,1)[0];const season=getSeason(s.day);
 const personalWater=w.temperature>=30&&!has(s,'insulation')?6:4;
 const winter=getSeasonIndex(s.day)===3;
 const cropWater=s.plots.reduce((n,p)=>n+(p.crop&&p.progress<getCropDuration(s,p.crop)?crops[p.crop].water:0),0);
 const animalWater=Object.keys(ANIMAL_RULES).reduce((n,k)=>n+getAnimalInfo(s,k).water,0);
 const feed=Object.keys(ANIMAL_RULES).reduce((n,k)=>n+getAnimalInfo(s,k).feed,0);
 const careWater=s.lastCareDay===s.day?0:round(cropWater+animalWater);
 let comfort=35;for(const [k,n]of Object.entries({books:8,bed:10,radio:5,insulation:7,rug:6,stove:4}))if(has(s,k))comfort+=n;
 if(has(s,'lamp')&&(s.lightsOn||s.inventory.power>=.2))comfort+=5;if(s.mealBonus>0)comfort+=5;if(totalFood(s)>=7)comfort+=5;if(s.inventory.water>=28)comfort+=5;
 if(winter&&has(s,'heater')&&!s.coldToday)comfort+=5;
 if(s.coldToday&&s.settings.seasons)comfort-=15;
 for(const d of DECORATIONS)comfort+=(s.decorations?.[d.id]||0)*d.comfort;
 comfort+=s.festivalGlow||0;
 const dailyWater=round(personalWater+(s.settings.autoCare?careWater:0));
 return {waterCapacity:has(s,'tank')?400:80,powerCapacity:has(s,'battery')?12:0,season,comfort:Math.min(100,Math.max(0,comfort)),plots:s.plots.length,foodDays:Math.floor(totalFood(s)),totalFood:totalFood(s),waterDays:Math.floor(s.inventory.water/Math.max(1,dailyWater)),cropWater,animalWater,
 dailyNeeds:{food:1,water:dailyWater,personalWater,careWater,feed:s.settings.autoCare&&s.lastCareDay!==s.day?feed:0,power:round((has(s,'fridge')&&s.settings.fridge?1.2:0)+(has(s,'lamp')?.2:0))},
 checks:[
 {label:'一周口粮',ok:totalFood(s)>=7,hint:`约 ${Math.floor(totalFood(s))} 天正常食量，含需烹饪的食材。`},
 {label:'储水缓冲',ok:s.inventory.water>=40,hint:`现有 ${s.inventory.water} L；个人每日 4–6 L，生产另计。`},
 {label:'持续水源',ok:has(s,'filter')&&(has(s,'rain')||has(s,'well')),hint:'集雨器或浅井，配合净水器持续补水。'},
 {label:'长期供电',ok:has(s,'battery')&&(has(s,'solar')||(has(s,'generator')&&s.inventory.fuel>0)),hint:'太阳能或发电机搭配蓄电池；烹饪也可以用电。'},
 {label:'可用厨房',ok:has(s,'stove')&&(s.inventory.power>=.3||s.inventory.fuel>=.1),hint:'两用灶台 + 电或燃料；生米、土豆、蛋和肉需要烹饪。'},
 {label:'动物口粮',ok:feed===0||s.inventory.feed>=feed*7,hint:feed?`目前每日需 ${feed} 份饲料，繁育后消耗随数量增加。`:'尚无动物，可以选择种植为主的生活。'}]};
}
export function getMealPreview(s,plan=s.mealPlan){
 let nutrition=0;const groups=new Set();let cooked=false;
 for(const[k,q]of Object.entries(plan)){if(!FOODS[k]||q<=0)continue;nutrition+=q*FOODS[k].nutrition;groups.add(FOODS[k].group);if(RECIPES.some(r=>r.output===k))cooked=true;}
 nutrition=round(nutrition);
 const diverse=groups.has('混合')||groups.size>=3;
 const healthChange=nutrition<1?-Math.ceil((1-nutrition)*12):1+(diverse?2:0);
 const recovery=Math.round(18+getDerived(s).comfort*.12+Math.min(nutrition,1.25)*20+(has(s,'bed')?5:0));
 return {nutrition,groups:[...groups],diverse,cooked,healthChange,recovery,label:nutrition===0?'今天不吃':nutrition<.6?'食量偏少':nutrition<1?'略省着吃':nutrition<=1.3?'吃得刚好':'吃得丰盛',target:1};
}
export function getObjectives(s){return [
 {id:'survive',name:'先平安度过 30 天',detail:`已生活 ${s.stats.days} / 30 天，保持健康大于 0。`,done:s.stats.days>=30&&s.milestoneSeen},
 {id:'harvest',name:'第一次把收获带回家',detail:`已收获 ${s.stats.harvests} 次。`,done:s.stats.harvests>0},
 {id:'meal',name:'给自己做三次饭',detail:`已烹饪 ${s.stats.mealsCooked} 次。`,done:s.stats.mealsCooked>=3},
 {id:'birth',name:'迎接新的小生命',detail:`已诞生 ${s.stats.births} 只幼崽或鱼苗。`,done:s.stats.births>0},
 {id:'steady',name:'连续七天不靠援助',detail:`最长 ${s.stats.bestNoAidStreak} / 7 天。`,done:s.stats.bestNoAidStreak>=7},
 ];}
export function buyCart(s,cart){
 if(s.phase!=='prep')return fail(s,'关上院门后不再购物，可以利用材料和繁育继续建设。');
 if(!cart||typeof cart!=='object'||Array.isArray(cart))return fail(s,'购物袋格式不正确。');
 const next=clone(s);let cost=0;const entries=Object.entries(cart);
 if(!entries.some(([,q])=>q>0))return fail(s,'先选几样想带回家的东西吧。');
 for(const[id,q]of entries){if(!own(items,id)||!Number.isSafeInteger(q)||q<0||q>10000)return fail(s,'商品或数量不正确。');const i=items[id];cost+=i.price*q;if(i.kind==='facility'){const count=(next.facilities[id]||0)+q;if(count>i.max)return fail(s,`${i.name}最多安置 ${i.max} 件。`);if(count)next.facilities[id]=count;}}
 if(cost>s.money)return fail(s,`预算还差 ¥${cost-s.money}，调整一下购物袋吧。`);
 for(const[id,q]of entries){if(!q)continue;const i=items[id];for(const dep of i.requires||[])if(!has(next,dep))return fail(s,`${i.name}需要搭配${items[dep].name}，可以一起购买。`);if(i.kind==='supply')next.inventory[i.resource]=round(next.inventory[i.resource]+i.amount*q);if(id==='battery')next.inventory.power=8;if(ANIMAL_RULES[id]&&!has(s,id))populate(next,id);}
 if(next.inventory.water>getDerived(next).waterCapacity)return fail(s,`购买后有 ${next.inventory.water} L 水，超过容量；请减少饮用水或加购储水箱。`);
 while(next.plots.length<1+(next.facilities.planter||0))next.plots.push({crop:null,progress:0});next.money-=cost;addLog(next,'又安心了一些',`物资与设施都安置好了，花费 ¥${cost}。`,'purchase');return {state:next,message:'东西带回家了，小院又踏实了一点。'};
}
export function startGame(s){if(s.phase!=='prep')return fail(s,'小院生活已经开始。');const n=clone(s);n.phase='survival';n.day=1;addLog(n,'门关上，日子开始','先平安度过 30 天。今天可以播种、安排餐食，或者为未来扩建。结束一天前，记得看看餐桌。','story');return {state:n,message:'欢迎回家。第一天，先给自己安排一顿饭。'};}
function spendEnergy(s,n){if(s.energy+1e-8<n)return '精力不够了，先休息，或留到明天再做。';s.energy=round(s.energy-n);return null;}
function care(s,events){
 if(s.lastCareDay===s.day)return;const reserve=getDerived(s).dailyNeeds.personalWater;
 for(const[id,r]of Object.entries(ANIMAL_RULES)){
  if(!has(s,id))continue;const a=s.animals[id],info=getAnimalInfo(s,id);
  if(s.inventory.feed+1e-8<info.feed||s.inventory.water-reserve+1e-8<info.water){events.push(`${r.name}的食水不足，成长与生产暂停，进度保留。`);continue;}
  s.inventory.feed=round(s.inventory.feed-info.feed);s.inventory.water=round(s.inventory.water-info.water);
  const growing=[];for(const b of a.young){b.days++;if(b.days>=r.grow){if(id==='pond')a.adults+=b.count;else{a.female+=b.female;a.male+=b.male;}events.push(`${r.name}的幼崽长大了。`);}else growing.push(b);}a.young=growing;
  if(id!=='pond'){
   const batches=[];for(const b of a.incubating){b.days++;if(b.days>=r.hatch){a.young.push({female:Math.ceil(b.count/2),male:Math.floor(b.count/2),days:0});s.stats.births+=b.count;s.seasonStats.births+=b.count;events.push(`${b.count} 只小${r.name}出壳了，每批尽量均分雌雄，单数多一只母禽。`);}else batches.push(b);}a.incubating=batches;
   const winterCare=getSeasonIndex(s.day)===3&&s.settings.seasons;
   a.cycle++;if(a.cycle>=r.cycle+(winterCare?1:0)){a.cycle=0;if(a.female){const resource=a.male>0?r.egg:'eggs';s.inventory[resource]+=a.female;events.push(`收到了 ${a.female} 枚${RESOURCE_META[resource].name}。`);}}
  }
 }
 const winterField=getSeasonIndex(s.day)===3&&s.settings.seasons;
 if(winterField)events.push('冬天，菜地在休眠，等春天再生长。');
 for(const[pIndex,p]of s.plots.entries()){const c=crops[p.crop];if(!c||p.progress>=getCropDuration(s,c)||winterField)continue;if(s.inventory.water-reserve+1e-8<c.water){events.push(`${pIndex+1} 号菜地缺水，生长暂停。`);continue;}s.inventory.water=round(s.inventory.water-c.water);p.progress++;if(p.progress>=getCropDuration(s,c))events.push(`${pIndex+1} 号菜地的${c.name}成熟了。`);}
 s.lastCareDay=s.day;
}
function resolveInputs(s,inputs,batch){
 const result={};for(const[key,amount]of Object.entries(inputs)){let needed=round(amount*batch);if(key==='egg'){for(const k of eggKeys){const take=Math.min(available(s,k),needed);if(take>0){result[k]=round(take);needed=round(needed-take);}}if(needed>0)return {error:'鸡鸭蛋不足，种蛋也可用来做饭；已安排上桌的食物不会被挪用。'};}else{if(available(s,key)+1e-8<needed)return {error:`${RESOURCE_META[key].name}不足，需要 ${needed} ${RESOURCE_META[key].unit}（餐桌已预留的部分不挪用）。`};result[key]=needed;}}
 return {inputs:result};
}
function chooseHeat(s,power,fuel){const mode=s.settings.cookPower;if(mode!=='fuel'&&s.inventory.power+1e-8>=power)return {resource:'power',amount:power,name:'电力'};if(mode!=='electric'&&s.inventory.fuel+1e-8>=fuel)return {resource:'fuel',amount:fuel,name:'燃料'};return {error:mode==='electric'?`需要 ${power} kWh 电，可切换为燃料或自动。`:mode==='fuel'?`需要 ${fuel} L 燃料，可切换为电力或自动。`:`需要 ${power} kWh 电或 ${fuel} L 燃料。`};}
export function getRecipePreview(s,id,batch=1){
 const r=RECIPES.find(r=>r.id===id);if(!r||!finite(batch,.01,1000))return {error:'菜谱或份量不正确。'};
 const input=resolveInputs(s,r.inputs,batch),power=round(r.power*batch),fuel=round(r.fuel*batch),heat=chooseHeat(s,power,fuel),energy=round(3+2*batch);
 return {recipe:r,batch,inputs:input.inputs,power,fuel,heat,energy,output:round(r.yield*batch),error:!has(s,'stove')?'需要先安置两用灶台。':input.error||heat.error||(s.energy<energy?'精力不足，可以先休息。':null)};
}
export function suggestMeal(s,target=1){
 const plan={};let need=target;
 const candidates=Object.keys(FOODS).filter(k=>FOODS[k].ready&&s.inventory[k]>0);
 const order=['friedRice','chickenStew','fishSoup','greensDish','vegetables','boiledEgg','boiledPotato','cookedRice','food','noodles','preserves','snacks'];
 // First add a small vegetable/protein side, then fill with a staple or full dish.
 for(const k of ['greensDish','vegetables','boiledEgg']){if(!candidates.includes(k)||need<=.25)continue;const q=Math.min(s.inventory[k],.5);plan[k]=q;need-=q*FOODS[k].nutrition;}
 for(const k of order){if(!candidates.includes(k)||need<=.005)continue;const stock=round(s.inventory[k]-(plan[k]||0));const q=Math.min(stock,Math.ceil(need/FOODS[k].nutrition*100)/100);if(q>0){plan[k]=round((plan[k]||0)+q);need-=q*FOODS[k].nutrition;}}
 return plan;
}
export function act(s,a){
 if(s.phase!=='survival')return fail(s,'开始宅家生活后再安排这些事情吧。');if(s.ended&&a?.type!=='rescue')return fail(s,'健康已经耗尽，可以在总结中选择援助休养或重新开始。');
 if(!a||typeof a!=='object')return fail(s,'操作不正确。');const n=clone(s);let message='';
 if(a.type==='settings'){
  if(['cookPower','heatPower'].includes(a.key)&&['auto','electric','fuel'].includes(a.value))n.settings[a.key]=a.value;
  else if(['generator','fridge','autoCare','seasons','neighbors'].includes(a.key)&&typeof a.value==='boolean')n.settings[a.key]=a.value;
  else return fail(s,'设置内容不正确。');return {state:n,message:'生活安排已保存。'};
 }
 if(a.type==='helpRequest'){
  const req=NEIGHBOR_REQUESTS.find(r=>r.id===a.requestId),nbr=n.neighbors;
  if(!req||!own(nbr.requests,req.id)||nbr.requests[req.id]!=='active')return fail(s,'这条求助已经处理过，或已经过期。');
  const needRes=req.need.resource;
  if(available(n,needRes)+1e-8<req.need.amount)return fail(s,`${RESOURCE_META[needRes].name}不够，需要 ${req.need.amount}（餐桌预留的部分不会被挪用）。`);
  n.inventory[needRes]=round(n.inventory[needRes]-req.need.amount);
  const rewRes=req.reward.resource;
  n.inventory[rewRes]=round(n.inventory[rewRes]+req.reward.amount);
  nbr.bond[req.neighbor]=Math.min(100,nbr.bond[req.neighbor]+req.bond);
  nbr.requests[req.id]='done';nbr.helped++;
  const def=NEIGHBORS.find(d=>d.id===req.neighbor);
  return {state:n,message:`你帮了${def.name}：送出 ${req.need.amount} ${RESOURCE_META[needRes].name}，收到 ${req.reward.amount} ${RESOURCE_META[rewRes].name}，好感 +${req.bond}。`};
 }
 if(a.type==='trade'){
  const def=NEIGHBORS.find(d=>d.id===a.neighbor),nbr=n.neighbors;
  if(!def||!nbr.met.includes(def.id))return fail(s,'还不认识这位邻居。');
  const trade=def.trades[a.tradeIndex];
  if(!trade)return fail(s,'没有这一项交换。');
  if(nbr.tradesLeft[def.id]<=0)return fail(s,'今天和这位邻居的交换次数用完了，明天再来。');
  const giveRes=trade.give.resource;
  if(available(n,giveRes)+1e-8<trade.give.amount)return fail(s,`${RESOURCE_META[giveRes].name}不够，需要 ${trade.give.amount}（餐桌预留的部分不会被挪用）。`);
  n.inventory[giveRes]=round(n.inventory[giveRes]-trade.give.amount);
  const getRes=trade.get.resource;
  n.inventory[getRes]=round(n.inventory[getRes]+trade.get.amount);
  nbr.tradesLeft[def.id]--;nbr.traded++;
  return {state:n,message:`和${def.name}交换：${trade.give.amount} ${RESOURCE_META[giveRes].name} → ${trade.get.amount} ${RESOURCE_META[getRes].name}。`};
 }
 if(a.type==='gift'){
  const def=NEIGHBORS.find(d=>d.id===a.neighbor),nbr=n.neighbors;
  if(!def||!nbr.met.includes(def.id))return fail(s,'还不认识这位邻居。');
  if(nbr.giftLeft[def.id]<=0)return fail(s,'今天已经送过礼了，明天再来。');
  const g=def.gift;
  if(available(n,g.resource)+1e-8<g.amount)return fail(s,`${RESOURCE_META[g.resource].name}不够，需要 ${g.amount}。`);
  n.inventory[g.resource]=round(n.inventory[g.resource]-g.amount);
  nbr.bond[def.id]=Math.min(100,nbr.bond[def.id]+g.bond);
  nbr.giftLeft[def.id]--;nbr.gifted++;
  return {state:n,message:`你送了${def.name} ${g.amount} ${RESOURCE_META[g.resource].name}，好感 +${g.bond}。`};
 }
 if(a.type==='meal'){
  if(!own(FOODS,a.resource)||!FOODS[a.resource].ready||!finite(a.amount)||a.amount>n.inventory[a.resource])return fail(s,'食物或份量不正确，生食材请先烹饪；不能超过现有库存。');
  if(a.amount)n.mealPlan[a.resource]=a.amount;else delete n.mealPlan[a.resource];return {state:n};
 }
 if(a.type==='mealPreset'){
  if(a.mode==='clear')n.mealPlan={};else if(a.mode==='yesterday'){for(const[k,q]of Object.entries(s.lastMealPlan))if(q>s.inventory[k])return fail(s,`昨天的${RESOURCE_META[k].name}不够了，重新搭配一下吧。`);n.mealPlan=clone(s.lastMealPlan);}else if(['light','balanced','hearty'].includes(a.mode))n.mealPlan=suggestMeal(s,{light:.6,balanced:1,hearty:1.4}[a.mode]);else return fail(s,'餐食安排不正确。');return {state:n,message:'餐桌已安排，结束这一天时才实际食用。'};
 }
 if(a.type==='plant'||a.type==='harvest'){
  if(!Number.isInteger(a.plot)||a.plot<0||a.plot>=n.plots.length)return fail(s,'没有这块菜地。');const p=n.plots[a.plot];
  if(a.type==='plant'){if(p.crop||!own(crops,a.crop))return fail(s,'菜地已有作物，或没有这种种子。');const c=crops[a.crop];if(n.inventory.seeds<c.seedCost)return fail(s,'种子不足，可以等其他菜地收获返种。');const e=spendEnergy(n,3);if(e)return fail(s,e);n.inventory.seeds-=c.seedCost;p.crop=c.id;p.progress=0;n.seasonStats.plantings++;message=`${a.plot+1} 号地种下${c.name}，照料 ${getCropDuration(n,c)} 天成熟。`;
  }else{const c=crops[p.crop];if(!c||p.progress<getCropDuration(n,c))return fail(s,'还没有成熟的作物。');const e=spendEnergy(n,2);if(e)return fail(s,e);const amount=c.yield+(has(n,'compost')?2:0);n.inventory[c.resource]+=amount;n.inventory.seeds+=1+(has(n,'seedbox')?1:0);n.stats.harvests++;n.seasonStats.harvests++;n.plots[a.plot]={crop:null,progress:0};if(!n.discovered.crops.includes(c.id))n.discovered.crops.push(c.id);message=`收获 ${amount} 份${RESOURCE_META[c.resource].name}，并留下了下一季的种子。`;}
 }else if(a.type==='cook'){
  const p=getRecipePreview(n,a.recipe,a.batch??1);if(p.error)return fail(s,p.error);for(const[k,q]of Object.entries(p.inputs))n.inventory[k]=round(n.inventory[k]-q);n.inventory[p.heat.resource]=round(n.inventory[p.heat.resource]-p.heat.amount);n.energy=round(n.energy-p.energy);n.inventory[p.recipe.output]=round(n.inventory[p.recipe.output]+p.output);n.stats.mealsCooked++;n.seasonStats.meals++;if(!n.discovered.recipes.includes(a.recipe))n.discovered.recipes.push(a.recipe);message=`${p.recipe.name}做好了：${p.output} 份，消耗${p.heat.name} ${p.heat.amount} ${p.heat.resource==='power'?'kWh':'L'}。可以安排上桌或留在冰箱。`;
 }else if(a.type==='preserve'){
  const f=FOODS[a.resource],amount=a.amount;if(!f?.fresh||!finite(amount,.01)||available(n,a.resource)<amount)return fail(s,'请选足够的鲜食；餐桌预留部分不可用于保存。');if(!has(n,'stove'))return fail(s,'加工保存需要两用灶台。');const heat=chooseHeat(n,round(.4*amount),round(.12*amount));if(heat.error)return fail(s,heat.error);const e=spendEnergy(n,round(4+amount));if(e)return fail(s,e);n.inventory[a.resource]=round(n.inventory[a.resource]-amount);n.inventory[heat.resource]=round(n.inventory[heat.resource]-heat.amount);const result=round(amount*f.nutrition/.5);n.inventory.preserves=round(n.inventory.preserves+result);message=`加工了 ${amount} 份${RESOURCE_META[a.resource].name}，得到 ${result} 份耐储保存食品，食量保持不变。`;
 }else if(a.type==='care'){
  if(n.lastCareDay===n.day)return fail(s,'今天已经照料过了。');const e=spendEnergy(n,5);if(e)return fail(s,e);const events=[];care(n,events);message=`小院照料好了。${events.join('')}`;
 }else if(a.type==='hatch'){
  const r=ANIMAL_RULES[a.species],group=n.animals[a.species];if(!r||a.species==='pond'||!has(n,a.species)||!Number.isInteger(a.count)||a.count<1)return fail(s,'请填写要孵化的种蛋数量。');const info=getAnimalInfo(n,a.species);if(!info.canBreed)return fail(s,'需至少一只公禽与一只母禽作为种禽。');if(info.total+a.count>info.capacity)return fail(s,'圈舍位置不够了，先扩建或调整养殖数量。');if(available(n,r.egg)<a.count)return fail(s,'自家种蛋不够；商店鸡蛋不能孵化。');const e=spendEnergy(n,5);if(e)return fail(s,e);n.inventory[r.egg]-=a.count;group.incubating.push({count:a.count,days:0});if(!n.discovered.animals.includes(a.species))n.discovered.animals.push(a.species);message=`留下 ${a.count} 枚${r.name}种蛋，照料 ${r.hatch} 天后出壳，再照料 ${r.grow} 天长大。`;
 }else if(a.type==='breedFish'){
  const info=getAnimalInfo(n,'pond');if(!has(n,'pond')||!info.canBreed)return fail(s,'至少保留 2 条成鱼才能繁育。');if(info.total+4>info.capacity)return fail(s,'鱼池位置不够了，先捕捞或扩建。');if(n.inventory.feed<2)return fail(s,'繁育一批鱼苗需要 2 份饲料。');if(n.activitiesDone.includes('breedFish'))return fail(s,'今天已经繁育过一批鱼苗。');const e=spendEnergy(n,6);if(e)return fail(s,e);n.inventory.feed-=2;n.animals.pond.young.push({count:4,days:0});n.stats.births+=4;n.seasonStats.births+=4;n.activitiesDone.push('breedFish');if(!n.discovered.animals.includes('pond'))n.discovered.animals.push('pond');message='4 条小鱼苗住进了鱼池，照料 6 天后长大。';
 }else if(a.type==='butcher'||a.type==='catch'){
  const id=a.type==='catch'?'pond':a.species;if(!own(ANIMAL_RULES,id)||!has(n,id)||!Number.isInteger(a.count)||a.count<1)return fail(s,'请选择正确的动物和数量。');const g=n.animals[id];const key=id==='pond'?'adults':a.sex;if(!['adults','female','male'].includes(key)||(id==='pond')!==(key==='adults')||g[key]<a.count)return fail(s,'成年动物数量不足。');const e=spendEnergy(n,Math.min(35,4+a.count*2));if(e)return fail(s,e);g[key]-=a.count;const resource=id==='pond'?'fish':'meat';const amount=a.count*ANIMAL_RULES[id].meat;n.inventory[resource]+=amount;n.stats.meatHarvests+=amount;message=`获得 ${amount} 份${RESOURCE_META[resource].name}。${getAnimalInfo(n,id).canBreed?'种群仍可继续繁育。':'剩余种群已不满足繁育条件。'}`;
 }else if(a.type==='activity'){
  const task=ACTIVITIES.find(t=>t.id===a.id);if(!task)return fail(s,'没有这项安排。');if(n.activitiesDone.includes(task.id))return fail(s,'今天已经做过这件事，明天再来。');if(task.requires&&!has(n,task.requires))return fail(s,`需要先安置${items[task.requires].name}。`);if(task.materials&&n.inventory.materials<task.materials)return fail(s,`需要 ${task.materials} 份材料，可以回收院里的闲置物品。`);
  if(task.id==='expandPlot'&&n.plots.length>=4)return fail(s,'小院最多容纳 4 块菜地。');if(task.id==='salvage'&&n.salvageLeft<=0)return fail(s,'院里可拆解的闲置家具已经用完了。');const expansion={expandCoop:'coop',expandDucks:'ducks',expandPond:'pond'}[task.id];if(expansion&&n.animals[expansion].expansions>=2)return fail(s,'这处设施已扩建到最大。');
  const e=spendEnergy(n,task.energy);if(e)return fail(s,e);if(task.materials)n.inventory.materials-=task.materials;n.energy=Math.min(100,n.energy+(task.gain||0));n.health=Math.min(100,n.health+(task.health||0));n.activitiesDone.push(task.id);
  if(task.id==='tidy')n.tidyDays=3;if(task.id==='salvage'){n.inventory.materials+=2;n.salvageLeft--;}if(task.id==='expandPlot'){n.facilities.planter=(n.facilities.planter||0)+1;n.plots.push({crop:null,progress:0});}if(expansion)n.animals[expansion].expansions++;
  message=`${task.name}完成了。${task.gain?`恢复 ${task.gain} 精力、${task.health} 健康。`:task.description}`;
 }else if(a.type==='buildDecoration'){
  const def=DECORATIONS.find(d=>d.id===a.decoration);
  if(!def)return fail(s,'没有这种装饰。');
  if(def.requires&&!has(n,def.requires))return fail(s,`需要先安置${items[def.requires].name}。`);
  if(n.decorations[def.id]>=def.max)return fail(s,'这里已经布置得足够啦。');
  if(n.inventory.materials<def.materials)return fail(s,`材料不够，需要 ${def.materials} 份。`);
  const e=spendEnergy(n,8);if(e)return fail(s,e);
  n.inventory.materials-=def.materials;n.decorations[def.id]++;
  message=`布置了${def.name}，家更舒服了（舒适度 +${def.comfort}）。`;
 }else if(a.type==='celebrateFestival'){
  const f=FESTIVALS.find(x=>x.id===a.festival);
  if(!f||n.festivals[f.id]!=='active')return fail(s,'这个节日还没到，或已经过了。');
  const c=f.cost;
  if(available(n,c.resource)+1e-8<c.amount)return fail(s,`${RESOURCE_META[c.resource].name}不够，需要 ${c.amount}。`);
  n.inventory[c.resource]=round(n.inventory[c.resource]-c.amount);
  if(f.reward.resource)n.inventory[f.reward.resource]=round(n.inventory[f.reward.resource]+(f.reward.amount||0));
  if(f.reward.comfort)n.festivalGlow=Math.max(n.festivalGlow||0,f.reward.comfort);
  n.festivals[f.id]='celebrated';
  message=`过了${f.name}。${f.reward.label||''}${f.reward.comfort?` 接下来的日子里，心里都是暖的。`:''}`;
 }else if(a.type==='chooseEnding'){
  if(!n.ending.unlocked)return fail(s,'还没到做选择的时候。');
  const def=ENDINGS.find(e=>e.id===a.choice);
  if(!def)return fail(s,'没有这个选择。');
  if(n.ending.choice)return fail(s,'你已经做出了选择，这就够了。');
  n.ending.choice=def.id;n.ending.seenAt=n.day;
  message=`你选择了${def.name}。`;
 }else if(a.type==='aid'||a.type==='rescue'){
  if(!n.assistance)return fail(s,'这一局关闭了应急援助。');if(n.lastAidDay===n.day)return fail(s,'今天已经收到过援助。');if(a.type==='rescue'&&!n.ended)return fail(s,'目前还不需要急救休养。');if(a.type==='aid'&&totalFood(n)>=2&&n.inventory.water>=getDerived(n).dailyNeeds.personalWater)return fail(s,'目前还有食水，等储备不足时再申请援助。');n.inventory.food+=7;n.inventory.water=Math.min(getDerived(n).waterCapacity,n.inventory.water+28);n.stats.assists++;n.lastAidDay=n.day;n.stats.noAidStreak=0;if(a.type==='rescue'){n.health=45;n.energy=50;n.ended=false;}message='社区送来 7 份口粮和 28 L 水，已记入援助次数。食物仍需要由你安排上桌。';
 }else return fail(s,'暂不支持这个操作。');
 addLog(n,a.type==='harvest'?'把收获带回家':a.type==='cook'?'今天好好吃饭':'小院里的新安排',message,a.type);return {state:n,message};
}
const stories=['你打开窗，让晨光落在餐桌上。今天要怎么过，由自己决定。','屋子里的东西都有了各自的位置，日子也慢慢有了秩序。','雨点敲着屋檐。水箱里的声音，让人安心。','院里有新的绿意，餐桌上也多了一种期待。','外面很安静，你把热饭端到窗边。','一场雨过去，小院又存下了几天的从容。','看看幼崽和菜地，生活正在悄悄长大。','晚霞落在桌角，今天的安排都成了手记里的一行字。','午后有点热，给自己留一点休息的时间。','雨后的泥土带着清新的气味。明天还会有新的收获。','今天没有大事，认真吃饭、照顾好自己，也很好。','一盏灯，一顿饭，小院已经越来越像一个家。'];
function wishValue(s,metric){
 if(metric==='foodDays')return getDerived(s).foodDays;
 if(metric==='water')return s.inventory.water;
 if(metric==='fuel')return s.inventory.fuel;
 if(metric==='health')return s.health;
 return s.seasonStats[metric]||0;
}
export function getWishes(s,day=s.day){
 const seasonId=getSeason(day).id;
 return (WISHES[seasonId]||[]).map(w=>({...w,season:seasonId,done:Boolean(s.wishes.done[w.metric]),progress:round(wishValue(s,w.metric))}));
}
export function advanceDay(s){
 if(s.phase!=='survival'||s.ended)return fail(s,s.ended?'这一段生活已结束，可以选择援助休养或重新开始。':'先准备好，再关上院门。');
 for(const[k,q]of Object.entries(s.mealPlan))if(q>s.inventory[k])return fail(s,`餐桌预留的${RESOURCE_META[k].name}不够，请重新安排。`);
 const n=clone(s),before=clone(s.inventory),day=s.day,w=getForecast(day,1)[0],d=getDerived(s),events=[],meal=getMealPreview(s);
 const incoming=has(n,'filter')?((has(n,'rain')?w.rain*4:0)+(has(n,'well')?12:0)):0;
 if(incoming){const stored=Math.min(incoming,d.waterCapacity-n.inventory.water);n.inventory.water=round(n.inventory.water+stored);if(stored)events.push(`水箱补充了 ${stored} L 清洁水。`);}
 if(has(n,'solar'))n.inventory.power=round(Math.min(d.powerCapacity,n.inventory.power+w.sun*8));
 if(has(n,'generator')&&n.settings.generator&&n.inventory.power<3&&n.inventory.fuel>=1){n.inventory.fuel=round(n.inventory.fuel-1);n.inventory.power=Math.min(d.powerCapacity,round(n.inventory.power+6));events.push('备用发电消耗 1 L 燃料。');}
 n.fridgeRunning=has(n,'fridge')&&n.settings.fridge&&n.inventory.power>=1.2;if(n.fridgeRunning)n.inventory.power=round(n.inventory.power-1.2);else if(has(n,'fridge')&&n.settings.fridge)events.push('冰箱今天电量不足，未能保鲜。');
 n.lightsOn=has(n,'lamp')&&n.inventory.power>=.2;if(n.lightsOn)n.inventory.power=round(n.inventory.power-.2);
 // 冬季取暖：寒冷天（气温<15°C），有壁炉时按 燃料→干草(饲料)→材料→电 的顺序生火
 n.coldToday=false;
 if(w.temperature<15&&s.settings.seasons){
  const mode=n.settings.heatPower;let heated=false;
  if(mode!=='electric'&&n.inventory.fuel>=1){n.inventory.fuel-=1;heated=true;events.push('壁炉烧了 1 L 燃料，屋里暖烘烘的。');}
  else if(mode!=='electric'&&n.inventory.feed>=2){n.inventory.feed-=2;heated=true;events.push('把 2 份干草（饲料）当柴烧，屋里暖和了一些。');}
  else if(mode!=='electric'&&n.inventory.materials>=2){n.inventory.materials-=2;heated=true;events.push('应急生火用了 2 份材料，屋里暖和了一些。');}
  else if(mode!=='fuel'&&n.inventory.power>=3){n.inventory.power-=3;heated=true;events.push('电取暖用了 3 kWh。');}
  if(!heated){n.coldToday=true;events.push(has(n,'heater')?'壁炉的燃料、干草、材料和电都不够，屋里很冷。':'没有取暖的壁炉，屋里很冷。');}
 }
 if(n.settings.autoCare)care(n,events);
 for(const[k,q]of Object.entries(n.mealPlan))n.inventory[k]=round(n.inventory[k]-q);
 const water=Math.min(n.inventory.water,d.dailyNeeds.personalWater);n.inventory.water=round(n.inventory.water-water);const thirst=water<d.dailyNeeds.personalWater?Math.ceil(18*(1-water/d.dailyNeeds.personalWater)):0;
 if(n.lastAidDay!==day)n.seasonStats.aidFree++;
 if(meal.nutrition>=1.3)n.seasonStats.heartyMeal++;
 const coldHealth=n.coldToday&&n.health>40?-1:0;
 n.health=Math.max(0,Math.min(100,n.health+meal.healthChange-thirst+coldHealth));n.energy=Math.min(100,round(n.energy+meal.recovery));
 if(meal.nutrition<1)events.push(`今天吃了正常食量的 ${Math.round(meal.nutrition*100)}%，健康 ${meal.healthChange}。`);else events.push(`今天吃了正常食量的 ${Math.round(meal.nutrition*100)}%，${meal.diverse?'搭配丰富，':''}健康 +${meal.healthChange}。`);
 if(thirst)events.push(`饮水不足，健康额外 -${thirst}。`);
 n.mealBonus=meal.cooked&&meal.nutrition>=.8?2:Math.max(0,n.mealBonus-1);
 n.festivalGlow=Math.max(0,(n.festivalGlow||0)-1);
 n.stats.foodGroups=[...new Set([...n.stats.foodGroups,...meal.groups])];
 if(!n.fridgeRunning&&day%4===0){for(const[k,f]of Object.entries(FOODS)){if(!f.fresh||n.inventory[k]<=0)continue;const loss=Math.min(n.inventory[k],Math.max(.25,round(n.inventory[k]*(n.tidyDays>0?.1:.25))));n.inventory[k]=round(n.inventory[k]-loss);events.push(`未冷藏的${RESOURCE_META[k].name}损耗 ${loss} 份。`);}}
 n.stats.days++;n.stats.noAidStreak=n.lastAidDay===day?0:n.stats.noAidStreak+1;n.stats.bestNoAidStreak=Math.max(n.stats.bestNoAidStreak,n.stats.noAidStreak);
 n.ended=n.health<=0;const milestone=day===30&&!n.milestoneSeen&&!n.ended;if(milestone){n.milestoneSeen=true;events.push('你平安度过了 30 天。第一段目标完成，接下来可以继续无尽经营。');}
 if(n.ended)events.push('健康耗尽，这一段生活暂停了。存档和小院都还在。');
 // 广播主线《世界在恢复》：需要收音机
 const onAir=BROADCASTS.find(b=>b.day===day);
 if(onAir&&has(n,'radio')&&!n.chapter.heard[day]){n.chapter.heard[day]=true;events.push(`📻 ${onAir.text}`);}
 // 章节节点：时间到了就记录（世界在变化，不依赖收音机）
 for(const cm of CHAPTER_MILESTONES){if(day>=cm.day&&!n.chapter.milestones[cm.id]){n.chapter.milestones[cm.id]=true;events.push(`【${cm.name}】${cm.desc}`);}}
 // 邻里：解锁邻居、激活/过期求助、刷新今日交换次数
 const nb=n.neighbors;
 for(const def of NEIGHBORS){if(day>=def.meetsAt&&!nb.met.includes(def.id)){nb.met.push(def.id);events.push(`🤝 认识了新邻居：${def.name}（${def.title}）。${def.greeting}`);}}
 for(const req of NEIGHBOR_REQUESTS){if(day>=req.day&&nb.met.includes(req.neighbor)&&!own(nb.requests,req.id)){nb.requests[req.id]='active';nb.activeSince[req.id]=day;events.push(`📨 邻居求助：${req.desc}`);}}
 for(const[id,status]of Object.entries(nb.requests)){if(status==='active'&&day-nb.activeSince[id]>=NEIGHBOR_REQUESTS.find(r=>r.id===id).expires)nb.requests[id]='expired';}
 for(const def of NEIGHBORS){if(nb.met.includes(def.id)){nb.tradesLeft[def.id]=getTradesLeft(n,def.id);nb.giftLeft[def.id]=1;}}
 // 节日：到达触发日（年度循环节日按 365 天推算）激活，超出有效窗口则标记错过
 for(const f of FESTIVALS){
  let td=f.day;
  if(f.repeat){const k=Math.floor((day-1)/365);td=f.day+k*365;}
  const inWindow=day>=td&&day<td+f.length;
  if(inWindow&&n.festivals[f.id]!=='celebrated'){if(n.festivals[f.id]!=='active'){n.festivals[f.id]='active';events.push(`🎊 ${f.name}到了：${f.desc}`);}}
  else if(!inWindow&&n.festivals[f.id]==='active')n.festivals[f.id]='missed';
 }
 // 结局：第 180 天道路打通，解锁选择（可继续经营）
 if(day>=180&&!n.ending.unlocked){n.ending.unlocked=true;events.push('道路打通了。是回到小镇，还是留在小院？你可以慢慢想，不急。');}
 // 季节心愿检查
 const seasonId=getSeason(day).id;
 const wishList=WISHES[seasonId]||[];
 for(const wish of wishList){if(!n.wishes.done[wish.metric]&&wishValue(n,wish.metric)>=wish.target){n.wishes.done[wish.metric]=true;n.inventory.materials+=1;events.push(`季节心愿达成：${wish.desc}（+1 材料）`);}}
 // 换季：明天进入新季节，结算上一季并重置
 const nextSeasonId=getSeason(day+1).id;
 if(nextSeasonId!==seasonId){
  if(wishList.every(wish=>n.wishes.done[wish.metric])&&!n.wishes.allDone){n.wishes.allDone=true;n.inventory.materials+=2;n.inventory.seeds+=1;events.push('这个季节的心愿全部完成了！额外 +2 材料、+1 种子。');}
  n.wishes={season:nextSeasonId,done:{},allDone:false};
  n.seasonStats={plantings:0,harvests:0,meals:0,births:0,aidFree:0,heartyMeal:0};
  events.push(`季节更替，进入${getSeason(day+1).name}。`);
 }
 const title=n.ended?'这一段生活，暂时停在这里':milestone?'第三十天，这里已经是家':`第 ${day} 天 · ${w.name}`;const text=stories[(day-1)%stories.length];addLog(n,title,[text,...events].join('\n'),n.ended?'ending':milestone?'milestone':'day');
 n.lastMealPlan=clone(n.mealPlan);n.mealPlan={};n.activitiesDone=[];n.tidyDays=Math.max(0,n.tidyDays-1);n.day++;
 return {state:n,report:{day,weather:w,title,text,events,milestone,ended:n.ended,healthChange:n.health-s.health,energyChange:round(n.energy-s.energy),meal,changes:Object.fromEntries(Object.keys(RESOURCE_META).map(k=>[k,round(n.inventory[k]-before[k])]))}};
}

function migrate(raw){const old=validateLegacy(raw),s=createGame();for(const k of ['phase','day','money','facilities','plots','logs','lastCareDay','fridgeRunning','lightsOn','milestoneSeen','mealBonus'])s[k]=clone(old[k]);s.inventory={...s.inventory,...old.inventory};s.settings={...s.settings,...old.settings};s.stats={...s.stats,...old.stats};s.stats.noAidStreak=0;s.stats.bestNoAidStreak=0;for(const id of Object.keys(ANIMAL_RULES))if(has(s,id)){populate(s,id);if(id!=='pond')s.animals[id].cycle=old.livestock[id];}s.migratedFrom=1;addLog(s,'熟悉的小院，欢迎回来','旧物资、设施和菜地都已保留；灶台升级为两用，鸡鸭补齐一公两母种群。新增健康和精力，今天起请在餐桌安排食物。旧版通用口粮继续保留。','migration');return s;}
// v2 → v3：补齐季节、章节、心愿相关字段；已经过去的章节直接标记，可在新页面回顾
function migrateV2(raw){
 const effectiveDay=raw.phase==='survival'?Math.max(1,raw.day):1;
 const seasonId=getSeason(effectiveDay).id;
 const heard={},milestones={};
 for(const b of BROADCASTS)if(b.day<effectiveDay)heard[b.day]=true;
 for(const m of CHAPTER_MILESTONES)if(effectiveDay>=m.day)milestones[m.id]=true;
 const next={...raw,version:3,
  settings:{...raw.settings,heatPower:raw.settings.heatPower||'auto',seasons:raw.settings.seasons!==false,neighbors:true},
  chapter:{heard,milestones},
  wishes:{season:seasonId,done:{},allDone:false},
  seasonStats:{plantings:0,harvests:0,meals:0,births:0,aidFree:0,heartyMeal:0},
  coldToday:false};
 next.logs=[{day:raw.day,title:'小院更新：四季与远方的广播',text:'从今天起，日子有了四季的轮转，收音机里也有了新的故事——一个社区正在山谷里重建。已经过去的章节，可以在新的页面里回顾。',kind:'migration'},...(raw.logs||[])].slice(0,120);
 return next;
}
// v3 → v4：补齐邻里数据；已经过去的邻居/求助直接标记
function migrateV3(raw){
 const day=raw.phase==='survival'?raw.day:0;
 const next={...raw,version:4,neighbors:emptyNeighbors()};
 const nb=next.neighbors;
 for(const def of NEIGHBORS){if(day>=def.meetsAt){nb.met.push(def.id);nb.tradesLeft[def.id]=getTradesLeft(next,def.id);nb.giftLeft[def.id]=1;}}
 for(const req of NEIGHBOR_REQUESTS){
  if(day>=req.day&&nb.met.includes(req.neighbor)){
   if(day-req.day>=req.expires)nb.requests[req.id]='expired';
   else{nb.requests[req.id]='active';nb.activeSince[req.id]=req.day;}
  }
 }
 next.logs=[{day:raw.day,title:'小院更新：邻里与交换',text:'联络员沿着山脚敲开了小院的门——附近的住户正在重新连起来。你可以和邻居互通有无、彼此帮衬。',kind:'migration'},...(raw.logs||[])].slice(0,120);
 return next;
}
// v4 → v5：补齐图鉴、装饰、节日、结局；已经过去的节日/结局按当前日期回填
function migrateV4(raw){
 const day=raw.phase==='survival'?raw.day:0;
 const next={...raw,version:5,festivalGlow:0,
  discovered:emptyDiscovered(),decorations:emptyDecorations(),festivals:emptyFestivals(),ending:emptyEnding()};
 // 已种过的作物、已养过的动物无法精确回溯，只标记当前地里的作物；图鉴从现在起继续记录
 for(const p of raw.plots||[]){if(p.crop&&!next.discovered.crops.includes(p.crop))next.discovered.crops.push(p.crop);}
 for(const[id,a]of Object.entries(raw.animals||{})){
  const info=ANIMAL_RULES[id];
  const hasStock=id==='pond'?a.adults>0:(a.female+a.male>0||(a.incubating?.length||0)>0);
  if(hasStock&&!next.discovered.animals.includes(id))next.discovered.animals.push(id);
 }
 // 节日回填
 for(const f of FESTIVALS){
  let td=f.day;
  if(f.repeat){const k=Math.floor((day-1)/365);td=f.day+k*365;}
  if(day>=td&&day<td+f.length)next.festivals[f.id]='active';
  else if(day>=td+f.length)next.festivals[f.id]='missed';
 }
 // 结局：第 180 天解锁
 if(day>=180)next.ending.unlocked=true;
 next.logs=[{day:raw.day,title:'小院更新：图鉴、节日与新的选择',text:'日子慢慢有了新的盼头——可以把见过的作物、做过的菜、养过的动物记进图鉴；节日会按时到来；道路打通之后，还可以认真做一次选择。',kind:'migration'},...(raw.logs||[])].slice(0,120);
 return next;
}
export function validateSave(raw){
 if(raw?.version===1)return migrate(raw);
 if(raw?.version===2)raw=migrateV2(raw);
 if(raw?.version===3)raw=migrateV3(raw);
 if(raw?.version===4)raw=migrateV4(raw);
 const bad=message=>{throw new Error(`存档无法读取：${message}`);};
 const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);const integer=(x,min=0,max=1000000)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
 if(!obj(raw)||raw.version!==5)bad('版本不兼容。');if(!['prep','survival'].includes(raw.phase))bad('阶段不正确。');const difficulty=DIFFICULTIES.find(d=>d.id===raw.difficulty);if(!difficulty||raw.initialMoney!==difficulty.money||!integer(raw.money,0,raw.initialMoney)||typeof raw.assistance!=='boolean')bad('难度或预算不正确。');
 if(!integer(raw.day,raw.phase==='prep'?0:1,raw.phase==='prep'?0:1000000))bad('日期不正确。');const s=createGame({difficulty:raw.difficulty,assistance:raw.assistance});s.phase=raw.phase;s.day=raw.day;s.money=raw.money;
 if(!obj(raw.inventory)||!obj(raw.facilities)||!obj(raw.settings)||!obj(raw.animals)||!obj(raw.stats))bad('缺少游戏数据。');
 for(const k of Object.keys(RESOURCE_META)){if(!finite(raw.inventory[k]))bad(`${RESOURCE_META[k].name}数量不正确。`);s.inventory[k]=raw.inventory[k];}
 for(const[k,q]of Object.entries(raw.facilities)){if(!own(items,k)||items[k].kind!=='facility'||!integer(q,0,items[k].max))bad('设施数量不正确。');if(q)s.facilities[k]=q;}
 for(const k of Object.keys(s.facilities))for(const dep of items[k].requires||[])if(!has(s,dep))bad('缺少配套设施。');
 if(!Array.isArray(raw.plots)||raw.plots.length!==1+(s.facilities.planter||0))bad('菜地数量不正确。');s.plots=raw.plots.map(p=>{if(!obj(p)||!(p.crop===null||own(crops,p.crop))||!integer(p.progress,0,p.crop?getCropDuration(s,p.crop):0))bad('作物进度不正确。');return {crop:p.crop,progress:p.progress};});
 for(const k of ['generator','fridge','autoCare','seasons']){if(typeof raw.settings[k]!=='boolean')bad('托管设置不正确。');s.settings[k]=raw.settings[k];}if(!['auto','electric','fuel'].includes(raw.settings.cookPower))bad('灶台设置不正确。');s.settings.cookPower=raw.settings.cookPower;
 if(!['auto','electric','fuel'].includes(raw.settings.heatPower))bad('取暖设置不正确。');s.settings.heatPower=raw.settings.heatPower;
 if(!obj(raw.chapter)||!obj(raw.chapter.heard)||!obj(raw.chapter.milestones))bad('章节数据不正确。');
 if(!obj(raw.wishes)||typeof raw.wishes.season!=='string'||!obj(raw.wishes.done)||typeof raw.wishes.allDone!=='boolean')bad('季节心愿数据不正确。');
 if(!obj(raw.seasonStats))bad('季节统计不正确。');
 if(typeof raw.coldToday!=='boolean')bad('取暖状态不正确。');
 s.chapter=clone(raw.chapter);s.wishes=clone(raw.wishes);s.seasonStats=clone(raw.seasonStats);s.coldToday=raw.coldToday;
 // 邻里数据校验
 const rawNb=raw.neighbors,nb=s.neighbors;
 if(!obj(rawNb)||!Array.isArray(rawNb.met)||!obj(rawNb.bond)||!obj(rawNb.requests)||!obj(rawNb.activeSince)||!obj(rawNb.tradesLeft)||!obj(rawNb.giftLeft)||!integer(rawNb.helped)||!integer(rawNb.traded)||!integer(rawNb.gifted))bad('邻里数据不正确。');
 for(const id of rawNb.met){const def=NEIGHBORS.find(d=>d.id===id);if(!def||raw.day<def.meetsAt)bad('邻居解锁不正确。');if(!nb.met.includes(id))nb.met.push(id);}
 for(const def of NEIGHBORS){
  const id=def.id;
  if(!finite(rawNb.bond[id],0,100))bad('好感度不正确。');
  nb.bond[id]=rawNb.bond[id];
 }
 for(const def of NEIGHBORS){
  const id=def.id;
  if(!integer(rawNb.tradesLeft[id],0,getTradesLeft(s,id)))bad('交换次数不正确。');
  nb.tradesLeft[id]=rawNb.tradesLeft[id];
  if(!integer(rawNb.giftLeft[id],0,1))bad('送礼次数不正确。');
  nb.giftLeft[id]=rawNb.giftLeft[id];
 }
 for(const[id,status]of Object.entries(rawNb.requests)){
  const req=NEIGHBOR_REQUESTS.find(r=>r.id===id);
  if(!req||!['active','done','expired'].includes(status)||!integer(rawNb.activeSince[id],req.day,raw.day))bad('求助状态不正确。');
  nb.requests[id]=status;nb.activeSince[id]=rawNb.activeSince[id];
 }
 nb.helped=rawNb.helped;nb.traded=rawNb.traded;nb.gifted=rawNb.gifted;
 // 图鉴、装饰、节日、结局校验
 if(!obj(raw.discovered)||!Array.isArray(raw.discovered.crops)||!Array.isArray(raw.discovered.recipes)||!Array.isArray(raw.discovered.animals))bad('图鉴数据不正确。');
 for(const id of raw.discovered.crops){if(!own(crops,id))bad('作物图鉴不正确。');if(!s.discovered.crops.includes(id))s.discovered.crops.push(id);}
 for(const id of raw.discovered.recipes){if(!RECIPES.some(r=>r.id===id))bad('菜肴图鉴不正确。');if(!s.discovered.recipes.includes(id))s.discovered.recipes.push(id);}
 for(const id of raw.discovered.animals){if(!own(ANIMAL_RULES,id))bad('动物图鉴不正确。');if(!s.discovered.animals.includes(id))s.discovered.animals.push(id);}
 if(!obj(raw.decorations))bad('装饰数据不正确。');
 for(const def of DECORATIONS){if(!integer(raw.decorations[def.id],0,def.max))bad('装饰数量不正确。');s.decorations[def.id]=raw.decorations[def.id];if(def.requires&&s.decorations[def.id]>0&&!has(s,def.requires))bad('装饰缺少配套设施。');}
 if(!obj(raw.festivals))bad('节日数据不正确。');
 for(const f of FESTIVALS){const st=raw.festivals[f.id];if(st!==undefined&&!['active','celebrated','missed'].includes(st))bad('节日状态不正确。');if(st)s.festivals[f.id]=st;}
 if(!obj(raw.ending)||typeof raw.ending.unlocked!=='boolean'||!['return','stay',null].includes(raw.ending.choice)||(raw.ending.seenAt!==null&&!integer(raw.ending.seenAt,0,raw.day)))bad('结局数据不正确。');
 s.ending.unlocked=raw.ending.unlocked;s.ending.choice=raw.ending.choice;s.ending.seenAt=raw.ending.seenAt;
 if(s.ending.unlocked!==(raw.day>=180))bad('结局解锁时间不正确。');
 if(s.ending.choice&&!s.ending.seenAt)bad('结局缺少记录时间。');
 for(const[id,r]of Object.entries(ANIMAL_RULES)){const a=raw.animals[id],g=s.animals[id];if(!obj(a)||!integer(a.expansions,0,2)||!Array.isArray(a.young)||a.young.length>40)bad('养殖数据不正确。');g.expansions=a.expansions;
  if(id==='pond'){if(!integer(a.adults,0,36))bad('成鱼数量不正确。');g.adults=a.adults;g.young=a.young.map(b=>{if(!obj(b)||!integer(b.count,1,36)||!integer(b.days,0,r.grow-1))bad('鱼苗进度不正确。');return {count:b.count,days:b.days};});}
  else{for(const k of ['female','male']){if(!integer(a[k],0,16))bad('种禽数量不正确。');g[k]=a[k];}
   const cycleMax=r.cycle-1+(getSeasonIndex(raw.day)===3&&raw.settings.seasons?1:0);
   if(!integer(a.cycle,0,cycleMax)||!Array.isArray(a.incubating)||a.incubating.length>16)bad('孵化进度不正确。');g.cycle=a.cycle;g.young=a.young.map(b=>{if(!obj(b)||!integer(b.female,0,16)||!integer(b.male,0,16)||b.female+b.male<1||!integer(b.days,0,r.grow-1))bad('幼禽进度不正确。');return {female:b.female,male:b.male,days:b.days};});g.incubating=a.incubating.map(b=>{if(!obj(b)||!integer(b.count,1,16)||!integer(b.days,0,r.hatch-1))bad('种蛋进度不正确。');return {count:b.count,days:b.days};});}
  const info=getAnimalInfo(s,id);if(info.total>info.capacity||(!has(s,id)&&(info.total||g.expansions)))bad('养殖超过容量或缺少圈舍。');
 }
 for(const key of ['health','energy']){if(!finite(raw[key],0,100))bad('身体状态不正确。');s[key]=raw[key];}
 for(const key of ['mealPlan','lastMealPlan']){if(!obj(raw[key]))bad('餐桌数据不正确。');s[key]={};for(const[k,q]of Object.entries(raw[key])){if(!own(FOODS,k)||!FOODS[k].ready||!finite(q,.01)||(key==='mealPlan'&&q>s.inventory[k]))bad('餐食份量不正确。');s[key][k]=q;}}
 const activityIds=[...ACTIVITIES.map(a=>a.id),'breedFish'];if(!Array.isArray(raw.activitiesDone)||new Set(raw.activitiesDone).size!==raw.activitiesDone.length||raw.activitiesDone.some(k=>!activityIds.includes(k)))bad('每日安排不正确。');s.activitiesDone=[...raw.activitiesDone];
 for(const[key,max]of Object.entries({tidyDays:3,salvageLeft:8,mealBonus:3})){if(!integer(raw[key],0,max))bad('生活进度不正确。');s[key]=raw[key];}
 if(!integer(raw.festivalGlow,0,10))bad('节日心情不正确。');s.festivalGlow=raw.festivalGlow;
 for(const k of ['lastCareDay','lastAidDay']){if(raw[k]!==null&&!(raw.phase==='survival'&&integer(raw[k],1,raw.day)))bad('操作日期不正确。');s[k]=raw[k];}
 for(const k of ['fridgeRunning','lightsOn','milestoneSeen','ended']){if(typeof raw[k]!=='boolean')bad('状态不正确。');s[k]=raw[k];}if(s.ended!==(s.health===0))bad('健康与结束状态不一致。');if(![null,1].includes(raw.migratedFrom))bad('迁移信息不正确。');s.migratedFrom=raw.migratedFrom;
 for(const k of ['days','harvests','assists','mealsCooked','births','noAidStreak','bestNoAidStreak','meatHarvests']){if(!integer(raw.stats[k]))bad('统计数据不正确。');s.stats[k]=raw.stats[k];}if(s.stats.days!==(s.phase==='prep'?0:s.day-1)||s.stats.noAidStreak>s.stats.days||s.stats.bestNoAidStreak>s.stats.days||s.stats.noAidStreak>s.stats.bestNoAidStreak)bad('生存天数不正确。');
 const foodGroups=[...new Set(Object.values(FOODS).map(f=>f.group))];if(!Array.isArray(raw.stats.foodGroups)||raw.stats.foodGroups.some(g=>!foodGroups.includes(g)))bad('饮食统计不正确。');s.stats.foodGroups=[...new Set(raw.stats.foodGroups)];
 if(!Array.isArray(raw.logs)||raw.logs.length>120)bad('日记不正确。');s.logs=raw.logs.map(l=>{if(!obj(l)||!integer(l.day,0,s.day)||typeof l.title!=='string'||l.title.length>300||typeof l.text!=='string'||l.text.length>12000||(l.kind!==undefined&&(typeof l.kind!=='string'||l.kind.length>50)))bad('日记内容不正确。');return {day:l.day,title:l.title,text:l.text,...(l.kind?{kind:l.kind}:{})};});
 const d=getDerived(s);if(s.inventory.water>d.waterCapacity||s.inventory.power>d.powerCapacity)bad('储备超过容量。');return s;
}
