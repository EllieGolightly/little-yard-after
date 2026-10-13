/** Game balance lives here. Quantities describe a cozy game, not survival advice. */
export const CATEGORIES = [
  { id: 'pantry', label: '食物储备', icon: '🥫' },
  { id: 'water', label: '储水供水', icon: '💧' },
  { id: 'power', label: '电力能源', icon: '☀️' },
  { id: 'garden', label: '小院种植', icon: '🌱' },
  { id: 'animals', label: '院中伙伴', icon: '🐔' },
  { id: 'home', label: '舒适生活', icon: '🏡' },
];

export const RESOURCE_META = {
  food: { name: '储备食物', unit: '份', icon: '🥫' },
  water: { name: '清洁水', unit: 'L', icon: '💧' },
  feed: { name: '饲料', unit: '份', icon: '🌾' },
  fuel: { name: '燃料', unit: 'L', icon: '🛢️' },
  seeds: { name: '种子', unit: '袋', icon: '🌱' },
  vegetables: { name: '蔬菜', unit: '份', icon: '🥬' },
  eggs: { name: '禽蛋', unit: '份', icon: '🥚' },
  fish: { name: '鲜鱼', unit: '份', icon: '🐟' },
  power: { name: '蓄电', unit: 'kWh', icon: '⚡' },
};

export const CROPS = [
  { id: 'greens', name: '小青菜', icon: '🥬', days: 4, water: 2, yield: 6, resource: 'vegetables', seedCost: 1 },
  { id: 'potatoes', name: '土豆', icon: '🥔', days: 6, water: 2, yield: 10, resource: 'potatoes', seedCost: 1 },
  { id: 'pumpkin', name: '南瓜', icon: '🎃', days: 8, water: 3, yield: 15, resource: 'vegetables', seedCost: 1 },
  { id: 'fodder', name: '饲料草', icon: '🌾', days: 5, water: 2, yield: 18, resource: 'feed', seedCost: 1 },
];

