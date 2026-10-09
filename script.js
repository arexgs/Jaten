/* ==========================================================
   PORTAL KELURAHAN - script.js
   Perpindahan tampilan (single page), dropdown, menu mobile.
   Tidak perlu diubah saat menambah konten. Untuk menambah
   kelurahan baru: tambah <section class="view" id="..."> dan
   satu tombol di dropdown dengan data-view="id-yang-sama".
   ========================================================== */
(function () {
  "use strict";

  var views = document.querySelectorAll(".view");
  var viewButtons = document.querySelectorAll("[data-view]");
  var dropdownItem = document.querySelector(".has-dropdown");
  var dropdownToggle = document.getElementById("dropdown-toggle");
  var navMenu = document.getElementById("nav-menu");
  var navToggle = document.getElementById("nav-toggle");

  function closeMenus() {
    dropdownItem.classList.remove("open");
    dropdownToggle.setAttribute("aria-expanded", "false");
    navMenu.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  function showView(id, updateHash) {
    var target = document.getElementById(id);
    if (!target || !target.classList.contains("view")) { id = "halaman-utama"; target = document.getElementById(id); }
    views.forEach(function (v) { v.classList.toggle("active", v === target); });
    viewButtons.forEach(function (b) {
      var on = b.getAttribute("data-view") === id;
      if (b.closest(".dropdown") || b.classList.contains("nav-link")) b.classList.toggle("active", on);
    });
    dropdownToggle.classList.toggle("active", id !== "halaman-utama");
    if (updateHash !== false && location.hash !== "#" + id) history.pushState(null, "", "#" + id);
    document.title = (target.getAttribute("data-title") || "Portal Kelurahan");
    window.scrollTo(0, 0);
    closeMenus();
    document.dispatchEvent(new CustomEvent("viewchange", { detail: id }));
  }

  viewButtons.forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault();
      showView(b.getAttribute("data-view"));
    });
  });

  dropdownToggle.addEventListener("click", function (e) {
    e.stopPropagation();
    var open = dropdownItem.classList.toggle("open");
    dropdownToggle.setAttribute("aria-expanded", String(open));
  });

  navToggle.addEventListener("click", function () {
    var open = navMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  document.addEventListener("click", function (e) {
    if (!dropdownItem.contains(e.target)) {
      dropdownItem.classList.remove("open");
      dropdownToggle.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenus(); });

  window.addEventListener("popstate", function () { showView(location.hash.slice(1), false); });
  window.addEventListener("resize", function () { if (window.innerWidth > 900) closeMenus(); });

  showView(location.hash.slice(1) || "halaman-utama", false);
})();

/* ==========================================================
   FITUR TAMBAHAN (di bawah ini)
   A. Konfigurasi  B. Pintasan & skip link  C. Pengumuman popup
   D. Data BPS     E. Form aduan            F. Menu aksesibilitas
   ========================================================== */

/* ---------- A. KONFIGURASI (edit di sini) ---------- */
var PORTAL_CONFIG = {
  // URL endpoint penerima aduan (mis. Google Apps Script / API Laravel).
  // Kosong = mode uji coba: form tervalidasi tapi data TIDAK dikirim ke mana pun.
  ADUAN_ENDPOINT: "",
  BPS_SUMBER_NAMA: "BPS Kabupaten Karanganyar, Kecamatan Jaten Dalam Angka 2025",
  BPS_SUMBER_URL: "https://karanganyarkab.bps.go.id/en/publication/2025/09/26/a9c4e8c54578ff656924a018/kecamatan-jaten-dalam-angka-2025.html",
  BPS_TAHUN: "[Tahun data]"
};

/* Isi angka dari publikasi BPS. null = belum diisi (tampil "-"). Satu blok per kelurahan. */
function bpsKosong() {
  return {
    penduduk: [
      { label: "Laki-laki", nilai: null },
      { label: "Perempuan", nilai: null }
    ],
    pendidikan: [
      { label: "TK/RA", sekolah: null, murid: null },
      { label: "SD/MI", sekolah: null, murid: null },
      { label: "SMP/MTs", sekolah: null, murid: null },
      { label: "SMA/SMK/MA", sekolah: null, murid: null }
    ],
    kelahiran: [
      { label: "2021", nilai: null }, { label: "2022", nilai: null },
      { label: "2023", nilai: null }, { label: "2024", nilai: null },
      { label: "2025", nilai: null }
    ]
  };
}
var BPS_DATA = { dagen: bpsKosong(), ngringo: bpsKosong(), sroyo: bpsKosong() };

(function () {
  "use strict";

  var root = document.documentElement;
  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (a) { n.setAttribute(a, attrs[a]); });
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fmt(n) { return n == null ? "-" : Number(n).toLocaleString("id-ID"); }

  /* ---------- B. PINTASAN & SKIP LINK ---------- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-scroll]");
    if (b) {
      e.preventDefault();
      var t = document.getElementById(b.getAttribute("data-scroll"));
      if (t) {
        var modal = b.closest(".peng-modal");
        if (modal) closeModal(modal);
        t.scrollIntoView({ behavior: "smooth", block: "start" });
        if (!t.hasAttribute("tabindex")) t.setAttribute("tabindex", "-1");
        t.focus({ preventScroll: true });
      }
    }
    if (e.target.closest("[data-skip]")) {
      e.preventDefault();
      var m = document.getElementById("main-content");
      m.focus({ preventScroll: true });
      m.scrollIntoView();
    }
  });

  /* ---------- C. PENGUMUMAN: popup sekali per sesi ---------- */
  var lastFocus = null;
  function closeModal(m) {
    m.hidden = true;
    document.removeEventListener("keydown", m._trap);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function openModal(sec) {
    var first = sec.querySelector(".peng-item");
    if (!first) return;
    var date = first.querySelector(".peng-date").textContent;
    var h = first.querySelector("h3").textContent;
    var p = first.querySelector("p").textContent;
    var id = sec.id + "-modal";
    var m = document.getElementById(id);
    if (!m) {
      m = el("div", { "class": "peng-modal", id: id, role: "alertdialog", "aria-modal": "true", "aria-labelledby": id + "-t", "aria-describedby": id + "-d" });
      sec.appendChild(m);
    }
    m.innerHTML =
      '<div class="peng-dialog"><div class="peng-dialog-head"><h2 id="' + id + '-t">Pengumuman Penting</h2>' +
      '<button type="button" class="peng-x" aria-label="Tutup pengumuman">&times;</button></div>' +
      '<div class="peng-dialog-body" id="' + id + '-d"><p class="news-meta">' + esc(date) + '</p><h3>' + esc(h) + '</h3><p>' + esc(p) + '</p>' +
      '<div class="peng-dialog-actions"><button type="button" class="btn" data-scroll="' + sec.id + '">Lihat semua pengumuman</button>' +
      '<button type="button" class="btn btn-ghost peng-close">Tutup</button></div></div></div>';
    m.hidden = false;
    lastFocus = document.activeElement;
    var closeBtns = m.querySelectorAll(".peng-x,.peng-close");
    closeBtns.forEach(function (c) { c.addEventListener("click", function () { closeModal(m); }); });
    m.addEventListener("click", function (e) { if (e.target === m) closeModal(m); });
    m._trap = function (e) {
      if (e.key === "Escape") { closeModal(m); return; }
      if (e.key !== "Tab") return;
      var f = m.querySelectorAll("button");
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener("keydown", m._trap);
    m.querySelector(".peng-x").focus();
  }
  function onView(id) {
    var sec = document.getElementById(id);
    if (!sec) return;
    var peng = sec.querySelector(".pengumuman[data-popup]");
    if (peng && !safeSession(id)) { markSession(id); openModal(peng); }
  }
  function safeSession(id) { try { return sessionStorage.getItem("peng-" + id); } catch (e) { return null; } }
  function markSession(id) { try { sessionStorage.setItem("peng-" + id, "1"); } catch (e) {} }
  document.addEventListener("viewchange", function (e) { onView(e.detail); });

  /* ---------- D. DATA BPS ---------- */
  function bars(rows, key) {
    var max = Math.max.apply(null, rows.map(function (r) { return r[key] || 0; })) || 1;
    return rows.map(function (r) {
      var w = r[key] == null ? 0 : Math.max(2, Math.round(r[key] / max * 100));
      return '<div class="bar-row" aria-hidden="true"><span>' + esc(r.label) + '</span><span class="bar-track"><span class="bar-fill" style="width:' + w + '%"></span></span><span class="bar-val">' + fmt(r[key]) + '</span></div>';
    }).join("");
  }
  function table(caption, head, rowsHtml) {
    return '<div class="bps-table-wrap"><table><caption>' + caption + '</caption><thead><tr>' + head + '</tr></thead><tbody>' + rowsHtml + '</tbody></table></div>';
  }
  function renderBps(box) {
    var d = BPS_DATA[box.getAttribute("data-kel")];
    if (!d) return;
    var uid = box.parentNode.parentNode.id;
    var empty = JSON.stringify(d).indexOf("null") > -1;
    var total = d.penduduk.reduce(function (s, r) { return s + (r.nilai || 0); }, 0);

    var pend = '<div class="bps-grid"><div>' + bars(d.penduduk, "nilai") +
      '<p><strong>Total penduduk:</strong> ' + (d.penduduk.some(function (r) { return r.nilai == null; }) ? "-" : fmt(total)) + '</p></div>' +
      table("Jumlah penduduk menurut jenis kelamin", '<th scope="col">Jenis kelamin</th><th scope="col" class="num">Jiwa</th>',
        d.penduduk.map(function (r) { return '<tr><th scope="row">' + esc(r.label) + '</th><td class="num">' + fmt(r.nilai) + '</td></tr>'; }).join("")) + '</div>';

    var pdd = '<div class="bps-grid"><div>' + bars(d.pendidikan, "murid") +
      '<p class="hint">Grafik: jumlah murid per jenjang.</p></div>' +
      table("Jumlah sekolah dan murid menurut jenjang", '<th scope="col">Jenjang</th><th scope="col" class="num">Sekolah</th><th scope="col" class="num">Murid</th>',
        d.pendidikan.map(function (r) { return '<tr><th scope="row">' + esc(r.label) + '</th><td class="num">' + fmt(r.sekolah) + '</td><td class="num">' + fmt(r.murid) + '</td></tr>'; }).join("")) + '</div>';

    var lhr = '<div class="bps-grid"><div>' + bars(d.kelahiran, "nilai") + '</div>' +
      table("Jumlah kelahiran menurut tahun", '<th scope="col">Tahun</th><th scope="col" class="num">Kelahiran</th>',
        d.kelahiran.map(function (r) { return '<tr><th scope="row">' + esc(r.label) + '</th><td class="num">' + fmt(r.nilai) + '</td></tr>'; }).join("")) + '</div>';

    var tabs = [["penduduk", "Kependudukan", pend], ["pendidikan", "Pendidikan", pdd], ["kelahiran", "Kelahiran", lhr]];
    var h = (empty ? '<p class="bps-note">Sebagian angka belum diisi. Salin dari publikasi BPS pada tautan sumber di bawah, lalu isi <code>BPS_DATA</code> di <code>script.js</code>.</p>' : "") +
      '<div class="bps-tabs" role="tablist" aria-label="Kategori data statistik">' +
      tabs.map(function (t, i) { return '<button type="button" role="tab" class="bps-tab" id="' + uid + '-tab-' + t[0] + '" aria-selected="' + (i === 0) + '" aria-controls="' + uid + '-pan-' + t[0] + '" tabindex="' + (i === 0 ? 0 : -1) + '">' + t[1] + '</button>'; }).join("") + '</div>' +
      tabs.map(function (t, i) { return '<div role="tabpanel" class="bps-panel" id="' + uid + '-pan-' + t[0] + '" aria-labelledby="' + uid + '-tab-' + t[0] + '"' + (i ? " hidden" : "") + '>' + t[2] + '</div>'; }).join("") +
      '<p class="bps-source">Sumber: <a href="' + PORTAL_CONFIG.BPS_SUMBER_URL + '" target="_blank" rel="noopener">' + esc(PORTAL_CONFIG.BPS_SUMBER_NAMA) + '<span class="sr-only"> (membuka tab baru)</span></a>. Tahun data: ' + esc(PORTAL_CONFIG.BPS_TAHUN) + '.</p>';
    box.innerHTML = h;

    var tabEls = box.querySelectorAll(".bps-tab");
    function select(i) {
      tabEls.forEach(function (t, j) {
        t.setAttribute("aria-selected", j === i); t.tabIndex = j === i ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = j !== i;
      });
      tabEls[i].focus();
    }
    tabEls.forEach(function (t, i) {
      t.addEventListener("click", function () { select(i); });
      t.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { e.preventDefault(); select((i + 1) % tabEls.length); }
        if (e.key === "ArrowLeft") { e.preventDefault(); select((i - 1 + tabEls.length) % tabEls.length); }
      });
    });
  }
  document.querySelectorAll(".bps[data-kel]").forEach(renderBps);

  /* ---------- E. FORM ADUAN ---------- */
  function initForm(form) {
    var summary = form.querySelector(".form-error-summary");
    var result = form.parentNode.querySelector(".aduan-result");
    var anon = false;
    function f(n) { return form.elements[n]; }
    function fieldOf(n) {
      var c = f(n);
      c = c && c.length && !c.tagName ? c[0] : c;
      return c.closest(".field");
    }
    function setError(name, msg) {
      var w = fieldOf(name), er = w.querySelector(".field-error");
      er.textContent = msg || "";
      var ctrl = f(name); ctrl = ctrl && ctrl.length && !ctrl.tagName ? ctrl[0] : ctrl;
      if (w.tagName !== "FIELDSET") { if (msg) ctrl.setAttribute("aria-invalid", "true"); else ctrl.removeAttribute("aria-invalid"); }
    }
    function value(n) {
      var c = f(n);
      if (c && c.length && !c.tagName) { for (var i = 0; i < c.length; i++) if (c[i].checked) return c[i].value; return ""; }
      return c.value.trim();
    }
    function check(name) {
      var w = fieldOf(name);
      var needed = w.hasAttribute("data-required") && !w.classList.contains("optional");
      var v = value(name), msg = "";
      var label = (w.querySelector("label,legend").textContent || "").replace("*", "").trim();
      if (needed && !v) msg = label + " wajib diisi.";
      else if (v && name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = "Format surel tidak valid, contoh: nama@email.com.";
      else if (v && name === "telepon" && !/^\+?[0-9]{8,15}$/.test(v.replace(/[\s-]/g, ""))) msg = "Nomor telepon harus 8-15 digit angka.";
      else if (v && name === "isi" && v.length < 20) msg = "Isi aduan minimal 20 karakter agar dapat ditindaklanjuti.";
      setError(name, msg);
      return msg ? { name: name, msg: msg } : null;
    }
    var names = ["sifat", "judul", "isi", "kategori", "kecamatan_aduan", "kelurahan_aduan", "nama", "email", "telepon", "jk", "domisili", "kecamatan_pengirim", "kelurahan_pengirim"];

    // Sifat anonim: data pengirim tidak wajib
    function applyAnon() {
      anon = value("sifat") === "anonim";
      form.querySelectorAll("[data-sender]").forEach(function (w) { w.classList.toggle("optional", anon); });
      form.querySelector(".sender-note").hidden = !anon;
      if (anon) ["nama", "email", "telepon", "jk", "domisili", "kecamatan_pengirim", "kelurahan_pengirim"].forEach(function (n) { if (!value(n)) setError(n, ""); });
    }
    form.querySelectorAll('input[name="sifat"]').forEach(function (r) { r.addEventListener("change", applyAnon); });

    // Domisili: dalam Jaten -> kecamatan terisi otomatis
    function applyDomisili() {
      var d = value("domisili"), kec = f("kecamatan_pengirim");
      if (d === "dalam") { kec.value = "Jaten"; kec.readOnly = true; }
      else { if (kec.readOnly) kec.value = ""; kec.readOnly = false; }
    }
    f("domisili").addEventListener("change", applyDomisili);

    // Penghitung karakter
    var isi = f("isi"), cnt = document.getElementById(isi.id + "-count");
    isi.addEventListener("input", function () { cnt.textContent = isi.value.length + " / 1000 karakter"; });

    // Validasi saat keluar kolom
    names.forEach(function (n) {
      var c = f(n); if (!c) return;
      var list = c.length && !c.tagName ? Array.prototype.slice.call(c) : [c];
      list.forEach(function (x) { x.addEventListener("blur", function () { if (value(n) || x.getAttribute("aria-invalid")) check(n); }); });
    });

    form.addEventListener("reset", function () {
      setTimeout(function () {
        names.forEach(function (n) { setError(n, ""); });
        summary.hidden = true; applyAnon(); applyDomisili(); cnt.textContent = "0 / 1000 karakter";
        f("kecamatan_aduan").value = "Jaten"; f("kelurahan_aduan").value = form.getAttribute("data-kelname");
      }, 0);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var errs = names.map(check).filter(Boolean);
      if (errs.length) {
        summary.hidden = false;
        summary.innerHTML = "Mohon periksa " + errs.length + " kolom berikut:<ul>" + errs.map(function (x) { return "<li>" + esc(x.msg) + "</li>"; }).join("") + "</ul>";
        summary.focus();
        var c = f(errs[0].name); (c.length && !c.tagName ? c[0] : c).focus();
        return;
      }
      summary.hidden = true;
      var d = new Date();
      var pad = function (n) { return String(n).padStart(2, "0"); };
      var kode = "ADU-" + form.getAttribute("data-code") + "-" + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      var payload = { kode: kode, waktu: d.toISOString(), kelurahan_halaman: form.getAttribute("data-kelname") };
      names.forEach(function (n) { payload[n] = value(n); });
      if (anon) { ["nama", "email", "telepon", "jk", "domisili", "kecamatan_pengirim", "kelurahan_pengirim"].forEach(function (n) { payload[n] = ""; }); }

      var btn = form.querySelector('button[type="submit"]'); btn.disabled = true; btn.textContent = "Mengirim...";
      function done(ok, demo) {
        btn.disabled = false; btn.textContent = "Kirim Aduan";
        result.hidden = false;
        if (ok) {
          result.innerHTML = "<p><strong>Aduan berhasil dicatat.</strong> Simpan kode berikut untuk pelacakan:</p><strong class=\"kode\">" + kode + "</strong>" +
            (demo ? "<p class=\"demo\">Mode uji coba: formulir belum terhubung ke server, jadi data belum benar-benar terkirim. Isi <code>ADUAN_ENDPOINT</code> di script.js.</p>" : "");
          form.reset();
        } else {
          result.innerHTML = "<p><strong>Aduan belum terkirim.</strong> Periksa koneksi internet lalu coba lagi.</p>";
        }
        result.focus();
      }
      if (!PORTAL_CONFIG.ADUAN_ENDPOINT) { console.warn("[Aduan] ADUAN_ENDPOINT kosong, payload tidak dikirim:", payload); setTimeout(function () { done(true, true); }, 400); return; }
      fetch(PORTAL_CONFIG.ADUAN_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); done(true, false); })
        .catch(function () { done(false); });
    });
    applyAnon(); applyDomisili();
  }
  document.querySelectorAll(".aduan-form").forEach(initForm);

  /* ---------- F. MENU AKSESIBILITAS ---------- */
  var panel = document.getElementById("a11y-panel"), fab = document.getElementById("a11y-toggle");
  var SIZES = [1, 1.125, 1.25, 1.5, 1.75];
  var state = { size: 0, flags: {} };
  try { var saved = JSON.parse(safeGet("a11y-state") || "null"); if (saved) state = saved; } catch (e) {}
  var guide = document.getElementById("a11y-guide");

  function applyState() {
    root.style.setProperty("--a11y-scale", SIZES[state.size] || 1);
    document.getElementById("a11y-size").textContent = Math.round((SIZES[state.size] || 1) * 100) + "%";
    document.querySelectorAll("[data-a11y]").forEach(function (b) {
      var k = b.getAttribute("data-a11y"), on = !!state.flags[k];
      b.setAttribute("aria-pressed", on);
      root.classList.toggle("a11y-" + k, on);
    });
    guide.hidden = !state.flags.guide;
    safeSet("a11y-state", JSON.stringify(state));
  }
  function openPanel(open) {
    panel.hidden = !open;
    fab.setAttribute("aria-expanded", open);
    fab.setAttribute("aria-label", open ? "Tutup menu aksesibilitas" : "Buka menu aksesibilitas");
    if (open) panel.querySelector("button").focus(); else fab.focus();
  }
  fab.addEventListener("click", function () { openPanel(panel.hidden); });
  document.getElementById("a11y-close").addEventListener("click", function () { openPanel(false); });
  panel.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.stopPropagation(); openPanel(false); } });
  document.querySelectorAll("[data-a11y]").forEach(function (b) {
    b.addEventListener("click", function () { var k = b.getAttribute("data-a11y"); state.flags[k] = !state.flags[k]; applyState(); });
  });
  document.querySelectorAll("[data-a11y-size]").forEach(function (b) {
    b.addEventListener("click", function () {
      state.size = Math.min(SIZES.length - 1, Math.max(0, state.size + Number(b.getAttribute("data-a11y-size")))); applyState();
    });
  });
  document.getElementById("a11y-reset").addEventListener("click", function () { state = { size: 0, flags: {} }; stopSpeech(); applyState(); });
  document.addEventListener("mousemove", function (e) { if (state.flags.guide) guide.style.top = (e.clientY - 23) + "px"; });
  document.addEventListener("focusin", function (e) {
    if (state.flags.guide && e.target.getBoundingClientRect) guide.style.top = (e.target.getBoundingClientRect().top + e.target.offsetHeight / 2 - 23) + "px";
  });

  // Bacakan teks (Web Speech API, bahasa Indonesia)
  var speechOK = "speechSynthesis" in window;
  function stopSpeech() { if (speechOK) speechSynthesis.cancel(); }
  document.getElementById("a11y-stop").addEventListener("click", stopSpeech);
  document.getElementById("a11y-read").addEventListener("click", function () {
    if (!speechOK) { alert("Peramban ini belum mendukung fitur bacakan teks."); return; }
    stopSpeech();
    var sel = String(window.getSelection ? window.getSelection() : "").trim();
    var text = sel || (document.querySelector(".view.active") || document.body).innerText;
    var chunks = text.replace(/\s+/g, " ").match(/[^.!?]+[.!?]?/g) || [];
    var voices = speechSynthesis.getVoices();
    var idVoice = voices.filter(function (v) { return /^id/i.test(v.lang); })[0];
    chunks.forEach(function (c) {
      if (!c.trim()) return;
      var u = new SpeechSynthesisUtterance(c.trim());
      u.lang = "id-ID"; if (idVoice) u.voice = idVoice;
      speechSynthesis.speak(u);
    });
  });

  applyState();
  // Popup pengumuman untuk halaman yang aktif saat pertama dimuat
  var active = document.querySelector(".view.active");
  if (active) onView(active.id);
})();
