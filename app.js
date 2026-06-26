/* =========================================================
   MAINTENANCE BCR — front-end prototype (web)
   Mengikuti flow Work Request -> Work Order -> Backlog ->
   Approval -> Checksheet -> Report, sesuai dokumentasi flow.
========================================================= */

/* ============================================================
   KONFIGURASI BACKEND (Supabase)
   1. Buat project di https://supabase.com
   2. Jalankan SQL di file setup.sql (Supabase SQL Editor)
   3. Ambil Project URL & anon public key di Settings > API
   4. Ganti dua nilai di bawah ini dengan punya kamu
   Selama belum diganti, web tetap jalan pakai data LOKAL per-browser.
============================================================ */
const SUPABASE_URL = "https://ltniknsucbyhflyhbynw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bmlrbnN1Y2J5aGZseWhieW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NTI2NTEsImV4cCI6MjA5ODAyODY1MX0.3d0ILa7UN-uUxk36YdjanGSXXhn22iZ43dhO8b_Q9CI";
const BACKEND_ENABLED = SUPABASE_URL.indexOf("https://") === 0 && SUPABASE_ANON_KEY.length > 20;
const supabaseClient = (BACKEND_ENABLED && window.supabase)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const STORE_KEY = "bcr_app_data_v1";
let DB = null;
let currentRoute = "dashboard";
let modalSubmitHandler = null;
let currentUser = null;
let currentProfile = null;

/* ---------- seed data ---------- */
function seedData(){
  return {
    assets: [
      {nkp:"GS-01", category:"GENSET", location:"Plant Karawang", status:"Active"},
      {nkp:"GS-02", category:"GENSET", location:"Plant Subang", status:"Active"},
      {nkp:"TM-01", category:"TRUCK MIXER", location:"Area Japek Selatan", status:"Active"},
      {nkp:"TM-02", category:"TRUCK MIXER", location:"Plant Karawang", status:"Breakdown"},
      {nkp:"TM-03", category:"TRUCK MIXER", location:"Area 2", status:"Active"},
      {nkp:"WL-01", category:"WHEEL LOADER", location:"Plant Karawang", status:"Active"},
      {nkp:"WL-02", category:"WHEEL LOADER", location:"Plant Subang", status:"Standby"},
      {nkp:"DT-01", category:"DUMP TRUCK", location:"Area 2", status:"Active"},
      {nkp:"DT-02", category:"DUMP TRUCK", location:"Plant Karawang", status:"Active"},
      {nkp:"CP-01", category:"COMPRESSOR", location:"Workshop", status:"Active"},
      {nkp:"BP-01", category:"BATCHING PLANT", location:"Plant Karawang", status:"Active"},
    ],
    workRequests:[
      {id:"WR-0001", asset:"TM-02", category:"TRUCK MIXER", location:"Plant Karawang", registerDate:"2026-06-18 09:41", user:"Andi Saputra", activity:"Repair_2E", priority:"High", description:"Hose hidrolik bocor pada mixer drum", approvalState:"Approved", state:"Closed"},
      {id:"WR-0002", asset:"WL-02", category:"WHEEL LOADER", location:"Plant Subang", registerDate:"2026-06-20 13:45", user:"Wian Narwastu", activity:"Inspection_1B", priority:"Medium", description:"Indikasi getaran tidak normal pada bucket", approvalState:"Checked", state:"Processed"},
      {id:"WR-0003", asset:"GS-02", category:"GENSET", location:"Plant Subang", registerDate:"2026-06-22 10:05", user:"Satria Fauzi", activity:"PS_250_1A", priority:"Low", description:"Periodical service 250 HM", approvalState:"Requested", state:"Requested"},
      {id:"WR-0004", asset:"DT-01", category:"DUMP TRUCK", location:"Area 2", registerDate:"2026-06-24 08:12", user:"David", activity:"Oiling_1G", priority:"Low", description:"Penggantian oli berkala", approvalState:"Approved", state:"Closed"},
    ],
    workOrders:[
      {id:"SCH00031", wrId:"WR-0001", asset:"TM-02", planner:"Planner Site", status:"Closed", type:"Unscheduled", createdDate:"2026-06-18"},
      {id:"SCH00032", wrId:"WR-0004", asset:"DT-01", planner:"Planner Site", status:"Approved", type:"Scheduled", createdDate:"2026-06-24"},
    ],
    backlogs:[
      {id:"BL-001", date:"2026-06-14", nkp:"TM-01", hmkm:7644, problem:"Hose rembes (Motor to pump hydraulic)", action:"Replace hose", partName:"Hose", partNumber:"HS-03", qty:1, unit:"pcs", status:"Closed", installDate:"2026-06-15", mechanic:"Alex, Giyat"},
      {id:"BL-002", date:"2026-06-21", nkp:"WL-01", hmkm:3120, problem:"Lampu kerja depan mati", action:"Cek wiring & ganti bulb", partName:"Bulb Halogen", partNumber:"BL-12V", qty:2, unit:"pcs", status:"Open", installDate:"", mechanic:""},
    ],
    materialRequests:[
      {id:"MR-001", woId:"SCH00031", partName:"Hose Hydraulic", qty:1, unit:"pcs", status:"Issued"},
    ],
    schedules:[
      {id:"SCD-001", asset:"GS-02", category:"GENSET", activity:"Periodical Service 250 HM", interval:"Setiap 250 HM", nextDate:"2026-07-02", status:"Scheduled"},
      {id:"SCD-002", asset:"BP-01", category:"BATCHING PLANT", activity:"Inspection Harian", interval:"Setiap 10 hari", nextDate:"2026-06-30", status:"Scheduled"},
    ],
    meterRecords:[
      {asset:"TM-01", type:"HM", value:7644, date:"2026-06-25 07:00", description:"Pencatatan HM rutin"},
      {asset:"WL-01", type:"HM", value:3120, date:"2026-06-25 07:05", description:"Pencatatan HM rutin"},
      {asset:"DT-01", type:"KM", value:48211, date:"2026-06-25 07:10", description:"Pencatatan KM rutin"},
    ],
    operatorReports:[
      {id:"OPR-001", date:"2026-06-25", asset:"TM-01", operator:"Andi Saputra", shift:"Shift 1", meterType:"HM", meterValue:7644, fuel:35, activity:"Pengecoran area Plant Karawang", remarks:"Normal"},
      {id:"OPR-002", date:"2026-06-25", asset:"DT-01", operator:"David", shift:"Shift 1", meterType:"KM", meterValue:48211, fuel:60, activity:"Angkut material area 2", remarks:"Normal"},
    ],
    checksheets:[],
    counters:{wr:5, wo:33, bl:3, mr:2, scd:3, opr:2, ast:0},
  };
}

