/* ===== 自媒體運營 module ===== */
(function(){
var F = window.__FS;
var STAGES = [
  {key:"idea", label:"Idea"}, {key:"topic", label:"選題"}, {key:"script", label:"腳本"},
  {key:"shoot", label:"拍攝"}, {key:"edit", label:"剪輯"}, {key:"pending", label:"待發佈"}, {key:"published", label:"已發佈"}
];

F.openAddIdeaModal = function(){
  F.openModal(
    '<div class="modal-title">新增 Idea '+F.helpBtn("media_pipeline")+'</div>'+
    '<form id="ideaForm"><label class="field">標題<input name="title" required placeholder="例如：雅思寫作評分秘訣"></label>'+
    '<button class="btn" type="submit" style="width:100%;margin-top:10px">新增</button></form>'
  );
  document.getElementById("ideaForm").addEventListener("submit", function(e){
    e.preventDefault();
    F.DB.content.pipeline.push({id:F.uid(), title:e.target.title.value, stage:"idea", updatedAt:Date.now(), notes:"", deletedAt:null});
    F.save(); F.closeModal(); F.toast("已新增 Idea"); F.render();
  });
};
F.deleteContentItem = function(t){
  F.softDelete(F.DB.content.pipeline, t.getAttribute("data-id"));
  F.save(); F.toast("已刪除"); F.render();
};
F.addFromTrending = function(t){
  var idx = +t.getAttribute("data-idx");
  var item = F.DB.content.trending[idx];
  if(!item) return;
  var newId = F.uid();
  F.DB.content.pipeline.push({id:newId, title:item.topic, stage:"idea", updatedAt:Date.now(), notes:"來源：熱榜 #"+item.rank, deletedAt:null});
  F.save(); F.toast("已加入選題流"); F.render();
};

function stageSelect(item){
  var opts = STAGES.map(function(s){return '<option value="'+s.key+'" '+(s.key===item.stage?"selected":"")+'>'+s.label+'</option>';}).join("");
  return '<select data-content-id="'+item.id+'" class="contentStageSelect" style="width:auto;padding:4px 8px;font-size:12px">'+opts+'</select>';
}

window.__PAGE_AFTER.media = function(){
  document.querySelectorAll(".contentStageSelect").forEach(function(sel){
    sel.onchange = function(){
      var id = sel.getAttribute("data-content-id");
      var item = F.DB.content.pipeline.find(function(x){return x.id===id;});
      if(item){ item.stage = sel.value; item.updatedAt = Date.now(); F.save(); F.render(); }
    };
  });
};

window.__PAGES.media = function(){
  var DB = F.DB;
  var pipeline = F.alive(DB.content.pipeline);
  var trending = DB.content.trending;

  var html = '<div class="section-head"><h2>🎬 內容選題流 '+F.helpBtn("media_pipeline")+'</h2><button class="btn" data-action="openAddIdeaModal">新增 Idea</button></div>';
  if(!pipeline.length){
    html += '<div class="empty-state"><div class="e-ico">🎞️</div><div>選題流目前是空的</div><div class="e-next">下一步：新增 Idea，或從下方熱榜加入選題</div></div>';
  } else {
    html += '<div class="kanban">';
    STAGES.forEach(function(s){
      var items = pipeline.filter(function(p){return p.stage===s.key;});
      html += '<div class="kanban-col"><h4>'+s.label+' ('+items.length+')</h4>'+
        items.map(function(it){
          return '<div class="kanban-card"><div style="font-weight:700;margin-bottom:4px">'+F.escapeHtml(it.title)+'</div>'+
            stageSelect(it)+
            '<div style="margin-top:6px">'+F.linkedChips("content",it.id)+'</div>'+
            '<div class="row" style="margin-top:6px"><button class="btn sm ghost" data-action="openLinkPickerBtn" data-type="content" data-id="'+it.id+'">關聯</button>'+
            '<button class="btn sm ghost" data-action="deleteContentItem" data-id="'+it.id+'">刪除</button></div></div>';
        }).join("")+
        '</div>';
    });
    html += '</div>';
  }

  html += '<div class="section" style="margin-top:22px">';
  html += '<div class="section-head"><h2>🔥 近 7 天賽道熱榜 '+F.helpBtn("media_trending")+'</h2></div>';
  if(!trending.length){
    html += '<div class="empty-state"><div class="e-ico">📊</div><div>目前沒有熱榜資料</div><div class="e-next">下一步：到今日頁點「填充演示數據」即可看到示例熱榜</div></div>';
  } else {
    html += '<div class="list">'+trending.map(function(item,idx){
      return '<div class="list-item"><div class="li-body"><div class="li-title">#'+item.rank+' '+F.escapeHtml(item.topic)+'</div>'+
        '<div class="li-meta"><span class="pill">熱度 '+item.heat+'</span><span class="pill muted">互動 '+item.engagement+'</span>'+
        (item.link?'<a href="'+item.link+'" target="_blank" rel="noopener">外部連結 ↗</a>':'')+'</div></div>'+
        '<button class="btn sm" data-action="addFromTrending" data-idx="'+idx+'">加入選題</button></div>';
    }).join("")+'</div>';
  }
  html += '</div>';
  return html;
};
})();
