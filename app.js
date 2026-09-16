/* ===================== 凡蒔天地 · app.js =====================
   純前端個人操作系統。所有資料存於 localStorage，無後端/無帳號/無真實外部 AI。
   ============================================================== */
(function(){
"use strict";

var STORE_KEY = "fanshi_os_db_v1";
var APP_VERSION = "1.0.0";
window.__PAGES = window.__PAGES || {};
window.__PAGE_AFTER = window.__PAGE_AFTER || {};
window.__FS = window.__FS || {};

/* ---------------- utils ---------------- */
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function pad(n){ return n<10 ? "0"+n : ""+n; }
function toISODate(d){ return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }
function todayStr(){ return toISODate(new Date()); }
function addDays(dateStr, n){ var d=new Date(dateStr+"T00:00:00"); d.setDate(d.getDate()+n); return toISODate(d); }
function daysBetween(a,b){ return Math.round((new Date(b+"T00:00:00")-new Date(a+"T00:00:00"))/86400000); }
function fmtDate(s){ if(!s) return ""; var p=s.split("-"); return p[1]+"/"+p[2]; }
function weekdayLabel(dateStr){ var wd=["日","一","二","三","四","五","六"]; return "週"+wd[new Date(dateStr+"T00:00:00").getDay()]; }
function escapeHtml(s){ return (s==null?"":String(s)).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }
function startOfWeek(dateStr){ var d=new Date(dateStr+"T00:00:00"); var dow=d.getDay(); var diff=(dow===0?-6:1-dow); d.setDate(d.getDate()+diff); return toISODate(d); }

function toast(msg){
  var el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(function(){ el.classList.remove("show"); }, 2400);
}

/* ---------------- storage ---------------- */
function load(){
  try{
    var raw = localStorage.getItem(STORE_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch(e){ console.error("讀取資料失敗", e); return null; }
}
function save(){
  try{
    localStorage.setItem(STORE_KEY, JSON.stringify(DB));
  }catch(e){
    console.error("儲存失敗", e);
    toast("儲存失敗：瀏覽器儲存空間可能已滿，請到設置匯出備份後清理");
  }
}

/* ---------------- default empty schema ---------------- */
function blankDB(){
  return {
    meta:{ version:APP_VERSION, createdAt: todayStr(), seeded:false },
    profile:{ name:"Anita", interests:["AI","成長","效率"], goals:["健康減脂","穩定輸出內容","提升效率"] },
    tasks:[],
    inbox:[],
    plan:{ calendar:[] },
    life:{
      cycle:{ lastStart:null, cycleLen:28, periodLen:5 },
      weightPlan:null,
      weightLogs:[],
      workouts:[],
      foodLogs:[],
      pendingWorkout:null
    },
    content:{ pipeline:[], trending:[] },
    info:{ news:{domestic:[],intl:[],ai:[]}, inspirations:[] },
    books:{ recommended:[], podcasts:[], mylist:[] },
    work:{ fanshi:{clients:[]}, zhi:{customers:[]}, courify:{tasks:[]} },
    links:[],
    changelog:[
      {date:"2026-09-16", version:"1.0.0", content:"凡蒔天地正式上線：今日總覽、收集箱、每日計劃、生活管理健身、自媒體運營、信息管理、我的書單、工作管理（凡蒔顧問／知英語／Courify）、設置八大模塊；建立跨模塊搜尋與關聯、AI 本地模擬建議（收集箱去向／每日跟練／熱點轉選題）、手機底部導覽與『更多』抽屜。", impact:"全新功能，不影響既有資料（尚無舊版本）。", action:"無需操作；可於今日頁點『填充演示數據』快速體驗。"}
    ],
    settingsUi:{ lastBackupAt:null }
  };
}

var DB = load() || blankDB();
// migrate/ensure fields exist (safe for future schema growth)
(function ensureSchema(){
  var b = blankDB();
  function merge(target, def){
    for(var k in def){
      if(!(k in target)) target[k] = def[k];
    }
  }
  merge(DB, b);
  merge(DB.life, b.life);
  merge(DB.life.cycle, b.life.cycle);
  merge(DB.content, b.content);
  merge(DB.info, b.info);
  merge(DB.info.news, b.info.news);
  merge(DB.books, b.books);
  merge(DB.work, b.work);
  merge(DB.work.fanshi, b.work.fanshi);
  merge(DB.work.zhi, b.work.zhi);
  merge(DB.work.courify, b.work.courify);
  merge(DB.plan, b.plan);
})();
save();

/* ---------------- help content dictionary ---------------- */
var HELP = {
  today_feed:{t:"今日待辦流", w:"只列出「現在要做／待確認／異常／最近可以繼續」四類事項，資料即時取自各真實模塊，不會重複維護。", h:"點卡片可直接跳到來源模塊處理；待確認卡片可直接在此確認或忽略。", r:"完成或確認後，該項會從清單移除，並更新對應模塊的真實狀態。", u:"任務可在來源模塊重新標記未完成；收集箱確認可在收集箱歷史中還原（尚未真正刪除原內容）。", e:"若清單空白，代表目前沒有需要處理的事項，可到各模塊新增任務或使用『填充演示數據』體驗。"},
  fill_demo:{t:"填充演示數據", w:"一次性寫入涵蓋八大模塊的示例任務、內容、客戶與紀錄，方便您在沒有真實資料時體驗完整介面。", h:"點擊後立即套用，不會覆蓋您已輸入的真實資料，只補齊目前是空的部分。", r:"各模塊會出現示例卡片，並標記為演示資料；今日頁會立刻反映新任務。", u:"到設置頁『清除演示資料』可移除所有標記為演示的項目，真實資料不受影響。", e:"若沒有變化，代表模塊已有資料未被視為空，可先手動清空後再試。"},
  gen_mobile_link:{t:"一鍵生成手機訪問地址", w:"凡蒔天地是同一個響應式網址，電腦與手機打開同一連結會自動切換版面，此功能只是把目前網址整理成方便複製、在手機開啟的格式。", h:"點擊後彈出視窗顯示網址與複製按鈕，用手機瀏覽器貼上網址即可開啟手機版介面。", r:"不會產生新網址，也不會建立雲端連結；純粹是同一網址的複製小工具。", u:"無需撤銷，關閉視窗即可。", e:"若手機打開後版面沒有變成手機版，請確認瀏覽器視窗寬度或重新整理頁面。"},
  inbox_add:{t:"收集箱：新增項目", w:"接收暫時不知道放哪裡的文字、連結、圖片說明或臨時任務，不用馬上決定歸類。", h:"選擇類型並輸入內容後送出；系統會給出 AI 建議去向（本地模擬，非真實外部 AI）。", r:"項目會出現在收集箱『待確認』列表，附上建議模塊與理由，等您確認後才會真正移動。", u:"送出後可直接刪除該項目；已確認移動的項目可在對應模塊刪除或於收集箱歷史還原。", e:"若內容送出後沒出現，請確認輸入框不是空白；圖片與檔案僅記錄檔名/描述，不會真正上傳儲存。"},
  inbox_confirm:{t:"確認 AI 建議去向", w:"AI 只會『建議』收集箱項目該歸到哪個模塊，例如任務、內容選題、靈感或工作客戶，實際搬移一定要您手動確認。", h:"點『確認移動』會照建議搬到該模塊；點『改為其他』可手動選擇模塊；點『忽略』則保留在收集箱不處理。", r:"確認後項目會在目的模塊出現為新資料，並在收集箱標記為『已處理』。", u:"到收集箱『已處理』分頁可以撤銷，項目會移回待確認並從目的模塊移除。", e:"若目的模塊選項找不到想要的分類，可先『忽略』，之後在該模塊手動新增再刪除收集箱項目。"},
  plan_task:{t:"每日計劃：任務", w:"管理有明確日期時間的待辦事項，可標分類、優先級與標籤。", h:"點『新增任務』填寫標題/日期/時間/分類/優先級/標籤；點勾選圈標記完成；點刪除移入垃圾桶。", r:"完成的任務會顯示於『已完成』篩選，並影響今日頁的任務進度環。", u:"垃圾桶內項目 7 天內可在『已刪除』篩選中按『恢復』還原。", e:"若任務列表空白，先確認篩選條件（今日/明日/本週/已完成/全部）是否符合，或新增一筆任務。"},
  plan_calendar:{t:"博主更新日曆", w:"以週視圖追蹤內容產出五個階段（腳本/拍攝/剪輯/發佈/復盤）的每日進度。", h:"點日曆格子可勾選當天完成狀態；用上/本/下週切換；『新增更新計劃』可安排某天的階段任務。", r:"勾選後該格會標記完成色，並計入整體進度百分比。", u:"再點一次格子可取消勾選；刪除計劃項目可在格內選單移除。", e:"若某天沒有任何色塊，代表當週還沒安排該階段的計劃，可用新增功能補上。"},
  life_cycle:{t:"經期參數與養生階段", w:"依照您輸入的最近一次經期開始日、週期長度與經期長度，自動換算目前處於月經期／卵泡期／排卵期／黃體期，並給出對應養生建議。", h:"在設定區更新『最近經期開始日』『週期天數』『經期天數』，儲存後立即重新計算階段。", r:"今日頁與健身頁的階段卡會同步更新，AI 生成跟練也會依階段自動降載或加量。", u:"可隨時修改參數重新計算，不影響歷史紀錄。", e:"若階段顯示不合理，請確認開始日期沒有選到未來日期。"},
  life_ai_workout:{t:"AI 生成每日跟練", w:"依當前養生階段自動生成一份訓練清單（本地規則模擬，非真實外部 AI），經期會自動降低強度。", h:"點『AI 生成今日跟練』會先顯示預覽與調整原因，確認套用後才會寫入今日訓練。", r:"套用後可逐組打卡（次數/重量），完成後自動依動作與時長估算消耗，計入體重趨勢。", u:"套用前可直接取消預覽；已套用的訓練可在列表中刪除整筆重來。", e:"若怎麼生成都是同一份內容，代表尚未設定經期參數，系統使用預設中等強度。"},
  life_weight_plan:{t:"體重管理計劃", w:"依身高體重估算 BMR（基礎代謝）與 TDEE（每日消耗），設定目標熱量缺口並提醒安全下限。", h:"填入身高/目前體重/目標體重與活動係數，系統算出建議每日攝取區間。", r:"下方『每日能量總結』會拿今天攝取（食物記錄）與消耗（運動+基礎代謝）比對此計劃。", u:"修改任一數值即重新計算，不影響過去的體重紀錄。", e:"若缺口超過安全上限，系統會標紅提醒，建議調整目標或延長期程。"},
  life_food:{t:"食物熱量記錄", w:"記錄當天吃了什麼與估計熱量，用於今日能量總結。", h:"輸入食物名稱與熱量後新增；可隨時刪除單筆紀錄。", r:"總攝取會即時加總，並與消耗、缺口一起顯示在能量總結卡。", u:"刪除紀錄立即從總和移除，無需額外確認。", e:"若熱量欄留空，系統會提示需要輸入數字才能加總。"},
  media_pipeline:{t:"內容選題流", w:"追蹤每個內容從 Idea 到已發佈的七個階段，避免點子散落各處。", h:"用下拉選單切換階段；點『新增 Idea』建立新的一筆；可對每筆做關聯（連結任務、靈感或熱點來源）。", r:"切換到『已發佈』會記錄完成時間，並計入自媒體整體產出統計。", u:"可隨時把階段切回前一步；刪除項目移入垃圾桶，30天內可還原。", e:"若拖曳或切換沒反應，改用下拉選單操作（本版以下拉取代拖曳以確保手機可用）。"},
  media_trending:{t:"近 7 天賽道熱榜", w:"模擬同賽道近 7 天的熱門話題排名、熱度與互動量，作為選題靈感（本地模擬數據，非即時外部數據）。", h:"點『加入選題』會把該熱榜項目建立成一筆新的 Idea，進入內容選題流。", r:"新選題會出現在選題流『Idea』欄，並自動關聯回熱榜來源。", u:"加入後可在選題流中直接刪除該筆，不影響熱榜本身。", e:"熱度與互動量為固定示例數值，僅供排序參考，不代表真實平台數據。"},
  info_news:{t:"新聞：國內／國際／AI", w:"分三組整理示例新聞，可展開摘要、開啟原文連結、收藏重要項目。", h:"點標題展開/收合摘要；點『閱讀原文』開新頁；點星號收藏。", r:"收藏的新聞會集中顯示，方便之後回顧或轉為選題。", u:"再點一次星號可取消收藏。", e:"若『閱讀原文』連結失效，代表示例資料的連結僅供示意，非真實時效性新聞。"},
  info_to_topic:{t:"熱點轉選題", w:"把一則新聞或靈感快速轉成自媒體選題流裡的 Idea，並保留原始出處關聯。", h:"點『轉為選題』會先顯示將建立的內容預覽，確認後才真正加入選題流。", r:"選題流會新增一筆 Idea，並附上『來源：新聞/靈感』的關聯標籤，可點擊回溯。", u:"若不需要，可在選題流中把該筆刪除，不影響原新聞或靈感。", e:"若預覽內容不理想，可先取消，回到新聞/靈感頁編輯後再轉。"},
  info_inspire:{t:"靈感摘錄", w:"隨手記錄靈感句子或摘要，可加星標記重要程度。", h:"輸入文字後新增；點星號切換是否標星；可對靈感做跨模塊關聯。", r:"標星的靈感會在搜尋與今日頁更容易被找到。", u:"刪除後 30 天內可於垃圾桶還原。", e:"若清單看起來重複，可用搜尋確認是否已有相同內容再新增。"},
  books_reco:{t:"精選推薦", w:"依您設定的興趣（AI／成長／效率）比對書單資料，顯示匹配度徽標。", h:"點『加入書單』會把推薦書加入下方『個人書單』，並可點外部連結到豆瓣查看詳情。", r:"加入後可在個人書單設定分類/狀態/評分。", u:"個人書單中可直接刪除該筆，不影響原推薦清單。", e:"若都是同一個匹配度，代表興趣設定尚未細分，可到設置調整興趣關鍵字。"},
  books_mylist:{t:"個人書單", w:"管理您實際在讀/想讀/讀完的書籍與播客，可分類與評分。", h:"新增時填標題/分類/狀態；讀完後可補上星級評分與進度。", r:"『進行中』且有進度的書會顯示在今日頁『學習進度』卡。", u:"刪除後可在垃圾桶找回。", e:"若學習進度卡一直空白，代表尚無狀態為『進行中』且有進度值的書籍。"},
  work_fanshi:{t:"凡蒔顧問業務", w:"追蹤凡蒔顧問（網站架設／顧問外包／健身纖體）的客戶與案件進度。", h:"新增客戶時填名稱/業務類型/階段/下一步；用下拉切換階段。", r:"階段變化會反映在工作管理總覽與今日『異常/待確認』判斷（例如太久沒更新會被標記停滯）。", u:"刪除的客戶紀錄可在垃圾桶還原。", e:"若同一客戶出現在多個業務類型，建議分開建立多筆，避免階段互相干擾。"},
  work_zhi:{t:"知英語銷售顧問", w:"沿用原本『諮詢體驗小日記』的客戶追蹤邏輯（名單→已預約→已體驗→已成交/流失），介面改為凡蒔天地墨綠風格並整合進工作管理。", h:"新增客戶填來源/姓名/備註；用階段下拉更新目前進度；『最後聯繫』會自動記錄操作時間。", r:"停滯超過設定天數未更新的客戶會出現在今日『異常』；已預約但尚未體驗的會出現在『最近可以繼續』。", u:"刪除的客戶可在垃圾桶還原；階段可隨時改回前一步。", e:"若客戶清單是空的，這是全新模塊尚未匯入舊資料，可先用『新增客戶』手動建立或用示例資料體驗。"},
  work_courify:{t:"Courify 行銷", w:"目前是全新的空模塊，用於之後累積 Courify 相關的客戶、任務與內容，尚未有任何真實資料匯入。", h:"點『新增任務』開始記錄；結構與凡蒔顧問業務類似，方便之後擴充。", r:"新增後即成為工作管理下的真實資料，可被搜尋與關聯。", u:"刪除任務可在垃圾桶還原。", e:"若您預期這裡應該有舊資料，這是正確的——Courify 目前刻意保持空白，等您之後補充。"},
  search_global:{t:"跨模塊搜尋", w:"同時比對任務、內容選題、靈感、書單、工作客戶與收集箱裡的文字，不用記得東西存在哪個模塊。", h:"輸入關鍵字後按 Enter 或點搜尋圖示；點結果直接跳到來源模塊定位該項目。", r:"不會修改任何資料，純粹是查找定位。", u:"無需撤銷。", e:"若找不到，嘗試更短的關鍵字，或確認資料是否被刪除到垃圾桶。"},
  link_item:{t:"關聯項目", w:"把兩個不同模塊的項目連起來，例如把一則靈感連到一個內容選題，或把一個任務連到一個工作客戶。", h:"點『關聯』開啟選擇視窗，搜尋要連結的項目後點選即可建立。", r:"雙方項目下方都會出現可點擊的關聯標籤，點擊會跳到對方位置。", u:"點關聯標籤旁的『解除』可移除這條連結，不影響兩邊原始資料。", e:"若找不到要連的項目，代表它可能在垃圾桶中，需先還原才能建立關聯。"},
  ai_helper:{t:"AI 幫手", w:"這裡列出目前所有 AI 輔助功能的入口與說明。所有 AI 皆為本地規則模擬（確定性假資料），不會連線到真實外部 AI 服務，也不會有任何雲端費用。", h:"點各卡片會跳到對應模塊並觸發該項 AI 建議流程；每次重要建議都會先預覽再讓您確認。", r:"不使用時完全不影響資料；使用時遵循『先預覽、後確認』原則。", u:"任何 AI 套用前都可在預覽視窗取消。", e:"若覺得建議內容不合理，屬正常現象——這是規則模擬而非真正理解語意的 AI，僅供草稿參考。"},
  settings_guide:{t:"使用說明", w:"完整說明凡蒔天地目前的能力邊界：AI、帳號、資料保存、備份/還原、遷移、同步、伺服器、資料庫、API 與費用。", h:"往下捲動閱讀各段落；匯出/匯入按鈕可直接操作備份。", r:"僅為說明文字，閱讀不會改變任何資料。", u:"無需撤銷。", e:"若說明與實際功能有出入，請以本頁最新內容為準，並可回報讓我們更新。"},
  settings_changelog:{t:"更新日誌", w:"記錄凡蒔天地每次更新的日期、內容、影響範圍，以及您是否需要採取行動。", h:"由新到舊往下閱讀即可，無需操作。", r:"純資訊展示。", u:"無需撤銷。", e:"若某次更新標記『需要操作』卻不確定怎麼做，可對照該筆『影響範圍』說明處理。"},
  export_backup:{t:"匯出／匯入備份", w:"把目前所有資料輸出成一個 JSON 檔案，或用檔案還原資料，因為資料只存在這台瀏覽器的 localStorage，換裝置或清瀏覽器快取前務必先備份。", h:"點『匯出備份』下載檔案；點『匯入備份』選擇先前下載的檔案還原。", r:"匯出不影響現有資料；匯入會整份覆蓋目前資料。", u:"匯入前務必先匯出目前資料另存，才能在誤匯入時復原。", e:"若匯入後畫面異常，請重新整理頁面；若檔案格式錯誤會顯示錯誤提示並不會套用。"}
};
function helpDot(key){
  var h = HELP[key];
  if(!h) return "";
  var tip = h.w;
  return '<span class="help-dot" data-help-key="'+key+'">?'+
    '<span class="help-tip">'+escapeHtml(tip)+'</span></span>';
}

/* ---------------- modal & drawer ---------------- */
function openModal(innerHtml, opts){
  opts = opts||{};
  var overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "modalOverlay";
  overlay.innerHTML = '<div class="modal-box '+(opts.wide?'wide':'')+'">'+
    '<button class="modal-close" data-action="closeModal">✕</button>'+innerHtml+'</div>';
  overlay.addEventListener("mousedown", function(e){ if(e.target===overlay) closeModal(); });
  document.body.appendChild(overlay);
}
function closeModal(){
  var o = document.getElementById("modalOverlay");
  if(o) o.remove();
}
function openHelpModal(key){
  var h = HELP[key];
  if(!h) return;
  openModal(
    '<div class="modal-title">'+escapeHtml(h.t)+'</div>'+
    '<div class="modal-sub">功能說明</div>'+
    '<div class="list">'+
      '<div><b>做什麼：</b>'+escapeHtml(h.w)+'</div>'+
      '<div><b>怎麼操作：</b>'+escapeHtml(h.h)+'</div>'+
      '<div><b>完成後：</b>'+escapeHtml(h.r)+'</div>'+
      '<div><b>如何撤銷：</b>'+escapeHtml(h.u)+'</div>'+
      '<div><b>出錯怎麼辦：</b>'+escapeHtml(h.e)+'</div>'+
    '</div>'
  );
}
function closeDrawer(){
  var o = document.getElementById("drawerOverlay");
  if(o) o.remove();
}

/* ---------------- soft delete helpers ---------------- */
function softDelete(arr, id){ var it=arr.find(function(x){return x.id===id;}); if(it){ it.deletedAt = Date.now(); } }
function restore(arr, id){ var it=arr.find(function(x){return x.id===id;}); if(it){ it.deletedAt = null; } }
function alive(arr){ return (arr||[]).filter(function(x){ return !x.deletedAt; }); }
function trashed(arr){ return (arr||[]).filter(function(x){ return !!x.deletedAt; }); }

/* ---------------- cycle / life computations ---------------- */
var PHASES = [
  {key:"period", name:"月經期", color:"#c2685a", tip:"以溫和活動與保暖為主，訓練強度自動降低，多補鐵質與水分。"},
  {key:"follicular", name:"卵泡期", color:"#5c8577", tip:"精力回升，適合安排強度較高的訓練與重要工作排程。"},
  {key:"ovulation", name:"排卵期", color:"#b98b73", tip:"體感狀態最佳，可安排高強度訓練或重要會議/直播。"},
  {key:"luteal", name:"黃體期", color:"#8a5b1c", tip:"情緒與食慾可能波動，訓練維持中等強度，注意睡眠與飲食穩定。"}
];
function currentPhase(){
  var c = DB.life.cycle;
  if(!c.lastStart) return null;
  var diff = daysBetween(c.lastStart, todayStr());
  var day = ((diff % c.cycleLen) + c.cycleLen) % c.cycleLen; // 0-indexed day within cycle
  var ovuDay = c.cycleLen - 14; // approx ovulation day index
  if(day < c.periodLen) return PHASES[0];
  if(day < ovuDay - 1) return PHASES[1];
  if(day <= ovuDay + 1) return PHASES[2];
  return PHASES[3];
}

function computeBmrTdee(wp){
  if(!wp) return null;
  // Mifflin-St Jeor (female)
  var bmr = 10*wp.weight + 6.25*wp.height - 5*wp.age - 161;
  var tdee = bmr * wp.activity;
  return {bmr:Math.round(bmr), tdee:Math.round(tdee)};
}

/* ---------------- AI mock services (deterministic, local only) ---------------- */
function aiSuggestInboxDestination(item){
  var text = (item.content||"").toLowerCase();
  if(item.type==="link" || /http/.test(text)) return {module:"info", label:"信息管理 · 靈感摘錄", reason:"內容含連結，多半是要收藏的參考資料，建議放進信息管理的靈感摘錄。"};
  if(/雅思|知英語|學生|報名|課程/.test(text)) return {module:"work_zhi", label:"工作管理 · 知英語銷售顧問", reason:"提到雅思/學生/報名等關鍵字，判斷跟知英語客戶相關。"};
  if(/客戶|網站|報價|外包|合約|courify/.test(text)) return {module:"work_fanshi", label:"工作管理 · 凡蒔顧問業務", reason:"提到客戶/網站/報價等字眼，判斷跟凡蒔顧問業務相關。"};
  if(/選題|腳本|拍攝|剪輯|標題|影片/.test(text)) return {module:"content", label:"自媒體運營 · 選題流", reason:"內容像是內容創作靈感，建議加入自媒體選題流的 Idea 欄。"};
  if(/書|podcast|播客/.test(text)) return {module:"books", label:"我的書單", reason:"提到書籍/播客相關字眼。"};
  if(item.type==="task" || /提醒|記得|要做|截止/.test(text)) return {module:"task", label:"每日計劃 · 任務", reason:"內容像是一件待辦事項，建議轉成有日期的任務。"};
  return {module:"info", label:"信息管理 · 靈感摘錄", reason:"無明顯關鍵字，先歸類到靈感摘錄，之後可再手動調整。"};
}
function aiGenerateWorkout(phase){
  var base = [
    {name:"深蹲", sets:4, reps:12, weight:20},
    {name:"啞鈴臥推", sets:4, reps:10, weight:12},
    {name:"單腳硬舉", sets:3, reps:12, weight:14},
    {name:"平板核心", sets:3, reps:45, weight:0},
    {name:"滑輪下拉", sets:3, reps:12, weight:18}
  ];
  var factor = 1, note = "常規強度（依卵泡/排卵期估算）";
  if(phase && phase.key==="period"){ factor=0.55; note="經期自動降載：組數與重量下修約 45%，改以低衝擊動作為主"; }
  else if(phase && phase.key==="luteal"){ factor=0.8; note="黃體期微降載：強度下修約 20%，維持穩定訓練頻率"; }
  else if(phase && phase.key==="ovulation"){ factor=1.1; note="排卵期狀態佳：強度略上修 10%"; }
  var list = base.map(function(ex){
    return {name:ex.name, sets:Math.max(2,Math.round(ex.sets*factor)), reps:ex.reps, weight:Math.round(ex.weight*factor), done:false, actualReps:null, actualWeight:null};
  });
  return {exercises:list, note:note, estCalories:Math.round(220*factor)};
}
function aiTopicFromSource(sourceLabel, text){
  return { title: "【選題】"+text.slice(0,24), stage:"idea", sourceNote:sourceLabel };
}

/* ---------------- search index ---------------- */
function buildSearchIndex(){
  var idx = [];
  alive(DB.tasks).forEach(function(t){ idx.push({type:"任務", route:"plan", id:t.id, label:t.title, snippet:(t.date||"")+" "+(t.category||""), icon:"📌"}); });
  alive(DB.content.pipeline).forEach(function(c){ idx.push({type:"內容選題", route:"media", id:c.id, label:c.title, snippet:stageLabel(c.stage), icon:"🎬"}); });
  alive(DB.info.inspirations).forEach(function(i){ idx.push({type:"靈感", route:"info", id:i.id, label:i.text.slice(0,30), snippet:i.starred?"已標星":"", icon:"💡"}); });
  alive(DB.books.mylist).forEach(function(b){ idx.push({type:"書單", route:"books", id:b.id, label:b.title, snippet:b.status, icon:"📚"}); });
  alive(DB.work.fanshi.clients).forEach(function(c){ idx.push({type:"凡蒔顧問客戶", route:"work", id:c.id, label:c.name, snippet:c.stage, icon:"🧭"}); });
  alive(DB.work.zhi.customers).forEach(function(c){ idx.push({type:"知英語客戶", route:"work", id:c.id, label:c.name, snippet:c.stage, icon:"🎓"}); });
  alive(DB.work.courify.tasks).forEach(function(c){ idx.push({type:"Courify任務", route:"work", id:c.id, label:c.title, snippet:"", icon:"📣"}); });
  alive(DB.inbox).forEach(function(i){ idx.push({type:"收集箱", route:"inbox", id:i.id, label:i.content.slice(0,30), snippet:i.status, icon:"📥"}); });
  return idx;
}
function stageLabel(s){
  var map = {idea:"Idea", topic:"選題", script:"腳本", shoot:"拍攝", edit:"剪輯", pending:"待發佈", published:"已發佈"};
  return map[s]||s;
}

/* ---------------- links (cross-module relations) ---------------- */
function getLinksFor(type,id){
  return DB.links.filter(function(l){ return (l.a.type===type&&l.a.id===id)||(l.b.type===type&&l.b.id===id); });
}
function otherSide(link,type,id){ return (link.a.type===type&&link.a.id===id) ? link.b : link.a; }
function findEntity(type,id){
  var map = {
    task:DB.tasks, content:DB.content.pipeline, inspiration:DB.info.inspirations,
    book:DB.books.mylist, fanshi:DB.work.fanshi.clients, zhi:DB.work.zhi.customers,
    courify:DB.work.courify.tasks, inbox:DB.inbox
  };
  var arr = map[type]||[];
  return arr.find(function(x){return x.id===id;});
}
function entityTitle(type,ent){
  if(!ent) return "(已刪除)";
  return ent.title||ent.name||ent.text||ent.content||"";
}
function entityRoute(type){
  var map = {task:"plan", content:"media", inspiration:"info", book:"books", fanshi:"work", zhi:"work", courify:"work", inbox:"inbox"};
  return map[type]||"today";
}
function linkedChips(type,id){
  var links = getLinksFor(type,id);
  if(!links.length) return "";
  return links.map(function(l){
    var other = otherSide(l,type,id);
    var ent = findEntity(other.type, other.id);
    return '<span class="linked-chip" data-action="jumpLink" data-type="'+other.type+'" data-id="'+other.id+'">🔗 '+escapeHtml(entityTitle(other.type,ent))+'</span>';
  }).join("");
}
function openLinkPicker(type,id){
  var idx = buildSearchIndex().filter(function(i){ return true; });
  var typeMap = {"任務":"task","內容選題":"content","靈感":"inspiration","書單":"book","凡蒔顧問客戶":"fanshi","知英語客戶":"zhi","Courify任務":"courify","收集箱":"inbox"};
  var rows = idx.map(function(i){
    var t2 = typeMap[i.type];
    if(t2===type && "" ) return "";
    return '<div class="list-item" data-action="pickLink" data-target-type="'+t2+'" data-target-id="'+i.id+'" style="cursor:pointer">'+
      '<div class="li-body"><div class="li-title">'+i.icon+' '+escapeHtml(i.label)+'</div><div class="li-meta">'+escapeHtml(i.type)+' · '+escapeHtml(i.snippet||"")+'</div></div></div>';
  }).join("");
  openModal(
    '<div class="modal-title">關聯到其他項目 '+helpDot("link_item")+'</div>'+
    '<div class="modal-sub">選一個要連結的項目</div>'+
    '<div class="list" style="max-height:50vh;overflow-y:auto">'+(rows||'<div class="empty-state">目前沒有可關聯的項目</div>')+'</div>',
    {wide:true}
  );
  window.__linkSource = {type:type, id:id};
}

/* ================= ROUTER ================= */
var ROUTES = {
  today:{label:"今日", icon:"🏡"},
  inbox:{label:"收集箱", icon:"📥"},
  plan:{label:"每日計劃", icon:"🗓️"},
  life:{label:"生活管理健身", icon:"🌿"},
  media:{label:"自媒體運營", icon:"🎬"},
  info:{label:"信息管理", icon:"📰"},
  books:{label:"我的書單", icon:"📚"},
  work:{label:"工作管理", icon:"💼"},
  search:{label:"搜尋", icon:"🔍"},
  ai:{label:"AI 幫手", icon:"✨"},
  settings:{label:"設置", icon:"⚙️"}
};
var DESKTOP_NAV = ["today","inbox","plan","life","media","info","books","work","settings"];
var MOBILE_BOTTOM = [
  {id:"today", label:"今日", ico:"🏡"},
  {id:"life", label:"健身", ico:"🌿"},
  {id:"__add", label:"收集", ico:"＋", plus:true},
  {id:"media", label:"自媒體", ico:"🎬"},
  {id:"__more", label:"更多", ico:"☰"}
];
var DRAWER_ITEMS = [
  {id:"plan", label:"每日計劃", ico:"🗓️"},
  {id:"work", label:"工作管理", ico:"💼"},
  {id:"info", label:"信息管理", ico:"📰"},
  {id:"books", label:"我的書單", ico:"📚"},
  {id:"inbox", label:"收集箱", ico:"📥"},
  {id:"search", label:"搜尋", ico:"🔍"},
  {id:"ai", label:"AI 幫手", ico:"✨"},
  {id:"settings", label:"設置", ico:"⚙️"}
];

var currentRoute = "today";
var currentSub = null;

function navigate(route, sub){
  currentRoute = route;
  currentSub = sub||null;
  window.location.hash = "#/"+route;
  closeDrawer();
  closeModal();
  render();
  window.scrollTo(0,0);
}
window.addEventListener("hashchange", function(){
  var r = (window.location.hash||"").replace("#/","");
  if(ROUTES[r]) { currentRoute = r; render(); }
});

/* ================= SHELL RENDER ================= */
function render(){
  var root = document.getElementById("root");
  var isMobilePage = document.body.clientWidth <= 900;
  var pageHtml = renderPage(currentRoute);
  root.innerHTML =
    '<div class="app-shell">'+
      '<aside class="sidebar">'+renderSidebar()+'</aside>'+
      '<div class="main-col">'+
        renderMobileTopbar()+
        renderTopbar()+
        '<div class="main-content">'+pageHtml+'</div>'+
      '</div>'+
    '</div>'+
    renderBottomNav();
  bindGlobalEvents();
  if(window.__PAGE_AFTER && window.__PAGE_AFTER[currentRoute]) window.__PAGE_AFTER[currentRoute]();
}

function renderSidebar(){
  var html = '<div class="brand"><div class="brand-badge">凡</div><div><div class="brand-name">凡蒔天地</div><div class="brand-sub">個人操作系統</div></div></div>';
  html += '<nav class="side-nav">';
  DESKTOP_NAV.forEach(function(r){
    var meta = ROUTES[r];
    html += '<button class="nav-btn '+(currentRoute===r?'active':'')+'" data-action="nav" data-route="'+r+'"><span class="ico">'+meta.icon+'</span>'+meta.label+'</button>';
  });
  html += '</nav>';
  html += '<div class="side-foot">'+
    '<button data-action="nav" data-route="search">🔍 跨模塊搜尋</button>'+
    '<button data-action="nav" data-route="ai">✨ AI 幫手</button>'+
    '</div>';
  return html;
}
function renderMobileTopbar(){
  return '<div class="mobile-topbar"><div class="brand-badge">凡</div><h1>'+ROUTES[currentRoute].label+'</h1>'+
    '<button class="icon-btn" data-action="nav" data-route="search">🔍</button></div>';
}
function renderTopbar(){
  return '<div class="topbar">'+
    '<h1>'+ROUTES[currentRoute].icon+' '+ROUTES[currentRoute].label+'</h1>'+
    '<div class="search-box"><span>🔍</span><input id="topSearchInput" placeholder="跨模塊搜尋任務／內容／靈感／書摘／資料／收集箱…" onkeydown="if(event.key===\'Enter\')window.__FS.doSearch(this.value)"></div>'+
    '<div class="topbar-actions">'+
      '<button class="icon-btn" title="AI 幫手" data-action="nav" data-route="ai">✨</button>'+
      '<button class="icon-btn" title="設置" data-action="nav" data-route="settings">⚙️</button>'+
    '</div>'+
  '</div>';
}
function renderBottomNav(){
  var html = '<nav class="bottom-nav">';
  MOBILE_BOTTOM.forEach(function(it){
    var active = (it.id===currentRoute);
    if(it.plus){
      html += '<button class="bn-item plus" data-action="quickAdd"><span class="bn-ico">＋</span><span class="bn-label">收集</span></button>';
    } else if(it.id==="__more"){
      html += '<button class="bn-item" data-action="openDrawer"><span class="bn-ico">☰</span><span class="bn-label">更多</span></button>';
    } else {
      html += '<button class="bn-item '+(active?'active':'')+'" data-action="nav" data-route="'+it.id+'"><span class="bn-ico">'+it.ico+'</span><span class="bn-label">'+it.label+'</span></button>';
    }
  });
  html += '</nav>';
  return html;
}
function openDrawer(){
  var overlay = document.createElement("div");
  overlay.className = "drawer-overlay";
  overlay.id = "drawerOverlay";
  var grid = DRAWER_ITEMS.map(function(it){
    return '<div class="drawer-item" data-action="nav" data-route="'+it.id+'"><span class="di-ico">'+it.ico+'</span><span class="di-label">'+it.label+'</span></div>';
  }).join("");
  overlay.innerHTML = '<div class="drawer"><div class="drawer-grab"></div><div class="drawer-grid">'+grid+'</div></div>';
  overlay.addEventListener("mousedown", function(e){ if(e.target===overlay) closeDrawer(); });
  document.body.appendChild(overlay);
}
function quickAddSheet(){
  openModal(
    '<div class="modal-title">快速記錄 '+helpDot("inbox_add")+'</div>'+
    '<div class="modal-sub">先丟進收集箱，之後再決定歸類</div>'+
    '<form id="quickAddForm">'+
      '<div class="row">'+
        '<label class="field">類型<select name="type"><option value="text">文字</option><option value="link">連結</option><option value="task">臨時任務</option><option value="image">圖片說明</option><option value="file">檔案說明</option></select></label>'+
      '</div>'+
      '<label class="field" style="margin-top:8px">內容<textarea name="content" rows="3" placeholder="輸入內容…" required></textarea></label>'+
      '<button class="btn" style="width:100%;margin-top:12px" type="submit">送出到收集箱</button>'+
    '</form>',
    {}
  );
  document.getElementById("quickAddForm").addEventListener("submit", function(e){
    e.preventDefault();
    var f = e.target;
    addInboxItem(f.type.value, f.content.value);
    closeModal();
    toast("已加入收集箱，等待您確認去向");
  });
}

/* ================= EVENT DELEGATION ================= */
function bindGlobalEvents(){
  document.body.onclick = function(e){
    var t = e.target.closest("[data-action]");
    if(!t) return;
    var action = t.getAttribute("data-action");
    var handlers = {
      nav: function(){ navigate(t.getAttribute("data-route")); },
      closeModal: closeModal,
      openDrawer: openDrawer,
      quickAdd: quickAddSheet,
      jumpLink: function(){
        var type = t.getAttribute("data-type"), id = t.getAttribute("data-id");
        closeModal();
        navigate(entityRoute(type));
      },
      pickLink: function(){
        var targetType = t.getAttribute("data-target-type"), targetId = t.getAttribute("data-target-id");
        if(window.__linkSource){
          DB.links.push({id:uid(), a:window.__linkSource, b:{type:targetType,id:targetId}});
          save(); closeModal(); toast("已建立關聯"); render();
        }
      },
      openHelp: function(){ openHelpModal(t.getAttribute("data-key")); }
    };
    if(handlers[action]) handlers[action]();
    else if(window.__FS[action]) window.__FS[action](t, e);
  };
  // help hover-click also opens modal (covers touch devices)
  document.querySelectorAll(".help-dot").forEach(function(el){
    el.onclick = function(e){ e.stopPropagation(); openHelpModal(el.getAttribute("data-help-key")); };
  });
}
window.addEventListener("resize", function(){ render(); });

/* expose */
window.__FS.DB = DB;
window.__FS.save = save;
window.__FS.navigate = navigate;
window.__FS.helpDot = helpDot;
window.__FS.toast = toast;

/* placeholder for page renderers – filled by pages.js */
function renderPage(route){
  if(window.__PAGES && window.__PAGES[route]) return window.__PAGES[route]();
  return '<div class="empty-state">頁面載入中…</div>';
}
function addInboxItem(type, content){
  var suggest = aiSuggestInboxDestination({type:type, content:content});
  DB.inbox.push({id:uid(), type:type, content:content, createdAt:Date.now(), status:"pending", aiSuggest:suggest, resolvedModule:null, deletedAt:null});
  save();
}
window.__FS.addInboxItem = addInboxItem;
window.__FS.aiSuggestInboxDestination = aiSuggestInboxDestination;
window.__FS.aiGenerateWorkout = aiGenerateWorkout;
window.__FS.currentPhase = currentPhase;
window.__FS.computeBmrTdee = computeBmrTdee;
window.__FS.buildSearchIndex = buildSearchIndex;
window.__FS.doSearch = function(q){ navigate("search"); setTimeout(function(){ var i=document.getElementById("searchInput"); if(i){ i.value=q; window.__FS.runSearch(); } },0); };
window.__FS.openLinkPicker = openLinkPicker;
window.__FS.linkedChips = linkedChips;
window.__FS.helpBtn = function(key){ return '<span class="help-dot" data-help-key="'+key+'">?<span class="help-tip">'+escapeHtml(HELP[key]?HELP[key].w:'')+'</span></span>'; };
window.__FS.softDelete = softDelete;
window.__FS.restore = restore;
window.__FS.alive = alive;
window.__FS.trashed = trashed;
window.__FS.uid = uid;
window.__FS.todayStr = todayStr;
window.__FS.addDays = addDays;
window.__FS.daysBetween = daysBetween;
window.__FS.fmtDate = fmtDate;
window.__FS.weekdayLabel = weekdayLabel;
window.__FS.startOfWeek = startOfWeek;
window.__FS.escapeHtml = escapeHtml;
window.__FS.clamp = clamp;
window.__FS.openModal = openModal;
window.__FS.closeModal = closeModal;
window.__FS.stageLabel = stageLabel;
window.__FS.render = render;
window.__FS.HELP = HELP;
window.__FS.PHASES = PHASES;
window.__FS.APP_VERSION = APP_VERSION;

window.__FS.init = function(){
  var r = (window.location.hash||"").replace("#/","");
  if(ROUTES[r]) currentRoute = r;
  render();
};

document.addEventListener("DOMContentLoaded", function(){
  if(window.__PAGES) window.__FS.init();
});
})();