export const ITEMS = [
  { id: 'food', name: '耐储食品箱', category: 'pantry', price: 260, icon: '🥫', kind: 'supply', resource: 'food', amount: 10, description: '米面、罐头和方便食品，踏实的底气。', detail: '每箱 10 份；每份提供 100% 的每日食量；不会变质，可分量安排。' },
  { id: 'noodles', name: '喜欢的速食', category: 'pantry', price: 180, icon: '🍜', kind: 'supply', resource: 'noodles', amount: 6, description: '总有几天，只想煮一碗热乎的面。', detail: '每箱 6 份；每份提供 90% 的每日食量，可直接安排上桌。' },
  { id: 'vegetables', name: '当季蔬菜篮', category: 'pantry', price: 120, icon: '🥦', kind: 'supply', resource: 'vegetables', amount: 6, description: '先把新鲜的味道带回家。', detail: '每篮 6 份；可直接吃或做菜，每份食量 20%，需要冰箱保鲜。' },
  { id: 'eggs', name: '一盒鸡蛋', category: 'pantry', price: 80, icon: '🥚', kind: 'supply', resource: 'eggs', amount: 8, description: '早餐也要认真对待。', detail: '每盒 8 份；需烹饪后上桌，需要冰箱保鲜。' },
  { id: 'fish', name: '处理好的鲜鱼', category: 'pantry', price: 140, icon: '🐟', kind: 'supply', resource: 'fish', amount: 4, description: '已经分装好，等一顿丰盛的晚饭。', detail: '每包 4 份；需烹饪后上桌，需要冰箱保鲜。' },
  { id: 'fridge', name: '节能冰箱', category: 'pantry', price: 1600, icon: '🧊', kind: 'facility', max: 1, description: '让每一次收获都能多留一会儿。', detail: '开启时每天耗电 1.2 kWh；有电则当天鲜食不损耗。无保鲜的第 4、8、12…天，各类鲜食损耗 25%（至少 0.25 份）。' },
  { id: 'snacks', name: '零食储备箱', category: 'pantry', price: 320, icon: '🍪', kind: 'supply', resource: 'snacks', amount: 8, description: '饼干、坚果和巧克力，留给慢慢过的日子。', detail: '每箱 8 份；每份提供 50% 的每日食量，不会变质。' },
  { id: 'water', name: '密封饮用水', category: 'water', price: 90, icon: '💧', kind: 'supply', resource: 'water', amount: 40, description: '先储好水，心里就安定了一半。', detail: '每组 40 L；基础储水上限 80 L，超出需先购买储水箱。' },
  { id: 'tank', name: '大储水箱', category: 'water', price: 1800, icon: '🛢️', kind: 'facility', max: 1, description: '把雨天的富余，留给晴天。', detail: '清洁水容量增加 320 L，总容量 400 L。' },
  { id: 'rain', name: '屋檐集雨器', category: 'water', price: 1600, icon: '🌧️', kind: 'facility', max: 1, description: '听见雨声时，知道水箱又会满一些。', detail: '需搭配重力净水器使用；每天收集降雨量 × 4 L 的清洁水，超出容量自动溢出。' },
  { id: 'filter', name: '重力净水器', category: 'water', price: 900, icon: '🚰', kind: 'facility', max: 1, description: '不依赖电力的雨水过滤设备。', detail: '与集雨器搭配产出清洁水；无需耗电或更换耗材。' },
  { id: 'well', name: '院中浅井', category: 'water', price: 7800, icon: '🪣', kind: 'facility', max: 1, description: '给院子多一份稳定的水源。', detail: '搭配净水器，每天稳定补充 12 L 清洁水，无需电力。', requires: ['filter'] },
  { id: 'solar', name: '屋顶太阳能', category: 'power', price: 5200, icon: '☀️', kind: 'facility', max: 1, description: '晴天也成为一种可以储存的收获。', detail: '每天发电 8 × 日照系数 kWh；需搭配蓄电池，电量不超过容量。', requires: ['battery'] },
  { id: 'battery', name: '家用蓄电池', category: 'power', price: 3200, icon: '🔋', kind: 'facility', max: 1, description: '天黑以后，家里的灯依然能亮。', detail: '电量容量 12 kWh；购入即预充 8 kWh，配合太阳能或发电机使用。' },
  { id: 'generator', name: '备用发电机', category: 'power', price: 2400, icon: '⚙️', kind: 'facility', max: 1, description: '留给连续阴天的一点从容。', detail: '自动备用开启且电量低于 3 kWh 时，每天最多消耗 1 L 燃料发电 6 kWh；需蓄电池。', requires: ['battery'] },
  { id: 'fuel', name: '安全储存燃料', category: 'power', price: 350, icon: '🛢️', kind: 'supply', resource: 'fuel', amount: 5, description: '给备用电力和灶台留一份保障。', detail: '每桶 5 L；发电每次耗 1 L；烹饪按菜谱份量耗用，也可改用电。' },
  { id: 'lamp', name: '充电阅读灯', category: 'power', price: 260, icon: '💡', kind: 'facility', max: 1, description: '给窗边的小桌子留一圈暖光。', detail: '每天自动耗电 0.2 kWh；有电时舒适度 +5。' },
  { id: 'seeds', name: '家庭种子盒', category: 'garden', price: 120, icon: '🌱', kind: 'supply', resource: 'seeds', amount: 12, description: '四种作物都能种，从一小块地开始。', detail: '每盒 12 袋；播种耗 1 袋，正常收获会返还 1 袋种子。' },
  { id: 'planter', name: '新增种植箱', category: 'garden', price: 650, icon: '🪴', kind: 'facility', max: 3, description: '再为院子添一小块绿意。', detail: '每个增加 1 块种植地；自带 1 块，最多扩展到 4 块。' },
  { id: 'greenhouse', name: '小型温室罩', category: 'garden', price: 1800, icon: '🌿', kind: 'facility', max: 1, description: '让日子慢慢过，让作物长快一点。', detail: '所有作物成熟天数减少 1 天，最少 2 天；浇水量不变。' },
  { id: 'compost', name: '循环堆肥箱', category: 'garden', price: 980, icon: '🍂', kind: 'facility', max: 1, description: '把日常厨余变成小院的养分。', detail: '无需额外操作，每次作物收获增加 2 份产量。' },
  { id: 'seedbox', name: '留种工具套装', category: 'garden', price: 480, icon: '🫘', kind: 'facility', max: 1, description: '今年的小种子，会长成下一轮收获。', detail: '每次收获额外返还 1 袋种子（共返还 2 袋）。' },
  { id: 'coop', name: '种鸡小木屋', category: 'animals', price: 1800, icon: '🐔', kind: 'facility', max: 1, description: '一公两母，一座小窝，开始新的小生命。', detail: '含 1 公 2 母，容量 8 只；成年鸡每日各耗饲料 1 份、水 1 L。每 2 个照料日产蛋；种蛋可吃或孵化，6 天出壳、8 天长大。' },
  { id: 'ducks', name: '鸭舍与小水盆', category: 'animals', price: 2200, icon: '🦆', kind: 'facility', max: 1, description: '一公两母，摇摇摆摆的小家庭。', detail: '含 1 公 2 母，容量 8 只；成年鸭每日各耗饲料 1 份、水 1.25 L。每 3 个照料日产蛋；种蛋 8 天出壳、10 天长大。' },
  { id: 'pond', name: '循环小鱼池', category: 'animals', price: 3600, icon: '🐠', kind: 'facility', max: 1, description: '水面泛起一点波纹，也多了一份期待。', detail: '含 10 条成鱼，容量 20 条；每条每日耗饲料 0.2 份、水 0.25 L。自由捕捞；留至少 2 条成鱼可繁育，每批 4 条鱼苗，照料 6 天长大。' },
  { id: 'feed', name: '混合饲料袋', category: 'animals', price: 240, icon: '🌾', kind: 'supply', resource: 'feed', amount: 30, description: '鸡、鸭和鱼都能使用的游戏饲料。', detail: '每袋 30 份；也可种植饲料草持续补充。' },
  { id: 'stove', name: '两用小院灶台', category: 'home', price: 580, icon: '🍲', kind: 'facility', max: 1, description: '关上门，认真做一顿自己的饭。', detail: '支持电力或燃料。每道菜单独显示食材、能源和精力消耗；默认优先用电，不够时用燃料。熟食可分份食用，也可以冷藏保存。' },
  { id: 'books', name: '书与桌游角', category: 'home', price: 280, icon: '📚', kind: 'facility', max: 1, description: '可以重读的小说，和不用赶时间的下午。', detail: '永久舒适度 +8；解锁读书活动，每天可恢复精力和健康。' },
  { id: 'bed', name: '柔软床品', category: 'home', price: 900, icon: '🛏️', kind: 'facility', max: 1, description: '每一天都从睡个好觉开始。', detail: '永久舒适度 +10，每晚额外恢复 5 精力。' },
  { id: 'radio', name: '手摇收音机', category: 'home', price: 380, icon: '📻', kind: 'facility', max: 1, description: '偶尔听听远处的声音，再回到自己的生活。', detail: '永久舒适度 +5；每 5 天收到一条额外广播，不耗电。' },
  { id: 'insulation', name: '窗帘与遮阳棚', category: 'home', price: 1200, icon: '🪟', kind: 'facility', max: 1, description: '挡住午后的热，也让屋子更像一个家。', detail: '永久舒适度 +7；炎热天个人用水从 6 L 降至 4 L。' },
  { id: 'rug', name: '地毯与靠垫', category: 'home', price: 460, icon: '🛋️', kind: 'facility', max: 1, description: '坐在地上看满满的柜子，也很舒服。', detail: '永久舒适度 +6，不消耗物资。' },
];

