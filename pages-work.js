/* ===== 工作管理 module：凡蒔顧問業務 / 知英語銷售顧問 / Courify行銷 ===== */
(function(){
var F = window.__FS;
var workTab = "fanshi";
var FANSHI_STAGES = ["洽談","提案","簽約","進行中","結案"];

F.setWorkTab = function(t){ workTab = t.getAttribute("data-tab"); F.render(); };

/* --- 凡蒔顧問業務 --- */
F.openAddFanshiClient = function(){
  F.openModal(
    '<div class="modal-title">新增凡蒔顧問客戶 '+F.helpBtn("work_fanshi")+'</div>'+
    '<form id="fsForm"><label class="field">客戶/案件名稱<input name="name" required></label>'+
    '<div class="row" style="margin-top:8px">'+
    '<label class="field">業務類型<select name="type"><option>網站架設</option><option>顧問外包</option><option>健身纖體</option></select></label>'+
    '<label class="field">階段<select name="stage">'+FANSHI_STAGES.map(function(s){return "<option>"+s+"</option>";}).join("")+'</select></label></div>'+
    '<label class="field" style="margin-top:8px">下一步<input name="nextStep" placeholder="例如：本週五提案"></label>'+
    '<button class="btn" type="submit" style="width:100%;margin-top:10px">新增</button></form>'
  );
  document.getElementById("fsForm").addEventListener("submit", function(e){
    e.preventDefault();
    var f = e.target;
    F.DB.work.fanshi.clients.push({id:F.uid(), name:f.name.value, type:f.type.value, stage:f.stage.value, nextStep:f.nextStep.value, updatedAt:Date.now(), deletedAt:null});
    F.save(); F.closeModal(); F.render();
  });
};
F.deleteFanshiClient = function(t){ F.softDelete(F.DB.work.fanshi.clients, t.getAttribute("data-id")); F.save(); F.toast("已刪除"); F.render(); };

/* --- Courify --- */
F.openAddCourifyTask = function(){
  F.openModal(
    '<div class="modal-title">新增 Courify 任務 '+F.helpBtn("work_courify")+'</div>'+
    '<form id="coForm"><label class="field">任務標題<input name="title" required></label>'+
    '<button class="btn" type="submit" style="width:100%;margin-top:10px">新增</button></form>'
  );
  document.getElementById("coForm").addEventListener("submit", function(e){
    e.preventDefault();
    F.DB.work.courify.tasks.push({id:F.uid(), title:e.target.title.value, done:false, updatedAt:Date.now(), deletedAt:null});
    F.save(); F.closeModal(); F.render();
  });
};
F.toggleCourifyTask = function(t){
  var task = F.DB.work.courify.tasks.find(function(x){return x.id===t.getAttribute("data-id");});
  if(task){ task.done = !task.done; F.save(); F.render(); }
};
F.deleteCourifyTask = function(t){ F.softDelete(F.DB.work.courify.tasks, t.getAttribute("data-id")); F.save(); F.render(); };

window.__PAGE_AFTER.work = function(){
  document.querySelectorAll(".fsStageSelect").forEach(function(sel){
    sel.onchange = function(){
      var c = F.DB.work.fanshi.clients.find(function(x){return x.id===sel.getAttribute("data-id");});
      if(c){ c.stage = sel.value; c.updatedAt = Date.now(); F.save(); F.render(); }
    };
  });
  if(window.__ZHI_AFTER) window.__ZHI_AFTER();
};

/* ============================================================
   知英語銷售顧問 —— 大改版
   ============================================================ */
var zhiSub = "cal";
var zhiCalYear = new Date().getFullYear();
var zhiCalMonth = new Date().getMonth();
var zhiCalSelected = F.todayStr();
var zhiStudentMonth = F.todayStr().slice(0,7);
var zhiStudentSearch = "";
var zhiStudentStatus = "";
var zhiSeminarMonth = F.todayStr().slice(0,7);
var zhiSalesPay = "全部";
var zhiInstallMonth = F.todayStr().slice(0,7);
var zhiTrackSearch = "";
var zhiTrackView = "general";
var zhiOOSearch = "";
var zhiCalcSessions = 10;
var ZHI_TEACHERS = ["Joanna","Florence","Jake","Other"];
var ZHI_SUBJECTS = ["聽","說","讀","寫"];

var ZHI_STAGES = [
  {key:"進到官方LINE", color:"#77877e"},
  {key:"程度檢測", color:"#b98b73"},
  {key:"Intro", color:"#c99a4b"},
  {key:"體驗課/線上講座", color:"#5c8577"},
  {key:"Demo", color:"#2f5d50"},
  {key:"已購買", color:"#3f7a5e"},
  {key:"lost deal", color:"#c2685a"}
];
var ZHI_STATUS_DATE_FIELD = {
  "進到官方LINE":"lineJoinDate", "程度檢測":"assessDate", "Intro":"introDate",
  "體驗課/線上講座":"trialDate", "Demo":"demoDate", "已購買":"purchaseDate", "lost deal":"lostDate"
};
var ZHI_FUNNEL_FIELDS = [
  {field:"lineJoinDate", label:"加入LINE"},
  {field:"introDate", label:"Intro"},
  {field:"trialDate", label:"體驗/線上講座"},
  {field:"demoDate", label:"Demo"},
  {field:"purchaseDate", label:"已購買"}
];
var ZHI_SEMINAR_FIELDS = [
  {field:"signedUpDate", label:"報名"},
  {field:"lineJoinDate", label:"加入LINE"},
  {field:"consultDate", label:"諮詢"},
  {field:"purchaseDate", label:"成交"}
];
function zhiStageBadge(stage){
  var m = ZHI_STAGES.find(function(s){return s.key===stage;}) || ZHI_STAGES[0];
  return '<span class="pill" style="background:'+m.color+'22;color:'+m.color+'">'+F.escapeHtml(stage||"進到官方LINE")+'</span>';
}
F.setZhiSub = function(t){ zhiSub = t.getAttribute("data-sub"); F.render(); };

/* ---------- 日曆紀錄 ---------- */
function zhiRecordsOfDate(d){
  return F.alive(F.DB.work.zhi.customers).filter(function(c){
    return c.lineJoinDate===d||c.assessDate===d||c.introDate===d||c.trialDate===d||c.demoDate===d||c.purchaseDate===d||c.lostDate===d;
  });
}
F.zhiCalPrev = function(){ zhiCalMonth--; if(zhiCalMonth<0){zhiCalMonth=11;zhiCalYear--;} F.render(); };
F.zhiCalNext = function(){ zhiCalMonth++; if(zhiCalMonth>11){zhiCalMonth=0;zhiCalYear++;} F.render(); };
F.zhiCalToday = function(){ var t=new Date(); zhiCalYear=t.getFullYear(); zhiCalMonth=t.getMonth(); zhiCalSelected=F.todayStr(); F.render(); };
F.zhiCalDayClick = function(t){ zhiCalSelected = t.getAttribute("data-date"); F.render(); };
F.zhiExportWeekReport = function(){
  var wr = F.weekRangeOf(zhiCalSelected);
  var rows = [];
  F.alive(F.DB.work.zhi.customers).forEach(function(c){
    if(F.inWeek(c.introDate, wr)) rows.push([F.fmtDate(c.introDate), "Intro", c.name, c.note||""]);
    if(F.inWeek(c.demoDate, wr)) rows.push([F.fmtDate(c.demoDate), "Demo", c.name, c.note||""]);
  });
  rows.sort(function(a,b){return a[0]<b[0]?-1:1;});
  F.exportExcel("知英語_本週Intro_Demo週報.xls", "週報", ["日期","類型","學生姓名","備註"], rows);
  F.toast("已匯出本週 Intro/Demo 週報，共 "+rows.length+" 筆");
};

function renderZhiCalendar(){
  var grid = "";
  var first = new Date(zhiCalYear, zhiCalMonth, 1);
  var startDow = first.getDay();
  var daysInMonth = new Date(zhiCalYear, zhiCalMonth+1, 0).getDate();
  var today = F.todayStr();
  for(var i=0;i<startDow;i++) grid += '<div class="week-day" style="visibility:hidden"></div>';
  for(var d=1; d<=daysInMonth; d++){
    var dateStr = zhiCalYear+"-"+F.pad(zhiCalMonth+1)+"-"+F.pad(d);
    var recs = zhiRecordsOfDate(dateStr);
    var nIntro = recs.filter(function(c){return c.introDate===dateStr;}).length;
    var nDemo = recs.filter(function(c){return c.demoDate===dateStr;}).length;
    var nJoin = recs.filter(function(c){return c.lineJoinDate===dateStr;}).length;
    var nBuy = recs.filter(function(c){return c.purchaseDate===dateStr;}).length;
    var sel = dateStr===zhiCalSelected ? "background:var(--primary);color:#fff" : (dateStr===today?"border-color:var(--primary);border-width:2px":"");
    grid += '<div class="week-day" data-action="zhiCalDayClick" data-date="'+dateStr+'" style="cursor:pointer;'+sel+'">'+
      '<div class="wd-date">'+d+'</div>'+
      (nJoin?'<div class="stage-chip" style="background:#77877e">LINE '+nJoin+'</div>':'')+
      (nIntro?'<div class="stage-chip" style="background:#c99a4b">Intro '+nIntro+'</div>':'')+
      (nDemo?'<div class="stage-chip" style="background:#2f5d50">Demo '+nDemo+'</div>':'')+
      (nBuy?'<div class="stage-chip" style="background:#3f7a5e">購買 '+nBuy+'</div>':'')+
      '</div>';
  }
  var dayRecs = zhiRecordsOfDate(zhiCalSelected);
  var html = '<div class="grid grid-2">';
  html += '<div class="card"><div class="row" style="margin-bottom:10px;align-items:center">'+
    '<button class="btn sm secondary" data-action="zhiCalPrev">← 上月</button>'+
    '<div style="text-align:center;font-weight:800;flex:2">'+zhiCalYear+' 年 '+(zhiCalMonth+1)+' 月</div>'+
    '<button class="btn sm secondary" data-action="zhiCalNext">下月 →</button>'+
    '<button class="btn sm secondary" data-action="zhiCalToday">今天</button></div>'+
    '<div class="week-cal">'+grid+'</div></div>';
  html += '<div class="card">'+
    '<div class="section-head"><h2 style="font-size:15px">'+F.fmtDate(zhiCalSelected)+' 紀錄 '+F.helpBtn("zhi_calendar")+'</h2>'+
    '<div class="row"><button class="btn sm secondary" data-action="zhiExportWeekReport">匯出本週週報</button>'+
    '<button class="btn sm" data-action="openZhiCustomerModal" data-prefill="'+zhiCalSelected+'">＋新增學生</button></div></div>';
  if(!dayRecs.length){
    html += '<div class="empty-state">這天沒有 LINE加入/Intro/體驗/Demo/購買 紀錄</div>';
  } else {
    html += '<div class="list">'+dayRecs.map(function(c){
      var tags = [];
      if(c.lineJoinDate===zhiCalSelected) tags.push("加入LINE");
      if(c.assessDate===zhiCalSelected) tags.push("程度檢測");
      if(c.introDate===zhiCalSelected) tags.push("Intro");
      if(c.trialDate===zhiCalSelected) tags.push("體驗/線上講座");
      if(c.demoDate===zhiCalSelected) tags.push("Demo");
      if(c.purchaseDate===zhiCalSelected) tags.push("已購買");
      if(c.lostDate===zhiCalSelected) tags.push("lost deal");
      return '<div class="list-item"><div class="li-body"><div class="li-title">'+F.escapeHtml(c.name)+'</div>'+
        '<div class="li-meta">'+tags.map(function(t){return '<span class="tag">'+t+'</span>';}).join("")+'</div></div>'+
        '<button class="btn sm ghost" data-action="openZhiCustomerModal" data-id="'+c.id+'">編輯</button></div>';
    }).join("")+'</div>';
  }
  html += '</div></div>';
  return html;
}

/* ---------- 學生資訊（含轉換率儀表板） ---------- */
F.zhiStudentMonthPrev = function(){ zhiStudentMonth = F.shiftMonth(zhiStudentMonth,-1); F.render(); };
F.zhiStudentMonthNext = function(){ zhiStudentMonth = F.shiftMonth(zhiStudentMonth,1); F.render(); };
F.zhiStudentMonthThis = function(){ zhiStudentMonth = F.todayStr().slice(0,7); F.render(); };
F.exportZhiFunnelReport = function(){
  var ym = zhiStudentMonth;
  var recs = F.alive(F.DB.work.zhi.customers);
  var rows = recs.filter(function(c){return F.inMonth(c.lineJoinDate,ym);}).map(function(c){
    return [c.name, F.fmtDate(c.lineJoinDate), F.fmtDate(c.introDate), F.fmtDate(c.trialDate), F.fmtDate(c.demoDate), F.fmtDate(c.purchaseDate), c.status||"", c.note||""];
  });
  F.exportExcel("知英語_轉換率報表_"+ym+".xls", ym, ["姓名","加入LINE","Intro","體驗/線上講座","Demo","已購買","目前狀態","備註"], rows);
  F.toast("已匯出 "+ym+" 轉換率報表，共 "+rows.length+" 筆");
};
F.exportZhiStudents = function(){
  var recs = F.alive(F.DB.work.zhi.customers);
  var rows = recs.map(function(c){
    return [c.name, c.status||"", F.fmtDate(c.lineJoinDate), F.fmtDate(c.introDate), F.fmtDate(c.trialDate), F.fmtDate(c.demoDate), F.fmtDate(c.purchaseDate), c.toeicScore||"", c.ieltsToeflScore||"", c.assessScore||"", c.note||""];
  });
  F.exportExcel("知英語_學生資訊.xls", "學生資訊", ["姓名","狀態","加入LINE","Intro","體驗/線上講座","Demo","已購買","多益","雅思/托福","程度檢測分數","備註"], rows);
  F.toast("已匯出學生資訊，共 "+rows.length+" 筆");
};
F.openZhiCustomerModal = function(t){
  var id = t && t.getAttribute("data-id");
  var prefill = t && t.getAttribute("data-prefill");
  var c = id ? F.DB.work.zhi.customers.find(function(x){return x.id===id;}) : null;
  var v = function(k){ return c ? F.escapeHtml(c[k]||"") : ""; };
  var vd = function(k, d){ return c ? (c[k]||"") : (d||""); };
  var statusOpts = ZHI_STAGES.map(function(s){ return '<option '+(c&&c.status===s.key?"selected":"")+'>'+s.key+'</option>'; }).join("");
  F.openModal(
    '<div class="modal-title">'+(c?"編輯":"新增")+'學生 '+F.helpBtn("zhi_student")+'</div>'+
    '<form id="zhiCustForm">'+
    '<label class="field">學生姓名<input name="name" required value="'+v("name")+'"></label>'+
    '<div class="row" style="margin-top:8px"><label class="field">目前狀態<select name="status">'+statusOpts+'</select></label></div>'+
    '<div class="row" style="margin-top:8px">'+
      '<label class="field">加入官方LINE日期<input type="date" name="lineJoinDate" value="'+vd("lineJoinDate", prefill)+'"></label>'+
      '<label class="field">程度檢測日期<input type="date" name="assessDate" value="'+vd("assessDate")+'"></label>'+
    '</div>'+
    '<div class="row" style="margin-top:8px">'+
      '<label class="field">程度檢測分數<input name="assessScore" value="'+v("assessScore")+'" placeholder="例如 B1"></label>'+
      '<label class="field">多益分數<input name="toeicScore" value="'+v("toeicScore")+'" placeholder="例如 750"></label>'+
    '</div>'+
    '<div class="row" style="margin-top:8px">'+
      '<label class="field">雅思/托福分數<input name="ieltsToeflScore" value="'+v("ieltsToeflScore")+'" placeholder="例如 6.5"></label>'+
      '<label class="field">Intro 日期<input type="date" name="introDate" value="'+vd("introDate")+'"></label>'+
    '</div>'+
    '<div class="row" style="margin-top:8px">'+
      '<label class="field">線上講座日期<input type="date" name="onlineSeminarDate" value="'+vd("onlineSeminarDate")+'"></label>'+
      '<label class="field">體驗課/線上講座日期<input type="date" name="trialDate" value="'+vd("trialDate")+'"></label>'+
    '</div>'+
    '<div class="row" style="margin-top:8px">'+
      '<label class="field">Demo 日期<input type="date" name="demoDate" value="'+vd("demoDate")+'"></label>'+
      '<label class="field">已購買日期<input type="date" name="purchaseDate" value="'+vd("purchaseDate")+'"></label>'+
    '</div>'+
    '<label class="field" style="margin-top:8px">lost deal 日期<input type="date" name="lostDate" value="'+vd("lostDate")+'"></label>'+
    '<label class="field" style="margin-top:8px">備註<textarea name="note" rows="2">'+v("note")+'</textarea></label>'+
    '<div class="row" style="margin-top:14px">'+
      (c?'<button type="button" class="btn danger" data-action="deleteZhiCustomer" data-id="'+c.id+'">刪除</button>':'')+
      '<button class="btn" type="submit" style="flex:2">儲存</button></div>'+
    '</form>', {wide:true}
  );
  document.getElementById("zhiCustForm").addEventListener("submit", function(e){
    e.preventDefault();
    var f = e.target;
    var obj = {
      name:f.name.value.trim(), status:f.status.value,
      lineJoinDate:f.lineJoinDate.value, assessDate:f.assessDate.value, assessScore:f.assessScore.value.trim(),
      toeicScore:f.toeicScore.value.trim(), ieltsToeflScore:f.ieltsToeflScore.value.trim(),
      introDate:f.introDate.value, onlineSeminarDate:f.onlineSeminarDate.value, trialDate:f.trialDate.value,
      demoDate:f.demoDate.value, purchaseDate:f.purchaseDate.value, lostDate:f.lostDate.value,
      note:f.note.value.trim()
    };
    var dField = ZHI_STATUS_DATE_FIELD[obj.status];
    if(dField && !obj[dField]) obj[dField] = F.todayStr();
    if(c){ Object.assign(c, obj); } else { F.DB.work.zhi.customers.push(Object.assign({id:F.uid(), deletedAt:null}, obj)); }
    F.save(); F.closeModal(); F.toast("已儲存"); F.render();
  });
};
F.deleteZhiCustomer = function(t){ F.softDelete(F.DB.work.zhi.customers, t.getAttribute("data-id")); F.save(); F.closeModal(); F.toast("已刪除"); F.render(); };
F.zhiQuickStatus = function(sel){
  var c = F.DB.work.zhi.customers.find(function(x){return x.id===sel.getAttribute("data-id");});
  if(!c) return;
  c.status = sel.value;
  var dField = ZHI_STATUS_DATE_FIELD[c.status];
  if(dField && !c[dField]) c[dField] = F.todayStr();
  F.save(); F.render();
  F.toast("已將「"+c.name+"」狀態改為 "+c.status);
};

function renderZhiFunnelDashboard(){
  var ym = zhiStudentMonth;
  var monthFilter = function(d){ return F.inMonth(d, ym); };
  var recs = F.alive(F.DB.work.zhi.customers);
  var joinCount = recs.filter(function(c){ return monthFilter(c.lineJoinDate); }).length;
  var funnel = F.computeFunnel(recs, ZHI_FUNNEL_FIELDS, monthFilter);
  // weekly breakdown within this month
  var weeks = [];
  var d0 = new Date(ym+"-01T00:00:00");
  var daysInMonth = new Date(d0.getFullYear(), d0.getMonth()+1, 0).getDate();
  var seen = {};
  for(var i=1;i<=daysInMonth;i++){
    var ds = ym+"-"+F.pad(i);
    var wr = F.weekRangeOf(ds);
    if(seen[wr.start]) continue;
    seen[wr.start]=true;
    weeks.push(wr);
  }
  var weeklyJoin = weeks.map(function(wr){
    return {label:F.fmtDate(wr.start), value: recs.filter(function(c){return F.inWeek(c.lineJoinDate,wr);}).length};
  });
  var html = '<div class="card section">';
  html += '<div class="section-head"><h2>📊 轉換率儀表板 '+F.helpBtn("zhi_funnel")+'</h2>'+
    '<div class="row"><button class="btn sm secondary" data-action="zhiStudentMonthPrev">← 上月</button>'+
    '<button class="btn sm secondary" data-action="zhiStudentMonthThis">本月</button>'+
    '<button class="btn sm secondary" data-action="zhiStudentMonthNext">下月 →</button>'+
    '<button class="btn sm" data-action="exportZhiFunnelReport">匯出本月報表</button></div></div>';
  html += '<div style="font-weight:800;font-size:16px;margin-bottom:10px">'+F.monthLabel(ym)+' · 加入LINE總人數 '+joinCount+' 人</div>';
  html += '<div class="grid grid-2">';
  html += '<div><div style="font-size:12.5px;color:var(--muted);margin-bottom:6px">每週加入LINE人數</div>'+F.barChartSvg(weeklyJoin,{h:150})+'</div>';
  html += '<div><div style="font-size:12.5px;color:var(--muted);margin-bottom:6px">本月各階段轉換率</div>'+
    F.lineChartSvg(funnel.rates.map(function(r){return {label:r.from+"→"+r.to, value:r.rate};}), {h:150, suffix:"%"})+'</div>';
  html += '</div>';
  html += '<div class="row" style="margin-top:10px;flex-wrap:wrap">'+funnel.rates.map(function(r){
    return '<div class="card" style="flex:1;min-width:150px;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--primary-dark)">'+r.rate+'%</div>'+
      '<div style="font-size:11.5px;color:var(--muted)">'+r.from+' → '+r.to+'</div><div style="font-size:11px;color:var(--muted)">('+r.toCount+'/'+r.fromCount+')</div></div>';
  }).join("")+'</div>';
  html += '</div>';
  return html;
}
function renderZhiStudents(){
  var html = renderZhiFunnelDashboard();
  var recs = F.alive(F.DB.work.zhi.customers).filter(function(c){
    return (!zhiStudentSearch || c.name.indexOf(zhiStudentSearch)>-1) && (!zhiStudentStatus || c.status===zhiStudentStatus);
  }).sort(function(a,b){ return (b.lineJoinDate||"").localeCompare(a.lineJoinDate||""); });
  html += '<div class="section-head"><h2>🎓 學生資訊 '+F.helpBtn("work_zhi")+'</h2>'+
    '<div class="row"><button class="btn sm secondary" data-action="exportZhiStudents">匯出Excel</button>'+
    '<button class="btn sm" data-action="openZhiCustomerModal">＋新增學生</button></div></div>';
  html += '<div class="row" style="margin-bottom:12px">'+
    '<input id="zhiStudentSearchInput" placeholder="搜尋姓名..." value="'+F.escapeHtml(zhiStudentSearch)+'">'+
    '<select id="zhiStudentStatusSel"><option value="">全部狀態</option>'+ZHI_STAGES.map(function(s){return '<option '+(s.key===zhiStudentStatus?"selected":"")+'>'+s.key+'</option>';}).join("")+'</select>'+
    '</div>';
  if(!recs.length){
    html += '<div class="empty-state"><div class="e-ico">🎓</div><div>沒有符合條件的學生</div><div class="e-next">下一步：點「＋新增學生」建立第一筆</div></div>';
  } else {
    html += '<div class="info-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">'+recs.map(function(c){
      var statusOpts = ZHI_STAGES.map(function(s){return '<option '+(s.key===c.status?"selected":"")+'>'+s.key+'</option>';}).join("");
      return '<div class="card"><div class="row" style="align-items:center;margin-bottom:6px">'+
        '<div style="font-weight:800;flex:1">'+F.escapeHtml(c.name)+'</div>'+
        '<select class="zhiQuickStatusSel" data-id="'+c.id+'" style="width:auto;padding:4px 8px;font-size:11.5px">'+statusOpts+'</select></div>'+
        '<div style="margin-bottom:6px">'+zhiStageBadge(c.status)+'</div>'+
        '<div style="font-size:12px;color:var(--muted);line-height:1.7">'+
          (c.lineJoinDate?'加入LINE：'+F.fmtDate(c.lineJoinDate)+'<br>':'')+
          (c.toeicScore?'多益：'+F.escapeHtml(c.toeicScore)+'　':'')+(c.ieltsToeflScore?'雅思/托福：'+F.escapeHtml(c.ieltsToeflScore):'')+
          '</div>'+
        (c.note?'<div class="li-meta" style="margin-top:6px">'+F.escapeHtml(c.note)+'</div>':'')+
        '<div class="row" style="margin-top:8px"><button class="btn sm secondary" data-action="openZhiCustomerModal" data-id="'+c.id+'" style="width:100%">查看/編輯</button></div>'+
        '</div>';
    }).join("")+'</div>';
  }
  return html;
}

/* ---------- 講座名單 ---------- */
F.zhiSeminarMonthPrev = function(){ zhiSeminarMonth = F.shiftMonth(zhiSeminarMonth,-1); F.render(); };
F.zhiSeminarMonthNext = function(){ zhiSeminarMonth = F.shiftMonth(zhiSeminarMonth,1); F.render(); };
F.zhiSeminarMonthThis = function(){ zhiSeminarMonth = F.todayStr().slice(0,7); F.render(); };
F.openZhiSeminarModal = function(t){
  var id = t && t.getAttribute("data-id");
  var s = id ? F.DB.work.zhi.seminars.find(function(x){return x.id===id;}) : null;
  var v = function(k){ return s?F.escapeHtml(s[k]||""):""; };
  F.openModal(
    '<div class="modal-title">'+(s?"編輯":"新增")+'講座名單 '+F.helpBtn("zhi_seminar")+'</div>'+
    '<form id="zhiSemForm">'+
    '<div class="row"><label class="field">姓名<input name="name" required value="'+v("name")+'"></label>'+
    '<label class="field">講座日期<input type="date" name="seminarDate" value="'+(s?s.seminarDate:F.todayStr())+'"></label></div>'+
    '<div class="row" style="margin-top:8px"><label class="field">電話<input name="phone" value="'+v("phone")+'"></label>'+
    '<label class="field">Email<input name="email" value="'+v("email")+'"></label></div>'+
    '<div class="row" style="margin-top:8px">'+
      '<label class="field">報名日期<input type="date" name="signedUpDate" value="'+(s?s.signedUpDate||"":F.todayStr())+'"></label>'+
      '<label class="field">加入LINE日期<input type="date" name="lineJoinDate" value="'+(s?s.lineJoinDate||"":"")+'"></label>'+
    '</div>'+
    '<div class="row" style="margin-top:8px">'+
      '<label class="field">諮詢日期<input type="date" name="consultDate" value="'+(s?s.consultDate||"":"")+'"></label>'+
      '<label class="field">成交日期<input type="date" name="purchaseDate" value="'+(s?s.purchaseDate||"":"")+'"></label>'+
    '</div>'+
    '<label class="field" style="margin-top:8px">備註<textarea name="note" rows="2">'+v("note")+'</textarea></label>'+
    '<div class="row" style="margin-top:14px">'+
      (s?'<button type="button" class="btn danger" data-action="deleteZhiSeminar" data-id="'+s.id+'">刪除</button>':'')+
      '<button class="btn" type="submit" style="flex:2">儲存</button></div>'+
    '</form>'
  );
  document.getElementById("zhiSemForm").addEventListener("submit", function(e){
    e.preventDefault();
    var f = e.target;
    var obj = {name:f.name.value.trim(), seminarDate:f.seminarDate.value, phone:f.phone.value.trim(), email:f.email.value.trim(),
      signedUpDate:f.signedUpDate.value, lineJoinDate:f.lineJoinDate.value, consultDate:f.consultDate.value, purchaseDate:f.purchaseDate.value,
      note:f.note.value.trim()};
    if(s){ Object.assign(s, obj); } else { F.DB.work.zhi.seminars.push(Object.assign({id:F.uid(), deletedAt:null}, obj)); }
    F.save(); F.closeModal(); F.toast("已儲存"); F.render();
  });
};
F.deleteZhiSeminar = function(t){ F.softDelete(F.DB.work.zhi.seminars, t.getAttribute("data-id")); F.save(); F.closeModal(); F.toast("已刪除"); F.render(); };
F.exportZhiSeminar = function(){
  var recs = F.alive(F.DB.work.zhi.seminars);
  var rows = recs.map(function(s){ return [s.name, F.fmtDate(s.seminarDate), s.phone||"", s.email||"", F.fmtDate(s.signedUpDate), F.fmtDate(s.lineJoinDate), F.fmtDate(s.consultDate), F.fmtDate(s.purchaseDate), s.note||""]; });
  F.exportExcel("知英語_講座名單.xls", "講座名單", ["姓名","講座日期","電話","Email","報名","加入LINE","諮詢","成交","備註"], rows);
  F.toast("已匯出講座名單，共 "+rows.length+" 筆");
};
function renderZhiSeminar(){
  var ym = zhiSeminarMonth;
  var monthFilter = function(d){ return F.inMonth(d, ym); };
  var all = F.alive(F.DB.work.zhi.seminars);
  var funnel = F.computeFunnel(all, ZHI_SEMINAR_FIELDS, monthFilter);
  var html = '<div class="card section">';
  html += '<div class="section-head"><h2>🎤 講座轉化漏斗 '+F.helpBtn("zhi_seminar")+'</h2>'+
    '<div class="row"><button class="btn sm secondary" data-action="zhiSeminarMonthPrev">← 上月</button>'+
    '<button class="btn sm secondary" data-action="zhiSeminarMonthThis">本月</button>'+
    '<button class="btn sm secondary" data-action="zhiSeminarMonthNext">下月 →</button></div></div>';
  html += '<div style="font-weight:800;margin-bottom:10px">'+F.monthLabel(ym)+'</div>';
  html += F.barChartSvg(ZHI_SEMINAR_FIELDS.map(function(f){ return {label:f.label, value: all.filter(function(r){return monthFilter(r[f.field]);}).length}; }), {h:150});
  html += '<div class="row" style="margin-top:10px;flex-wrap:wrap">'+funnel.rates.map(function(r){
    return '<div class="card" style="flex:1;min-width:150px;text-align:center"><div style="font-size:20px;font-weight:800;color:var(--primary-dark)">'+r.rate+'%</div>'+
      '<div style="font-size:11.5px;color:var(--muted)">'+r.from+' → '+r.to+'</div></div>';
  }).join("")+'</div>';
  html += '</div>';
  html += '<div class="section-head"><h2>講座名單清單</h2><div class="row"><button class="btn sm secondary" data-action="exportZhiSeminar">匯出Excel</button><button class="btn sm" data-action="openZhiSeminarModal">＋新增</button></div></div>';
  if(!all.length){
    html += '<div class="empty-state"><div class="e-ico">🎤</div><div>還沒有講座名單</div></div>';
  } else {
    html += '<div class="list">'+all.slice().sort(function(a,b){return (b.seminarDate||"").localeCompare(a.seminarDate||"");}).map(function(s){
      return '<div class="list-item"><div class="li-body"><div class="li-title">'+F.escapeHtml(s.name)+'</div>'+
        '<div class="li-meta">講座 '+F.fmtDate(s.seminarDate)+(s.purchaseDate?' <span class="pill">已成交</span>':'')+'</div></div>'+
        '<button class="btn sm ghost" data-action="openZhiSeminarModal" data-id="'+s.id+'">編輯</button></div>';
    }).join("")+'</div>';
  }
  return html;
}

/* ---------- 課程學生追蹤 + 銷售管理 ---------- */
function courseOptionsZhi(sel){
  var list = F.DB.work.zhi.courses;
  var selArr = Array.isArray(sel)?sel:(sel?String(sel).split(/[、,]/).map(function(s){return s.trim();}).filter(Boolean):[]);
  return '<div class="multi-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px">'+list.map(function(c){
    var on = selArr.indexOf(c)>-1;
    var isOO = c==="一對一";
    return '<label style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:#fafbf8;border:1px solid var(--border);border-radius:8px;font-size:12.5px;cursor:pointer"><input type="checkbox" class="zhiCourseChk'+(isOO?" zhiOOChk":"")+'" value="'+F.escapeHtml(c)+'" '+(on?"checked":"")+'>'+F.escapeHtml(c)+'</label>';
  }).join("")+'</div>';
}
F.openZhiSaleModal = function(t){
  var id = t && t.getAttribute("data-id");
  var s = id ? F.DB.work.zhi.sales.find(function(x){return x.id===id;}) : null;
  var payOpts = F.DB.work.zhi.payMethods.map(function(p){ return '<option '+(s&&s.payMethod===p?"selected":"")+'>'+F.escapeHtml(p)+'</option>'; }).join("");
  var ooSelected = s && s.course && s.course.indexOf("一對一")>-1;
  F.openModal(
    '<div class="modal-title">'+(s?"編輯":"＋新增")+'成交紀錄 '+F.helpBtn("zhi_sales")+'</div>'+
    '<form id="zhiSaleForm">'+
    '<div class="row"><label class="field">學生姓名<input name="student" required value="'+(s?F.escapeHtml(s.student):"")+'"></label>'+
    '<label class="field">購買日期<input type="date" name="purchaseDate" value="'+(s?s.purchaseDate:F.todayStr())+'"></label></div>'+
    '<div class="row" style="margin-top:8px"><label class="field">成交金額<input type="number" name="amount" min="0" step="100" value="'+(s?s.amount:"")+'"></label>'+
    '<label class="field">付款方式<select name="payMethod">'+payOpts+'</select></label></div>'+
    '<label class="field full" style="margin-top:8px">課程（可複選）</label><div id="zhiSaleCourseMulti">'+courseOptionsZhi(s?s.course:"")+'</div>'+
    '<div id="zhiOOSessionsWrap" style="display:'+(ooSelected?"block":"none")+';margin-top:8px"><label class="field">一對一購買堂數<input type="number" min="1" name="oneOnOneSessions" value="'+(s?s.oneOnOneSessions||"":"")+'" placeholder="例如 10"></label></div>'+
    '<div class="row" style="margin-top:8px"><label class="field">開課日期<input type="date" name="startDate" value="'+(s?s.startDate||"":"")+'"></label>'+
    '<label class="field">課程結束日期<input type="date" name="endDate" value="'+(s?s.endDate||"":"")+'"></label></div>'+
    '<label class="field" style="margin-top:8px">備註<textarea name="note" rows="2">'+(s?F.escapeHtml(s.note||""):"")+'</textarea></label>'+
    '<div class="row" style="margin-top:14px">'+
      (s?'<button type="button" class="btn danger" data-action="deleteZhiSale" data-id="'+s.id+'">刪除</button>':'')+
      '<button class="btn" type="submit" style="flex:2">儲存</button></div>'+
    '</form>', {wide:true}
  );
  var ooChk = document.querySelector(".zhiOOChk");
  var ooWrap = document.getElementById("zhiOOSessionsWrap");
  if(ooChk){ ooChk.addEventListener("change", function(){ ooWrap.style.display = ooChk.checked ? "block" : "none"; }); }
  document.getElementById("zhiSaleForm").addEventListener("submit", function(e){
    e.preventDefault();
    var f = e.target;
    var courses = Array.from(document.querySelectorAll(".zhiCourseChk:checked")).map(function(i){return i.value;});
    var obj = {student:f.student.value.trim(), purchaseDate:f.purchaseDate.value, amount:Math.max(0,Number(f.amount.value)||0),
      payMethod:f.payMethod.value, course:courses.join("、"), startDate:f.startDate.value, endDate:f.endDate.value, note:f.note.value.trim(),
      oneOnOneSessions: courses.indexOf("一對一")>-1 ? (f.oneOnOneSessions.value||"") : ""};
    var saleObj;
    if(s){ Object.assign(s, obj); saleObj = s; } else { saleObj = Object.assign({id:F.uid(), deletedAt:null}, obj); F.DB.work.zhi.sales.push(saleObj); }
    var track = F.DB.work.zhi.courseTracking.find(function(x){return x.saleId===saleObj.id;});
    if(!track){ track = {id:F.uid(), saleId:saleObj.id, deletedAt:null}; F.DB.work.zhi.courseTracking.push(track); }
    track.name = saleObj.student; track.course = saleObj.course; track.startDate = saleObj.startDate; track.endDate = saleObj.endDate; track.note = saleObj.note;
    F.save(); F.closeModal(); F.toast("已儲存成交紀錄，並同步至課程學生追蹤"); F.render();
  });
};
F.deleteZhiSale = function(t){
  var id = t.getAttribute("data-id");
  F.softDelete(F.DB.work.zhi.sales, id);
  var track = F.DB.work.zhi.courseTracking.find(function(x){return x.saleId===id;});
  if(track) F.softDelete(F.DB.work.zhi.courseTracking, track.id);
  F.save(); F.closeModal(); F.toast("已刪除"); F.render();
};
F.deleteZhiTrack = function(t){ F.softDelete(F.DB.work.zhi.courseTracking, t.getAttribute("data-id")); F.save(); F.toast("已刪除"); F.render(); };
F.zhiSalesPaySeg = function(t){ zhiSalesPay = t.getAttribute("data-pay"); F.render(); };
F.exportZhiSalesAll = function(){
  var rows = F.alive(F.DB.work.zhi.sales).map(function(s){ return [s.student, F.fmtDate(s.purchaseDate), s.amount, s.payMethod, s.course, F.fmtDate(s.startDate), s.note||""]; });
  F.exportExcel("知英語_全部銷售紀錄.xls","全部銷售",["學生姓名","購買日期","成交金額","付款方式","課程","開課日期","備註"], rows);
  F.toast("已匯出全部銷售紀錄，共 "+rows.length+" 筆");
};
F.exportZhiSalesFiltered = function(){
  var list = F.alive(F.DB.work.zhi.sales).filter(function(s){return zhiSalesPay==="全部"||s.payMethod===zhiSalesPay;});
  var rows = list.map(function(s){ return [s.student, F.fmtDate(s.purchaseDate), s.amount, s.payMethod, s.course, F.fmtDate(s.startDate), s.note||""]; });
  F.exportExcel("知英語_銷售_"+zhiSalesPay+".xls", zhiSalesPay, ["學生姓名","購買日期","成交金額","付款方式","課程","開課日期","備註"], rows);
  F.toast("已匯出「"+zhiSalesPay+"」共 "+rows.length+" 筆");
};
F.setZhiTrackView = function(t){ zhiTrackView = t.getAttribute("data-view"); F.render(); };
F.filterZhiTrackSearch = function(){ zhiTrackSearch = document.getElementById("zhiTrackSearchInput").value; F.render(); };
F.filterZhiOOSearch = function(){ zhiOOSearch = document.getElementById("zhiOOSearchInput").value; F.render(); };
function renderZhiTrackGeneral(){
  var all = F.alive(F.DB.work.zhi.courseTracking).filter(function(t){ return !zhiTrackSearch || t.name.indexOf(zhiTrackSearch)>-1; });
  var html = '<div class="row" style="margin-bottom:12px"><input id="zhiTrackSearchInput" placeholder="搜尋學生姓名..." value="'+F.escapeHtml(zhiTrackSearch)+'"></div>';
  html += '<div class="card" style="margin-bottom:14px;background:#eef2ec"><b>30hrs 自動待辦：</b>只要課程含「30hrs」且填了開課/結束日期，系統會自動在「今日→現在要做」產生：第2週提醒預約寫作/口說實戰課、結束前一週 Mock test after 與詢問老師缺作業、結束前最後一個週三所在週的週一提醒 speaking mock test、結束後一週提醒預約 Anita 諮詢。</div>';
  if(!all.length){
    html += '<div class="empty-state"><div class="e-ico">📘</div><div>尚無符合條件的已購課學生（在銷售管理新增成交紀錄會自動同步過來）</div></div>';
  } else {
    html += '<div class="table-wrap" style="overflow-x:auto"><table class="tbl" style="width:100%;border-collapse:collapse;font-size:13px">'+
      '<thead><tr><th style="text-align:left;padding:8px">姓名</th><th style="text-align:left;padding:8px">課程</th><th style="text-align:left;padding:8px">開課</th><th style="text-align:left;padding:8px">結束</th><th style="padding:8px"></th></tr></thead><tbody>'+
      all.map(function(t){
        return '<tr><td style="padding:8px">'+F.escapeHtml(t.name)+'</td><td style="padding:8px">'+F.escapeHtml(t.course||"")+'</td>'+
          '<td style="padding:8px">'+F.fmtDate(t.startDate)+'</td><td style="padding:8px">'+F.fmtDate(t.endDate)+'</td>'+
          '<td style="padding:8px"><button class="btn sm ghost" data-action="deleteZhiTrack" data-id="'+t.id+'">刪除</button></td></tr>';
      }).join("")+'</tbody></table></div>';
  }
  return html;
}
/* ---- 一對一 母分頁 ---- */
function syncOneOnOneToTrack(oo){
  var track = F.DB.work.zhi.courseTracking.find(function(x){return x.oneOnOneId===oo.id;});
  if(!track){ track = {id:F.uid(), oneOnOneId:oo.id, deletedAt:null, startDate:F.todayStr(), endDate:""}; F.DB.work.zhi.courseTracking.push(track); }
  track.name = oo.name; track.course = "一對一";
  track.note = "老師:"+(oo.teachers||[]).join("/")+" 科目:"+(oo.subjects||[]).join("/")+(oo.amount?" 金額:"+oo.amount:"");
}
F.runOneOnOneAutoCreate = function(){
  var changed = false;
  F.alive(F.DB.work.zhi.customers).forEach(function(c){
    if(!c.assessDate) return;
    var exists = F.DB.work.zhi.oneOnOne.some(function(x){return x.custId===c.id;});
    if(!exists){
      F.DB.work.zhi.oneOnOne.push({id:F.uid(), custId:c.id, name:c.name, teachers:[], paymentStatus:"尚未付款", payMethod:"", amount:"", classTime:"調整中", subjects:[], note:"", deletedAt:null});
      changed = true;
    }
  });
  if(changed) F.save();
  return changed;
};
F.zhiOOQuickPay = function(sel){
  var oo = F.DB.work.zhi.oneOnOne.find(function(x){return x.id===sel.getAttribute("data-id");});
  if(!oo) return;
  oo.paymentStatus = sel.value;
  if(oo.paymentStatus==="已付款") syncOneOnOneToTrack(oo);
  F.save(); F.render(); F.toast("已更新付款狀態");
};
F.openZhiOOModal = function(t){
  var id = t.getAttribute("data-id");
  var oo = F.DB.work.zhi.oneOnOne.find(function(x){return x.id===id;});
  if(!oo) return;
  var teacherBoxes = ZHI_TEACHERS.map(function(tc){
    var on = (oo.teachers||[]).indexOf(tc)>-1;
    return '<label style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:#fafbf8;border:1px solid var(--border);border-radius:8px;font-size:12.5px;cursor:pointer"><input type="checkbox" class="zhiOOTeacherChk" value="'+tc+'" '+(on?"checked":"")+'>'+tc+'</label>';
  }).join("");
  var subjBoxes = ZHI_SUBJECTS.map(function(sb){
    var on = (oo.subjects||[]).indexOf(sb)>-1;
    return '<label style="display:flex;align-items:center;gap:6px;padding:6px 8px;background:#fafbf8;border:1px solid var(--border);border-radius:8px;font-size:12.5px;cursor:pointer"><input type="checkbox" class="zhiOOSubjectChk" value="'+sb+'" '+(on?"checked":"")+'>'+sb+'</label>';
  }).join("");
  var payOpts = F.DB.work.zhi.payMethods.map(function(p){return '<option '+(oo.payMethod===p?"selected":"")+'>'+F.escapeHtml(p)+'</option>';}).join("");
  F.openModal(
    '<div class="modal-title">編輯一對一：'+F.escapeHtml(oo.name)+' '+F.helpBtn("zhi_oneonone")+'</div>'+
    '<form id="zhiOOForm">'+
    '<label class="field">上課老師（可複選）</label><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:6px;margin-bottom:8px">'+teacherBoxes+'</div>'+
    '<div class="row"><label class="field">已付款/尚未付款<select name="paymentStatus"><option '+(oo.paymentStatus==="尚未付款"?"selected":"")+'>尚未付款</option><option '+(oo.paymentStatus==="已付款"?"selected":"")+'>已付款</option></select></label>'+
    '<label class="field">付款方式<select name="payMethod"><option value="">—</option>'+payOpts+'</select></label></div>'+
    '<div class="row" style="margin-top:8px"><label class="field">金額<input type="number" name="amount" min="0" value="'+(oo.amount||"")+'"></label>'+
    '<label class="field">上課時間<select name="classTime"><option '+(oo.classTime==="已敲定"?"selected":"")+'>已敲定</option><option '+(oo.classTime==="調整中"?"selected":"")+'>調整中</option></select></label></div>'+
    '<label class="field" style="margin-top:8px">科目（可複選）</label><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:6px">'+subjBoxes+'</div>'+
    '<label class="field" style="margin-top:8px">備註<textarea name="note" rows="2">'+F.escapeHtml(oo.note||"")+'</textarea></label>'+
    '<div class="row" style="margin-top:14px"><button type="button" class="btn danger" data-action="deleteZhiOO" data-id="'+oo.id+'">刪除</button><button class="btn" type="submit" style="flex:2">儲存</button></div>'+
    '</form>', {wide:true}
  );
  document.getElementById("zhiOOForm").addEventListener("submit", function(e){
    e.preventDefault();
    var f = e.target;
    oo.teachers = Array.from(document.querySelectorAll(".zhiOOTeacherChk:checked")).map(function(i){return i.value;});
    oo.subjects = Array.from(document.querySelectorAll(".zhiOOSubjectChk:checked")).map(function(i){return i.value;});
    oo.paymentStatus = f.paymentStatus.value; oo.payMethod = f.payMethod.value; oo.amount = f.amount.value; oo.classTime = f.classTime.value;
    oo.note = f.note.value.trim();
    if(oo.paymentStatus==="已付款") syncOneOnOneToTrack(oo);
    F.save(); F.closeModal(); F.toast("已儲存"); F.render();
  });
};
F.deleteZhiOO = function(t){ F.softDelete(F.DB.work.zhi.oneOnOne, t.getAttribute("data-id")); F.save(); F.closeModal(); F.toast("已刪除"); F.render(); };
function renderZhiOneOnOne(){
  var all = F.alive(F.DB.work.zhi.oneOnOne).filter(function(o){ return !zhiOOSearch || o.name.indexOf(zhiOOSearch)>-1; });
  var html = '<div class="row" style="margin-bottom:12px"><input id="zhiOOSearchInput" placeholder="搜尋學生姓名..." value="'+F.escapeHtml(zhiOOSearch)+'"></div>';
  html += '<div class="card" style="margin-bottom:14px;background:#eef2ec">學生在日曆紀錄/學生資訊填入「程度檢測日期」後，會自動出現在這裡；把「已付款/尚未付款」改成「已付款」會自動同步到上方「一般課程」追蹤列表。</div>';
  if(!all.length){
    html += '<div class="empty-state"><div class="e-ico">🧑‍🏫</div><div>目前沒有一對一追蹤學生</div><div class="e-next">下一步：到學生資訊填入某位學生的程度檢測日期，就會自動出現在這裡</div></div>';
  } else {
    html += '<div class="info-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px">'+all.map(function(o){
      return '<div class="card"><div style="font-weight:800;margin-bottom:6px">'+F.escapeHtml(o.name)+'</div>'+
        '<select class="zhiOOPaySel" data-id="'+o.id+'" style="width:100%;margin-bottom:8px;font-size:12.5px"><option '+(o.paymentStatus==="尚未付款"?"selected":"")+'>尚未付款</option><option '+(o.paymentStatus==="已付款"?"selected":"")+'>已付款</option></select>'+
        '<div style="font-size:12px;color:var(--muted);line-height:1.7">'+
          '老師：'+((o.teachers||[]).join("、")||"—")+'<br>上課時間：'+(o.classTime||"—")+'<br>科目：'+((o.subjects||[]).join("、")||"—")+
          (o.amount?'<br>金額：NT$ '+(+o.amount).toLocaleString():"")+
        '</div>'+
        '<button class="btn sm secondary" style="width:100%;margin-top:8px" data-action="openZhiOOModal" data-id="'+o.id+'">編輯</button></div>';
    }).join("")+'</div>';
  }
  return html;
}
function renderZhiTrack(){
  var html = '<div class="section-head"><h2>📘 課程學生追蹤 '+F.helpBtn("zhi_track")+'</h2></div>';
  html += '<div class="tabs"><button class="'+(zhiTrackView==="general"?"active":"")+'" data-action="setZhiTrackView" data-view="general">一般課程</button>'+
    '<button class="'+(zhiTrackView==="oneonone"?"active":"")+'" data-action="setZhiTrackView" data-view="oneonone">一對一</button></div>';
  html += zhiTrackView==="oneonone" ? renderZhiOneOnOne() : renderZhiTrackGeneral();
  return html;
}
function renderZhiSales(){
  var all = F.alive(F.DB.work.zhi.sales);
  var total = all.length, rev = all.reduce(function(a,s){return a+(+s.amount||0);},0);
  var html = '<div class="section-head"><h2>💳 銷售管理 '+F.helpBtn("zhi_sales")+'</h2><button class="btn" data-action="openZhiSaleModal">＋新增成交紀錄</button></div>';
  html += '<div class="grid grid-3" style="margin-bottom:14px">'+
    '<div class="card"><div style="font-size:12px;color:var(--muted)">成交總筆數</div><div style="font-size:22px;font-weight:800">'+total+'</div></div>'+
    '<div class="card"><div style="font-size:12px;color:var(--muted)">總營收</div><div style="font-size:22px;font-weight:800;color:var(--primary-dark)">NT$ '+rev.toLocaleString()+'</div></div>'+
    '<div class="card"><div style="font-size:12px;color:var(--muted)">平均客單價</div><div style="font-size:22px;font-weight:800">NT$ '+(total?Math.round(rev/total).toLocaleString():0)+'</div></div>'+
  '</div>';
  html += '<div class="row" style="margin-bottom:10px">'+["全部"].concat(F.DB.work.zhi.payMethods).map(function(p){
    return '<button class="btn sm '+(p===zhiSalesPay?"":"secondary")+'" data-action="zhiSalesPaySeg" data-pay="'+F.escapeHtml(p)+'">'+F.escapeHtml(p)+'</button>';
  }).join("")+'<button class="btn sm secondary" data-action="exportZhiSalesFiltered">匯出目前篩選</button>'+
  '<button class="btn sm secondary" data-action="exportZhiSalesAll">匯出全部</button></div>';
  var list = all.filter(function(s){return zhiSalesPay==="全部"||s.payMethod===zhiSalesPay;}).sort(function(a,b){return (b.purchaseDate||"").localeCompare(a.purchaseDate||"");});
  if(!list.length){
    html += '<div class="empty-state"><div class="e-ico">💳</div><div>尚無成交紀錄</div></div>';
  } else {
    html += '<div class="list">'+list.map(function(s){
      return '<div class="list-item"><div class="li-body"><div class="li-title">'+F.escapeHtml(s.student)+'</div>'+
        '<div class="li-meta">'+F.fmtDate(s.purchaseDate)+' · NT$ '+(+s.amount).toLocaleString()+' · '+F.escapeHtml(s.payMethod)+' · '+F.escapeHtml(s.course||"")+'</div></div>'+
        '<button class="btn sm ghost" data-action="openZhiSaleModal" data-id="'+s.id+'">編輯</button></div>';
    }).join("")+'</div>';
  }
  html += renderZhiInstallment();
  return html;
}
F.zhiInstallMonthPrev = function(){ zhiInstallMonth = F.shiftMonth(zhiInstallMonth,-1); F.render(); };
F.zhiInstallMonthNext = function(){ zhiInstallMonth = F.shiftMonth(zhiInstallMonth,1); F.render(); };
F.zhiInstallMonthThis = function(){ zhiInstallMonth = F.todayStr().slice(0,7); F.render(); };
function renderZhiInstallment(){
  var ym = zhiInstallMonth;
  var all = F.alive(F.DB.work.zhi.sales);
  var monthlyRevenue = 0;
  var rows = [];
  all.forEach(function(s){
    var sched = F.installmentSchedule(s);
    var idx = sched.months.indexOf(ym);
    if(idx>-1){
      monthlyRevenue += sched.perPeriod;
      if(sched.periods>1) rows.push({student:s.student, perPeriod:sched.perPeriod, label:(idx+1)+"/"+sched.periods, payMethod:s.payMethod, course:s.course, total:s.amount});
    }
  });
  var html = '<div class="section-head" style="margin-top:20px"><h2 style="font-size:16px">📆 刷卡分期追蹤 '+F.helpBtn("zhi_install")+'</h2>'+
    '<div class="row"><button class="btn sm secondary" data-action="zhiInstallMonthPrev">← 上月</button>'+
    '<button class="btn sm secondary" data-action="zhiInstallMonthThis">本月</button>'+
    '<button class="btn sm secondary" data-action="zhiInstallMonthNext">下月 →</button></div></div>';
  html += '<div class="card" style="margin-bottom:10px"><div style="font-weight:800;font-size:16px">'+F.monthLabel(ym)+' 本月正確營業額（已依分期拆算）</div>'+
    '<div style="font-size:24px;font-weight:800;color:var(--primary-dark);margin-top:4px">NT$ '+monthlyRevenue.toLocaleString()+'</div></div>';
  if(!rows.length){
    html += '<div class="empty-state"><div class="e-ico">📆</div><div>這個月沒有分期付款學生的期數落在此月</div></div>';
  } else {
    html += '<div class="list">'+rows.map(function(r){
      return '<div class="list-item"><div class="li-body"><div class="li-title">'+F.escapeHtml(r.student)+' <span class="pill">第 '+r.label+' 期</span></div>'+
        '<div class="li-meta">本期 NT$ '+r.perPeriod.toLocaleString()+' · 總額 NT$ '+(+r.total).toLocaleString()+' · '+F.escapeHtml(r.payMethod)+' · '+F.escapeHtml(r.course||"")+'</div></div></div>';
    }).join("")+'</div>';
  }
  return html;
}

/* ---------- 設定（課程/付款方式） ---------- */
F.addZhiCourseChip = function(){
  var input = document.getElementById("zhiNewCourseInput");
  var v = input.value.trim(); if(!v){ F.toast("請輸入課程名稱"); return; }
  F.DB.work.zhi.courses.push(v); input.value=""; F.save(); F.render();
};
F.removeZhiCourseChip = function(t){ F.DB.work.zhi.courses.splice(+t.getAttribute("data-i"),1); F.save(); F.render(); };
F.addZhiPayChip = function(){
  var input = document.getElementById("zhiNewPayInput");
  var v = input.value.trim(); if(!v){ F.toast("請輸入付款方式"); return; }
  F.DB.work.zhi.payMethods.push(v); input.value=""; F.save(); F.render();
};
F.removeZhiPayChip = function(t){ F.DB.work.zhi.payMethods.splice(+t.getAttribute("data-i"),1); F.save(); F.render(); };
function renderZhiSettings(){
  var html = '<div class="card section"><div class="card-title">課程選項</div><div class="chip-list" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">'+
    F.DB.work.zhi.courses.map(function(c,i){ return '<span class="pill">'+F.escapeHtml(c)+' <span data-action="removeZhiCourseChip" data-i="'+i+'" style="cursor:pointer;margin-left:4px">✕</span></span>'; }).join("")+
    '</div><div class="row"><input id="zhiNewCourseInput" placeholder="輸入課程名稱"><button class="btn sm" data-action="addZhiCourseChip">新增課程</button></div></div>';
  html += '<div class="card section"><div class="card-title">付款方式</div><div class="chip-list" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">'+
    F.DB.work.zhi.payMethods.map(function(p,i){ return '<span class="pill">'+F.escapeHtml(p)+' <span data-action="removeZhiPayChip" data-i="'+i+'" style="cursor:pointer;margin-left:4px">✕</span></span>'; }).join("")+
    '</div><div class="row"><input id="zhiNewPayInput" placeholder="輸入付款方式"><button class="btn sm" data-action="addZhiPayChip">新增付款方式</button></div></div>';
  return html;
}

F.setZhiCalcSessions = function(){
  zhiCalcSessions = Math.max(1, Number(document.getElementById("zhiCalcInput").value) || 1);
  F.render();
};
function oneOnOnePrice(n){
  var rate = n>=20?0.8 : n>=10?0.9 : n>=5?0.95 : 1;
  return {rate:rate, total:Math.round(1800*n*rate)};
}
function renderZhiCalc(){
  var n = zhiCalcSessions;
  var oo = oneOnOnePrice(n);
  var html = '<div class="section-head"><h2>🧮 價格試算 '+F.helpBtn("zhi_calc")+'</h2></div>';
  html += '<div class="card" style="max-width:360px;margin-bottom:16px"><label class="field">堂數<input type="number" id="zhiCalcInput" min="1" value="'+n+'" oninput="void 0"></label></div>';
  html += '<div class="grid grid-2">'+
    '<div class="card"><div style="font-size:12px;color:var(--muted)">一對一（原價 $1800/堂，5堂95折/10堂9折/20堂以上8折）</div>'+
    '<div style="font-size:22px;font-weight:800;color:var(--primary-dark);margin-top:4px">NT$ '+oo.total.toLocaleString()+'</div>'+
    '<div style="font-size:11.5px;color:var(--muted);margin-top:2px">折扣：'+Math.round((1-oo.rate)*100)+'%　單堂約 NT$ '+Math.round(oo.total/n).toLocaleString()+'</div></div>'+
    '<div class="card"><div style="font-size:12px;color:var(--muted)">固定費率方案</div>'+
    [390,450,500].map(function(rate){
      return '<div style="display:flex;justify-content:space-between;margin-top:6px;font-size:14px"><span>$'+rate+' × '+n+' 堂</span><b>NT$ '+(rate*n).toLocaleString()+'</b></div>';
    }).join("")+
    '</div></div>';
  return html;
}

window.__ZHI_AFTER = function(){
  var s1 = document.getElementById("zhiStudentSearchInput");
  if(s1) s1.addEventListener("input", function(){ zhiStudentSearch = s1.value; F.render(); });
  var s2 = document.getElementById("zhiStudentStatusSel");
  if(s2) s2.addEventListener("change", function(){ zhiStudentStatus = s2.value; F.render(); });
  document.querySelectorAll(".zhiQuickStatusSel").forEach(function(sel){ sel.onchange = function(){ F.zhiQuickStatus(sel); }; });
  var s3 = document.getElementById("zhiTrackSearchInput");
  if(s3) s3.addEventListener("input", function(){ zhiTrackSearch = s3.value; F.render(); });
  var s4 = document.getElementById("zhiOOSearchInput");
  if(s4) s4.addEventListener("input", function(){ zhiOOSearch = s4.value; F.render(); });
  document.querySelectorAll(".zhiOOPaySel").forEach(function(sel){ sel.onchange = function(){ F.zhiOOQuickPay(sel); }; });
  var s5 = document.getElementById("zhiCalcInput");
  if(s5) s5.addEventListener("input", F.setZhiCalcSessions);
};

var ZHI_SUB_TABS = [
  {key:"cal", label:"日曆紀錄"}, {key:"students", label:"學生資訊"}, {key:"seminar", label:"講座名單"},
  {key:"track", label:"課程學生追蹤"}, {key:"sales", label:"銷售管理"}, {key:"calc", label:"價格試算"}, {key:"settings", label:"設定"}
];
function renderZhiRoot(){
  var html = '<div class="tabs" style="margin-top:6px">'+ZHI_SUB_TABS.map(function(s){
    return '<button class="'+(zhiSub===s.key?"active":"")+'" data-action="setZhiSub" data-sub="'+s.key+'">'+s.label+'</button>';
  }).join("")+'</div>';
  if(zhiSub==="cal") html += renderZhiCalendar();
  else if(zhiSub==="students") html += renderZhiStudents();
  else if(zhiSub==="seminar") html += renderZhiSeminar();
  else if(zhiSub==="track") html += renderZhiTrack();
  else if(zhiSub==="sales") html += renderZhiSales();
  else if(zhiSub==="calc") html += renderZhiCalc();
  else if(zhiSub==="settings") html += renderZhiSettings();
  return html;
}

window.__PAGES.work = function(){
  var DB = F.DB;
  var html = '<div class="tabs">'+
    '<button class="'+(workTab==="fanshi"?"active":"")+'" data-action="setWorkTab" data-tab="fanshi">凡蒔顧問業務</button>'+
    '<button class="'+(workTab==="zhi"?"active":"")+'" data-action="setWorkTab" data-tab="zhi">知英語銷售顧問</button>'+
    '<button class="'+(workTab==="courify"?"active":"")+'" data-action="setWorkTab" data-tab="courify">Courify 行銷</button>'+
    '</div>';

  if(workTab==="fanshi"){
    var clients = F.alive(DB.work.fanshi.clients);
    html += '<div class="section-head"><h2>🧭 凡蒔顧問業務 '+F.helpBtn("work_fanshi")+'</h2><button class="btn" data-action="openAddFanshiClient">新增客戶</button></div>';
    if(!clients.length){
      html += '<div class="empty-state"><div class="e-ico">🧭</div><div>還沒有客戶/案件紀錄</div><div class="e-next">下一步：點「新增客戶」建立第一筆（網站架設／顧問外包／健身纖體）</div></div>';
    } else {
      html += '<div class="list">'+clients.map(function(c){
        var stale = (Date.now()-c.updatedAt) > 5*86400000 && c.stage!=="結案";
        return '<div class="list-item"><div class="li-body"><div class="li-title">'+F.escapeHtml(c.name)+(stale?' <span class="pill danger">已停滯</span>':'')+'</div>'+
          '<div class="li-meta"><span class="tag">'+F.escapeHtml(c.type)+'</span>下一步：'+F.escapeHtml(c.nextStep||"無")+'</div>'+
          F.linkedChips("fanshi",c.id)+'</div>'+
          '<select class="fsStageSelect" data-id="'+c.id+'" style="width:auto;padding:4px 8px;font-size:12px">'+FANSHI_STAGES.map(function(s){return '<option '+(s===c.stage?"selected":"")+'>'+s+'</option>';}).join("")+'</select>'+
          '<button class="btn sm ghost" data-action="openLinkPickerBtn" data-type="fanshi" data-id="'+c.id+'">關聯</button>'+
          '<button class="btn sm ghost" data-action="deleteFanshiClient" data-id="'+c.id+'">刪除</button></div>';
      }).join("")+'</div>';
    }
  } else if(workTab==="zhi"){
    html += renderZhiRoot();
  } else {
    var tasks = F.alive(DB.work.courify.tasks);
    html += '<div class="section-head"><h2>📣 Courify 行銷 '+F.helpBtn("work_courify")+'</h2><button class="btn" data-action="openAddCourifyTask">新增任務</button></div>';
    if(!tasks.length){
      html += '<div class="empty-state"><div class="e-ico">📣</div><div>Courify 目前是全新的空模塊，尚未匯入任何資料</div><div class="e-next">下一步：點「新增任務」開始記錄第一筆</div></div>';
    } else {
      html += '<div class="list">'+tasks.map(function(t){
        return '<div class="list-item '+(t.done?"done":"")+'"><button class="check '+(t.done?"checked":"")+'" data-action="toggleCourifyTask" data-id="'+t.id+'">'+(t.done?"✓":"")+'</button>'+
          '<div class="li-body"><div class="li-title">'+F.escapeHtml(t.title)+'</div>'+F.linkedChips("courify",t.id)+'</div>'+
          '<button class="btn sm ghost" data-action="openLinkPickerBtn" data-type="courify" data-id="'+t.id+'">關聯</button>'+
          '<button class="btn sm ghost" data-action="deleteCourifyTask" data-id="'+t.id+'">刪除</button></div>';
      }).join("")+'</div>';
    }
  }
  return html;
};
})();
