import { ITEMS, CROPS, RESOURCE_META, WEATHER, DIFFICULTIES, FOODS, RECIPES, ANIMAL_RULES, ACTIVITIES, STARTER_CART, HARD_STARTER_CART } from './data.js';
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
function populate(s,id){if(id==='coop'||id==='ducks'){s.animals[id].female=2;s.animals[id].male=1;}if(id==='pond')s.animals.pond.adults=10;}

export function createGame(options={}) {
 const difficulty=DIFFICULTIES.find(d=>d.id===options.difficulty)||DIFFICULTIES[1];
 const inventory=Object.fromEntries(Object.keys(RESOURCE_META).map(k=>[k,0]));
 Object.assign(inventory,{food:7,water:35,seeds:6,materials:4});
 return {version:2,phase:'prep',day:0,difficulty:difficulty.id,initialMoney:difficulty.money,money:difficulty.money,assistance:options.assistance??difficulty.assistance,
 inventory,facilities:{},plots:[{crop:null,progress:0}],settings:{generator:true,fridge:true,autoCare:true,cookPower:'auto'},animals:emptyAnimals(),
 health:100,energy:80,mealPlan:{},lastMealPlan:{},activitiesDone:[],tidyDays:0,salvageLeft:8,mealBonus:0,lastCareDay:null,lastAidDay:null,
 fridgeRunning:false,lightsOn:false,milestoneSeen:false,ended:false,migratedFrom:null,
 stats:{days:0,harvests:0,assists:0,mealsCooked:0,births:0,noAidStreak:0,bestNoAidStreak:0,foodGroups:[],meatHarvests:0},
 logs:[{day:0,title:'小院的钥匙',text:`${difficulty.name} · 准备金 ¥${difficulty.money}。先平安生活 30 天，再慢慢把小院过成家。已有 7 份口粮、35 L 水、6 袋种子、4 份材料和一块地。`,kind:'story'}]};
}
export function getStarterCart(s){return clone(s.difficulty==='hard'?HARD_STARTER_CART:STARTER_CART);}
export function getForecast(day,count=3){return Array.from({length:Math.max(0,Math.min(90,Math.floor(count)||0))},(_,n)=>({...WEATHER[(Math.max(1,Math.floor(day)||1)-1+n)%WEATHER.length]}));}
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
 const w=getForecast(s.day,1)[0];const personalWater=w.temperature>=30&&!has(s,'insulation')?6:4;
 const cropWater=s.plots.reduce((n,p)=>n+(p.crop&&p.progress<getCropDuration(s,p.crop)?crops[p.crop].water:0),0);
 const animalWater=Object.keys(ANIMAL_RULES).reduce((n,k)=>n+getAnimalInfo(s,k).water,0);
 const feed=Object.keys(ANIMAL_RULES).reduce((n,k)=>n+getAnimalInfo(s,k).feed,0);
 const careWater=s.lastCareDay===s.day?0:round(cropWater+animalWater);
 let comfort=35;for(const [k,n]of Object.entries({books:8,bed:10,radio:5,insulation:7,rug:6,stove:4}))if(has(s,k))comfort+=n;
 if(has(s,'lamp')&&(s.lightsOn||s.inventory.power>=.2))comfort+=5;if(s.mealBonus>0)comfort+=5;if(totalFood(s)>=7)comfort+=5;if(s.inventory.water>=28)comfort+=5;
 const dailyWater=round(personalWater+(s.settings.autoCare?careWater:0));
 return {waterCapacity:has(s,'tank')?400:80,powerCapacity:has(s,'battery')?12:0,comfort:Math.min(100,comfort),plots:s.plots.length,foodDays:Math.floor(totalFood(s)),totalFood:totalFood(s),waterDays:Math.floor(s.inventory.water/Math.max(1,dailyWater)),cropWater,animalWater,
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
   const batches=[];for(const b of a.incubating){b.days++;if(b.days>=r.hatch){a.young.push({female:Math.ceil(b.count/2),male:Math.floor(b.count/2),days:0});s.stats.births+=b.count;events.push(`${b.count} 只小${r.name}出壳了，每批尽量均分雌雄，单数多一只母禽。`);}else batches.push(b);}a.incubating=batches;
   a.cycle++;if(a.cycle>=r.cycle){a.cycle=0;if(a.female){const resource=a.male>0?r.egg:'eggs';s.inventory[resource]+=a.female;events.push(`收到了 ${a.female} 枚${RESOURCE_META[resource].name}。`);}}
  }
 }
 for(const[pIndex,p]of s.plots.entries()){const c=crops[p.crop];if(!c||p.progress>=getCropDuration(s,c))continue;if(s.inventory.water-reserve+1e-8<c.water){events.push(`${pIndex+1} 号菜地缺水，生长暂停。`);continue;}s.inventory.water=round(s.inventory.water-c.water);p.progress++;if(p.progress>=getCropDuration(s,c))events.push(`${pIndex+1} 号菜地的${c.name}成熟了。`);}
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
  if(a.key==='cookPower'&&['auto','electric','fuel'].includes(a.value))n.settings[a.key]=a.value;
  else if(['generator','fridge','autoCare'].includes(a.key)&&typeof a.value==='boolean')n.settings[a.key]=a.value;
  else return fail(s,'设置内容不正确。');return {state:n,message:'生活安排已保存。'};
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
  if(a.type==='plant'){if(p.crop||!own(crops,a.crop))return fail(s,'菜地已有作物，或没有这种种子。');const c=crops[a.crop];if(n.inventory.seeds<c.seedCost)return fail(s,'种子不足，可以等其他菜地收获返种。');const e=spendEnergy(n,3);if(e)return fail(s,e);n.inventory.seeds-=c.seedCost;p.crop=c.id;p.progress=0;message=`${a.plot+1} 号地种下${c.name}，照料 ${getCropDuration(n,c)} 天成熟。`;
  }else{const c=crops[p.crop];if(!c||p.progress<getCropDuration(n,c))return fail(s,'还没有成熟的作物。');const e=spendEnergy(n,2);if(e)return fail(s,e);const amount=c.yield+(has(n,'compost')?2:0);n.inventory[c.resource]+=amount;n.inventory.seeds+=1+(has(n,'seedbox')?1:0);n.stats.harvests++;n.plots[a.plot]={crop:null,progress:0};message=`收获 ${amount} 份${RESOURCE_META[c.resource].name}，并留下了下一季的种子。`;}
 }else if(a.type==='cook'){
  const p=getRecipePreview(n,a.recipe,a.batch??1);if(p.error)return fail(s,p.error);for(const[k,q]of Object.entries(p.inputs))n.inventory[k]=round(n.inventory[k]-q);n.inventory[p.heat.resource]=round(n.inventory[p.heat.resource]-p.heat.amount);n.energy=round(n.energy-p.energy);n.inventory[p.recipe.output]=round(n.inventory[p.recipe.output]+p.output);n.stats.mealsCooked++;message=`${p.recipe.name}做好了：${p.output} 份，消耗${p.heat.name} ${p.heat.amount} ${p.heat.resource==='power'?'kWh':'L'}。可以安排上桌或留在冰箱。`;
 }else if(a.type==='preserve'){
  const f=FOODS[a.resource],amount=a.amount;if(!f?.fresh||!finite(amount,.01)||available(n,a.resource)<amount)return fail(s,'请选足够的鲜食；餐桌预留部分不可用于保存。');if(!has(n,'stove'))return fail(s,'加工保存需要两用灶台。');const heat=chooseHeat(n,round(.4*amount),round(.12*amount));if(heat.error)return fail(s,heat.error);const e=spendEnergy(n,round(4+amount));if(e)return fail(s,e);n.inventory[a.resource]=round(n.inventory[a.resource]-amount);n.inventory[heat.resource]=round(n.inventory[heat.resource]-heat.amount);const result=round(amount*f.nutrition/.5);n.inventory.preserves=round(n.inventory.preserves+result);message=`加工了 ${amount} 份${RESOURCE_META[a.resource].name}，得到 ${result} 份耐储保存食品，食量保持不变。`;
 }else if(a.type==='care'){
  if(n.lastCareDay===n.day)return fail(s,'今天已经照料过了。');const e=spendEnergy(n,5);if(e)return fail(s,e);const events=[];care(n,events);message=`小院照料好了。${events.join('')}`;
 }else if(a.type==='hatch'){
  const r=ANIMAL_RULES[a.species],group=n.animals[a.species];if(!r||a.species==='pond'||!has(n,a.species)||!Number.isInteger(a.count)||a.count<1)return fail(s,'请填写要孵化的种蛋数量。');const info=getAnimalInfo(n,a.species);if(!info.canBreed)return fail(s,'需至少一只公禽与一只母禽作为种禽。');if(info.total+a.count>info.capacity)return fail(s,'圈舍位置不够了，先扩建或调整养殖数量。');if(available(n,r.egg)<a.count)return fail(s,'自家种蛋不够；商店鸡蛋不能孵化。');const e=spendEnergy(n,5);if(e)return fail(s,e);n.inventory[r.egg]-=a.count;group.incubating.push({count:a.count,days:0});message=`留下 ${a.count} 枚${r.name}种蛋，照料 ${r.hatch} 天后出壳，再照料 ${r.grow} 天长大。`;
 }else if(a.type==='breedFish'){
  const info=getAnimalInfo(n,'pond');if(!has(n,'pond')||!info.canBreed)return fail(s,'至少保留 2 条成鱼才能繁育。');if(info.total+4>info.capacity)return fail(s,'鱼池位置不够了，先捕捞或扩建。');if(n.inventory.feed<2)return fail(s,'繁育一批鱼苗需要 2 份饲料。');if(n.activitiesDone.includes('breedFish'))return fail(s,'今天已经繁育过一批鱼苗。');const e=spendEnergy(n,6);if(e)return fail(s,e);n.inventory.feed-=2;n.animals.pond.young.push({count:4,days:0});n.stats.births+=4;n.activitiesDone.push('breedFish');message='4 条小鱼苗住进了鱼池，照料 6 天后长大。';
 }else if(a.type==='butcher'||a.type==='catch'){
  const id=a.type==='catch'?'pond':a.species;if(!own(ANIMAL_RULES,id)||!has(n,id)||!Number.isInteger(a.count)||a.count<1)return fail(s,'请选择正确的动物和数量。');const g=n.animals[id];const key=id==='pond'?'adults':a.sex;if(!['adults','female','male'].includes(key)||(id==='pond')!==(key==='adults')||g[key]<a.count)return fail(s,'成年动物数量不足。');const e=spendEnergy(n,Math.min(35,4+a.count*2));if(e)return fail(s,e);g[key]-=a.count;const resource=id==='pond'?'fish':'meat';const amount=a.count*ANIMAL_RULES[id].meat;n.inventory[resource]+=amount;n.stats.meatHarvests+=amount;message=`获得 ${amount} 份${RESOURCE_META[resource].name}。${getAnimalInfo(n,id).canBreed?'种群仍可继续繁育。':'剩余种群已不满足繁育条件。'}`;
 }else if(a.type==='activity'){
  const task=ACTIVITIES.find(t=>t.id===a.id);if(!task)return fail(s,'没有这项安排。');if(n.activitiesDone.includes(task.id))return fail(s,'今天已经做过这件事，明天再来。');if(task.requires&&!has(n,task.requires))return fail(s,`需要先安置${items[task.requires].name}。`);if(task.materials&&n.inventory.materials<task.materials)return fail(s,`需要 ${task.materials} 份材料，可以回收院里的闲置物品。`);
  if(task.id==='expandPlot'&&n.plots.length>=4)return fail(s,'小院最多容纳 4 块菜地。');if(task.id==='salvage'&&n.salvageLeft<=0)return fail(s,'院里可拆解的闲置家具已经用完了。');const expansion={expandCoop:'coop',expandDucks:'ducks',expandPond:'pond'}[task.id];if(expansion&&n.animals[expansion].expansions>=2)return fail(s,'这处设施已扩建到最大。');
  const e=spendEnergy(n,task.energy);if(e)return fail(s,e);if(task.materials)n.inventory.materials-=task.materials;n.energy=Math.min(100,n.energy+(task.gain||0));n.health=Math.min(100,n.health+(task.health||0));n.activitiesDone.push(task.id);
  if(task.id==='tidy')n.tidyDays=3;if(task.id==='salvage'){n.inventory.materials+=2;n.salvageLeft--;}if(task.id==='expandPlot'){n.facilities.planter=(n.facilities.planter||0)+1;n.plots.push({crop:null,progress:0});}if(expansion)n.animals[expansion].expansions++;
  message=`${task.name}完成了。${task.gain?`恢复 ${task.gain} 精力、${task.health} 健康。`:task.description}`;
 }else if(a.type==='aid'||a.type==='rescue'){
  if(!n.assistance)return fail(s,'这一局关闭了应急援助。');if(n.lastAidDay===n.day)return fail(s,'今天已经收到过援助。');if(a.type==='rescue'&&!n.ended)return fail(s,'目前还不需要急救休养。');if(a.type==='aid'&&totalFood(n)>=2&&n.inventory.water>=getDerived(n).dailyNeeds.personalWater)return fail(s,'目前还有食水，等储备不足时再申请援助。');n.inventory.food+=7;n.inventory.water=Math.min(getDerived(n).waterCapacity,n.inventory.water+28);n.stats.assists++;n.lastAidDay=n.day;n.stats.noAidStreak=0;if(a.type==='rescue'){n.health=45;n.energy=50;n.ended=false;}message='社区送来 7 份口粮和 28 L 水，已记入援助次数。食物仍需要由你安排上桌。';
 }else return fail(s,'暂不支持这个操作。');
 addLog(n,a.type==='harvest'?'把收获带回家':a.type==='cook'?'今天好好吃饭':'小院里的新安排',message,a.type);return {state:n,message};
}
const stories=['你打开窗，让晨光落在餐桌上。今天要怎么过，由自己决定。','屋子里的东西都有了各自的位置，日子也慢慢有了秩序。','雨点敲着屋檐。水箱里的声音，让人安心。','院里有新的绿意，餐桌上也多了一种期待。','外面很安静，你把热饭端到窗边。','一场雨过去，小院又存下了几天的从容。','看看幼崽和菜地，生活正在悄悄长大。','晚霞落在桌角，今天的安排都成了手记里的一行字。','午后有点热，给自己留一点休息的时间。','雨后的泥土带着清新的气味。明天还会有新的收获。','今天没有大事，认真吃饭、照顾好自己，也很好。','一盏灯，一顿饭，小院已经越来越像一个家。'];
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
 if(n.settings.autoCare)care(n,events);
 for(const[k,q]of Object.entries(n.mealPlan))n.inventory[k]=round(n.inventory[k]-q);
 const water=Math.min(n.inventory.water,d.dailyNeeds.personalWater);n.inventory.water=round(n.inventory.water-water);const thirst=water<d.dailyNeeds.personalWater?Math.ceil(18*(1-water/d.dailyNeeds.personalWater)):0;
 n.health=Math.max(0,Math.min(100,n.health+meal.healthChange-thirst));n.energy=Math.min(100,round(n.energy+meal.recovery));
 if(meal.nutrition<1)events.push(`今天吃了正常食量的 ${Math.round(meal.nutrition*100)}%，健康 ${meal.healthChange}。`);else events.push(`今天吃了正常食量的 ${Math.round(meal.nutrition*100)}%，${meal.diverse?'搭配丰富，':''}健康 +${meal.healthChange}。`);
 if(thirst)events.push(`饮水不足，健康额外 -${thirst}。`);
 n.mealBonus=meal.cooked&&meal.nutrition>=.8?2:Math.max(0,n.mealBonus-1);
 n.stats.foodGroups=[...new Set([...n.stats.foodGroups,...meal.groups])];
 if(!n.fridgeRunning&&day%4===0){for(const[k,f]of Object.entries(FOODS)){if(!f.fresh||n.inventory[k]<=0)continue;const loss=Math.min(n.inventory[k],Math.max(.25,round(n.inventory[k]*(n.tidyDays>0?.1:.25))));n.inventory[k]=round(n.inventory[k]-loss);events.push(`未冷藏的${RESOURCE_META[k].name}损耗 ${loss} 份。`);}}
 n.stats.days++;n.stats.noAidStreak=n.lastAidDay===day?0:n.stats.noAidStreak+1;n.stats.bestNoAidStreak=Math.max(n.stats.bestNoAidStreak,n.stats.noAidStreak);
 n.ended=n.health<=0;const milestone=day===30&&!n.milestoneSeen&&!n.ended;if(milestone){n.milestoneSeen=true;events.push('你平安度过了 30 天。第一段目标完成，接下来可以继续无尽经营。');}
 if(n.ended)events.push('健康耗尽，这一段生活暂停了。存档和小院都还在。');if(has(n,'radio')&&day%5===0)events.push('收音机里有人提醒：“别只顾着照料院子，也记得好好吃饭。”');
 const title=n.ended?'这一段生活，暂时停在这里':milestone?'第三十天，这里已经是家':`第 ${day} 天 · ${w.name}`;const text=stories[(day-1)%stories.length];addLog(n,title,[text,...events].join('\n'),n.ended?'ending':milestone?'milestone':'day');
 n.lastMealPlan=clone(n.mealPlan);n.mealPlan={};n.activitiesDone=[];n.tidyDays=Math.max(0,n.tidyDays-1);n.day++;
 return {state:n,report:{day,weather:w,title,text,events,milestone,ended:n.ended,healthChange:n.health-s.health,energyChange:round(n.energy-s.energy),meal,changes:Object.fromEntries(Object.keys(RESOURCE_META).map(k=>[k,round(n.inventory[k]-before[k])]))}};
}