export const STARTER_CART = {
  food: 3, water: 4, feed: 4, fuel: 2, seeds: 1,
  tank: 1, rain: 1, filter: 1, battery: 1, solar: 1,
  fridge: 1, coop: 1, planter: 2, stove: 1, books: 1,
  bed: 1, generator: 1,
};

export const WEATHER = [
  { name: '晴朗', icon: '☀️', rain: 0, sun: 1, temperature: 27 },
  { name: '多云', icon: '🌤️', rain: 0, sun: 0.65, temperature: 25 },
  { name: '阵雨', icon: '🌦️', rain: 14, sun: 0.3, temperature: 22 },
  { name: '晴朗', icon: '☀️', rain: 0, sun: 1, temperature: 27 },
  { name: '阴天', icon: '☁️', rain: 0, sun: 0.35, temperature: 24 },
  { name: '大雨', icon: '🌧️', rain: 24, sun: 0.1, temperature: 21 },
  { name: '多云', icon: '🌤️', rain: 0, sun: 0.7, temperature: 25 },
  { name: '晴朗', icon: '☀️', rain: 0, sun: 1, temperature: 29 },
  { name: '炎热', icon: '🌞', rain: 0, sun: 1, temperature: 32 },
  { name: '阵雨', icon: '🌦️', rain: 12, sun: 0.3, temperature: 24 },
  { name: '阴天', icon: '☁️', rain: 0, sun: 0.4, temperature: 23 },
  { name: '细雨', icon: '🌧️', rain: 18, sun: 0.2, temperature: 22 },
];