const CHECKLIST_ITEMS = {
  "GENSET":{
    inspection:["ENGINE OIL LEVEL","FUEL LEVEL","FUEL STRAINER","HOSE FUEL LINE CONDITION","ELECTRICAL CONNECTION","BATTERY INDICATOR","BATTERY TERMINAL","BATTERY ELECTROLYTE LEVEL","COOLANT LEVEL","RADIATOR CORE CONDITION","ENGINE BELT CONDITION AND TENSION","WATER PUMP CONDITION","MONITOR PANEL CONDITION","FREQUENCY","VOLTAGE","AMPERE"],
    periodical:["ENGINE OIL","ENGINE OIL FILTER","FUEL PRE FILTER","FUEL MAIN FILTER","FUEL STRAINER","AIR CLEANER OUTER ELEMENT","COOLANT LEVEL","WATER PUMP & PULLEY","RADIATOR CORE, HOSE, PIPE & CONNECTION","FAN BELT, ALTERNATOR BELT","STARTING MOTOR & ALTERNATOR","ENGINE MOUNTING FRONT, REAR & BRACKET","BATTERY ELECTROLYTE","BATTERY TERMINAL"]
  },
  "TRUCK MIXER":{
    inspection:["CHECK / ADD ENGINE OIL LEVEL","CHECK / ADD COOLANT LEVEL","CHECK / ADD HYDRAULIC OIL LEVEL","CHECK / ADD MIXER GEAR REDUCER OIL LEVEL","CHECK STEERING COLUMN CONDITION","CHECK PARKING BRAKE HANDLE","CHECK BRAKE PEDAL","CHECK OPERATOR SEAT AND SEAT BELT CONDITION","CHECK ALL LAMP CONDITION","CHECK BATTERY TERMINAL AND BRACKET","CHECK FUEL TANK WITH HOSES AND PIPES","CHECK HYDRAULIC TANK, MOUNTING AND HOSES","CHECK BELT","CHECK RADIATOR, MOUNTING, HOSE AND PIPES","CHECK LINING BRAKE"],
    periodical:["ENGINE OIL","ENGINE OIL FILTER","FUEL PRE FILTER","FUEL MAIN FILTER","AIR CLEANER OUTER ELEMENT","COOLANT LEVEL","STEERING OIL LEVEL","WATER PUMP & PULLEY","RADIATOR CORE, HOSE, PIPE & CONNECTION","STARTING MOTOR & ALTERNATOR","BATTERY ELECTROLYTE","BATTERY TERMINAL","AIR COMPRESSOR, AIR DRYER"]
  },
  "WHEEL LOADER":{
    inspection:["CHECK / ADD ENGINE OIL LEVEL","CHECK / ADD COOLANT LEVEL","CHECK / ADD TRANSMISSION OIL LEVEL","CHECK / ADD HYDRAULIC OIL LEVEL","CHECK / ADD AXLE OIL LEVEL","CHECK PILOT & SHIFT CONTROL LEVER","CHECK PARKING BRAKE BUTTON","CHECK SERVICE BRAKE PEDAL","CHECK OPERATOR SEAT AND SEAT BELT CONDITION","CHECK ALL LAMP CONDITION","CHECK FUEL TANK WITH HOSES AND PIPES","CHECK HYDRAULIC TANK, MOUNTING AND HOSES","CHECK RADIATOR & OIL COOLER, MOUNTING, HOSE AND PIPES","CHECK STEERING PUMP","CHECK STEERING CYLINDER"],
    periodical:["ENGINE OIL","ENGINE OIL FILTER","FUEL PRE FILTER","AIR CLEANER OUTER ELEMENT","COOLANT LEVEL","WATER PUMP & PULLEY","RADIATOR CORE, HOSE, PIPE & CONNECTION","OIL COOLER, HOSE, PIPE & CONNECTION (HYD, T/M)","STARTING MOTOR & ALTERNATOR","BATTERY ELECTROLYTE","BATTERY TERMINAL, DISCONNECT SWITCH"]
  },
  "DUMP TRUCK":{
    inspection:["CHECK / ADD ENGINE OIL LEVEL","CHECK / ADD COOLANT LEVEL","CHECK / ADD TRANSMISSION OIL LEVEL","CHECK / ADD DIFFERENTIAL OIL LEVEL (FR, RR)","CHECK / ADD HYDRAULIC OIL LEVEL","CHECK STEERING COLUMN CONDITION","CHECK PARKING BRAKE HANDLE","CHECK BRAKE PEDAL","CHECK OPERATOR SEAT AND SEAT BELT CONDITION","CHECK ALL LAMP CONDITION","CHECK FUEL TANK WITH HOSES AND PIPES","CHECK HYDRAULIC TANK, MOUNTING AND HOSES","CHECK LINING BRAKE","CHECK TRANSMISSION, PTO"],
    periodical:["ENGINE OIL","ENGINE OIL FILTER","FUEL PRE FILTER","FUEL MAIN FILTER","AIR CLEANER OUTER ELEMENT","COOLANT LEVEL","STEERING OIL LEVEL","WATER PUMP & PULLEY","STARTING MOTOR & ALTERNATOR","BATTERY ELECTROLYTE","BATTERY TERMINAL","AIR COMPRESSOR, AIR DRYER"]
  },
  "COMPRESSOR":{
    inspection:["LOCK OUT AND EMERGENCY STOP SWITCH FUNCTION","COMPRESSOR OIL LEVEL","OIL LEAKING","AIR CLEANER CONDITION","PANEL POWER CONDITION","FLEXIBLE COUPLING / BELT TENSION","MOUNTING MOTOR & RECIPROCATING PUMP","AIR VALVE","SAFETY VALVE","WIRING HARNESS & INSTRUMENT","DRAIN VALVE","RUNNING TEST"],
    periodical:["TOTAL RUN TIME","DISCHARGE PRESSURE (UNLOADING)","DISCHARGE PRESSURE (LOADING)","MAX. TEMPERATURE","MOTOR CURRENT","MCCB CONNECTION","CONTACTOR CONNECTION","TERMINAL CONNECTION","AIR CLEANER DUCT, HOUSING, DUST INDICATOR","BELT","SAFETY VALVE","COMPRESSOR OIL","MOUNTING MOTOR"]
  },
  "BATCHING PLANT":{
    inspection:["LOCK OUT AND EMERGENCY STOP SWITCH FUNCTION","MAIN MOTOR TEMPERATURE LH","MAIN MOTOR & GEAR LH","PULLEY & BELTS","COUPLING","ALL MIXER SEALING & BEARING GROUP","BUTTERFLY VALVE","LOAD CELL, VIBRATOR","MIXING BLADE, ARM & SHAFT","WEARING TILES","CENTRAL LUBRICATION GREASE PUMP","GATE MECHANISM, LIMIT/PROXIMITY SWITCH","CONTROL SYSTEM, MANUAL STATION","WIRING ELECTRICAL (CABLES, CONNECTION, MCCB, CONTACTOR, PANEL BOX)","RUNNING TEST"],
    periodical:["MAIN MOTOR FAN & FINS, COVER - RIGHT","MAIN MOTOR TERMINAL BLOCK - RIGHT","MAIN MOTOR BEARING - RIGHT","BELTS","PULLEYS","MAIN GEAR REDUCER & OIL - RIGHT","COUPLING","COUPLING RUBBER ELEMENT","CENTRAL LUBRICATION GREASE PUMP","DISCHARGE DOOR, LEVER","MIXING BLADE","MIXING ARM","WEARING TILES"]
  }
};

/* ---------- storage (Supabase backend, fallback ke local) ---------- */
function setSyncStatus(mode, text){
  const el = document.getElementById("syncStatus");
  if(!el) return;
  el.className = "sync-status "+mode;
  el.querySelector(".txt").textContent = text;
}
async function loadDB(){
  if(BACKEND_ENABLED && supabaseClient){
    try{
      const { data, error } = await supabaseClient.from("app_data").select("data").eq("id","main").maybeSingle();
      if(error) throw error;
      if(data && data.data && Object.keys(data.data).length > 0){ DB = data.data; setSyncStatus("online","Online (server)"); return; }
      DB = seedData();
      await saveDB();
      setSyncStatus("online","Online (server)");
      return;
    }catch(e){
      console.error("Supabase load error:", e);
      setSyncStatus("offline","Server error — pakai data lokal");
    }
  } else {
    setSyncStatus("local","Mode lokal (belum terhubung backend)");
  }
  // fallback: data lokal per-browser
  try{
    const res = await window.storage.get(STORE_KEY, false);
    if(res && res.value){ DB = JSON.parse(res.value); return; }
  }catch(e){ /* belum ada data */ }
  DB = seedData();
  await saveDB();
}
async function saveDB(){
  if(BACKEND_ENABLED && supabaseClient){
    try{
      const { error } = await supabaseClient.from("app_data").upsert({id:"main", data: DB, updated_at: new Date().toISOString()});
      if(error) throw error;
      setSyncStatus("online","Online (server)");
      return;
    }catch(e){
      console.error("Supabase save error:", e);
      setSyncStatus("offline","Gagal simpan ke server!");
      showToast("Gagal menyimpan ke server, cek koneksi internet");
    }
  }
  try{ await window.storage.set(STORE_KEY, JSON.stringify(DB), false); }
  catch(e){ console.error("storage error", e); }
}
async function refreshFromBackend(){
  if(!BACKEND_ENABLED){ showToast("Backend belum dikonfigurasi"); return; }
  await loadDB();
  render();
  showToast("Data diperbarui dari server");
}
function nextId(prefix, padLen){
  const map = {WR:"wr", WO:"wo", BL:"bl", MR:"mr", SCD:"scd", OPR:"opr", AST:"ast"};
  const key = map[prefix];
  DB.counters[key] = (DB.counters[key]||0)+1;
  return prefix+"-"+String(DB.counters[key]).padStart(padLen||3,"0");
}

/* ---------- menu config ---------- */
const MENU = [
  {type:"single", id:"dashboard", icon:"📊", label:"Dashboard"},
  {type:"group", id:"job", icon:"🧰", label:"Job", items:[
    {id:"wr", label:"Work Request"},
    {id:"wo", label:"Work Order"},
    {id:"backlog", label:"Backlog"},
    {id:"mr", label:"Material Request"},
    {id:"records", label:"Work Records"},
  ]},
  {type:"group", id:"maintenance", icon:"🗓️", label:"Maintenance", items:[
    {id:"planning", label:"Planning & Scheduling"},
    {id:"wizard", label:"Schedule Wizard"},
  ]},
  {type:"group", id:"assets", icon:"🚜", label:"Assets", items:[
    {id:"assetlist", label:"Asset List"},
    {id:"meter", label:"Meter (HM/KM) Records"},
    {id:"changestatus", label:"Change Asset Status"},
  ]},
  {type:"group", id:"checksheet", icon:"✅", label:"Checksheet", items:[
    {id:"cs_inspection", label:"Inspection Checksheet"},
    {id:"cs_periodical", label:"Periodical Service"},
  ]},
  {type:"group", id:"reports", icon:"📁", label:"Reports", items:[
    {id:"rep_breakdown", label:"Daily Breakdown Report"},
    {id:"rep_technical", label:"Technical Report"},
    {id:"rep_operator", label:"Daily Report Alat & Operator"},
    {id:"rep_export", label:"Export Custom Report"},
  ]},
];
const ROUTE_TITLE = {
  dashboard:["Dashboard","Ringkasan keseluruhan"],
  wr:["Job","Work Request"], wo:["Job","Work Order"], backlog:["Job","Backlog"],
  mr:["Job","Material Request"], records:["Job","Work Records"],
  planning:["Maintenance","Planning & Scheduling"], wizard:["Maintenance","Schedule Wizard"],
  assetlist:["Assets","Asset List"], meter:["Assets","Meter (HM/KM) Records"], changestatus:["Assets","Change Asset Status"],
  cs_inspection:["Checksheet","Inspection Checksheet"], cs_periodical:["Checksheet","Periodical Service"],
  rep_breakdown:["Reports","Daily Breakdown Report"], rep_technical:["Reports","Technical Report"],
  rep_operator:["Reports","Daily Report Alat & Operator"], rep_export:["Reports","Export Custom Report"],
};

function buildMenu(){
  const nav = document.getElementById("menu");
  nav.innerHTML = MENU.map(m=>{
    if(m.type==="single"){
      return `<div class="menu-group"><div class="menu-head single" data-route="${m.id}"><span class="ic">${m.icon}</span><span>${m.label}</span></div></div>`;
    }
    const items = m.items.map(it=>`<div class="sub-item" data-route="${it.id}">${it.label}</div>`).join("");
    return `<div class="menu-group" data-mid="${m.id}"><div class="menu-head" data-toggle="${m.id}"><span class="ic">${m.icon}</span><span>${m.label}</span><span class="chev">▶</span></div><div class="submenu">${items}</div></div>`;
  }).join("");

  nav.querySelectorAll("[data-toggle]").forEach(el=>{
    el.addEventListener("click",()=>{
      el.closest(".menu-group").classList.toggle("open");
    });
  });
  nav.querySelectorAll("[data-route]").forEach(el=>{
    el.addEventListener("click",()=> navigate(el.dataset.route));
  });
}

function navigate(route){
  currentRoute = route;
  document.querySelectorAll(".sub-item").forEach(e=>e.classList.toggle("active", e.dataset.route===route));
  document.querySelectorAll(".menu-head.single").forEach(e=>e.classList.toggle("active", e.dataset.route===route));
  // open the parent group containing active item
  document.querySelectorAll(".menu-group").forEach(g=>{
    if(g.querySelector(`.sub-item[data-route="${route}"]`)) g.classList.add("open");
  });
  const t = ROUTE_TITLE[route] || ["",""];
  document.getElementById("crumb").textContent = t[0];
  document.getElementById("pageTitle").textContent = t[1];
  render();
  closeSidebarMobile();
}
function openSidebarMobile(){
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sidebarBackdrop").classList.add("show");
}
function closeSidebarMobile(){
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarBackdrop").classList.remove("show");
}

