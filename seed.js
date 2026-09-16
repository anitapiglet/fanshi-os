/* ===== 演示資料 seed ===== */
(function(){
var F = window.__FS;
window.__seed = {};

window.__seed.fillDemoData = function(){
  var DB = F.DB;
  var today = F.todayStr();
  var demoFlags = DB.meta.demoFlags = DB.meta.demoFlags || {};

  if(!DB.tasks.length){
    demoFlags.tasks = true;
    DB.tasks.push(
      {id:F.uid(), title:"錄製本週 IG 短影音腳本", date:today, time:"10:00", category:"自媒體", priority:"高", tags:["本週更新"], done:false, isDemo:true, createdAt:Date.now(), deletedAt:null},
      {id:F.uid(), title:"知英語新客戶電話追蹤", date:today, time:"14:00", category:"知英語", priority:"中", tags:[], done:false, isDemo:true, createdAt:Date.now(), deletedAt:null},
      {id:F.uid(), title:"凡蒔顧問網站架設提案", date:F.addDays(today,-1), time:"09:00", category:"凡蒔顧問", priority:"高", tags:[], done:false, isDemo:true, createdAt:Date.now(), deletedAt:null},
      {id:F.uid(), title:"晨間拉伸 10 分鐘", date:today, time:"07:30", category:"生活", priority:"低", tags:["健身"], done:true, isDemo:true, createdAt:Date.now(), deletedAt:null}
    );
  }
  if(!DB.plan.calendar.length){
    demoFlags.calendar = true;
    var base = F.startOfWeek(today);
    ["script","shoot","edit","publish","review"].forEach(function(stage,i){
      DB.plan.calendar.push({id:F.uid(), date:F.addDays(base,i), stage:stage, done:i<2, isDemo:true});
    });
  }
  if(!DB.life.cycle.lastStart){
    demoFlags.cycle = true;
    DB.life.cycle = {lastStart:F.addDays(today,-6), cycleLen:28, periodLen:5};
  }
  if(!DB.life.weightPlan){
    demoFlags.weightPlan = true;
    DB.life.weightPlan = {height:160, weight:58, age:30, activity:1.3, targetWeight:52, deficit:400};
  }
  if(!DB.life.weightLogs.length){
    demoFlags.weightLogs = true;
    for(var i=13;i>=0;i--){
      DB.life.weightLogs.push({date:F.addDays(today,-i), weight:+(58 - (13-i)*0.07).toFixed(1)});
    }
  }
  if(!DB.life.foodLogs.filter(function(f){return f.date===today;}).length){
    demoFlags.foodLogs = true;
    DB.life.foodLogs.push(
      {id:F.uid(), date:today, name:"燕麥優格早餐", cal:320, isDemo:true},
      {id:F.uid(), date:today, name:"雞胸肉沙拉", cal:410, isDemo:true}
    );
  }
  if(!DB.content.pipeline.length){
    demoFlags.pipeline = true;
    DB.content.pipeline.push(
      {id:F.uid(), title:"經期友善運動排程分享", stage:"script", updatedAt:Date.now()-1*86400000, notes:"", isDemo:true, deletedAt:null},
      {id:F.uid(), title:"雅思寫作Task2破題技巧", stage:"edit", updatedAt:Date.now()-4*86400000, notes:"", isDemo:true, deletedAt:null},
      {id:F.uid(), title:"AI 工具日常效率實測", stage:"idea", updatedAt:Date.now(), notes:"", isDemo:true, deletedAt:null},
      {id:F.uid(), title:"減脂期外食選擇指南", stage:"published", updatedAt:Date.now()-6*86400000, notes:"", isDemo:true, deletedAt:null}
    );
  }
  if(!DB.content.trending.length){
    demoFlags.trending = true;
    DB.content.trending.push(
      {rank:1, topic:"上班族10分鐘居家增肌菜單", heat:98, engagement:"12.4萬", link:"", isDemo:true},
      {rank:2, topic:"雅思口說常見誤區", heat:91, engagement:"8.7萬", link:"", isDemo:true},
      {rank:3, topic:"AI 工具週報：效率新玩法", heat:87, engagement:"7.2萬", link:"", isDemo:true}
    );
  }
  if(!DB.info.news.domestic.length){
    demoFlags.news = true;
    DB.info.news.domestic.push({id:F.uid(), title:"台灣女性健身風潮持續升溫", summary:"示例摘要：近年重訓與體態管理內容互動率上升，適合作為選題方向。", url:"#", saved:false, isDemo:true});
    DB.info.news.intl.push({id:F.uid(), title:"國際教育科技市場觀察", summary:"示例摘要：線上英語學習平台需求持續成長。", url:"#", saved:false, isDemo:true});
    DB.info.news.ai.push({id:F.uid(), title:"生成式 AI 在內容創作的應用", summary:"示例摘要：AI 輔助腳本產出工具持續迭代，可作為自媒體選題靈感。", url:"#", saved:false, isDemo:true});
  }
  if(!DB.info.inspirations.length){
    demoFlags.inspirations = true;
    DB.info.inspirations.push({id:F.uid(), text:"把「養生階段」跟「訓練強度」綁在一起講，觀眾共鳴度更高", starred:true, tags:[], createdAt:Date.now(), isDemo:true, deletedAt:null});
  }
  if(!DB.books.recommended.length){
    demoFlags.books = true;
    DB.books.recommended.push(
      {title:"原子習慣", author:"James Clear", category:"效率", match:96, doubanUrl:"https://book.douban.com/", isDemo:true},
      {title:"AI 2041", author:"李開復", category:"AI", match:91, doubanUrl:"https://book.douban.com/", isDemo:true},
      {title:"深度工作力", author:"Cal Newport", category:"效率", match:88, doubanUrl:"https://book.douban.com/", isDemo:true}
    );
    DB.books.podcasts.push({title:"矽谷輕鬆談", host:"科技媒體", link:"", isDemo:true});
  }
  if(!DB.books.mylist.length){
    demoFlags.mylist = true;
    DB.books.mylist.push({id:F.uid(), title:"原子習慣", category:"效率", status:"進行中", rating:4, progress:62, isDemo:true, deletedAt:null});
  }
  if(!DB.work.fanshi.clients.length){
    demoFlags.fanshi = true;
    DB.work.fanshi.clients.push(
      {id:F.uid(), name:"晨曦瑜伽館官網改版", type:"網站架設", stage:"進行中", nextStep:"本週五交付首版設計", updatedAt:Date.now(), isDemo:true, deletedAt:null},
      {id:F.uid(), name:"小型工作室品牌顧問", type:"顧問外包", stage:"洽談", nextStep:"下週提案簡報", updatedAt:Date.now()-6*86400000, isDemo:true, deletedAt:null}
    );
  }
  if(!DB.work.zhi.customers.length){
    demoFlags.zhi = true;
    DB.work.zhi.customers.push(
      {id:F.uid(), name:"陳同學", source:"測驗quiz", stage:"已預約", notes:"目標7.0，預計12月考試", lastContactTs:Date.now()-1*86400000, isDemo:true, deletedAt:null},
      {id:F.uid(), name:"林同學", source:"官網預約", stage:"已體驗", notes:"體驗課反饋良好，待報價", lastContactTs:Date.now()-5*86400000, isDemo:true, deletedAt:null},
      {id:F.uid(), name:"黃同學", source:"轉介", stage:"已成交", notes:"60天保證班", lastContactTs:Date.now()-10*86400000, isDemo:true, deletedAt:null}
    );
  }
  if(!DB.inbox.length){
    demoFlags.inbox = true;
    var it1 = {id:F.uid(), type:"link", content:"https://example.com/雅思新制介紹（先收藏，之後看要不要寫成選題）", createdAt:Date.now(), status:"pending", resolvedModule:null, isDemo:true, deletedAt:null};
    it1.aiSuggest = F.aiSuggestInboxDestination(it1);
    var it2 = {id:F.uid(), type:"text", content:"記得幫Courify客戶準備下週的提案大綱", createdAt:Date.now(), status:"pending", resolvedModule:null, isDemo:true, deletedAt:null};
    it2.aiSuggest = F.aiSuggestInboxDestination(it2);
    DB.inbox.push(it1, it2);
  }
  DB.meta.seeded = true;
};

window.__seed.clearDemoData = function(){
  var DB = F.DB;
  function stripDemo(arr){ if(!arr) return; for(var i=arr.length-1;i>=0;i--){ if(arr[i].isDemo) arr.splice(i,1); } }
  stripDemo(DB.tasks); stripDemo(DB.plan.calendar); stripDemo(DB.life.weightLogs.filter?null:null);
  DB.life.weightLogs = DB.life.weightLogs.filter(function(l){return !l.isDemo;});
  stripDemo(DB.life.foodLogs); stripDemo(DB.content.pipeline); stripDemo(DB.content.trending);
  stripDemo(DB.info.news.domestic); stripDemo(DB.info.news.intl); stripDemo(DB.info.news.ai);
  stripDemo(DB.info.inspirations); stripDemo(DB.books.recommended); stripDemo(DB.books.podcasts); stripDemo(DB.books.mylist);
  stripDemo(DB.work.fanshi.clients); stripDemo(DB.work.zhi.customers); stripDemo(DB.work.courify.tasks); stripDemo(DB.inbox);
  var f = DB.meta.demoFlags||{};
  if(f.cycle) DB.life.cycle = {lastStart:null, cycleLen:28, periodLen:5};
  if(f.weightPlan) DB.life.weightPlan = null;
  DB.meta.demoFlags = {};
};
})();
