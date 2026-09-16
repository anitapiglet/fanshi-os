/* ===== 收集箱 module ===== */
(function(){
var F = window.__FS;

var MODULE_LABELS = {
  task:"每日計劃 · 任務", info:"信息管理 · 靈感摘錄", work_zhi:"工作管理 · 知英語銷售顧問",
  work_fanshi:"工作管理 · 凡蒔顧問業務", content:"自媒體運營 · 選題流", books:"我的書單"
};

function moveInboxTo(item, moduleKey){
  var DB = F.DB;
  var newId = F.uid();
  if(moduleKey==="task"){
    DB.tasks.push({id:newId, title:item.content.slice(0,60), date:F.todayStr(), time:"", category:"收集箱", priority:"中", tags:["收集箱"], done:false, createdAt:Date.now(), deletedAt:null});
  } else if(moduleKey==="info"){
    DB.info.inspirations.push({id:newId, text:item.content, starred:false, tags:["收集箱"], createdAt:Date.now(), deletedAt:null});
  } else if(moduleKey==="work_zhi"){
    DB.work.zhi.customers.push({id:newId, name:item.content.slice(0,20), source:"收集箱", stage:"名單", lastContactTs:Date.now(), notes:item.content, deletedAt:null});
  } else if(moduleKey==="work_fanshi"){
    DB.work.fanshi.clients.push({id:newId, name:item.content.slice(0,20), type:"顧問外包", stage:"洽談", nextStep:"待補充", updatedAt:Date.now(), deletedAt:null});
  } else if(moduleKey==="content"){
    DB.content.pipeline.push({id:newId, title:item.content.slice(0,40), stage:"idea", updatedAt:Date.now(), notes:"", deletedAt:null});
  } else if(moduleKey==="books"){
    DB.books.mylist.push({id:newId, title:item.content.slice(0,40), category:"待分類", status:"想讀", rating:0, progress:0, deletedAt:null});
  }
  item.resolvedModule = moduleKey;
  item.resolvedId = newId;
  item.status = "confirmed";
}
function undoInboxMove(item){
  var DB = F.DB;
  var map = {task:DB.tasks, info:DB.info.inspirations, work_zhi:DB.work.zhi.customers, work_fanshi:DB.work.fanshi.clients, content:DB.content.pipeline, books:DB.books.mylist};
  var arr = map[item.resolvedModule];
  if(arr){
    var idx = arr.findIndex(function(x){return x.id===item.resolvedId;});
    if(idx>-1) arr.splice(idx,1);
  }
  item.status = "pending"; item.resolvedModule=null; item.resolvedId=null;
}

F.inboxConfirm = function(t){
  var id = t.getAttribute("data-id");
  var item = F.DB.inbox.find(function(x){return x.id===id;});
  if(!item) return;
  moveInboxTo(item, item.aiSuggest.module);
  F.save(); F.toast("已移到「"+MODULE_LABELS[item.aiSuggest.module]+"」"); F.render();
};
F.inboxIgnore = function(t){
  var id = t.getAttribute("data-id");
  var item = F.DB.inbox.find(function(x){return x.id===id;});
  if(!item) return;
  item.status = "ignored";
  F.save(); F.toast("已忽略，仍留在收集箱"); F.render();
};
F.inboxUnignore = function(t){
  var id = t.getAttribute("data-id");
  var item = F.DB.inbox.find(function(x){return x.id===id;});
  if(!item) return;
  item.status = "pending";
  F.save(); F.render();
};
F.inboxUndo = function(t){
  var id = t.getAttribute("data-id");
  var item = F.DB.inbox.find(function(x){return x.id===id;});
  if(!item) return;
  undoInboxMove(item);
  F.save(); F.toast("已撤銷，移回待確認"); F.render();
};
F.inboxDelete = function(t){
  var id = t.getAttribute("data-id");
  F.softDelete(F.DB.inbox, id);
  F.save(); F.toast("已刪除收集箱項目"); F.render();
};
F.inboxChangeModule = function(t){
  var id = t.getAttribute("data-id");
  var rows = Object.keys(MODULE_LABELS).map(function(k){
    return '<button class="btn secondary" style="width:100%;text-align:left;margin-bottom:6px" data-action="inboxManualMove" data-id="'+id+'" data-module="'+k+'">'+MODULE_LABELS[k]+'</button>';
  }).join("");
  F.openModal('<div class="modal-title">改為其他模塊</div><div class="modal-sub">選擇要移動到的模塊</div><div>'+rows+'</div>');
};
F.inboxManualMove = function(t){
  var id = t.getAttribute("data-id"), moduleKey = t.getAttribute("data-module");
  var item = F.DB.inbox.find(function(x){return x.id===id;});
  if(!item) return;
  moveInboxTo(item, moduleKey);
  F.save(); F.closeModal(); F.toast("已移到「"+MODULE_LABELS[moduleKey]+"」"); F.render();
};
F.quickAddSubmitInbox = function(){}; // placeholder if needed elsewhere

var inboxTab = "pending";
F.setInboxTab = function(t){ inboxTab = t.getAttribute("data-tab"); F.render(); };

function inboxItemCard(item, opts){
  opts = opts||{};
  var typeIco = {text:"📝",link:"🔗",task:"✅",image:"🖼️",file:"📎"}[item.type]||"📝";
  var body = '<div class="li-body"><div class="li-title">'+typeIco+' '+F.escapeHtml(item.content.slice(0,80))+'</div>';
  if(item.status==="pending" && !opts.simple){
    body += '<div class="li-meta">AI 建議：'+F.escapeHtml(MODULE_LABELS[item.aiSuggest.module])+'</div>'+
      '<div class="li-meta" style="color:var(--muted)">'+F.escapeHtml(item.aiSuggest.reason)+'</div>';
  } else if(item.status==="confirmed"){
    body += '<div class="li-meta">已移至：'+F.escapeHtml(MODULE_LABELS[item.resolvedModule]||"")+'</div>';
  } else if(item.status==="ignored"){
    body += '<div class="li-meta">已忽略</div>';
  }
  body += '</div>';
  var actions = '<div class="li-actions">';
  if(item.status==="pending"){
    actions += '<button class="btn sm" data-action="inboxConfirm" data-id="'+item.id+'">確認移動</button>'+
      '<button class="btn sm secondary" data-action="inboxChangeModule" data-id="'+item.id+'">改為其他</button>'+
      '<button class="btn sm ghost" data-action="inboxIgnore" data-id="'+item.id+'">忽略</button>';
  } else if(item.status==="confirmed"){
    actions += '<button class="btn sm secondary" data-action="inboxUndo" data-id="'+item.id+'">撤銷</button>';
  } else if(item.status==="ignored"){
    actions += '<button class="btn sm secondary" data-action="inboxUnignore" data-id="'+item.id+'">移回待確認</button>';
  }
  actions += '<button class="btn sm ghost" data-action="inboxDelete" data-id="'+item.id+'">刪除</button></div>';
  return '<div class="list-item">'+body+actions+'</div>';
}
F.inboxItemCard = inboxItemCard;

window.__PAGES.inbox = function(){
  var DB = F.DB;
  var items = F.alive(DB.inbox).sort(function(a,b){return b.createdAt-a.createdAt;});
  var pending = items.filter(function(i){return i.status==="pending";});
  var confirmed = items.filter(function(i){return i.status==="confirmed";});
  var ignored = items.filter(function(i){return i.status==="ignored";});
  var shown = inboxTab==="pending"?pending:inboxTab==="confirmed"?confirmed:ignored;

  var html = '<div class="section-head"><h2>📥 收集箱 '+F.helpBtn("inbox_add")+'</h2>'+
    '<button class="btn" data-action="quickAdd">新增項目</button></div>';
  html += '<div class="tabs">'+
    '<button class="'+(inboxTab==="pending"?"active":"")+'" data-action="setInboxTab" data-tab="pending">待確認 ('+pending.length+')</button>'+
    '<button class="'+(inboxTab==="confirmed"?"active":"")+'" data-action="setInboxTab" data-tab="confirmed">已處理 ('+confirmed.length+')</button>'+
    '<button class="'+(inboxTab==="ignored"?"active":"")+'" data-action="setInboxTab" data-tab="ignored">已忽略 ('+ignored.length+')</button>'+
    '</div>';
  if(!shown.length){
    html += '<div class="empty-state"><div class="e-ico">📭</div><div>這裡目前沒有項目</div>'+
      '<div class="e-next">下一步：點右上「新增項目」，或用手機底部「＋」快速記錄</div></div>';
  } else {
    html += '<div class="list">'+shown.map(function(i){return inboxItemCard(i);}).join("")+'</div>';
  }
  return html;
};
})();