/* ---------- helpers ---------- */
function badge(text){
  const cls = (text||"").toLowerCase().replace(/[^a-z]/g,"");
  return `<span class="badge ${cls}">${text}</span>`;
}
function fmtNum(n){ return Number(n).toLocaleString("id-ID"); }
function escapeHtml(s){ return String(s===undefined||s===null?"":s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function showToast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=> t.classList.remove("show"), 2400);
}
function assetCategoryOf(nkp){
  const a = DB.assets.find(x=>x.nkp===nkp);
  return a ? a.category : "";
}
function confirmDelete(msg, cb){
  if(window.confirm(msg)) cb();
}
function openPrintWindow(innerHtml, docTitle){
  const win = window.open("", "_blank", "noopener");
  if(!win){ showToast("Pop-up diblokir browser, izinkan pop-up untuk print"); return; }
  win.document.write(`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>${docTitle}</title>
  <style>
    *{box-sizing:border-box;}
    body{font-family:Arial,Helvetica,sans-serif;color:#222;padding:34px;max-width:900px;margin:0 auto;}
    .ph-head{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #d9772b;padding-bottom:10px;margin-bottom:14px;}
    .ph-brand{font-weight:800;font-size:17px;}
    .ph-meta{font-size:11px;color:#888;text-align:right;}
    h1{font-size:19px;margin:6px 0 2px;letter-spacing:.5px;}
    .ph-sub{font-size:12px;color:#666;margin-bottom:16px;}
    table{width:100%;border-collapse:collapse;margin-top:10px;}
    td,th{border:1px solid #ccc;padding:7px 10px;font-size:12.3px;text-align:left;vertical-align:top;}
    th{background:#f4f4f5;}
    th.label{width:170px;background:#f4f4f5;}
    .sign{display:flex;justify-content:space-between;margin-top:60px;}
    .sign div{width:30%;text-align:center;font-size:12px;}
    .sign .line{border-top:1px solid #333;margin-top:54px;padding-top:6px;}
    @media print{ .no-print{display:none;} body{padding:14px;} }
    .no-print{margin-top:24px;text-align:center;}
    .no-print button{padding:9px 18px;border:none;background:#d9772b;color:#fff;border-radius:6px;font-size:13px;cursor:pointer;}
  </style></head><body>
  <div class="ph-head"><div class="ph-brand">⚙ MAINTENANCE BCR</div><div class="ph-meta">Dicetak: ${new Date().toLocaleString("id-ID")}</div></div>
  ${innerHtml}
  <div class="no-print"><button onclick="window.print()">🖨 Print / Save as PDF</button></div>
  </body></html>`);
  win.document.close();
  win.focus();
}

/* ---------- modal ---------- */
function openModal(title, bodyHtml, onSubmit, footButtons){
  document.getElementById("modalBox").innerHTML = `
    <div class="modal-head"><h3>${title}</h3><span class="x" id="modalClose">✕</span></div>
    <div class="modal-body">${bodyHtml}</div>
    <div class="modal-foot">
      <button class="btn btn-secondary" id="modalCancel">Batal</button>
      ${footButtons || '<button class="btn btn-primary" id="modalSubmit">Simpan</button>'}
    </div>`;
  document.getElementById("modalOverlay").classList.add("show");
  document.getElementById("modalClose").onclick = closeModal;
  document.getElementById("modalCancel").onclick = closeModal;
  const sb = document.getElementById("modalSubmit");
  if(sb) sb.onclick = ()=>{ if(onSubmit) onSubmit(); };
  modalSubmitHandler = onSubmit;
}
function closeModal(){ document.getElementById("modalOverlay").classList.remove("show"); }

/* ---------- printable documents ---------- */
function printTechnicalReport(wrId){
  const r = DB.workRequests.find(x=>x.id===wrId);
  if(!r) return;
  const html = `
    <h1>TECHNICAL REPORT</h1>
    <div class="ph-sub">Referensi Work Request: <b>${r.id}</b></div>
    <table>
      <tr><th class="label">Asset (NKP)</th><td>${r.asset}</td><th class="label">Category</th><td>${r.category}</td></tr>
      <tr><th class="label">Location</th><td>${r.location}</td><th class="label">Register Date</th><td>${r.registerDate}</td></tr>
      <tr><th class="label">Reported By</th><td>${r.user}</td><th class="label">Activity</th><td>${r.activity}</td></tr>
      <tr><th class="label">Priority</th><td>${r.priority}</td><th class="label">Status</th><td>${r.approvalState} / ${r.state}</td></tr>
    </table>
    <table>
      <tr><th class="label">Problem Description</th><td colspan="3">${escapeHtml(r.description)}</td></tr>
      <tr><th class="label">Diagnose Report</th><td colspan="3">&nbsp;<br><br></td></tr>
      <tr><th class="label">Action Taken</th><td colspan="3">&nbsp;<br><br></td></tr>
      <tr><th class="label">Spare Part Used</th><td colspan="3">&nbsp;</td></tr>
      <tr><th class="label">Mechanic Note</th><td colspan="3">&nbsp;</td></tr>
    </table>
    <div class="sign">
      <div>Dilaporkan oleh<div class="line">${r.user}</div></div>
      <div>Diperiksa oleh<div class="line">&nbsp;</div></div>
      <div>Disetujui oleh<div class="line">&nbsp;</div></div>
    </div>`;
  openPrintWindow(html, "Technical Report - "+r.id);
}
function printWorkOrder(woId){
  const w = DB.workOrders.find(x=>x.id===woId);
  if(!w) return;
  const a = DB.assets.find(x=>x.nkp===w.asset);
  const html = `
    <h1>WORK ORDER</h1>
    <div class="ph-sub">No. WO: <b>${w.id}</b></div>
    <table>
      <tr><th class="label">Asset (NKP)</th><td>${w.asset}</td><th class="label">Category</th><td>${a?a.category:"-"}</td></tr>
      <tr><th class="label">Location</th><td>${a?a.location:"-"}</td><th class="label">Sumber</th><td>${w.wrId&&w.wrId!=="-" ? "WR "+w.wrId : w.type}</td></tr>
      <tr><th class="label">Type</th><td>${w.type}</td><th class="label">Created Date</th><td>${w.createdDate}</td></tr>
      <tr><th class="label">Planner</th><td>${w.planner}</td><th class="label">Status</th><td>${w.status}</td></tr>
    </table>
    <table>
      <thead><tr><th style="width:40px">No</th><th>Job Description / Checklist</th><th style="width:90px">Result</th><th style="width:160px">Note</th></tr></thead>
      <tbody>
        ${Array.from({length:6},(_,i)=>`<tr><td>${i+1}</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>`).join("")}
      </tbody>
    </table>
    <div class="sign">
      <div>Mekanik<div class="line">&nbsp;</div></div>
      <div>Planning Site Manager<div class="line">&nbsp;</div></div>
      <div>Disetujui oleh<div class="line">&nbsp;</div></div>
    </div>`;
  openPrintWindow(html, "Work Order - "+w.id);
}

/* ========================================================
   RENDER ROUTER
======================================================== */
function render(){
  const c = document.getElementById("content");
  switch(currentRoute){
    case "dashboard": c.innerHTML = renderDashboard(); attachDashboard(); break;
    case "wr": c.innerHTML = renderWR(); attachWR(); break;
    case "wo": c.innerHTML = renderWO(); attachWO(); break;
    case "backlog": c.innerHTML = renderBacklog(); attachBacklog(); break;
    case "mr": c.innerHTML = renderMR(); attachMR(); break;
    case "records": c.innerHTML = renderRecords(); break;
    case "planning": c.innerHTML = renderPlanning(); attachPlanning(); break;
    case "wizard": c.innerHTML = renderWizard(); attachWizard(); break;
    case "assetlist": c.innerHTML = renderAssetList(); attachAssetList(); break;
    case "meter": c.innerHTML = renderMeter(); attachMeter(); break;
    case "changestatus": c.innerHTML = renderChangeStatus(); attachChangeStatus(); break;
    case "cs_inspection": c.innerHTML = renderChecksheet("inspection"); attachChecksheet("inspection"); break;
    case "cs_periodical": c.innerHTML = renderChecksheet("periodical"); attachChecksheet("periodical"); break;
    case "rep_breakdown": c.innerHTML = renderReportBreakdown(); break;
    case "rep_technical": c.innerHTML = renderReportTechnical(); break;
    case "rep_operator": c.innerHTML = renderReportOperator(); attachReportOperator(); break;
    case "rep_export": c.innerHTML = renderExport(); attachExport(); break;
    default: c.innerHTML = "<div class='empty-state'>Halaman tidak ditemukan</div>";
  }
}

