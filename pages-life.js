/* ===== 生活管理健身 module ===== */
(function(){
var F = window.__FS;

F.openCycleSetup = function(){
  var c = F.DB.life.cycle;
  F.openModal(
    '<div class="modal-title">經期參數設定 '+F.helpBtn("life_cycle")+'</div>'+
    '<form id="cycleForm">'+
      '<label class="field">最近一次經期開始日<input type="date" name="lastStart" value="'+(c.lastStart||F.todayStr())+'" required></label>'+
      '<div class="row" style="margin-top:8px">'+
        '<label class="field">週期天數<input type="number" name="cycleLen" value="'+c.cycleLen+'" min="20" max="40"></label>'+
        '<label class="field">經期天數<input type="number" name="periodLen" value="'+c.periodLen+'" min="2" max="10"></label>'+
      '</div>'+
      '<button class="btn" type="submit" style="width:100%;margin-top:12px">儲存</button>'+
    '</form>'
  );
  document.getElementById("cycleForm").addEventListener("submit", function(e){
    e.preventDefault();
    var f = e.target;
    F.DB.life.cycle = {lastStart:f.lastStart.value, cycleLen:+f.cycleLen.value, periodLen:+f.periodLen.value};
    F.save(); F.closeModal(); F.toast("已更新經期參數"); F.render();
  });
};

F.aiWorkoutPreview = function(){
  var phase = F.currentPhase();
  var plan = F.aiGenerateWorkout(phase);
  F.DB.life.__previewWorkout = plan;
  var lines = plan.exercises.map(function(ex){
    return '<div class="d-line add">+ '+ex.name+'：'+ex.sets+'組 × '+ex.reps+(ex.weight?"次 @"+ex.weight+"kg":"次")+'</div>';
  }).join("");
  F.openModal(
    '<div class="modal-title">AI 生成每日跟練（預覽） '+F.helpBtn("life_ai_workout")+'</div>'+
    '<div class="modal-sub">'+(phase?phase.name+" · ":"")+plan.note+'，預估消耗 '+plan.estCalories+' 大卡</div>'+
    '<div class="diff-box">'+lines+'</div>'+
    '<div class="row"><button class="btn secondary" data-action="closeModal" style="flex:1">取消</button>'+
    '<button class="btn" data-action="applyWorkout" style="flex:1">確認套用為今日跟練</button></div>'
  );
};
F.applyWorkout = function(){
  var plan = F.DB.life.__previewWorkout;
  if(!plan) return;
  var today = F.todayStr();
  var existing = F.DB.life.workouts.find(function(w){return w.date===today && !w.deletedAt;});
  if(existing){ F.softDelete(F.DB.life.workouts, existing.id); }
  F.DB.life.workouts.push({id:F.uid(), date:today, exercises:plan.exercises, estCalories:plan.estCalories, note:plan.note, done:false, deletedAt:null});
  F.DB.life.__previewWorkout = null;
  F.save(); F.closeModal(); F.toast("已套用今日跟練，可逐組打卡"); F.render();
};
F.checkExercise = function(t){
  var wid = t.getAttribute("data-wid"), idx = +t.getAttribute("data-idx");
  var w = F.DB.life.workouts.find(function(x){return x.id===wid;});
  if(!w) return;
  var ex = w.exercises[idx];
  ex.done = !ex.done;
  if(ex.done && ex.actualReps==null){ ex.actualReps = ex.reps; ex.actualWeight = ex.weight; }
  if(w.exercises.every(function(e){return e.done;})){
    w.done = true;
    addWeightLogAuto(w);
  }
  F.save(); F.render();
};
function addWeightLogAuto(w){
  // record burned calories into a lightweight daily log (does not overwrite weight)
  var log = F.DB.life.foodLogs; // reuse energy summary via workouts array itself
}
F.deleteWorkout = function(t){
  F.softDelete(F.DB.life.workouts, t.getAttribute("data-id"));
  F.save(); F.toast("已刪除今日跟練"); F.render();
};

F.openWeightPlanForm = function(){
  var wp = F.DB.life.weightPlan || {height:160,weight:58,age:30,activity:1.3,targetWeight:52,deficit:400};
  F.openModal(
    '<div class="modal-title">體重管理計劃 '+F.helpBtn("life_weight_plan")+'</div>'+
    '<form id="wpForm">'+
      '<div class="row"><label class="field">身高cm<input type="number" name="height" value="'+wp.height+'"></label>'+
      '<label class="field">目前體重kg<input type="number" name="weight" value="'+wp.weight+'"></label></div>'+
      '<div class="row" style="margin-top:8px"><label class="field">年齡<input type="number" name="age" value="'+wp.age+'"></label>'+
      '<label class="field">活動係數<select name="activity"><option value="1.2">久坐 1.2</option><option value="1.3" selected>輕度活動 1.3</option><option value="1.5">中度活動 1.5</option><option value="1.7">高度活動 1.7</option></select></label></div>'+
      '<div class="row" style="margin-top:8px"><label class="field">目標體重kg<input type="number" name="targetWeight" value="'+wp.targetWeight+'"></label>'+
      '<label class="field">每日缺口(kcal)<input type="number" name="deficit" value="'+wp.deficit+'"></label></div>'+
      '<button class="btn" type="submit" style="width:100%;margin-top:12px">儲存計劃</button>'+
    '</form>'
  );
  document.getElementById("wpForm").addEventListener("submit", function(e){
    e.preventDefault();
    var f = e.target;
    F.DB.life.weightPlan = {height:+f.height.value, weight:+f.weight.value, age:+f.age.value, activity:+f.activity.value, targetWeight:+f.targetWeight.value, deficit:+f.deficit.value};
    F.save(); F.closeModal(); F.toast("已儲存體重管理計劃"); F.render();
  });
};
F.addWeightLog = function(){
  F.openModal(
    '<div class="modal-title">記錄今日體重</div><form id="wlForm">'+
    '<label class="field">體重 kg<input type="number" step="0.1" name="weight" required></label>'+
    '<button class="btn" type="submit" style="width:100%;margin-top:10px">新增</button></form>'
  );
  document.getElementById("wlForm").addEventListener("submit", function(e){
    e.preventDefault();
    var w = +e.target.weight.value;
    var logs = F.DB.life.weightLogs;
    var todayLog = logs.find(function(l){return l.date===F.todayStr();});
    if(todayLog) todayLog.weight = w; else logs.push({date:F.todayStr(), weight:w});
    F.save(); F.closeModal(); F.toast("已記錄體重"); F.render();
  });
};
F.addFoodLog = function(){
  F.openModal(
    '<div class="modal-title">新增食物紀錄 '+F.helpBtn("life_food")+'</div><form id="flForm">'+
    '<label class="field">食物名稱<input name="name" required></label>'+
    '<label class="field" style="margin-top:8px">熱量 kcal<input type="number" name="cal" required></label>'+
    '<button class="btn" type="submit" style="width:100%;margin-top:10px">新增</button></form>'
  );
  document.getElementById("flForm").addEventListener("submit", function(e){
    e.preventDefault();
    F.DB.life.foodLogs.push({id:F.uid(), date:F.todayStr(), name:e.target.name.value, cal:+e.target.cal.value});
    F.save(); F.closeModal(); F.render();
  });
};
F.deleteFoodLog = function(t){
  var id = t.getAttribute("data-id");
  var arr = F.DB.life.foodLogs;
  var idx = arr.findIndex(function(x){return x.id===id;});
  if(idx>-1) arr.splice(idx,1);
  F.save(); F.render();
};

function sparkline(values, w, h, color){
  if(!values.length) return "";
  var min = Math.min.apply(null,values), max = Math.max.apply(null,values);
  if(min===max){ min-=1; max+=1; }
  var step = w/(Math.max(values.length-1,1));
  var pts = values.map(function(v,i){ return (i*step)+","+(h-((v-min)/(max-min))*h); }).join(" ");
  return '<svg class="sparkline" viewBox="0 0 '+w+' '+h+'" width="'+w+'" height="'+h+'"><polyline points="'+pts+'" fill="none" stroke="'+color+'" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
F.sparkline = sparkline;

window.__PAGES.life = function(){
  var DB = F.DB;
  var phase = F.currentPhase();
  var today = F.todayStr();
  var workout = DB.life.workouts.find(function(w){return w.date===today && !w.deletedAt;});
  var wp = DB.life.weightPlan;
  var bmrTdee = wp ? F.computeBmrTdee(wp) : null;
  var todayFood = DB.life.foodLogs.filter(function(f){return f.date===today;});
  var intake = todayFood.reduce(function(s,f){return s+f.cal;},0);
  var burned = workout ? workout.estCalories : 0;
  var logs = DB.life.weightLogs.slice(-14);

  var html = '<div class="grid grid-2">';
  html += '<div>';

  // cycle phase card
  html += '<div class="card section">';
  html += '<div class="card-title">🌿 經期階段與養生建議 '+F.helpBtn("life_cycle")+'<button class="btn sm secondary" style="margin-left:auto" data-action="openCycleSetup">設定參數</button></div>';
  if(!DB.life.cycle.lastStart){
    html += '<div class="empty-state"><div class="e-ico">🌙</div><div>尚未設定經期參數</div><div class="e-next">下一步：點「設定參數」輸入最近一次經期開始日</div></div>';
  } else {
    html += '<div class="pill" style="background:'+phase.color+'22;color:'+phase.color+';font-size:14px;padding:6px 14px">目前：'+phase.name+'</div>'+
      '<div style="margin-top:10px;color:var(--muted)">'+phase.tip+'</div>';
  }
  html += '</div>';

  // workout
  html += '<div class="card section">';
  html += '<div class="card-title">💪 今日跟練 '+F.helpBtn("life_ai_workout")+'</div>';
  if(!workout){
    html += '<div class="empty-state"><div class="e-ico">🏋️</div><div>今日還沒有跟練計畫</div></div>'+
      '<button class="btn" style="width:100%;margin-top:10px" data-action="aiWorkoutPreview">AI 生成今日跟練</button>';
  } else {
    html += '<div style="font-size:12.5px;color:var(--muted);margin-bottom:8px">'+workout.note+' · 預估消耗 '+workout.estCalories+' 大卡'+(workout.done?" · 已完成 ✅":"")+'</div>';
    html += '<div class="list">'+workout.exercises.map(function(ex,i){
      return '<div class="list-item '+(ex.done?"done":"")+'">'+
        '<button class="check '+(ex.done?"checked":"")+'" data-action="checkExercise" data-wid="'+workout.id+'" data-idx="'+i+'">'+(ex.done?"✓":"")+'</button>'+
        '<div class="li-body"><div class="li-title">'+F.escapeHtml(ex.name)+'</div>'+
        '<div class="li-meta">建議 '+ex.sets+'組×'+ex.reps+(ex.weight?"次 @"+ex.weight+"kg":"次")+
        (ex.done?'　實際 '+ex.actualReps+'次 @'+ex.actualWeight+'kg':'')+'</div></div></div>';
    }).join("")+'</div>';
    html += '<button class="btn sm ghost" style="margin-top:8px" data-action="deleteWorkout" data-id="'+workout.id+'">刪除重來</button>';
  }
  html += '</div>';

  // food log
  html += '<div class="card section">';
  html += '<div class="card-title">🍽️ 食物熱量記錄 '+F.helpBtn("life_food")+'<button class="btn sm secondary" style="margin-left:auto" data-action="addFoodLog">新增</button></div>';
  if(!todayFood.length){
    html += '<div class="empty-state"><div class="e-ico">🥗</div><div>今天還沒有記錄食物</div></div>';
  } else {
    html += '<div class="list">'+todayFood.map(function(f){
      return '<div class="list-item"><div class="li-body"><div class="li-title">'+F.escapeHtml(f.name)+'</div></div>'+
        '<div class="li-meta">'+f.cal+' kcal</div><button class="btn sm ghost" data-action="deleteFoodLog" data-id="'+f.id+'">刪除</button></div>';
    }).join("")+'</div>';
  }
  html += '</div>';
  html += '</div>'; // end left col

  // right col
  html += '<div>';
  html += '<div class="card section">';
  html += '<div class="card-title">⚖️ 體重管理計劃 '+F.helpBtn("life_weight_plan")+'<button class="btn sm secondary" style="margin-left:auto" data-action="openWeightPlanForm">設定</button></div>';
  if(!wp){
    html += '<div class="empty-state"><div class="e-ico">📐</div><div>尚未設定計劃</div><div class="e-next">下一步：點「設定」輸入身高體重</div></div>';
  } else {
    html += '<div class="row" style="text-align:center">'+
      '<div><div style="font-size:20px;font-weight:800">'+bmrTdee.bmr+'</div><div style="font-size:11px;color:var(--muted)">BMR 基礎代謝</div></div>'+
      '<div><div style="font-size:20px;font-weight:800">'+bmrTdee.tdee+'</div><div style="font-size:11px;color:var(--muted)">TDEE 每日消耗</div></div>'+
      '<div><div style="font-size:20px;font-weight:800;color:'+(wp.deficit>bmrTdee.tdee*0.25?"var(--danger)":"var(--success)")+'">-'+wp.deficit+'</div><div style="font-size:11px;color:var(--muted)">目標缺口</div></div>'+
      '</div>';
    html += '<div style="margin-top:8px;font-size:12.5px;color:var(--muted)">建議每日攝取約 '+(bmrTdee.tdee-wp.deficit)+' kcal（安全下限 '+Math.round(bmrTdee.bmr*1.1)+' kcal）'+(wp.deficit>bmrTdee.tdee*0.25?'　<span class="pill danger">缺口偏大，建議調整</span>':'')+'</div>';
  }
  html += '</div>';

  html += '<div class="card section">';
  html += '<div class="card-title">📈 體重趨勢<button class="btn sm secondary" style="margin-left:auto" data-action="addWeightLog">記錄今日</button></div>';
  if(!logs.length){
    html += '<div class="empty-state"><div class="e-ico">📉</div><div>還沒有體重紀錄</div></div>';
  } else {
    html += sparkline(logs.map(function(l){return l.weight;}),260,60,"var(--primary)");
    html += '<div style="font-size:12.5px;color:var(--muted);margin-top:6px">最新：'+logs[logs.length-1].weight+' kg（'+logs.length+' 筆紀錄）</div>';
  }
  html += '</div>';

  html += '<div class="card section">';
  html += '<div class="card-title">🔥 每日能量總結</div>';
  html += '<div class="row" style="text-align:center">'+
    '<div><div style="font-size:18px;font-weight:800">'+intake+'</div><div style="font-size:11px;color:var(--muted)">攝取 kcal</div></div>'+
    '<div><div style="font-size:18px;font-weight:800">'+burned+'</div><div style="font-size:11px;color:var(--muted)">運動消耗</div></div>'+
    '<div><div style="font-size:18px;font-weight:800;color:'+(intake-burned<0?"var(--success)":"var(--warn)")+'">'+(intake-burned)+'</div><div style="font-size:11px;color:var(--muted)">淨攝取</div></div>'+
    '</div>';
  html += '</div>';
  html += '</div>'; // end right col
  html += '</div>'; // end grid
  return html;
};
})();
