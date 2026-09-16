/* ===== 我的書單 module ===== */
(function(){
var F = window.__FS;

F.addRecoToList = function(t){
  var idx = +t.getAttribute("data-idx");
  var reco = F.DB.books.recommended[idx];
  if(!reco) return;
  if(F.DB.books.mylist.some(function(b){return b.title===reco.title;})){
    F.toast("已在書單中"); return;
  }
  F.DB.books.mylist.push({id:F.uid(), title:reco.title, category:reco.category||"推薦", status:"想讀", rating:0, progress:0, deletedAt:null});
  F.save(); F.toast("已加入個人書單"); F.render();
};
F.openAddBookModal = function(){
  F.openModal(
    '<div class="modal-title">新增書籍 '+F.helpBtn("books_mylist")+'</div>'+
    '<form id="bookForm"><label class="field">書名<input name="title" required></label>'+
    '<div class="row" style="margin-top:8px"><label class="field">分類<input name="category" placeholder="例如：效率/成長/AI"></label>'+
    '<label class="field">狀態<select name="status"><option>想讀</option><option>進行中</option><option>已完成</option></select></label></div>'+
    '<button class="btn" type="submit" style="width:100%;margin-top:10px">新增</button></form>'
  );
  document.getElementById("bookForm").addEventListener("submit", function(e){
    e.preventDefault();
    var f = e.target;
    F.DB.books.mylist.push({id:F.uid(), title:f.title.value, category:f.category.value||"未分類", status:f.status.value, rating:0, progress: f.status.value==="進行中"?10:0, deletedAt:null});
    F.save(); F.closeModal(); F.render();
  });
};
F.setBookStatus = function(sel){
  var id = sel.getAttribute("data-id");
  var book = F.DB.books.mylist.find(function(x){return x.id===id;});
  if(book){ book.status = sel.value; F.save(); F.render(); }
};
F.setBookRating = function(t){
  var id = t.getAttribute("data-id"), r = +t.getAttribute("data-r");
  var book = F.DB.books.mylist.find(function(x){return x.id===id;});
  if(book){ book.rating = r; F.save(); F.render(); }
};
F.deleteBook = function(t){
  F.softDelete(F.DB.books.mylist, t.getAttribute("data-id"));
  F.save(); F.toast("已刪除"); F.render();
};

window.__PAGE_AFTER.books = function(){
  document.querySelectorAll(".bookStatusSelect").forEach(function(sel){
    sel.onchange = function(){ F.setBookStatus(sel); };
  });
};

window.__PAGES.books = function(){
  var DB = F.DB;
  var reco = DB.books.recommended;
  var pod = DB.books.podcasts;
  var mylist = F.alive(DB.books.mylist);

  var html = '<div class="section-head"><h2>✨ 精選推薦 '+F.helpBtn("books_reco")+'</h2></div>';
  if(!reco.length){
    html += '<div class="empty-state"><div class="e-ico">📖</div><div>暫無推薦資料</div><div class="e-next">下一步：到今日頁「填充演示數據」查看示例推薦</div></div>';
  } else {
    html += '<div class="grid grid-3">'+reco.map(function(r,idx){
      return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:start">'+
        '<div style="font-weight:800">'+F.escapeHtml(r.title)+'</div><span class="pill">匹配 '+r.match+'%</span></div>'+
        '<div style="font-size:12.5px;color:var(--muted);margin:6px 0">'+F.escapeHtml(r.author||"")+' · '+F.escapeHtml(r.category||"")+'</div>'+
        '<div class="row">'+(r.doubanUrl?'<a href="'+r.doubanUrl+'" target="_blank" rel="noopener" class="btn sm secondary" style="text-align:center">豆瓣 ↗</a>':'<span></span>')+
        '<button class="btn sm" data-action="addRecoToList" data-idx="'+idx+'">加入書單</button></div></div>';
    }).join("")+'</div>';
  }

  html += '<div class="section-head" style="margin-top:22px"><h2>🎧 播客推薦</h2></div>';
  if(!pod.length){
    html += '<div class="empty-state"><div class="e-ico">🎧</div><div>暫無播客推薦</div></div>';
  } else {
    html += '<div class="grid grid-3">'+pod.map(function(p){
      return '<div class="card"><div style="font-weight:800">'+F.escapeHtml(p.title)+'</div>'+
        '<div style="font-size:12.5px;color:var(--muted);margin:6px 0">主持：'+F.escapeHtml(p.host)+'</div>'+
        (p.link?'<a href="'+p.link+'" target="_blank" rel="noopener" class="btn sm secondary">收聽 ↗</a>':'')+'</div>';
    }).join("")+'</div>';
  }

  html += '<div class="section-head" style="margin-top:22px"><h2>📚 個人書單 '+F.helpBtn("books_mylist")+'</h2><button class="btn" data-action="openAddBookModal">新增書籍</button></div>';
  if(!mylist.length){
    html += '<div class="empty-state"><div class="e-ico">📗</div><div>個人書單是空的</div><div class="e-next">下一步：從上方推薦加入，或手動新增書籍</div></div>';
  } else {
    html += '<div class="list">'+mylist.map(function(b){
      return '<div class="list-item"><div class="li-body"><div class="li-title">'+F.escapeHtml(b.title)+'</div>'+
        '<div class="li-meta"><span class="tag">'+F.escapeHtml(b.category)+'</span>'+
        [1,2,3,4,5].map(function(r){return '<span data-action="setBookRating" data-id="'+b.id+'" data-r="'+r+'" style="cursor:pointer;color:'+(b.rating>=r?"var(--accent)":"#ddd")+'">★</span>';}).join("")+
        (b.status==="進行中"?'<span class="pill warn">進度 '+(b.progress||0)+'%</span>':'')+
        '</div></div>'+
        '<select class="bookStatusSelect" data-id="'+b.id+'" style="width:auto;padding:4px 8px;font-size:12px"><option '+(b.status==="想讀"?"selected":"")+'>想讀</option><option '+(b.status==="進行中"?"selected":"")+'>進行中</option><option '+(b.status==="已完成"?"selected":"")+'>已完成</option></select>'+
        '<button class="btn sm ghost" data-action="deleteBook" data-id="'+b.id+'">刪除</button></div>';
    }).join("")+'</div>';
  }
  return html;
};
})();