/* ========================================================
   DASHBOARD
======================================================== */
function renderDashboard(){
  const wr = DB.workRequests, wo = DB.workOrders, bl = DB.backlogs;
  const openWR = wr.filter(x=>x.state!=="Closed").length;
  const openWO = wo.filter(x=>x.status!=="Closed").length;
  const openBL = bl.filter(x=>x.status==="Open").length;
  const breakdownAssets = DB.assets.filter(a=>a.status==="Breakdown").length;

  const recentRows = [...wr].slice(-5).reverse().map(r=>`
    <tr><td>${r.id}</td><td>${r.asset}</td><td>${escapeHtml(r.description)}</td><td>${badge(r.priority)}</td><td>${badge(r.state)}</td></tr>
  `).join("") || `<tr class="empty-row"><td colspan="5">Belum ada data</td></tr>`;

  return `
  <div class="kpi-row">
    <div class="kpi"><div class="num">${openWR}</div><div class="lbl">Work Request Aktif</div><div class="bar"></div></div>
    <div class="kpi"><div class="num">${openWO}</div><div class="lbl">Work Order Berjalan</div><div class="bar"></div></div>
    <div class="kpi"><div class="num">${openBL}</div><div class="lbl">Backlog Belum Selesai</div><div class="bar"></div></div>
    <div class="kpi"><div class="num">${breakdownAssets}</div><div class="lbl">Asset Breakdown</div><div class="bar"></div></div>
    <div class="kpi"><div class="num">${DB.assets.length}</div><div class="lbl">Total Asset Terdaftar</div><div class="bar"></div></div>
  </div>
  <div class="grid-2">
    <div class="panel">
      <h3>Work Request Terbaru</h3>
      <table>
        <thead><tr><th>No</th><th>Asset</th><th>Deskripsi</th><th>Priority</th><th>Status</th></tr></thead>
        <tbody>${recentRows}</tbody>
      </table>
    </div>
    <div class="panel">
      <h3>Flow Proses Maintenance</h3>
      <div style="font-size:12.8px;line-height:2.1;color:var(--muted)">
        <div>1️⃣ <b style="color:var(--text)">Work Request</b> dibuat oleh user (Scheduled / Unscheduled)</div>
        <div>2️⃣ Planner membuat <b style="color:var(--text)">Work Order</b> dari WR / Backlog / Schedule</div>
        <div>3️⃣ Planning Site Manager melakukan <b style="color:var(--text)">Confirm</b></div>
        <div>4️⃣ Mekanik mengisi <b style="color:var(--text)">Checksheet</b> &amp; submit WO</div>
        <div>5️⃣ Approval WO oleh atasan terkait</div>
        <div>6️⃣ WO <b style="color:var(--text)">Closed</b>, temuan baru → Backlog</div>
      </div>
      <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);font-size:11.5px;color:var(--muted)">
        Kode WO terjadwal memakai awalan <b>SCH</b>, contoh: <code>SCH00032</code>
      </div>
    </div>
  </div>`;
}
function attachDashboard(){}

/* ========================================================
   WORK REQUEST
======================================================== */
function renderWR(){
  const rows = DB.workRequests.map(r=>`
    <tr>
      <td class="link" data-wr-detail="${r.id}">${r.id}</td>
      <td>${r.category}</td>
      <td>${r.asset}</td>
      <td>${r.location}</td>
      <td>${r.registerDate}</td>
      <td>${r.user}</td>
      <td>${r.activity}</td>
      <td>${badge(r.priority)}</td>
      <td>${badge(r.approvalState)}</td>
      <td>${badge(r.state)}</td>
      <td>
        ${r.approvalState==="Requested" ? `<button class="btn btn-sm btn-secondary" data-wr-action="check" data-id="${r.id}">Check</button>` : ""}
        ${r.approvalState==="Checked" ? `<button class="btn btn-sm btn-success" data-wr-action="approve" data-id="${r.id}">Approve</button> <button class="btn btn-sm btn-danger" data-wr-action="decline" data-id="${r.id}">Decline</button>` : ""}
        ${r.approvalState==="Approved" && r.state!=="Closed" ? `<button class="btn btn-sm btn-navy" data-wr-action="createwo" data-id="${r.id}">Create WO</button>` : ""}
        <button class="btn btn-sm btn-secondary" onclick="printTechnicalReport('${r.id}')">🖨 Print</button>
        <button class="btn btn-sm btn-danger" data-wr-delete="${r.id}">Hapus</button>
      </td>
    </tr>`).join("") || `<tr class="empty-row"><td colspan="11">Belum ada Work Request</td></tr>`;

  return `
  <div class="page-header">
    <div><h2>Work Request</h2><div class="desc">Daftar permintaan pekerjaan (scheduled / unscheduled) dari unit/lokasi.</div></div>
    <button class="btn btn-primary" id="btnNewWR">+ Buat Work Request</button>
  </div>
  <div class="table-wrap">
    <div class="table-toolbar">
      <select id="wrFilterState"><option value="">Semua Status</option><option>Requested</option><option>Checked</option><option>Approved</option><option>Declined</option></select>
      <input id="wrSearch" placeholder="Cari asset / deskripsi...">
      <div class="count">${DB.workRequests.length} data</div>
    </div>
    <table>
      <thead><tr><th>No</th><th>Category</th><th>Asset</th><th>Location</th><th>Register Date</th><th>User</th><th>Activity</th><th>Priority</th><th>Approval</th><th>State</th><th>Action</th></tr></thead>
      <tbody id="wrTbody">${rows}</tbody>
    </table>
  </div>`;
}
function attachWR(){
  document.getElementById("btnNewWR").onclick = ()=>{
    const assetOpts = DB.assets.map(a=>`<option value="${a.nkp}">${a.nkp} — ${a.category}</option>`).join("");
    openModal("Buat Work Request", `
      <div class="form-grid">
        <div class="form-row"><label>Asset</label><select id="f_asset">${assetOpts}</select></div>
        <div class="form-row"><label>Activity</label>
          <select id="f_activity"><option>Inspection_1B</option><option>Repair_2E</option><option>Replace Component_1E</option><option>Oiling_1G</option><option>PS_250_1A</option></select>
        </div>
        <div class="form-row"><label>Priority</label><select id="f_priority"><option>Low</option><option>Medium</option><option>High</option></select></div>
        <div class="form-row"><label>Jenis</label><select id="f_jenis"><option value="2">Unscheduled</option><option value="1">Scheduled</option></select></div>
      </div>
      <div class="form-row"><label>Deskripsi / Judul WR</label><textarea id="f_desc" placeholder="Jelaskan temuan / kebutuhan pekerjaan..."></textarea></div>
      <div class="hint">Asset Location &amp; Category otomatis terisi sesuai master asset.</div>
    `, ()=>{
      const nkp = document.getElementById("f_asset").value;
      const a = DB.assets.find(x=>x.nkp===nkp);
      const desc = document.getElementById("f_desc").value.trim();
      if(!desc){ showToast("Deskripsi wajib diisi"); return; }
      const id = nextId("WR",4);
      DB.workRequests.push({
        id, asset:nkp, category:a.category, location:a.location,
        registerDate: new Date().toISOString().slice(0,16).replace("T"," "),
        user:"Administrator", activity:document.getElementById("f_activity").value,
        priority:document.getElementById("f_priority").value, description:desc,
        approvalState:"Requested", state:"Requested"
      });
      saveDB(); closeModal(); showToast("Work Request "+id+" berhasil dibuat"); render();
    });
  };
  document.querySelectorAll("[data-wr-action]").forEach(btn=>{
    btn.onclick = ()=>{
      const r = DB.workRequests.find(x=>x.id===btn.dataset.id);
      const action = btn.dataset.wrAction;
      if(action==="check"){ r.approvalState="Checked"; showToast(r.id+" ditandai Checked"); }
      else if(action==="approve"){ r.approvalState="Approved"; r.state="Processed"; showToast(r.id+" disetujui"); }
      else if(action==="decline"){ r.approvalState="Declined"; r.state="Closed"; showToast(r.id+" ditolak"); }
      else if(action==="createwo"){
        const id = nextId("WO",0); const code = "SCH"+String(DB.counters.wo).padStart(5,"0");
        DB.workOrders.push({id:code, wrId:r.id, asset:r.asset, planner:"Planner Site", status:"Draft", type:"Unscheduled", createdDate:new Date().toISOString().slice(0,10)});
        r.state="Closed";
        showToast("Work Order "+code+" dibuat dari "+r.id);
      }
      saveDB(); render();
    };
  });
  document.querySelectorAll("[data-wr-detail]").forEach(el=>{
    el.onclick = ()=>{
      const r = DB.workRequests.find(x=>x.id===el.dataset.wrDetail);
      openModal("Detail "+r.id, `
        <div class="form-grid">
          <div class="form-row"><label>Asset</label><input value="${r.asset}" disabled></div>
          <div class="form-row"><label>Category</label><input value="${r.category}" disabled></div>
          <div class="form-row"><label>Location</label><input value="${r.location}" disabled></div>
          <div class="form-row"><label>Register Date</label><input value="${r.registerDate}" disabled></div>
          <div class="form-row"><label>Activity</label><input value="${r.activity}" disabled></div>
          <div class="form-row"><label>Priority</label><input value="${r.priority}" disabled></div>
        </div>
        <div class="form-row"><label>Deskripsi</label><textarea disabled>${escapeHtml(r.description)}</textarea></div>
      `, null, `<button class="btn btn-secondary" onclick="printTechnicalReport('${r.id}')">🖨 Print Technical Report</button>`);
    };
  });
  document.querySelectorAll("[data-wr-delete]").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.dataset.wrDelete;
      confirmDelete("Hapus Work Request "+id+"? Tindakan ini tidak bisa dibatalkan.", ()=>{
        DB.workRequests = DB.workRequests.filter(x=>x.id!==id);
        saveDB(); showToast("Work Request "+id+" dihapus"); render();
      });
    };
  });
}