function migrate(raw){const old=validateLegacy(raw),s=createGame();for(const k of ['phase','day','money','facilities','plots','logs','lastCareDay','fridgeRunning','lightsOn','milestoneSeen','mealBonus'])s[k]=clone(old[k]);s.inventory={...s.inventory,...old.inventory};s.settings={...s.settings,...old.settings};s.stats={...s.stats,...old.stats};s.stats.noAidStreak=0;s.stats.bestNoAidStreak=0;for(const id of Object.keys(ANIMAL_RULES))if(has(s,id)){populate(s,id);if(id!=='pond')s.animals[id].cycle=old.livestock[id];}s.migratedFrom=1;addLog(s,'熟悉的小院，欢迎回来','旧物资、设施和菜地都已保留；灶台升级为两用，鸡鸭补齐一公两母种群。新增健康和精力，今天起请在餐桌安排食物。旧版通用口粮继续保留。','migration');return s;}
export function validateSave(raw){
 if(raw?.version===1)return migrate(raw);
 const bad=message=>{throw new Error(`存档无法读取：${message}`);};
 const obj=x=>x&&typeof x==='object'&&!Array.isArray(x);const integer=(x,min=0,max=1000000)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
 if(!obj(raw)||raw.version!==2)bad('版本不兼容。');if(!['prep','survival'].includes(raw.phase))bad('阶段不正确。');const difficulty=DIFFICULTIES.find(d=>d.id===raw.difficulty);if(!difficulty||raw.initialMoney!==difficulty.money||!integer(raw.money,0,raw.initialMoney)||typeof raw.assistance!=='boolean')bad('难度或预算不正确。');
 if(!integer(raw.day,raw.phase==='prep'?0:1,raw.phase==='prep'?0:1000000))bad('日期不正确。');const s=createGame({difficulty:raw.difficulty,assistance:raw.assistance});s.phase=raw.phase;s.day=raw.day;s.money=raw.money;
 if(!obj(raw.inventory)||!obj(raw.facilities)||!obj(raw.settings)||!obj(raw.animals)||!obj(raw.stats))bad('缺少游戏数据。');
 for(const k of Object.keys(RESOURCE_META)){if(!finite(raw.inventory[k]))bad(`${RESOURCE_META[k].name}数量不正确。`);s.inventory[k]=raw.inventory[k];}
 for(const[k,q]of Object.entries(raw.facilities)){if(!own(items,k)||items[k].kind!=='facility'||!integer(q,0,items[k].max))bad('设施数量不正确。');if(q)s.facilities[k]=q;}
 for(const k of Object.keys(s.facilities))for(const dep of items[k].requires||[])if(!has(s,dep))bad('缺少配套设施。');
 if(!Array.isArray(raw.plots)||raw.plots.length!==1+(s.facilities.planter||0))bad('菜地数量不正确。');s.plots=raw.plots.map(p=>{if(!obj(p)||!(p.crop===null||own(crops,p.crop))||!integer(p.progress,0,p.crop?getCropDuration(s,p.crop):0))bad('作物进度不正确。');return {crop:p.crop,progress:p.progress};});
 for(const k of ['generator','fridge','autoCare']){if(typeof raw.settings[k]!=='boolean')bad('托管设置不正确。');s.settings[k]=raw.settings[k];}if(!['auto','electric','fuel'].includes(raw.settings.cookPower))bad('灶台设置不正确。');s.settings.cookPower=raw.settings.cookPower;
 for(const[id,r]of Object.entries(ANIMAL_RULES)){const a=raw.animals[id],g=s.animals[id];if(!obj(a)||!integer(a.expansions,0,2)||!Array.isArray(a.young)||a.young.length>40)bad('养殖数据不正确。');g.expansions=a.expansions;
  if(id==='pond'){if(!integer(a.adults,0,36))bad('成鱼数量不正确。');g.adults=a.adults;g.young=a.young.map(b=>{if(!obj(b)||!integer(b.count,1,36)||!integer(b.days,0,r.grow-1))bad('鱼苗进度不正确。');return {count:b.count,days:b.days};});}
  else{for(const k of ['female','male']){if(!integer(a[k],0,16))bad('种禽数量不正确。');g[k]=a[k];}if(!integer(a.cycle,0,r.cycle-1)||!Array.isArray(a.incubating)||a.incubating.length>16)bad('孵化进度不正确。');g.cycle=a.cycle;g.young=a.young.map(b=>{if(!obj(b)||!integer(b.female,0,16)||!integer(b.male,0,16)||b.female+b.male<1||!integer(b.days,0,r.grow-1))bad('幼禽进度不正确。');return {female:b.female,male:b.male,days:b.days};});g.incubating=a.incubating.map(b=>{if(!obj(b)||!integer(b.count,1,16)||!integer(b.days,0,r.hatch-1))bad('种蛋进度不正确。');return {count:b.count,days:b.days};});}
  const info=getAnimalInfo(s,id);if(info.total>info.capacity||(!has(s,id)&&(info.total||g.expansions)))bad('养殖超过容量或缺少圈舍。');
 }
 for(const key of ['health','energy']){if(!finite(raw[key],0,100))bad('身体状态不正确。');s[key]=raw[key];}
 for(const key of ['mealPlan','lastMealPlan']){if(!obj(raw[key]))bad('餐桌数据不正确。');s[key]={};for(const[k,q]of Object.entries(raw[key])){if(!own(FOODS,k)||!FOODS[k].ready||!finite(q,.01)||(key==='mealPlan'&&q>s.inventory[k]))bad('餐食份量不正确。');s[key][k]=q;}}
 const activityIds=[...ACTIVITIES.map(a=>a.id),'breedFish'];if(!Array.isArray(raw.activitiesDone)||new Set(raw.activitiesDone).size!==raw.activitiesDone.length||raw.activitiesDone.some(k=>!activityIds.includes(k)))bad('每日安排不正确。');s.activitiesDone=[...raw.activitiesDone];
 for(const[key,max]of Object.entries({tidyDays:3,salvageLeft:8,mealBonus:3})){if(!integer(raw[key],0,max))bad('生活进度不正确。');s[key]=raw[key];}
 for(const k of ['lastCareDay','lastAidDay']){if(raw[k]!==null&&!(raw.phase==='survival'&&integer(raw[k],1,raw.day)))bad('操作日期不正确。');s[k]=raw[k];}
 for(const k of ['fridgeRunning','lightsOn','milestoneSeen','ended']){if(typeof raw[k]!=='boolean')bad('状态不正确。');s[k]=raw[k];}if(s.ended!==(s.health===0))bad('健康与结束状态不一致。');if(![null,1].includes(raw.migratedFrom))bad('迁移信息不正确。');s.migratedFrom=raw.migratedFrom;
 for(const k of ['days','harvests','assists','mealsCooked','births','noAidStreak','bestNoAidStreak','meatHarvests']){if(!integer(raw.stats[k]))bad('统计数据不正确。');s.stats[k]=raw.stats[k];}if(s.stats.days!==(s.phase==='prep'?0:s.day-1)||s.stats.noAidStreak>s.stats.days||s.stats.bestNoAidStreak>s.stats.days||s.stats.noAidStreak>s.stats.bestNoAidStreak)bad('生存天数不正确。');
 const foodGroups=[...new Set(Object.values(FOODS).map(f=>f.group))];if(!Array.isArray(raw.stats.foodGroups)||raw.stats.foodGroups.some(g=>!foodGroups.includes(g)))bad('饮食统计不正确。');s.stats.foodGroups=[...new Set(raw.stats.foodGroups)];
 if(!Array.isArray(raw.logs)||raw.logs.length>120)bad('日记不正确。');s.logs=raw.logs.map(l=>{if(!obj(l)||!integer(l.day,0,s.day)||typeof l.title!=='string'||l.title.length>300||typeof l.text!=='string'||l.text.length>12000||(l.kind!==undefined&&(typeof l.kind!=='string'||l.kind.length>50)))bad('日记内容不正确。');return {day:l.day,title:l.title,text:l.text,...(l.kind?{kind:l.kind}:{})};});
 const d=getDerived(s);if(s.inventory.water>d.waterCapacity||s.inventory.power>d.powerCapacity)bad('储备超过容量。');return s;
}
