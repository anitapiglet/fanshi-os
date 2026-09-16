/* ===== 工作管理 module：凡蒔顧問業務 / 知英語銷售顧問 / Courify行銷 ===== */
(function(){
var F = window.__FS;
var workTab = "fanshi";
var FANSHI_STAGES = ["洽談","提案","簽約","進行中","結案"];
var ZHI_STAGES = ["名單","已預約","已體驗","已成交","流失"];

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

/* --- 知英語銷售顧問 --- */
F.openAddZhiCustomer = function(){
  F.openModal(
    '<div class="modal-title">新增知英語客戶 '+F.helpBtn("work_zhi")+'</div>'+
    '<form id="zhForm"><label class="field">姓名<input name="name" required></label>'+
    '<div class="row" style="margin-top:8px">'+
    '<label class="field">來源<select name="source"><option>測驗quiz</option><option>官網預約</option><option>Facebook</option><option>轉介</option><option>收集箱</option></select></label>'+
    '<label class="field">階段<select name="stage">'+ZHI_STAGES.map(function(s){return "<option>"+s+"</option>";}).join("")+'</select></label></div>'+
    '<label class="field" style="margin-top:8px">備註<textarea name="notes" rows="2"></textarea></label>'+
    '<button class="btn" type="submit" style="width:100%;margin-top:10px">新增</button></form>'
  );
  document.getElementById("zhForm").addEventListener("submit", function(e){
    e.preventDefault();
    var f = e.target;
    F.DB.work.zhi.customers.push({id:F.uid(), name:f.name.value, source:f.source.value, stage:f.stage.value, notes:f.notes.value, lastContactTs:Date.now(), deletedAt:null});
    F.save(); F.closeModal(); F.render();
  });
};
F.deleteZhiCustomer = function(t){ F.softDelete(F.DB.work.zhi.customers, t.getAttribute("data-id")); F.save(); F.toast("已刪除"); F.render(); };

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
  document.querySelectorAll(".zhStageSelect").forEach(function(sel){
    sel.onchange = function(){
      var c = F.DB.work.zhi.customers.find(function(x){return x.id===sel.getAttribute("data-id");});
      if(c){ c.stage = sel.value; c.lastContactTs = Date.now(); F.save(); F.render(); }
    };
  });
};

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
    var customers = F.alive(DB.work.zhi.customers);
    html += '<div class="section-head"><h2>🎓 知英語銷售顧問 '+F.helpBtn("work_zhi")+'</h2><button class="btn" data-action="openAddZhiCustomer">新增客戶</button></div>';
    if(!customers.length){
      html += '<div class="empty-state"><div class="e-ico">🎓</div><div>還沒有客戶紀錄</div><div class="e-next">下一步：點「新增客戶」，或到今日頁「填充演示數據」查看示例（沿用原諮詢日記的名單→已預約→已體驗→已成交流程）</div></div>';
    } else {
      html += '<div class="list">'+customers.sort(function(a,b){return b.lastContactTs-a.lastContactTs;}).map(function(c){
        var stale = (Date.now()-c.lastContactTs) > 4*86400000 && c.stage!=="已成交" && c.stage!=="流失";
        return '<div class="list-item"><div class="li-body"><div class="li-title">'+F.escapeHtml(c.name)+(stale?' <span class="pill danger">已停滯</span>':'')+'</div>'+
          '<div class="li-meta"><span class="tag">來源：'+F.escapeHtml(c.source)+'</span>'+F.escapeHtml(c.notes||"")+'</div>'+
          F.linkedChips("zhi",c.id)+'</div>'+
          '<select class="zhStageSelect" data-id="'+c.id+'" style="width:auto;padding:4px 8px;font-size:12px">'+ZHI_STAGES.map(function(s){return '<option '+(s===c.stage?"selected":"")+'>'+s+'</option>';}).join("")+'</select>'+
          '<button class="btn sm ghost" data-action="openLinkPickerBtn" data-type="zhi" data-id="'+c.id+'">關聯</button>'+
          '<button class="btn sm ghost" data-action="deleteZhiCustomer" data-id="'+c.id+'">刪除</button></div>';
      }).join("")+'</div>';
    }
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