/* ========================================================
   WORK ORDER
======================================================== */
function renderWO(){
  const rows = DB.workOrders.map(w=>`
    <tr>
      <td><b>${w.id}</b></td><td>${w.wrId||"-"}</td><td>${w.asset}</td><td>${w.type}</td><td>${w.planner}</td><td>${w.createdDate}</td>
      <td>${badge(w.status)}</td>
      <td>
        ${w.status==="Draft" ? `<button class="btn btn-sm btn-secondary" data-wo-action="confirm" data-id="${w.id}">Confirm</button>` : ""}
        ${w.status==="Confirmed" ? `<button class="btn btn-sm btn-navy" data-wo-action="submit" data-id="${w.id}">Submit</button>` : ""}
        ${w.status==="Submitted" ? `<button class="btn btn-sm btn-success" data-wo-action="approve" data-id="${w.id}">Approve</button>` : ""}
        ${w.status==="Approved" ? `<button class="btn btn-sm btn-secondary" data-wo-action="close" data-id="${w.id}">Close WO</button>` : ""}
        <button class="btn btn-sm btn-secondary" onclick="printWorkOrder('${w.id}')">🖨 Print</button>
        <button class="btn btn-sm btn-danger" data-wo-delete="${w.id}">Hapus</button>
      </td>
    </tr>`).join("") || `<tr class="empty-row"><td colspan="8">Belum ada Work Order. Buat melalui WR yang sudah Approved, dari Backlog / Schedule, atau buat manual.</td></tr>`;

  return `
  <div class="page-header">
    <div><h2>Work Order</h2><div class="desc">WO terbentuk dari WR (approved), Backlog, Maintenance Schedule, atau dibuat manual.</div></div>
    <button class="btn btn-primary" id="btnNewWO">+ Buat Work Order</button>
  </div>
  <div class="tabbar">
    <div class="tab active">All</div><div class="tab">Ready to Confirm</div><div class="tab">Closed</div>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>WO No.</th><th>Sumber WR</th><th>Asset</th><th>Type</th><th>Planner</th><th>Created</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}
function attachWO(){
  document.getElementById("btnNewWO").onclick = ()=>{
    openModal("Buat Work Order Manual", `
      <div class="form-grid">
        <div class="form-row"><label>Asset</label><select id="wo_asset">${DB.assets.map(a=>`<option value="${a.nkp}">${a.nkp} — ${a.category}</option>`).join("")}</select></div>
        <div class="form-row"><label>Type</label><select id="wo_type"><option>Unscheduled</option><option>Scheduled</option><option>Backlog</option></select></div>
        <div class="form-row"><label>Planner</label><input id="wo_planner" value="Planner Site"></div>
      </div>
    `, ()=>{
      const code = "WO"+String(++DB.counters.wo).padStart(5,"0");
      DB.workOrders.push({id:code, wrId:"-", asset:document.getElementById("wo_asset").value, planner:document.getElementById("wo_planner").value||"Planner Site",
        status:"Draft", type:document.getElementById("wo_type").value, createdDate:new Date().toISOString().slice(0,10)});
      saveDB(); closeModal(); showToast("Work Order "+code+" dibuat"); render();
    });
  };
  document.querySelectorAll("[data-wo-action]").forEach(btn=>{
    btn.onclick = ()=>{
      const w = DB.workOrders.find(x=>x.id===btn.dataset.id);
      const action = btn.dataset.woAction;
      const map = {confirm:"Confirmed", submit:"Submitted", approve:"Approved", close:"Closed"};
      w.status = map[action];
      saveDB(); showToast(w.id+" → "+w.status); render();
    };
  });
  document.querySelectorAll("[data-wo-delete]").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.dataset.woDelete;
      confirmDelete("Hapus Work Order "+id+"?", ()=>{
        DB.workOrders = DB.workOrders.filter(x=>x.id!==id);
        saveDB(); showToast("Work Order "+id+" dihapus"); render();
      });
    };
  });
}

/* ========================================================
   BACKLOG
======================================================== */
function renderBacklog(){
  const rows = DB.backlogs.map(b=>`
    <tr>
      <td>${b.id}</td><td>${b.date}</td><td>${b.nkp}</td><td>${fmtNum(b.hmkm)}</td>
      <td>${escapeHtml(b.problem)}</td><td>${escapeHtml(b.action)}</td>
      <td>${b.partName} (${b.partNumber})</td><td>${b.qty} ${b.unit}</td>
      <td>${badge(b.status)}</td><td>${b.mechanic||"-"}</td>
      <td>
        ${b.status==="Open" ? `<button class="btn btn-sm btn-success" data-bl-close="${b.id}">Tutup &amp; Buat WO</button>` : "✓"}
        <button class="btn btn-sm btn-danger" data-bl-delete="${b.id}">Hapus</button>
      </td>
    </tr>`).join("") || `<tr class="empty-row"><td colspan="11">Belum ada temuan backlog</td></tr>`;

  return `
  <div class="page-header">
    <div><h2>Backlog</h2><div class="desc">Temuan kerusakan/part recommendation yang menunggu tindak lanjut WO.</div></div>
    <button class="btn btn-primary" id="btnNewBL">+ Tambah Backlog</button>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>No</th><th>Date</th><th>NKP</th><th>HM/KM</th><th>Problem</th><th>Action</th><th>Part</th><th>Qty</th><th>Status</th><th>Mechanic</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}
function attachBacklog(){
  document.getElementById("btnNewBL").onclick = ()=>{
    const assetOpts = DB.assets.map(a=>`<option value="${a.nkp}">${a.nkp}</option>`).join("");
    openModal("Tambah Temuan Backlog", `
      <div class="form-grid">
        <div class="form-row"><label>NKP / Asset</label><select id="b_nkp">${assetOpts}</select></div>
        <div class="form-row"><label>HM/KM</label><input type="number" id="b_hmkm" placeholder="0"></div>
      </div>
      <div class="form-row"><label>Problem Description</label><textarea id="b_problem" placeholder="Deskripsikan temuan..."></textarea></div>
      <div class="form-row"><label>Action / Rekomendasi</label><textarea id="b_action"></textarea></div>
      <div class="form-grid">
        <div class="form-row"><label>Part Name</label><input id="b_partname" placeholder="Nama sparepart"></div>
        <div class="form-row"><label>Part Number</label><input id="b_partnumber" placeholder="Kode part"></div>
        <div class="form-row"><label>Qty</label><input type="number" id="b_qty" value="1"></div>
        <div class="form-row"><label>Unit</label><input id="b_unit" value="pcs"></div>
      </div>
    `, ()=>{
      const problem = document.getElementById("b_problem").value.trim();
      if(!problem){ showToast("Problem description wajib diisi"); return; }
      const id = nextId("BL",3);
      DB.backlogs.push({
        id, date:new Date().toISOString().slice(0,10), nkp:document.getElementById("b_nkp").value,
        hmkm:Number(document.getElementById("b_hmkm").value||0), problem,
        action:document.getElementById("b_action").value, partName:document.getElementById("b_partname").value,
        partNumber:document.getElementById("b_partnumber").value, qty:Number(document.getElementById("b_qty").value||1),
        unit:document.getElementById("b_unit").value, status:"Open", installDate:"", mechanic:""
      });
      saveDB(); closeModal(); showToast("Backlog "+id+" ditambahkan"); render();
    });
  };
  document.querySelectorAll("[data-bl-close]").forEach(btn=>{
    btn.onclick = ()=>{
      const b = DB.backlogs.find(x=>x.id===btn.dataset.blClose);
      b.status="Closed"; b.installDate=new Date().toISOString().slice(0,10); b.mechanic="Mekanik Shift 1";
      const code = "SCH"+String(++DB.counters.wo).padStart(5,"0");
      DB.workOrders.push({id:code, wrId:"-", asset:b.nkp, planner:"Planner Site", status:"Draft", type:"Backlog", createdDate:new Date().toISOString().slice(0,10)});
      saveDB(); showToast("Backlog ditutup, WO "+code+" dibuat"); render();
    };
  });
  document.querySelectorAll("[data-bl-delete]").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.dataset.blDelete;
      confirmDelete("Hapus backlog "+id+"?", ()=>{
        DB.backlogs = DB.backlogs.filter(x=>x.id!==id);
        saveDB(); showToast("Backlog "+id+" dihapus"); render();
      });
    };
  });
}

