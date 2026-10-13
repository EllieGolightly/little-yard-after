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
  { id: 'potatoes', name: '土豆', icon: '🥔', days: 6, water: 2, yield: 10, resource: 'vegetables', seedCost: 1 },
  { id: 'pumpkin', name: '南瓜', icon: '🎃', days: 8, water: 3, yield: 15, resource: 'vegetables', seedCost: 1 },
  { id: 'fodder', name: '饲料草', icon: '🌾', days: 5, water: 2, yield: 18, resource: 'feed', seedCost: 1 },
];

export const ITEMS = [
  { id: 'food', name: '耐储食品箱', category: 'pantry', price: 260, icon: '🥫', kind: 'supply', resource: 'food', amount: 10, description: '米面、罐头和方便食品，踏实的底气。', detail: '每箱 10 份；每天吃 1 份，不会变质。' },
  { id: 'noodles', name: '喜欢的速食', category: 'pantry', price: 180, icon: '🍜', kind: 'supply', resource: 'food', amount: 6, description: '总有几天，只想煮一碗热乎的面。', detail: '每箱 6 份储备食物；可直接作为每日口粮。' },
  { id: 'vegetables', name: '当季蔬菜篮', category: 'pantry', price: 120, icon: '🥦', kind: 'supply', resource: 'vegetables', amount: 6, description: '先把新鲜的味道带回家。', detail: '每篮 6 份；可当口粮或做饭，需要冰箱保鲜。' },
  { id: 'eggs', name: '一盒鸡蛋', category: 'pantry', price: 80, icon: '🥚', kind: 'supply', resource: 'eggs', amount: 8, description: '早餐也要认真对待。', detail: '每盒 8 份；可当口粮或做饭，需要冰箱保鲜。' },
  { id: 'fish', name: '处理好的鲜鱼', category: 'pantry', price: 140, icon: '🐟', kind: 'supply', resource: 'fish', amount: 4, description: '已经分装好，等一顿丰盛的晚饭。', detail: '每包 4 份；可当口粮或做饭，需要冰箱保鲜。' },
  { id: 'fridge', name: '节能冰箱', category: 'pantry', price: 1600, icon: '🧊', kind: 'facility', max: 1, description: '让每一次收获都能多留一会儿。', detail: '开启时每天耗电 1.2 kWh；有电则当天鲜食不损耗。无保鲜的第 4、8、12…天，各类鲜食损耗 25%（至少 1 份）。' },
  { id: 'snacks', name: '零食储备箱', category: 'pantry', price: 320, icon: '🍪', kind: 'supply', resource: 'food', amount: 8, description: '饼干、坚果和巧克力，留给慢慢过的日子。', detail: '每箱 8 份储备食物；不会变质。' },
  { id: 'water', name: '密封饮用水', category: 'water', price: 90, icon: '💧', kind: 'supply', resource: 'water', amount: 40, description: '先储好水，心里就安定了一半。', detail: '每组 40 L；基础储水上限 80 L，超出需先购买储水箱。' },
  { id: 'tank', name: '大储水箱', category: 'water', price: 1800, icon: '🛢️', kind: 'facility', max: 1, description: '把雨天的富余，留给晴天。', detail: '清洁水容量增加 320 L，总容量 400 L。' },
  { id: 'rain', name: '屋檐集雨器', category: 'water', price: 1600, icon: '🌧️', kind: 'facility', max: 1, description: '听见雨声时，知道水箱又会满一些。', detail: '需搭配重力净水器使用；每天收集降雨量 × 4 L 的清洁水，超出容量自动溢出。' },
  { id: 'filter', name: '重力净水器', category: 'water', price: 900, icon: '🚰', kind: 'facility', max: 1, description: '不依赖电力的雨水过滤设备。', detail: '与集雨器搭配产出清洁水；无需耗电或更换耗材。' },
  { id: 'well', name: '院中浅井', category: 'water', price: 7800, icon: '🪣', kind: 'facility', max: 1, description: '给院子多一份稳定的水源。', detail: '搭配净水器，每天稳定补充 12 L 清洁水，无需电力。', requires: ['filter'] },
  { id: 'solar', name: '屋顶太阳能', category: 'power', price: 5200, icon: '☀️', kind: 'facility', max: 1, description: '晴天也成为一种可以储存的收获。', detail: '每天发电 8 × 日照系数 kWh；需搭配蓄电池，电量不超过容量。', requires: ['battery'] },
  { id: 'battery', name: '家用蓄电池', category: 'power', price: 3200, icon: '🔋', kind: 'facility', max: 1, description: '天黑以后，家里的灯依然能亮。', detail: '电量容量 12 kWh；购入即预充 8 kWh，配合太阳能或发电机使用。' },
  { id: 'generator', name: '备用发电机', category: 'power', price: 2400, icon: '⚙️', kind: 'facility', max: 1, description: '留给连续阴天的一点从容。', detail: '自动备用开启且电量低于 3 kWh 时，每天最多消耗 1 L 燃料发电 6 kWh；需蓄电池。', requires: ['battery'] },
  { id: 'fuel', name: '安全储存燃料', category: 'power', price: 350, icon: '🛢️', kind: 'supply', resource: 'fuel', amount: 5, description: '给备用电力和灶台留一份保障。', detail: '每桶 5 L；发电每次耗 1 L，做饭每次耗 1 L。' },
  { id: 'lamp', name: '充电阅读灯', category: 'power', price: 260, icon: '💡', kind: 'facility', max: 1, description: '给窗边的小桌子留一圈暖光。', detail: '每天自动耗电 0.2 kWh；有电时舒适度 +5。' },
  { id: 'seeds', name: '家庭种子盒', category: 'garden', price: 120, icon: '🌱', kind: 'supply', resource: 'seeds', amount: 12, description: '四种作物都能种，从一小块地开始。', detail: '每盒 12 袋；播种耗 1 袋，正常收获会返还 1 袋种子。' },
  { id: 'planter', name: '新增种植箱', category: 'garden', price: 650, icon: '🪴', kind: 'facility', max: 3, description: '再为院子添一小块绿意。', detail: '每个增加 1 块种植地；自带 1 块，最多扩展到 4 块。' },
  { id: 'greenhouse', name: '小型温室罩', category: 'garden', price: 1800, icon: '🌿', kind: 'facility', max: 1, description: '让日子慢慢过，让作物长快一点。', detail: '所有作物成熟天数减少 1 天，最少 2 天；浇水量不变。' },
  { id: 'compost', name: '循环堆肥箱', category: 'garden', price: 980, icon: '🍂', kind: 'facility', max: 1, description: '把日常厨余变成小院的养分。', detail: '无需额外操作，每次作物收获增加 2 份产量。' },
  { id: 'seedbox', name: '留种工具套装', category: 'garden', price: 480, icon: '🫘', kind: 'facility', max: 1, description: '今年的小种子，会长成下一轮收获。', detail: '每次收获额外返还 1 袋种子（共返还 2 袋）。' },
  { id: 'coop', name: '双鸡小木屋', category: 'animals', price: 1800, icon: '🐔', kind: 'facility', max: 1, description: '两只母鸡，一座小窝，院子热闹起来。', detail: '含 2 只母鸡；每日共需 2 份饲料 + 3 L 水，照料满 2 天收获 2 份蛋；缺料则暂停，不会死亡。' },
  { id: 'ducks', name: '鸭舍与小水盆', category: 'animals', price: 2200, icon: '🦆', kind: 'facility', max: 1, description: '两位摇摇摆摆的院中新住客。', detail: '含 2 只鸭；每日共需 3 份饲料 + 4 L 水，照料满 3 天收获 3 份蛋；缺料则暂停。' },
  { id: 'pond', name: '循环小鱼池', category: 'animals', price: 3600, icon: '🐠', kind: 'facility', max: 1, description: '水面泛起一点波纹，也多了一份期待。', detail: '含鱼苗；每日需 1 份饲料 + 3 L 水，照料满 7 天收获 5 份鱼，鱼群自行繁育；缺料则暂停。' },
  { id: 'feed', name: '混合饲料袋', category: 'animals', price: 240, icon: '🌾', kind: 'supply', resource: 'feed', amount: 30, description: '鸡、鸭和鱼都能使用的游戏饲料。', detail: '每袋 30 份；也可种植饲料草持续补充。' },
  { id: 'stove', name: '小院灶台', category: 'home', price: 580, icon: '🍲', kind: 'facility', max: 1, description: '关上门，认真做一顿自己的饭。', detail: '每日可做饭 1 次：2 份蔬菜 + 1 份蛋或鱼 + 1 L 燃料 → 6 份耐储熟食；接下来 3 天舒适度 +10。' },
  { id: 'books', name: '书与桌游角', category: 'home', price: 280, icon: '📚', kind: 'facility', max: 1, description: '可以重读的小说，和不用赶时间的下午。', detail: '永久舒适度 +8，不耗电。' },
  { id: 'bed', name: '柔软床品', category: 'home', price: 900, icon: '🛏️', kind: 'facility', max: 1, description: '每一天都从睡个好觉开始。', detail: '永久舒适度 +10，不消耗物资。' },
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
