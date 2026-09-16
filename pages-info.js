/* ===== 信息管理 module ===== */
(function(){
var F = window.__FS;
var expanded = {};

F.toggleNewsExpand = function(t){
  var id = t.getAttribute("data-id");
  expanded[id] = !expanded[id];
  F.render();
};
F.toggleNewsSaved = function(t){
  var group = t.getAttribute("data-group"), id = t.getAttribute("data-id");
  var item = F.DB.info.news[group].find(function(x){return x.id===id;});
  if(item){ item.saved = !item.saved; F.save(); F.render(); }
};
F.newsToTopicPreview = function(t){
  var group = t.getAttribute("data-group"), id = t.getAttribute("data-id");
  var item = F.DB.info.news[group].find(function(x){return x.id===id;});
  if(!item) return;
  window.__toTopicSource = {kind:"news", group:group, id:id, title:item.title};
  F.openModal(
    '<div class="modal-title">熱點轉選題（預覽） '+F.helpBtn("info_to_topic")+'</div>'+
    '<div class="diff-box"><div class="d-line add">+ 新選題：【選題】'+F.escapeHtml(item.title)+'</div>'+
    '<div class="d-line add">+ 階段：Idea　來源：新聞</div></div>'+
    '<div class="row"><button class="btn secondary" data-action="closeModal" style="flex:1">取消</button>'+
    '<button class="btn" data-action="confirmToTopic" style="flex:1">確認建立選題</button></div>'
  );
};
F.inspireToTopicPreview = function(t){
  var id = t.getAttribute("data-id");
  var item = F.DB.info.inspirations.find(function(x){return x.id===id;});
  if(!item) return;
  window.__toTopicSource = {kind:"inspiration", id:id, title:item.text.slice(0,30)};
  F.openModal(
    '<div class="modal-title">靈感轉選題（預覽） '+F.helpBtn("info_to_topic")+'</div>'+
    '<div class="diff-box"><div class="d-line add">+ 新選題：【選題】'+F.escapeHtml(item.text.slice(0,30))+'</div>'+
    '<div class="d-line add">+ 階段：Idea　來源：靈感摘錄</div></div>'+
    '<div class="row"><button class="btn secondary" data-action="closeModal" style="flex:1">取消</button>'+
    '<button class="btn" data-action="confirmToTopic" style="flex:1">確認建立選題</button></div>'
  );
};
F.confirmToTopic = function(){
  var src = window.__toTopicSource;
  if(!src) return;
  var newId = F.uid();
  F.DB.content.pipeline.push({id:newId, title:"【選題】"+src.title, stage:"idea", updatedAt:Date.now(), notes:"來源："+(src.kind==="news"?"新聞":"靈感"), deletedAt:null});
  if(src.kind==="inspiration"){
    F.DB.links.push({id:F.uid(), a:{type:"content", id:newId}, b:{type:"inspiration", id:src.id}});
  }
  window.__toTopicSource = null;
  F.save(); F.closeModal(); F.toast("已建立選題，可到自媒體運營查看"); F.render();
};
F.addInspiration = function(){
  F.openModal(
    '<div class="modal-title">新增靈感摘錄 '+F.helpBtn("info_inspire")+'</div>'+
    '<form id="inspForm"><textarea name="text" rows="3" required placeholder="輸入靈感或摘要…"></textarea>'+
    '<button class="btn" type="submit" style="width:100%;margin-top:10px">新增</button></form>'
  );
  document.getElementById("inspForm").addEventListener("submit", function(e){
    e.preventDefault();
    F.DB.info.inspirations.push({id:F.uid(), text:e.target.text.value, starred:false, tags:[], createdAt:Date.now(), deletedAt:null});
    F.save(); F.closeModal(); F.render();
  });
};
F.toggleInspireStar = function(t){
  var id = t.getAttribute("data-id");
  var item = F.DB.info.inspirations.find(function(x){return x.id===id;});
  if(item){ item.starred = !item.starred; F.save(); F.render(); }
};
F.deleteInspiration = function(t){
  F.softDelete(F.DB.info.inspirations, t.getAttribute("data-id"));
  F.save(); F.toast("已刪除"); F.render();
};

function newsGroupHtml(groupKey, label){
  var list = F.DB.info.news[groupKey];
  if(!list.length){
    return '<div class="card section"><div class="card-title">'+label+'</div>'+
      '<div class="empty-state"><div class="e-ico">📰</div><div>目前沒有'+label+'新聞</div><div class="e-next">下一步：到今日頁「填充演示數據」查看示例</div></div></div>';
  }
  return '<div class="card section"><div class="card-title">'+label+'</div><div class="list">'+
    list.map(function(n){
      return '<div class="list-item"><div class="li-body">'+
        '<div class="li-title" style="cursor:pointer" data-action="toggleNewsExpand" data-id="'+n.id+'">'+F.escapeHtml(n.title)+'</div>'+
        (expanded[n.id]?'<div class="li-meta" style="margin-top:6px;line-height:1.6">'+F.escapeHtml(n.summary)+'</div>':'')+
        '<div class="li-meta" style="margin-top:6px">'+
        '<a href="'+(n.url||"#")+'" target="_blank" rel="noopener">閱讀原文 ↗</a>'+
        '</div></div>'+
        '<div class="li-actions">'+
        '<button class="btn sm ghost" data-action="toggleNewsSaved" data-group="'+groupKey+'" data-id="'+n.id+'">'+(n.saved?"★ 已收藏":"☆ 收藏")+'</button>'+
        '<button class="btn sm secondary" data-action="newsToTopicPreview" data-group="'+groupKey+'" data-id="'+n.id+'">轉選題</button>'+
        '</div></div>';
    }).join("")+'</div></div>';
}

window.__PAGES.info = function(){
  var DB = F.DB;
  var html = newsGroupHtml("domestic","🇹🇼 國內新聞")+newsGroupHtml("intl","🌍 國際新聞")+newsGroupHtml("ai","🤖 AI 新聞");
  var insp = F.alive(DB.info.inspirations).sort(function(a,b){return b.createdAt-a.createdAt;});
  html += '<div class="section-head"><h2>💡 靈感摘錄 '+F.helpBtn("info_inspire")+'</h2><button class="btn" data-action="addInspiration">新增靈感</button></div>';
  if(!insp.length){
    html += '<div class="empty-state"><div class="e-ico">💭</div><div>還沒有靈感摘錄</div><div class="e-next">下一步：點「新增靈感」記下一句話</div></div>';
  } else {
    html += '<div class="list">'+insp.map(function(i){
      return '<div class="list-item"><div class="li-body"><div class="li-title">'+F.escapeHtml(i.text)+'</div>'+
        F.linkedChips("inspiration",i.id)+'</div>'+
        '<div class="li-actions"><button class="btn sm ghost" data-action="toggleInspireStar" data-id="'+i.id+'">'+(i.starred?"★":"☆")+'</button>'+
        '<button class="btn sm secondary" data-action="inspireToTopicPreview" data-id="'+i.id+'">轉選題</button>'+
        '<button class="btn sm ghost" data-action="openLinkPickerBtn" data-type="inspiration" data-id="'+i.id+'">關聯</button>'+
        '<button class="btn sm ghost" data-action="deleteInspiration" data-id="'+i.id+'">刪除</button></div></div>';
    }).join("")+'</div>';
  }
  return html;
};
})();
