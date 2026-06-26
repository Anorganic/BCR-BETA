/* =========================================================
   MAINTENANCE BCR — front-end prototype (web)
   Mengikuti flow Work Request -> Work Order -> Backlog ->
   Approval -> Checksheet -> Report, sesuai dokumentasi flow.
   Data disimpan via window.storage (per-user, in-browser).
========================================================= */

const STORE_KEY = "bcr_app_data_v1";
let DB = null;
let currentRoute = "dashboard";
let modalSubmitHandler = null;

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
    checksheets:[],
    counters:{wr:5, wo:33, bl:3, mr:2, scd:3},
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

/* ---------- storage ---------- */
async function loadDB(){
  try{
    const res = await window.storage.get(STORE_KEY, false);
    if(res && res.value){ DB = JSON.parse(res.value); return; }
  }catch(e){ /* not found */ }
  DB = seedData();
  await saveDB();
}
async function saveDB(){
  try{ await window.storage.set(STORE_KEY, JSON.stringify(DB), false); }
  catch(e){ console.error("storage error", e); }
}
function nextId(prefix, padLen){
  const map = {WR:"wr", WO:"wo", BL:"bl", MR:"mr", SCD:"scd"};
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
    case "mr": c.innerHTML = renderMR(); break;
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
    case "rep_operator": c.innerHTML = renderReportOperator(); break;
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
      `, null, '<span></span>');
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
      </td>
    </tr>`).join("") || `<tr class="empty-row"><td colspan="8">Belum ada Work Order. Buat melalui WR yang sudah Approved, atau dari Backlog / Schedule.</td></tr>`;

  return `
  <div class="page-header">
    <div><h2>Work Order</h2><div class="desc">WO terbentuk dari WR (approved), Backlog, atau Maintenance Schedule.</div></div>
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
  document.querySelectorAll("[data-wo-action]").forEach(btn=>{
    btn.onclick = ()=>{
      const w = DB.workOrders.find(x=>x.id===btn.dataset.id);
      const action = btn.dataset.woAction;
      const map = {confirm:"Confirmed", submit:"Submitted", approve:"Approved", close:"Closed"};
      w.status = map[action];
      saveDB(); showToast(w.id+" → "+w.status); render();
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
      <td>${b.status==="Open" ? `<button class="btn btn-sm btn-success" data-bl-close="${b.id}">Tutup &amp; Buat WO</button>` : "✓"}</td>
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
}

/* ========================================================
   MATERIAL REQUEST & WORK RECORDS (simple read views)
======================================================== */
function renderMR(){
  const rows = DB.materialRequests.map(m=>`<tr><td>${m.id}</td><td>${m.woId}</td><td>${m.partName}</td><td>${m.qty} ${m.unit}</td><td>${badge(m.status)}</td></tr>`).join("")
    || `<tr class="empty-row"><td colspan="5">Belum ada Material Request</td></tr>`;
  return `
  <div class="page-header"><div><h2>Material Request</h2><div class="desc">Permintaan sparepart yang terhubung dengan Work Order.</div></div></div>
  <div class="table-wrap"><table><thead><tr><th>No</th><th>WO</th><th>Part</th><th>Qty</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
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
    <td>${s.status==="Scheduled" ? `<button class="btn btn-sm btn-navy" data-gen="${s.id}">Generate WO</button>` : "—"}</td></tr>`).join("")
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
  const rows = DB.assets.map(a=>`<tr><td><b>${a.nkp}</b></td><td>${a.category}</td><td>${a.location}</td><td>${badge(a.status)}</td></tr>`).join("");
  return `
  <div class="page-header"><div><h2>Asset List</h2><div class="desc">Master data asset (sinkron dari sistem ERP setiap interval tertentu).</div></div></div>
  <div class="table-wrap"><table><thead><tr><th>NKP</th><th>Category</th><th>Location</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function attachAssetList(){}

function renderMeter(){
  const rows = DB.meterRecords.map((m,i)=>`<tr><td>${m.asset}</td><td>${m.type}</td><td>${fmtNum(m.value)}</td><td>${m.date}</td><td>${escapeHtml(m.description)}</td><td><button class="btn btn-sm btn-secondary" data-edit-meter="${i}">Edit</button></td></tr>`).join("")
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
  const rows = list.map(c=>`<tr><td>${c.id.replace("CS-","")}</td><td>${c.category}</td><td>${c.asset}</td><td>${c.date}</td><td>${badge("Closed")}</td></tr>`).join("")
    || `<tr class="empty-row"><td colspan="5">Belum ada riwayat checksheet</td></tr>`;
  document.getElementById("csHistory").innerHTML = `
    <div class="panel"><h3>Riwayat Checksheet Terakhir</h3>
    <table><thead><tr><th>Timestamp</th><th>Category</th><th>Asset</th><th>Date</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
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
  const rows = DB.meterRecords.map(m=>`<tr><td>${m.date.slice(0,10)}</td><td>${m.asset}</td><td>${assetCategoryOf(m.asset)}</td><td>${m.type}</td><td>${fmtNum(m.value)}</td><td>${escapeHtml(m.description)}</td></tr>`).join("")
    || `<tr class="empty-row"><td colspan="6">Belum ada laporan harian alat</td></tr>`;
  return reportShell("Daily Report Alat & Operator","Laporan harian penggunaan alat oleh operator (HM/KM &amp; catatan).",
    `<thead><tr><th>Tanggal</th><th>Asset</th><th>Category</th><th>Meter</th><th>Value</th><th>Catatan</th></tr></thead><tbody>${rows}</tbody>`,"operator");
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
      <select id="ex_dataset"><option value="workRequests">Work Request</option><option value="workOrders">Work Order</option><option value="backlogs">Backlog</option><option value="meterRecords">Meter Records</option><option value="assets">Asset List</option></select>
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
async function init(){
  buildMenu();
  await loadDB();
  navigate("dashboard");
  document.getElementById("modalOverlay").addEventListener("click", (e)=>{
    if(e.target.id==="modalOverlay") closeModal();
  });
}
init();