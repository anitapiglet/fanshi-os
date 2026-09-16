/* ===== 今日 Dashboard ===== */
(function(){
var F = window.__FS;

function ring(pct, label, sub){
  var r = 30, c = 2*Math.PI*r;
  var off = c - (pct/100)*c;
  return '<div class="ring-wrap"><svg width="76" height="76" viewBox="0 0 76 76">'+
    '<circle cx="38" cy="38" r="'+r+'" fill="none" stroke="#e2e6de" stroke-width="8"/>'+
    '<circle cx="38" cy="38" r="'+r+'" fill="none" stroke="var(--primary)" stroke-width="8" stroke-linecap="round" '+
    'stroke-dasharray="'+c+'" stroke-dashoffset="'+off+'" transform="rotate(-90 38 38)"/></svg>'+
    '<div><div class="ring-num">'+Math.round(pct)+'%</div><div style="font-size:12px;color:var(--muted)">'+label+'</div>'+(sub?'<div style="font-size:11px;color:var(--muted)">'+sub+'</div>':'')+'</div></div>';
}

F.fillDemoData = function(){ window.__seed.fillDemoData(); F.save(); F.toast("已填充演示數據"); F.render(); };
F.clearDemoData = function(){ window.__seed.clearDemoData(); F.save(); F.toast("已清除演示數據"); F.render(); };
F.openMobileLinkModal = function(){
  var url = window.location.href.split("#")[0];
  F.openModal(
    '<div class="modal-title">手機訪問地址 '+F.helpBtn("gen_mobile_link")+'</div>'+
    '<div class="modal-sub">凡蒔天地是同一個響應式網址，電腦、手機打開同一連結會自動切換版面</div>'+
    '<div class="card" style="word-break:break-all;font-size:13px">'+url+'</div>'+
    '<button class="btn" style="width:100%;margin-top:10px" data-action="copyMobileLink">複製連結</button>'
  );
};
F.copyMobileLink = function(){
  var url = window.location.href.split("#")[0];
  if(navigator.clipboard) navigator.clipboard.writeText(url).then(function(){ F.toast("已複製連結"); });
  else F.toast("請手動複製上方網址");
};

window.__PAGES.today = function(){
  var DB = F.DB;
  var today = F.todayStr();
  var todosToday = F.alive(DB.tasks).filter(function(t){return t.date===today;});
  var doneCount = todosToday.filter(function(t){return t.done;}).length;
  var totalCount = todosToday.length;
  var nowTasks = todosToday.filter(function(t){return !t.done;}).sort(function(a,b){return (a.time||"99:99")<(b.time||"99:99")?-1:1;});

  var pendingInbox = F.alive(DB.inbox).filter(function(i){return i.status==="pending";});
  var pendingWorkout = DB.life.__previewWorkout ? true : false;

  var overdueTasks = F.alive(DB.tasks).filter(function(t){return !t.done && t.date && t.date<today;});
  var stalledContent = F.alive(DB.content.pipeline).filter(function(c){return c.stage!=="published" && c.stage!=="idea" && (Date.now()-c.updatedAt)>3*86400000;});
  var stalledZhi = F.alive(DB.work.zhi.customers).filter(function(c){return c.stage!=="已成交" && c.stage!=="流失" && (Date.now()-c.lastContactTs)>4*86400000;});
  var stalledFanshi = F.alive(DB.work.fanshi.clients).filter(function(c){return c.stage!=="結案" && (Date.now()-c.updatedAt)>5*86400000;});

  var resumableContent = F.alive(DB.content.pipeline).filter(function(c){
    return ["script","shoot","edit"].indexOf(c.stage)>-1 && (Date.now()-c.updatedAt)<=3*86400000;
  });
  var resumableZhi = F.alive(DB.work.zhi.customers).filter(function(c){return ["已預約","已體驗"].indexOf(c.stage)>-1 && (Date.now()-c.lastContactTs)<=4*86400000;});

  var html = '<div class="section">';
  html += '<div class="section-head"><h2>👋 Anita，今天是 '+today+' '+F.helpBtn("today_feed")+'</h2>'+
    '<div class="row" style="max-width:420px">'+
    '<button class="btn secondary sm" data-action="fillDemoData">填充演示數據 '+F.helpBtn("fill_demo")+'</button>'+
    '<button class="btn secondary sm" data-action="openMobileLinkModal">生成手機訪問地址</button>'+
    '</div></div>';

  // overview
  html += '<div class="grid grid-4">';
  html += '<div class="card">'+ring(totalCount?doneCount/totalCount*100:0, "今日任務進度", totalCount?doneCount+"/"+totalCount:"今日無安排")+'</div>';
  var phase = F.currentPhase();
  html += '<div class="card"><div style="font-size:12px;color:var(--muted);margin-bottom:6px">養生階段</div>'+
    (phase?'<div class="pill" style="background:'+phase.color+'22;color:'+phase.color+';font-size:14px">'+phase.name+'</div><div style="font-size:11.5px;color:var(--muted);margin-top:8px">'+phase.tip+'</div>':'<div class="pill muted">尚未設定</div>')+'</div>';
  var wlogs = DB.life.weightLogs.slice(-7);
  html += '<div class="card"><div style="font-size:12px;color:var(--muted);margin-bottom:6px">體重趨勢</div>'+
    (wlogs.length? F.sparkline(wlogs.map(function(l){return l.weight;}),120,44,"var(--primary)")+'<div style="font-size:12px;margin-top:4px">最新 '+wlogs[wlogs.length-1].weight+' kg</div>' : '<div class="pill muted">尚無紀錄</div>')+'</div>';
  var reading = F.alive(DB.books.mylist).find(function(b){return b.status==="進行中" && b.progress>0;});
  html += '<div class="card"><div style="font-size:12px;color:var(--muted);margin-bottom:6px">學習進度</div>'+
    (reading? '<div style="font-weight:700;font-size:13.5px">'+F.escapeHtml(reading.title)+'</div><div style="background:#eef2ec;border-radius:99px;height:8px;margin-top:8px"><div style="background:var(--primary);height:8px;border-radius:99px;width:'+reading.progress+'%"></div></div><div style="font-size:11px;color:var(--muted);margin-top:4px">'+reading.progress+'%</div>' : '<div class="pill muted">目前沒有進行中的書</div>')+'</div>';
  html += '</div>';
  html += '</div>';

  function feedSection(title, icon, items, renderItem, emptyMsg){
    var h = '<div class="section"><div class="section-head"><h2>'+icon+' '+title+'</h2></div>';
    if(!items.length) h += '<div class="empty-state" style="padding:16px"><div>'+emptyMsg+'</div></div>';
    else h += '<div class="list">'+items.map(renderItem).join("")+'</div>';
    return h+'</div>';
  }

  html += feedSection("現在要做","▶️", nowTasks.slice(0,6), function(t){
    return '<div class="list-item"><button class="check" data-action="toggleTask" data-id="'+t.id+'"></button>'+
      '<div class="li-body"><div class="li-title">'+F.escapeHtml(t.title)+'</div><div class="li-meta"><span class="pill muted">'+(t.time||"未排時間")+'</span><span class="pill">'+F.escapeHtml(t.category||"")+'</span></div></div>'+
      '<button class="btn sm secondary" data-action="nav" data-route="plan">前往</button></div>';
  }, "今天沒有安排中的任務");

  html += feedSection("待確認","❓", pendingInbox.slice(0,4), function(i){
    return F.inboxItemCard(i);
  }, "沒有待確認的收集箱項目");

  var abnormal = [].concat(
    overdueTasks.map(function(t){return {label:"任務逾期："+t.title, route:"plan"};}),
    stalledContent.map(function(c){return {label:"選題停滯 3 天："+c.title, route:"media"};}),
    stalledZhi.map(function(c){return {label:"知英語客戶已停滯："+c.name, route:"work"};}),
    stalledFanshi.map(function(c){return {label:"凡蒔顧問案件已停滯："+c.name, route:"work"};})
  );
  html += feedSection("異常","⚠️", abnormal.slice(0,6), function(a){
    return '<div class="list-item"><div class="li-body"><div class="li-title" style="color:var(--danger)">'+F.escapeHtml(a.label)+'</div></div>'+
      '<button class="btn sm secondary" data-action="nav" data-route="'+a.route+'">前往處理</button></div>';
  }, "目前沒有異常狀況");

  var resumable = [].concat(
    resumableContent.map(function(c){return {label:"繼續製作："+c.title+"（"+F.stageLabel(c.stage)+"）", route:"media"};}),
    resumableZhi.map(function(c){return {label:"跟進客戶："+c.name+"（"+c.stage+"）", route:"work"};})
  );
  html += feedSection("最近可以繼續","⏩", resumable.slice(0,6), function(r){
    return '<div class="list-item"><div class="li-body"><div class="li-title">'+F.escapeHtml(r.label)+'</div></div>'+
      '<button class="btn sm secondary" data-action="nav" data-route="'+r.route+'">繼續</button></div>';
  }, "目前沒有可繼續的進度");

  return html;
};
})();
