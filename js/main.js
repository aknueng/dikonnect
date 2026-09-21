(function(){
  "use strict";

  function escapeHtml(s){
    return String(s == null ? "" : s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }
  const PERSON_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8.2" r="3.4" stroke="currentColor" stroke-width="1.8"/><path d="M5.4 19.4c.9-3.1 3.5-4.8 6.6-4.8s5.7 1.7 6.6 4.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  /* ---------- session: profile, logout, roles ---------- */
  let session = null;
  try { session = JSON.parse(sessionStorage.getItem("dikonnect.session")); } catch(e){}
  if (!session){
    try { window.location.replace("index.html"); } catch(e){}
  } else {
    document.getElementById("userName").textContent =
      session.fullname || session.displayName || session.username || "Guest";
    document.getElementById("userRole").textContent =
      [session.role, session.country].filter(Boolean).join(" · ") || "—";
  }
  function doLogout(){
    try { sessionStorage.removeItem("dikonnect.session"); } catch(e){}
    try { window.location.href = "index.html"; } catch(e){}
  }
  document.getElementById("logoutBtn").addEventListener("click", doLogout);
  document.getElementById("menuLogoutBtn").addEventListener("click", doLogout);

  /* only employees see Dashboard and Report */
  const isEmployee = !!session && session.role === "employee";
  if (!isEmployee){
    document.querySelectorAll("#tabNav .emp-only").forEach(b => b.classList.add("hidden-role"));
  }

  const me = {
    name: (session && (session.fullname || session.displayName || session.username)) || "Guest",
    company: (session && session.displayName) || "",
    country: (session && session.country) || ""
  };
  document.getElementById("postingAs").value =
    me.name + (me.company && me.company !== me.name ? " — " + me.company : "");

  /* ---------- navigation ---------- */
  const tabNav = document.getElementById("tabNav");
  const navToggle = document.getElementById("navToggle");
  navToggle.addEventListener("click", ()=>{
    const open = tabNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.querySelectorAll("#tabNav button[data-view]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll("#tabNav button[data-view]").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
      document.getElementById("view-"+btn.dataset.view).classList.add("active");
      tabNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- print helper ---------- */
  function printView(viewId){
    const v = document.getElementById(viewId);
    v.classList.add("printing");
    window.print();
    setTimeout(()=>v.classList.remove("printing"), 300);
  }

  /* ================================================================
     1. DEALER DIALOGUE
     ================================================================ */
  const CATEGORIES = ["Installation","Service & Errors","Parts & Piping","General"];

  /* Threads come from sources/db_dialogues.json; this fallback copy is
     used when the page is opened via file:// where fetch() is blocked. */
  const FALLBACK_DIALOGUES = [
    { title:"Sharing: bracket jig for high-wall units — cut install time by ~15 min",
      body:"We made a simple alignment jig for marking high-wall bracket holes — level, drill points and sleeve centre in one template. It has saved us roughly 15 minutes per install. Photos attached, happy to share the dimensions.",
      author:"Mr.Saige Fuentes", company:"Bangkok Air Service Co., Ltd.", country:"Thailand",
      category:"Installation", date:"2026-05-18", status:"answered", image:"sources/img/001.png",
      replies:[{ author:"Mr.Marceline Avila", company:"Daikin Australia Pty. Ltd.", country:"Australia", date:"2026-05-20",
        text:"Nice work — we laser-cut a similar template from 3 mm acrylic. Would you mind posting the hole spacing you used for the FTXM series?" }] },
    { title:"Pipe sizing for FCA100CVMA on a 35 m run — confirm Ø9.5 / Ø15.9?",
      body:"Long run from a shop floor cassette to a rooftop condenser (about 35 m equivalent length, 12 m height difference). Am I right that the FCA100CVMA stays on Ø9.5 mm liquid / Ø15.9 mm gas, and do I need an additional refrigerant charge?",
      author:"Mr.Bowen Higgins", company:"Merlion HVAC Solutions Pte. Ltd.", country:"Singapore",
      category:"Parts & Piping", date:"2026-06-30", status:"answered", image:"sources/img/004.jpg",
      replies:[{ author:"Mr.Kylan Gentry", company:"Daikin Airconditioning Vietnam JSC", country:"Viet Nam", date:"2026-07-01",
        text:"Correct sizes — Ø9.5 liquid / Ø15.9 gas. Beyond 30 m you add refrigerant per the charge table in the installation manual. Watch the oil-trap spacing on the vertical riser." }] },
    { title:"Error E4 on RXM20UVMZ after a storm — diagnosis steps?",
      body:"Customer's RXM20UVMZ trips on E4 after heavy rain, resets, then trips again within the hour. Before I head out tomorrow — what's your go-to diagnosis order for this one?",
      author:"Mr.Marceline Avila", company:"Daikin Australia Pty. Ltd.", country:"Australia",
      category:"Service & Errors", date:"2026-07-22", status:"answered",
      replies:[{ author:"Mr.Saige Fuentes", company:"Bangkok Air Service Co., Ltd.", country:"Thailand", date:"2026-07-23",
        text:"After storms I always check the outdoor PCB and the pressure-switch connector for moisture first — dry it out and retest before touching refrigerant. Pichon-kun will give you the full E4 procedure from the service manual." }] },
    { title:"Unusual install: condensation behind the mounting plate on a double-brick heritage wall",
      body:"We're installing an FTXM25UVMZ on a double-brick heritage wall and in the wet season condensation forms behind the mounting plate, staining the paint. Has anyone encountered something similar?",
      author:"Mr.Saige Fuentes", company:"Bangkok Air Service Co., Ltd.", country:"Thailand",
      category:"Installation", date:"2026-08-05", status:"answered", image:"sources/img/002.jpg",
      replies:[
        { author:"Mr.Bowen Higgins", company:"Merlion HVAC Solutions Pte. Ltd.", country:"Singapore", date:"2026-08-06",
          text:"We hit exactly this on old shophouse walls. We now fit a 6 mm spacer frame behind the mounting plate so air can circulate, and seal the wall penetration with closed-cell foam. No call-backs since." },
        { author:"Mr.Kylan Gentry", company:"Daikin Airconditioning Vietnam JSC", country:"Viet Nam", date:"2026-08-07",
          text:"+1 on the spacer frame. Also re-check that the wall sleeve slopes outward — on two of our jobs the 'wall condensation' was actually drain water tracking back through a level sleeve." }] },
    { title:"Coastal sites: how do you set customer expectations on corrosion and warranty?",
      body:"We install a lot within 500 m of the beach. Even with anti-corrosion treatment, coastal units age faster and customers push back at warranty time. How do other dealers word this up front?",
      author:"Mr.Kylan Gentry", company:"Daikin Airconditioning Vietnam JSC", country:"Viet Nam",
      category:"General", date:"2026-09-02", status:"open", image:"sources/img/005.jpg", replies:[] }
  ];

  let threads = [];
  let seq = 0;
  function setThreads(list){
    seq = 0;
    threads = list.map(t => Object.assign({ replies: [] }, t, { id: ++seq }));
  }

  let dlgFilter = "All";
  let dlgQuery = "";

  function renderDlgFilters(){
    const all = ["All", ...CATEGORIES];
    document.getElementById("dlgFilters").innerHTML = all.map(c =>
      `<button data-cat="${escapeHtml(c)}" class="${c===dlgFilter?'active':''}">${escapeHtml(c)}</button>`
    ).join("");
    document.querySelectorAll("#dlgFilters button").forEach(btn=>{
      btn.addEventListener("click", ()=>{ dlgFilter = btn.dataset.cat; renderDlgFilters(); renderThreads(); });
    });
  }

  function threadMatches(t, q){
    if (!q) return true;
    const hay = (t.title + " " + t.body + " " + t.author + " " + t.country + " " +
      (t.replies||[]).map(r => r.text + " " + r.author).join(" ")).toLowerCase();
    return hay.includes(q);
  }

  function renderThreads(justAddedId){
    const q = dlgQuery.trim().toLowerCase();
    const list = threads
      .filter(t => dlgFilter==="All" || t.category===dlgFilter)
      .filter(t => threadMatches(t, q))
      .slice().sort((a,b) => (a.date < b.date ? 1 : -1));

    document.getElementById("dlgThreads").innerHTML = list.map(t => `
      <article class="thread ${t.id===justAddedId?'enter':''}" data-id="${t.id}">
        <div class="thread-head">
          <div class="t-avatar">${PERSON_SVG}</div>
          <div class="t-meta">
            <span class="t-author">${escapeHtml(t.author)}</span>
            <span class="t-sub">${escapeHtml([t.company, t.country, t.date].filter(Boolean).join(" · "))}</span>
          </div>
          <span class="cat-tag">${escapeHtml(t.category)}</span>
          <span class="status-badge ${t.status==="answered"?"answered":"open"}">${t.status==="answered"?"Answered":"Open"}</span>
        </div>
        <h3>${escapeHtml(t.title)}</h3>
        <p class="t-body">${escapeHtml(t.body||"")}</p>
        ${t.image ? `<img class="t-photo" src="${escapeHtml(t.image)}" alt="Attached photo">` : ""}
        <div class="thread-actions">
          <button type="button" class="replies-toggle">${(t.replies||[]).length} ${(t.replies||[]).length===1?"reply":"replies"} — view &amp; answer</button>
        </div>
        <div class="replies">
          ${(t.replies||[]).map(r => `
            <div class="reply">
              <div class="t-avatar">${PERSON_SVG}</div>
              <div class="reply-body">
                <div class="reply-who">${escapeHtml(r.author)} <span>· ${escapeHtml([r.company, r.country, r.date].filter(Boolean).join(" · "))}</span></div>
                <p class="reply-text">${escapeHtml(r.text)}</p>
              </div>
            </div>`).join("")}
          <form class="reply-form">
            <input type="text" placeholder="Share your experience or answer…" required>
            <button type="submit">Reply</button>
          </form>
        </div>
      </article>
    `).join("") || `<p class="lede">No discussions match your search — be the first to ask.</p>`;
  }

  /* toggle replies + submit replies (event delegation) */
  document.getElementById("dlgThreads").addEventListener("click", (ev)=>{
    const btn = ev.target.closest(".replies-toggle");
    if (!btn) return;
    btn.closest(".thread").querySelector(".replies").classList.toggle("open");
  });
  document.getElementById("dlgThreads").addEventListener("submit", (ev)=>{
    const form = ev.target.closest(".reply-form");
    if (!form) return;
    ev.preventDefault();
    const input = form.querySelector("input");
    const text = input.value.trim();
    if (!text) return;
    const id = Number(ev.target.closest(".thread").dataset.id);
    const t = threads.find(x => x.id === id);
    if (!t) return;
    t.replies = t.replies || [];
    t.replies.push({ author: me.name, company: me.company, country: me.country,
      date: new Date().toISOString().slice(0,10), text });
    t.status = "answered";
    renderThreads();
    renderDashboard(); renderReport();
    const again = document.querySelector(`.thread[data-id="${id}"] .replies`);
    if (again) again.classList.add("open");
  });

  /* show / hide the ask form (list is shown first) */
  const askPanel = document.getElementById("askPanel");
  const askToggle = document.getElementById("askToggle");
  const askToggleLabel = document.getElementById("askToggleLabel");
  function setAskOpen(open){
    askPanel.classList.toggle("open", open);
    askToggle.classList.toggle("open", open);
    askToggle.setAttribute("aria-expanded", open ? "true" : "false");
    askToggleLabel.textContent = open ? "Hide the form" : "Ask the community";
    if (open) document.getElementById("askTitle").focus();
  }
  askToggle.addEventListener("click", ()=> setAskOpen(!askPanel.classList.contains("open")));

  /* new question form */
  let askImageData = null;
  const askImage = document.getElementById("askImage");
  const askPreview = document.getElementById("askPreview");
  const askClear = document.getElementById("askClear");
  askImage.addEventListener("change", ()=>{
    const f = askImage.files && askImage.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = ()=>{
      askImageData = rd.result;
      askPreview.src = askImageData;
      askPreview.style.display = "block";
      askClear.style.display = "inline";
    };
    rd.readAsDataURL(f);
  });
  askClear.addEventListener("click", ()=>{
    askImageData = null; askImage.value = "";
    askPreview.style.display = "none"; askClear.style.display = "none";
  });

  document.getElementById("askForm").addEventListener("submit", (ev)=>{
    ev.preventDefault();
    const title = document.getElementById("askTitle").value.trim();
    if (!title) return;
    const t = {
      id: ++seq,
      title,
      body: document.getElementById("askBody").value.trim(),
      author: me.name, company: me.company, country: me.country,
      category: document.getElementById("askCat").value,
      date: new Date().toISOString().slice(0,10),
      status: "open",
      image: askImageData,
      replies: []
    };
    threads.push(t);
    dlgFilter = "All"; dlgQuery = "";
    document.getElementById("dlgSearch").value = "";
    renderDlgFilters(); renderThreads(t.id);
    renderDashboard(); renderReport();
    document.getElementById("askTitle").value = "";
    document.getElementById("askBody").value = "";
    askClear.click();
    setAskOpen(false);
    const posted = document.querySelector(`.thread[data-id="${t.id}"]`);
    if (posted) posted.scrollIntoView({ behavior:"smooth", block:"center" });
  });

  document.getElementById("dlgSearch").addEventListener("input", (ev)=>{
    dlgQuery = ev.target.value;
    renderThreads();
  });

  /* ================================================================
     2. PICHON-KUN — demo answers grounded in Daikin documentation
     ================================================================ */
  const chatWindow = document.getElementById("chatWindow");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");

  const SUGGESTIONS = [
    "What is the recommended pipe size for FCA100CVMA?",
    "We have error E4 on RXM20UVMZ. How do I diagnose and fix it?",
    "🇹🇭 เครื่อง RXM20UVMZ ขึ้น error E4 ต้องตรวจอะไรบ้าง?",
    "🇻🇳 Kích thước ống khuyến nghị cho FCA100CVMA là gì?",
    "🇯🇵 FTXM-UVMZシリーズの冷媒は何ですか？",
    "🇹🇭 FCA100CVMA ใช้ท่อขนาดเท่าไร?",
    "🇮🇩 Berapa ukuran pipa yang disarankan untuk FCA100CVMA?",
    "🇲🇾 Apakah saiz paip yang disyorkan untuk FCA100CVMA?",
    "🇮🇳 RXM20UVMZ पर E4 एरर आ रहा है, कैसे ठीक करें?",
    "🇸🇬 FCA100CVMA 的推荐配管尺寸是多少？",
    "🇰🇭 តើ FCA100CVMA ត្រូវប្រើបំពង់ទំហំប៉ុន្មាន?"
  ];

  /* ---- multi-language demo: detect the question's language ---- */
  function detectLang(q){
    if (/[฀-๿]/.test(q)) return "th";                    /* Thai */
    if (/[ក-៿]/.test(q)) return "km";                    /* Khmer (Cambodia) */
    if (/[ऀ-ॿ]/.test(q)) return "hi";                    /* Hindi / Devanagari (India) */
    if (/[぀-ヿ]/.test(q)) return "ja";                    /* Japanese kana */
    if (/[一-鿿]/.test(q)) return "zh";                    /* Chinese (Singapore) */
    if (/[ĂăƠơƯưĐđẠ-ỹ]/.test(q)) return "vi";                      /* Vietnamese */
    if (/\b(saiz|paip|disyorkan|apakah|penyejuk|ralat)\b/i.test(q)) return "ms";           /* Malay (Malaysia) */
    if (/\b(ukuran|pipa|berapa|refrigeran|kesalahan|disarankan|bagaimana)\b/i.test(q)) return "id"; /* Indonesian */
    return "en";
  }
  function pick(map, lang){ return map[lang] || map.en; }

  const PICHON_ANSWERS = {
    pipe: {
      en: `For the <strong>FCA100CVMA</strong> ceiling cassette, the recommended refrigerant piping is:
        <ul><li>Liquid line: <strong>Ø9.5 mm</strong></li><li>Gas line: <strong>Ø15.9 mm</strong></li>
        <li>Max piping length 50 m — add refrigerant beyond 30 m per the charge table</li><li>Max height difference 30 m (outdoor above indoor)</li></ul>
        <span class="src">Source: FCA100CVMA Installation Manual — piping selection table (demo knowledge base)</span>`,
      th: `สำหรับเครื่องเปลือยฝ้าแบบคาสเซ็ท <strong>FCA100CVMA</strong> ขนาดท่อสารทำความเย็นที่แนะนำคือ:
        <ul><li>ท่อ Liquid: <strong>Ø9.5 มม.</strong></li><li>ท่อ Gas: <strong>Ø15.9 มม.</strong></li>
        <li>ความยาวท่อสูงสุด 50 ม. — เกิน 30 ม. ต้องเติมสารทำความเย็นเพิ่มตามตาราง</li><li>ระยะต่างระดับสูงสุด 30 ม. (คอยล์ร้อนอยู่สูงกว่า)</li></ul>
        <span class="src">แหล่งข้อมูล: คู่มือติดตั้ง FCA100CVMA — ตารางเลือกขนาดท่อ (ฐานข้อมูลเดโม)</span>`,
      vi: `Với dàn lạnh âm trần cassette <strong>FCA100CVMA</strong>, kích thước ống môi chất khuyến nghị:
        <ul><li>Ống lỏng: <strong>Ø9.5 mm</strong></li><li>Ống gas: <strong>Ø15.9 mm</strong></li>
        <li>Chiều dài ống tối đa 50 m — vượt 30 m cần nạp thêm môi chất theo bảng</li><li>Chênh lệch độ cao tối đa 30 m (dàn nóng đặt cao hơn)</li></ul>
        <span class="src">Nguồn: Sách hướng dẫn lắp đặt FCA100CVMA — bảng chọn kích thước ống (dữ liệu demo)</span>`,
      ja: `天井カセット形 <strong>FCA100CVMA</strong> の推奨冷媒配管サイズ：
        <ul><li>液管：<strong>Ø9.5 mm</strong></li><li>ガス管：<strong>Ø15.9 mm</strong></li>
        <li>最大配管長 50 m — 30 m を超える場合はチャージ表に従い追加充填</li><li>最大高低差 30 m（室外機が上）</li></ul>
        <span class="src">出典：FCA100CVMA 据付説明書 — 配管選定表（デモ用ナレッジベース）</span>`,
      id: `Untuk kaset plafon <strong>FCA100CVMA</strong>, ukuran pipa refrigeran yang disarankan:
        <ul><li>Pipa cairan: <strong>Ø9.5 mm</strong></li><li>Pipa gas: <strong>Ø15.9 mm</strong></li>
        <li>Panjang pipa maks. 50 m — tambahkan refrigeran jika lebih dari 30 m sesuai tabel</li><li>Beda ketinggian maks. 30 m (unit outdoor di atas)</li></ul>
        <span class="src">Sumber: Manual Pemasangan FCA100CVMA — tabel pemilihan pipa (basis data demo)</span>`,
      ms: `Untuk kaset siling <strong>FCA100CVMA</strong>, saiz paip refrigeran yang disyorkan:
        <ul><li>Paip cecair: <strong>Ø9.5 mm</strong></li><li>Paip gas: <strong>Ø15.9 mm</strong></li>
        <li>Panjang paip maks. 50 m — tambah refrigeran melebihi 30 m mengikut jadual</li><li>Beza ketinggian maks. 30 m (unit luar di atas)</li></ul>
        <span class="src">Sumber: Manual Pemasangan FCA100CVMA — jadual pemilihan paip (pangkalan data demo)</span>`,
      hi: `<strong>FCA100CVMA</strong> सीलिंग कैसेट के लिए अनुशंसित रेफ्रिजरेंट पाइपिंग:
        <ul><li>लिक्विड लाइन: <strong>Ø9.5 mm</strong></li><li>गैस लाइन: <strong>Ø15.9 mm</strong></li>
        <li>अधिकतम पाइप लंबाई 50 m — 30 m से अधिक पर चार्ज टेबल के अनुसार रेफ्रिजरेंट जोड़ें</li><li>अधिकतम ऊँचाई अंतर 30 m (आउटडोर यूनिट ऊपर)</li></ul>
        <span class="src">स्रोत: FCA100CVMA इंस्टॉलेशन मैनुअल — पाइपिंग चयन तालिका (डेमो नॉलेज बेस)</span>`,
      zh: `<strong>FCA100CVMA</strong> 天花板嵌入式（卡式）机型的推荐冷媒配管尺寸：
        <ul><li>液管：<strong>Ø9.5 mm</strong></li><li>气管：<strong>Ø15.9 mm</strong></li>
        <li>最大配管长度 50 m —— 超过 30 m 需按充注表追加冷媒</li><li>最大高低差 30 m（室外机在上）</li></ul>
        <span class="src">来源：FCA100CVMA 安装手册 — 配管选型表（演示知识库）</span>`,
      km: `សម្រាប់ម៉ាស៊ីនត្រជាក់ភ្ជាប់ពិដាន <strong>FCA100CVMA</strong> ទំហំបំពង់សារធាតុត្រជាក់ដែលណែនាំ៖
        <ul><li>បំពង់រាវ៖ <strong>Ø9.5 mm</strong></li><li>បំពង់ឧស្ម័ន៖ <strong>Ø15.9 mm</strong></li>
        <li>ប្រវែងបំពង់អតិបរមា 50 m — លើស 30 m ត្រូវបន្ថែមសារធាតុត្រជាក់តាមតារាង</li><li>គម្លាតកម្ពស់អតិបរមា 30 m (ម៉ាស៊ីនក្រៅនៅខ្ពស់ជាង)</li></ul>
        <span class="src">ប្រភព៖ សៀវភៅណែនាំដំឡើង FCA100CVMA — តារាងជ្រើសទំហំបំពង់ (ទិន្នន័យសាកល្បង)</span>`
    },
    e4: {
      en: `<strong>Error E4 on RXM20UVMZ</strong> indicates actuation of the low-pressure protection. Diagnosis steps:
        <ol><li>Check the outdoor coil and air filters are clean and unobstructed.</li>
        <li>Inspect the pressure-switch connector and outdoor PCB for moisture or corrosion (common after storms).</li>
        <li>Measure suction pressure — if low, leak-test the system and weigh in the correct charge.</li>
        <li>Verify the expansion valve and thermistors respond correctly.</li>
        <li>Reset power and monitor; if E4 recurs with correct charge, replace the low-pressure switch.</li></ol>
        <span class="src">Source: RXM-UVMZ Service Manual — fault code E4 procedure (demo knowledge base)</span>`,
      th: `<strong>Error E4 ของ RXM20UVMZ</strong> หมายถึงระบบป้องกันแรงดันต่ำทำงาน ขั้นตอนการวินิจฉัย:
        <ol><li>ตรวจคอยล์ร้อนและแผ่นกรองอากาศว่าสะอาด ไม่มีสิ่งกีดขวาง</li>
        <li>ตรวจขั้วต่อสวิตช์แรงดันและแผงวงจร (PCB) ด้านนอกว่ามีความชื้นหรือคราบสนิมหรือไม่ (พบบ่อยหลังฝนตกหนัก)</li>
        <li>วัดแรงดันด้านดูด — หากต่ำ ให้ตรวจหารอยรั่วและเติมสารทำความเย็นตามพิกัด</li>
        <li>ตรวจการทำงานของเอ็กซ์แพนชันวาล์วและเทอร์มิสเตอร์</li>
        <li>รีเซ็ตไฟแล้วเฝ้าสังเกต หากยังเกิด E4 ทั้งที่สารทำความเย็นถูกต้อง ให้เปลี่ยนสวิตช์แรงดันต่ำ</li></ol>
        <span class="src">แหล่งข้อมูล: Service Manual RXM-UVMZ — ขั้นตอนแก้ไขรหัส E4 (ฐานข้อมูลเดโม)</span>`,
      vi: `<strong>Lỗi E4 trên RXM20UVMZ</strong> là bảo vệ áp suất thấp tác động. Các bước chẩn đoán:
        <ol><li>Kiểm tra dàn nóng và lưới lọc sạch, không bị che chắn.</li>
        <li>Kiểm tra giắc cắm công tắc áp suất và bo mạch ngoài trời xem có ẩm hoặc gỉ sét (thường gặp sau mưa bão).</li>
        <li>Đo áp suất hút — nếu thấp, thử xì toàn hệ thống và nạp đúng lượng môi chất.</li>
        <li>Kiểm tra van tiết lưu điện tử và các cảm biến nhiệt hoạt động đúng.</li>
        <li>Reset nguồn và theo dõi; nếu E4 lặp lại khi lượng gas đã đúng, thay công tắc áp suất thấp.</li></ol>
        <span class="src">Nguồn: Service Manual RXM-UVMZ — quy trình mã lỗi E4 (dữ liệu demo)</span>`,
      ja: `<strong>RXM20UVMZ の E4 エラー</strong>は低圧保護の作動を示します。診断手順：
        <ol><li>室外機の熱交換器とフィルターの汚れ・目詰まりを確認する。</li>
        <li>圧力スイッチのコネクタと室外基板の湿気・腐食を確認する（暴風雨後によく発生）。</li>
        <li>吸入圧力を測定し、低い場合は漏れ点検のうえ規定量を充填する。</li>
        <li>電子膨張弁とサーミスタの動作を確認する。</li>
        <li>電源をリセットして経過観察。充填量が正しくても再発する場合は低圧スイッチを交換。</li></ol>
        <span class="src">出典：RXM-UVMZ サービスマニュアル — E4 故障診断手順（デモ用ナレッジベース）</span>`,
      id: `<strong>Kesalahan E4 pada RXM20UVMZ</strong> menandakan proteksi tekanan rendah aktif. Langkah diagnosis:
        <ol><li>Periksa koil outdoor dan filter udara — harus bersih tanpa halangan.</li>
        <li>Periksa konektor sakelar tekanan dan PCB outdoor dari kelembapan atau korosi (sering terjadi setelah badai).</li>
        <li>Ukur tekanan hisap — jika rendah, lakukan uji kebocoran lalu isi refrigeran sesuai takaran.</li>
        <li>Pastikan katup ekspansi dan termistor bekerja normal.</li>
        <li>Reset daya dan pantau; jika E4 berulang meski isian sudah benar, ganti sakelar tekanan rendah.</li></ol>
        <span class="src">Sumber: Service Manual RXM-UVMZ — prosedur kode kesalahan E4 (basis data demo)</span>`,
      ms: `<strong>Ralat E4 pada RXM20UVMZ</strong> menunjukkan perlindungan tekanan rendah telah aktif. Langkah diagnosis:
        <ol><li>Periksa gegelung luar dan penapis udara — mesti bersih tanpa halangan.</li>
        <li>Periksa penyambung suis tekanan dan PCB luar daripada lembapan atau karat (biasa selepas ribut).</li>
        <li>Ukur tekanan sedutan — jika rendah, uji kebocoran dan isi refrigeran mengikut spesifikasi.</li>
        <li>Pastikan injap pengembangan dan termistor berfungsi dengan betul.</li>
        <li>Reset kuasa dan pantau; jika E4 berulang walaupun isian betul, gantikan suis tekanan rendah.</li></ol>
        <span class="src">Sumber: Service Manual RXM-UVMZ — prosedur kod ralat E4 (pangkalan data demo)</span>`,
      hi: `<strong>RXM20UVMZ पर E4 त्रुटि</strong> लो-प्रेशर प्रोटेक्शन सक्रिय होने का संकेत है। जाँच के चरण:
        <ol><li>आउटडोर कॉइल और एयर फ़िल्टर साफ़ और अवरोध-मुक्त होने की जाँच करें।</li>
        <li>प्रेशर-स्विच कनेक्टर व आउटडोर PCB में नमी या जंग जाँचें (तूफ़ान के बाद आम)।</li>
        <li>सक्शन प्रेशर मापें — कम हो तो लीक टेस्ट करें और सही मात्रा में चार्ज भरें।</li>
        <li>एक्सपेंशन वाल्व और थर्मिस्टर की कार्यप्रणाली जाँचें।</li>
        <li>पावर रीसेट कर निगरानी करें; सही चार्ज पर भी E4 दोहराए तो लो-प्रेशर स्विच बदलें।</li></ol>
        <span class="src">स्रोत: RXM-UVMZ सर्विस मैनुअल — E4 फ़ॉल्ट कोड प्रक्रिया (डेमो नॉलेज बेस)</span>`,
      zh: `<strong>RXM20UVMZ 出现 E4 故障</strong>表示低压保护动作。诊断步骤：
        <ol><li>检查室外机换热器和过滤网是否清洁、无遮挡。</li>
        <li>检查压力开关接插件和室外机主板是否受潮或腐蚀（暴雨后常见）。</li>
        <li>测量吸气压力 —— 若偏低，进行检漏并按规定量充注冷媒。</li>
        <li>确认电子膨胀阀和温度传感器工作正常。</li>
        <li>断电复位后观察；若充注量正确仍报 E4，请更换低压开关。</li></ol>
        <span class="src">来源：RXM-UVMZ 维修手册 — E4 故障代码流程（演示知识库）</span>`,
      km: `<strong>កំហុស E4 លើ RXM20UVMZ</strong> បង្ហាញថាការការពារសម្ពាធទាបបានដំណើរការ។ ជំហានវិនិច្ឆ័យ៖
        <ol><li>ពិនិត្យកូអ៊ីលម៉ាស៊ីនក្រៅ និងតម្រងខ្យល់ ឲ្យស្អាតគ្មានរបាំង។</li>
        <li>ពិនិត្យខ្សែភ្ជាប់កុងតាក់សម្ពាធ និងបន្ទះ PCB ក្រៅ រកសំណើមឬច្រេះ (កើតញឹកញាប់ក្រោយភ្លៀងខ្លាំង)។</li>
        <li>វាស់សម្ពាធបឺត — បើទាប សូមតេស្តលេចធ្លាយ ហើយបញ្ចូលសារធាតុត្រជាក់តាមកម្រិត។</li>
        <li>ពិនិត្យវ៉ាល់ពង្រីក និងសង់ស័រកម្ដៅ ឲ្យដំណើរការត្រឹមត្រូវ។</li>
        <li>Reset ភ្លើង ហើយតាមដាន; បើ E4 កើតឡើងវិញទាំងបញ្ចូលត្រឹមត្រូវ សូមប្តូរកុងតាក់សម្ពាធទាប។</li></ol>
        <span class="src">ប្រភព៖ Service Manual RXM-UVMZ — នីតិវិធីកូដកំហុស E4 (ទិន្នន័យសាកល្បង)</span>`
    },
    refrigerant: {
      en: `The <strong>FTXM-UVMZ</strong> wall-mounted series operates on <strong>R-32</strong> refrigerant (GWP 675 — roughly one-third of R410A).
        <span class="src">Source: EDTNZ041928 — FTXM-UVMZ Engineering Data (demo knowledge base)</span>`,
      th: `เครื่องปรับอากาศติดผนังซีรีส์ <strong>FTXM-UVMZ</strong> ใช้สารทำความเย็น <strong>R-32</strong> (ค่า GWP 675 — ประมาณ 1 ใน 3 ของ R410A)
        <span class="src">แหล่งข้อมูล: EDTNZ041928 — FTXM-UVMZ Engineering Data (ฐานข้อมูลเดโม)</span>`,
      vi: `Dòng treo tường <strong>FTXM-UVMZ</strong> sử dụng môi chất lạnh <strong>R-32</strong> (GWP 675 — khoảng 1/3 so với R410A).
        <span class="src">Nguồn: EDTNZ041928 — FTXM-UVMZ Engineering Data (dữ liệu demo)</span>`,
      ja: `壁掛形 <strong>FTXM-UVMZ</strong> シリーズの冷媒は <strong>R-32</strong> です（GWP 675 — R410A の約3分の1）。
        <span class="src">出典：EDTNZ041928 — FTXM-UVMZ Engineering Data（デモ用ナレッジベース）</span>`,
      id: `Seri dinding <strong>FTXM-UVMZ</strong> menggunakan refrigeran <strong>R-32</strong> (GWP 675 — sekitar sepertiga dari R410A).
        <span class="src">Sumber: EDTNZ041928 — FTXM-UVMZ Engineering Data (basis data demo)</span>`,
      ms: `Siri dinding <strong>FTXM-UVMZ</strong> menggunakan bahan pendingin <strong>R-32</strong> (GWP 675 — kira-kira satu pertiga daripada R410A).
        <span class="src">Sumber: EDTNZ041928 — FTXM-UVMZ Engineering Data (pangkalan data demo)</span>`,
      hi: `<strong>FTXM-UVMZ</strong> वॉल-माउंटेड सीरीज़ <strong>R-32</strong> रेफ्रिजरेंट पर चलती है (GWP 675 — R410A का लगभग एक-तिहाई)।
        <span class="src">स्रोत: EDTNZ041928 — FTXM-UVMZ Engineering Data (डेमो नॉलेज बेस)</span>`,
      zh: `<strong>FTXM-UVMZ</strong> 壁挂系列使用 <strong>R-32</strong> 冷媒（GWP 675，约为 R410A 的三分之一）。
        <span class="src">来源：EDTNZ041928 — FTXM-UVMZ Engineering Data（演示知识库）</span>`,
      km: `ស៊េរីភ្ជាប់ជញ្ជាំង <strong>FTXM-UVMZ</strong> ប្រើសារធាតុត្រជាក់ <strong>R-32</strong> (GWP 675 — ប្រហែលមួយភាគបីនៃ R410A)។
        <span class="src">ប្រភព៖ EDTNZ041928 — FTXM-UVMZ Engineering Data (ទិន្នន័យសាកល្បង)</span>`
    },
    drawing: {
      en: `The dimensional drawing for <strong>FTXM20UVMZ</strong> is on <strong>page 15</strong> of Engineering Data <strong>EDTNZ041928</strong>. Tip: <strong>DiFind</strong> can extract that page as a one-page PDF — try “Find the dimensional drawing for FTXM20UVMZ”.
        <span class="src">Source: EDTNZ041928 — FTXM-UVMZ Engineering Data, p.15</span>`,
      th: `แบบแสดงขนาดตัวเครื่อง (dimensional drawing) ของ <strong>FTXM20UVMZ</strong> อยู่ที่<strong>หน้า 15</strong> ของ Engineering Data <strong>EDTNZ041928</strong> — แนะนำใช้ <strong>DiFind</strong> ดึงหน้านั้นออกมาเป็น PDF หน้าเดียวได้เลย
        <span class="src">แหล่งข้อมูล: EDTNZ041928 — FTXM-UVMZ Engineering Data หน้า 15</span>`,
      vi: `Bản vẽ kích thước của <strong>FTXM20UVMZ</strong> nằm ở <strong>trang 15</strong> của Engineering Data <strong>EDTNZ041928</strong>. Mẹo: dùng <strong>DiFind</strong> để trích trang đó thành PDF một trang.
        <span class="src">Nguồn: EDTNZ041928 — FTXM-UVMZ Engineering Data, tr.15</span>`,
      ja: `<strong>FTXM20UVMZ</strong> の寸法図は Engineering Data <strong>EDTNZ041928</strong> の<strong>15ページ</strong>にあります。ヒント：<strong>DiFind</strong> でそのページを1枚のPDFとして抽出できます。
        <span class="src">出典：EDTNZ041928 — FTXM-UVMZ Engineering Data、15ページ</span>`,
      id: `Gambar dimensi <strong>FTXM20UVMZ</strong> ada di <strong>halaman 15</strong> Engineering Data <strong>EDTNZ041928</strong>. Tips: gunakan <strong>DiFind</strong> untuk mengekstrak halaman tersebut sebagai PDF satu halaman.
        <span class="src">Sumber: EDTNZ041928 — FTXM-UVMZ Engineering Data, hlm. 15</span>`,
      ms: `Lukisan dimensi <strong>FTXM20UVMZ</strong> terdapat pada <strong>halaman 15</strong> Engineering Data <strong>EDTNZ041928</strong>. Petua: gunakan <strong>DiFind</strong> untuk mengekstrak halaman itu sebagai PDF satu halaman.
        <span class="src">Sumber: EDTNZ041928 — FTXM-UVMZ Engineering Data, hlm. 15</span>`,
      hi: `<strong>FTXM20UVMZ</strong> का डाइमेंशनल ड्रॉइंग Engineering Data <strong>EDTNZ041928</strong> के <strong>पृष्ठ 15</strong> पर है। सुझाव: <strong>DiFind</strong> से वह पृष्ठ एक-पेज PDF के रूप में निकालें।
        <span class="src">स्रोत: EDTNZ041928 — FTXM-UVMZ Engineering Data, पृ. 15</span>`,
      zh: `<strong>FTXM20UVMZ</strong> 的外形尺寸图在 Engineering Data <strong>EDTNZ041928</strong> 第 <strong>15</strong> 页。提示：可用 <strong>DiFind</strong> 将该页提取为单页 PDF。
        <span class="src">来源：EDTNZ041928 — FTXM-UVMZ Engineering Data，第 15 页</span>`,
      km: `គំនូរវិមាត្ររបស់ <strong>FTXM20UVMZ</strong> នៅ<strong>ទំព័រ 15</strong> នៃ Engineering Data <strong>EDTNZ041928</strong>។ គន្លឹះ៖ ប្រើ <strong>DiFind</strong> ដើម្បីទាញយកទំព័រនោះជា PDF មួយទំព័រ។
        <span class="src">ប្រភព៖ EDTNZ041928 — FTXM-UVMZ Engineering Data ទំព័រ 15</span>`
    },
    fallback: {
      en: `I answer from Daikin's approved documentation — Engineering Data, installation manuals and service manuals — in English, ไทย, Tiếng Việt or 日本語. Ask me about a Daikin model, an error code, piping or refrigerant. Photo, model-plate and error-code image input is planned for a future version.`,
      th: `ผมตอบจากเอกสารทางเทคนิคที่ผ่านการรับรองของไดกิ้น — Engineering Data, คู่มือติดตั้ง และ Service Manual — ลองถามเกี่ยวกับรุ่นสินค้า รหัสข้อผิดพลาด ขนาดท่อ หรือสารทำความเย็นได้เลยครับ เช่น <em>“FCA100CVMA ใช้ท่อขนาดเท่าไร?”</em>`,
      vi: `Tôi trả lời dựa trên tài liệu kỹ thuật chính thức của Daikin — Engineering Data, sách lắp đặt và service manual. Hãy hỏi về model Daikin, mã lỗi, đường ống hoặc môi chất lạnh, ví dụ: <em>“Kích thước ống khuyến nghị cho FCA100CVMA là gì?”</em>`,
      ja: `ダイキンの承認済み技術資料（Engineering Data・据付説明書・サービスマニュアル）に基づいて回答します。ダイキンの機種、エラーコード、配管、冷媒についてご質問ください。例：「FCA100CVMAの推奨配管サイズは？」`,
      id: `Saya menjawab berdasarkan dokumentasi resmi Daikin — Engineering Data, manual pemasangan, dan service manual. Tanyakan tentang model Daikin, kode kesalahan, pipa, atau refrigeran. Contoh: <em>“Berapa ukuran pipa yang disarankan untuk FCA100CVMA?”</em>`,
      ms: `Saya menjawab berdasarkan dokumentasi rasmi Daikin — Engineering Data, manual pemasangan dan service manual. Tanya tentang model Daikin, kod ralat, paip atau bahan pendingin. Contoh: <em>“Apakah saiz paip yang disyorkan untuk FCA100CVMA?”</em>`,
      hi: `मैं डाइकिन के अनुमोदित दस्तावेज़ों — Engineering Data, इंस्टॉलेशन मैनुअल और सर्विस मैनुअल — से उत्तर देता हूँ। डाइकिन मॉडल, एरर कोड, पाइपिंग या रेफ्रिजरेंट के बारे में पूछें। उदाहरण: <em>“FCA100CVMA के लिए अनुशंसित पाइप साइज़ क्या है?”</em>`,
      zh: `我根据大金官方技术资料（Engineering Data、安装手册、维修手册）回答。您可以询问大金机型、故障代码、配管或冷媒相关问题。例如：「FCA100CVMA 的推荐配管尺寸是多少？」`,
      km: `ខ្ញុំឆ្លើយតាមឯកសារបច្ចេកទេសផ្លូវការរបស់ Daikin — Engineering Data សៀវភៅដំឡើង និង Service Manual។ សូមសួរអំពីម៉ូដែល Daikin កូដកំហុស បំពង់ ឬសារធាតុត្រជាក់។ ឧទាហរណ៍៖ «តើ FCA100CVMA ត្រូវប្រើបំពង់ទំហំប៉ុន្មាន?»`
    }
  };

  function addChatMessage(who, html){
    const el = document.createElement("div");
    el.className = "chat-msg " + who;
    el.innerHTML = `<div class="chat-avatar ${who}">${who==="bot"?"ピ":"You"}</div><div class="chat-bubble">${html}</div>`;
    chatWindow.appendChild(el);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function pichonAnswer(qRaw){
    const q = qRaw.toLowerCase();
    const lang = detectLang(qRaw);

    /* intent keywords in English, Thai, Vietnamese and Japanese */
    const kwPipe        = /(pipe|piping|size|ท่อ|ขนาดท่อ|ống|kích thước|配管|パイプ|pipa|ukuran|paip|saiz|पाइप|साइज़|尺寸|បំពង់|ទំហំ)/i;
    const kwRefrigerant = /(refrigerant|สารทำความเย็น|น้ำยา|môi chất|gas lạnh|冷媒|refrigeran|bahan pendingin|रेफ्रिजरेंट|សារធាតុត្រជាក់)/i;
    const kwDrawing     = /(dimensional|drawing|dimension|แบบ|ขนาดตัวเครื่อง|bản vẽ|寸法|gambar dimensi|lukisan dimensi|ड्रॉइंग|डाइमेंशनल|尺寸图|外形图|គំនូរ)/i;

    if (/fca\s*-?100/.test(q) && kwPipe.test(qRaw)){
      return pick(PICHON_ANSWERS.pipe, lang);
    }
    if (/e4/.test(q)){
      return pick(PICHON_ANSWERS.e4, lang);
    }
    if (kwRefrigerant.test(qRaw)){
      return pick(PICHON_ANSWERS.refrigerant, lang);
    }
    if (kwDrawing.test(qRaw) && /ftxm/.test(q)){
      return pick(PICHON_ANSWERS.drawing, lang);
    }
    return pick(PICHON_ANSWERS.fallback, lang);
  }

  /* suggestions are collapsed behind a toggle button */
  const suggPanel = document.getElementById("chatSuggestions");
  const suggToggle = document.getElementById("suggToggle");
  function setSuggOpen(open){
    suggPanel.classList.toggle("open", open);
    suggToggle.classList.toggle("open", open);
    suggToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }
  suggToggle.addEventListener("click", ()=> setSuggOpen(!suggPanel.classList.contains("open")));

  function renderChatSuggestions(){
    suggPanel.innerHTML =
      SUGGESTIONS.map(s => `<button type="button">${escapeHtml(s)}</button>`).join("");
    document.getElementById("suggCount").textContent = SUGGESTIONS.length;
    document.querySelectorAll("#chatSuggestions button").forEach(b=>{
      b.addEventListener("click", ()=>{
        chatInput.value = b.textContent;
        chatForm.requestSubmit();
        setSuggOpen(false);
      });
    });
  }

  chatForm.addEventListener("submit", (e)=>{
    e.preventDefault();
    const q = chatInput.value.trim();
    if(!q) return;
    addChatMessage("user", escapeHtml(q));
    chatInput.value = "";
    setTimeout(()=> addChatMessage("bot", pichonAnswer(q)), 450);
  });

  /* ---- personal quick suggestions: signed-in country's language + English ---- */
  const COUNTRY_LANG = {
    "Thailand":"th", "Viet Nam":"vi", "Singapore":"zh", "Indonesia":"id",
    "Malaysia":"ms", "India":"hi", "Cambodia":"km"
    /* Philippines, Australia, New Zealand, Tanzania → English */
  };
  const LOCAL_SUGGESTIONS = {
    en: [
      "What is the recommended pipe size for FCA100CVMA?",
      "We have error E4 on RXM20UVMZ. How do I diagnose and fix it?"
    ],
    th: [
      "FCA100CVMA ใช้ท่อขนาดเท่าไร?",
      "เครื่อง RXM20UVMZ ขึ้น error E4 ต้องตรวจอะไรบ้าง?"
    ],
    vi: [
      "Kích thước ống khuyến nghị cho FCA100CVMA là gì?",
      "Lỗi E4 trên RXM20UVMZ xử lý thế nào?"
    ],
    zh: [
      "FCA100CVMA 的推荐配管尺寸是多少？",
      "FTXM-UVMZ 系列用什么冷媒？"
    ],
    id: [
      "Berapa ukuran pipa yang disarankan untuk FCA100CVMA?",
      "Bagaimana cara mengatasi kesalahan E4 pada RXM20UVMZ?"
    ],
    ms: [
      "Apakah saiz paip yang disyorkan untuk FCA100CVMA?",
      "Bagaimana menangani ralat E4 pada RXM20UVMZ?"
    ],
    hi: [
      "FCA100CVMA के लिए अनुशंसित पाइप साइज़ क्या है?",
      "RXM20UVMZ पर E4 एरर आ रहा है, कैसे ठीक करें?"
    ],
    km: [
      "តើ FCA100CVMA ត្រូវប្រើបំពង់ទំហំប៉ុន្មាន?",
      "តើកំហុស E4 លើ RXM20UVMZ ដោះស្រាយយ៉ាងណា?"
    ]
  };

  function renderMySuggestions(){
    const el = document.getElementById("mySuggestions");
    if (!el) return;
    const lang = COUNTRY_LANG[me.country] || "en";
    const list = lang === "en"
      ? LOCAL_SUGGESTIONS.en
      : [...LOCAL_SUGGESTIONS[lang], ...LOCAL_SUGGESTIONS.en];
    el.innerHTML = list.map(s => `<button type="button">${escapeHtml(s)}</button>`).join("");
    el.querySelectorAll("button").forEach(b=>{
      b.addEventListener("click", ()=>{ chatInput.value = b.textContent; chatForm.requestSubmit(); });
    });
  }
  renderMySuggestions();

  renderChatSuggestions();
  addChatMessage("bot",
    `Hi! I'm <strong>Pichon-kun</strong>, the Daikin HVAC assistant. Ask me about Daikin products, model numbers, piping or error codes in <strong>English</strong>, <strong>ไทย</strong>, <strong>Tiếng Việt</strong>, <strong>日本語</strong>, <strong>Bahasa Indonesia</strong>, <strong>Bahasa Melayu</strong>, <strong>हिन्दी</strong>, <strong>中文</strong> or <strong>ខ្មែរ</strong> — I reply in the language you ask in. My answers come from Daikin's approved technical documentation.`);

  /* ================================================================
     3. DICOMPARE — demo comparison dataset
     ================================================================ */
  const COMPARE_DB = [
    {
      match: /puhy[\s-]*p?450/i,
      example: "Mitsubishi PUHY-P450",
      competitorBrand: "Mitsubishi Electric",
      competitorModel: "PUHY-P450YNW-A (City Multi VRF)",
      daikinModel: "Daikin RXYQ18A (VRV X)",
      rows: [
        ["Cooling capacity", "50.0 kW", "50.0 kW"],
        ["Heating capacity", "56.0 kW", "56.0 kW"],
        ["EER (cooling)", "3.30", "3.55"],
        ["Refrigerant", "R410A", "R410A"],
        ["Power supply", "3Ø · 380–415 V · 50 Hz", "3Ø · 380–415 V · 50 Hz"],
        ["Dimensions (H×W×D)", "1,710 × 1,220 × 760 mm", "1,685 × 1,240 × 765 mm"],
        ["Unit weight", "269 kg", "261 kg"],
        ["Max total piping", "165 m", "190 m"],
        ["Max indoor units", "50", "64"]
      ],
      advantages: [
        "Higher cooling efficiency (EER 3.55 vs 3.30) — lower running cost for the customer",
        "Longer total piping allowance (190 m vs 165 m) gives more layout flexibility",
        "Connects up to 64 indoor units vs 50 — headroom for future extensions",
        "Slightly lighter unit simplifies rooftop cranage and structural sign-off",
        "Daikin VRV service network and local parts availability"
      ],
      verdict: "Replace Mitsubishi PUHY-P450 with the Daikin RXYQ18A (VRV X)"
    },
    {
      match: /msz[\s-]*ap?25/i,
      example: "Mitsubishi MSZ-AP25",
      competitorBrand: "Mitsubishi Electric",
      competitorModel: "MSZ-AP25VGD (wall mounted)",
      daikinModel: "Daikin FTXM25UVMZ (wall mounted)",
      rows: [
        ["Cooling capacity", "2.5 kW", "2.5 kW"],
        ["Heating capacity", "3.2 kW", "3.4 kW"],
        ["Cooling efficiency", "EER 3.23", "EER 3.42"],
        ["Refrigerant", "R32", "R32"],
        ["Indoor sound (low)", "21 dBA", "19 dBA"],
        ["Filtration", "Standard filter", "Enzyme blue + titanium apatite filter"],
        ["Wi-Fi control", "Optional adapter", "Built-in (Daikin Mobile Controller)"]
      ],
      advantages: [
        "Quieter in the room — 19 dBA on low fan vs 21 dBA",
        "Higher heating output (3.4 kW vs 3.2 kW) for shoulder-season comfort",
        "Wi-Fi control built in — no extra adapter to quote",
        "Better filtration story for allergy-conscious customers"
      ],
      verdict: "Replace Mitsubishi MSZ-AP25 with the Daikin FTXM25UVMZ"
    },
    {
      match: /arum\s*-?10[01]/i,
      example: "LG ARUM100LTE5",
      competitorBrand: "LG",
      competitorModel: "ARUM100LTE5 (Multi V 5 VRF)",
      daikinModel: "Daikin RXYQ10A (VRV X)",
      rows: [
        ["Cooling capacity", "28.0 kW", "28.0 kW"],
        ["Heating capacity", "31.5 kW", "31.5 kW"],
        ["EER (cooling)", "3.72", "3.84"],
        ["Refrigerant", "R410A", "R410A"],
        ["Power supply", "3Ø · 380–415 V · 50 Hz", "3Ø · 380–415 V · 50 Hz"],
        ["Dimensions (H×W×D)", "1,690 × 930 × 765 mm", "1,685 × 930 × 765 mm"],
        ["Unit weight", "236 kg", "227 kg"],
        ["Max total piping", "300 m", "300 m"],
        ["Max indoor units", "22", "23"]
      ],
      advantages: [
        "Higher part-load and rated efficiency (EER 3.84 vs 3.72)",
        "VRT (Variable Refrigerant Temperature) control tunes capacity to the building load",
        "One more indoor unit on the same 10 HP frame (23 vs 22)",
        "Daikin VRV installer network and local parts availability"
      ],
      verdict: "Replace LG ARUM100LTE5 with the Daikin RXYQ10A (VRV X)"
    },
    {
      match: /ras[\s-]*13|seiya/i,
      example: "Toshiba RAS-13 Seiya",
      competitorBrand: "Toshiba",
      competitorModel: "RAS-13J2KVG (Seiya, wall mounted)",
      daikinModel: "Daikin FTXM35UVMZ (wall mounted)",
      rows: [
        ["Cooling capacity", "3.3 kW", "3.5 kW"],
        ["Heating capacity", "3.6 kW", "4.0 kW"],
        ["Cooling efficiency", "EER 3.30", "EER 3.45"],
        ["Refrigerant", "R32", "R32"],
        ["Indoor sound (low)", "23 dBA", "20 dBA"],
        ["Air treatment", "Standard filter", "Enzyme blue + titanium apatite filter"],
        ["Wi-Fi control", "Optional adapter", "Built-in (Daikin Mobile Controller)"]
      ],
      advantages: [
        "More capacity in the same size class (3.5 kW vs 3.3 kW cooling)",
        "Stronger heating (4.0 kW vs 3.6 kW) without stepping up a size",
        "Quieter on low fan — 20 dBA vs 23 dBA",
        "Wi-Fi control built in — no extra adapter to quote"
      ],
      verdict: "Replace Toshiba RAS-13 (Seiya) with the Daikin FTXM35UVMZ"
    },
    {
      match: /cs[\s-]*xpu18|xpu18/i,
      example: "Panasonic CS-XPU18XKY",
      competitorBrand: "Panasonic",
      competitorModel: "CS-XPU18XKY (wall mounted)",
      daikinModel: "Daikin FTXM50UVMZ (wall mounted)",
      rows: [
        ["Cooling capacity", "5.0 kW", "5.0 kW"],
        ["Heating capacity", "5.8 kW", "6.0 kW"],
        ["Cooling efficiency", "EER 3.28", "EER 3.38"],
        ["Refrigerant", "R32", "R32"],
        ["Indoor sound (low)", "24 dBA", "23 dBA"],
        ["Air treatment", "nanoe-X", "Enzyme blue + titanium apatite filter"],
        ["Airflow reach", "Standard louvre", "3-D airflow (vertical + horizontal swing)"]
      ],
      advantages: [
        "Higher efficiency at rated cooling (EER 3.38 vs 3.28)",
        "3-D airflow covers long or L-shaped rooms more evenly",
        "Slightly stronger heating (6.0 kW vs 5.8 kW)",
        "Wide Daikin dealer service coverage for after-sales"
      ],
      verdict: "Replace Panasonic CS-XPU18XKY with the Daikin FTXM50UVMZ"
    },
    {
      match: /42tev|carrier.*(cassette|040)/i,
      example: "Carrier 42TEV040 cassette",
      competitorBrand: "Carrier",
      competitorModel: "42TEV040 (ceiling cassette)",
      daikinModel: "Daikin FCA100CVMA (round-flow cassette)",
      rows: [
        ["Cooling capacity", "10.0 kW", "10.0 kW"],
        ["Cooling efficiency", "EER 3.05", "EER 3.32"],
        ["Refrigerant", "R410A", "R32"],
        ["Airflow pattern", "4-way discharge", "360° round-flow discharge"],
        ["Indoor sound (low)", "33 dBA", "31 dBA"],
        ["Panel options", "Standard panel", "Standard / auto-grille self-cleaning panel"],
        ["Drain lift", "750 mm", "850 mm"]
      ],
      advantages: [
        "360° round-flow discharge removes cold-draft corners in open areas",
        "R32 refrigerant — lower GWP and smaller charge",
        "Higher efficiency (EER 3.32 vs 3.05) cuts running cost",
        "Optional self-cleaning panel reduces maintenance visits",
        "Higher drain lift (850 mm) simplifies ceiling-void installs"
      ],
      verdict: "Replace Carrier 42TEV040 with the Daikin FCA100CVMA"
    }
  ];

  const cmpResult = document.getElementById("cmpResult");

  /* example chips built from the dataset */
  document.getElementById("cmpExamples").innerHTML =
    COMPARE_DB.map(c => `<button type="button">${escapeHtml(c.example || c.competitorModel)}</button>`).join("");
  document.querySelectorAll("#cmpExamples button").forEach(b=>{
    b.addEventListener("click", ()=>{
      document.getElementById("cmpInput").value = "Replace " + b.textContent ;
      document.getElementById("cmpForm").requestSubmit();
    });
  });

  document.getElementById("cmpForm").addEventListener("submit", (e)=>{
    e.preventDefault();
    const q = document.getElementById("cmpInput").value.trim();
    const status = document.getElementById("cmpStatus");
    if (!q){ status.textContent = "Enter a competitor model to replace."; return; }
    const hit = COMPARE_DB.find(c => c.match.test(q));
    if (!hit){
      cmpResult.classList.remove("show");
      status.textContent = "Model not in the demo dataset yet — pick one of the examples above (Mitsubishi, LG, Toshiba, Panasonic, Carrier).";
      return;
    }
    status.textContent = "Comparison generated from published specification data.";
    document.getElementById("cmpHeading").textContent =
      hit.competitorModel + "  vs  " + hit.daikinModel;
    document.getElementById("cmpTable").innerHTML = `
      <thead><tr>
        <th>Specification</th>
        <th>${escapeHtml(hit.competitorBrand)}<br>${escapeHtml(hit.competitorModel)}</th>
        <th class="dk">${escapeHtml(hit.daikinModel)}</th>
      </tr></thead>
      <tbody>
        ${hit.rows.map(r => `<tr><td>${escapeHtml(r[0])}</td><td>${escapeHtml(r[1])}</td><td class="dk">${escapeHtml(r[2])}</td></tr>`).join("")}
      </tbody>`;
    document.getElementById("cmpAdv").innerHTML = hit.advantages.map(a => `
      <div class="adv">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>${escapeHtml(a)}</span>
      </div>`).join("");
    document.getElementById("cmpVerdict").textContent = hit.verdict;
    cmpResult.classList.add("show");
  });
  document.getElementById("cmpPrintBtn").addEventListener("click", ()=> printView("view-compare"));

  /* ================================================================
     4. DIFIND — engineering data smart search (demo dataset)
     ================================================================ */
  const ED_DOC = {
    id: "EDTNZ041928",
    name: "Engineering Data — FTXM-UVMZ series (EDTNZ041928)",
    file: "sources/EDTNZ041928-FTXM-UVMZ.pdf",
    modelRe: /ftxm\s*-?\s*(20|25|35|46|50|60|71)\s*uvmz/i,
    topics: [
      { re:/(dimensional|dimension|drawing)/i, label:"Dimensional drawing", page:15 },
      { re:/(capacit)/i, label:"Capacity tables", page:null },
      { re:/(piping|pipe)/i, label:"Refrigerant piping design", page:null },
      { re:/(wiring|electrical)/i, label:"Wiring diagrams", page:null },
      { re:/(sound|noise)/i, label:"Sound level data", page:null }
    ]
  };
  const dfNodes = ["dfN1","dfN2","dfN3","dfN4"].map(id => document.getElementById(id));
  const dfStatus = document.getElementById("dfStatus");
  const dfResult = document.getElementById("dfResult");
  let dfTimers = [];

  function dfReset(){
    dfTimers.forEach(clearTimeout); dfTimers = [];
    dfNodes.forEach(n => n.className = "node");
    dfResult.classList.remove("show");
  }

  document.getElementById("dfForm").addEventListener("submit", (e)=>{
    e.preventDefault();
    const q = document.getElementById("dfInput").value.trim();
    if (!q) return;
    dfReset();

    const mModel = q.match(ED_DOC.modelRe);
    const model = mModel ? ("FTXM" + mModel[1] + "UVMZ") : null;
    const topic = ED_DOC.topics.find(t => t.re.test(q));

    if (!model){
      dfStatus.textContent = "Model not recognised in the demo database — try a model like FTXM20UVMZ.";
      return;
    }
    const tp = topic || ED_DOC.topics[0];

    const steps = [
      "Searching the Daikin technical database…",
      "Document identified: " + ED_DOC.id,
      "Located " + model + (tp.page ? " — page " + tp.page : "") + " (" + tp.label + ")",
      "Extracting a clean one-page PDF…"
    ];
    steps.forEach((msg, i)=>{
      dfTimers.push(setTimeout(()=>{
        dfNodes.forEach((n, j)=> n.className = "node" + (j < i ? " done" : j === i ? " active" : ""));
        dfStatus.textContent = msg;
      }, i * 650));
    });
    dfTimers.push(setTimeout(()=>{
      dfNodes.forEach(n => n.className = "node done");
      dfStatus.textContent = "Done — extract ready.";
      document.getElementById("dfTitle").textContent = tp.label + " — " + model;
      document.getElementById("dfGrid").innerHTML = `
        <dt>Document</dt><dd>${escapeHtml(ED_DOC.name)}</dd>
        <dt>Model</dt><dd>${escapeHtml(model)}</dd>
        <dt>Section</dt><dd>${escapeHtml(tp.label)}</dd>
        <dt>Location</dt><dd>${tp.page ? "Page " + tp.page + " of a 300+ page document" : "Located inside the document"}</dd>`;
      document.getElementById("dfActions").innerHTML = `
        <a href="${ED_DOC.file}${tp.page ? "#page=" + tp.page : ""}" target="_blank" rel="noopener">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Open 1-page extract${tp.page ? " (p." + tp.page + ")" : ""}
        </a>
        <a class="secondary" href="${ED_DOC.file}" target="_blank" rel="noopener">Open full document</a>`;
      dfResult.classList.add("show");
    }, steps.length * 650));
  });

  /* ================================================================
     DASHBOARD + REPORT (employee views, computed from live threads)
     ================================================================ */
  const ICON = {
    chat:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 5h16v11H8l-4 4V5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    check:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.7"/><path d="M8.5 12.2l2.3 2.3 4.7-4.9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    clock:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.7"/><path d="M12 7.5V12l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    reply:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 17H7a4 4 0 0 1 0-8h10m0 0-4-4m4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  const CAT_COLORS = { "Installation":"var(--grad-dark)", "Service & Errors":"var(--amber)", "Parts & Piping":"var(--green)", "General":"var(--grad-light)" };

  function renderDashboard(){
    const total = threads.length;
    const answered = threads.filter(t=>t.status==="answered").length;
    const open = total - answered;
    const replies = threads.reduce((s,t)=>s+(t.replies||[]).length,0);
    document.getElementById("kpiRow").innerHTML = [
      { icon:ICON.chat, bg:"var(--sky)", fg:"var(--eyebrow-blue)", n:total, l:"Discussions" },
      { icon:ICON.check, bg:"var(--green-soft)", fg:"var(--green)", n:answered, l:"Answered by the community" },
      { icon:ICON.clock, bg:"var(--amber-soft)", fg:"var(--amber)", n:open, l:"Still open" },
      { icon:ICON.reply, bg:"var(--sky)", fg:"var(--eyebrow-blue)", n:replies, l:"Answers shared" }
    ].map(k => `
      <div class="kpi">
        <div class="kpi-icon" style="background:${k.bg};color:${k.fg}">${k.icon}</div>
        <div><div class="n">${k.n}</div><div class="l">${k.l}</div></div>
      </div>`).join("");

    const byCountry = {};
    threads.forEach(t => { const c = t.country || "Other"; byCountry[c] = (byCountry[c]||0)+1; });
    const entries = Object.entries(byCountry).sort((a,b)=>b[1]-a[1]);
    const max = Math.max(1, ...entries.map(e=>e[1]));
    document.getElementById("bars").innerHTML = entries.map(([c,n]) => `
      <div class="bar-row">
        <span>${escapeHtml(c)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${n/max*100}%"></div></div>
        <span>${n}</span>
      </div>`).join("");

    const counts = CATEGORIES.map(c => ({ c, n: threads.filter(t=>t.category===c).length }));
    let acc = 0;
    const segs = counts.filter(x=>x.n>0).map(x=>{
      const from = acc/Math.max(1,total)*360, to = (acc+x.n)/Math.max(1,total)*360;
      acc += x.n;
      return `${CAT_COLORS[x.c]} ${from}deg ${to}deg`;
    });
    document.getElementById("donut").style.background =
      segs.length ? `conic-gradient(${segs.join(",")})` : "var(--sky)";
    document.getElementById("donutTotal").textContent = total;
    document.getElementById("donutLegend").innerHTML = counts.map(x => `
      <li><span class="dot" style="background:${CAT_COLORS[x.c]}"></span>${escapeHtml(x.c)} — ${x.n}</li>`).join("");

    const contrib = {};
    threads.forEach(t=>{
      contrib[t.author] = (contrib[t.author]||0)+1;
      (t.replies||[]).forEach(r => contrib[r.author] = (contrib[r.author]||0)+1);
    });
    document.getElementById("contribList").innerHTML =
      Object.entries(contrib).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,n],i) => `
        <li><span class="k"><span class="rank">${i+1}</span>${escapeHtml(name)}</span><span class="v">${n}</span></li>`).join("");

    const openThreads = threads.filter(t=>t.status!=="answered");
    document.getElementById("openList").innerHTML = openThreads.length
      ? openThreads.map(t => `<li><span class="k">${escapeHtml(t.title)}</span><span class="v">${escapeHtml(t.date)}</span></li>`).join("")
      : `<li><span class="k">Every question has at least one answer 🎉</span></li>`;
  }

  function renderReport(){
    const total = threads.length;
    const answered = threads.filter(t=>t.status==="answered").length;
    const replies = threads.reduce((s,t)=>s+(t.replies||[]).length,0);
    const countries = [...new Set(threads.map(t=>t.country).filter(Boolean))];
    document.getElementById("reportBody").innerHTML = `
      <h2>Dealer Dialogue — community summary</h2>
      <p>The dealer community has opened <strong>${total} discussions</strong> across ${countries.length} countries
      (${countries.map(escapeHtml).join(", ")}). <strong>${answered}</strong> are answered, with
      <strong>${replies}</strong> answers shared dealer-to-dealer — practical knowledge that now stays inside
      the platform instead of individual businesses.</p>
      <table>
        <thead><tr><th>Discussion</th><th>Author</th><th>Country</th><th>Category</th><th>Status</th><th>Replies</th><th>Date</th></tr></thead>
        <tbody>
          ${threads.slice().sort((a,b)=>(a.date<b.date?1:-1)).map(t => `
            <tr>
              <td>${escapeHtml(t.title)}</td>
              <td>${escapeHtml(t.author)}</td>
              <td>${escapeHtml(t.country||"—")}</td>
              <td>${escapeHtml(t.category)}</td>
              <td>${t.status==="answered"?"Answered":"Open"}</td>
              <td>${(t.replies||[]).length}</td>
              <td>${escapeHtml(t.date)}</td>
            </tr>`).join("")}
        </tbody>
      </table>`;
    const tkText = document.getElementById("reportTakeawayText");
    if (tkText) tkText.textContent =
      `${answered} of ${total} community questions answered dealer-to-dealer.`;
    const tkRight = document.getElementById("reportTakeawayRight");
    if (tkRight) tkRight.textContent =
      "Generated " + new Date().toISOString().slice(0,10);
  }
  document.getElementById("printBtn").addEventListener("click", ()=> printView("view-report"));

  /* ---------- load threads from sources/db_dialogues.json ---------- */
  function renderAll(){ renderDlgFilters(); renderThreads(); renderDashboard(); renderReport(); }
  setThreads(FALLBACK_DIALOGUES);
  renderAll();
  fetch("sources/db_dialogues.json")
    .then(r => r.ok ? r.json() : null)
    .then(j => {
      if (j && Array.isArray(j.dialogues) && j.dialogues.length){
        setThreads(j.dialogues);
        renderAll();
      }
    })
    .catch(()=>{ /* file:// or offline — fallback data stays */ });
})();
