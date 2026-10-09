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