/* ========================================================
   MATERIAL REQUEST & WORK RECORDS (simple read views)
======================================================== */
function renderMR(){
  const rows = DB.materialRequests.map(m=>`<tr><td>${m.id}</td><td>${m.woId}</td><td>${m.partName}</td><td>${m.qty} ${m.unit}</td><td>${badge(m.status)}</td>
    <td><button class="btn btn-sm btn-danger" data-mr-delete="${m.id}">Hapus</button></td></tr>`).join("")
    || `<tr class="empty-row"><td colspan="6">Belum ada Material Request</td></tr>`;
  return `
  <div class="page-header">
    <div><h2>Material Request</h2><div class="desc">Permintaan sparepart yang terhubung dengan Work Order.</div></div>
    <button class="btn btn-primary" id="btnNewMR">+ Buat Material Request</button>
  </div>
  <div class="table-wrap"><table><thead><tr><th>No</th><th>WO</th><th>Part</th><th>Qty</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function attachMR(){
  document.getElementById("btnNewMR").onclick = ()=>{
    const woOpts = DB.workOrders.map(w=>`<option value="${w.id}">${w.id}</option>`).join("") || "<option>-</option>";
    openModal("Buat Material Request", `
      <div class="form-grid">
        <div class="form-row"><label>Work Order</label><select id="mr_wo">${woOpts}</select></div>
        <div class="form-row"><label>Status</label><select id="mr_status"><option>Requested</option><option>Issued</option></select></div>
      </div>
      <div class="form-grid">
        <div class="form-row"><label>Part Name</label><input id="mr_part" placeholder="Nama sparepart"></div>
        <div class="form-row"><label>Qty</label><input type="number" id="mr_qty" value="1"></div>
        <div class="form-row"><label>Unit</label><input id="mr_unit" value="pcs"></div>
      </div>
    `, ()=>{
      const part = document.getElementById("mr_part").value.trim();
      if(!part){ showToast("Nama part wajib diisi"); return; }
      const id = nextId("MR",3);
      DB.materialRequests.push({id, woId:document.getElementById("mr_wo").value, partName:part,
        qty:Number(document.getElementById("mr_qty").value||1), unit:document.getElementById("mr_unit").value, status:document.getElementById("mr_status").value});
      saveDB(); closeModal(); showToast("Material Request "+id+" dibuat"); render();
    });
  };
  document.querySelectorAll("[data-mr-delete]").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.dataset.mrDelete;
      confirmDelete("Hapus Material Request "+id+"?", ()=>{
        DB.materialRequests = DB.materialRequests.filter(x=>x.id!==id);
        saveDB(); showToast("Material Request "+id+" dihapus"); render();
      });
    };
  });
}
function renderRecords(){
  const closedWO = DB.workOrders.filter(w=>w.status==="Closed");
  const rows = closedWO.map(w=>`<tr><td>${w.id}</td><td>${w.asset}</td><td>${w.type}</td><td>${w.createdDate}</td><td>${badge(w.status)}</td></tr>`).join("")
    || `<tr class="empty-row"><td colspan="5">Belum ada riwayat WO selesai</td></tr>`;
  return `
  <div class="page-header"><div><h2>Work Records</h2><div class="desc">Riwayat Work Order yang telah selesai (closed).</div></div></div>
  <div class="table-wrap"><table><thead><tr><th>WO No.</th><th>Asset</th><th>Type</th><th>Tanggal</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

/* ========================================================
   MAINTENANCE PLANNING & SCHEDULING / WIZARD
======================================================== */
function renderPlanning(){
  const rows = DB.schedules.map(s=>`
    <tr><td>${s.id}</td><td>${s.asset}</td><td>${s.category}</td><td>${escapeHtml(s.activity)}</td><td>${s.interval}</td><td>${s.nextDate}</td><td>${badge(s.status)}</td>
    <td>
      ${s.status==="Scheduled" ? `<button class="btn btn-sm btn-navy" data-gen="${s.id}">Generate WO</button>` : "—"}
      <button class="btn btn-sm btn-danger" data-scd-delete="${s.id}">Hapus</button>
    </td></tr>`).join("")
    || `<tr class="empty-row"><td colspan="8">Belum ada rencana maintenance</td></tr>`;
  return `
  <div class="page-header">
    <div><h2>Maintenance Planning &amp; Scheduling</h2><div class="desc">Rencana perawatan berkala per asset. WO terjadwal memakai kode awalan <b>SCH</b>.</div></div>
    <button class="btn btn-primary" id="btnGoWizard">+ Schedule Wizard</button>
  </div>
  <div class="table-wrap">
    <table><thead><tr><th>No</th><th>Asset</th><th>Category</th><th>Activity</th><th>Interval</th><th>Next Date</th><th>Status</th><th>Action</th></tr></thead>
    <tbody>${rows}</tbody></table>
  </div>`;
}
function attachPlanning(){
  document.getElementById("btnGoWizard").onclick = ()=> navigate("wizard");
  document.querySelectorAll("[data-gen]").forEach(btn=>{
    btn.onclick = ()=>{
      const s = DB.schedules.find(x=>x.id===btn.dataset.gen);
      const code = "SCH"+String(++DB.counters.wo).padStart(5,"0");
      DB.workOrders.push({id:code, wrId:"-", asset:s.asset, planner:"Planner Site", status:"Draft", type:"Scheduled", createdDate:new Date().toISOString().slice(0,10)});
      showToast("WO "+code+" digenerate dari schedule "+s.id);
      saveDB(); render();
    };
  });
  document.querySelectorAll("[data-scd-delete]").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.dataset.scdDelete;
      confirmDelete("Hapus rencana "+id+"?", ()=>{
        DB.schedules = DB.schedules.filter(x=>x.id!==id);
        saveDB(); showToast("Rencana "+id+" dihapus"); render();
      });
    };
  });
}
function renderWizard(){
  return `
  <div class="page-header"><div><h2>Schedule Wizard</h2><div class="desc">Buat rencana maintenance berkala baru, langkah demi langkah.</div></div></div>
  <div class="panel" style="max-width:560px">
    <div class="form-row"><label>Asset</label><select id="w_asset">${DB.assets.map(a=>`<option value="${a.nkp}">${a.nkp} — ${a.category}</option>`).join("")}</select></div>
    <div class="form-row"><label>Jenis Aktivitas</label>
      <select id="w_activity"><option>Inspection Harian</option><option>Periodical Service 250 HM</option><option>Periodical Service 500 HM</option><option>Periodical Service 1000 HM</option></select>
    </div>
    <div class="form-grid">
      <div class="form-row"><label>Interval</label><select id="w_interval"><option>Setiap 10 hari</option><option>Setiap 250 HM</option><option>Setiap 500 HM</option><option>Setiap 1000 HM</option></select></div>
      <div class="form-row"><label>Tanggal Mulai</label><input type="date" id="w_date" value="${new Date().toISOString().slice(0,10)}"></div>
    </div>
    <button class="btn btn-primary" id="btnSaveWizard">Simpan Rencana</button>
  </div>`;
}
function attachWizard(){
  document.getElementById("btnSaveWizard").onclick = ()=>{
    const nkp = document.getElementById("w_asset").value;
    const a = DB.assets.find(x=>x.nkp===nkp);
    const id = nextId("SCD",3);
    DB.schedules.push({id, asset:nkp, category:a.category, activity:document.getElementById("w_activity").value,
      interval:document.getElementById("w_interval").value, nextDate:document.getElementById("w_date").value, status:"Scheduled"});
    saveDB(); showToast("Rencana "+id+" tersimpan"); navigate("planning");
  };
}

