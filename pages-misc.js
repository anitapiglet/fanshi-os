/* ===== 搜索 / AI 幫手 / 設置 modules ===== */
(function(){
var F = window.__FS;
var searchQuery = "";

/* ---------- search ---------- */
F.runSearch = function(){
  searchQuery = document.getElementById("searchInput").value;
  F.render();
};
window.__PAGE_AFTER.search = function(){
  var input = document.getElementById("searchInput");
  if(input){
    input.value = searchQuery;
    input.focus();
    input.addEventListener("keydown", function(e){ if(e.key==="Enter") F.runSearch(); });
  }
};
window.__PAGES.search = function(){
  var idx = F.buildSearchIndex();
  var q = searchQuery.trim().toLowerCase();
  var results = q ? idx.filter(function(i){ return (i.label+" "+i.snippet+" "+i.type).toLowerCase().indexOf(q)>-1; }) : [];
  var html = '<div class="section-head"><h2>🔍 跨模塊搜尋 '+F.helpBtn("search_global")+'</h2></div>';
  html += '<div class="search-box" style="max-width:none;margin-bottom:14px"><span>🔍</span><input id="searchInput" placeholder="搜尋任務／內容／靈感／書摘／資料／收集箱…"></div>'+
    '<button class="btn secondary sm" data-action="runSearch" style="margin-bottom:14px">搜尋</button>';
  if(!q){
    html += '<div class="empty-state"><div class="e-ico">🔍</div><div>輸入關鍵字開始搜尋</div><div class="e-next">會同時比對：任務／內容選題／靈感／書單／工作客戶／收集箱</div></div>';
  } else if(!results.length){
    html += '<div class="empty-state"><div class="e-ico">🕸️</div><div>找不到符合「'+F.escapeHtml(searchQuery)+'」的結果</div><div class="e-next">試試更短的關鍵字，或確認資料是否在垃圾桶</div></div>';
  } else {
    html += '<div class="list">'+results.map(function(r){
      return '<div class="list-item" data-action="nav" data-route="'+r.route+'" style="cursor:pointer">'+
        '<div class="li-body"><div class="li-title">'+r.icon+' '+F.escapeHtml(r.label)+'</div><div class="li-meta"><span class="pill">'+r.type+'</span>'+F.escapeHtml(r.snippet||"")+'</div></div></div>';
    }).join("")+'</div>';
  }
  return html;
};

/* ---------- AI 幫手 ---------- */
window.__PAGES.ai = function(){
  var html = '<div class="section-head"><h2>✨ AI 幫手 '+F.helpBtn("ai_helper")+'</h2></div>';
  html += '<div class="card" style="margin-bottom:16px;background:#eef2ec">本頁所有 AI 皆為<b>本地規則模擬</b>（確定性假資料），不會連線任何真實外部 AI 服務，不產生任何雲端費用。重要建議一律先預覽、後確認。</div>';
  html += '<div class="grid grid-3">';
  var cards = [
    {ico:"📥", t:"收集箱去向建議", d:"新增收集箱項目時自動給出建議模塊與理由", route:"inbox"},
    {ico:"💪", t:"AI 生成每日跟練", d:"依養生階段自動排訓練清單，經期自動降載", route:"life"},
    {ico:"📰", t:"熱點／靈感轉選題", d:"把新聞或靈感一鍵轉為自媒體選題（預覽後確認）", route:"info"},
    {ico:"🔥", t:"賽道熱榜建議", d:"近7天熱門話題排名，一鍵加入選題流", route:"media"},
    {ico:"📚", t:"書單興趣匹配", d:"依 AI／成長／效率興趣給出匹配度徽標", route:"books"}
  ];
  cards.forEach(function(c){
    html += '<div class="card" style="cursor:pointer" data-action="nav" data-route="'+c.route+'"><div style="font-size:22px">'+c.ico+'</div>'+
      '<div style="font-weight:800;margin:6px 0 4px">'+c.t+'</div><div style="font-size:12.5px;color:var(--muted)">'+c.d+'</div></div>';
  });
  html += '</div>';
  return html;
};

/* ---------- 設置 ---------- */
F.saveProfile = function(e){
  e.preventDefault();
  var f = e.target;
  F.DB.profile.name = f.name.value;
  F.DB.profile.interests = f.interests.value.split(",").map(function(s){return s.trim();}).filter(Boolean);
  F.DB.profile.goals = f.goals.value.split(",").map(function(s){return s.trim();}).filter(Boolean);
  F.save(); F.toast("已更新個人資料"); F.render();
};
F.exportBackup = function(){
  var data = JSON.stringify(F.DB, null, 2);
  var blob = new Blob([data], {type:"application/json"});
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url; a.download = "fanshi-os-backup-"+F.todayStr()+".json";
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  F.DB.settingsUi.lastBackupAt = Date.now(); F.save();
  F.toast("已匯出備份檔");
};
F.triggerImport = function(){ document.getElementById("importFileInput").click(); };
F.handleImportFile = function(input){
  var file = input.files[0];
  if(!file) return;
  var reader = new FileReader();
  reader.onload = function(){
    try{
      var data = JSON.parse(reader.result);
      if(!data || typeof data!=="object" || !("tasks" in data)) throw new Error("格式不符");
      localStorage.setItem("fanshi_os_db_v1", JSON.stringify(data));
      F.toast("匯入成功，重新整理頁面套用");
      setTimeout(function(){ window.location.reload(); }, 900);
    }catch(err){
      F.toast("匯入失敗：檔案格式錯誤，資料未被覆蓋");
    }
  };
  reader.readAsText(file);
};

function trashSection(){
  var DB = F.DB;
  var groups = [
    {label:"任務", arr:DB.tasks, key:"tasks", title:function(x){return x.title;}},
    {label:"收集箱", arr:DB.inbox, key:"inbox", title:function(x){return x.content.slice(0,30);}},
    {label:"內容選題", arr:DB.content.pipeline, key:"content", title:function(x){return x.title;}},
    {label:"靈感摘錄", arr:DB.info.inspirations, key:"insp", title:function(x){return x.text.slice(0,30);}},
    {label:"書單", arr:DB.books.mylist, key:"books", title:function(x){return x.title;}},
    {label:"凡蒔顧問客戶", arr:DB.work.fanshi.clients, key:"fanshi", title:function(x){return x.name;}},
    {label:"知英語客戶", arr:DB.work.zhi.customers, key:"zhi", title:function(x){return x.name;}},
    {label:"Courify任務", arr:DB.work.courify.tasks, key:"courify", title:function(x){return x.title;}},
    {label:"跟練紀錄", arr:DB.life.workouts, key:"workouts", title:function(x){return x.date;}}
  ];
  var rows = "";
  groups.forEach(function(g){
    F.trashed(g.arr).forEach(function(item){
      rows += '<div class="list-item"><div class="li-body"><div class="li-title">'+g.label+'：'+F.escapeHtml(g.title(item))+'</div></div>'+
        '<button class="btn sm secondary" data-action="restoreItem" data-key="'+g.key+'" data-id="'+item.id+'">恢復</button></div>';
    });
  });
  return rows;
}
F.restoreItem = function(t){
  var key = t.getAttribute("data-key"), id = t.getAttribute("data-id");
  var DB = F.DB;
  var map = {tasks:DB.tasks, inbox:DB.inbox, content:DB.content.pipeline, insp:DB.info.inspirations, books:DB.books.mylist,
    fanshi:DB.work.fanshi.clients, zhi:DB.work.zhi.customers, courify:DB.work.courify.tasks, workouts:DB.life.workouts};
  F.restore(map[key], id);
  F.save(); F.toast("已恢復"); F.render();
};

window.__PAGE_AFTER.settings = function(){
  var f = document.getElementById("profileForm");
  if(f) f.addEventListener("submit", F.saveProfile);
};

window.__PAGES.settings = function(){
  var DB = F.DB;
  var p = DB.profile;
  var html = '<div class="section-head"><h2>⚙️ 設置</h2></div>';

  html += '<div class="card section"><div class="card-title">個人資料</div>'+
    '<form id="profileForm"><label class="field">稱呼<input name="name" value="'+F.escapeHtml(p.name)+'"></label>'+
    '<label class="field" style="margin-top:8px">興趣（逗號分隔）<input name="interests" value="'+p.interests.join(",")+'"></label>'+
    '<label class="field" style="margin-top:8px">目標（逗號分隔）<input name="goals" value="'+p.goals.join(",")+'"></label>'+
    '<button class="btn" type="submit" style="width:100%;margin-top:10px">儲存</button></form></div>';

  html += '<div class="card section"><div class="card-title">匯出／匯入備份 '+F.helpBtn("export_backup")+'</div>'+
    '<div style="font-size:12.5px;color:var(--muted);margin-bottom:10px">資料只存在這個瀏覽器的 localStorage，換裝置、清快取或砍應用程式資料前務必先匯出備份。</div>'+
    '<div class="row"><button class="btn secondary" data-action="exportBackup">匯出備份 (.json)</button>'+
    '<button class="btn secondary" data-action="triggerImport">匯入備份</button></div>'+
    '<input type="file" id="importFileInput" accept="application/json" class="hidden" onchange="window.__FS.handleImportFile(this)">'+
    (DB.settingsUi.lastBackupAt?'<div style="font-size:11.5px;color:var(--muted);margin-top:8px">上次匯出：'+new Date(DB.settingsUi.lastBackupAt).toLocaleString()+'</div>':'')+
    '</div>';

  html += '<div class="card section"><div class="card-title">演示資料</div>'+
    '<div class="row"><button class="btn secondary" data-action="fillDemoData">填充演示數據</button>'+
    '<button class="btn secondary" data-action="clearDemoData">清除演示資料</button></div></div>';

  html += '<div class="card section"><div class="card-title">🗑️ 垃圾桶（刪除/恢復）</div>'+
    (function(){ var rows = trashSection(); return rows ? '<div class="list">'+rows+'</div>' : '<div class="empty-state">目前垃圾桶是空的</div>'; })()+
    '</div>';

  html += '<div class="card section"><div class="card-title">使用說明 '+F.helpBtn("settings_guide")+'</div>'+
    '<div style="font-size:13.5px;line-height:1.8">'+
    '<p><b>工作台：</b>凡蒔天地目前是一個純前端網頁應用，電腦與手機打開同一網址，畫面會自動依螢幕寬度切換版面，沒有安裝檔、沒有 App Store 版本。</p>'+
    '<p><b>AI：</b>所有 AI 建議（收集箱去向、每日跟練、熱點轉選題等）都是<b>本地規則模擬</b>，用固定規則產生確定性假資料，<b>沒有連線任何真實外部 AI 服務</b>（如 OpenAI/Claude API），因此也沒有相關的 AI 使用費用。</p>'+
    '<p><b>賬號：</b>目前<b>沒有帳號系統、沒有登入/註冊</b>，資料跟這台瀏覽器綁定，換瀏覽器或換裝置不會自動同步。</p>'+
    '<p><b>資料保存：</b>所有資料儲存在瀏覽器的 <code>localStorage</code>，清除瀏覽器資料、換裝置或使用無痕模式都會導致資料消失或看不到。</p>'+
    '<p><b>導出/備份/恢復：</b>已實現——上方「匯出備份」可下載 JSON 檔，「匯入備份」可還原（會整份覆蓋目前資料，建議先匯出現有資料再匯入）。</p>'+
    '<p><b>遷移：</b>換裝置時，先在舊裝置匯出備份檔，再到新裝置的同一網址用「匯入備份」還原即可。</p>'+
    '<p><b>同步：</b><b>尚未實現</b>——目前不支援多裝置即時同步，兩台裝置各自是獨立的 localStorage。</p>'+
    '<p><b>伺服器／資料庫：</b><b>尚未啟用</b>——目前純前端，沒有後端伺服器、沒有雲端資料庫；程式架構已預留未來接後端 API 的擴充空間。</p>'+
    '<p><b>API：</b><b>尚未啟用</b>——沒有對外或對內的真實 API 呼叫。</p>'+
    '<p><b>費用：</b>目前沒有任何訂閱費、AI 用量費或伺服器費用，純靜態網頁 + GitHub Pages 免費託管。</p>'+
    '</div></div>';

  html += '<div class="card section"><div class="card-title">📋 更新日誌 '+F.helpBtn("settings_changelog")+'</div>'+
    '<div class="list">'+DB.changelog.slice().reverse().map(function(c){
      return '<div class="list-item"><div class="li-body"><div class="li-title">'+c.date+' · v'+c.version+'</div>'+
        '<div class="li-meta" style="margin-top:4px;line-height:1.6">'+F.escapeHtml(c.content)+'</div>'+
        '<div class="li-meta" style="margin-top:4px"><b>影響範圍：</b>'+F.escapeHtml(c.impact)+'</div>'+
        '<div class="li-meta"><b>是否需要操作：</b>'+F.escapeHtml(c.action)+'</div></div></div>';
    }).join("")+'</div></div>';

  return html;
};
})();