export const DIFFICULTIES = [
  {id:'cozy',name:'安心囤货',money:50000,icon:'🍵',description:'多留一点余裕，把家布置成喜欢的样子。',assistance:true},
  {id:'balanced',name:'精打细算',money:30000,icon:'🌱',description:'够用，也需要取舍。推荐从这里开始。',assistance:true},
  {id:'hard',name:'紧日子',money:20000,icon:'🕯️',description:'预算紧一些，更依赖食物与生产的规划。',assistance:false},
];
export const ANIMAL_RULES = {
  coop:{name:'鸡',icon:'🐔',capacity:8,feed:1,water:1,cycle:2,hatch:6,grow:8,egg:'chickenEggs',meat:2},
  ducks:{name:'鸭',icon:'🦆',capacity:8,feed:1,water:1.25,cycle:3,hatch:8,grow:10,egg:'duckEggs',meat:2},
  pond:{name:'鱼',icon:'🐟',capacity:20,feed:.2,water:.25,cycle:0,hatch:0,grow:6,meat:1},
};
// Nutrition is a visible game ration: 1 equals one normal day's food.
export const FOODS = {
 food:{nutrition:1,group:'主食',ready:true}, noodles:{nutrition:.9,group:'主食',ready:true}, snacks:{nutrition:.5,group:'零食',ready:true},
 rice:{nutrition:.7,group:'主食',ready:false}, vegetables:{nutrition:.2,group:'蔬菜',ready:true,fresh:true}, potatoes:{nutrition:.6,group:'主食',ready:false,fresh:true},
 eggs:{nutrition:.35,group:'蛋白',ready:false,fresh:true}, chickenEggs:{nutrition:.35,group:'蛋白',ready:false,fresh:true}, duckEggs:{nutrition:.35,group:'蛋白',ready:false,fresh:true},
 fish:{nutrition:.6,group:'蛋白',ready:false,fresh:true}, meat:{nutrition:.7,group:'蛋白',ready:false,fresh:true},
 cookedRice:{nutrition:.7,group:'主食',ready:true,fresh:true}, boiledPotato:{nutrition:.6,group:'主食',ready:true,fresh:true},
 greensDish:{nutrition:.4,group:'蔬菜',ready:true,fresh:true}, boiledEgg:{nutrition:.35,group:'蛋白',ready:true,fresh:true},
 fishSoup:{nutrition:.8,group:'混合',ready:true,fresh:true}, chickenStew:{nutrition:1.3,group:'混合',ready:true,fresh:true}, friedRice:{nutrition:1.25,group:'混合',ready:true,fresh:true}, preserves:{nutrition:.5,group:'加工食物',ready:true},
};
export const RECIPES = [
 {id:'rice',name:'一锅米饭',icon:'🍚',inputs:{rice:1,water:1},output:'cookedRice',yield:1,power:.5,fuel:.15},
 {id:'potato',name:'蒸土豆',icon:'🥔',inputs:{potatoes:1,water:.5},output:'boiledPotato',yield:1,power:.4,fuel:.12},
 {id:'greens',name:'清炒时蔬',icon:'🥬',inputs:{vegetables:2},output:'greensDish',yield:1,power:.4,fuel:.12},
 {id:'egg',name:'煮鸡鸭蛋',icon:'🥚',inputs:{egg:2,water:.5},output:'boiledEgg',yield:2,power:.3,fuel:.1},
 {id:'fish',name:'鲜鱼蔬菜汤',icon:'🍲',inputs:{fish:1,vegetables:1,water:1},output:'fishSoup',yield:1,power:.7,fuel:.2},
 {id:'stew',name:'土豆炖禽肉',icon:'🥘',inputs:{meat:1,potatoes:1,water:1},output:'chickenStew',yield:1,power:.8,fuel:.25},
 {id:'friedRice',name:'田园蛋炒饭',icon:'🍛',inputs:{rice:1,vegetables:1,egg:1,water:.5},output:'friedRice',yield:1,power:.7,fuel:.2},
];
export const ACTIVITIES = [
 {id:'rest',name:'好好休息',icon:'🛌',description:'今天给自己留一个午觉。',energy:0,gain:25,health:3},
 {id:'read',name:'读书的下午',icon:'📖',description:'需要书与桌游角；恢复 12 精力、2 健康。',energy:0,gain:12,health:2,requires:'books'},
 {id:'tidy',name:'整理储物间',icon:'🧺',description:'接下来 3 天，未冷藏鲜食的损耗降为 10%。',energy:12},
 {id:'salvage',name:'拆解闲置材料',icon:'🪚',description:'获得 2 份材料；院里的旧家具一共够拆 8 次。',energy:18},
 {id:'expandPlot',name:'再做一个种植箱',icon:'🪴',description:'消耗 4 份材料，增加一块菜地，最多 4 块。',energy:20,materials:4},
 {id:'expandCoop',name:'扩建鸡舍',icon:'🔨',description:'消耗 4 份材料，鸡舍容量 +4，最多扩建两次。',energy:18,materials:4,requires:'coop'},
 {id:'expandDucks',name:'扩建鸭舍',icon:'🔨',description:'消耗 4 份材料，鸭舍容量 +4，最多扩建两次。',energy:18,materials:4,requires:'ducks'},
 {id:'expandPond',name:'扩建鱼池',icon:'🪣',description:'消耗 5 份材料，鱼池容量 +8，最多扩建两次。',energy:20,materials:5,requires:'pond'},
];
Object.assign(RESOURCE_META, {
 noodles:{name:'方便食品',unit:'份',icon:'🍜'},snacks:{name:'零食',unit:'份',icon:'🍪'},rice:{name:'大米',unit:'份',icon:'🌾'},potatoes:{name:'土豆',unit:'份',icon:'🥔'},
 meat:{name:'禽肉',unit:'份',icon:'🍗'},chickenEggs:{name:'鸡种蛋',unit:'枚',icon:'🥚'},duckEggs:{name:'鸭种蛋',unit:'枚',icon:'🥚'},
 cookedRice:{name:'米饭',unit:'份',icon:'🍚'},boiledPotato:{name:'蒸土豆',unit:'份',icon:'🥔'},greensDish:{name:'炒时蔬',unit:'份',icon:'🥬'},boiledEgg:{name:'熟鸡鸭蛋',unit:'枚',icon:'🥚'},
 fishSoup:{name:'鲜鱼蔬菜汤',unit:'份',icon:'🍲'},chickenStew:{name:'土豆炖禽肉',unit:'份',icon:'🥘'},friedRice:{name:'田园蛋炒饭',unit:'份',icon:'🍛'},preserves:{name:'保存食品',unit:'份',icon:'🫙'},materials:{name:'建造材料',unit:'份',icon:'🪵'},
});
ITEMS.splice(1,0,{id:'rice',name:'真空大米袋',category:'pantry',price:220,icon:'🌾',kind:'supply',resource:'rice',amount:12,description:'先吃一碗踏实的米饭。',detail:'每袋 12 份；每份食量 70%，需灶台烹饪。不变质。'});
ITEMS.push({id:'materials',name:'小院修造材料',category:'home',price:450,icon:'🪵',kind:'supply',resource:'materials',amount:8,description:'木板、连接件和种植土，留给以后的扩建。',detail:'每组 8 份；扩建菜地、圈舍使用，也可在院内有限回收。'});
export const HARD_STARTER_CART = {food:3,rice:2,water:4,feed:3,fuel:2,seeds:1,tank:1,rain:1,filter:1,battery:1,solar:1,stove:1,coop:1,planter:2};