/* ========================================================
   ASSETS
======================================================== */
function renderAssetList(){
  const rows = DB.assets.map(a=>`<tr><td><b>${a.nkp}</b></td><td>${a.category}</td><td>${a.location}</td><td>${badge(a.status)}</td>
    <td><button class="btn btn-sm btn-danger" data-asset-delete="${a.nkp}">Hapus</button></td></tr>`).join("");
  return `
  <div class="page-header">
    <div><h2>Asset List</h2><div class="desc">Master data asset (sinkron dari sistem ERP setiap interval tertentu).</div></div>
    <button class="btn btn-primary" id="btnNewAsset">+ Tambah Asset</button>
  </div>
  <div class="table-wrap"><table><thead><tr><th>NKP</th><th>Category</th><th>Location</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function attachAssetList(){
  document.getElementById("btnNewAsset").onclick = ()=>{
    const categories = Object.keys(CHECKLIST_ITEMS);
    openModal("Tambah Asset", `
      <div class="form-grid">
        <div class="form-row"><label>NKP (Kode Asset)</label><input id="a_nkp" placeholder="contoh: GS-03"></div>
        <div class="form-row"><label>Category</label><select id="a_cat">${categories.map(c=>`<option>${c}</option>`).join("")}</select></div>
        <div class="form-row"><label>Location</label><input id="a_loc" placeholder="contoh: Plant Karawang"></div>
        <div class="form-row"><label>Status</label><select id="a_status"><option>Active</option><option>Standby</option><option>Breakdown</option></select></div>
      </div>
    `, ()=>{
      const nkp = document.getElementById("a_nkp").value.trim().toUpperCase();
      if(!nkp){ showToast("NKP wajib diisi"); return; }
      if(DB.assets.find(x=>x.nkp===nkp)){ showToast("NKP sudah terdaftar"); return; }
      DB.assets.push({nkp, category:document.getElementById("a_cat").value, location:document.getElementById("a_loc").value||"-", status:document.getElementById("a_status").value});
      saveDB(); closeModal(); showToast("Asset "+nkp+" ditambahkan"); render();
    });
  };
  document.querySelectorAll("[data-asset-delete]").forEach(btn=>{
    btn.onclick = ()=>{
      const nkp = btn.dataset.assetDelete;
      confirmDelete("Hapus asset "+nkp+"? Data terkait (WR/WO/Backlog) tidak otomatis terhapus.", ()=>{
        DB.assets = DB.assets.filter(x=>x.nkp!==nkp);
        saveDB(); showToast("Asset "+nkp+" dihapus"); render();
      });
    };
  });
}

function renderMeter(){
  const rows = DB.meterRecords.map((m,i)=>`<tr><td>${m.asset}</td><td>${m.type}</td><td>${fmtNum(m.value)}</td><td>${m.date}</td><td>${escapeHtml(m.description)}</td><td><button class="btn btn-sm btn-secondary" data-edit-meter="${i}">Edit</button> <button class="btn btn-sm btn-danger" data-del-meter="${i}">Hapus</button></td></tr>`).join("")
    || `<tr class="empty-row"><td colspan="6">Belum ada record</td></tr>`;
  return `
  <div class="page-header">
    <div><h2>Meter (HM/KM) Records</h2><div class="desc">Pencatatan akumulasi Hour Meter / Mileage per asset. Wajib isi tanggal &amp; waktu yang benar.</div></div>
    <button class="btn btn-primary" id="btnNewMeter">+ Input Meter</button>
  </div>
  <div class="table-wrap"><table><thead><tr><th>Asset</th><th>Type</th><th>Value</th><th>Date</th><th>Description</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function attachMeter(){
  document.getElementById("btnNewMeter").onclick = ()=>{
    openModal("Input Meter Record", `
      <div class="form-grid">
        <div class="form-row"><label>Asset</label><select id="m_asset">${DB.assets.map(a=>`<option value="${a.nkp}">${a.nkp}</option>`).join("")}</select></div>
        <div class="form-row"><label>Type</label><select id="m_type"><option>HM</option><option>KM</option></select></div>
        <div class="form-row"><label>Value</label><input type="number" id="m_value" placeholder="Akumulasi HM/KM"></div>
        <div class="form-row"><label>Date &amp; Time</label><input type="datetime-local" id="m_date" value="${new Date().toISOString().slice(0,16)}"></div>
      </div>
      <div class="form-row"><label>Description</label><input id="m_desc" placeholder="Catatan (opsional)"></div>
    `, ()=>{
      const value = Number(document.getElementById("m_value").value||0);
      if(!value){ showToast("Value wajib diisi"); return; }
      DB.meterRecords.push({asset:document.getElementById("m_asset").value, type:document.getElementById("m_type").value, value,
        date:document.getElementById("m_date").value.replace("T"," "), description:document.getElementById("m_desc").value});
      saveDB(); closeModal(); showToast("Meter record disimpan"); render();
    });
  };
  document.querySelectorAll("[data-edit-meter]").forEach(btn=>{
    btn.onclick = ()=>{
      const idx = Number(btn.dataset.editMeter); const m = DB.meterRecords[idx];
      openModal("Edit Meter Record", `
        <div class="form-row"><label>Value</label><input type="number" id="em_value" value="${m.value}"></div>
      `, ()=>{
        m.value = Number(document.getElementById("em_value").value||m.value);
        saveDB(); closeModal(); showToast("Meter record diperbarui"); render();
      });
    };
  });
  document.querySelectorAll("[data-del-meter]").forEach(btn=>{
    btn.onclick = ()=>{
      const idx = Number(btn.dataset.delMeter);
      confirmDelete("Hapus meter record ini?", ()=>{
        DB.meterRecords.splice(idx,1);
        saveDB(); showToast("Meter record dihapus"); render();
      });
    };
  });
}

function renderChangeStatus(){
  const rows = DB.assets.map((a,i)=>`<tr><td><b>${a.nkp}</b></td><td>${a.category}</td><td>${a.location}</td><td>${badge(a.status)}</td>
    <td><select data-status-idx="${i}"><option ${a.status==="Active"?"selected":""}>Active</option><option ${a.status==="Standby"?"selected":""}>Standby</option><option ${a.status==="Breakdown"?"selected":""}>Breakdown</option></select></td></tr>`).join("");
  return `
  <div class="page-header"><div><h2>Change Asset Status</h2><div class="desc">Ubah status operasional asset: Active / Standby / Breakdown.</div></div></div>
  <div class="table-wrap"><table><thead><tr><th>NKP</th><th>Category</th><th>Location</th><th>Status Saat Ini</th><th>Ubah Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function attachChangeStatus(){
  document.querySelectorAll("[data-status-idx]").forEach(sel=>{
    sel.onchange = ()=>{
      DB.assets[Number(sel.dataset.statusIdx)].status = sel.value;
      saveDB(); showToast("Status asset diperbarui"); render();
    };
  });
}

/* ========================================================
   CHECKSHEET (Inspection / Periodical Service)
======================================================== */
function renderChecksheet(kind){
  const categories = Object.keys(CHECKLIST_ITEMS);
  const title = kind==="inspection" ? "Inspection Checksheet" : "Periodical Service Checksheet";
  const dayCount = kind==="inspection" ? 10 : 1;
  const cat0 = categories[0];
  return `
  <div class="page-header"><div><h2>${title}</h2><div class="desc">${kind==="inspection" ? "Checklist harian per komponen (checking number 1–10)." : "Checklist saat dilakukan periodical service berdasarkan HM/interval."}</div></div></div>
  <div class="panel">
    <div class="cs-meta">
      <div class="f"><label>Category</label><select id="cs_cat">${categories.map(c=>`<option ${c===cat0?"selected":""}>${c}</option>`).join("")}</select></div>
      <div class="f"><label>Asset (NKP)</label><select id="cs_asset"></select></div>
      <div class="f"><label>Location</label><input id="cs_loc" disabled></div>
      <div class="f"><label>Date</label><input type="date" id="cs_date" value="${new Date().toISOString().slice(0,10)}"></div>
    </div>
    <div style="overflow-x:auto">
      <table class="cs-table" id="csTable"></table>
    </div>
    <div style="margin-top:14px;display:flex;gap:8px;justify-content:flex-end">
      <button class="btn btn-secondary" id="btnAllOk">Tandai Semua OK</button>
      <button class="btn btn-primary" id="btnSaveCs">Simpan Checksheet</button>
    </div>
  </div>
  <div id="csHistory" style="margin-top:18px"></div>`;
}
function csBuildTable(kind){
  const cat = document.getElementById("cs_cat").value;
  const items = CHECKLIST_ITEMS[cat][kind];
  const dayCount = kind==="inspection" ? 10 : 1;
  const head = kind==="inspection"
    ? `<tr><th>No</th><th>Component Item Check</th>${Array.from({length:dayCount},(_,i)=>`<th>Day ${i+1}</th>`).join("")}</tr>`
    : `<tr><th>No</th><th>Component Item Check</th><th>Result</th><th>Note</th></tr>`;
  const body = items.map((it,i)=> kind==="inspection"
    ? `<tr><td>${i+1}</td><td>${it}</td>${Array.from({length:dayCount},(_,d)=>`<td><select class="ok" data-row="${i}" data-col="${d}"><option>OK</option><option>NG</option><option>N/A</option></select></td>`).join("")}</tr>`
    : `<tr><td>${i+1}</td><td>${it}</td><td><select class="ok" data-row="${i}"><option>OK</option><option>Adjust</option><option>Replace</option><option>NG</option></select></td><td><input data-note="${i}" placeholder="catatan"></td></tr>`
  ).join("");
  document.getElementById("csTable").innerHTML = `<thead>${head}</thead><tbody>${body}</tbody>`;
}
function attachChecksheet(kind){
  function refreshAssetOptions(){
    const cat = document.getElementById("cs_cat").value;
    const assets = DB.assets.filter(a=>a.category===cat);
    document.getElementById("cs_asset").innerHTML = assets.map(a=>`<option value="${a.nkp}">${a.nkp}</option>`).join("") || "<option>-</option>";
    const a0 = assets[0];
    document.getElementById("cs_loc").value = a0 ? a0.location : "-";
  }
  document.getElementById("cs_cat").onchange = ()=>{ refreshAssetOptions(); csBuildTable(kind); };
  document.getElementById("cs_asset").addEventListener("change", ()=>{
    const a = DB.assets.find(x=>x.nkp===document.getElementById("cs_asset").value);
    document.getElementById("cs_loc").value = a ? a.location : "-";
  });
  refreshAssetOptions();
  csBuildTable(kind);

  document.getElementById("btnAllOk").onclick = ()=>{
    document.querySelectorAll("#csTable select.ok").forEach(s=> s.value = "OK");
  };
  document.getElementById("btnSaveCs").onclick = ()=>{
    const cat = document.getElementById("cs_cat").value;
    const asset = document.getElementById("cs_asset").value;
    const date = document.getElementById("cs_date").value;
    const results = [];
    document.querySelectorAll("#csTable select.ok").forEach(s=>{
      results.push({row:s.dataset.row, col:s.dataset.col||0, value:s.value});
    });
    DB.checksheets.push({id:"CS-"+Date.now(), kind, category:cat, asset, date, results});
    saveDB(); showToast("Checksheet "+cat+" / "+asset+" tersimpan"); renderCsHistory(kind);
  };
  renderCsHistory(kind);
}
function renderCsHistory(kind){
  const list = DB.checksheets.filter(c=>c.kind===kind).slice(-6).reverse();
  const rows = list.map(c=>`<tr><td>${c.id.replace("CS-","")}</td><td>${c.category}</td><td>${c.asset}</td><td>${c.date}</td><td>${badge("Closed")}</td>
    <td><button class="btn btn-sm btn-danger" data-cs-delete="${c.id}">Hapus</button></td></tr>`).join("")
    || `<tr class="empty-row"><td colspan="6">Belum ada riwayat checksheet</td></tr>`;
  document.getElementById("csHistory").innerHTML = `
    <div class="panel"><h3>Riwayat Checksheet Terakhir</h3>
    <table><thead><tr><th>Timestamp</th><th>Category</th><th>Asset</th><th>Date</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
  document.querySelectorAll("[data-cs-delete]").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.dataset.csDelete;
      confirmDelete("Hapus riwayat checksheet ini?", ()=>{
        DB.checksheets = DB.checksheets.filter(x=>x.id!==id);
        saveDB(); showToast("Riwayat checksheet dihapus"); renderCsHistory(kind);
      });
    };
  });
}

