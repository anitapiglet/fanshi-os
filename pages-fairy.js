/* ===== 仙女媽咪專區 module ===== */
(function(){
var F = window.__FS;
var FAIRY_STATUS = ["尚未處理","與學生確認中","仙女確認中","已完成"];
var FAIRY_PRIORITY = ["高","中","低"];
var PRIORITY_ORDER = {"高":0,"中":1,"低":2};

F.openFairyModal = function(t){
  var id = t && t.getAttribute("data-id");
  var it = id ? F.DB.fairy.items.find(function(x){return x.id===id;}) : null;
  var statusOpts = FAIRY_STATUS.map(function(s){return '<option '+(it&&it.status===s?"selected":"")+'>'+s+'</option>';}).join("");
  var priOpts = FAIRY_PRIORITY.map(function(p){return '<option '+(it&&it.priority===p?"selected":(!it&&p==="中"?"selected":""))+'>'+p+'</option>';}).join("");
  F.openModal(
    '<div class="modal-title">'+(it?"編輯":"新增")+'項目 '+F.helpBtn("fairy_zone")+'</div>'+
    '<form id="fairyForm">'+
    '<label class="field">標題<input name="title" required value="'+(it?F.escapeHtml(it.title):"")+'"></label>'+
    '<div class="row" style="margin-top:8px">'+
      '<label class="field">狀態<select name="status">'+statusOpts+'</select></label>'+
      '<label class="field">優先級<select name="priority">'+priOpts+'</select></label>'+
    '</div>'+
    '<label class="field" style="margin-top:8px">備註<textarea name="note" rows="2">'+(it?F.escapeHtml(it.note||""):"")+'</textarea></label>'+
    '<div class="row" style="margin-top:14px">'+
      (it?'<button type="button" class="btn danger" data-action="deleteFairy" data-id="'+it.id+'">刪除</button>':'')+
      '<button class="btn" type="submit" style="flex:2">儲存</button></div>'+
    '</form>'
  );
  document.getElementById("fairyForm").addEventListener("submit", function(e){
    e.preventDefault();
    var f = e.target;
    var obj = {title:f.title.value.trim(), status:f.status.value, priority:f.priority.value, note:f.note.value.trim()};
    if(it){ Object.assign(it, obj); } else { F.DB.fairy.items.push(Object.assign({id:F.uid(), createdAt:Date.now(), deletedAt:null}, obj)); }
    F.save(); F.closeModal(); F.toast("已儲存"); F.render();
  });
};
F.deleteFairy = function(t){
  if(!confirm("確定要刪除這個項目嗎？")) return;
  F.softDelete(F.DB.fairy.items, t.getAttribute("data-id")); F.save(); F.closeModal(); F.toast("已刪除"); F.render();
};
F.fairyQuickStatus = function(sel){
  var it = F.DB.fairy.items.find(function(x){return x.id===sel.getAttribute("data-id");});
  if(it){ it.status = sel.value; F.save(); F.render(); }
};
F.exportFairyExcel = function(){
  var rows = F.alive(F.DB.fairy.items).map(function(it){
    return [it.title, it.status, it.priority, it.note||"", new Date(it.createdAt).toLocaleDateString()];
  });
  F.exportExcel("仙女媽咪專區_"+F.todayStr()+".xls", "仙女媽咪專區", ["標題","狀態","優先級","備註","建立日期"], rows);
  F.toast("已匯出，共 "+rows.length+" 筆");
};
window.__PAGE_AFTER.fairy = function(){
  document.querySelectorAll(".fairyStatusSel").forEach(function(sel){ sel.onchange = function(){ F.fairyQuickStatus(sel); }; });
};

window.__PAGES.fairy = function(){
  var items = F.alive(F.DB.fairy.items).slice().sort(function(a,b){
    var pa = PRIORITY_ORDER[a.priority]!=null?PRIORITY_ORDER[a.priority]:1;
    var pb = PRIORITY_ORDER[b.priority]!=null?PRIORITY_ORDER[b.priority]:1;
    if(pa!==pb) return pa-pb;
    return b.createdAt-a.createdAt;
  });
  var html = '<div class="section-head"><h2>🧚 仙女媽咪專區 '+F.helpBtn("fairy_zone")+'</h2>'+
    '<div class="row"><button class="btn secondary" data-action="exportFairyExcel">每日匯出Excel</button>'+
    '<button class="btn" data-action="openFairyModal">＋新增項目</button></div></div>';
  if(!items.length){
    html += '<div class="empty-state"><div class="e-ico">🧚</div><div>目前沒有項目</div><div class="e-next">下一步：點「＋新增項目」建立第一筆</div></div>';
  } else {
    html += '<div class="list">'+items.map(function(it){
      var priColor = it.priority==="高" ? "var(--danger)" : it.priority==="中" ? "var(--warn)" : "var(--muted)";
      return '<div class="list-item"><div class="li-body"><div class="li-title">'+F.escapeHtml(it.title)+
        ' <span class="pill" style="background:'+priColor+'22;color:'+priColor+'">優先級 '+it.priority+'</span></div>'+
        '<div class="li-meta">'+(it.note?F.escapeHtml(it.note):"")+'</div></div>'+
        '<select class="fairyStatusSel" data-id="'+it.id+'" style="width:auto;padding:4px 8px;font-size:12px">'+
          FAIRY_STATUS.map(function(s){return '<option '+(s===it.status?"selected":"")+'>'+s+'</option>';}).join("")+
        '</select>'+
        '<button class="btn sm ghost" data-action="openFairyModal" data-id="'+it.id+'">編輯</button></div>';
    }).join("")+'</div>';
  }
  return html;
};
})();
