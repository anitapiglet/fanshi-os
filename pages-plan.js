/* ===== 每日計劃 module ===== */
(function(){
var F = window.__FS;
var STAGES = [
  {key:"script", label:"腳本", color:"#5c8577"},
  {key:"shoot", label:"拍攝", color:"#b98b73"},
  {key:"edit", label:"剪輯", color:"#2f5d50"},
  {key:"publish", label:"發佈", color:"#c99a4b"},
  {key:"review", label:"復盤", color:"#8a5b1c"}
];
var taskFilter = "today";
var calWeekOffset = 0;

F.setTaskFilter = function(t){ taskFilter = t.getAttribute("data-filter"); F.render(); };
F.toggleTask = function(t){
  var id = t.getAttribute("data-id");
  var task = F.DB.tasks.find(function(x){return x.id===id;});
  if(task){ task.done = !task.done; F.save(); F.render(); }
};
F.deleteTask = function(t){
  F.softDelete(F.DB.tasks, t.getAttribute("data-id"));
  F.save(); F.toast("已刪除，可在設置的垃圾桶還原"); F.render();
};
F.openAddTaskModal = function(){
  F.openModal(
    '<div class="modal-title">新增任務 '+F.helpBtn("plan_task")+'</div>'+
    '<form id="addTaskForm">'+
      '<label class="field">標題<input name="title" required placeholder="例如：錄製本週影片腳本"></label>'+
      '<div class="row" style="margin-top:8px">'+
        '<label class="field">日期<input type="date" name="date" value="'+F.todayStr()+'"></label>'+
        '<label class="field">時間<input type="time" name="time"></label>'+
      '</div>'+
      '<div class="row" style="margin-top:8px">'+
        '<label class="field">分類<select name="category"><option>工作</option><option>生活</option><option>自媒體</option><option>學習</option><option>知英語</option><option>凡蒔顧問</option><option>Courify</option></select></label>'+
        '<label class="field">優先級<select name="priority"><option>高</option><option selected>中</option><option>低</option></select></label>'+
      '</div>'+
      '<label class="field" style="margin-top:8px">標籤（逗號分隔）<input name="tags" placeholder="例如：直播,重要"></label>'+
      '<button class="btn" type="submit" style="width:100%;margin-top:14px">新增</button>'+
    '</form>'
  );
  document.getElementById("addTaskForm").addEventListener("submit", function(e){
    e.preventDefault();
    var f = e.target;
    F.DB.tasks.push({id:F.uid(), title:f.title.value, date:f.date.value||F.todayStr(), time:f.time.value, category:f.category.value, priority:f.priority.value, tags:(f.tags.value||"").split(",").map(function(s){return s.trim();}).filter(Boolean), done:false, createdAt:Date.now(), deletedAt:null});
    F.save(); F.closeModal(); F.toast("已新增任務"); F.render();
  });
};

function taskCard(t){
  return '<div class="list-item '+(t.done?"done":"")+'">'+
    '<button class="check '+(t.done?"checked":"")+'" data-action="toggleTask" data-id="'+t.id+'">'+(t.done?"✓":"")+'</button>'+
    '<div class="li-body"><div class="li-title">'+F.escapeHtml(t.title)+'</div>'+
    '<div class="li-meta"><span class="pill muted">'+F.fmtDate(t.date)+(t.time?" "+t.time:"")+'</span>'+
    '<span class="pill">'+F.escapeHtml(t.category||"")+'</span><span class="pill '+(t.priority==="高"?"danger":t.priority==="低"?"muted":"warn")+'">'+t.priority+'</span></div>'+
    (t.tags&&t.tags.length?'<div style="margin-top:4px">'+t.tags.map(function(tg){return '<span class="tag">#'+F.escapeHtml(tg)+'</span>';}).join("")+'</div>':'')+
    F.linkedChips("task",t.id)+
    '</div><div class="li-actions"><button class="btn sm ghost" data-action="openLinkPickerBtn" data-type="task" data-id="'+t.id+'">關聯</button>'+
    '<button class="btn sm ghost" data-action="deleteTask" data-id="'+t.id+'">刪除</button></div></div>';
}

function filteredTasks(){
  var today = F.todayStr();
  var tasks = F.alive(F.DB.tasks);
  if(taskFilter==="today") return tasks.filter(function(t){return t.date===today && !t.done;});
  if(taskFilter==="tomorrow") return tasks.filter(function(t){return t.date===F.addDays(today,1);});
  if(taskFilter==="week"){
    var start = F.startOfWeek(today), end = F.addDays(start,6);
    return tasks.filter(function(t){return t.date>=start && t.date<=end;});
  }
  if(taskFilter==="done") return tasks.filter(function(t){return t.done;});
  return tasks;
}

function weekCalendarHtml(){
  var base = F.addDays(F.startOfWeek(F.todayStr()), calWeekOffset*7);
  var days = [];
  for(var i=0;i<7;i++) days.push(F.addDays(base,i));
  var cal = F.DB.plan.calendar;
  var totalCells = 0, doneCells = 0;
  var html = '<div class="week-cal">';
  days.forEach(function(d){
    var entries = cal.filter(function(c){return c.date===d;});
    totalCells += entries.length;
    doneCells += entries.filter(function(e){return e.done;}).length;
    html += '<div class="week-day" data-action="calDayClick" data-date="'+d+'">'+
      '<div class="wd-label">'+F.weekdayLabel(d)+'</div><div class="wd-date">'+d.split("-")[2]+'</div>'+
      entries.map(function(en){
        var st = STAGES.find(function(s){return s.key===en.stage;});
        return '<div class="stage-chip" style="background:'+(en.done?st.color:"#c7cec3")+'" data-action="calToggle" data-id="'+en.id+'">'+st.label+(en.done?" ✓":"")+'</div>';
      }).join("")+
      '</div>';
  });
  html += '</div>';
  var pct = totalCells? Math.round(doneCells/totalCells*100):0;
  return {html:html, pct:pct, range:F.fmtDate(days[0])+" - "+F.fmtDate(days[6])};
}
F.calWeekPrev = function(){ calWeekOffset--; F.render(); };
F.calWeekNext = function(){ calWeekOffset++; F.render(); };
F.calWeekThis = function(){ calWeekOffset=0; F.render(); };
F.calToggle = function(t){
  var id = t.getAttribute("data-id");
  var en = F.DB.plan.calendar.find(function(x){return x.id===id;});
  if(en){ en.done = !en.done; F.save(); F.render(); }
  event.stopPropagation ? null : null;
};
F.calDayClick = function(t){
  var date = t.getAttribute("data-date");
  F.openModal(
    '<div class="modal-title">'+F.fmtDate(date)+' 更新計劃 '+F.helpBtn("plan_calendar")+'</div>'+
    '<form id="calForm"><label class="field">階段<select name="stage">'+
      STAGES.map(function(s){return '<option value="'+s.key+'">'+s.label+'</option>';}).join("")+
      '</select></label>'+
      '<button class="btn" type="submit" style="width:100%;margin-top:12px">加入這天</button></form>'
  );
  document.getElementById("calForm").addEventListener("submit", function(e){
    e.preventDefault();
    F.DB.plan.calendar.push({id:F.uid(), date:date, stage:e.target.stage.value, done:false});
    F.save(); F.closeModal(); F.toast("已加入更新計劃"); F.render();
  });
};
F.openLinkPickerBtn = function(t){ F.openLinkPicker(t.getAttribute("data-type"), t.getAttribute("data-id")); };

window.__PAGES.plan = function(){
  var tasks = filteredTasks();
  var cal = weekCalendarHtml();
  var html = '<div class="grid grid-2">';
  html += '<div>';
  html += '<div class="section-head"><h2>📌 任務 '+F.helpBtn("plan_task")+'</h2><button class="btn" data-action="openAddTaskModal">新增任務</button></div>';
  html += '<div class="tabs">'+
    ["today:今日","tomorrow:明日","week:本週","done:已完成","all:全部"].map(function(f){
      var p = f.split(":"); return '<button class="'+(taskFilter===p[0]?"active":"")+'" data-action="setTaskFilter" data-filter="'+p[0]+'">'+p[1]+'</button>';
    }).join("")+'</div>';
  if(!tasks.length){
    html += '<div class="empty-state"><div class="e-ico">🗒️</div><div>此篩選下沒有任務</div><div class="e-next">下一步：點「新增任務」建立第一筆</div></div>';
  } else {
    html += '<div class="list">'+tasks.map(taskCard).join("")+'</div>';
  }
  html += '</div>';

  html += '<div class="card">'+
    '<div class="card-title">🗓️ 博主更新日曆（週視圖） '+F.helpBtn("plan_calendar")+'</div>'+
    '<div class="row" style="margin-bottom:10px"><button class="btn sm secondary" data-action="calWeekPrev">← 上週</button>'+
    '<button class="btn sm secondary" data-action="calWeekThis">本週</button>'+
    '<button class="btn sm secondary" data-action="calWeekNext">下週 →</button></div>'+
    '<div style="font-size:12.5px;color:var(--muted);margin-bottom:8px">'+cal.range+' · 整體進度 '+cal.pct+'%</div>'+
    cal.html+
    '<div class="row" style="margin-top:10px">'+
      STAGES.map(function(s){return '<span class="pill" style="background:'+s.color+'22;color:'+s.color+'">'+s.label+'</span>';}).join("")+
    '</div>'+
  '</div>';
  html += '</div>';
  return html;
};
})();