/* ========================================================
   REPORTS
======================================================== */
function renderReportBreakdown(){
  const rows = DB.workRequests.filter(r=>r.activity.startsWith("Repair")).map(r=>`
    <tr><td>${r.registerDate.slice(0,10)}</td><td>${r.asset}</td><td>${r.category}</td><td>${escapeHtml(r.description)}</td><td>${badge(r.state)}</td></tr>`).join("")
    || `<tr class="empty-row"><td colspan="5">Tidak ada breakdown tercatat</td></tr>`;
  return reportShell("Daily Breakdown Report","Rekap kerusakan (breakdown) harian per asset.",
    `<thead><tr><th>Tanggal</th><th>Asset</th><th>Category</th><th>Problem</th><th>Status</th></tr></thead><tbody>${rows}</tbody>`,"breakdown");
}
function renderReportTechnical(){
  const rows = DB.backlogs.map(b=>`<tr><td>${b.date}</td><td>${b.nkp}</td><td>${fmtNum(b.hmkm)}</td><td>${escapeHtml(b.problem)}</td><td>${escapeHtml(b.action)}</td><td>${b.mechanic||"-"}</td></tr>`).join("")
    || `<tr class="empty-row"><td colspan="6">Belum ada data technical report</td></tr>`;
  return reportShell("Technical Report","Detail teknis pekerjaan (problem, action, mechanic) per asset.",
    `<thead><tr><th>Tanggal</th><th>NKP</th><th>HM/KM</th><th>Problem</th><th>Action</th><th>Mechanic</th></tr></thead><tbody>${rows}</tbody>`,"technical");
}
function renderReportOperator(){
  const rows = DB.operatorReports.map(o=>`
    <tr><td>${o.date}</td><td>${o.asset}</td><td>${assetCategoryOf(o.asset)}</td><td>${o.operator}</td><td>${o.shift}</td>
    <td>${o.meterType} ${fmtNum(o.meterValue)}</td><td>${fmtNum(o.fuel)} L</td><td>${escapeHtml(o.activity)}</td><td>${escapeHtml(o.remarks)}</td>
    <td>
      <button class="btn btn-sm btn-secondary" onclick="printOperatorReport('${o.id}')">🖨 Print</button>
      <button class="btn btn-sm btn-danger" data-opr-delete="${o.id}">Hapus</button>
    </td></tr>`).join("")
    || `<tr class="empty-row"><td colspan="10">Belum ada laporan harian alat &amp; operator</td></tr>`;
  return `
  <div class="page-header">
    <div><h2>Daily Report Alat &amp; Operator</h2><div class="desc">Laporan harian penggunaan alat oleh operator (HM/KM, BBM, aktivitas).</div></div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-secondary" onclick="printOperatorReport()">🖨 Print Semua</button>
      <button class="btn btn-primary" id="btnNewOpr">+ Buat Laporan</button>
    </div>
  </div>
  <div class="table-wrap"><table id="reportTable_operator">
    <thead><tr><th>Tanggal</th><th>Asset</th><th>Category</th><th>Operator</th><th>Shift</th><th>Meter</th><th>BBM</th><th>Aktivitas</th><th>Catatan</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>`;
}
function attachReportOperator(){
  document.getElementById("btnNewOpr").onclick = ()=>{
    openModal("Buat Laporan Harian Alat &amp; Operator", `
      <div class="form-grid">
        <div class="form-row"><label>Tanggal</label><input type="date" id="o_date" value="${new Date().toISOString().slice(0,10)}"></div>
        <div class="form-row"><label>Asset</label><select id="o_asset">${DB.assets.map(a=>`<option value="${a.nkp}">${a.nkp} — ${a.category}</option>`).join("")}</select></div>
        <div class="form-row"><label>Operator</label><input id="o_operator" placeholder="Nama operator"></div>
        <div class="form-row"><label>Shift</label><select id="o_shift"><option>Shift 1</option><option>Shift 2</option><option>Shift 3</option></select></div>
        <div class="form-row"><label>Meter Type</label><select id="o_metertype"><option>HM</option><option>KM</option></select></div>
        <div class="form-row"><label>Meter Value</label><input type="number" id="o_meterval" placeholder="0"></div>
        <div class="form-row"><label>BBM (Liter)</label><input type="number" id="o_fuel" placeholder="0"></div>
      </div>
      <div class="form-row"><label>Aktivitas</label><textarea id="o_activity" placeholder="Deskripsikan aktivitas alat hari ini..."></textarea></div>
      <div class="form-row"><label>Catatan</label><input id="o_remarks" placeholder="Normal / ada kendala, dsb"></div>
    `, ()=>{
      const operator = document.getElementById("o_operator").value.trim();
      if(!operator){ showToast("Nama operator wajib diisi"); return; }
      const id = nextId("OPR",3);
      DB.operatorReports.push({
        id, date:document.getElementById("o_date").value, asset:document.getElementById("o_asset").value,
        operator, shift:document.getElementById("o_shift").value, meterType:document.getElementById("o_metertype").value,
        meterValue:Number(document.getElementById("o_meterval").value||0), fuel:Number(document.getElementById("o_fuel").value||0),
        activity:document.getElementById("o_activity").value, remarks:document.getElementById("o_remarks").value
      });
      saveDB(); closeModal(); showToast("Laporan "+id+" disimpan"); render();
    });
  };
  document.querySelectorAll("[data-opr-delete]").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.dataset.oprDelete;
      confirmDelete("Hapus laporan "+id+"?", ()=>{
        DB.operatorReports = DB.operatorReports.filter(x=>x.id!==id);
        saveDB(); showToast("Laporan "+id+" dihapus"); render();
      });
    };
  });
}
function printOperatorReport(oprId){
  const list = oprId ? DB.operatorReports.filter(o=>o.id===oprId) : DB.operatorReports;
  const rowsHtml = list.map(o=>`<tr><td>${o.date}</td><td>${o.asset}</td><td>${assetCategoryOf(o.asset)}</td><td>${o.operator}</td><td>${o.shift}</td><td>${o.meterType} ${fmtNum(o.meterValue)}</td><td>${fmtNum(o.fuel)} L</td><td>${escapeHtml(o.activity)}</td><td>${escapeHtml(o.remarks)}</td></tr>`).join("");
  const html = `
    <h1>LAPORAN HARIAN ALAT &amp; OPERATOR</h1>
    <div class="ph-sub">${oprId ? "No. Laporan: "+oprId : "Rekap seluruh laporan — "+new Date().toLocaleDateString("id-ID")}</div>
    <table>
      <thead><tr><th>Tanggal</th><th>Asset</th><th>Category</th><th>Operator</th><th>Shift</th><th>Meter</th><th>BBM</th><th>Aktivitas</th><th>Catatan</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <div class="sign">
      <div>Operator<div class="line">&nbsp;</div></div>
      <div>Diperiksa oleh<div class="line">&nbsp;</div></div>
      <div>Disetujui oleh<div class="line">&nbsp;</div></div>
    </div>`;
  openPrintWindow(html, "Daily Report Alat & Operator");
}
function reportShell(title, desc, tableInner, key){
  return `
  <div class="page-header">
    <div><h2>${title}</h2><div class="desc">${desc}</div></div>
    <button class="btn btn-secondary" onclick="exportTableCsv('${key}')">⬇ Export CSV</button>
  </div>
  <div class="table-wrap"><table id="reportTable_${key}">${tableInner}</table></div>`;
}
function renderExport(){
  return `
  <div class="page-header"><div><h2>Export Custom Report</h2><div class="desc">Pilih dataset dan rentang untuk diekspor ke CSV/Excel.</div></div></div>
  <div class="panel" style="max-width:520px">
    <div class="form-row"><label>Dataset</label>
      <select id="ex_dataset"><option value="workRequests">Work Request</option><option value="workOrders">Work Order</option><option value="backlogs">Backlog</option><option value="materialRequests">Material Request</option><option value="schedules">Maintenance Schedule</option><option value="meterRecords">Meter Records</option><option value="operatorReports">Daily Report Alat & Operator</option><option value="assets">Asset List</option></select>
    </div>
    <button class="btn btn-primary" id="btnExportNow">⬇ Export ke CSV</button>
  </div>`;
}
function attachExport(){
  document.getElementById("btnExportNow").onclick = ()=>{
    const key = document.getElementById("ex_dataset").value;
    const data = DB[key];
    if(!data || !data.length){ showToast("Tidak ada data untuk diekspor"); return; }
    downloadCsv(key, data);
  };
}
function downloadCsv(name, arr){
  const cols = Object.keys(arr[0]);
  const csv = [cols.join(",")].concat(arr.map(row=> cols.map(c=> JSON.stringify(row[c]===undefined?"":row[c])).join(","))).join("\n");
  const blob = new Blob([csv], {type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "MAINTENANCE_BCR_"+name+".csv"; a.click();
  URL.revokeObjectURL(url);
  showToast("Export "+name+".csv berhasil");
}
function exportTableCsv(key){
  const table = document.getElementById("reportTable_"+key);
  if(!table) return;
  const rows = Array.from(table.querySelectorAll("tr")).map(tr=>
    Array.from(tr.children).map(td=> '"'+td.textContent.replace(/"/g,'""')+'"').join(",")
  ).join("\n");
  const blob = new Blob([rows], {type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "MAINTENANCE_BCR_report_"+key+".csv"; a.click();
  URL.revokeObjectURL(url);
  showToast("Report di-export ke CSV");
}

/* ========================================================
   INIT
======================================================== */
/* ========================================================
   AUTH (Supabase Auth)
======================================================== */
function showLoginScreen(msg){
  document.getElementById("loginScreen").style.display = "flex";
  document.getElementById("app").style.display = "none";
  const err = document.getElementById("loginError");
  if(msg){ err.textContent = msg; err.style.display = "block"; }
  else { err.style.display = "none"; }
}
function hideLoginScreen(){
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("app").style.display = "flex";
}
async function handleLogin(){
  const email = document.getElementById("login_email").value.trim();
  const password = document.getElementById("login_password").value;
  if(!email || !password){ showLoginScreen("Email dan password wajib diisi"); return; }
  const btn = document.getElementById("btnLogin");
  btn.disabled = true; btn.textContent = "Memproses...";
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  btn.disabled = false; btn.textContent = "Masuk";
  if(error){ showLoginScreen("Login gagal: email atau password salah"); return; }
  await onLoginSuccess(data.user);
}
async function onLoginSuccess(user){
  currentUser = user;
  try{
    const { data: profile } = await supabaseClient.from("profiles").select("name, role").eq("id", user.id).maybeSingle();
    currentProfile = (profile && profile.name) ? profile : { name: user.email, role: "Viewer" };
  }catch(e){
    currentProfile = { name: user.email, role: "Viewer" };
  }
  hideLoginScreen();
  await startApp();
}
function updateUserBadge(){
  const el = document.getElementById("avatarBtn");
  if(!el || !currentProfile) return;
  el.textContent = (currentProfile.name||"?").trim().charAt(0).toUpperCase();
}
function openAccountModal(){
  openModal("Akun Saya", `
    <div class="form-row"><label>Nama</label><input value="${escapeHtml(currentProfile?.name||"-")}" disabled></div>
    <div class="form-row"><label>Role</label><input value="${escapeHtml(currentProfile?.role||"-")}" disabled></div>
    <div class="form-row"><label>Email</label><input value="${escapeHtml(currentUser?.email||"-")}" disabled></div>
  `, null, `<button class="btn btn-danger" id="btnLogout">Logout</button>`);
  document.getElementById("btnLogout").onclick = async ()=>{
    await supabaseClient.auth.signOut();
    closeModal();
    currentUser = null; currentProfile = null;
    showLoginScreen();
  };
}

/* ========================================================
   INIT
======================================================== */
async function startApp(){
  buildMenu();
  await loadDB();
  navigate("dashboard");
  updateUserBadge();
  const avatarBtn = document.getElementById("avatarBtn");
  if(avatarBtn) avatarBtn.onclick = openAccountModal;
  document.getElementById("modalOverlay").addEventListener("click", (e)=>{
    if(e.target.id==="modalOverlay") closeModal();
  });
  const btnRefresh = document.getElementById("btnRefresh");
  if(btnRefresh) btnRefresh.onclick = refreshFromBackend;
  const btnHamburger = document.getElementById("btnHamburger");
  if(btnHamburger) btnHamburger.onclick = openSidebarMobile;
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");
  if(sidebarBackdrop) sidebarBackdrop.onclick = closeSidebarMobile;

  if(BACKEND_ENABLED){
    // auto-sync ringan tiap 20 detik supaya perubahan dari user lain ikut tampil,
    // tapi dilewati kalau ada modal yang sedang terbuka (biar tidak ganggu input)
    setInterval(async ()=>{
      const overlay = document.getElementById("modalOverlay");
      if(overlay && overlay.classList.contains("show")) return;
      await loadDB();
      render();
    }, 20000);
  }
}
async function init(){
  if(BACKEND_ENABLED && supabaseClient){
    document.getElementById("btnLogin").onclick = handleLogin;
    document.getElementById("login_password").addEventListener("keydown", (e)=>{ if(e.key==="Enter") handleLogin(); });
    const { data } = await supabaseClient.auth.getSession();
    if(data && data.session){
      await onLoginSuccess(data.session.user);
    } else {
      showLoginScreen();
    }
    supabaseClient.auth.onAuthStateChange((event)=>{
      if(event === "SIGNED_OUT"){ showLoginScreen(); }
    });
  } else {
    // backend belum dikonfigurasi: skip login, langsung jalan mode lokal
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("app").style.display = "flex";
    await startApp();
  }
}
init();

/* ---------- PWA: registrasi service worker ---------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((e) => console.error("SW register failed:", e));
  });
}
