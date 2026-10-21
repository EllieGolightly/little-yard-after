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
  { id: 'heater', name: '取暖壁炉', category: 'home', price: 780, icon: '🔥', kind: 'facility', max: 1, description: '冬天，把屋子烧得暖烘烘的。', detail: '寒冷天（气温低于 15°C）每天自动消耗 1 L 燃料取暖；可在设置中改为电取暖（3 kWh/天）。没有取暖时，寒冷会降低舒适度，并缓慢影响健康。' },
];

export const STARTER_CART = {
  food: 3, water: 4, feed: 4, fuel: 6, seeds: 1,
  tank: 1, rain: 1, filter: 1, battery: 1, solar: 1,
  fridge: 1, coop: 1, planter: 2, stove: 1, books: 1,
  bed: 1, generator: 1, radio: 1, heater: 1,
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

// ── 季节轮替：每 30 天一季，四季循环。第 1 个冬天在第 91 天，留足准备时间 ──
export const SEASON_LENGTH = 30;
export const SEASONS = [
  { id:'spring', name:'春季', icon:'🌱', tempDelta:0, sunFactor:1, rainFactor:1, water:4,
    desc:'冰雪化尽，小院又有了新绿。', tip:'温和的季节，适合把日子理顺。' },
  { id:'summer', name:'夏季', icon:'☀️', tempDelta:5, sunFactor:1.1, rainFactor:0.3, water:6,
    desc:'日头很足，雨水变少。', tip:'炎热干燥，多存水，太阳能也更充足。' },
  { id:'autumn', name:'秋季', icon:'🍂', tempDelta:-2, sunFactor:1, rainFactor:1, water:4,
    desc:'风里有了凉意，是收获的季节。', tip:'为冬天储备燃料和食物的关键时候。' },
  { id:'winter', name:'冬季', icon:'❄️', tempDelta:-18, sunFactor:0.4, rainFactor:0.5, water:4,
    desc:'天寒地冻，日照微弱。', tip:'菜地休眠、太阳能锐减，需要取暖。提前备好燃料与粮食。' },
];

// ── 广播主线《世界在恢复》：需要收音机，每 5 天一条，铺满 180 天 ──
export const BROADCASTS = [
 { day:5, text:'应急广播通知：请各位居民保持冷静，留在家中、锁好门窗，救援正在组织。重复——请留在家中。' },
 { day:10, text:'……部分区域实行临时物资管制，请节约使用水和电，社区会尽快安排。重复……' },
 { day:15, text:'（信号中断，只剩下沙沙的杂音）……滋……滋……' },
 { day:20, text:'……能听到吗？如果有人听到，请……（信号断断续续）……' },
 { day:25, text:'……（长时间的静电声，偶尔有模糊的人声，像是很远的地方在说话）……' },
 { day:35, text:'……（只有静电和偶尔的干扰，像很远很远的雷声）……' },
 { day:40, text:'……（一段循环播放的录音，听不清内容，像谁在反复念着什么）……' },
 { day:45, text:'……（音乐，很微弱，是一首老歌，断断续续地飘着）……' },
 { day:50, text:'……有人吗？……这里是……（杂音）……如果有人在听，请……' },
 { day:55, text:'……（一个疲惫的声音）……听到请回答，任何频率都好，我们在找……' },
 { day:60, text:'社区电台呼叫：这里是西山社区临时广播站。我们在附近的山谷里，有干净的水和食物。如果有人听到，请在这个频率回应。重复——这里是西山社区。' },
 { day:65, text:'社区电台：我们聚集了几十户人家，有医生、有会修东西的人。如果你有一个安全的地方，也请守住它，我们会慢慢把大家连起来。' },
 { day:70, text:'社区电台：东边的村子也有人回应了，我们在彼此之间标记了安全的路线。请记住，你不是一个人。' },
 { day:75, text:'社区电台：我们建起了互助的网络。有多余的物资，可以留给过路的人；需要帮助，就在门口做一个记号。' },
 { day:80, text:'社区电台：社区设有饮水和食物的分发点。如果撑不住了，往西山方向走，白天能看到旗帜。' },
 { day:85, text:'社区电台：我们在寻找散落在各处的人。如果你的小院还安好，请在夜里点一盏灯，让我们知道你在。' },
 { day:90, text:'社区电台：有居民说，在山脚下的小院附近看到过炊烟和灯光。如果你听到了——我们知道你在，请保持这个频率。' },
 { day:95, text:'社区电台：天气要冷了。请检查住处，堵好缝隙，存一些取暖的东西。冬天很长，但我们一起过。' },
 { day:100, text:'社区电台：取暖请注意安全，夜里睡觉，炉火旁不要放易燃的东西。照顾好自己，就是帮了大家。' },
 { day:105, text:'社区电台：下雪了，孩子们在社区门口堆了雪人。如果你也在窗前看雪，就当我们一起看过了。' },
 { day:110, text:'社区电台：今晚讲一个故事。灾难来的那天，社区里的人挨家挨户敲门，把落单的人都找了出来。这个冬天，没有人是一个人。' },
 { day:115, text:'社区电台：再坚持一下，雪化了路就通了。我们说好，春天要见面。' },
 { day:120, text:'社区电台：春天快到了。等路好走一些，我们会沿着山，挨家挨户找过去。请等着我们。' },
 { day:125, text:'社区电台：冰雪在融化，小溪又开始流了。我们在整理行囊，准备出发。' },
 { day:130, text:'社区电台：今天，我们的联络员沿着山脚出发了。如果有人敲门，也许就是他们——请开门。' },
 { day:135, text:'社区电台：联络员带回了消息：山脚下有一座整齐的小院，炊烟按时升起。我们的交换网络，要把你连进来。' },
 { day:140, text:'社区电台：春天是播种的季节。我们整理了一批种子，会让联络员带给你；也欢迎你把留下的种子，分给更多的人。' },
 { day:145, text:'社区电台：又有新的人找到了社区。每个人都带着自己的故事，和一双还能做些什么的手。' },
 { day:150, text:'社区电台：物资交换的路线已经打通，多余的收获可以换成需要的东西。我们在慢慢恢复。' },
 { day:155, text:'社区电台：镇上的集市，准备重新开张了。大家在打扫那条街，像准备一个节日。' },
 { day:160, text:'社区电台：通往镇上的路，在一段一段修通，汽车也许很快就能开了。' },
 { day:165, text:'社区电台：集市重开的日子定了。如果你能来，带上你的收获，也带上想见到的人。' },
 { day:170, text:'社区电台：今天，集市重新开张了，街上又有了人声。谢谢你守住了这座小院，等到了这一天。' },
 { day:175, text:'社区电台：最后的路也快通了。外面的世界，正在一点一点回来。' },
 { day:180, text:'社区电台：道路打通了，小镇的灯重新亮了起来。如果你愿意，可以回来，和我们一起重建；如果你想留下，这座小院也已经是这片新土地的一部分。无论你怎么选——欢迎回来。' },
];

// ── 章节与节点：把"无尽经营"变成"有章节的经营" ──
export const CHAPTERS = [
  { id:'ch1', start:1, end:30, name:'第一章 · 春：突如其来', scene:'广播里满是疏散与应急的通知。' },
  { id:'ch2', start:31, end:60, name:'第二章 · 夏：长久的沉寂', scene:'信号断了，只剩下夏天的蝉鸣。' },
  { id:'ch3', start:61, end:90, name:'第三章 · 秋：远处的声音', scene:'一个社区电台，在山谷里响了起来。' },
  { id:'ch4', start:91, end:120, name:'第四章 · 冬：一起等待', scene:'雪落下来，春天是一个约定。' },
  { id:'ch5', start:121, end:150, name:'第五章 · 又一春：来客', scene:'有人沿着山脚，敲响了小院的门。' },
  { id:'ch6', start:151, end:180, name:'第六章 · 又一夏：世界回来', scene:'集市重开，道路打通。' },
];
export const CHAPTER_MILESTONES = [
  { day:60, id:'signal', name:'收到社区电台', desc:'山谷里，一个社区电台第一次清晰地响了起来。' },
  { day:90, id:'known', name:'社区知道了你的存在', desc:'他们看到了山脚下的炊烟。' },
  { day:120, id:'promise', name:'春天的约定', desc:'广播说，春天会沿着山找过来。' },
  { day:130, id:'visitor', name:'联络员来访', desc:'小院的门，被外面的人敲响了。', feature:'neighbors' },
  { day:150, id:'exchange', name:'交换网络开放', desc:'多余的收获，可以换成需要的东西。', feature:'exchange' },
  { day:170, id:'market', name:'集市重开', desc:'镇上的街，又有了人声。', feature:'market' },
  { day:180, id:'road', name:'道路打通', desc:'是离开，还是留下？', feature:'ending' },
];

// ── 季节心愿：每季 3 个，季节内完成；metric 对应 seasonStats 或当前快照 ──
export const WISHES = {
  spring: [
    { desc:'在这个春天种下 3 次作物', metric:'plantings', target:3 },
    { desc:'完成 1 次收获', metric:'harvests', target:1 },
    { desc:'保持 7 天以上的食物储备', metric:'foodDays', target:7 },
  ],
  summer: [
    { desc:'收获 4 次', metric:'harvests', target:4 },
    { desc:'储水达到 200 L', metric:'water', target:200 },
    { desc:'做 3 顿饭', metric:'meals', target:3 },
  ],
  autumn: [
    { desc:'收获 6 次', metric:'harvests', target:6 },
    { desc:'存够 20 份燃料', metric:'fuel', target:20 },
    { desc:'迎接 1 个新生命', metric:'births', target:1 },
  ],
  winter: [
    { desc:'不靠援助度过 20 天', metric:'aidFree', target:20 },
    { desc:'保持健康在 75 以上', metric:'health', target:75 },
    { desc:'吃一顿丰盛的饭', metric:'heartyMeal', target:1 },
  ],
};

// ── 邻居：第 130 天联络员来访后陆续出现；trades 中 give=你给、get=你得 ──
export const NEIGHBORS = [
  { id:'zhou', name:'周师傅', icon:'🔧', title:'退休电工', meetsAt:130,
    intro:'住东边山坡的退休电工，话不多，手很巧。灾变后一个人守着老房子，靠修修补补过日子。',
    greeting:'……会修东西。缺什么零件，敲门。',
    trades:[
      { give:{resource:'chickenEggs',amount:2}, get:{resource:'fuel',amount:1} },
      { give:{resource:'chickenEggs',amount:3}, get:{resource:'power',amount:4} },
      { give:{resource:'feed',amount:3}, get:{resource:'fuel',amount:1} },
    ],
    gift:{ resource:'chickenEggs', amount:2, bond:3, label:'他说过，鸡蛋可以留着换零件；但你单纯送他，他会收下。' }},
  { id:'he', name:'阿禾', icon:'🌱', title:'带着弟弟的姑娘', meetsAt:130,
    intro:'住西边菜畦旁的姑娘，带着十岁的弟弟。擅长种菜、晒草药，日子过得仔细。',
    greeting:'这是我自己留的菜种，长得好。你要是缺种子，跟我说。',
    trades:[
      { give:{resource:'chickenEggs',amount:2}, get:{resource:'seeds',amount:1} },
      { give:{resource:'fuel',amount:1}, get:{resource:'seeds',amount:1} },
      { give:{resource:'chickenEggs',amount:2}, get:{resource:'vegetables',amount:2} },
      { give:{resource:'fish',amount:1}, get:{resource:'vegetables',amount:3} },
    ],
    gift:{ resource:'chickenEggs', amount:3, bond:4, label:'她想给弟弟攒点鸡蛋补身子；你多给一个，她都要推让半天。' }},
  { id:'chen', name:'陈姨', icon:'🧺', title:'交换网络的组织者', meetsAt:150,
    intro:'镇上的热心人，把方圆几里的住户串成了交换网络。会腌菜、会张罗，谁家有难处都帮衬。',
    greeting:'多的东西别烂在手里，缺的东西别硬扛。拿来，我给你换。',
    trades:[
      { give:{resource:'vegetables',amount:3}, get:{resource:'food',amount:1} },
      { give:{resource:'fish',amount:2}, get:{resource:'food',amount:1} },
      { give:{resource:'chickenEggs',amount:4}, get:{resource:'food',amount:1} },
      { give:{resource:'food',amount:1}, get:{resource:'fuel',amount:1} },
      { give:{resource:'food',amount:2}, get:{resource:'fish',amount:1} },
    ],
    gift:{ resource:'food', amount:1, bond:3, label:'她总说不用惦记自己，但你记得她也会饿。' }},
];

// ── 邻居求助：按天数激活、限时完成；帮忙得回礼并增加好感 ──
export const NEIGHBOR_REQUESTS = [
  { id:'he_eggs', neighbor:'he', day:135, expires:12,
    desc:'阿禾的弟弟受了风寒发烧，想吃点软乎的，想要 2 个鸡蛋补补。',
    need:{resource:'chickenEggs',amount:2}, reward:{resource:'seeds',amount:2}, bond:10 },
  { id:'zhou_fuel', neighbor:'zhou', day:142, expires:14,
    desc:'周师傅的老发电机坏了，夜里冷得睡不着，想借 2 L 燃料先撑几天。',
    need:{resource:'fuel',amount:2}, reward:{resource:'materials',amount:3}, bond:8 },
  { id:'chen_veg', neighbor:'chen', day:155, expires:14,
    desc:'陈姨在给大伙张罗过冬的腌菜，还差 5 份蔬菜，想从你这儿匀一点。',
    need:{resource:'vegetables',amount:5}, reward:{resource:'food',amount:2}, bond:8 },
  { id:'zhou_veg', neighbor:'zhou', day:160, expires:14,
    desc:'周师傅一个人懒得种菜，想吃口新鲜的，想换 4 份蔬菜。',
    need:{resource:'vegetables',amount:4}, reward:{resource:'power',amount:5}, bond:8 },
  { id:'he_fish', neighbor:'he', day:165, expires:12,
    desc:'阿禾想给弟弟熬鱼汤补身子，想要 1 条鲜鱼。',
    need:{resource:'fish',amount:1}, reward:{resource:'vegetables',amount:4}, bond:10 },
  { id:'chen_fish', neighbor:'chen', day:172, expires:12,
    desc:'镇上一位生病的老人想喝口鱼汤，陈姨还差 2 条鱼，想找你换换。',
    need:{resource:'fish',amount:2}, reward:{resource:'food',amount:2}, bond:8 },
];

// 好感度等级名称
export const BOND_LEVELS = [
  { min:0, name:'陌生' }, { min:20, name:'认识' }, { min:40, name:'熟络' }, { min:70, name:'亲近' },
];
export function bondLevel(bond){
  return [...BOND_LEVELS].reverse().find(l => bond >= l.min) || BOND_LEVELS[0];
}
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
export const HARD_STARTER_CART = {food:3,rice:2,water:3,feed:2,fuel:1,seeds:1,tank:1,rain:1,filter:1,battery:1,solar:1,stove:1,coop:1,planter:2,radio:1,heater:1};

// ── 阶段3：装饰、节日、结局 ──
// 装饰：消耗材料建造，永久提升舒适度；每个有数量上限
export const DECORATIONS = [
  { id:'flowerbox', name:'木花盆', icon:'🪴', materials:2, comfort:4, max:2, desc:'在窗下种一排会开花的草，春天的时候很好看。' },
  { id:'windchime', name:'风铃', icon:'🎐', materials:2, comfort:3, max:1, desc:'起风的时候，院子里有清脆的声音。' },
  { id:'lanterns', name:'庭院灯串', icon:'🏮', materials:3, comfort:5, max:1, requires:'solar', desc:'夜晚亮起，需要太阳能；院子不再是黑的。' },
  { id:'flag', name:'布幡', icon:'🚩', materials:1, comfort:2, max:1, desc:'让找过来的人，远远能看见这里有人。' },
];
// 节日：特定日期触发，可选择庆祝（消耗一点物资，获得心情与回礼）
export const FESTIVALS = [
  { id:'winterSolstice', name:'冬至', icon:'🥟', day:120, length:3,
    desc:'白天最短的一天。吃一顿热乎的，就把最长的夜等过去了。',
    cost:{resource:'food',amount:1}, reward:{comfort:8,label:'这一晚睡得很踏实。'} },
  { id:'marketFair', name:'集市重开', icon:'🎪', day:170, length:5,
    desc:'镇上的街重新有了人声。带上一点收获，去看看热闹。',
    cost:{resource:'vegetables',amount:2}, reward:{resource:'materials',amount:2,comfort:6,label:'你带回了一点镇上的旧木料。'} },
  { id:'newYear', name:'新年', icon:'🧧', day:365, length:5, repeat:true,
    desc:'新的一年。给院门贴一副新的布联，和邻居道一声平安。',
    cost:{resource:'food',amount:1}, reward:{comfort:10,label:'新的一年，日子还是慢慢的。'} },
];
// 结局：第 180 天道路打通后选择；选择后可继续经营
export const ENDINGS = [
  { id:'return', name:'回到小镇', icon:'🏘', desc:'收拾行囊，和大家一起，把镇上的灯一盏一盏重新点亮。' },
  { id:'stay', name:'留在小院', icon:'🏡', desc:'守住这片土地，和新的邻居一起，把日子接着过下去。' },
];
