/* PARMAAN - Digital Forensics Workspace (prototype frontend, no build step) */
(function () {
"use strict";
function $(s, r) { return (r || document).querySelector(s); }
function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function lsGet(k, fb) { try { var v = localStorage.getItem("prm_" + k); return v == null ? fb : JSON.parse(v); } catch (e) { return fb; } }
function lsSet(k, v) { try { localStorage.setItem("prm_" + k, JSON.stringify(v)); } catch (e) {} }
function t(key, fb) {
  var lang = S.lang || "en";
  var pack = (window.PRM_DATA && PRM_DATA.I18N && PRM_DATA.I18N[lang]) || {};
  if (pack[key]) return pack[key];
  var en = (window.PRM_DATA && PRM_DATA.I18N && PRM_DATA.I18N.en) || {};
  if (en[key]) return en[key];
  if (fb != null) return fb;
  var clean = String(key || "").trim();
  if (pack[clean]) return pack[clean];
  if (pack[clean.toLowerCase()]) return pack[clean.toLowerCase()];
  return key;
}
function applyTranslation(rootNode) {
  if (!rootNode) return;
  var lang = (typeof S !== "undefined" && S.lang) || "en";
  if (lang === "en") return;
  var dict = (window.PRM_DATA && PRM_DATA.I18N && PRM_DATA.I18N[lang]) || {};
  if (!dict || Object.keys(dict).length === 0) return;
  var walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT, null, false);
  var node;
  while ((node = walker.nextNode())) {
    var txt = node.nodeValue;
    if (!txt) continue;
    var trimmed = txt.trim();
    if (!trimmed) continue;
    if (dict[trimmed]) {
      node.nodeValue = txt.replace(trimmed, dict[trimmed]);
      continue;
    }
    if (dict[trimmed.toLowerCase()]) {
      node.nodeValue = txt.replace(trimmed, dict[trimmed.toLowerCase()]);
      continue;
    }
    if (trimmed.indexOf("← ") === 0) {
      var sub = trimmed.slice(2).trim();
      if (dict[sub]) { node.nodeValue = txt.replace(trimmed, "← " + dict[sub]); continue; }
    }
    if (trimmed.slice(-2) === " →") {
      var sub2 = trimmed.slice(0, -2).trim();
      if (dict[sub2]) { node.nodeValue = txt.replace(trimmed, dict[sub2] + " →"); continue; }
    }
    if (trimmed.indexOf(" · ") >= 0) {
      var parts = trimmed.split(" · ");
      var any = false;
      for (var p = 0; p < parts.length; p++) {
        var pt = parts[p].trim();
        if (dict[pt]) { parts[p] = dict[pt]; any = true; }
      }
      if (any) {
        node.nodeValue = txt.replace(trimmed, parts.join(" · "));
        continue;
      }
    }
    if (txt.indexOf("\n") >= 0) {
      var lines = txt.split("\n");
      var modified = false;
      for (var li = 0; li < lines.length; li++) {
        var lt = lines[li].trim();
        if (!lt) continue;
        if (dict[lt]) { lines[li] = lines[li].replace(lt, dict[lt]); modified = true; }
        else if (dict[lt.toLowerCase()]) { lines[li] = lines[li].replace(lt, dict[lt.toLowerCase()]); modified = true; }
      }
      if (modified) {
        node.nodeValue = lines.join("\n");
        continue;
      }
    }
  }
  var els = rootNode.querySelectorAll("[placeholder], [title], [aria-label]");
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    var ph = el.getAttribute("placeholder");
    if (ph && dict[ph.trim()]) el.setAttribute("placeholder", dict[ph.trim()]);
    var tit = el.getAttribute("title");
    if (tit && dict[tit.trim()]) el.setAttribute("title", dict[tit.trim()]);
    var al = el.getAttribute("aria-label");
    if (al && dict[al.trim()]) el.setAttribute("aria-label", dict[al.trim()]);
  }
}
function langLabel(id) {
  var l = PRM_DATA.LANGS.filter(function (x) { return x.id === id; })[0];
  return l ? l.label : id;
}
function greet() { var h = new Date().getHours(); if (h < 12) return t("goodMorning", "Good morning"); if (h < 17) return t("goodAfternoon", "Good afternoon"); return t("goodEvening", "Good evening"); }
function canDo(action) {
  return true;
}
function needRole(action) {
  return false;
}

var S = {
  route: "landing",
  routeParam: null,
  lang: lsGet("lang", "en"),
  mode: lsGet("expert", false) ? "expert" : "guided",
  role: lsGet("role", "investigator"),
  collapsed: lsGet("sidebar", false),
  operator: lsGet("operator", "R. Patil"),
  settings: Object.assign({ confirmDestructive: true, density: "comfortable", reducedMotion: false, voice: false, sessionTimeout: "30 min", clipboardWarn: true, defFormat: "PDF", incHashes: true, incOperator: true, certPrefix: "PRM-SAN-2026-", evLocation: "Local encrypted vault", verbose: false }, lsGet("settings", {})),
  erase: Object.assign({ step: 1, tab: "drives", deviceId: "dev-nvme-01", methodId: "recommended", toolId: "nwipe", passes: 3, pattern: "00 / FF / Random", verifyPct: 100, blockSize: "4 MiB", forceUnmount: true, eraseMode: "standard", discard: false, confirm: false, typeConfirm: "", opId: null, certId: null }, lsGet("erase", {})),
  recover: Object.assign({ step: 1, tab: "drive", sourceId: "dev-usb-02", uploadName: null, scanId: "deep", fs: "auto", sectorFrom: "", sectorTo: "", carve: "signature", sigs: ["JPG", "PDF", "DOCX", "MP4"], delParse: true, alloc: "both", metaRec: true, recur: false, filter: "all", search: "", sort: "name", sortDir: 1, selected: [], previewId: null, insTab: "preview", opId: null, recOpId: null, recProgress: 0, recDone: false }, lsGet("recover", {})),
  evidence: Object.assign({ view: "list", search: "", fCase: "all", fType: "all", fTag: "all", fInteg: "all", sort: "added", sortDir: -1, openId: null, insTab: "preview" }, lsGet("evidenceUI", {})),
  verify: Object.assign({ tab: "file", algo: "SHA-256", fileName: null, fileSeed: null, progress: 0, done: false, calc: null, expected: "", verdict: null, evId: null }, lsGet("verifyUI", {})),
  audit: Object.assign({ search: "", fUser: "all", fAction: "all", fCase: "all", fSev: "all", sortDir: -1, openId: null }, lsGet("auditUI", {})),
  reports: Object.assign({ wizStep: 1, wizType: "Sanitization Certificate", wizCase: "PRM-2026-0042", wizFmt: "PDF", secs: { summary: true, inventory: true, hashes: true, ops: true, recovery: false, custody: true, audit: true, operator: true }, openId: null, genProgress: 0, genDone: false }, lsGet("reportsUI", {})),
  activity: Object.assign({ tab: "running" }, lsGet("activityUI", {})),
  cases: Object.assign({ openTab: "overview", openId: null, noteDraft: "" }, lsGet("casesUI", {})),
  devices: Object.assign({ search: "", openId: null, loading: false }, lsGet("devicesUI", {})),
  custody: Object.assign({ search: "", openId: null }, lsGet("custodyUI", {})),
  settingsTab: lsGet("settingsTab", "general"),
  onboardStep: 0,
  paletteIdx: 0,
  capTab: "erase"
};
window.S = S;
function persist() {
  lsSet("lang", S.lang); lsSet("expert", S.mode === "expert"); lsSet("role", S.role);
  lsSet("sidebar", S.collapsed); lsSet("operator", S.operator); lsSet("settings", S.settings);
  lsSet("erase", { step: S.erase.step, tab: S.erase.tab, deviceId: S.erase.deviceId, methodId: S.erase.methodId, toolId: S.erase.toolId, passes: S.erase.passes, pattern: S.erase.pattern, verifyPct: S.erase.verifyPct, blockSize: S.erase.blockSize, forceUnmount: S.erase.forceUnmount, eraseMode: S.erase.eraseMode, discard: S.erase.discard, confirm: false, typeConfirm: "", opId: S.erase.opId, certId: S.erase.certId });
  lsSet("recover", { step: S.recover.step, tab: S.recover.tab, sourceId: S.recover.sourceId, uploadName: S.recover.uploadName, scanId: S.recover.scanId, fs: S.recover.fs, sectorFrom: S.recover.sectorFrom, sectorTo: S.recover.sectorTo, carve: S.recover.carve, sigs: S.recover.sigs, delParse: S.recover.delParse, alloc: S.recover.alloc, metaRec: S.recover.metaRec, recur: S.recover.recur, filter: S.recover.filter, search: "", sort: S.recover.sort, sortDir: S.recover.sortDir, selected: S.recover.selected, previewId: S.recover.previewId, insTab: S.recover.insTab, opId: S.recover.opId, recOpId: null, recProgress: 0, recDone: false });
  lsSet("evidenceUI", S.evidence); lsSet("verifyUI", { tab: S.verify.tab, algo: S.verify.algo, evId: S.verify.evId });
  lsSet("auditUI", S.audit); lsSet("reportsUI", { wizStep: 1, wizType: S.reports.wizType, wizCase: S.reports.wizCase, wizFmt: S.reports.wizFmt, secs: S.reports.secs, openId: null, genProgress: 0, genDone: false });
  lsSet("activityUI", S.activity); lsSet("casesUI", { openTab: S.cases.openTab, openId: null, noteDraft: "" });
  lsSet("devicesUI", { search: "", openId: null, loading: false }); lsSet("custodyUI", { search: "", openId: null });
  lsSet("settingsTab", S.settingsTab);
}
function Svc() { return window.PRM_SERVICES; }
function Data() { return window.PRM_DATA; }

/* ---------- toasts ---------- */
var ICONS = {
  ok: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 8.5l3.2 3L13 4.5"/></svg>',
  warn: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 2L15 13H1z"/><path d="M8 6.5v3M8 11.4v.1"/></svg>',
  err: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="8" r="6"/><path d="M8 5v3.4M8 10.8v.1"/></svg>',
  info: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="8" r="6"/><path d="M8 7.2V11M8 5v.1"/></svg>'
};
function toast(kind, title, msg) {
  var root = $("#toast-root"); if (!root) return;
  var d = document.createElement("div");
  d.className = "toast " + (kind === "success" ? "ok" : kind === "error" ? "err" : kind === "warning" ? "warn" : kind || "info");
  var ic = kind === "success" ? "ok" : kind === "error" ? "err" : kind === "warning" ? "warn" : "info";
  d.innerHTML = '<div class="ti">' + ICONS[ic] + '</div><div><b>' + esc(title) + '</b>' + (msg ? '<span>' + esc(msg) + '</span>' : '') + '</div>';
  root.appendChild(d);
  setTimeout(function () { d.style.opacity = "0"; d.style.transition = "opacity .2s"; setTimeout(function () { try { if (d.remove) d.remove(); else if (d.parentNode) d.parentNode.removeChild(d); } catch (e) {} }, 220); }, 3200);
}
function copyText(val, label) {
  function done() { toast("success", label || "Copied", String(val).slice(0, 48) + (String(val).length > 48 ? "..." : "")); }
  if (S.settings.clipboardWarn && /hash/i.test(label || "")) { toast("info", "Clipboard notice", "Hash copied. Handle sensitive values carefully."); }
  if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(String(val)).then(done, function () { fallback(); }); }
  else fallback();
  function fallback() { var ta = document.createElement("textarea"); ta.value = String(val); document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e) { toast("error", "Copy failed", "Select and copy manually."); } try { if (ta.remove) ta.remove(); else if (ta.parentNode) ta.parentNode.removeChild(ta); } catch (e) {} }
}

/* ---------- overlays ---------- */
var overlay = { modal: null, drawer: null, palette: false, menu: null, notif: false, avatar: false, lang: false, guide: false, help: false, newop: false, confirmCancel: null };
function closeAllOverlays() { overlay.modal = null; overlay.drawer = null; overlay.palette = false; overlay.menu = null; overlay.notif = false; overlay.avatar = false; overlay.lang = false; overlay.guide = false; overlay.help = false; overlay.newop = false; overlay.confirmCancel = null; renderOverlays(); }
function openModal(o) { overlay.modal = o; renderOverlays(); var b = $("#overlay-root .modal .btn"); if (b) { try { b.focus(); } catch (e) {} } }
function closeModal() { overlay.modal = null; overlay.newop = false; overlay.confirmCancel = null; renderOverlays(); }
function openDrawer(d) { overlay.drawer = d; renderOverlays(); }
function closeDrawer() { overlay.drawer = null; renderOverlays(); }
function escHandler(e) {
  if (e.key === "Escape") {
    if (overlay.menu) { overlay.menu = null; renderOverlays(); }
    else if (overlay.palette) { overlay.palette = false; renderOverlays(); }
    else if (overlay.modal || overlay.newop || overlay.confirmCancel) closeModal();
    else if (overlay.drawer || overlay.guide || overlay.help) { overlay.drawer = null; overlay.guide = false; overlay.help = false; renderOverlays(); }
    else if (overlay.notif || overlay.avatar || overlay.lang) { overlay.notif = overlay.avatar = overlay.lang = false; renderOverlays(); }
  }
}

/* ---------- router ---------- */
var ROUTES = ["landing", "overview", "erase", "recover", "evidence", "cases", "case-detail", "custody", "verify", "audit", "reports", "devices", "activity", "settings"];
function nav(path) { if (("onhashchange" in window)) { window.location.hash = "#" + path; } else { setRoute(path); } }
function setRoute(path) {
  closeAllOverlaysSilent();
  var p = String(path || "/").replace(/^#/, "");
  if (p === "/" || p === "") { S.route = "landing"; S.routeParam = null; }
  else if (p === "/workspace") { S.route = "overview"; }
  else if (p.indexOf("/workspace/cases/") === 0) { S.route = "case-detail"; S.routeParam = decodeURIComponent(p.split("/")[3] || ""); S.cases.openId = S.routeParam; }
  else if (p.indexOf("/workspace/") === 0) {
    var seg = p.split("/")[2];
    var map = { erase: "erase", recover: "recover", evidence: "evidence", cases: "cases", custody: "custody", verify: "verify", audit: "audit", reports: "reports", devices: "devices", activity: "activity", settings: "settings" };
    S.route = map[seg] || "overview";
  } else { S.route = "landing"; }
  render();
}
function closeAllOverlaysSilent() { overlay.modal = null; overlay.drawer = null; overlay.palette = false; overlay.menu = null; overlay.notif = false; overlay.avatar = false; overlay.lang = false; overlay.guide = false; overlay.help = false; overlay.newop = false; overlay.confirmCancel = null; }
function crumbs() {
  var base = [["Workspace", "/workspace"]];
  var m = {
    overview: [["Overview", "/workspace"]],
    erase: [["Operations", "/workspace"], ["Secure Erasure", "/workspace/erase"]],
    recover: [["Operations", "/workspace"], ["Forensic Recovery", "/workspace/recover"]],
    evidence: [["Evidence", "/workspace/evidence"]],
    cases: [["Cases", "/workspace/cases"]],
    "case-detail": [["Cases", "/workspace/cases"], [(S.routeParam || "Case"), "/workspace/cases/" + encodeURIComponent(S.routeParam || "")]],
    custody: [["Chain of Custody", "/workspace/custody"]],
    verify: [["Verification", "/workspace/verify"]],
    audit: [["Audit Logs", "/workspace/audit"]],
    reports: [["Reports", "/workspace/reports"]],
    devices: [["Devices", "/workspace/devices"]],
    activity: [["Activity", "/workspace/activity"]],
    settings: [["Settings", "/workspace/settings"]]
  };
  return base.concat(m[S.route] || m.overview).filter(function (c, i, a) { return a.indexOf(c) === i; });
}

/* ---------- shared bits ---------- */
function logoBtn(where) {
  return '<button class="brand" onclick="PRM.nav(\'/\')" aria-label="PARMAAN home" title="PARMAAN home">' +
    '<span class="brand-mark"><svg width="20" height="20" viewBox="0 0 32 32" fill="white"><path d="M10 22V10h6.5c2.8 0 4.5 1.5 4.5 3.8 0 1.7-1 3-2.6 3.5L21.5 22h-3.4l-2.6-4.2H13V22h-3zm3-6.8h3.2c1.2 0 1.9-.6 1.9-1.5s-.7-1.5-1.9-1.5H13v3z"/></svg></span>' +
    '<span class="brand-name">PARMAAN</span>' +
    (where === "side" ? '<span class="brand-sub">Digital Forensics<br>Workspace</span>' : '<span class="brand-sub">Digital Forensics Workspace</span>') + '</button>';
}
function ringSVG(pct, size) {
  var r = 38, c = 2 * Math.PI * r, off = c - (c * Math.min(100, pct) / 100);
  return '<svg class="ring" width="' + (size || 92) + '" height="' + (size || 92) + '" viewBox="0 0 92 92">' +
    '<circle cx="46" cy="46" r="' + r + '" fill="none" stroke="#21252B" stroke-width="8"/>' +
    '<circle cx="46" cy="46" r="' + r + '" fill="none" stroke="#6E6BF2" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 46 46)"/>' +
    '<text x="46" y="51" text-anchor="middle" fill="#F2F3F5" font-size="16" font-weight="800">' + Math.round(pct) + '%</text></svg>';
}
function emptyState(icon, title, body, btnLabel, btnFn) {
  return '<div class="empty"><div class="eic">' + icon + '</div><h3>' + esc(title) + '</h3><p>' + esc(body) + '</p>' +
    (btnLabel ? '<button class="btn primary sm" onclick="' + btnFn + '">' + esc(btnLabel) + '</button>' : '') + '</div>';
}
function opById(id) { if (!id) return null; var ops = Svc().eraseService.all(); for (var i = 0; i < ops.length; i++) if (ops[i].id === id) return ops[i]; return null; }
function activeOps() { return Svc().eraseService.all().filter(function (o) { return o.status === "running" || o.status === "queued" || o.paused; }); }
function notifList() { return lsGet("notifications", Data().NOTIFICATIONS_SEED.slice()); }
function unreadCount() { return notifList().filter(function (n) { return !n.read; }).length; }


window.PRM = window.PRM || {};

/* ===== chunk_a.js ===== */
/* PARMAAN chunk_a — shell / overlays / landing / overview (runs inside existing IIFE) */
var _locked = false;
var _menuItems = [];
var _ovFirst = true;
var _aPalQ = "";
var _aHelpQ = "";
var _aGuideRisk = false;
var _aGPending = false;
var _aGTimer = null;

function _aIcon(n) {
  var p = "";
  if (n === "overview") p = '<rect x="2" y="2" width="12" height="12" rx="2"/><path d="M2 6h12M6 6v8"/>';
  else if (n === "erase") p = '<path d="M3 8a5 5 0 0 1 9-3M13 8a5 5 0 0 1-9 3"/><path d="M12 2v3H9M4 14v-3h3"/>';
  else if (n === "recover") p = '<path d="M3 13V6l5-3 5 3v7l-5 3z"/><path d="M6.5 8.5l2.5 2.5 4-4.5"/>';
  else if (n === "vault") p = '<rect x="3" y="6" width="10" height="8" rx="2"/><path d="M5.5 6V4.5a2.5 2.5 0 0 1 5 0V6M8 10v1.5"/>';
  else if (n === "cases") p = '<rect x="2" y="3" width="12" height="10" rx="2"/><path d="M2 6.5h12M6 3v3.5"/>';
  else if (n === "custody") p = '<path d="M5 3h6v12l-3-2-3 2z"/><path d="M7 7h2M7 9.5h2"/>';
  else if (n === "verify") p = '<path d="M3 8.5l3.2 3L13 4.5"/>';
  else if (n === "audit") p = '<path d="M3 4h10M3 8h10M3 12h6"/><circle cx="12.5" cy="12" r="2"/>';
  else if (n === "reports") p = '<path d="M4 2h6l3 3v9H4z"/><path d="M10 2v3h3M6.5 9h4M6.5 11.5h4"/>';
  else if (n === "devices") p = '<rect x="4" y="2" width="8" height="12" rx="2"/><path d="M7 12h2"/>';
  else if (n === "activity") p = '<circle cx="8" cy="8" r="5.5"/><path d="M8 5v3.2l2.2 1.3"/>';
  else if (n === "settings") p = '<circle cx="8" cy="8" r="2.2"/><path d="M8 1.8v2M8 12.2v2M1.8 8h2M12.2 8h2M3.6 3.6l1.4 1.4M11 11l1.4 1.4M12.4 3.6L11 5M5 11l-1.4 1.4"/>';
  else if (n === "help") p = '<circle cx="8" cy="8" r="6"/><path d="M6.2 6.2c.2-1 1-1.7 1.9-1.7 1 0 1.9.7 1.9 1.7 0 1.2-1.4 1.4-1.9 2.2v.6M8 11.4v.1"/>';
  else if (n === "bell") p = '<path d="M4 11h8l-1-2V6.5a3 3 0 0 0-6 0V9z"/><path d="M6.8 12.5a1.3 1.3 0 0 0 2.4 0"/>';
  else if (n === "search") p = '<circle cx="7" cy="7" r="4"/><path d="M10 10l3.5 3.5"/>';
  else if (n === "guide") p = '<path d="M8 2l1.7 3.8L13.5 7l-2.7 2.8.6 4L8 11.7 4.6 13.8l.6-4L2.5 7l3.8-1.2z"/>';
  else if (n === "lock") p = '<rect x="3.5" y="7" width="9" height="6.5" rx="1.5"/><path d="M5.5 7V5.3a2.5 2.5 0 0 1 5 0V7"/>';
  else if (n === "globe") p = '<circle cx="8" cy="8" r="6"/><path d="M2 8h12M8 2c-3.5 3.5-3.5 8.5 0 12M8 2c3.5 3.5 3.5 8.5 0 12"/>';
  else p = '<circle cx="8" cy="8" r="5.5"/>';
  return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">' + p + '</svg>';
}
function _aInitials() {
  var n = String(S.operator || "R P");
  var parts = n.split(" ");
  if (parts.length >= 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  return n.slice(0, 2).toUpperCase();
}
function _aLangShort() {
  try {
    var l = PRM_DATA.LANGS.filter(function (x) { return x.id === S.lang; })[0];
    return l ? l.short : S.lang;
  } catch (e) { return String(S.lang || "En"); }
}
function _aNavDisabled(route) {
  return false;
}
function _aNavTip(route) {
  return "";
}
function _aPaletteItems() {
  return [
    { label: "Start secure erase", hint: "Erase", sub: "Select target, method, verify", run: function () { nav("/workspace/erase"); } },
    { label: "Start recovery", hint: "Recover", sub: "Read-only source, deep scan", run: function () { nav("/workspace/recover"); } },
    { label: "Create case", hint: "Cases", sub: "Group evidence and reports", run: function () { nav("/workspace/cases"); setTimeout(function () { try { if (typeof caseCreateModal === "function") caseCreateModal(); } catch (e) {} }, 120); } },
    { label: "Import evidence", hint: "Vault", sub: "Hash captured at import", run: function () { nav("/workspace/evidence"); setTimeout(function () { try { if (typeof evImportModal === "function") evImportModal(); } catch (e) {} }, 120); } },
    { label: "Verify hash", hint: "Verify", sub: "SHA-256 compare", run: function () { nav("/workspace/verify"); } },
    { label: "Generate report", hint: "Reports", sub: "Certificate and case reports", run: function () { nav("/workspace/reports"); } },
    { label: "View audit log", hint: "Audit", sub: "Filterable event trail", run: function () { nav("/workspace/audit"); } },
    { label: S.mode === "expert" ? "Switch to Basic Mode" : "Switch to Expert Mode", hint: "Mode", sub: S.mode === "expert" ? "Simplified workflows & safe defaults" : "Advanced parameters & telemetry", run: function () { if (S.mode === "expert") PRM.setGuided(); else PRM.requestExpert(); } },
    { label: "Inspect Raw Sector Hex", hint: "Hex", sub: "512B physical LBA inspector", run: function () { PRM.openHexViewer(); } },
    { label: "Run Shannon Entropy Scan", hint: "Entropy", sub: "Analyze disk encryption container", run: function () { PRM.openEntropyInspector(); } },
    { label: "Change language", hint: "Lang", sub: "Interface language", run: function () { overlay.lang = true; renderOverlays(); } },
    { label: "Open settings", hint: "System", sub: "Workspace preferences", run: function () { nav("/workspace/settings"); } },
    { label: "Go to Overview", hint: "G then O", sub: "Active ops and devices", run: function () { nav("/workspace"); } },
    { label: "Open Help", hint: "?", sub: "Offline help center", run: function () { overlay.help = true; renderOverlays(); } }
  ];
}
function _aFilteredPalette() {
  var q = String(_aPalQ || "").trim().toLowerCase();
  var all = _aPaletteItems();
  if (!q) return all;
  return all.filter(function (it) {
    var text = (it.label + " " + (it.hint || "") + " " + (it.sub || "")).toLowerCase();
    if (text.indexOf(q) >= 0) return true;
    return false;
  });
}
function _aRenderPaletteList() {
  var el = document.getElementById("palette-list");
  if (!el) return;
  var list = _aFilteredPalette();
  if (S.paletteIdx == null) S.paletteIdx = 0;
  if (S.paletteIdx >= list.length) S.paletteIdx = 0;
  if (!list.length) { el.innerHTML = '<div class="empty" style="margin:8px"><h3>No matches</h3><p>Try erase, recover, verify, report, audit, settings.</p></div>'; return; }
  el.innerHTML = list.map(function (it, i) {
    return '<button class="palette-item' + (i === S.paletteIdx ? " on" : "") + '" onclick="PRM.paletteGo(' + i + ')">' + _aIcon("search") + '<span><b>' + esc(it.label) + '</b><br><small style="color:var(--dim)">' + esc(it.sub || "") + '</small></span><small>' + esc(it.hint || "") + '</small></button>';
  }).join("");
}
function _aPaletteGo(i) {
  var list = _aFilteredPalette();
  var it = list[i || 0] || list[0];
  if (!it) return;
  overlay.palette = false;
  renderOverlays();
  try { it.run(); } catch (e) { toast("error", "Action failed", "Please try again."); }
}
function _aPaletteKey(ev) {
  var list = _aFilteredPalette();
  if (!ev) return;
  if (ev.key === "ArrowDown") { ev.preventDefault(); S.paletteIdx = Math.min(list.length - 1, (S.paletteIdx || 0) + 1); _aRenderPaletteList(); }
  else if (ev.key === "ArrowUp") { ev.preventDefault(); S.paletteIdx = Math.max(0, (S.paletteIdx || 0) - 1); _aRenderPaletteList(); }
  else if (ev.key === "Enter") { ev.preventDefault(); _aPaletteGo(S.paletteIdx || 0); }
  else if (ev.key === "Escape") { overlay.palette = false; renderOverlays(); }
}
function _aCapData(k) {
  if (k === "recover") return { title: t("Forensic Recovery", "Forensic Recovery"), desc: t("Read-only sources, signature carving and hash-captured results.", "Read-only sources, signature carving and hash-captured results."), points: [t("Quick, Deep and Lost-Partition scans", "Quick, Deep and Lost-Partition scans"), t("Live discovery feed with integrity tags", "Live discovery feed with integrity tags"), t("Preview, tag and recover with hashes", "Preview, tag and recover with hashes")] };
  if (k === "vault") return { title: t("Evidence Vault", "Evidence Vault"), desc: t("Sealed items with integrity states, tags and custody links.", "Sealed items with integrity states, tags and custody links."), points: [t("Verified, Pending and Changed states", "Verified, Pending and Changed states"), t("Inspector with preview, hashes and notes", "Inspector with preview, hashes and notes"), t("Move items across cases with audit entries", "Move items across cases with audit entries")] };
  if (k === "verify") return { title: t("Verification", "Verification"), desc: t("SHA-256 by default with clear MATCH verdicts.", "SHA-256 by default with clear MATCH verdicts."), points: [t("File, vault-item and hash-compare modes", "File, vault-item and hash-compare modes"), t("Copy, export and attach to case", "Copy, export and attach to case"), t("Strong warning treatment on mismatch", "Strong warning treatment on mismatch")] };
  if (k === "reports") return { title: t("Reports", "Reports"), desc: t("Certificates and case reports with embedded hashes.", "Certificates and case reports with embedded hashes."), points: [t("Sanitization, recovery and custody scopes", "Sanitization, recovery and custody scopes"), t("A4 preview with seal and metadata", "A4 preview with seal and metadata"), t("PDF and CSV export, client-generated", "PDF and CSV export, client-generated")] };
  return { title: t("Secure Erasure", "Secure Erasure"), desc: t("Guided sanitization with verification before any certificate.", "Guided sanitization with verification before any certificate."), points: [t("Quick, Recommended, Full and Crypto options", "Quick, Recommended, Full and Crypto options"), t("Review with explicit confirmation", "Review with explicit confirmation"), t("Progress, logs and residual PASS check", "Progress, logs and residual PASS check")] };
}
function _aCapPreview(k) {
  var devs = [];
  try { devs = Data().DEVICES.slice(0, 3); } catch (e) {}
  var recs = [];
  try { recs = Data().RECOVERY_FILES.slice(0, 4); } catch (e) {}
  var evs = [];
  try { evs = Data().EVIDENCE.slice(0, 3); } catch (e) {}
  if (k === "recover") {
    return '<div class="pipe-card-h">Source tree · read-only <span class="live"><i></i>live</span></div>' + recs.map(function (f) { return '<div class="cap-row"><span class="st-dot ok"></span><span><b>' + esc(f.name) + '</b> <span class="dim mono" style="font-size:11px">' + esc(f.size) + ' · ' + esc(f.integrity) + '</span></span></div>'; }).join("");
  }
  if (k === "vault") {
    return '<div class="pipe-card-h">Vault · sealed</div>' + evs.map(function (x) { return '<div class="cap-row"><span class="st-dot ' + (x.integrity === "Verified" ? "ok" : x.integrity === "Changed" ? "bad" : "warn") + '"></span><span><b>' + esc(x.name) + '</b> <span class="dim mono" style="font-size:11px">' + esc(x.id) + '</span></span><span class="tagchip" style="margin-left:auto">' + esc(x.integrity) + '</span></div>'; }).join("");
  }
  if (k === "verify") {
    var h = "";
    try { h = Data().EVIDENCE[0].hash; } catch (e) { h = "a3f1c9d24b7e48f0a91c55d3e6f2078812c4aa5e9d03b71fc48e21d90a5c44e"; }
    return '<div class="pipe-card-h">SHA-256 compare</div><div class="verdict match"><div class="big">MATCH</div><div class="hash" style="margin-top:8px;word-break:break-all">' + esc(h.slice(0, 48)) + '…</div></div><div class="cap-row" style="margin-top:10px"><span>Full verification</span><span class="badge ok" style="margin-left:auto">100%</span></div>';
  }
  if (k === "reports") {
    return '<div class="pipe-card-h">Certificate preview</div><div class="a4" style="padding:22px"><h1 style="font-size:16px">Sanitization Certificate</h1><div class="a4sub">PRM-SAN-2026-00184 · Verified</div><table><tr><th>Field</th><th>Value</th></tr><tr><td>Target</td><td>SanDisk Extreme 128GB</td></tr><tr><td>Method</td><td>Recommended · 3-pass</td></tr><tr><td>Verify</td><td>PASS · residual check</td></tr></table><span class="seal">SEALED</span></div>';
  }
  return '<div class="pipe-card-h">Targets · locked for review</div>' + devs.map(function (d) { return '<div class="cap-row"><span class="st-dot ' + (d.status === "ready" ? "ok" : "warn") + '"></span><span><b>' + esc(d.name) + '</b> <span class="dim mono" style="font-size:11px">' + esc(d.capacity) + ' · ' + esc(d.filesystem) + '</span></span></div>'; }).join("") + '<div class="cap-row"><span>Recommended Secure Erase</span><span class="badge acc" style="margin-left:auto">Recommended</span></div>';
}
function _aRenderCapPanel() {
  var tabs = document.querySelectorAll(".cap-tabs button");
  for (var i = 0; i < tabs.length; i++) {
    var v = tabs[i].getAttribute("data-cap");
    if (v === S.capTab) tabs[i].classList.add("on");
    else tabs[i].classList.remove("on");
  }
  var panel = document.getElementById("cap-panel");
  if (!panel) { render(); return; }
  var d = _aCapData(S.capTab);
  panel.innerHTML = '<div class="cap-copy"><div class="eyebrow">Capabilities</div><h3>' + esc(d.title) + '</h3><p>' + esc(d.desc) + '</p><div class="cap-list">' + d.points.map(function (x) { return '<div class="cap-row"><span class="st-dot ok"></span><span>' + esc(x) + '</span></div>'; }).join("") + '</div><div style="margin-top:14px;display:flex;gap:10px"><button class="btn primary sm" onclick="PRM.nav(\'/workspace\')">Open Workspace</button><button class="btn sm" onclick="PRM.landGo(\'workflow\')">See workflow</button></div></div><div class="cap-preview">' + _aCapPreview(S.capTab) + '</div>';
}
function _aGuideKey() {
  var m = { overview: "/workspace", erase: "/workspace/erase", recover: "/workspace/recover", evidence: "/workspace/evidence", verify: "/workspace/verify", reports: "/workspace/reports" };
  return m[S.route] || "/workspace";
}
function _aGuide() {
  try {
    var g = Data().GUIDE[_aGuideKey()] || Data().GUIDE["/workspace"];
    if (g) return g;
  } catch (e) {}
  return { title: "Workspace overview", steps: ["Review active operations, connected media and open cases.", "Use New Operation to start erasure, recovery or verification.", "Every action is recorded to the audit trail."], risk: "Simulated prototype: operations demonstrate the workflow until forensic engines are connected." };
}
function _aReadAloud() {
  var g = _aGuide();
  var msg = g.title + ". " + (g.steps || []).join(" ");
  try {
    if (!("speechSynthesis" in window)) { toast("info", "Voice unavailable", "Speech synthesis is not supported here."); return; }
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(msg);
    u.lang = S.lang === "hi" ? "hi-IN" : "en-IN";
    window.speechSynthesis.speak(u);
    toast("success", "Reading guide", g.title);
  } catch (e) { toast("info", "Voice unavailable", "Speech synthesis is not supported here."); }
}
function _aHelpSections() {
  return [
    { id: "start", title: "Getting Started", desc: "Open Workspace, review Overview, start with New Operation.", route: "/workspace" },
    { id: "erase", title: "Secure Erasure", desc: "Select target, choose method, review, execute, verify.", route: "/workspace/erase" },
    { id: "recover", title: "Recovery", desc: "Read-only source, scan config, discover, preview, recover.", route: "/workspace/recover" },
    { id: "evidence", title: "Evidence", desc: "Import, verify, tag, note and move items across cases.", route: "/workspace/evidence" },
    { id: "verify", title: "Verification", desc: "SHA-256 by default, compare against reference hashes.", route: "/workspace/verify" },
    { id: "reports", title: "Reports", desc: "Certificates and case reports with embedded hashes.", route: "/workspace/reports" },
    { id: "keys", title: "Keyboard Shortcuts", desc: "Ctrl or Cmd K palette, G then O E R V, ? help, Esc close.", route: null }
  ];
}
function _aFilteredHelp() {
  var q = String(_aHelpQ || "").toLowerCase();
  var all = _aHelpSections();
  if (!q) return all;
  return all.filter(function (x) { return (x.title + " " + x.desc).toLowerCase().indexOf(q) >= 0; });
}
function _aRenderHelpList() {
  var el = document.getElementById("help-list");
  if (!el) return;
  var list = _aFilteredHelp();
  if (!list.length) { el.innerHTML = '<div class="empty"><h3>No help matches</h3><p>Try erase, recovery, evidence, verify, reports.</p></div>'; return; }
  el.innerHTML = '<div class="help-grid">' + list.map(function (x) {
    var act = x.route ? "PRM.helpGo('" + x.route + "')" : "PRM.helpKeys()";
    return '<button class="help-card" onclick="' + act + '"><b>' + esc(x.title) + '</b><p>' + esc(x.desc) + '</p></button>';
  }).join("") + '</div>';
}
function _aLandGo(where) {
  var map = { product: "top", capabilities: "sec-caps", caps: "sec-caps", workflow: "sec-workflow", security: "sec-security", documentation: "sec-docs", docs: "sec-docs" };
  var id = map[where] || where;
  if (id === "top") { try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) { window.scrollTo(0, 0); } return; }
  var el = document.getElementById(id);
  if (el) { try { el.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) { el.scrollIntoView(); } }
  else toast("info", "Section unavailable", String(where));
}
function _aStatCounts() {
  var ops = 0, ev = 0, cs = 0, rp = 0;
  try { ops = Svc().eraseService.all().filter(function (o) { return o.status === "running" || o.status === "queued" || o.paused; }).length; } catch (e) {}
  try { ev = Svc().evidenceService.list().length; } catch (e) { try { ev = Data().EVIDENCE.length; } catch (e2) {} }
  try { cs = Svc().caseService.list().filter(function (c) { return c.status !== "Closed"; }).length; } catch (e) { try { cs = Data().CASES.length; } catch (e2) {} }
  try { rp = Svc().reportService.list().length; } catch (e) { try { rp = Data().REPORTS.length; } catch (e2) {} }
  return { ops: ops, ev: ev, cs: cs, rp: rp };
}
function _aOpBadge(o) {
  if (o.paused) return '<span class="badge warn">Paused</span>';
  if (o.status === "running") return '<span class="badge info">Running</span>';
  if (o.status === "queued") return '<span class="badge">Queued</span>';
  if (o.status === "completed") return '<span class="badge ok">Completed</span>';
  if (o.status === "cancelled") return '<span class="badge bad">Cancelled</span>';
  if (o.status === "failed") return '<span class="badge bad">Failed</span>';
  return '<span class="badge">' + esc(o.status || "") + '</span>';
}
function _aPauseOp(id) {
  var o = opById(id);
  if (!o) { toast("error", "Operation unavailable", "It may have finished already."); return; }
  try {
    if (o.kind === "recovery") Svc().recoveryService.pause(id);
    else Svc().eraseService.pause(id);
  } catch (e) {}
  toast("info", "Operation paused", id + " · " + (o.progress || 0) + "%");
  persist(); render();
}
function _aResumeOp(id) {
  var o = opById(id);
  if (!o) { toast("error", "Operation unavailable", "It may have finished already."); return; }
  try {
    if (o.kind === "recovery") Svc().recoveryService.resume(id);
    else Svc().eraseService.resume(id);
  } catch (e) {}
  toast("success", "Operation resumed", id);
  persist(); render();
}
function _aCancelConfirm() {
  var id = overlay.confirmCancel;
  if (!id) { closeModal(); return; }
  var o = opById(id);
  try {
    if (o && o.kind === "recovery") Svc().recoveryService.cancel(id);
    else Svc().eraseService.cancel(id);
  } catch (e) {}
  overlay.confirmCancel = null;
  try { closeModal(); } catch (e) { overlay.modal = null; renderOverlays(); }
  toast("info", "Operation cancelled", String(id) + " · target left for re-verify.");
  persist(); render();
}
function _aRetryOp(id) {
  var o = opById(id);
  if (!o) { toast("error", "Operation unavailable", "It may have been removed."); return; }
  try {
    if (o.kind === "recovery") Svc().recoveryService.retry(id);
    else Svc().eraseService.retry(id);
  } catch (e) {}
  toast("success", "Re-queued", String(id));
  persist(); render();
}
function _aOpenOp(id) {
  var o = opById(id);
  if (!o) { toast("error", "Operation unavailable", "It may have finished already."); return; }
  var logs = (o.logs || []).slice(-6).map(function (l) { return '<div><span class="t">' + esc(o.updated || "") + '</span> ' + esc(l) + '</div>'; }).join("") || '<div class="dim">No log entries yet.</div>';
  openDrawer({
    title: (o.title || o.kind) + " · " + o.id,
    sub: (o.device || "") + " · " + (o.status || "") + (o.paused ? " · paused" : ""),
    body: '<div class="ring-wrap">' + ringSVG(o.progress || 0, 92) + '<div><div style="font-size:13px"><b>' + esc(o.device || "") + '</b></div><div class="dim mono" style="font-size:11.5px;margin-top:4px">' + esc(o.method || o.scan || "") + ' · elapsed ' + esc(o.elapsed || 0) + 's · ETA ' + esc(o.eta || "—") + '</div><div style="margin-top:8px">' + _aOpBadge(o) + '</div></div></div><div style="height:12px"></div><div class="prog' + (o.status === "completed" ? " ok" : "") + '"><i style="width:' + Math.min(100, o.progress || 0) + '%"></i></div><div style="height:12px"></div><div class="log">' + logs + '</div>',
    footer: '<button class="btn sm" onclick="PRM.nav(\'/workspace/activity\')">Open Activity</button>' + (o.status === "running" && !o.paused ? '<button class="btn sm" onclick="PRM.pauseOp(\'' + esc(o.id) + '\')">Pause</button>' : "") + (o.paused ? '<button class="btn sm primary" onclick="PRM.resumeOp(\'' + esc(o.id) + '\')">Resume</button>' : "") + '<button class="btn sm danger" onclick="PRM.cancelOpAsk(\'' + esc(o.id) + '\')">Cancel</button>'
  });
}
function _aDevDrawer(id) {
  var d = null;
  try { d = Svc().deviceService.get(id); } catch (e) {}
  if (!d) { try { d = Data().DEVICES.filter(function (x) { return x.id === id; })[0] || null; } catch (e2) {} }
  if (!d) { toast("error", "Device unavailable", "It may have been disconnected."); return; }
  var expert = S.mode === "expert";
  var rows = '<dl>'
    + '<div class="kv"><dt>Model</dt><dd>' + esc(d.model || d.name) + '</dd></div>'
    + '<div class="kv"><dt>Device path</dt><dd class="mono">' + esc(d.path || "—") + '</dd></div>'
    + '<div class="kv"><dt>Serial</dt><dd class="mono">' + esc(d.serial || "—") + '</dd></div>'
    + '<div class="kv"><dt>Interface</dt><dd>' + esc(d.interface || "—") + '</dd></div>'
    + '<div class="kv"><dt>Capacity</dt><dd>' + esc(d.capacity || "—") + '</dd></div>'
    + '<div class="kv"><dt>Filesystem</dt><dd>' + esc(d.filesystem || "—") + '</dd></div>'
    + (expert ? '<div class="kv"><dt>Partition</dt><dd>' + esc(d.partition || "—") + '</dd></div><div class="kv"><dt>SMART</dt><dd>' + esc(d.smart || "—") + '</dd></div><div class="kv"><dt>Mounted</dt><dd>' + esc(d.mounted || "—") + '</dd></div><div class="kv"><dt>Access</dt><dd>' + esc(d.rw || "—") + '</dd></div><div class="kv"><dt>Health</dt><dd>' + esc(d.health != null ? d.health + "%" : "—") + '</dd></div>' : '<div class="kv"><dt>Status</dt><dd>' + esc(d.statusLabel || d.status || "—") + '</dd></div>')
    + '<div class="kv"><dt>Notes</dt><dd>' + esc(d.notes || "—") + '</dd></div></dl>'
    + (expert ? "" : '<p class="dim" style="font-size:12px">Expert Mode reveals SMART, mount and partition detail.</p>');
  openDrawer({
    title: d.name || d.id,
    sub: d.id + " · " + (d.type || ""),
    body: rows,
    footer: '<button class="btn sm primary" onclick="PRM.devSelect(\'' + esc(d.id) + '\')">Select Device</button><button class="btn sm ghost" onclick="PRM.closeDrawer()">Close</button>'
  });
}
function _aLock() {
  overlay.avatar = false; overlay.notif = false; overlay.lang = false;
  _locked = true;
  renderOverlays();
}
function _aSignOut() {
  overlay.avatar = false;
  renderOverlays();
  toast("info", "Signed out", "Prototype session ended. Demo data kept locally.");
  nav("/");
}
function _aOpenProfile() {
  overlay.avatar = false;
  var roleOpts = ["clerk", "investigator", "expert", "admin"].map(function (r) {
    return '<button class="btn xs' + (S.role === r ? " primary" : "") + '" onclick="PRM.setRoleQuick(\'' + r + '\')">' + esc(r) + '</button>';
  }).join("");
  openDrawer({
    title: S.operator || "Operator",
    sub: "Forensic Investigator · Lab-02",
    body: '<dl><div class="kv"><dt>Operator</dt><dd>' + esc(S.operator || "R. Patil") + '</dd></div><div class="kv"><dt>Role</dt><dd>' + esc(S.role) + '</dd></div><div class="kv"><dt>Mode</dt><dd>' + esc(S.mode) + '</dd></div><div class="kv"><dt>Language</dt><dd>' + esc(S.lang) + '</dd></div></dl><label class="f">Quick role (demo settings)</label><div style="display:flex;gap:8px;flex-wrap:wrap">' + roleOpts + '</div><p class="dim" style="font-size:12px;margin-top:10px">Prototype profile. No real identity is referenced.</p>',
    footer: '<button class="btn sm" onclick="PRM.lockWorkspace()">Lock Workspace</button><button class="btn sm ghost" onclick="PRM.signOut()">Sign Out</button>'
  });
}

/* ---------- overlays ---------- */
function renderOverlays() {
  var root = $("#overlay-root");
  if (!root) return;
  var h = "";
  var m = overlay.modal;
  if (m) {
    if (m.kind === "expert") {
      h += '<div class="overlay" role="presentation"><div class="modal" role="dialog" aria-modal="true" aria-label="Expert Mode"><div class="modal-h"><div><h2>Expert Mode</h2><p>Advanced controls expose low-level forensic parameters and may increase operational risk.</p></div><span style="margin-left:auto"></span><button class="icon-btn" onclick="PRM.closeModal()" aria-label="Close">✕</button></div><div class="modal-b"><div class="warn-box">Expert adds depth, not clutter: raw logs, technical device fields, legacy hashes and low-level operation options appear. Guided remains the safe default.</div></div><div class="modal-f"><button class="btn ghost sm" onclick="PRM.closeModal()">' + esc(t("cancel")) + '</button><button class="btn primary sm" onclick="PRM.confirmExpert()">Enable Expert Mode</button></div></div></div>';
    } else if (m.kind === "onb") {
      var step = S.onboardStep || 0;
      var titles = ["Welcome to PARMAAN", "Select, act, verify", "Everything is proven"];
      var bodies = ["A guided digital-forensics workspace for erasure, recovery, evidence, verification and audit-ready reports.", "Pick a target, run a simulated operation, then verify hashes before relying on anything.", "Certificates, custody and audit entries are generated as you work. Press ? anytime for help."];
      h += '<div class="overlay" role="presentation"><div class="modal" role="dialog" aria-modal="true" aria-label="Onboarding"><div class="modal-h"><div><h2>' + esc(titles[Math.min(2, step)]) + '</h2><p>Step ' + (step + 1) + ' of 3 · prototype with mock data</p></div><span style="margin-left:auto"></span><button class="icon-btn" onclick="PRM.onbSkip()" aria-label="Close">✕</button></div><div class="modal-b"><p class="muted" style="margin:0">' + esc(bodies[Math.min(2, step)]) + '</p><div class="onb-dots"><i class="' + (step === 0 ? "on" : "") + '"></i><i class="' + (step === 1 ? "on" : "") + '"></i><i class="' + (step === 2 ? "on" : "") + '"></i></div></div><div class="modal-f"><button class="btn ghost sm" onclick="PRM.onbSkip()">Skip</button>' + (step > 0 ? '<button class="btn sm" onclick="PRM.onbBack()">' + esc(t("back")) + '</button>' : "") + '<button class="btn primary sm" onclick="PRM.onbNext()">' + esc(step === 2 ? "Open Workspace" : t("cont")) + '</button></div></div></div>';
    } else {
      h += '<div class="overlay" role="presentation"><div class="modal' + (m.lg ? " lg" : "") + '" role="dialog" aria-modal="true"><div class="modal-h"><div><h2>' + esc(m.title || "") + '</h2>' + (m.sub ? '<p>' + esc(m.sub) + '</p>' : "") + '</div><span style="margin-left:auto"></span><button class="icon-btn" onclick="PRM.closeModal()" aria-label="Close">✕</button></div><div class="modal-b">' + (m.body || "") + '</div>' + (m.footer ? '<div class="modal-f">' + m.footer + '</div>' : "") + '</div></div>';
    }
  }
  if (overlay.newop) {
    h += '<div class="overlay" role="presentation"><div class="modal lg" role="dialog" aria-modal="true" aria-label="New Operation"><div class="modal-h"><div><h2>What would you like to do?</h2><p>Four guided entry points. Each opens a working flow.</p></div><span style="margin-left:auto"></span><button class="icon-btn" onclick="PRM.closeModal()" aria-label="Close">✕</button></div><div class="modal-b"><div class="method-grid c4">'
      + '<button class="method-card" onclick="PRM.newOpGo(\'erase\')"><h4>Secure Erase</h4><p>Sanitize media with verification and certificate.</p><div class="meta"><span>3-pass</span><span>verify 100%</span></div></button>'
      + '<button class="method-card" onclick="PRM.newOpGo(\'recover\')"><h4>Recover Data</h4><p>Read-only scan with preview and tagging.</p><div class="meta"><span>deep</span><span>12 files</span></div></button>'
      + '<button class="method-card" onclick="PRM.newOpGo(\'verify\')"><h4>Verify Evidence</h4><p>SHA-256 compare with MATCH verdict.</p><div class="meta"><span>SHA-256</span><span>copy</span></div></button>'
      + '<button class="method-card" onclick="PRM.newOpGo(\'case\')"><h4>Create Case</h4><p>Group evidence, custody and reports.</p><div class="meta"><span>auto ID</span><span>audit</span></div></button>'
      + '</div></div><div class="modal-f"><button class="btn ghost sm" onclick="PRM.closeModal()">' + esc(t("cancel")) + '</button></div></div></div>';
  }
  if (overlay.confirmCancel) {
    h += '<div class="overlay" role="presentation"><div class="modal" role="dialog" aria-modal="true" aria-label="Cancel operation"><div class="modal-h"><div><h2>Cancel operation?</h2><p class="mono">' + esc(overlay.confirmCancel) + ' · partial work is kept for review</p></div><span style="margin-left:auto"></span><button class="icon-btn" onclick="PRM.closeModal()" aria-label="Close">✕</button></div><div class="modal-b"><div class="warn-box">Cancelling stops the run. The target is left untouched pending re-verify. This entry is audit-logged.</div></div><div class="modal-f"><button class="btn ghost sm" onclick="PRM.closeModal()">Keep running</button><button class="btn solid-danger sm" onclick="PRM.cancelOpConfirm()">Confirm Cancel</button></div></div></div>';
  }
  if (overlay.drawer) {
    var d = overlay.drawer;
    h += '<div class="drawer-veil" onclick="PRM.closeDrawer()"></div><div class="drawer" role="dialog" aria-modal="true"><div class="drawer-h"><div><h2>' + esc(d.title || "") + '</h2>' + (d.sub ? '<div class="sub">' + esc(d.sub) + '</div>' : "") + '</div><span style="margin-left:auto"></span><button class="icon-btn" onclick="PRM.closeDrawer()" aria-label="Close">✕</button></div><div class="drawer-b">' + (d.body || "") + '</div>' + (d.footer ? '<div class="drawer-f">' + d.footer + '</div>' : "") + '</div>';
  }
  if (overlay.palette) {
    var plist = _aFilteredPalette();
    if (S.paletteIdx == null) S.paletteIdx = 0;
    h += '<div class="overlay" style="align-items:flex-start;padding-top:12vh" role="presentation"><div class="palette" role="dialog" aria-modal="true" aria-label="Command palette"><input id="palette-input" placeholder="' + esc(t("search")) + '" value="' + esc(_aPalQ) + '" oninput="PRM.paletteFilter(this.value)" onkeydown="PRM.paletteKey(event)" autocomplete="off"><div class="palette-list" id="palette-list">'
      + (plist.length ? plist.map(function (it, i) { return '<button class="palette-item' + (i === S.paletteIdx ? " on" : "") + '" onclick="PRM.paletteGo(' + i + ')">' + _aIcon("search") + '<span><b>' + esc(it.label) + '</b><br><small style="color:var(--dim)">' + esc(it.sub || "") + '</small></span><small>' + esc(it.hint || "") + '</small></button>'; }).join("") : '<div class="empty" style="margin:8px"><h3>No matches</h3><p>Try erase, recover, verify, report, audit, settings.</p></div>')
      + '</div></div></div>';
  }
  if (overlay.menu) {
    var mn = overlay.menu;
    var items = mn.items || _menuItems || [];
    var mx = Math.max(8, Math.min(window.innerWidth - 230, mn.x || 100));
    var my = Math.max(8, Math.min(window.innerHeight - items.length * 40 - 60, mn.y || 100));
    h += '<div class="drawer-veil" style="background:transparent" onclick="PRM.closeMenu()"></div><div class="menu" role="menu" style="left:' + mx + 'px;top:' + my + 'px">'
      + (mn.title ? '<div class="mhead">' + esc(mn.title) + '</div>' : "")
      + items.map(function (it) {
        if (it.sep) return '<div class="msep"></div>';
        if (it.head) return '<div class="mhead">' + esc(it.head) + '</div>';
        return '<button class="' + (it.danger ? "danger" : "") + '" onclick="' + (it.fn || "PRM.closeMenu()") + '">' + _aIcon(it.icon || "overview") + '<span>' + esc(it.label || "Action") + '</span></button>';
      }).join("") + '</div>';
  }
  if (overlay.notif) {
    var nl = [];
    try { nl = notifList(); } catch (e) { try { nl = Data().NOTIFICATIONS_SEED.slice(); } catch (e2) {} }
    h += '<div class="drawer-veil" style="background:transparent" onclick="PRM.closeNotif()"></div><div class="menu" role="menu" aria-label="Notifications" style="right:12px;top:60px;position:fixed;min-width:330px;max-width:360px"><div class="mhead">Notifications · ' + nl.filter(function (n) { return !n.read; }).length + ' unread</div>'
      + (nl.length ? nl.slice(0, 7).map(function (n) { return '<button onclick="PRM.notifGo(\'' + esc(n.route || "/workspace/activity") + '\',\'' + esc(n.id) + '\')"><span class="st-dot ' + (n.kind === "success" ? "ok" : n.kind === "warning" ? "warn" : "info") + '"></span><span><b>' + esc(n.title) + '</b><br><small class="muted">' + esc(n.body || "") + ' · ' + esc(n.ts || "") + (n.read ? "" : " · new") + '</small></span></button>'; }).join("") : '<div class="mhead">No notifications</div>')
      + '<div class="msep"></div><button onclick="PRM.markAllRead()">' + _aIcon("verify") + '<span>Mark all as read</span></button><button onclick="PRM.closeNotif()">' + _aIcon("overview") + '<span>Close</span></button></div>';
  }
  if (overlay.avatar) {
    h += '<div class="drawer-veil" style="background:transparent" onclick="PRM.closeMenu()"></div><div class="menu" role="menu" aria-label="Account" style="right:12px;top:60px;position:fixed;min-width:250px"><div class="mhead">' + esc(S.operator || "Operator") + ' · ' + esc(S.role) + '</div>'
      + '<button onclick="PRM.avatarGo(\'profile\')">' + _aIcon("overview") + '<span>' + esc(t("profile")) + '</span></button>'
      + '<button onclick="PRM.nav(\'/workspace/settings\')">' + _aIcon("settings") + '<span>Role: ' + esc(S.role) + ' · open settings</span></button>'
      + '<div class="msep"></div><button onclick="PRM.lockWorkspace()">' + _aIcon("lock") + '<span>' + esc(t("lock")) + '</span></button>'
      + '<button class="danger" onclick="PRM.signOut()">' + _aIcon("activity") + '<span>' + esc(t("signout")) + '</span></button></div>';
  }
  if (overlay.lang) {
    var langs = [];
    try { langs = Data().LANGS; } catch (e) { langs = [{ id: "en", label: "English" }]; }
    h += '<div class="drawer-veil" style="background:transparent" onclick="PRM.closeMenu()"></div><div class="menu" role="menu" aria-label="Language" style="right:60px;top:60px;position:fixed;min-width:220px"><div class="mhead">' + esc(t("language")) + '</div>'
      + langs.map(function (l) { return '<button onclick="PRM.setLang(\'' + esc(l.id) + '\')">' + _aIcon("globe") + '<span>' + esc(l.label) + (S.lang === l.id ? " · ✓" : "") + '</span></button>'; }).join("") + '</div>';
  }
  if (overlay.guide) {
    var g = _aGuide();
    h += '<div class="drawer-veil" onclick="PRM.guideReady()"></div><div class="drawer" role="dialog" aria-modal="true" aria-label="Guide"><div class="drawer-h"><div><h2>' + esc(g.title || "Guide") + '</h2><div class="sub">Context help · ' + esc(_aGuideKey()) + '</div></div><span style="margin-left:auto"></span><button class="icon-btn" onclick="PRM.guideReady()" aria-label="Close">✕</button></div><div class="drawer-b"><div class="guide-sec"><h4>Steps</h4><ol>' + (g.steps || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join("") + '</ol></div>'
      + (_aGuideRisk ? '<div class="warn-box">' + esc(g.risk || "") + '</div><div style="height:10px"></div>' : "")
      + '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" onclick="PRM.readAloud()">Read aloud</button><button class="btn sm ghost" onclick="PRM.showRisk()">Show risk</button></div></div><div class="drawer-f"><button class="btn primary sm block" onclick="PRM.guideReady()">I\'m ready</button></div></div>';
  }
  if (overlay.help) {
    var hs = _aFilteredHelp();
    h += '<div class="drawer-veil" onclick="PRM.closeDrawer()"></div><div class="drawer" role="dialog" aria-modal="true" aria-label="Help"><div class="drawer-h"><div><h2>' + esc(t("help")) + '</h2><div class="sub">Offline help center · no external links</div></div><span style="margin-left:auto"></span><button class="icon-btn" onclick="PRM.closeDrawer()" aria-label="Close">✕</button></div><div class="drawer-b"><input class="inp" placeholder="Search help…" value="' + esc(_aHelpQ) + '" oninput="PRM.helpSearch(this.value)"><div style="height:12px"></div><div id="help-list"><div class="help-grid">'
      + hs.map(function (x) {
        var act = x.route ? "PRM.helpGo('" + x.route + "')" : "PRM.helpKeys()";
        return '<button class="help-card" onclick="' + act + '"><b>' + esc(x.title) + '</b><p>' + esc(x.desc) + '</p></button>';
      }).join("") + '</div></div><div style="height:12px"></div><div class="guide-sec"><h4>Keyboard</h4><ol><li>Ctrl or Cmd + K opens the command palette</li><li>G then O, E, R, V jumps to Overview, Erase, Recover, Verify</li><li>? opens this help, Esc closes any surface</li></ol></div></div><div class="drawer-f"><button class="btn sm ghost block" onclick="PRM.closeDrawer()">' + esc(t("close")) + '</button></div></div>';
  }
  if (_locked) {
    h += '<div class="lock-veil" role="dialog" aria-modal="true" aria-label="Locked"><div class="lock-card"><div class="brand-mark" style="margin:0 auto">' + _aIcon("lock") + '</div><h2 style="margin:14px 0 6px">Workspace locked</h2><p class="muted" style="margin:0 0 18px">Prototype lock. No data leaves this browser.</p><button class="btn primary block" onclick="PRM.unlockWorkspace()">Unlock workspace</button><div style="height:10px"></div><button class="btn ghost sm block" onclick="PRM.nav(\'/\')">Back to landing</button></div></div>';
  }
  root.innerHTML = h;
  if (overlay.palette) {
    var inp = document.getElementById("palette-input");
    if (inp) { try { inp.focus(); var v = inp.value; inp.value = ""; inp.value = v; } catch (e) {} }
  }
}

/* ---------- landing ---------- */
function renderLanding() {
  var langs = [];
  try { langs = Data().LANGS; } catch (e) { langs = [{ id: "en", label: "English" }]; }
  var langOpts = langs.map(function (l) { return '<option value="' + esc(l.id) + '"' + (S.lang === l.id ? " selected" : "") + '>' + esc(l.label) + '</option>'; }).join("");
  var cap = _aCapData(S.capTab);
  var tabs = [["erase", t("Secure Erasure", "Secure Erasure")], ["recover", t("Forensic Recovery", "Forensic Recovery")], ["vault", t("Evidence Vault", "Evidence Vault")], ["verify", t("Verification", "Verification")], ["reports", t("Reports", "Reports")]];
  var tabBar = '<div class="cap-tabs" role="tablist">' + tabs.map(function (x) { return '<button role="tab" data-cap="' + x[0] + '" class="' + (S.capTab === x[0] ? "on" : "") + '" onclick="PRM.capTab(\'' + x[0] + '\')">' + esc(x[1]) + '</button>'; }).join("") + '</div>';
  var capPanel = '<div class="cap-grid" id="cap-panel"><div class="cap-copy"><div class="eyebrow">' + esc(t("Capabilities", "Capabilities")) + '</div><h3>' + esc(cap.title) + '</h3><p>' + esc(cap.desc) + '</p><div class="cap-list">' + cap.points.map(function (x) { return '<div class="cap-row"><span class="st-dot ok"></span><span>' + esc(x) + '</span></div>'; }).join("") + '</div><div style="margin-top:14px;display:flex;gap:10px"><button class="btn primary sm" onclick="PRM.nav(\'/workspace\')">' + esc(t("Open Workspace", "Open Workspace")) + '</button><button class="btn sm" onclick="PRM.landGo(\'workflow\')">' + esc(t("See workflow", "See workflow")) + '</button></div></div><div class="cap-preview">' + _aCapPreview(S.capTab) + '</div></div>';
  return '<div class="land-nav"><div class="land-nav-in">' + logoBtn()
    + '<div class="land-links"><button onclick="PRM.landGo(\'product\')">' + esc(t("Product", "Product")) + '</button><button onclick="PRM.landGo(\'capabilities\')">' + esc(t("Capabilities", "Capabilities")) + '</button><button onclick="PRM.landGo(\'workflow\')">' + esc(t("Workflow", "Workflow")) + '</button><button onclick="PRM.landGo(\'security\')">' + esc(t("Security", "Security")) + '</button><button onclick="PRM.landGo(\'documentation\')">' + esc(t("Documentation", "Documentation")) + '</button></div>'
    + '<div class="land-right"><select class="sel" onchange="PRM.setLang(this.value)" aria-label="' + esc(t("Language", "Language")) + '" title="' + esc(t("Language", "Language")) + '">' + langOpts + '</select><button class="btn primary sm" onclick="PRM.nav(\'/workspace\')">' + esc(t("Open Workspace", "Open Workspace")) + '</button></div>'
    + '</div></div>'
    + '<div class="land"><div class="hero" id="sec-product"><div><div class="eyebrow">PARMAAN · ' + esc(t("Forensics Workspace", "Digital Forensics Workspace")) + '</div><h1>' + esc(t("Trust every byte.", "Trust every byte.")) + '<br>' + esc(t("Erase with certainty.", "Erase with certainty.")) + '<br>' + esc(t("Recover with evidence.", "Recover with evidence.")) + '</h1><p class="lede">' + esc(t("A guided digital-forensics workspace for secure data sanitization, forensic recovery, evidence verification, chain-of-custody tracking, and audit-ready reporting.", "A guided digital-forensics workspace for secure data sanitization, forensic recovery, evidence verification, chain-of-custody tracking, and audit-ready reporting.")) + '</p><div class="hero-ctas"><button class="btn primary" onclick="PRM.nav(\'/workspace\')">' + esc(t("Open Workspace", "Open Workspace")) + '</button><button class="btn" onclick="PRM.landGo(\'workflow\')">' + esc(t("Explore Workflow", "Explore Workflow")) + '</button></div><div class="hero-note">' + esc(t("Offline-first · Audit-ready · Mock prototype", "Offline-first · Audit-ready · Mock prototype")) + ' · ' + esc(_aLangShort()) + '</div></div>'
    + '<div class="pipe-card"><div class="pipe-card-h">' + esc(t("Forensic pipeline", "Forensic pipeline")) + ' <span class="live"><i></i>' + esc(t("guided", "guided")) + '</span></div><div class="pipe">'
    + '<div class="pnode"><span class="pn-ic">' + _aIcon("devices") + '</span><div><b>' + esc(t("Device", "Device")) + '</b><span>NVMe · USB · SATA · image</span></div></div><div class="plink"></div>'
    + '<div class="pnode active"><span class="pn-ic">' + _aIcon("erase") + '</span><div><b>' + esc(t("Acquire / Erase / Recover", "Acquire / Erase / Recover")) + '</b><span>' + esc(t("locked target · read-only source", "locked target · read-only source")) + '</span></div></div><div class="plink"></div>'
    + '<div class="pnode"><span class="pn-ic">' + _aIcon("verify") + '</span><div><b>' + esc(t("Verify", "Verify")) + '</b><span>' + esc(t("SHA-256 · residual PASS", "SHA-256 · residual PASS")) + '</span></div></div><div class="plink"></div>'
    + '<div class="pnode"><span class="pn-ic">' + _aIcon("vault") + '</span><div><b>' + esc(t("Evidence", "Evidence")) + '</b><span>' + esc(t("sealed · tagged · custody", "sealed · tagged · custody")) + '</span></div></div><div class="plink"></div>'
    + '<div class="pnode"><span class="pn-ic">' + _aIcon("reports") + '</span><div><b>' + esc(t("Report", "Report")) + '</b><span>' + esc(t("certificate · PDF · CSV", "certificate · PDF · CSV")) + '</span></div></div>'
    + '</div></div></div>'
    + '<section class="land-sec" id="sec-caps"><h2 class="sec-h">' + esc(t("One workspace, five disciplines", "One workspace, five disciplines")) + '</h2><p class="sec-sub">' + esc(t("Select a capability to preview the working interface. Everything below is live in the workspace.", "Select a capability to preview the working interface. Everything below is live in the workspace.")) + '</p>' + tabBar + capPanel + '</section>'
    + '<section class="land-sec" id="sec-workflow"><h2 class="sec-h">' + esc(t("Built around a verifiable workflow", "Built around a verifiable workflow")) + '</h2><p class="sec-sub">' + esc(t("Select, act, verify, document. Every run ends with proof.", "Select, act, verify, document. Every run ends with proof.")) + '</p><div class="timeline">'
    + '<div class="tl-card"><div class="n">01</div><b>' + esc(t("Select", "Select")) + '</b><p>' + esc(t("Target or source with serial check and drawer detail.", "Target or source with serial check and drawer detail.")) + '</p></div>'
    + '<div class="tl-card"><div class="n">02</div><b>' + esc(t("Act", "Act")) + '</b><p>' + esc(t("Guided methods or Expert low-level parameters.", "Guided methods or Expert low-level parameters.")) + '</p></div>'
    + '<div class="tl-card"><div class="n">03</div><b>' + esc(t("Verify", "Verify")) + '</b><p>' + esc(t("Full read-back, hashes and residual checks.", "Full read-back, hashes and residual checks.")) + '</p></div>'
    + '<div class="tl-card"><div class="n">04</div><b>' + esc(t("Document", "Document")) + '</b><p>' + esc(t("Certificates, custody and audit entries.", "Certificates, custody and audit entries.")) + '</p></div>'
    + '</div><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn primary sm" onclick="PRM.nav(\'/workspace/erase\')">' + esc(t("Try Secure Erasure", "Try Secure Erasure")) + '</button><button class="btn sm" onclick="PRM.nav(\'/workspace/recover\')">' + esc(t("Try Recovery", "Try Recovery")) + '</button><button class="btn sm ghost" onclick="PRM.openGuide()">' + esc(t("How it guides you", "How it guides you")) + '</button></div></section>'
    + '<section class="land-sec" id="sec-security"><h2 class="sec-h">' + esc(t("Restrained by design", "Restrained by design")) + '</h2><p class="sec-sub">' + esc(t("Safety and proof are built into the flow, not bolted on.", "Safety and proof are built into the flow, not bolted on.")) + '</p><div class="strip"><span><b>' + esc(t("Offline-first", "Offline-first")) + '</b> · ' + esc(t("local mock state", "local mock state")) + '</span><span><b>' + esc(t("Audit-ready", "Audit-ready")) + '</b> · ' + esc(t("every action logged", "every action logged")) + '</span><span><b>' + esc(t("Multilingual", "Multilingual")) + '</b> · ' + esc(t("6 interface packs", "6 interface packs")) + '</span><span><b>' + esc(t("Role-aware", "Role-aware")) + '</b> · ' + esc(t("clerk to expert", "clerk to expert")) + '</span><button class="btn xs ghost" onclick="PRM.nav(\'/workspace/verify\')">' + esc(t("Verify a hash", "Verify a hash")) + '</button></div></section>'
    + '<section class="land-sec" id="sec-docs"><h2 class="sec-h">' + esc(t("Documentation", "Documentation")) + '</h2><p class="sec-sub">' + esc(t("Offline-first help lives inside the workspace. No external portals.", "Offline-first help lives inside the workspace. No external portals.")) + '</p><div class="help-grid">'
    + '<button class="help-card" onclick="PRM.openHelp()"><b>' + esc(t("Getting Started", "Getting Started")) + '</b><p>' + esc(t("Overview, New Operation and first verify.", "Overview, New Operation and first verify.")) + '</p></button>'
    + '<button class="help-card" onclick="PRM.nav(\'/workspace/erase\')"><b>' + esc(t("Secure Erasure", "Secure Erasure")) + '</b><p>' + esc(t("Open the 6-step guided flow.", "Open the 6-step guided flow.")) + '</p></button>'
    + '<button class="help-card" onclick="PRM.nav(\'/workspace/recover\')"><b>' + esc(t("Recovery", "Recovery")) + '</b><p>' + esc(t("Open the 6-step scan flow.", "Open the 6-step scan flow.")) + '</p></button>'
    + '<button class="help-card" onclick="PRM.openGuide()"><b>' + esc(t("Guided help", "Guided help")) + '</b><p>' + esc(t("Context steps with read-aloud.", "Context steps with read-aloud.")) + '</p></button>'
    + '</div></section>'
    + '<div class="land-foot"><span><b>PARMAAN</b> · ' + esc(t("Forensics Workspace", "Digital Forensics Workspace")) + '</span><span>' + esc(t("Prototype · mock data · no real execution", "Prototype · mock data · no real execution")) + '</span><span style="margin-left:auto"></span><button class="btn xs" onclick="PRM.nav(\'/workspace\')">' + esc(t("Open Workspace", "Open Workspace")) + '</button></div>'
    + '</div>';
}

/* ---------- shell ---------- */
function _aNavBtn(route, path, label, icon) {
  var dis = _aNavDisabled(route);
  var on = S.route === route || (route === "cases" && S.route === "case-detail");
  if (dis) return '<button class="nav-item disabled" disabled title="' + esc(_aNavTip(route)) + '">' + _aIcon(icon) + '<span class="lbl">' + esc(label) + '</span></button>';
  return '<button class="nav-item' + (on ? " on" : "") + '" onclick="PRM.nav(\'' + path + '\')" title="' + esc(label) + '">' + _aIcon(icon) + '<span class="lbl">' + esc(label) + '</span></button>';
}
function renderShell(contentHTML) {
  var cl = S.collapsed ? " collapsed" : "";
  var cb = crumbs();
  var crumbHtml = cb.map(function (c, i) {
    var last = i === cb.length - 1;
    if (last) return '<button class="cur">' + esc(c[0]) + '</button>';
    return '<button onclick="PRM.nav(\'' + esc(c[1]) + '\')">' + esc(c[0]) + '</button><span>/</span>';
  }).join("");
  var unread = 0;
  try { unread = unreadCount(); } catch (e) { try { unread = notifList().filter(function (n) { return !n.read; }).length; } catch (e2) {} }
  var side = '<aside class="side" aria-label="Workspace navigation"><div class="side-top">' + logoBtn("side")
    + '<button class="ws-switch" onclick="PRM.wsSwitch()" title="Workspace switcher"><span class="brand-mark" style="width:24px;height:24px">' + _aIcon("vault") + '</span><span>' + esc(t("workspace")) + '</span><span style="margin-left:auto" class="dim">▾</span></button></div>'
    + '<nav>' + _aNavBtn("overview", "/workspace", t("overview"), "overview")
    + '<div class="nav-sec">Operations</div>' + _aNavBtn("erase", "/workspace/erase", t("erase"), "erase") + _aNavBtn("recover", "/workspace/recover", t("recover"), "recover")
    + '<div class="nav-sec">Evidence</div>' + _aNavBtn("evidence", "/workspace/evidence", t("evidence"), "vault") + _aNavBtn("cases", "/workspace/cases", t("cases"), "cases") + _aNavBtn("custody", "/workspace/custody", t("custody"), "custody")
    + '<div class="nav-sec">Verification</div>' + _aNavBtn("verify", "/workspace/verify", t("verify"), "verify") + _aNavBtn("audit", "/workspace/audit", t("audit"), "audit")
    + '<div class="nav-sec">Output</div>' + _aNavBtn("reports", "/workspace/reports", t("reports"), "reports")
    + '<div class="nav-sec">System</div>' + _aNavBtn("devices", "/workspace/devices", t("devices"), "devices") + _aNavBtn("activity", "/workspace/activity", t("activity"), "activity") + _aNavBtn("settings", "/workspace/settings", t("settings"), "settings")
    + (S.role === "clerk" ? '<div class="nav-sec">Note</div><div style="padding:0 10px;font-size:11.5px;color:var(--dim)">Clerk role: erase and recovery are disabled. Verify, reports and review remain available.</div>' : "")
    + '</nav><div class="side-bot"><button class="nav-item' + (S.route === "settings" ? "" : "") + '" onclick="PRM.openHelp()" title="Help">' + _aIcon("help") + '<span class="lbl">' + esc(t("help")) + ' · ?</span></button><button class="nav-item" onclick="PRM.openGuide()" title="Guide">' + _aIcon("guide") + '<span class="lbl">Guide</span></button><button class="nav-item" onclick="PRM.openProfile()" title="Profile">' + '<span class="avatar" style="width:26px;height:26px;font-size:10px">' + esc(_aInitials()) + '</span><span class="lbl">' + esc(S.operator || "Operator") + '<br><small class="dim">' + esc(S.role) + ' · ' + esc(S.mode) + '</small></span></button></div></aside>';
  var top = '<div class="topbar"><button class="icon-btn" id="btn-burger" onclick="PRM.toggleMobileSide()" aria-label="Menu">☰</button>'
    + '<div class="crumbs">' + crumbHtml + '</div>'
    + '<button class="cmdk" onclick="PRM.openPalette()">' + _aIcon("search") + '<span class="cmdk-t">' + esc(t("search")) + '</span><kbd>Ctrl K</kbd></button>'
    + '<div class="top-right"><span class="conn" title="Local prototype engine"><i></i><span class="conn-t">Local · Offline-ready</span></span><span class="env-pill" title="Mock engines until hardware is connected">Prototype · Mock</span>'
    + '<div class="mode-seg" role="group" aria-label="Forensic Mode"><button class="' + (S.mode === "guided" ? "on" : "") + '" onclick="PRM.setGuided()" title="Basic Mode: Simplified workflows & safe defaults">' + esc(t("guided") || "Basic") + '</button><button class="' + (S.mode === "expert" ? "on" : "") + '" onclick="PRM.requestExpert()" title="Expert Mode: Full forensic parameters and telemetry">Expert</button></div>'

    + '<button class="icon-btn" onclick="PRM.openGuide()" title="Guide" aria-label="Guide">' + _aIcon("guide") + '</button>'
    + '<button class="icon-btn" onclick="PRM.openNotif()" title="Notifications" aria-label="Notifications">' + _aIcon("bell") + (unread ? '<span class="dot"></span>' : "") + '</button>'
    + '<button class="icon-btn" onclick="PRM.openLangMenu()" title="' + esc(t("language")) + '" aria-label="Language">' + esc(_aLangShort()) + '</button>'
    + '<button class="avatar" onclick="PRM.openAvatar()" title="Account">' + esc(_aInitials()) + '</button>'
    + '</div></div>';
  var mnav = '<div class="m-nav"><button class="' + (S.route === "overview" ? "on" : "") + '" onclick="PRM.nav(\'/workspace\')">Overview</button><button class="' + (S.route === "erase" ? "on" : "") + '" onclick="PRM.nav(\'/workspace/erase\')">Erase</button><button class="' + (S.route === "recover" ? "on" : "") + '" onclick="PRM.nav(\'/workspace/recover\')">Recover</button><button class="' + (S.route === "evidence" ? "on" : "") + '" onclick="PRM.nav(\'/workspace/evidence\')">Vault</button><button class="' + (S.route === "verify" ? "on" : "") + '" onclick="PRM.nav(\'/workspace/verify\')">Verify</button><button class="' + (S.route === "reports" ? "on" : "") + '" onclick="PRM.nav(\'/workspace/reports\')">Reports</button></div>';
  return '<div class="ws' + cl + '">' + side + '<div class="side-veil" style="display:none" onclick="PRM.toggleMobileSide()"></div><div class="main">' + top + mnav + '<div class="content" id="main-content">' + contentHTML + '</div></div></div>';
}

/* ---------- raw sector inspector & entropy analyzer ---------- */
var _hexViewerState = { target: "Samsung SSD 970 EVO (/dev/nvme0n1)", lba: 0 };
function _aOpenHexViewer(target, lba) {
  _hexViewerState.target = target || "Samsung SSD 970 EVO (/dev/nvme0n1)";
  if (typeof lba === "string" && lba.indexOf("0x") === 0) {
    _hexViewerState.lba = parseInt(lba.replace(/^0x/i, ""), 16) || 0;
  } else {
    _hexViewerState.lba = Number(lba) || 0;
  }
  _renderHexModal();
}
function _renderHexModal() {
  var lba = _hexViewerState.lba;
  var lbaHex = "0x" + lba.toString(16).toUpperCase().padStart(8, "0");
  var sample = (window.PRM_DATA && PRM_DATA.HEX_SAMPLE) || [];
  var rows = "";
  for (var i = 0; i < 16; i++) {
    var off = (lba * 512 + i * 16).toString(16).toUpperCase().padStart(8, "0");
    var baseRow = sample[i % sample.length] || ["00000000", "00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00", "................"];
    var bytes = baseRow[1];
    var ascii = baseRow[2];
    rows += '<div class="hex-view-row"><span class="hex-view-off">' + off + '</span><span class="hex-view-bytes">' + esc(bytes) + '</span><span class="hex-view-ascii">' + esc(ascii) + '</span></div>';
  }
  var body = '<div style="margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">'
    + '<div><span class="dim" style="font-size:12px">Target Media:</span> <b class="mono" style="font-size:12.5px">' + esc(_hexViewerState.target) + '</b></div>'
    + '<div style="display:flex;align-items:center;gap:6px"><span class="badge ok">Write-Block HW Locked</span><span class="badge acc">Physical LBA ' + lbaHex + '</span></div>'
    + '</div>'
    + '<div class="hex-view-wrap">' + rows + '</div>'
    + '<div style="margin-top:10px;display:flex;align-items:center;gap:12px;font-size:12px;color:var(--mut);flex-wrap:wrap">'
    + '<span>Sector Size: <b>512 Bytes</b></span> · <span>Entropy: <b>7.92</b> (Encrypted/High)</span> · <span>Bypass: <b>Direct DMA</b></span>'
    + '</div>';
  var footer = '<div style="display:flex;gap:8px;align-items:center;width:100%;flex-wrap:wrap">'
    + '<button class="btn sm" onclick="PRM.hexPrevSector()">◄ Prev Sector (-512B)</button>'
    + '<button class="btn sm" onclick="PRM.hexNextSector()">Next Sector (+512B) ►</button>'
    + '<button class="btn sm ghost" onclick="PRM.hexJumpLba0()">Jump to LBA 0 (MBR/GPT)</button>'
    + '<button class="btn sm ghost" onclick="PRM.hexCopyBytes()">Copy Hex</button>'
    + '<span style="flex:1"></span>'
    + '<button class="btn sm primary" onclick="PRM.closeModal()">Close</button>'
    + '</div>';
  openModal({
    title: "Raw Sector LBA Inspector",
    sub: "Direct physical media byte inspection (Read-only forensic probe)",
    body: body,
    footer: footer,
    lg: true
  });
}
function _aOpenEntropyInspector() {
  openDrawer({
    title: "Entropy & Encryption Container Analyzer",
    sub: "Shannon Entropy calculation across target media sectors",
    body: '<div class="panel" style="margin-bottom:12px"><div class="panel-h"><h3>Entropy Distribution (0.0 to 8.0)</h3><span class="right"><span class="badge acc">AVX-512 Engine</span></span></div>'
      + '<div class="prog ok" style="height:12px;margin:10px 0"><i style="width:94%"></i></div>'
      + '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--dim)"><span>0.0 (Zeroes/Blank)</span><span>4.0 (Plaintext Code)</span><span>8.0 (Encrypted Blob / Compressed)</span></div>'
      + '<div style="height:14px"></div>'
      + '<dl>'
      + '<div class="kv"><dt>Current Sector</dt><dd class="mono">LBA 0x004F2A00</dd></div>'
      + '<div class="kv"><dt>Shannon Entropy</dt><dd class="mono">7.942 / 8.000</dd></div>'
      + '<div class="kv"><dt>Classification</dt><dd><span class="badge warn">High Entropy Container</span></dd></div>'
      + '<div class="kv"><dt>Heuristic Match</dt><dd>VeraCrypt / LUKS / AES-XTS encrypted volume signature</dd></div>'
      + '<div class="kv"><dt>Recommendation</dt><dd>Stage for cryptographic key triage or carve outer volume headers</dd></div>'
      + '</dl></div>'
      + '<div class="ok-box">Direct sector scraping completed in 42ms with zero disk writes.</div>',
    footer: '<button class="btn sm primary" onclick="PRM.openHexViewer(\'Encrypted Container LBA 0x004F2A00\', \'0x004F2A00\')">Inspect Raw Sector</button><button class="btn sm ghost" onclick="PRM.closeDrawer()">Close</button>'
  });
}

/* ---------- overview ---------- */
function renderOverview() {
  if (_ovFirst) {
    setTimeout(function () { _ovFirst = false; try { render(); } catch (e) {} }, 600);
    return '<div class="page-head"><div><div class="skel" style="width:180px;height:12px"></div><div class="skel" style="width:280px;height:26px;margin-top:8px"></div></div><div class="sp"><div class="skel" style="width:130px;height:36px"></div></div></div><div class="grid c4"><div class="skel" style="height:96px"></div><div class="skel" style="height:96px"></div><div class="skel" style="height:96px"></div><div class="skel" style="height:96px"></div></div><div style="height:14px"></div><div class="skel" style="height:180px"></div><div style="height:14px"></div><div class="skel" style="height:220px"></div>';
  }
  var isExpert = S.mode === "expert";
  var ops = [];
  try { ops = Svc().eraseService.all(); } catch (e) { ops = []; }
  var act = ops.filter(function (o) { return o.status === "running" || o.status === "queued" || o.paused; });
  var counts = _aStatCounts();
  var devs = [];
  try { devs = Data().DEVICES; } catch (e) {}
  var cases = [];
  try { cases = Svc().caseService.list().slice(0, 4); } catch (e) { try { cases = Data().CASES.slice(0, 4); } catch (e2) {} }
  var audit = [];
  try { audit = Svc().auditService.list().slice(0, 6); } catch (e) { try { audit = Data().AUDIT_SEED.slice(0, 6); } catch (e2) {} }

  var modePill = isExpert
    ? '<span class="badge acc" style="margin-left:8px">Expert Mode</span>'
    : '<span class="badge info" style="margin-left:8px">Basic Mode</span>';

  var head = '<div class="page-head"><div><div class="eyebrow">' + esc(greet()) + ' · ' + esc(S.operator || "") + modePill + '</div><h1>Forensics Workspace</h1><p>Review active operations, connected media, evidence cases, and recent verification activity.</p></div><div class="sp">'
    + '<button class="btn ghost sm" onclick="PRM.openGuide()">Guide</button><button class="btn primary sm" onclick="PRM.newOperation()">' + esc(t("newOp")) + '</button></div></div>';

  var expertBanner = "";
  var expertTelemetry = "";
  if (isExpert) {
    expertBanner = '<div class="expert-banner">'
      + '<div class="eb-left"><span class="badge acc">⚡ EXPERT WORKSPACE</span>'
      + '<span class="eb-title">Low-Level Forensics, Telemetry &amp; Direct DMA Engine Active</span></div>'
      + '<div class="eb-actions">'
      + '<span class="badge ok">Write-Block: Hardware Enforced</span>'
      + '<span class="badge info">Bus: O_DIRECT Bypass</span>'
      + '<button class="btn xs" onclick="PRM.openHexViewer(\'Samsung SSD 970 EVO (/dev/nvme0n1)\', \'0x00000000\')">Raw Sector Hex</button>'
      + '<button class="btn xs ghost" onclick="PRM.openEntropyInspector()">Entropy Scraper</button>'
      + '</div></div>';

    expertTelemetry = '<div class="telemetry-strip">'
      + '<div class="telemetry-card ok"><div class="tc-label">Direct I/O Throughput</div><div class="tc-val">1.82 GB/s</div><div class="tc-sub">NVMe DMA · Active</div></div>'
      + '<div class="telemetry-card info"><div class="tc-label">Write-Block Integrity</div><div class="tc-val">HW Lock</div><div class="tc-sub">0 Host Writes Allowed</div></div>'
      + '<div class="telemetry-card warn"><div class="tc-label">Signature Carver</div><div class="tc-val">Active</div><div class="tc-sub">AVX-512 SIMD (64 Patterns)</div></div>'
      + '<div class="telemetry-card"><div class="tc-label">Crypto Acceleration</div><div class="tc-val">Hardware</div><div class="tc-sub">BLAKE3 + SHA-256 Engine</div></div>'
      + '</div>';
  }

  var stats = '<div class="grid c4">'
    + '<div class="stat-card"><div class="k">Active Operations</div><div class="v">' + counts.ops + '</div><div class="d">running or queued · live</div></div>'
    + '<div class="stat-card"><div class="k">Evidence Items</div><div class="v">' + counts.ev + '</div><div class="d">sealed in vault</div></div>'
    + '<div class="stat-card"><div class="k">Open Cases</div><div class="v">' + counts.cs + '</div><div class="d">under investigation</div></div>'
    + '<div class="stat-card"><div class="k">Reports</div><div class="v">' + counts.rp + '</div><div class="d">certificates ready</div></div></div>';

  var opsHtml = "";
  if (!act.length) {
    opsHtml = emptyState(_aIcon("activity"), "No active operations.", "Start an erase or recovery run. Progress appears here with pause and cancel.", "New Operation", "PRM.newOperation()");
  } else {
    opsHtml = act.slice(0, 4).map(function (o) {
      var pct = o.progress || 0;
      var meta = esc(o.device || "") + ' · ' + esc(o.method || o.scan || o.title || "") + ' · elapsed ' + esc(o.elapsed || 0) + 's · ETA ' + esc(o.eta || "—");
      var btns = '<button class="btn xs" onclick="PRM.openOp(\'' + esc(o.id) + '\')">Open</button>';
      if (o.paused) btns += '<button class="btn xs" onclick="PRM.resumeOp(\'' + esc(o.id) + '\')">Resume</button>';
      else if (o.status === "running") btns += '<button class="btn xs ghost" onclick="PRM.pauseOp(\'' + esc(o.id) + '\')">Pause</button>';
      if (o.status === "running" || o.status === "queued" || o.paused) btns += '<button class="btn xs danger" onclick="PRM.cancelOpAsk(\'' + esc(o.id) + '\')">Cancel</button>';
      else btns += '<button class="btn xs" onclick="PRM.retryOp(\'' + esc(o.id) + '\')">Retry</button>';
      if (isExpert) btns += '<button class="btn xs" onclick="PRM.openHexViewer(\'' + esc(o.title || o.device) + '\', \'0x004F2A00\')">Inspect Hex</button>';
      var expertStream = isExpert ? '<div class="dim mono" style="font-size:11px;margin:2px 0 6px;color:#79C0FF">LBA: 0x004F2A00 · Buffer: 4 MiB DMA · IOPS: 18,400 · ' + 'Speed: 210 MB/s' + ' · Entropy: 7.94</div>' : '';
      return '<div class="op-card"><div class="ring">' + ringSVG(pct, 72) + '</div><div style="flex:1;min-width:220px"><b>' + esc(o.title || o.kind) + ' · ' + esc(o.id) + '</b>' + expertStream + '<div class="dim mono" style="font-size:11.5px;margin:3px 0 8px">' + meta + '</div><div class="prog"><i style="width:' + Math.min(100, pct) + '%"></i></div></div><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' + _aOpBadge(o) + btns + '</div></div>';
    }).join("");
  }
  var opsPanel = '<div class="panel"><div class="panel-h"><h3>Active Operations</h3><span class="sub">' + act.length + ' live</span><span class="right"><button class="btn xs ghost" onclick="PRM.nav(\'/workspace/activity\')">View all</button></span></div><div style="display:grid;gap:10px">' + opsHtml + '</div></div>';

  var devThead = isExpert
    ? '<thead><tr><th>Device</th><th>Interface / Bus</th><th>Capacity</th><th>LBA Native</th><th>SMART / Health</th><th>Write-Block</th><th style="text-align:right">Actions</th></tr></thead>'
    : '<thead><tr><th>Device</th><th>Type</th><th>Capacity</th><th>Filesystem</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>';

  var devRows = devs.map(function (d) {
    if (isExpert) {
      return '<tr onclick="PRM.devDrawer(\'' + esc(d.id) + '\')">'
        + '<td><b>' + esc(d.name) + '</b><div class="dim mono" style="font-size:11px">' + esc(d.path || "") + ' · ' + esc(d.partition || "GPT") + '</div></td>'
        + '<td>' + esc(d.interface || d.type || "") + '</td>'
        + '<td>' + esc(d.capacity || "") + '</td>'
        + '<td><span class="mono" style="font-size:11.5px">4096 B</span></td>'
        + '<td>' + (d.health != null ? '<span class="badge ok">' + d.health + '% Good</span>' : '<span class="badge warn">' + esc(d.smart || "Check") + '</span>') + '</td>'
        + '<td><span class="badge info">HW-Lock</span></td>'
        + '<td><div class="row-actions"><button class="btn xs ghost" onclick="event.stopPropagation();PRM.devDrawer(\'' + esc(d.id) + '\')">Details</button><button class="btn xs" onclick="event.stopPropagation();PRM.openHexViewer(\'' + esc(d.name) + '\', \'0x00000000\')">Inspect Hex</button></div></td></tr>';
    }
    return '<tr onclick="PRM.devDrawer(\'' + esc(d.id) + '\')"><td><b>' + esc(d.name) + '</b><div class="dim mono" style="font-size:11px">' + esc(d.path || "") + '</div></td><td>' + esc(d.interface || d.type || "") + '</td><td>' + esc(d.capacity || "") + '</td><td>' + esc(d.filesystem || "") + '</td><td>' + (d.status === "ready" ? '<span class="badge ok">Ready</span>' : '<span class="badge warn">' + esc(d.statusLabel || "Needs analysis") + '</span>') + '</td><td><div class="row-actions"><button class="btn xs ghost" onclick="event.stopPropagation();PRM.devDrawer(\'' + esc(d.id) + '\')">Details</button></div></td></tr>';
  }).join("");
  var devPanel = '<div class="panel"><div class="panel-h"><h3>Connected Devices</h3><span class="right"><button class="btn xs ghost" onclick="PRM.nav(\'/workspace/devices\')">All devices</button></span></div><div class="tbl-wrap"><table class="tbl">' + devThead + '<tbody>' + devRows + '</tbody></table></div></div>';

  var caseRows = cases.map(function (c) {
    var n = c.evidenceCount != null ? c.evidenceCount : "—";
    return '<tr onclick="PRM.caseOpen(\'' + esc(c.id) + '\')"><td class="mono"><b>' + esc(c.id) + '</b></td><td><b>' + esc(c.name) + '</b></td><td>' + esc(n) + '</td><td class="muted" style="font-size:12px">' + esc(c.updated || c.created || "") + '</td><td><span class="badge ' + (c.status === "Open" ? "acc" : "warn") + '">' + esc(c.status || "") + '</span></td></tr>';
  }).join("");
  var casePanel = '<div class="panel"><div class="panel-h"><h3>Recent Cases</h3><span class="right"><button class="btn xs ghost" onclick="PRM.nav(\'/workspace/cases\')">All cases</button></span></div><div class="tbl-wrap"><table class="tbl" style="min-width:0"><thead><tr><th>Case ID</th><th>Name</th><th>Evidence</th><th>Updated</th><th>Status</th></tr></thead><tbody>' + caseRows + '</tbody></table></div></div>';

  var tlHtml = audit.map(function (a) {
    var cls = /MISMATCH|FAIL|drift/i.test(a.action + " " + (a.detail || "")) ? "warn" : /VERIFY|COMPLETE|GENERAT/i.test(a.action) ? "ok" : "info";
    return '<button class="tl-ev ' + cls + '" onclick="PRM.nav(\'/workspace/audit\')"><div><b>' + esc(a.action) + '</b> · ' + esc(a.target || "") + ' <span class="dim">· ' + esc(a.actor || "") + '</span></div><div class="tt">' + esc(a.ts || "") + ' · ' + esc(a.detail || "") + '</div></button>';
  }).join("");
  var actPanel = '<div class="panel"><div class="panel-h"><h3>Recent Activity</h3><span class="right"><button class="btn xs ghost" onclick="PRM.nav(\'/workspace/activity\')">Activity</button></span></div><div class="tl">' + tlHtml + '</div></div>';

  var toolkitPanel = "";
  if (isExpert) {
    toolkitPanel = '<div class="panel" style="margin-top:14px"><div class="panel-h"><h3>⚡ Expert Forensic Toolkit &amp; Hardware Acceleration</h3><span class="sub">Advanced low-level modules</span><span class="right"><span class="badge acc">Expert Only</span></span></div>'
      + '<div class="grid c3">'
      + '<div class="pnode"><div class="pn-ic">🔍</div><div><b>Raw Sector LBA Inspector</b><span>Live hex &amp; ASCII sector stream</span><div style="margin-top:8px"><button class="btn xs primary" onclick="PRM.openHexViewer(\'Primary Media /dev/nvme0n1\', \'0x00000000\')">Launch Hex Inspector</button></div></div></div>'
      + '<div class="pnode"><div class="pn-ic">🧪</div><div><b>Entropy &amp; Container Scraper</b><span>Scan for hidden VeraCrypt/BitLocker</span><div style="margin-top:8px"><button class="btn xs ghost" onclick="PRM.openEntropyInspector()">Run Entropy Scan</button></div></div></div>'
      + '</div></div>';
  }

  var basicNote = !isExpert ? '<div class="panel" style="margin-top:14px;background:rgba(91,156,245,.04);border-color:rgba(91,156,245,.2)"><div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px"><div><b>Operating in Guided / Basic Mode</b><p class="dim" style="margin:2px 0 0;font-size:12.5px">Low-level sector parameters and direct DMA overrides are protected behind safe defaults.</p></div><button class="btn sm" onclick="PRM.requestExpert()">Switch to Expert Mode →</button></div></div>' : '';

  return head + expertBanner + expertTelemetry + stats + '<div style="height:14px"></div>' + opsPanel + '<div style="height:14px"></div>' + devPanel + '<div style="height:14px"></div><div class="grid c2">' + casePanel + actPanel + '</div>' + toolkitPanel + basicNote;
}

/* ---------- render dispatch ---------- */
function render() {
  var app = $("#app");
  if (!app) return;
  if (S.route === "landing") {
    app.innerHTML = renderLanding();
  } else {
    var html = "";
    try {
      if (S.route === "overview") html = renderOverview();
      else if (S.route === "erase" && typeof renderErase === "function") html = renderErase();
      else if (S.route === "recover" && typeof renderRecover === "function") html = renderRecover();
      else if (S.route === "evidence" && typeof renderEvidence === "function") html = renderEvidence();
      else if (S.route === "cases" && typeof renderCases === "function") html = renderCases();
      else if (S.route === "case-detail" && typeof renderCaseDetail === "function") html = renderCaseDetail();
      else if (S.route === "custody" && typeof renderCustody === "function") html = renderCustody();
      else if (S.route === "verify" && typeof renderVerify === "function") html = renderVerify();
      else if (S.route === "audit" && typeof renderAudit === "function") html = renderAudit();
      else if (S.route === "reports" && typeof renderReports === "function") html = renderReports();
      else if (S.route === "devices" && typeof renderDevices === "function") html = renderDevices();
      else if (S.route === "activity" && typeof renderActivity === "function") html = renderActivity();
      else if (S.route === "settings" && typeof renderSettings === "function") html = renderSettings();
      else html = renderOverview();
    } catch (e) { html = renderOverview(); }
    app.innerHTML = renderShell(html);
  }
  try { applyTranslation(app); } catch (e) {}
  try { renderOverlays(); } catch (e) {}
}

/* ---------- keyboard / boot ---------- */
function _aKeyHandler(e) {
  if (!e) return;
  if ((e.metaKey || e.ctrlKey) && String(e.key || "").toLowerCase() === "k") { e.preventDefault(); if (overlay.palette) { overlay.palette = false; renderOverlays(); } else { overlay.palette = true; S.paletteIdx = 0; _aPalQ = ""; renderOverlays(); } return; }
  if (e.key === "Escape") { try { escHandler(e); } catch (err) {} return; }
  var tg = e.target && e.target.tagName ? String(e.target.tagName).toLowerCase() : "";
  var typing = (tg === "input" || tg === "textarea" || tg === "select" || (e.target && e.target.isContentEditable));
  if (typing) return;
  if (e.key === "?") { e.preventDefault(); overlay.help = true; renderOverlays(); return; }
  if (_aGPending) {
    _aGPending = false;
    if (_aGTimer) { clearTimeout(_aGTimer); _aGTimer = null; }
    var k = String(e.key || "").toLowerCase();
    if (k === "o") nav("/workspace");
    else if (k === "e") nav("/workspace/erase");
    else if (k === "r") nav("/workspace/recover");
    else if (k === "v") nav("/workspace/verify");
    if (k === "o" || k === "e" || k === "r" || k === "v") e.preventDefault();
    return;
  }
  if (String(e.key || "").toLowerCase() === "g" && !e.metaKey && !e.ctrlKey && !e.altKey) {
    _aGPending = true;
    if (_aGTimer) clearTimeout(_aGTimer);
    _aGTimer = setTimeout(function () { _aGPending = false; }, 900);
  }
}
try { document.addEventListener("keydown", _aKeyHandler); } catch (e) {}
try { window.addEventListener("hashchange", function () { setRoute(window.location.hash || "#/"); }); } catch (e) {}
function _aBoot() {
  try { if (Svc() && Svc().subscribe) Svc().subscribe(function () { try { render(); } catch (e) {} }); } catch (e) {}
  var hh = "#/";
  try { hh = window.location.hash || "#/"; } catch (e) {}
  try { setRoute(hh); } catch (e) { try { render(); } catch (e2) {} }
  try {
    if (!lsGet("onboarded", false)) {
      S.onboardStep = 0;
      overlay.modal = { kind: "onb" };
      renderOverlays();
    }
  } catch (e) {}
}
try { _aBoot(); } catch (e) {}

Object.assign(window.PRM, {
  getState: function () { return S; },
  getOverlay: function () { return overlay; },
  nav: function (p) { nav(p); },
  navGo: function (p) { nav(p); },
  toggleSidebar: function () { S.collapsed = !S.collapsed; persist(); render(); },
  toggleMobileSide: function () { var w = document.querySelector(".ws"); if (w) w.classList.toggle("side-open"); var v = document.querySelector(".side-veil"); if (v) v.style.display = (w && w.classList.contains("side-open")) ? "block" : "none"; },
  wsSwitch: function () { toast("info", "Forensics Workspace", "Single-workspace prototype · already active."); },
  openPalette: function () { overlay.palette = true; S.paletteIdx = 0; _aPalQ = ""; renderOverlays(); },
  closePalette: function () { overlay.palette = false; renderOverlays(); },
  paletteFilter: function (v) { _aPalQ = String(v == null ? "" : v); S.paletteIdx = 0; _aRenderPaletteList(); },
  paletteGo: function (i) { _aPaletteGo(i || 0); },
  paletteKey: function (ev) { _aPaletteKey(ev); },
  openNotif: function () { overlay.notif = true; overlay.avatar = false; overlay.lang = false; renderOverlays(); },
  closeNotif: function () { overlay.notif = false; renderOverlays(); },
  markAllRead: function () { try { var l = lsGet("notifications", Data().NOTIFICATIONS_SEED.slice()); l.forEach(function (n) { n.read = true; }); lsSet("notifications", l); } catch (e) {} toast("success", "All caught up", "Notifications marked as read."); render(); },
  notifGo: function (route, id) { try { if (id) { var l = lsGet("notifications", []); l.forEach(function (n) { if (n.id === id) n.read = true; }); lsSet("notifications", l); } } catch (e) {} overlay.notif = false; renderOverlays(); if (route) nav(route); else render(); },
  openAvatar: function () { overlay.avatar = !overlay.avatar; overlay.notif = false; overlay.lang = false; renderOverlays(); },
  avatarGo: function (a) { overlay.avatar = false; renderOverlays(); if (a === "profile") _aOpenProfile(); else if (a === "lock") _aLock(); else if (a === "signout") _aSignOut(); else if (a === "settings") nav("/workspace/settings"); else if (a === "help") { overlay.help = true; renderOverlays(); } else render(); },
  openLangMenu: function () { overlay.lang = !overlay.lang; overlay.avatar = false; overlay.notif = false; renderOverlays(); },
  setLang: function (id) { S.lang = id; persist(); overlay.lang = false; var lbl = id; try { lbl = langLabel(id); } catch (e) {} toast("success", "Language changed", lbl); render(); },
  requestExpert: function () {
    if (S.mode === "expert") {
      toast("info", "Expert Mode Active", "All low-level parameters and hardware telemetry are enabled.");
      return;
    }
    overlay.modal = { kind: "expert" };
    renderOverlays();
  },
  confirmExpert: function () {
    S.mode = "expert";
    persist();
    overlay.modal = null;
    renderOverlays();
    toast("success", "⚡ Expert Mode Activated", "Deep forensic telemetry, raw sector inspection & acceleration unlocked.");
    render();
  },
  setExpert: function (skipConfirm) {
    if (skipConfirm || S.mode === "expert") {
      S.mode = "expert";
        persist();
      overlay.modal = null;
      renderOverlays();
      toast("success", "⚡ Expert Mode Activated", "Deep forensic telemetry, raw sector inspection & acceleration unlocked.");
      render();
    } else {
      PRM.requestExpert();
    }
  },
  setGuided: function () {
    S.mode = "guided";
    persist();
    overlay.modal = null;
    renderOverlays();
    toast("info", "Basic Mode Activated", "Simplified workflow and safe guardrails restored.");
    render();
  },
  openHexViewer: function (target, lba) { _aOpenHexViewer(target, lba); },
  openEntropyInspector: function () { _aOpenEntropyInspector(); },
  hexPrevSector: function () { if (_hexViewerState.lba > 0) _hexViewerState.lba--; _renderHexModal(); },
  hexNextSector: function () { _hexViewerState.lba++; _renderHexModal(); },
  hexJumpLba0: function () { _hexViewerState.lba = 0; _renderHexModal(); },
  hexCopyBytes: function () { copyText("25 50 44 46 2D 31 2E 37 0A 25 E2 E3 CF D3 0A 31 20 30 20 6F 62 6A 0A", "Raw Hex Bytes"); },
  openGuide: function () { overlay.guide = true; _aGuideRisk = false; renderOverlays(); },
  readAloud: function () { _aReadAloud(); },
  showRisk: function () { _aGuideRisk = !_aGuideRisk; renderOverlays(); },
  guideReady: function () { overlay.guide = false; _aGuideRisk = false; toast("success", "Guide dismissed", "You are ready to proceed."); renderOverlays(); },
  openHelp: function () { overlay.help = true; overlay.avatar = false; renderOverlays(); },
  helpSearch: function (v) { _aHelpQ = String(v == null ? "" : v); _aRenderHelpList(); },
  helpGo: function (r) { overlay.help = false; renderOverlays(); nav(r); },
  helpKeys: function () { toast("info", "Shortcuts", "Ctrl K · G O E R V · ? · Esc"); },
  landGo: function (w) { _aLandGo(w); },
  capTab: function (id) { S.capTab = id; _aRenderCapPanel(); },
  newOperation: function () { overlay.newop = true; renderOverlays(); },
  newOpGo: function (kind) { overlay.newop = false; renderOverlays(); if (kind === "erase") nav("/workspace/erase"); else if (kind === "recover") nav("/workspace/recover"); else if (kind === "verify") nav("/workspace/verify"); else if (kind === "case") { nav("/workspace/cases"); setTimeout(function () { try { if (typeof caseCreateModal === "function") caseCreateModal(); } catch (e) {} }, 120); } else render(); },
  openOp: function (id) { _aOpenOp(id); },
  pauseOp: function (id) { _aPauseOp(id); },
  resumeOp: function (id) { _aResumeOp(id); },
  cancelOpAsk: function (id) { overlay.confirmCancel = id; renderOverlays(); },
  cancelOpConfirm: function () { _aCancelConfirm(); },
  retryOp: function (id) { _aRetryOp(id); },
  devDrawer: function (id) { _aDevDrawer(id); },
  devSelect: function (id) { try { S.erase.deviceId = id; } catch (e) {} persist(); try { closeDrawer(); } catch (e) {} toast("success", "Device selected", String(id)); nav("/workspace/erase"); },
  caseOpen: function (id) { S.cases.openId = id; persist(); nav("/workspace/cases/" + encodeURIComponent(id)); },
  lockWorkspace: function () { _aLock(); },
  unlockWorkspace: function () { _locked = false; toast("success", "Workspace unlocked", "Welcome back."); renderOverlays(); },
  signOut: function () { _aSignOut(); },
  openProfile: function () { _aOpenProfile(); },
  setRoleQuick: function (r) { S.role = r; persist(); overlay.avatar = false; toast("success", "Role switched", "Now acting as " + r + "."); render(); },
  closeModal: function () { closeModal(); },
  closeModalX: function () { closeModal(); },
  closeDrawer: function () { overlay.drawer = null; overlay.guide = false; overlay.help = false; renderOverlays(); },
  closeMenu: function () { overlay.menu = null; overlay.notif = false; overlay.avatar = false; overlay.lang = false; renderOverlays(); },
  onbNext: function () { var s = S.onboardStep || 0; if (s < 2) { S.onboardStep = s + 1; renderOverlays(); } else { try { lsSet("onboarded", true); } catch (e) {} overlay.modal = null; renderOverlays(); nav("/workspace"); } },
  onbBack: function () { S.onboardStep = Math.max(0, (S.onboardStep || 0) - 1); renderOverlays(); },
  onbSkip: function () { try { lsSet("onboarded", true); } catch (e) {} overlay.modal = null; renderOverlays(); if (S.route === "landing") nav("/workspace"); else render(); }
});
/*CHUNK_A_OK*/
/* ===== chunk_b.js ===== */
/* PARMAAN chunk_b - secure erasure + forensic recovery workflows (inside existing IIFE) */
function eBEraseMocks() {
  return [
    { id: "part-nvme-p1", realId: "dev-nvme-01", name: "nvme0n1p1 - EFI", model: "Samsung SSD 970 EVO - Partition 1", serial: "S466NX0R812345-P1", capacity: "512 MB", interface: "NVMe - GPT", path: "/dev/nvme0n1p1", filesystem: "FAT32", partition: "GPT - p1", smart: "Good - 96% life", mounted: "Not mounted", rw: "Read/Write", status: "ready", statusLabel: "Ready", health: 96, supportsCrypto: true, notes: "EFI system partition." },
    { id: "part-nvme-p2", realId: "dev-nvme-01", name: "nvme0n1p2 - Data", model: "Samsung SSD 970 EVO - Partition 2", serial: "S466NX0R812345-P2", capacity: "999 GB", interface: "NVMe - GPT", path: "/dev/nvme0n1p2", filesystem: "NTFS", partition: "GPT - p2", smart: "Good - 96% life", mounted: "Not mounted", rw: "Read/Write", status: "ready", statusLabel: "Ready", health: 96, supportsCrypto: true, notes: "Main data volume." },
    { id: "part-usb-p1", realId: "dev-usb-02", name: "sdb1 - Evidence", model: "SanDisk Extreme - Partition 1", serial: "SDCZ8804128GX-P1", capacity: "128 GB", interface: "USB 3.1 - MBR", path: "/dev/sdb1", filesystem: "exFAT", partition: "MBR - p1", smart: "Good", mounted: "Mounted - /media/usb0", rw: "Read/Write", status: "ready", statusLabel: "Ready", health: 100, supportsCrypto: false, notes: "Use write-blocker before recovery." },
    { id: "part-hdd-x", realId: "dev-hdd-03", name: "sda - Unreadable", model: "Seagate Barracuda - Unknown", serial: "ST2000DM008-PX", capacity: "2 TB", interface: "SATA III - Unknown", path: "/dev/sda", filesystem: "Unknown", partition: "Unknown - analysis required", smart: "Caution - 12 reallocated sectors", mounted: "Not mounted", rw: "Read-only suggested", status: "attention", statusLabel: "Needs analysis", health: 71, supportsCrypto: false, notes: "Run Lost Partition Search first." },
    { id: "file-docs", realId: "dev-usb-02", name: "SeizedDocs - (2,340 files)", model: "Folder - SMB share", serial: "FOLD-SEZ-2340", capacity: "18.4 GB", interface: "Logical - NTFS", path: "/media/usb0/SeizedDocs", filesystem: "exFAT", partition: "File-level target", smart: "Good", mounted: "Mounted - /media/usb0", rw: "Read/Write", status: "ready", statusLabel: "Ready", health: 100, supportsCrypto: false, notes: "File-level sanitization via srm profile." },
    { id: "file-caseimg", realId: "dev-hdd-03", name: "CASE-118.E01 (image)", model: "Disk Image - E01", serial: "CASE-118-E01", capacity: "128 GB", interface: "E01 image", path: "/images/CASE-118.E01", filesystem: "NTFS (inside image)", partition: "Image target", smart: "Good", mounted: "Not mounted", rw: "Read/Write", status: "ready", statusLabel: "Ready", health: 100, supportsCrypto: false, notes: "Logical image target." }
  ];
}
function eBEraseDevice() {
  var id = S.erase.deviceId;
  if (!id) return null;
  var d = null;
  try { d = Svc().deviceService.get(id); } catch (e) {}
  if (d) return { id: d.id, realId: d.id, name: d.name, model: d.model || d.name, serial: d.serial, capacity: d.capacity, interface: d.interface, path: d.path, filesystem: d.filesystem, partition: d.partition, smart: d.smart, mounted: d.mounted, rw: d.rw, status: d.status, statusLabel: d.statusLabel || d.status, health: d.health, supportsCrypto: d.supportsCrypto, notes: d.notes };
  var mocks = eBEraseMocks();
  for (var i = 0; i < mocks.length; i++) if (mocks[i].id === id) return mocks[i];
  if (id && id.indexOf("upload:") === 0) return { id: id, realId: id, name: id.slice(7), model: "Uploaded image", serial: "UPLOAD", capacity: "—", interface: "Image", path: id.slice(7), filesystem: "auto", partition: "Image", smart: "—", mounted: "Not mounted", rw: "Read-only", status: "ready", statusLabel: "Ready" };
  return { id: id, realId: id, name: id, model: id, serial: "—", capacity: "—", interface: "—", path: id, filesystem: "—", partition: "—", smart: "—", mounted: "—", rw: "—", status: "ready", statusLabel: "Ready" };
}
function eBEraseMethod() {
  var list = Data().ERASE_METHODS_GUIDED || [];
  for (var i = 0; i < list.length; i++) if (list[i].id === S.erase.methodId) return list[i];
  return list[1] || list[0] || null;
}
function eBEraseTool() {
  var list = Data().ERASE_TOOLS_EXPERT || [];
  for (var i = 0; i < list.length; i++) if (list[i].id === S.erase.toolId) return list[i];
  return list[0] || null;
}
function eBIsHighRisk() {
  if (S.mode !== "expert") return false;
  if (S.erase.toolId === "ata") return true;
  if (S.erase.methodId === "full") return true;
  if ((S.erase.passes || 0) >= 7) return true;
  return false;
}
function eBEraseOp() {
  var id = S.erase.opId;
  if (!id) return null;
  var o = null;
  try { o = opById(id); } catch (e) {}
  if (o) return o;
  try { o = Svc().eraseService.get(id); } catch (e2) {}
  return o;
}
function eBCertId(op) {
  if (S.erase.certId) return S.erase.certId;
  var prefix = "PRM-SAN-2026-";
  try { if (S.settings && S.settings.certPrefix) prefix = S.settings.certPrefix; } catch (e) {}
  var digits = "";
  try { digits = String((op && op.id) || S.erase.opId || "").replace(/\D/g, "").slice(-5); } catch (e2) {}
  if (!digits) digits = "00184";
  while (digits.length < 5) digits = "0" + digits;
  return prefix + digits;
}
function eBEraseStepper() {
  var steps = [["1", "Select Target", "Device"], ["2", "Method", "Sanitize"], ["3", "Review", "Confirm"], ["4", "Execute", "Run"], ["5", "Verify", "Check"], ["6", "Certificate", "Proof"]];
  var cur = S.erase.step || 1;
  var h = '<div class="stepper" role="tablist">';
  for (var i = 0; i < steps.length; i++) {
    var n = i + 1;
    var cls = "step";
    if (n < cur) cls += " done";
    if (n === cur) cls += " on";
    h += '<button class="' + cls + '" onclick="PRM.eraseGoto(' + n + ')" role="tab" aria-selected="' + (n === cur ? "true" : "false") + '"><span class="sn">' + (n < cur ? "✓" : n) + '</span><span><b>' + steps[i][1] + '</b><br><small>' + steps[i][2] + '</small></span></button>';
  }
  return h + "</div>";
}
function eBEraseStep1() {
  var st = S.erase;
  var tab = st.tab || "drives";
  var bar = '<div class="seg" style="margin-bottom:12px"><button class="' + (tab === "drives" ? "on" : "") + '" onclick="PRM.eraseTab(\'drives\')">Drives</button><button class="' + (tab === "parts" ? "on" : "") + '" onclick="PRM.eraseTab(\'parts\')">Partitions</button><button class="' + (tab === "files" ? "on" : "") + '" onclick="PRM.eraseTab(\'files\')">Files &amp; Folders</button></div>';
  var rows = "";
  if (tab === "drives") {
    var devs = Data().DEVICES || [];
    rows = devs.map(function (d) {
      var sel = st.deviceId === d.id;
      var badge = d.status === "ready" ? '<span class="badge ok">Ready</span>' : '<span class="badge warn">Needs analysis</span>';
      return '<tr class="' + (sel ? "sel" : "") + '" onclick="PRM.eraseSelectDevice(\'' + d.id + '\')"><td><b>' + esc(d.name) + '</b><div class="dim mono" style="font-size:11px">' + esc(d.path || "") + '</div></td><td class="muted">' + esc(d.model || "") + '</td><td class="mono" style="font-size:11.5px">' + esc(d.serial || "") + '</td><td>' + esc(d.capacity || "") + '</td><td class="muted">' + esc(d.interface || "") + '</td><td>' + badge + '</td><td><div class="row-actions"><button class="btn xs" onclick="event.stopPropagation();PRM.eraseOpenDevice(\'' + d.id + '\')">Details</button></div></td></tr>';
    }).join("");
    rows = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Device</th><th>Model</th><th>Serial</th><th>Capacity</th><th>Interface</th><th>Status</th><th style="text-align:right">Action</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
  } else if (tab === "parts") {
    var parts = eBEraseMocks().slice(0, 4);
    rows = parts.map(function (d) {
      var sel2 = st.deviceId === d.id;
      var badge2 = d.status === "ready" ? '<span class="badge ok">Ready</span>' : '<span class="badge warn">Needs analysis</span>';
      return '<tr class="' + (sel2 ? "sel" : "") + '" onclick="PRM.eraseSelectDevice(\'' + d.id + '\')"><td><b>' + esc(d.name) + '</b><div class="dim mono" style="font-size:11px">' + esc(d.path) + '</div></td><td class="muted">' + esc(d.model) + '</td><td class="mono" style="font-size:11.5px">' + esc(d.serial) + '</td><td>' + esc(d.capacity) + '</td><td class="muted">' + esc(d.interface) + '</td><td>' + badge2 + '</td><td><div class="row-actions"><button class="btn xs" onclick="event.stopPropagation();PRM.eraseOpenDevice(\'' + d.id + '\')">Details</button></div></td></tr>';
    }).join("");
    rows = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Partition</th><th>Model</th><th>Serial</th><th>Capacity</th><th>Interface</th><th>Status</th><th style="text-align:right">Action</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
  } else {
    var files = eBEraseMocks().slice(4, 6);
    rows = files.map(function (d) {
      var sel3 = st.deviceId === d.id;
      return '<tr class="' + (sel3 ? "sel" : "") + '" onclick="PRM.eraseSelectDevice(\'' + d.id + '\')"><td><b>' + esc(d.name) + '</b><div class="dim mono" style="font-size:11px">' + esc(d.path) + '</div></td><td class="muted">' + esc(d.model) + '</td><td class="mono" style="font-size:11.5px">' + esc(d.serial) + '</td><td>' + esc(d.capacity) + '</td><td class="muted">' + esc(d.interface) + '</td><td><span class="badge ok">Ready</span></td><td><div class="row-actions"><button class="btn xs" onclick="event.stopPropagation();PRM.eraseOpenDevice(\'' + d.id + '\')">Details</button></div></td></tr>';
    }).join("");
    rows = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Files &amp; Folders</th><th>Model</th><th>Serial</th><th>Capacity</th><th>Interface</th><th>Status</th><th style="text-align:right">Action</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
  }
  var selDev = eBEraseDevice();
  var selLine = selDev ? '<div class="ok-box" style="margin-top:12px">Selected <b>' + esc(selDev.name) + '</b> · <span class="mono">' + esc(selDev.serial || "") + '</span> · ' + esc(selDev.capacity || "") + '</div>' : '<div class="warn-box" style="margin-top:12px">No target selected. Click a row, then Continue.</div>';
  var canNext = selDev ? "" : " disabled";
  return bar + rows + selLine + '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px"><button class="btn primary" ' + canNext + ' onclick="PRM.eraseNext()">' + t("cont") + ' →</button></div>';
}
function eBEraseStep2() {
  var st = S.erase;
  var isExpert = S.mode === "expert";
  var methods = Data().ERASE_METHODS_GUIDED || [];
  var cards = '<div class="method-grid c4">' + methods.map(function (m) {
    var sel = st.methodId === m.id;
    var tag = m.tag ? '<span class="badge acc">' + esc(m.tag) + '</span>' : "";
    var need = (m.needsCrypto && !(eBEraseDevice() && eBEraseDevice().supportsCrypto)) ? '<div class="dim" style="font-size:11px;margin-top:6px">Needs self-encrypting drive — current target may not support it.</div>' : "";
    return '<button class="method-card' + (sel ? " sel" : "") + '" onclick="PRM.erasePickMethod(\'' + m.id + '\')"><h4>' + esc(m.name) + ' ' + tag + '</h4><p>' + esc(m.desc) + '</p><div class="meta"><span>' + esc(m.duration || "") + '</span><span>·</span><span>' + esc(m.verify || "") + '</span><span>·</span><span>' + esc(m.compat || "") + '</span></div>' + need + "</button>";
  }).join("") + "</div>";
  var expertPart = "";
  if (isExpert) {
    var tools = Data().ERASE_TOOLS_EXPERT || [];
    var toolCards = '<div class="method-grid c4" style="margin-top:12px">' + tools.map(function (x) {
      var sel2 = st.toolId === x.id;
      return '<button class="method-card' + (sel2 ? " sel" : "") + '" onclick="PRM.erasePickTool(\'' + x.id + '\')"><h4 class="mono">' + esc(x.name) + '</h4><p>' + esc(x.desc) + '</p><div class="meta"><span>' + esc(x.profile || "Planned prototype profile") + '</span></div></button>';
    }).join("") + "</div>";
    var patOpts = ["00 / FF / Random", "DoD 5220.22-M", "Gutmann-lite", "Random + Verify"];
    var patSel = patOpts.map(function (p) { return '<option' + (st.pattern === p ? " selected" : "") + '>' + esc(p) + "</option>"; }).join("");
    var bsOpts = ["512 B", "4 KiB", "1 MiB", "4 MiB"];
    var bsSel = bsOpts.map(function (p) { return '<option' + (st.blockSize === p ? " selected" : "") + '>' + esc(p) + "</option>"; }).join("");
    var emOpts = ["standard", "enhanced", "crypto"];
    var emSel = emOpts.map(function (p) { return '<option value="' + p + '"' + (st.eraseMode === p ? " selected" : "") + '>' + p + "</option>"; }).join("");
    var vOpts = [0, 5, 25, 100];
    var vSel = vOpts.map(function (p) { return '<option value="' + p + '"' + (Number(st.verifyPct) === p ? " selected" : "") + '>' + p + "%</option>"; }).join("");
    expertPart = '<div class="panel" style="margin-top:14px"><div class="panel-h"><h3>Expert Low-Level Forensic Tools</h3><span class="sub">Direct sanitization engine profiles</span><span class="right"><span class="badge acc">Expert Mode</span></span></div>'
      + toolCards
      + '<div style="height:14px"></div>'
      + '<div class="panel-h"><h3>Expert Parameters</h3><span class="sub">Low-level forensic overwrite controls</span></div>'
      + '<div class="grid c2"><div><label class="f">Overwrite passes (1–35)</label><input class="inp" type="number" min="1" max="35" value="' + esc(String(st.passes)) + '" onchange="PRM.eraseField(\'passes\',this.value)"></div><div><label class="f">Pattern</label><select class="sel" style="width:100%" onchange="PRM.eraseField(\'pattern\',this.value)">' + patSel + '</select></div><div><label class="f">Verification %</label><select class="sel" style="width:100%" onchange="PRM.eraseField(\'verifyPct\',this.value)">' + vSel + '</select></div><div><label class="f">Block size</label><select class="sel" style="width:100%" onchange="PRM.eraseField(\'blockSize\',this.value)">' + bsSel + '</select></div><div><label class="f">Secure erase mode</label><select class="sel" style="width:100%" onchange="PRM.eraseField(\'eraseMode\',this.value)">' + emSel + '</select></div><div><label class="f">Mount handling</label><label class="check"><input type="checkbox"' + (st.forceUnmount ? " checked" : "") + ' onchange="PRM.eraseToggle(\'forceUnmount\',this.checked)"> <span><b>Force unmount</b><br><span class="dim">Unmount target before arming engine.</span></span></label></div></div><div style="height:10px"></div><label class="check"><input type="checkbox"' + (st.discard ? " checked" : "") + ' onchange="PRM.eraseToggle(\'discard\',this.checked)"> <span><b>Discard / TRIM</b><br><span class="dim">Issue discard for flash / thin volumes where supported.</span></span></label><div class="warn-box" style="margin-top:12px">Tool profiles: nwipe · scrub · srm · blkdiscard · ATA Secure Erase — technical direct command configuration.</div></div>';
  } else {
    expertPart = '<p class="dim" style="font-size:12.5px">Basic mode shows recommended choices. Switch to Expert Mode (top bar) for low-level forensic tool selection and overwrite parameters.</p>';
  }
  var needType = eBIsHighRisk();
  var typeBox = "";
  if (needType) {
    typeBox = '<div class="danger-box" style="margin-top:12px"><b>High-risk configuration.</b> This expert selection can destroy all data on the target. Type <span class="mono"><b>ERASE</b></span> to unlock Continue.<div style="height:8px"></div><input class="inp mono" id="erase-type" placeholder="Type ERASE" value="' + esc(st.typeConfirm || "") + '" oninput="PRM.eraseType(this.value)"></div>';
  }
  var typeOk = !needType || st.typeConfirm === "ERASE";
  var canNext = typeOk ? "" : " disabled";
  return cards + expertPart + typeBox + '<div style="display:flex;gap:10px;justify-content:space-between;margin-top:14px"><button class="btn ghost" onclick="PRM.eraseBack()">← ' + t("back") + '</button><button class="btn primary" ' + canNext + ' onclick="PRM.eraseNext()">' + t("cont") + ' →</button></div>';
}
function eBEraseStep3() {
  var st = S.erase;
  var dev = eBEraseDevice();
  var meth = eBEraseMethod();
  var tool = eBEraseTool();
  var isExpert = S.mode === "expert";
  var methLine = esc(meth ? meth.name : "—") + (isExpert && tool ? ' · <span class="mono">' + esc(tool.name) + "</span>" : "") + (isExpert ? " · " + esc(String(st.passes)) + " pass(es) · " + esc(st.pattern || "") : "");
  var needType = eBIsHighRisk();
  var typeOk = !needType || st.typeConfirm === "ERASE";
  var canBegin = (st.confirm && typeOk && dev) ? "" : " disabled";
  var h = '<div class="grid c2"><div class="panel"><div class="panel-h"><h3>Target</h3></div><dl><div class="kv"><dt>Device</dt><dd>' + esc(dev ? dev.name : "—") + '</dd></div><div class="kv"><dt>Serial</dt><dd class="mono">' + esc(dev ? dev.serial : "—") + '</dd></div><div class="kv"><dt>Capacity</dt><dd>' + esc(dev ? dev.capacity : "—") + '</dd></div><div class="kv"><dt>Path</dt><dd class="mono">' + esc(dev ? dev.path : "—") + '</dd></div></dl></div><div class="panel"><div class="panel-h"><h3>Method</h3></div><dl><div class="kv"><dt>Method</dt><dd>' + methLine + '</dd></div><div class="kv"><dt>Verification</dt><dd>' + esc(meth ? meth.verify : "Full verification") + (isExpert ? " · " + esc(String(st.verifyPct)) + "% · " + esc(st.blockSize || "") : "") + '</dd></div><div class="kv"><dt>Operator</dt><dd>' + esc(S.operator || "R. Patil") + '</dd></div><div class="kv"><dt>Output</dt><dd>Sanitization certificate</dd></div></dl></div></div>';
  h += '<div class="danger-box" style="margin-top:12px"><b>This action is destructive and cannot be undone.</b> Double-check serial <span class="mono">' + esc(dev ? dev.serial : "") + '</span> before beginning. Verification is mandatory before a certificate is issued.</div>';
  if (needType && !typeOk) h += '<div class="danger-box" style="margin-top:10px">High-risk method: go back to Method and type <b class="mono">ERASE</b> to unlock.</div>';
  h += '<div style="height:10px"></div><label class="check"><input type="checkbox"' + (st.confirm ? " checked" : "") + ' onchange="PRM.eraseConfirm(this.checked)"> <span><b>I confirm that the selected target is correct.</b><br><span class="dim">Serial and capacity verified against physical media.</span></span></label>';
  h += '<div style="display:flex;gap:10px;justify-content:space-between;margin-top:14px"><button class="btn ghost" onclick="PRM.eraseBack()">← ' + t("back") + '</button><button class="btn solid-danger" id="erase-begin-btn"' + canBegin + ' onclick="PRM.eraseBegin()">Begin Erasure</button></div>';
  return h;
}
function eBEraseStep4() {
  var op = eBEraseOp();
  if (!op) return emptyState("◈", "No operation.", "Review and begin erasure to start execution.", "Back to Review", "PRM.eraseGoto(3)");
  var pct = op.progress || 0;
  var phases = ["Initializing", "Locking target", "Executing sanitization", "Verifying", "Finalizing"];
  var idx = 0;
  try {
    if (op.phase) { for (var i = 0; i < phases.length; i++) if ((op.phase || "").indexOf(phases[i].slice(0, 6)) >= 0) idx = i; }
    else idx = Math.min(4, Math.floor((op.tick || 0) / ((op.totalTicks || 40) / 5)));
    if (op.status === "completed") idx = 5;
  } catch (e) {}
  var tl = '<div class="tl">' + phases.map(function (p, k) {
    var cls = k < idx ? "ok" : (k === idx && op.status === "running" ? "info" : "");
    var mark = k < idx ? "✓ " : (k === idx && op.status === "running" ? "● " : "○ ");
    return '<div class="tl-ev ' + cls + '"><div>' + mark + "<b>" + esc(p) + "</b></div></div>";
  }).join("") + "</div>";
  var logs = (op.logs || []).map(function (l) { return "<div>› " + esc(l) + "</div>"; }).join("");
  var paused = !!op.paused;
  var running = op.status === "running" && !paused;
  var btns = "";
  if (op.status === "completed") btns = '<button class="btn primary sm" onclick="PRM.eraseGoto(5)">Continue to Verify →</button>';
  else if (op.status === "cancelled") btns = '<button class="btn sm" onclick="PRM.eraseRetry()">Retry</button><button class="btn ghost sm" onclick="PRM.eraseGoto(3)">Back to Review</button>';
  else if (paused) btns = '<button class="btn primary sm" onclick="PRM.eraseResume()">Resume</button><button class="btn danger sm" onclick="PRM.eraseCancel()">Cancel Operation</button>';
  else btns = '<button class="btn sm" onclick="PRM.erasePause()">Pause</button><button class="btn danger sm" onclick="PRM.eraseCancel()">Cancel Operation</button>';
  return '<div class="grid c2"><div class="panel"><div class="panel-h"><h3>' + esc(op.device || "") + '</h3><span class="right"><span class="badge info">' + esc(op.status || "") + (paused ? " · paused" : "") + '</span></span></div><div class="ring-wrap"><div class="ring">' + ringSVG(pct, 92) + '</div><div style="flex:1;min-width:200px"><div class="mono dim" style="font-size:11.5px">' + esc(op.id || "") + " · " + esc(op.method || "") + '</div><div class="prog" style="margin:8px 0"><i style="width:' + pct + '%"></i></div><div class="muted" style="font-size:12.5px">Elapsed ' + esc(String(op.elapsed || 0)) + 's · ETA ' + esc(op.eta || "—") + ' · ' + esc(op.phase || "Queued") + "</div></div></div>" + '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">' + btns + "</div></div>" + '<div class="panel"><div class="panel-h"><h3>Phase timeline</h3></div>' + tl + "</div></div>" + '<div class="panel" style="margin-top:14px"><div class="panel-h"><h3>Operation Log</h3><span class="sub">expandable details</span></div><div class="log">' + logs + "</div></div>";
}
function eBEraseStep5() {
  var op = eBEraseOp();
  if (!op) return emptyState("◈", "Nothing to verify.", "Execute an erasure first.", "Back", "PRM.eraseGoto(3)");
  if (op.status !== "completed") return '<div class="warn-box">Execution not complete yet — <b>' + esc(op.status || "") + " " + esc(String(op.progress || 0)) + '%</b>. <button class="btn xs" style="margin-left:8px" onclick="PRM.eraseGoto(4)">Open Execution</button></div>';
  var h = op.verifyHash || "";
  var short = "";
  try { short = Svc().shortHash(h); } catch (e) { short = h.slice(0, 8); }
  return '<div class="ok-box"><b>Sanitization completed.</b> Verification Status: <b>PASSED</b> — no recoverable residual detected.</div><div style="height:12px"></div><div class="grid c2"><div class="panel"><div class="panel-h"><h3>Verification summary</h3></div><dl><div class="kv"><dt>Blocks sampled</dt><dd>100% read-back</dd></div><div class="kv"><dt>Errors</dt><dd>0</dd></div><div class="kv"><dt>Readback</dt><dd>All zeros / pattern-verified</dd></div><div class="kv"><dt>Final state</dt><dd>Sanitized · locked for certification</dd></div><div class="kv"><dt>Post-wipe hash</dt><dd class="mono" style="word-break:break-all">' + esc(h) + '</dd></div><div class="kv"><dt>Short</dt><dd class="mono">' + esc(short) + '</dd></div></dl><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" onclick="PRM.eraseCopyHash()">Copy hash</button></div></div><div class="panel"><div class="panel-h"><h3>Residual check</h3><span class="right"><span class="badge ok">PASS</span></span></div><p class="muted" style="font-size:13px">Full-media read-back plus SHA-256 spot-checks passed. Bad-sector remap: 0 pending · 0 growth.</p><div class="log"><div>› Final verify: full-media read-back + SHA-256 spot-checks</div><div class="ok">› Post-wipe hash: ' + esc(h.slice(0, 24)) + '… → residual check PASS</div></div></div></div><div style="display:flex;gap:10px;justify-content:space-between;margin-top:14px"><button class="btn ghost" onclick="PRM.eraseGoto(4)">← Execution</button><button class="btn primary" onclick="PRM.eraseGoto(6)">Continue to Certificate →</button></div>';
}
function eBEraseStep6() {
  var op = eBEraseOp();
  if (!op || op.status !== "completed") return '<div class="warn-box">Certificate unlocks after verified execution. <button class="btn xs" style="margin-left:8px" onclick="PRM.eraseGoto(4)">Open Execution</button></div>';
  var cert = eBCertId(op);
  var dev = eBEraseDevice();
  var meth = eBEraseMethod();
  var h = op.verifyHash || "";
  var a4 = '<div class="a4"><div class="a4sub">PARMAAN · Sanitization Certificate</div><h1>Sanitization Certificate</h1><div class="a4sub">' + esc(cert) + '</div><table><tr><th>Field</th><th>Value</th></tr><tr><td>Certificate ID</td><td class="mono">' + esc(cert) + '</td></tr><tr><td>Operator</td><td>' + esc(op.operator || S.operator || "") + '</td></tr><tr><td>Target</td><td>' + esc(dev ? dev.name : op.device || "") + '</td></tr><tr><td>Device serial</td><td class="mono">' + esc(dev ? dev.serial : "") + '</td></tr><tr><td>Capacity</td><td>' + esc(dev ? dev.capacity : "") + '</td></tr><tr><td>Method</td><td>' + esc(op.method || (meth ? meth.name : "")) + (op.tool ? " · " + esc(op.tool) : "") + '</td></tr><tr><td>Started</td><td class="mono">' + esc(op.created || "") + '</td></tr><tr><td>Completed</td><td class="mono">' + esc(op.completed || op.updated || "") + '</td></tr><tr><td>Verification</td><td>VERIFIED · residual PASS</td></tr><tr><td>Hash</td><td class="mono" style="word-break:break-all">' + esc(h) + '</td></tr></table><div><span class="seal">VERIFIED</span></div><p style="color:#6B6E76;font-size:11px;margin-top:14px">Prototype artifact — simulated execution until forensic engines are connected. Audit reference ' + esc(op.id || "") + '.</p></div>';
  return a4 + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px"><button class="btn primary sm" onclick="PRM.eraseViewCert()">View Certificate</button><button class="btn sm" onclick="PRM.eraseExportPDF()">Export PDF</button><button class="btn sm" onclick="PRM.eraseExportCSV()">Export CSV</button><button class="btn sm" onclick="PRM.eraseAddToCase()">Add to Case</button><button class="btn ghost sm" onclick="PRM.eraseStartAnother()">Start Another Operation</button></div>';
}
function renderErase() {
  var head = '<div class="page-head"><div><div class="eyebrow">Operations · Secure Erasure</div><h1>Secure Erasure</h1><p>Select target, configure method, review, execute, verify and certify. Destructive — confirmation required.</p></div><div class="sp"><span class="badge ' + (S.mode === "expert" ? "acc" : "") + '">' + (S.mode === "expert" ? "Expert Mode" : "Guided") + '</span></div></div>';
  var body = "";
  var step = S.erase.step || 1;
  if (step === 1) body = eBEraseStep1();
  else if (step === 2) body = eBEraseStep2();
  else if (step === 3) body = eBEraseStep3();
  else if (step === 4) body = eBEraseStep4();
  else if (step === 5) body = eBEraseStep5();
  else body = eBEraseStep6();
  return head + eBEraseStepper() + body;
}
function eraseGoto(n) {
  n = Number(n) || 1;
  if (n < 1) n = 1;
  if (n > 6) n = 6;
  var st = S.erase;
  if (n > st.step) {
    if (n >= 2 && !st.deviceId) { toast("warning", "Select a target", "Choose a device first."); return; }
    if (n >= 4 && !st.opId) { toast("warning", "Review first", "Confirm and begin erasure to execute."); return; }
    if (n >= 5) { var o = eBEraseOp(); if (!o || o.status !== "completed") { toast("warning", "Not complete", "Execution must finish before verification."); return; } }
  }
  st.step = n;
  persist();
  render();
}
function eraseTab(tab) { S.erase.tab = tab; persist(); render(); }
function eraseOpenDevice(id) {
  var dev = null;
  try { dev = Svc().deviceService.get(id); } catch (e) {}
  if (!dev) { var ms = eBEraseMocks(); for (var i = 0; i < ms.length; i++) if (ms[i].id === id) dev = ms[i]; }
  if (!dev) { toast("error", "Device unavailable", "The selected media is no longer available."); return; }
  var isExpert = S.mode === "expert";
  var kv = "";
  if (!isExpert) kv = '<dl><div class="kv"><dt>Model</dt><dd>' + esc(dev.model || dev.name) + '</dd></div><div class="kv"><dt>Serial</dt><dd class="mono">' + esc(dev.serial || "—") + '</dd></div><div class="kv"><dt>Capacity</dt><dd>' + esc(dev.capacity || "—") + '</dd></div><div class="kv"><dt>Filesystem</dt><dd>' + esc(dev.filesystem || "—") + '</dd></div><div class="kv"><dt>Status</dt><dd>' + esc(dev.statusLabel || dev.status || "—") + '</dd></div></dl><p class="dim" style="font-size:12px">Guided view — switch to Expert Mode for full technical fields.</p>';
  else kv = '<dl><div class="kv"><dt>Model</dt><dd>' + esc(dev.model || dev.name) + '</dd></div><div class="kv"><dt>Device path</dt><dd class="mono">' + esc(dev.path || "—") + '</dd></div><div class="kv"><dt>Serial</dt><dd class="mono">' + esc(dev.serial || "—") + '</dd></div><div class="kv"><dt>Interface</dt><dd>' + esc(dev.interface || "—") + '</dd></div><div class="kv"><dt>Capacity</dt><dd>' + esc(dev.capacity || "—") + '</dd></div><div class="kv"><dt>Partition</dt><dd>' + esc(dev.partition || "—") + '</dd></div><div class="kv"><dt>Filesystem</dt><dd>' + esc(dev.filesystem || "—") + '</dd></div><div class="kv"><dt>SMART</dt><dd>' + esc(dev.smart || "—") + '</dd></div><div class="kv"><dt>Mounted</dt><dd>' + esc(dev.mounted || "—") + '</dd></div><div class="kv"><dt>Read/write</dt><dd>' + esc(dev.rw || "—") + '</dd></div><div class="kv"><dt>Notes</dt><dd>' + esc(dev.notes || "—") + '</dd></div></dl>';
  openDrawer({ title: dev.name || dev.model, sub: (dev.serial || "") + " · " + (dev.capacity || ""), body: kv, footer: '<button class="btn ghost sm" onclick="PRM.bCloseDrawer()">Close</button><button class="btn primary sm" onclick="PRM.eraseSelectDevice(\'' + esc(dev.id) + '\')">Select Device</button>' });
}
function eraseSelectDevice(id) {
  S.erase.deviceId = id;
  try { closeDrawer(); } catch (e) {}
  persist();
  render();
  var d = eBEraseDevice();
  toast("success", "Device selected", d ? d.name : id);
}
function erasePickMethod(id) { S.erase.methodId = id; persist(); render(); }
function erasePickTool(id) { S.erase.toolId = id; persist(); render(); }
function eraseField(f, v) {
  var st = S.erase;
  if (f === "passes") { v = parseInt(v, 10); if (isNaN(v)) v = 3; if (v < 1) v = 1; if (v > 35) v = 35; st.passes = v; }
  else if (f === "verifyPct") { v = parseInt(v, 10); if (isNaN(v)) v = 100; st.verifyPct = v; }
  else st[f] = v;
  persist();
  render();
}
function eraseToggle(f, on) { S.erase[f] = !!on; persist(); render(); }
function eraseType(v) {
  S.erase.typeConfirm = String(v || "");
  persist();
  render();
  try { var el = document.getElementById("erase-type"); if (el) { el.focus(); var L = el.value.length; try { el.setSelectionRange(L, L); } catch (e2) {} } } catch (e) {}
}
function eraseConfirm(on) { S.erase.confirm = !!on; persist(); render(); }
function eraseNext() {
  var st = S.erase;
  if (st.step === 1 && !st.deviceId) { toast("warning", "Select a target", "Choose a device first."); return; }
  if (st.step === 2 && eBIsHighRisk() && st.typeConfirm !== "ERASE") { toast("warning", "Type ERASE", "High-risk method requires typing ERASE."); return; }
  if (st.step >= 6) return;
  st.step = Math.min(6, (st.step || 1) + 1);
  persist();
  render();
}
function eraseBack() { S.erase.step = Math.max(1, (S.erase.step || 1) - 1); persist(); render(); }
function eraseBegin() {
  if (needRole("erase")) return;
  var st = S.erase;
  if (!st.deviceId) { toast("warning", "Select a target", "Choose a device first."); return; }
  if (!st.confirm) { toast("warning", "Confirmation required", "Tick the confirmation checkbox."); return; }
  if (eBIsHighRisk() && st.typeConfirm !== "ERASE") { toast("warning", "Type ERASE", "High-risk method requires typing ERASE."); return; }
  var dev = eBEraseDevice();
  var meth = eBEraseMethod();
  var tool = eBEraseTool();
  var methodName = (meth ? meth.name : "Secure Erase");
  var toolName = (S.mode === "expert" && tool) ? tool.name : null;
  var op = null;
  try { op = Svc().eraseService.start({ deviceId: (dev && dev.realId) || st.deviceId, methodName: methodName, methodId: st.methodId, tool: toolName, passes: st.passes || 3, caseId: "PRM-2026-0042", operator: S.operator }); } catch (e) { toast("error", "Start failed", String((e && e.message) || e)); return; }
  if (op) { st.opId = op.id; st.step = 4; st.certId = null; persist(); render(); toast("info", "Erasure started", (dev ? dev.name : st.deviceId) + " · " + methodName); }
}
function erasePause() { var op = eBEraseOp(); if (!op) return; try { Svc().eraseService.pause(op.id); } catch (e) {} toast("info", "Operation paused", op.id + " at " + (op.progress || 0) + "%"); persist(); render(); }
function eraseResume() { var op = eBEraseOp(); if (!op) return; try { Svc().eraseService.resume(op.id); } catch (e) {} toast("info", "Resumed", op.id); persist(); render(); }
function eraseCancel() { var op = eBEraseOp(); if (!op) return; openModal({ title: "Cancel operation?", sub: op.id + " · destructive cancel needs confirmation", body: '<div class="warn-box">Cancelling leaves the target <b>untouched pending re-verify</b>. This is audit-logged.</div>', footer: '<button class="btn ghost sm" onclick="PRM.bCloseModal()">Keep running</button><button class="btn solid-danger sm" onclick="PRM.eraseCancelYes()">Cancel operation</button>' }); }
function eraseCancelYes() { var op = eBEraseOp(); if (op) { try { Svc().eraseService.cancel(op.id); } catch (e) {} } try { closeModal(); } catch (e2) {} toast("warning", "Cancelled", op ? op.id + " · target left untouched" : ""); persist(); render(); }
function eraseRetry() { var op = eBEraseOp(); if (!op) return; try { Svc().eraseService.retry(op.id); } catch (e) {} S.erase.step = 4; persist(); render(); toast("info", "Re-queued", op.id); }
function eraseCopyHash() { var op = eBEraseOp(); if (op && op.verifyHash) copyText(op.verifyHash, "Verification hash"); else toast("warning", "No hash yet", "Complete execution first."); }
function eraseExportPDF() {
  var op = eBEraseOp(); if (!op) return;
  var cert = eBCertId(op);
  var dev = eBEraseDevice();
  var lines = ["Certificate " + cert, "Operation " + (op.id || ""), "Target " + (dev ? dev.name : "") + " · " + (dev ? dev.serial : ""), "Method " + (op.method || "") + (op.tool ? " · " + op.tool : ""), "Operator " + (op.operator || S.operator || ""), "Started " + (op.created || "") + " · Completed " + (op.completed || op.updated || ""), "Verification VERIFIED · residual PASS", "Hash " + (op.verifyHash || "")];
  try { Svc().download(cert + ".pdf", Svc().toPDF("Sanitization Certificate - " + cert, lines), "application/pdf"); } catch (e) {}
  toast("success", "Exported", cert + ".pdf");
}
function eraseExportCSV() {
  var op = eBEraseOp(); if (!op) return;
  var cert = eBCertId(op);
  var rows = [["Field", "Value"], ["Certificate", cert], ["Operation", op.id], ["Device", op.device], ["Method", op.method], ["Tool", op.tool || ""], ["Operator", op.operator], ["Started", op.created], ["Completed", op.completed || op.updated || ""], ["Hash", op.verifyHash || ""]];
  (op.logs || []).forEach(function (l) { rows.push(["Log", l]); });
  try { Svc().download(cert + ".csv", Svc().toCSV(rows), "text/csv"); } catch (e) {}
  toast("success", "Exported", cert + ".csv");
}
function eraseViewCert() {
  var op = eBEraseOp(); if (!op) return;
  var cert = eBCertId(op);
  var dev = eBEraseDevice();
  openModal({ title: "Certificate " + cert, sub: (op.id || "") + " · VERIFIED", body: '<dl><div class="kv"><dt>Operator</dt><dd>' + esc(op.operator || "") + '</dd></div><div class="kv"><dt>Target</dt><dd>' + esc(dev ? dev.name : op.device || "") + '</dd></div><div class="kv"><dt>Serial</dt><dd class="mono">' + esc(dev ? dev.serial : "") + '</dd></div><div class="kv"><dt>Method</dt><dd>' + esc(op.method || "") + '</dd></div><div class="kv"><dt>Hash</dt><dd class="mono" style="word-break:break-all">' + esc(op.verifyHash || "") + '</dd></div></dl><div class="ok-box">VERIFIED · residual PASS · audit reference ' + esc(op.id || "") + "</div>", footer: '<button class="btn ghost sm" onclick="PRM.bCloseModal()">Close</button><button class="btn primary sm" onclick="PRM.eraseExportPDF()">Export PDF</button>' });
}
function eraseAddToCase() {
  var cases = [];
  try { cases = Svc().caseService.list(); } catch (e) { cases = Data().CASES || []; }
  var opts = cases.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.id) + " · " + esc(c.name) + "</option>"; }).join("");
  openModal({ title: "Add to case", sub: eBCertId(eBEraseOp()) + " · certificate", body: '<label class="f">Destination case</label><select class="sel" id="erase-case" style="width:100%">' + opts + "</select>", footer: '<button class="btn ghost sm" onclick="PRM.bCloseModal()">Cancel</button><button class="btn primary sm" onclick="PRM.eraseAddToCaseConfirm()">Add</button>' });
}
function eraseAddToCaseConfirm() {
  var el = document.getElementById("erase-case");
  var cid = el ? el.value : "";
  try { closeModal(); } catch (e) {}
  if (!cid) return;
  toast("success", "Added to case", eBCertId(eBEraseOp()) + " → " + cid);
  persist();
  render();
}
function eraseStartAnother() { S.erase.step = 1; S.erase.opId = null; S.erase.certId = null; S.erase.confirm = false; S.erase.typeConfirm = ""; persist(); render(); toast("info", "Ready", "Select a new target."); }
/* ---------------- recovery ---------------- */
function rBScans() {
  return [
    { id: "quick", name: "Quick File Search", desc: "MFT / inode undelete for recently deleted files.", duration: "~2 min", engine: "TSK / TestDisk", tag: null },
    { id: "deep", name: "Deep Recovery", desc: "Signature carving across unallocated space.", duration: "~8 min", engine: "PhotoRec carver", tag: "Recommended" },
    { id: "lost", name: "Lost Partition Search", desc: "Rebuild lost / damaged partition tables.", duration: "~6 min", engine: "TestDisk rebuild", tag: null }
  ];
}
function rBScanById(id) { var l = rBScans(); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return l[1]; }
function rBSourceLabel() {
  var id = S.recover.sourceId;
  if (!id) return null;
  if (id.indexOf("upload:") === 0) return id.slice(7) + " (uploaded image · read-only mock)";
  try { var d = Svc().deviceService.get(id); if (d) return d.name + " · " + d.capacity; } catch (e) {}
  var ms = eBEraseMocks();
  for (var i = 0; i < ms.length; i++) if (ms[i].id === id) return ms[i].name + " · " + ms[i].capacity;
  return id;
}
function rBRecOp() {
  var id = S.recover.opId;
  if (!id) return null;
  try { var o = Svc().recoveryService.get(id); if (o) return o; } catch (e) {}
  try { var all = Svc().eraseService.all(); for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i]; } catch (e2) {}
  return null;
}
function rBAllFiles() { return Data().RECOVERY_FILES || []; }
function rBFiltered() {
  var st = S.recover;
  var q = String(st.search || "").toLowerCase();
  var tree = st.tree || "all";
  var list = rBAllFiles().filter(function (f) {
    if (tree !== "all") {
      var p = String(f.path || "");
      if (tree === "docs" && p.indexOf("/docs") < 0) return false;
      if (tree === "media" && p.indexOf("/media") < 0) return false;
      if (tree === "misc" && p.indexOf("/misc") < 0) return false;
      if (tree === "app" && p.indexOf("/app") < 0) return false;
      if (tree === "images" && p.indexOf("/images") < 0) return false;
    }
    if (st.filter === "deleted" && !f.deleted) return false;
    if (st.filter === "docs" && f.type !== "Document") return false;
    if (st.filter === "images" && f.type !== "Image") return false;
    if (st.filter === "video" && f.type !== "Video") return false;
    if (st.filter === "archives" && f.type !== "Archive") return false;
    if (st.filter === "db" && f.type !== "Database") return false;
    if (st.filter === "high" && f.integrity !== "Excellent") return false;
    if (q) { var hay = (f.name + " " + f.type + " " + f.ext + " " + f.path + " " + (f.tags || []).join(" ")).toLowerCase(); if (hay.indexOf(q) < 0) return false; }
    return true;
  });
  var k = st.sort || "name";
  var d = st.sortDir || 1;
  list.sort(function (a, b) {
    var va, vb;
    if (k === "size") { va = a.bytes || 0; vb = b.bytes || 0; return (va - vb) * d; }
    if (k === "modified") { va = String(a.modified || ""); vb = String(b.modified || ""); return va.localeCompare(vb) * d; }
    va = String(a.name || ""); vb = String(b.name || ""); return va.localeCompare(vb) * d;
  });
  return list;
}
function rBPreviewFile() {
  var list = rBAllFiles();
  for (var i = 0; i < list.length; i++) if (list[i].id === S.recover.previewId) return list[i];
  var f = rBFiltered();
  return f[0] || list[0] || null;
}
function rBStepper() {
  var steps = [["1", "Source", "Media"], ["2", "Scan", "Config"], ["3", "Scanning", "Live"], ["4", "Discover", "Browse"], ["5", "Recover", "Restore"], ["6", "Verify", "Proof"]];
  var cur = S.recover.step || 1;
  var h = '<div class="stepper" role="tablist">';
  for (var i = 0; i < steps.length; i++) {
    var n = i + 1;
    var cls = "step";
    if (n < cur) cls += " done";
    if (n === cur) cls += " on";
    h += '<button class="' + cls + '" onclick="PRM.recGoto(' + n + ')" role="tab"><span class="sn">' + (n < cur ? "✓" : n) + '</span><span><b>' + steps[i][1] + '</b><br><small>' + steps[i][2] + "</small></span></button>";
  }
  return h + "</div>";
}
function rBStep1() {
  var st = S.recover;
  var tab = st.tab || "drive";
  var bar = '<div class="seg" style="margin-bottom:12px"><button class="' + (tab === "drive" ? "on" : "") + '" onclick="PRM.recTab(\'drive\')">Drive</button><button class="' + (tab === "partition" ? "on" : "") + '" onclick="PRM.recTab(\'partition\')">Partition</button><button class="' + (tab === "image" ? "on" : "") + '" onclick="PRM.recTab(\'image\')">Disk Image</button></div>';
  var body = "";
  if (tab === "drive") {
    var devs = Data().DEVICES || [];
    body = '<div class="grid c3">' + devs.map(function (d) {
      var sel = st.sourceId === d.id;
      return '<button class="method-card' + (sel ? " sel" : "") + '" onclick="PRM.recSelectSource(\'' + d.id + '\')"><h4>' + esc(d.name) + '</h4><p>' + esc(d.type || "") + " · " + esc(d.capacity || "") + " · " + esc(d.filesystem || "") + '</p><div class="meta"><span class="mono">' + esc(d.path || "") + '</span></div></button>';
    }).join("") + "</div>";
  } else if (tab === "partition") {
    var parts = eBEraseMocks().slice(0, 4);
    body = '<div class="grid c3">' + parts.map(function (d) {
      var sel2 = st.sourceId === d.id;
      return '<button class="method-card' + (sel2 ? " sel" : "") + '" onclick="PRM.recSelectSource(\'' + d.id + '\')"><h4>' + esc(d.name) + '</h4><p>' + esc(d.filesystem || "") + " · " + esc(d.capacity || "") + '</p><div class="meta"><span class="mono">' + esc(d.path || "") + "</span></div></button>";
    }).join("") + "</div>";
  } else {
    var up = st.uploadName ? '<div class="ok-box" style="margin-bottom:10px">Attached <b>' + esc(st.uploadName) + '</b> · read-only mock · no backend upload.</div>' : "";
    body = up + '<div class="drop" onclick="document.getElementById(\'rec-upload\').click()"><b>Upload forensic image (mock)</b><div class="dim" style="font-size:12.5px;margin-top:4px">Accepts .E01 / .raw / .dd / .img · stays local, no backend.</div><input type="file" id="rec-upload" style="display:none" accept=".E01,.e01,.raw,.dd,.img" onchange="PRM.recUpload(this)"></div><div style="height:10px"></div><div class="grid c3"><button class="method-card' + (st.sourceId === "dev-usb-02" ? " sel" : "") + '" onclick="PRM.recSelectSource(\'dev-usb-02\')"><h4>SanDisk Extreme</h4><p>USB Flash · 128 GB · exFAT</p><div class="meta"><span class="mono">/dev/sdb</span></div></button><button class="method-card' + ((st.sourceId && st.sourceId.indexOf("upload:") === 0) ? " sel" : "") + '" onclick="document.getElementById(\'rec-upload\').click()"><h4>Uploaded image</h4><p>' + esc(st.uploadName || "No file attached yet") + '</p><div class="meta"><span>mock · read-only</span></div></button></div>';
  }
  var lbl = rBSourceLabel();
  var line = lbl ? '<div class="ok-box" style="margin-top:12px">Source <b>' + esc(lbl) + "</b></div>" : '<div class="warn-box" style="margin-top:12px">No source selected.</div>';
  var can = lbl ? "" : " disabled";
  return bar + body + line + '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px"><button class="btn primary"' + can + ' onclick="PRM.recNext()">' + t("cont") + " →</button></div>";
}
function rBStep2() {
  var st = S.recover;
  var isExpert = S.mode === "expert";
  var scans = rBScans();
  var cards = '<div class="method-grid c4">' + scans.map(function (m) {
    var sel = st.scanId === m.id;
    var tag = m.tag ? '<span class="badge acc">' + esc(m.tag) + "</span>" : "";
    return '<button class="method-card' + (sel ? " sel" : "") + '" onclick="PRM.recPickScan(\'' + m.id + '\')"><h4>' + esc(m.name) + " " + tag + "</h4><p>" + esc(m.desc) + '</p><div class="meta"><span>' + esc(m.engine) + "</span><span>·</span><span>" + esc(m.duration) + "</span></div></button>";
  }).join("") + "</div>";
  var expert = "";
  if (isExpert) {
    var fsOpts = ["auto", "NTFS", "exFAT", "EXT4", "HFS+", "APFS"];
    var fsSel = fsOpts.map(function (x) { return '<option' + (st.fs === x ? " selected" : "") + ">" + x + "</option>"; }).join("");
    var carveOpts = ["signature", "header-footer", "file-system"];
    var carveSel = carveOpts.map(function (x) { return '<option value="' + x + '"' + (st.carve === x ? " selected" : "") + ">" + x + "</option>"; }).join("");
    var allocOpts = [["both", "Allocated + Unallocated"], ["allocated", "Allocated only"], ["unallocated", "Unallocated only"]];
    var allocSel = allocOpts.map(function (x) { return '<option value="' + x[0] + '"' + (st.alloc === x[0] ? " selected" : "") + ">" + x[1] + "</option>"; }).join("");
    var sigs = ["JPG", "PDF", "DOCX", "MP4", "XLSX", "SQLite", "TXT", "ZIP"];
    var sigBoxes = sigs.map(function (g) { var on = (st.sigs || []).indexOf(g) >= 0; return '<label class="tagchip" style="cursor:pointer;padding:6px 12px"><input type="checkbox"' + (on ? " checked" : "") + ' onchange="PRM.recToggleSig(\'' + g + '\',this.checked)"> ' + g + "</label>"; }).join(" ");
    expert = '<div class="panel" style="margin-top:14px"><div class="panel-h"><h3>Expert scan parameters</h3><span class="right"><span class="badge acc">Expert Mode</span></span></div><div style="height:12px"></div><div class="grid c2"><div><label class="f">Filesystem</label><select class="sel" style="width:100%" onchange="PRM.recField(\'fs\',this.value)">' + fsSel + '</select></div><div><label class="f">Carving mode</label><select class="sel" style="width:100%" onchange="PRM.recField(\'carve\',this.value)">' + carveSel + '</select></div><div><label class="f">Sector from</label><input class="inp mono" placeholder="e.g. 0" value="' + esc(st.sectorFrom || "") + '" onchange="PRM.recField(\'sectorFrom\',this.value)"></div><div><label class="f">Sector to</label><input class="inp mono" placeholder="e.g. 2000000" value="' + esc(st.sectorTo || "") + '" onchange="PRM.recField(\'sectorTo\',this.value)"></div></div><div style="height:10px"></div><label class="f">Signatures</label><div style="display:flex;gap:8px;flex-wrap:wrap">' + sigBoxes + '</div><div style="height:10px"></div><div class="grid c2"><div><label class="check"><input type="checkbox"' + (st.delParse ? " checked" : "") + ' onchange="PRM.recToggle(\'delParse\',this.checked)"> <span><b>Deleted-entry parsing</b></span></label></div><div><label class="check"><input type="checkbox"' + (st.metaRec ? " checked" : "") + ' onchange="PRM.recToggle(\'metaRec\',this.checked)"> <span><b>Metadata recovery</b></span></label></div><div><label class="f">Allocation</label><select class="sel" style="width:100%" onchange="PRM.recField(\'alloc\',this.value)">' + allocSel + '</select></div><div style="display:flex;align-items:flex-end"><label class="check" style="width:100%"><input type="checkbox"' + (st.recur ? " checked" : "") + ' onchange="PRM.recToggle(\'recur\',this.checked)"> <span><b>Recursive carving</b></span></label></div></div><div class="warn-box" style="margin-top:12px">Tool profiles: TestDisk · PhotoRec · The Sleuth Kit — technical configuration only. Sources stay read-only via write-blocker (simulated).</div></div>';
  } else {
    expert = '<p class="dim" style="font-size:12.5px;margin-top:12px">Basic mode shows recommended scan profiles. Switch to Expert Mode (top bar) for sector boundaries, signature filters, and AVX-512 carving.</p>';
  }
  return cards + expert + '<div style="display:flex;gap:10px;justify-content:space-between;margin-top:14px"><button class="btn ghost" onclick="PRM.recBack()">← ' + t("back") + '</button><button class="btn primary" onclick="PRM.recStartScan()">Start Scan</button></div>';
}
function rBStep3() {
  var op = rBRecOp();
  if (!op) return emptyState("◈", "No scan.", "Configure and start a scan.", "Back to Scan", "PRM.recGoto(2)");
  var pct = op.progress || 0;
  var gb = ((pct / 100) * 1.8).toFixed(2);
  var parts = Math.min(3, 1 + Math.floor(pct / 34));
  var feed = (op.feed || []).map(function (f) { return "<div>› " + esc(f) + "</div>"; }).join("") || '<div class="dim">Waiting for hits…</div>';
  var logs = (op.logs || []).map(function (l) { return "<div>› " + esc(l) + "</div>"; }).join("");
  var paused = !!op.paused;
  var btns = "";
  if (op.status === "completed") btns = '<button class="btn primary sm" onclick="PRM.recGoto(4)">Open Results →</button>';
  else if (op.status === "cancelled") btns = '<button class="btn sm" onclick="PRM.recRetry()">Retry</button><button class="btn ghost sm" onclick="PRM.recGoto(2)">Back</button>';
  else if (paused) btns = '<button class="btn primary sm" onclick="PRM.recResume()">Resume</button><button class="btn danger sm" onclick="PRM.recStop()">Stop Scan</button><button class="btn ghost sm" onclick="PRM.recBackground()">Run in Background</button>';
  else btns = '<button class="btn sm" onclick="PRM.recPause()">Pause</button><button class="btn danger sm" onclick="PRM.recStop()">Stop Scan</button><button class="btn ghost sm" onclick="PRM.recBackground()">Run in Background</button>';
  return '<div class="panel"><div class="panel-h"><h3>Scanning ' + esc(op.device || "") + '</h3><span class="right"><span class="badge info">' + esc(op.status || "") + (paused ? " · paused" : "") + '</span></span></div><div class="ring-wrap"><div class="ring">' + ringSVG(pct, 92) + '</div><div style="flex:1;min-width:220px"><div class="mono dim" style="font-size:11.5px">Scanning sector ' + esc(String(op.sector || 0)) + ' of ' + esc(String(op.sectorsTotal || 2000000)) + '</div><div class="prog" style="margin:8px 0"><i style="width:' + pct + '%"></i></div><div class="grid c3" style="font-size:12.5px"><div><b>' + esc(String(op.filesFound || 0)) + '</b><div class="dim">Files found</div></div><div><b>' + parts + '</b><div class="dim">Partitions</div></div><div><b>' + gb + ' GB</b><div class="dim">Recoverable</div></div></div></div></div><div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">' + btns + '</div></div><div class="grid c2" style="margin-top:14px"><div class="panel"><div class="panel-h"><h3>Live discovery feed</h3></div><div class="log" style="max-height:160px">' + feed + '</div></div><div class="panel"><div class="panel-h"><h3>Scan log</h3></div><div class="log" style="max-height:160px">' + logs + "</div></div></div>";
}
function rBTableHTML() {
  var list = rBFiltered();
  var st = S.recover;
  if (!list.length) return emptyState("◈", "No matches.", "Run a scan, then adjust search / filters.", "", "");
  var head = '<div class="tbl-wrap" id="rec-table-wrap"><table class="tbl"><thead><tr><th><input type="checkbox" onclick="PRM.recSelectAll()" title="Select all"></th><th>Name</th><th>Type</th><th>Path</th><th>Size</th><th>Deleted</th><th>Integrity</th><th>Modified</th><th>Tags</th></tr></thead><tbody>' + list.map(function (f) {
    var on = (st.selected || []).indexOf(f.id) >= 0;
    var prev = st.previewId === f.id;
    return '<tr class="' + (on ? "sel" : "") + '" onclick="PRM.recPreview(\'' + f.id + '\')"><td onclick="event.stopPropagation()"><input type="checkbox"' + (on ? " checked" : "") + ' onchange="PRM.recToggleSelect(\'' + f.id + '\',this.checked)"></td><td><b>' + esc(f.name) + '</b>' + (prev ? ' <span class="badge acc">preview</span>' : "") + '</td><td>' + esc(f.type) + '</td><td class="mono" style="font-size:11px">' + esc(f.path) + '</td><td style="white-space:nowrap">' + esc(f.size) + '</td><td>' + (f.deleted ? '<span class="badge warn">deleted</span>' : '<span class="badge">live</span>') + '</td><td>' + esc(f.integrity) + '</td><td class="muted" style="font-size:11.5px">' + esc(f.modified) + '</td><td>' + (f.tags || []).map(function (g) { return '<span class="tagchip">' + esc(g) + "</span>"; }).join(" ") + "</td></tr>";
  }).join("") + "</tbody></table></div>";
  return head;
}
function rBInspectorHTML() {
  var f = rBPreviewFile();
  if (!f) return emptyState("◈", "Nothing to preview.", "Select a file.", "", "");
  var tab = S.recover.insTab || "preview";
  var tabs = [["preview", "Preview"], ["metadata", "Metadata"], ["hex", "Hex"], ["hash", "Hash"], ["notes", "Notes"]];
  var bar = '<div class="ins-tabs">' + tabs.map(function (x) { return '<button class="' + (tab === x[0] ? "on" : "") + '" onclick="PRM.recInsTab(\'' + x[0] + '\')">' + x[1] + "</button>"; }).join("") + "</div>";
  var b = "";
  if (tab === "preview") {
    var label = "Mock preview";
    if (f.previewKind === "image") label = "Image placeholder — thumbnail renders after acquisition";
    else if (f.previewKind === "video") label = "Video placeholder — first frame + duration";
    else if (f.previewKind === "text") label = "Text sample: deleted note recovered from unallocated space…";
    else if (f.previewKind === "doc") label = "Document placeholder — first pages render here";
    else if (f.previewKind === "db") label = "Database placeholder — tables + rows preview";
    else if (f.previewKind === "archive") label = "Archive placeholder — member list preview";
    b = '<div class="preview-ph">' + esc(label) + '<br><span class="dim mono" style="font-size:11px">' + esc(f.name) + " · " + esc(f.size) + "</span></div>";
  } else if (tab === "metadata") {
    b = '<dl><div class="kv"><dt>Name</dt><dd>' + esc(f.name) + '</dd></div><div class="kv"><dt>Path</dt><dd class="mono">' + esc(f.path) + '</dd></div><div class="kv"><dt>Size</dt><dd>' + esc(f.size) + '</dd></div><div class="kv"><dt>Type</dt><dd>' + esc(f.type) + " · " + esc(f.ext) + '</dd></div><div class="kv"><dt>Modified</dt><dd class="mono">' + esc(f.modified) + '</dd></div><div class="kv"><dt>Deleted</dt><dd>' + (f.deleted ? "Yes" : "No") + '</dd></div><div class="kv"><dt>Integrity</dt><dd>' + esc(f.integrity) + "</dd></div></dl>";
  } else if (tab === "hex") {
    var hex = Data().HEX_SAMPLE || [];
    b = '<div class="hex">' + hex.map(function (r) { return "<div><span class=\"off\">" + esc(r[0]) + "</span> &nbsp;" + esc(r[1]) + ' &nbsp;<span style="color:#6E737C">' + esc(r[2]) + "</span></div>"; }).join("") + "</div>";
  } else if (tab === "hash") {
    b = '<dl><div class="kv"><dt>SHA-256</dt><dd class="mono" style="word-break:break-all">' + esc(f.hash) + '</dd></div></dl><button class="btn sm" onclick="PRM.recCopyHash()">Copy hash</button>';
  } else {
    var notes = "";
    try { notes = (lsGet("recNotes", {}) || {})[f.id] || ""; } catch (e) {}
    var tagOpts = ["Relevant", "Reviewed", "Priority", "Potential Evidence", "Exclude"];
    var curTag = (f.tags && f.tags[0]) || "";
    var opts = '<option value="">Select tag…</option>' + tagOpts.map(function (g) { return '<option' + (curTag === g ? " selected" : "") + ">" + g + "</option>"; }).join("");
    b = '<label class="f">Tag</label><select class="sel" style="width:100%" onchange="PRM.recTag(this.value)">' + opts + '</select><div style="height:10px"></div><label class="f">Note</label><textarea class="inp" id="rec-note" rows="3" placeholder="Observation…">' + esc(notes) + '</textarea><div style="margin-top:10px"><button class="btn sm primary" onclick="PRM.recSaveNote()">Save note</button></div>';
  }
  return bar + '<div class="ins-body">' + b + "</div>";
}
function rBStep4() {
  var op = rBRecOp();
  if (!op || op.status !== "completed") {
    if (op && op.status === "cancelled") return '<div class="warn-box">Scan stopped — partial results kept. <button class="btn xs" style="margin-left:8px" onclick="PRM.recRetry()">Retry</button> <button class="btn xs ghost" onclick="PRM.recGoto(2)">Back to Scan</button></div>' + rBStep4Browser();
    return '<div class="warn-box">Scan not complete yet. <button class="btn xs" style="margin-left:8px" onclick="PRM.recGoto(3)">Open Scanning</button></div>';
  }
  return rBStep4Browser();
}
function rBStep4Browser() {
  var st = S.recover;
  var chips = [["all", "All"], ["deleted", "Deleted"], ["docs", "Documents"], ["images", "Images"], ["video", "Video"], ["archives", "Archives"], ["db", "Databases"], ["high", "High confidence"]];
  var chipBar = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">' + chips.map(function (c) { return '<button class="btn xs' + (st.filter === c[0] ? " primary" : "") + '" onclick="PRM.recFilter(\'' + c[0] + '\')">' + c[1] + "</button>"; }).join("") + "</div>";
  var sortSel = '<select class="sel" onchange="PRM.recSort(this.value)"><option value="name"' + (st.sort === "name" ? " selected" : "") + '>Sort: Name</option><option value="size"' + (st.sort === "size" ? " selected" : "") + '>Sort: Size</option><option value="modified"' + (st.sort === "modified" ? " selected" : "") + '>Sort: Modified</option></select><button class="btn xs" onclick="PRM.recSortDir()" title="Toggle direction">' + (st.sortDir === 1 ? "↑" : "↓") + "</button>";
  var selCount = (st.selected || []).length;
  var bulk = '<div class="toolbar"><span class="muted" style="font-size:12.5px">' + selCount + ' selected</span><button class="btn xs" onclick="PRM.recClearSel()">Clear</button><span style="flex:1"></span><button class="btn xs primary" onclick="PRM.recOpenRecover()">Recover Selected</button><button class="btn xs" onclick="PRM.recAddVault()">Add to Vault</button></div>';
  var tree = '<div class="btree"><button class="' + ((st.tree || "all") === "all" ? "on" : "") + '" onclick="PRM.recTree(\'all\')">▦ All locations</button><button class="' + (st.tree === "docs" ? "on" : "") + '" onclick="PRM.recTree(\'docs\')">▤ /recovered/docs</button><button class="' + (st.tree === "media" ? "on" : "") + '" onclick="PRM.recTree(\'media\')">◧ /recovered/media</button><button class="' + (st.tree === "misc" ? "on" : "") + '" onclick="PRM.recTree(\'misc\')">▦ /recovered/misc</button><button class="' + (st.tree === "app" ? "on" : "") + '" onclick="PRM.recTree(\'app\')">⬢ /recovered/app</button><button class="' + (st.tree === "images" ? "on" : "") + '" onclick="PRM.recTree(\'images\')">⬢ /recovered/images</button></div>';
  var center = '<div class="bmain"><div style="padding:12px;border-bottom:1px solid var(--line)"><div class="toolbar"><input class="inp" id="rec-search" placeholder="Search name, type, path, tag…" value="' + esc(st.search || "") + '" oninput="PRM.recSearch(this.value)">' + sortSel + '</div>' + chipBar + bulk + "</div>" + '<div style="padding:12px">' + rBTableHTML() + "</div></div>";
  var right = '<div class="bins">' + rBInspectorHTML() + "</div>";
  return '<div class="browser">' + tree + center + right + "</div>" + '<div style="display:flex;gap:10px;justify-content:space-between;margin-top:14px"><button class="btn ghost" onclick="PRM.recBack()">← Back</button><button class="btn primary" onclick="PRM.recOpenRecover()">Recover (' + selCount + ") →</button></div>";
}
function rBStep5() {
  var st = S.recover;
  var sel = st.selected || [];
  if (!st.recOpId) return '<div class="warn-box">No restore started. Select files in Discover, then Recover. <button class="btn xs" style="margin-left:8px" onclick="PRM.recGoto(4)">Open Discover</button></div>';
  if (!st.recDone) {
    var p = st.recProgress || 2;
    return '<div class="panel"><div class="panel-h"><h3>Restoring ' + sel.length + ' files…</h3><span class="right mono dim">' + p + '%</span></div><div class="prog"><i id="rec-restore-bar" style="width:' + p + '%"></i></div><p class="dim" style="font-size:12.5px">Preserving structure · calculating hashes · simulated restore.</p></div>';
  }
  var totalMB = 0;
  var all = rBAllFiles();
  sel.forEach(function (id) { for (var i = 0; i < all.length; i++) if (all[i].id === id) totalMB += (all[i].bytes || 0); });
  var mb = (totalMB / 1048576).toFixed(1);
  return '<div class="ok-box"><b>' + sel.length + " of " + sel.length + " files recovered</b> · " + mb + " MB · " + sel.length + " hashes verified.</div>" + '<div style="height:12px"></div><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn sm" onclick="PRM.recOpenResults()">Open Results</button><button class="btn sm primary" onclick="PRM.recAddVault()">Add to Evidence Vault</button><button class="btn sm" onclick="PRM.recReport()">Generate Recovery Report</button><button class="btn ghost sm" onclick="PRM.recGoto(6)">Continue to Verify →</button></div>';
}
function rBStep6() {
  var st = S.recover;
  var sel = st.selected || [];
  if (!sel.length) return '<div class="warn-box">Nothing to verify. Select files in Discover first. <button class="btn xs" style="margin-left:8px" onclick="PRM.recGoto(4)">Open Discover</button></div>';
  var first = null;
  var all = rBAllFiles();
  for (var i = 0; i < all.length; i++) if (all[i].id === sel[0]) first = all[i];
  var ref = first ? first.hash : "";
  var calc = ref;
  try { calc = Svc().stableHash("recover:" + sel.join(",") + ":" + (first ? first.name : ""), 64); } catch (e) {}
  var match = true;
  try { if (first) calc = first.hash; } catch (e2) {}
  return '<div class="verdict match"><div class="big">MATCH</div><div class="mono" style="font-size:11.5px;margin-top:8px;word-break:break-all">expected&nbsp;&nbsp;: ' + esc(ref) + "<br>calculated: " + esc(calc) + '</div><div style="font-size:12.5px;margin-top:8px">' + sel.length + ' files · hashes captured at carve time · chain-of-custody opened.</div><div style="display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap"><button class="btn xs" onclick="PRM.recCopyHash()">Copy Hash</button><button class="btn xs primary" onclick="PRM.recAddVault()">Add to Vault</button><button class="btn xs" onclick="PRM.recReport()">Generate Report</button></div></div><div style="display:flex;gap:10px;justify-content:space-between;margin-top:14px"><button class="btn ghost" onclick="PRM.recGoto(4)">← Discover</button><button class="btn ghost" onclick="PRM.recStartAnother()">Start Another Scan</button></div>';
}
function renderRecover() {
  var head = '<div class="page-head"><div><div class="eyebrow">Operations · Forensic Recovery</div><h1>Forensic Recovery</h1><p>Choose a read-only source, configure scan, browse hits, restore and verify. Hashes captured automatically.</p></div><div class="sp"><span class="badge ' + (S.mode === "expert" ? "acc" : "") + '">' + (S.mode === "expert" ? "Expert Mode" : "Guided") + "</span></div></div>";
  var step = S.recover.step || 1;
  var body = "";
  if (step === 1) body = rBStep1();
  else if (step === 2) body = rBStep2();
  else if (step === 3) body = rBStep3();
  else if (step === 4) body = rBStep4();
  else if (step === 5) body = rBStep5();
  else body = rBStep6();
  return head + rBStepper() + body;
}
function recGoto(n) {
  n = Number(n) || 1;
  if (n < 1) n = 1;
  if (n > 6) n = 6;
  var st = S.recover;
  if (n > st.step) {
    if (n >= 2 && !st.sourceId) { toast("warning", "Select a source", "Pick a drive, partition or image."); return; }
    if (n >= 3 && !st.opId) { toast("warning", "Start a scan", "Configure and start scanning."); return; }
    if (n >= 4) { var o = rBRecOp(); if (!o || (o.status !== "completed" && o.status !== "cancelled")) { toast("warning", "Scan running", "Wait for completion or stop the scan."); return; } }
    if (n >= 5 && !(st.selected || []).length) { toast("warning", "Select files", "Tick at least one file in Discover."); return; }
  }
  st.step = n;
  persist();
  render();
}
function recTab(tab) { S.recover.tab = tab; persist(); render(); }
function recSelectSource(id) { S.recover.sourceId = id; persist(); render(); toast("success", "Source selected", rBSourceLabel() || id); }
function recUpload(el) {
  var f = null;
  try { f = el.files[0]; } catch (e) {}
  if (!f) return;
  var name = f.name || "image.E01";
  var ext = name.split(".").pop().toLowerCase();
  if (["e01", "raw", "dd", "img"].indexOf(ext) < 0) { toast("warning", "Unsupported format", "Use .E01 / .raw / .dd / .img (mock)."); try { el.value = ""; } catch (e2) {} return; }
  S.recover.uploadName = name;
  S.recover.sourceId = "upload:" + name;
  persist();
  render();
  toast("success", "Image attached", name + " · read-only mock");
}
function recPickScan(id) { S.recover.scanId = id; persist(); render(); }
function recField(f, v) { S.recover[f] = v; persist(); render(); }
function recToggle(f, on) { S.recover[f] = !!on; persist(); render(); }
function recToggleSig(sig, on) {
  var arr = S.recover.sigs || [];
  if (on) { if (arr.indexOf(sig) < 0) arr.push(sig); }
  else arr = arr.filter(function (x) { return x !== sig; });
  S.recover.sigs = arr;
  persist();
  render();
}
function recSearch(v) {
  S.recover.search = String(v || "");
  persist();
  render();
  try { var el = document.getElementById("rec-search"); if (el) { el.focus(); var L = el.value.length; try { el.setSelectionRange(L, L); } catch (e2) {} } } catch (e) {}
}
function recFilter(f) { S.recover.filter = f; persist(); render(); }
function recSort(v) { S.recover.sort = v; persist(); render(); }
function recSortDir() { S.recover.sortDir = (S.recover.sortDir === 1 ? -1 : 1); persist(); render(); }
function recTree(v) { S.recover.tree = v; persist(); render(); }
function recToggleSelect(id, on) {
  var arr = S.recover.selected || [];
  if (on) { if (arr.indexOf(id) < 0) arr.push(id); if (!S.recover.previewId) S.recover.previewId = id; }
  else arr = arr.filter(function (x) { return x !== id; });
  S.recover.selected = arr;
  persist();
  render();
}
function recSelectAll() {
  var list = rBFiltered();
  S.recover.selected = list.map(function (f) { return f.id; });
  if (!S.recover.previewId && list[0]) S.recover.previewId = list[0].id;
  persist();
  render();
  toast("info", "Selected", S.recover.selected.length + " files");
}
function recClearSel() { S.recover.selected = []; persist(); render(); }
function recPreview(id) { S.recover.previewId = id; var arr = S.recover.selected || []; if (arr.indexOf(id) < 0) { arr.push(id); S.recover.selected = arr; } persist(); render(); }
function recInsTab(tab) { S.recover.insTab = tab; persist(); render(); }
function recTag(val) {
  var f = rBPreviewFile();
  if (!f || !val) return;
  if (val === "Exclude") f.tags = [];
  else f.tags = [val];
  toast("success", "Tagged", f.name + " → " + val);
  persist();
  render();
}
function recSaveNote() {
  var f = rBPreviewFile();
  if (!f) return;
  var el = document.getElementById("rec-note");
  var v = el ? el.value : "";
  try { var m = lsGet("recNotes", {}) || {}; m[f.id] = v; lsSet("recNotes", m); } catch (e) {}
  toast("success", "Note saved", f.name);
  persist();
  render();
}
function recCopyHash() { var f = rBPreviewFile(); if (f) copyText(f.hash, "Recovery hash"); }
function recNext() {
  var st = S.recover;
  if (st.step === 1 && !st.sourceId) { toast("warning", "Select a source", "Pick a drive, partition or image."); return; }
  if (st.step === 4 && !(st.selected || []).length) { toast("warning", "Select files", "Tick at least one file to recover."); return; }
  if (st.step >= 6) return;
  st.step = Math.min(6, (st.step || 1) + 1);
  persist();
  render();
}
function recBack() { S.recover.step = Math.max(1, (S.recover.step || 1) - 1); persist(); render(); }
function recStartScan() {
  var st = S.recover;
  if (!st.sourceId) { toast("warning", "Select a source", "Pick a drive, partition or image."); return; }
  var scan = rBScanById(st.scanId);
  var label = rBSourceLabel();
  var op = null;
  try { op = Svc().recoveryService.start({ deviceId: st.sourceId.indexOf("upload:") === 0 ? "dev-usb-02" : st.sourceId, sourceLabel: label, scanName: scan.name, scanId: scan.id, caseId: "PRM-2026-0041", operator: S.operator }); } catch (e) { toast("error", "Scan failed", String((e && e.message) || e)); return; }
  if (op) { st.opId = op.id; st.step = 3; st.selected = []; st.previewId = null; st.recOpId = null; st.recProgress = 0; st.recDone = false; persist(); render(); toast("info", "Scan started", scan.name + " · " + (label || "")); }
}
function recPause() { var op = rBRecOp(); if (!op) return; try { Svc().recoveryService.pause(op.id); } catch (e) {} toast("info", "Scan paused", op.id); persist(); render(); }
function recResume() { var op = rBRecOp(); if (!op) return; try { Svc().recoveryService.resume(op.id); } catch (e) {} toast("info", "Resumed", op.id); persist(); render(); }
function recStop() { var op = rBRecOp(); if (!op) return; openModal({ title: "Stop scan?", sub: op.id + " · partial results are kept", body: '<div class="warn-box">Discovered files stay browsable. This is audit-logged.</div>', footer: '<button class="btn ghost sm" onclick="PRM.bCloseModal()">Keep scanning</button><button class="btn solid-danger sm" onclick="PRM.recStopYes()">Stop scan</button>' }); }
function recStopYes() { var op = rBRecOp(); if (op) { try { Svc().recoveryService.cancel(op.id); } catch (e) {} } try { closeModal(); } catch (e2) {} toast("warning", "Scan stopped", "Partial results kept."); persist(); render(); }
function recBackground() { toast("info", "Running in background", "Scan continues · track in Activity."); try { nav("/workspace"); } catch (e) {} }
function recRetry() { var op = rBRecOp(); if (!op) return; try { Svc().recoveryService.retry(op.id); } catch (e) {} S.recover.step = 3; persist(); render(); }
function recOpenRecover() {
  var sel = S.recover.selected || [];
  if (!sel.length) { toast("warning", "Select files", "Tick at least one file in Discover."); return; }
  var total = 0;
  var all = rBAllFiles();
  sel.forEach(function (id) { for (var i = 0; i < all.length; i++) if (all[i].id === id) total += (all[i].bytes || 0); });
  var mb = (total / 1048576).toFixed(1);
  openModal({ title: "Recover Selected Files", sub: sel.length + " files · " + mb + " MB", body: '<label class="f">Destination (mock)</label><select class="sel" id="rec-dest" style="width:100%"><option>/evidence/restored/</option><option>/mnt/clean-room/</option><option>Case vault (recommended)</option></select><div style="height:10px"></div><label class="check"><input type="checkbox" id="rec-opt-struct" checked> <span><b>Preserve directory structure</b></span></label><label class="check"><input type="checkbox" id="rec-opt-hash" checked> <span><b>Calculate hashes after recovery</b></span></label><label class="check"><input type="checkbox" id="rec-opt-case" checked> <span><b>Add recovered files to active case</b></span></label>', footer: '<button class="btn ghost sm" onclick="PRM.bCloseModal()">' + t("cancel") + '</button><button class="btn primary sm" onclick="PRM.recConfirmRecover()">Begin Recovery</button>' });
}
function recConfirmRecover() {
  try { closeModal(); } catch (e) {}
  if (!(S.recover.selected || []).length) { var f = rBFiltered(); S.recover.selected = f.slice(0, 3).map(function (x) { return x.id; }); }
  S.recover.recOpId = "RC-" + String(Date.now() % 100000);
  S.recover.recProgress = 4;
  S.recover.recDone = false;
  S.recover.step = 5;
  persist();
  render();
  toast("info", "Recovery started", "Restoring selected files…");
  var iv = setInterval(function () {
    try {
      if (S.recover.recDone) { clearInterval(iv); return; }
      S.recover.recProgress = Math.min(100, (S.recover.recProgress || 0) + 11);
      if (S.recover.recProgress >= 100) {
        S.recover.recDone = true;
        clearInterval(iv);
        persist();
        render();
        toast("success", "Recovery complete", (S.recover.selected || []).length + " files restored.");
      } else {
        var bar = document.getElementById("rec-restore-bar");
        if (bar) bar.style.width = S.recover.recProgress + "%";
        if (S.recover.recProgress % 33 === 0) { render(); }
      }
    } catch (e2) { try { clearInterval(iv); } catch (e3) {} }
  }, 320);
}
function recAddVault() {
  var sel = S.recover.selected || [];
  if (!sel.length) { toast("warning", "Nothing selected", "Tick files in Discover first."); return; }
  var all = rBAllFiles();
  var n = 0;
  sel.forEach(function (id) {
    for (var i = 0; i < all.length; i++) if (all[i].id === id) {
      var f = all[i];
      try { Svc().evidenceService.add({ id: Svc().uid("PRM-EVD"), name: f.name, caseId: "PRM-2026-0041", type: f.type, size: f.size, hash: f.hash, shortHash: Svc().shortHash(f.hash), integrity: "Pending", tags: f.tags || [], custodian: S.operator || "R. Patil", added: Svc().nowStamp().slice(0, 16), operator: S.operator || "R. Patil", notes: "Recovered via " + (rBRecOp() ? rBRecOp().id : "scan") }); n++; } catch (e) {}
    }
  });
  toast("success", "Added to Vault", n + " items · PRM-2026-0041");
  persist();
  render();
}
function recReport() {
  var sel = S.recover.selected || [];
  if (!sel.length) { toast("warning", "Nothing selected", "Tick files first."); return; }
  var op = rBRecOp();
  var all = rBAllFiles();
  var rows = [["File", "Type", "Size", "Hash"]];
  sel.forEach(function (id) { for (var i = 0; i < all.length; i++) if (all[i].id === id) rows.push([all[i].name, all[i].type, all[i].size, all[i].hash]); });
  var repId = "PRM-RPT-" + String(100 + sel.length) + "-" + String(Date.now() % 1000);
  try { Svc().reportService.generate({ id: repId, type: "Recovery Report", caseId: "PRM-2026-0041", generated: Svc().nowStamp().slice(0, 16), operator: S.operator || "R. Patil", status: "Completed", target: (op ? op.device : rBSourceLabel()) || "", method: rBScanById(S.recover.scanId).name, hash: Svc().stableHash(repId, 64) }); } catch (e) {}
  try { Svc().download(repId + ".csv", Svc().toCSV(rows), "text/csv"); } catch (e2) {}
  toast("success", "Report generated", repId + " · recovery inventory");
  persist();
  render();
}
function recExportPDF() { recReport(); }
function recExportCSV() { recReport(); }
function recOpenResults() { S.recover.step = 4; persist(); render(); }
function recStartAnother() { S.recover.step = 1; S.recover.opId = null; S.recover.selected = []; S.recover.previewId = null; S.recover.recOpId = null; S.recover.recProgress = 0; S.recover.recDone = false; persist(); render(); }
function bCloseModal() { try { closeModal(); } catch (e) {} }
function bCloseDrawer() { try { closeDrawer(); } catch (e) {} }
function bNav(p) { try { nav(p); } catch (e) {} }
function eBAutoAdvance() {
  try {
    var svc = Svc();
    if (!svc) return;
    var eop = null;
    try { eop = svc.eraseService.get(S.erase.opId); } catch (e) {}
    if (eop && eop.status === "completed" && S.erase.step === 4) {
      S.erase.step = 5;
      if (!S.erase.certId) {
        var prefix = "PRM-SAN-2026-";
        try { if (S.settings && S.settings.certPrefix) prefix = S.settings.certPrefix; } catch (e2) {}
        var digits = String(eop.id || "").replace(/\D/g, "").slice(-5);
        if (!digits) digits = "00184";
        while (digits.length < 5) digits = "0" + digits;
        S.erase.certId = prefix + digits;
      }
      persist();
      toast("success", "Erasure verified", "Residual check PASS — certificate ready.");
      try { render(); } catch (e3) {}
      return;
    }
    var rop = null;
    try { rop = svc.recoveryService.get(S.recover.opId); } catch (e4) {}
    if (rop && rop.status === "completed" && S.recover.step === 3) {
      S.recover.step = 4;
      if (!S.recover.previewId) S.recover.previewId = "rec-01";
      persist();
      toast("success", "Recovery scan completed", (rop.filesFound || 12) + " files ready.");
      try { render(); } catch (e5) {}
      return;
    }
    if (((eop && eop.status === "running") || (rop && rop.status === "running")) && (S.route === "erase" || S.route === "recover")) {
      try { render(); } catch (e6) {}
    }
  } catch (e7) {}
}
try { if (Svc() && Svc().subscribe) Svc().subscribe(eBAutoAdvance); else if (Svc() && Svc().eraseService && Svc().eraseService.onChange) Svc().eraseService.onChange(eBAutoAdvance); } catch (e) {}
Object.assign(window.PRM, { renderErase: renderErase, renderRecover: renderRecover, eraseGoto: eraseGoto, eraseTab: eraseTab, eraseOpenDevice: eraseOpenDevice, eraseSelectDevice: eraseSelectDevice, erasePickMethod: erasePickMethod, erasePickTool: erasePickTool, eraseField: eraseField, eraseToggle: eraseToggle, eraseType: eraseType, eraseConfirm: eraseConfirm, eraseNext: eraseNext, eraseBack: eraseBack, eraseBegin: eraseBegin, erasePause: erasePause, eraseResume: eraseResume, eraseCancel: eraseCancel, eraseCancelYes: eraseCancelYes, eraseRetry: eraseRetry, eraseCopyHash: eraseCopyHash, eraseExportPDF: eraseExportPDF, eraseExportCSV: eraseExportCSV, eraseViewCert: eraseViewCert, eraseAddToCase: eraseAddToCase, eraseAddToCaseConfirm: eraseAddToCaseConfirm, eraseStartAnother: eraseStartAnother, recGoto: recGoto, recTab: recTab, recSelectSource: recSelectSource, recUpload: recUpload, recPickScan: recPickScan, recField: recField, recToggle: recToggle, recToggleSig: recToggleSig, recSearch: recSearch, recFilter: recFilter, recSort: recSort, recSortDir: recSortDir, recTree: recTree, recToggleSelect: recToggleSelect, recSelectAll: recSelectAll, recClearSel: recClearSel, recPreview: recPreview, recInsTab: recInsTab, recTag: recTag, recSaveNote: recSaveNote, recCopyHash: recCopyHash, recNext: recNext, recBack: recBack, recStartScan: recStartScan, recPause: recPause, recResume: recResume, recStop: recStop, recStopYes: recStopYes, recBackground: recBackground, recRetry: recRetry, recOpenRecover: recOpenRecover, recConfirmRecover: recConfirmRecover, recAddVault: recAddVault, recReport: recReport, recExportPDF: recExportPDF, recExportCSV: recExportCSV, recOpenResults: recOpenResults, recStartAnother: recStartAnother, bCloseModal: bCloseModal, bCloseDrawer: bCloseDrawer, bNav: bNav });
/*CHUNK_B_OK*/
/* ===== chunk_c.js ===== */
/* PARMAAN chunk_c — evidence / cases / custody / verify (inside existing IIFE) */
function cCEsc2(v){ return esc(v); }
function cCAllEv(){ try{ return Svc().evidenceService.list(); }catch(e){ return (Data().EVIDENCE||[]).slice(); } }
function cCAllCases(){ try{ return Svc().caseService.list(); }catch(e){ return (Data().CASES||[]).slice(); } }
function cCAllCustody(){ return (Data().CUSTODY||[]).slice(); }
function cCAllReports(){ try{ return Svc().reportService.list(); }catch(e){ return (Data().REPORTS||[]).slice(); } }
function cCAllOps(){ try{ return Svc().eraseService.all(); }catch(e){ return []; } }
function cCAuditPush(action,target,caseId,detail,hash){
  try{
    var a = lsGet("audit", null) || Data().AUDIT_SEED.slice();
    var seq = lsGet("seq", 100);
    var id = "AUD-" + seq;
    try{ Svc().lsSet("seq", seq+1); }catch(e){ lsSet("seq", seq+1); }
    a.unshift({ id: id, ts: Svc().nowStamp(), actor: S.operator || "R. Patil", role: "Investigator", action: action, target: target, caseId: caseId||"—", device: "—", severity: "info", status: "success", hash: hash||"—", detail: detail||"" });
    lsSet("audit", a.slice(0,120));
  }catch(e){}
}
function cCEvBadge(integ){
  if(integ==="Verified") return '<span class="badge ok"><span class="st-dot ok"></span>Verified</span>';
  if(integ==="Pending") return '<span class="badge warn"><span class="st-dot warn"></span>Pending</span>';
  if(integ==="Changed") return '<span class="badge bad"><span class="st-dot bad"></span>Changed</span>';
  return '<span class="badge">'+esc(integ||"—")+'</span>';
}
function cCCaseBadge(st){
  if(st==="Open") return '<span class="badge acc">'+esc(st)+'</span>';
  if(st==="Review") return '<span class="badge warn">'+esc(st)+'</span>';
  if(st==="Closed") return '<span class="badge ok">'+esc(st)+'</span>';
  return '<span class="badge">'+esc(st||"—")+'</span>';
}
function cCEvFiltered(){
  var list = cCAllEv();
  var f = S.evidence;
  var q = String(f.search||"").toLowerCase();
  var out = list.filter(function(e){
    if(f.fCase!=="all" && e.caseId!==f.fCase) return false;
    if(f.fType!=="all" && e.type!==f.fType) return false;
    if(f.fInteg!=="all" && e.integrity!==f.fInteg) return false;
    if(f.fTag!=="all" && (e.tags||[]).indexOf(f.fTag)<0) return false;
    if(q){
      var hay = (e.id+" "+e.name+" "+e.hash+" "+e.custodian+" "+e.caseId+" "+(e.tags||[]).join(" ")).toLowerCase();
      if(hay.indexOf(q)<0) return false;
    }
    return true;
  });
  var k = f.sort||"added", d = f.sortDir||-1;
  out.sort(function(a,b){
    var va = a[k]==null?"":a[k], vb = b[k]==null?"":b[k];
    if(k==="added"){ va=String(a.added||""); vb=String(b.added||""); }
    var c = String(va).localeCompare(String(vb));
    return c*d;
  });
  return out;
}
function cCNextCaseId(){
  var list = cCAllCases();
  var max = 42;
  list.forEach(function(c){
    var m = String(c.id||"").match(/(\d+)\s*$/);
    if(m) max = Math.max(max, parseInt(m[1],10));
  });
  var n = max+1;
  return "PRM-2026-" + String(n).padStart(4,"0");
}
function cCEvById(id){ var l=cCAllEv(); for(var i=0;i<l.length;i++) if(l[i].id===id) return l[i]; return null; }
function cCCaseById(id){ try{ return Svc().caseService.get(id); }catch(e){ var l=cCAllCases(); for(var i=0;i<l.length;i++) if(l[i].id===id) return l[i]; return null; } }
function cCCusForEv(evId){ return cCAllCustody().filter(function(c){ return c.evidenceId===evId; }); }
function cCCusForCase(caseId){
  var evIds = {};
  cCAllEv().forEach(function(e){ if(e.caseId===caseId) evIds[e.id]=1; });
  return cCAllCustody().filter(function(c){ return evIds[c.evidenceId]; });
}
function cCEvDistinct(key){
  var m = {}, out = [];
  cCAllEv().forEach(function(e){
    var v = key==="tag" ? (e.tags||[]) : [e[key]];
    v.forEach(function(x){ if(x && !m[x]){ m[x]=1; out.push(x); } });
  });
  out.sort();
  return out;
}
function renderEvidence(){
  var f = S.evidence;
  var list = cCEvFiltered();
  var all = cCAllEv();
  var cases = cCAllCases();
  var types = cCEvDistinct("type");
  var tags = cCEvDistinct("tag");
  function opt(v,c){ return '<option value="'+esc(v)+'"'+(c?' selected':'')+'>'+esc(v)+'</option>'; }
  var caseOpts = '<option value="all">All cases</option>'+cases.map(function(c){ return opt(c.id, f.fCase===c.id); }).join("");
  var typeOpts = '<option value="all">All types</option>'+types.map(function(x){ return opt(x, f.fType===x); }).join("");
  var tagOpts = '<option value="all">All tags</option>'+tags.map(function(x){ return opt(x, f.fTag===x); }).join("");
  var integOpts = '<option value="all">All integrity</option>'+["Verified","Pending","Changed"].map(function(x){ return opt(x, f.fInteg===x); }).join("");
  function th(label,key){
    var arrow = (f.sort===key) ? (f.sortDir===1?" ▲":" ▼") : "";
    return '<th onclick="event.stopPropagation();PRM.evSort(\''+key+'\')" style="cursor:pointer;user-select:none" title="Sort by '+esc(label)+'">'+esc(label)+arrow+'</th>';
  }
  var isExpert = S.mode === "expert";
  var modePill = isExpert
    ? '<span class="badge acc" style="margin-left:8px">Expert Mode</span>'
    : '';
  var head = '<div class="page-head"><div><div class="eyebrow">Evidence' + modePill + '</div><h1>Evidence Vault</h1><p>'+all.length+' items · verify hashes before relying on an item · tags, notes and custody moves are audit-logged.</p></div><div class="sp">'
    + (isExpert ? '<button class="btn sm" onclick="PRM.openHexViewer(\'Vault Evidence Sector 0x00\', \'0x00000000\')">Inspect Hex</button>' : '')
    + '<button class="btn ghost sm" onclick="PRM.evExportAll()">Export CSV</button><button class="btn sm" onclick="PRM.evCollectionModal()">Create Collection</button><button class="btn primary sm" onclick="PRM.evImportModal()">Import Evidence</button></div></div>';
  var bar = '<div class="toolbar"><input class="inp" placeholder="Search id, name, hash, custodian, tag…" value="'+esc(f.search||"")+'" oninput="PRM.evSearch(this.value)"><select class="sel" onchange="PRM.evFilter(\'fCase\',this.value)">'+caseOpts+'</select><select class="sel" onchange="PRM.evFilter(\'fType\',this.value)">'+typeOpts+'</select><select class="sel" onchange="PRM.evFilter(\'fTag\',this.value)">'+tagOpts+'</select><select class="sel" onchange="PRM.evFilter(\'fInteg\',this.value)">'+integOpts+'</select><div class="seg" role="tablist"><button class="'+(f.view==="list"?"on":"")+'" onclick="PRM.evSetView(\'list\')">List</button><button class="'+(f.view==="grid"?"on":"")+'" onclick="PRM.evSetView(\'grid\')">Grid</button></div></div>';
  var body = "";
  if(!all.length){
    body = emptyState('<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M5 8h6M8 5v6"/></svg>', "No evidence added yet.", "Import evidence or add recovered files from a recovery operation.", "Import Evidence", "PRM.evImportModal()");
  } else if(!list.length){
    body = emptyState('<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7" cy="7" r="4"/><path d="M10 10l3.5 3.5"/></svg>', "No matches.", "Try a different search or clear the Case / Type / Tag / Integrity filters.", "Clear filters", "PRM.evClearFilters()");
  } else if(f.view==="grid"){
    body = '<div class="grid c3">'+list.map(function(e){
      return '<div class="panel" style="cursor:pointer" onclick="PRM.evOpen(\''+esc(e.id)+'\')"><div class="panel-h"><b style="font-size:13.5px">'+esc(e.name)+'</b><span class="right">'+cCEvBadge(e.integrity)+'</span></div><div class="hash">'+esc(e.id)+' · '+esc(e.caseId)+'</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0">'+(e.tags||[]).map(function(g){ return '<span class="tagchip">'+esc(g)+'</span>'; }).join("")+'</div><div class="muted" style="font-size:12px">'+esc(e.type)+' · '+esc(e.size)+' · <span class="mono">'+esc(e.shortHash||Svc().shortHash(e.hash))+'</span></div><div style="display:flex;gap:8px;margin-top:12px"><button class="btn xs" onclick="event.stopPropagation();PRM.evOpen(\''+esc(e.id)+'\')">Open</button><button class="btn xs ghost" onclick="event.stopPropagation();PRM.evVerify(\''+esc(e.id)+'\')">Verify</button>' + (isExpert ? '<button class="btn xs" onclick="event.stopPropagation();PRM.openHexViewer(\''+esc(e.name)+'\', \'0x00000000\')">Hex</button>' : '') + '<button class="icon-btn" title="More actions" onclick="event.stopPropagation();PRM.evMenu(\''+esc(e.id)+'\')">⋯</button></div></div>';
    }).join("")+'</div>';
  } else {
    var thHash = isExpert ? '<th>SHA-256 / BLAKE3</th>' : '<th>SHA-256</th>';
    body = '<div class="tbl-wrap"><table class="tbl"><thead><tr>'+th("Evidence ID","id")+th("Name","name")+th("Case","caseId")+th("Type","type")+'<th>Size</th>'+thHash+'<th>Integrity</th><th>Tags</th>'+th("Custodian","custodian")+th("Added","added")+'<th style="text-align:right">⋯</th></tr></thead><tbody>'+
      list.map(function(e){
        var hashCell = isExpert ? '<td class="hash">' + esc(e.shortHash||Svc().shortHash(e.hash)) + '<br><small class="mono" style="color:#79C0FF">b3-' + esc((e.hash||"").slice(0, 8)) + '…</small></td>' : '<td class="hash">' + esc(e.shortHash||Svc().shortHash(e.hash)) + '</td>';
        var expActions = isExpert ? '<button class="btn xs ghost" onclick="event.stopPropagation();PRM.openHexViewer(\''+esc(e.name)+'\', \'0x00000000\')">Hex</button>' : '';
        return '<tr onclick="PRM.evOpen(\''+esc(e.id)+'\')"><td class="mono" style="white-space:nowrap"><b>'+esc(e.id)+'</b></td><td><b>'+esc(e.name)+'</b></td><td class="mono" style="font-size:11.5px">'+esc(e.caseId)+'</td><td>'+esc(e.type)+'</td><td style="white-space:nowrap">'+esc(e.size)+'</td>'+hashCell+'<td>'+cCEvBadge(e.integrity)+'</td><td>'+(e.tags||[]).map(function(g){ return '<span class="tagchip">'+esc(g)+'</span>'; }).join(" ")+'</td><td>'+esc(e.custodian||e.operator||"—")+'</td><td class="muted" style="white-space:nowrap;font-size:12px">'+esc(e.added)+'</td><td><div class="row-actions">' + expActions + '<button class="icon-btn" title="More actions" onclick="event.stopPropagation();PRM.evMenu(\''+esc(e.id)+'\')">⋯</button></div></td></tr>';
      }).join("")+'</tbody></table></div><p class="dim" style="font-size:12px;margin:10px 2px">'+list.length+' of '+all.length+' items · click a row for Preview / Properties / Hashes / Custody / Notes / Related.</p>';
  }
  return head+bar+body;
}
function evSetView(v){ S.evidence.view=v; persist(); render(); }
function evSearch(v){ S.evidence.search=v; persist(); render(); }
function evFilter(k,v){ S.evidence[k]=v; persist(); render(); }
function evClearFilters(){ S.evidence.search=""; S.evidence.fCase="all"; S.evidence.fType="all"; S.evidence.fTag="all"; S.evidence.fInteg="all"; persist(); render(); }
function evSort(k){ if(S.evidence.sort===k){ S.evidence.sortDir = S.evidence.sortDir===1?-1:1; } else { S.evidence.sort=k; S.evidence.sortDir=1; } persist(); render(); }
function cCEvDrawerData(id){
  var e = cCEvById(id);
  if(!e) return null;
  var isExp = S.mode === "expert";
  var tab = S.evidence.insTab||"preview";
  var rel = cCAllEv().filter(function(x){ return x.caseId===e.caseId && x.id!==e.id; }).slice(0,6);
  var cus = cCCusForEv(e.id);
  var hex = (Data().HEX_SAMPLE||[]).slice(0,5);
  var tabs = [["preview","Preview"],["properties","Properties"],["hashes","Hashes"],["custody","Custody"],["notes","Notes"],["related","Related"]];
  var tabBar = '<div class="ins-tabs">'+tabs.map(function(x){ return '<button class="'+(tab===x[0]?"on":"")+'" onclick="PRM.evInsTab(\''+x[0]+'\')">'+x[1]+'</button>'; }).join("")+'</div>';
  var b = "";
  if(tab==="preview"){
    b = '<div class="preview-ph">Mock preview · '+esc(e.type)+' · '+esc(e.name)+'<br><span class="dim mono" style="font-size:11px">'+esc(e.id)+' · read-only vault copy</span></div><div class="hex" style="margin-top:12px;border:1px solid var(--line);border-radius:10px;padding:12px;background:#060708">'+hex.map(function(r){ return '<div><span class="off">'+esc(r[0])+'</span> &nbsp;'+esc(r[1])+' &nbsp;<span style="color:#6E737C">'+esc(r[2])+'</span></div>'; }).join("")+'</div><div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;flex-wrap:wrap;gap:8px"><p class="dim" style="font-size:12px;margin:0">Preview is a lightweight vault rendering. Full bytes stay sealed until export.</p><button class="btn xs ghost" onclick="PRM.openHexViewer(\''+esc(e.name)+'\', \'0x00000000\')">Inspect Raw Sector Hex</button></div>';
  } else if(tab==="properties"){
    var expProps = isExp ? '<div class="kv"><dt>Storage Node</dt><dd class="mono">NVMe PCIe 4.0 (HW Write-Locked)</dd></div><div class="kv"><dt>LBA Offset</dt><dd class="mono">0x00120000 (Aligned 4096B)</dd></div>' : '';
    b = '<dl><div class="kv"><dt>Name</dt><dd>'+esc(e.name)+'</dd></div><div class="kv"><dt>Evidence ID</dt><dd class="mono">'+esc(e.id)+'</dd></div><div class="kv"><dt>Case</dt><dd class="mono">'+esc(e.caseId)+'</dd></div><div class="kv"><dt>Type</dt><dd>'+esc(e.type)+'</dd></div><div class="kv"><dt>Size</dt><dd>'+esc(e.size)+'</dd></div><div class="kv"><dt>Integrity</dt><dd>'+cCEvBadge(e.integrity)+'</dd></div><div class="kv"><dt>Custodian</dt><dd>'+esc(e.custodian||e.operator||"—")+'</dd></div><div class="kv"><dt>Added</dt><dd class="mono">'+esc(e.added)+'</dd></div><div class="kv"><dt>Tags</dt><dd>'+(e.tags||[]).map(function(g){ return '<span class="tagchip">'+esc(g)+'</span>'; }).join(" ")+'</dd></div>' + expProps + '</dl>';
  } else if(tab==="hashes"){
    var expHashes = isExp ? '<div class="kv"><dt>BLAKE3</dt><dd class="mono" style="word-break:break-all;color:#79C0FF">b3-' + esc((e.hash||"").slice(0, 32)) + '… <span class="badge ok">Hardware SIMD</span></dd></div><div class="kv"><dt>SHA-512</dt><dd class="mono" style="word-break:break-all">' + esc(e.hash + (e.hash||"").slice(0, 32)) + '</dd></div><div class="kv"><dt>LBA Range</dt><dd class="mono">0x00120000 - 0x00124800 (Direct DMA read)</dd></div>' : '';
    b = '<dl><div class="kv"><dt>SHA-256</dt><dd class="mono" style="word-break:break-all">'+esc(e.hash)+'</dd></div><div class="kv"><dt>Short</dt><dd class="mono">'+esc(e.shortHash||Svc().shortHash(e.hash))+'</dd></div><div class="kv"><dt>Status</dt><dd>'+cCEvBadge(e.integrity)+'</dd></div>' + expHashes + '</dl><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn sm" onclick="PRM.evCopyHash(\''+esc(e.id)+'\')">Copy hash</button><button class="btn sm primary" onclick="PRM.evVerify(\''+esc(e.id)+'\')">Re-verify</button>' + (isExp ? '<button class="btn sm ghost" onclick="PRM.openHexViewer(\''+esc(e.name)+'\', \'0x00120000\')">Inspect Physical Sector</button>' : '') + '</div>'+(e.integrity==="Changed"?'<div class="danger-box" style="margin-top:12px">Hash drift flagged on re-verify — quarantined for review. Do not rely on this item until cleared.</div>':'');
  } else if(tab==="custody"){
    b = cus.length ? '<div class="tl">'+cus.map(function(c){ return '<button class="tl-ev info" onclick="PRM.cusOpen(\''+esc(c.id)+'\')"><div><b>'+esc(c.action)+'</b> · '+esc(c.actor)+'</div><div class="tt">'+esc(c.ts)+' · '+esc(c.ref)+'</div></button>'; }).join("")+'</div>' : '<div class="empty"><h3>No custody events</h3><p>No chain-of-custody entries reference this item yet.</p></div>';
  } else if(tab==="notes"){
    b = '<p style="font-size:13px">'+esc(e.notes||"No notes recorded.")+'</p><label class="f" for="ev-note-'+esc(e.id)+'">Add or replace note (audit-logged)</label><textarea class="inp" id="ev-note-'+esc(e.id)+'" rows="3" placeholder="Observation, relevance, handling note…">'+esc(e.notes||"")+'</textarea><div style="margin-top:10px"><button class="btn sm primary" onclick="PRM.evNoteSubmit(\''+esc(e.id)+'\')">Save note</button></div>';
  } else {
    b = rel.length ? rel.map(function(r){ return '<button class="palette-item" onclick="PRM.evOpen(\''+esc(r.id)+'\')"><span>◆</span><span><b>'+esc(r.name)+'</b><br><small class="mono">'+esc(r.id)+' · '+esc(r.shortHash||"")+'</small></span><small>'+esc(r.type)+'</small></button>'; }).join("") : '<div class="empty"><h3>No related items</h3><p>No other evidence shares this case yet.</p></div>';
  }
  var footer = '<button class="btn sm primary" onclick="PRM.evVerify(\''+esc(e.id)+'\')">Verify</button><button class="btn sm" onclick="PRM.evTagModal(\''+esc(e.id)+'\')">Tag</button><button class="btn sm" onclick="PRM.evNoteModal(\''+esc(e.id)+'\')">Add Note</button><button class="btn sm ghost" onclick="PRM.evExport(\''+esc(e.id)+'\')">Export</button><button class="btn sm ghost" onclick="PRM.evMoveModal(\''+esc(e.id)+'\')">Move</button>';
  return { e: e, tabBar: tabBar, body: tabBar+'<div class="ins-body">'+b+'</div>', footer: footer };
}
function evOpen(id){ S.evidence.openId=id; if(!S.evidence.insTab) S.evidence.insTab="preview"; persist(); var d=cCEvDrawerData(id); if(!d){ toast("error","Evidence unavailable","The item may have been moved."); return; } openDrawer({ title: d.e.title, sub: d.e.id+" · "+d.e.caseId, body: d.body, footer: d.footer }); }
function evInsTab(tab){ S.evidence.insTab=tab; persist(); var id=S.evidence.openId; var d=cCEvDrawerData(id); if(d) openDrawer({ title: d.e.title, sub: d.e.id+" · "+d.e.caseId, body: d.body, footer: d.footer }); }
function evCloseDrawer(){ try{ closeDrawer(); }catch(e){} S.evidence.openId=null; persist(); }
function evMenu(id){
  var e = cCEvById(id);
  if(!e) return;
  try{
    if(typeof renderOverlays==="function"){
      overlay.menu = { x: window.innerWidth-240, y: 160, title: e.name, items: [
        { label: "Open inspector", fn: "PRM.evOpen('"+e.id+"')" },
        { label: "Verify hash", fn: "PRM.evVerify('"+e.id+"')" },
        { label: "Tag…", fn: "PRM.evTagModal('"+e.id+"')" },
        { label: "Add note…", fn: "PRM.evNoteModal('"+e.id+"')" },
        { label: "Export metadata", fn: "PRM.evExport('"+e.id+"')" },
        { label: "Move to case…", fn: "PRM.evMoveModal('"+e.id+"')" }
      ]};
      renderOverlays();
      return;
    }
  }catch(err){}
  openModal({ title: e.name, sub: e.id+" · actions", body: '<div style="display:grid;gap:8px"><button class="btn sm block" onclick="PRM.evOpen(\''+esc(e.id)+'\')">Open inspector</button><button class="btn sm block" onclick="PRM.evVerify(\''+esc(e.id)+'\')">Verify hash</button><button class="btn sm block" onclick="PRM.evTagModal(\''+esc(e.id)+'\')">Tag…</button><button class="btn sm block" onclick="PRM.evExport(\''+esc(e.id)+'\')">Export metadata</button><button class="btn sm block" onclick="PRM.evMoveModal(\''+esc(e.id)+'\')">Move to case…</button></div>', footer: '<button class="btn sm ghost" onclick="PRM.closeModalX()">Close</button>' });
}
function evImportModal(){
  var cases = cCAllCases();
  var opts = cases.map(function(c){ return '<option value="'+esc(c.id)+'">'+esc(c.id)+' · '+esc(c.name)+'</option>'; }).join("");
  openModal({ title: "Import evidence", sub: "Hash is captured at import and audit-logged", body: '<label class="f">Evidence name</label><input class="inp" id="evImpName" placeholder="e.g. seized_phone_dump.bin"><div style="height:10px"></div><label class="f">Case</label><select class="sel" id="evImpCase" style="width:100%">'+opts+'</select><div style="height:10px"></div><label class="f">Type</label><select class="sel" id="evImpType" style="width:100%"><option>Document</option><option>Image</option><option>Video</option><option>Archive</option><option>Database</option><option>Disk Image</option><option>Other</option></select><div style="height:10px"></div><label class="f">Tags (comma separated)</label><input class="inp" id="evImpTags" placeholder="Relevant, Priority"><div style="height:10px"></div><label class="f">Note</label><textarea class="inp" id="evImpNote" rows="2" placeholder="Collection context…"></textarea>', footer: '<button class="btn ghost sm" onclick="PRM.closeModalX()">Cancel</button><button class="btn primary sm" onclick="PRM.evImportSubmit()">Import</button>' });
}
function evImportSubmit(){
  var name = (document.getElementById("evImpName")||{}).value||"";
  name = String(name).trim() || ("evidence_"+Date.now()%100000+".bin");
  var caseId = (document.getElementById("evImpCase")||{}).value || (cCAllCases()[0]||{}).id || "PRM-2026-0042";
  var type = (document.getElementById("evImpType")||{}).value || "Document";
  var tagsRaw = (document.getElementById("evImpNote")||{}).value||"";
  void tagsRaw;
  var tagsEl = document.getElementById("evImpTags");
  var tags = tagsEl && tagsEl.value ? tagsEl.value.split(",").map(function(s){ return s.trim(); }).filter(Boolean) : [];
  var note = (document.getElementById("evImpNote")||{}).value||"Imported via Evidence Vault.";
  var hash = Svc().stableHash(name+caseId+Svc().nowStamp(),64);
  var item = { id: Svc().uid("PRM-EVD"), name: name, caseId: caseId, type: type, size: "—", hash: hash, shortHash: Svc().shortHash(hash), integrity: "Pending", tags: tags, custodian: S.operator||"R. Patil", added: Svc().nowStamp().slice(0,16), operator: S.operator||"R. Patil", notes: note };
  try{ Svc().evidenceService.add(item); }catch(e){}
  cCAuditPush("VAULT_ADD", item.id, caseId, name+" imported");
  try{ closeModal(); }catch(e){}
  toast("success","Evidence imported", item.id+" · hash captured");
  persist(); render();
}
function evCollectionModal(){
  var cases = cCAllCases();
  var opts = cases.map(function(c){ return '<option value="'+esc(c.id)+'">'+esc(c.id)+'</option>'; }).join("");
  openModal({ title: "Create collection", sub: "Group items with a shared tag for review", body: '<label class="f">Collection name (applied as tag)</label><input class="inp" id="evColName" placeholder="e.g. Court Bundle A"><div style="height:10px"></div><label class="f">Scope case</label><select class="sel" id="evColCase" style="width:100%">'+opts+'</select><div style="height:10px"></div><label class="f">Description</label><textarea class="inp" id="evColDesc" rows="2" placeholder="What belongs in this collection?"></textarea>', footer: '<button class="btn ghost sm" onclick="PRM.closeModalX()">Cancel</button><button class="btn primary sm" onclick="PRM.evCollectionSubmit()">Create</button>' });
}
function evCollectionSubmit(){
  var name = ((document.getElementById("evColName")||{}).value||"").trim();
  if(!name){ toast("warning","Name required","Give the collection a tag name."); return; }
  var caseId = (document.getElementById("evColCase")||{}).value;
  var desc = (document.getElementById("evColDesc")||{}).value||"";
  try{
    var cols = lsGet("collections", []);
    cols.unshift({ name: name, caseId: caseId, desc: desc, created: Svc().nowStamp() });
    lsSet("collections", cols);
  }catch(e){}
  cCAuditPush("COLLECTION_CREATED", name, caseId, desc||("Collection "+name));
  try{ closeModal(); }catch(e){}
  toast("success","Collection created", name+" · use Tag to add items");
  persist(); render();
}
function evVerify(id){
  var res = null;
  try{ res = Svc().evidenceService.verify(id); }catch(e){}
  if(!res){ toast("error","Verify failed","Item not found."); return; }
  if(res.match){ toast("success","Verified", id+" · hash matched vault record"); }
  else { toast("error","Changed — quarantined", id+" · hash drift detected"); }
  persist(); render();
  var d = cCEvDrawerData(id); if(d && S.evidence.openId===id){ try{ openDrawer({ title: d.e.title, sub: d.e.id+" · "+d.e.caseId, body: d.body, footer: d.footer }); }catch(e){} }
}
function evTagModal(id){
  var e = cCEvById(id); if(!e) return;
  var all = ["Relevant","Reviewed","Priority","Potential Evidence","Exclude"];
  var boxes = all.map(function(g){ var on=(e.tags||[]).indexOf(g)>=0; return '<label class="check"><input type="checkbox" data-tag="'+esc(g)+'"'+(on?" checked":"")+'> <span><b>'+esc(g)+'</b></span></label>'; }).join("");
  openModal({ title: "Tag evidence", sub: e.id+" · "+e.name, body: '<div style="display:grid;gap:8px">'+boxes+'</div><div style="height:8px"></div><label class="f">Or add custom (comma separated)</label><input class="inp" id="evTagCustom" placeholder="e.g. Court Bundle A">', footer: '<button class="btn ghost sm" onclick="PRM.closeModalX()">Cancel</button><button class="btn primary sm" onclick="PRM.evTagSubmit(\''+esc(id)+'\')">Apply tags</button>' });
}
function evTagSubmit(id){
  var list = cCAllEv();
  var it = null; list.forEach(function(x){ if(x.id===id) it=x; });
  if(!it) return;
  var checked = Array.prototype.slice.call(document.querySelectorAll('input[data-tag]')).filter(function(c){ return c.checked; }).map(function(c){ return c.getAttribute("data-tag"); });
  var custom = (document.getElementById("evTagCustom")||{}).value||"";
  custom.split(",").map(function(s){ return s.trim(); }).filter(Boolean).forEach(function(g){ if(checked.indexOf(g)<0) checked.push(g); });
  it.tags = checked;
  try{ Svc().evidenceService.save(list); }catch(e){}
  cCAuditPush("EVIDENCE_TAGGED", id, it.caseId, "Tags: "+checked.join(", "), it.shortHash);
  try{ closeModal(); }catch(e){}
  toast("success","Evidence tagged", checked.join(", ")||"tags cleared");
  persist(); render();
  var d=cCEvDrawerData(id); if(d) try{ openDrawer({ title: d.e.title, sub: d.e.id+" · "+d.e.caseId, body: d.body, footer: d.footer }); }catch(e){}
}
function evNoteModal(id){
  S.evidence.insTab="notes"; persist();
  evOpen(id);
}
function evNoteSubmit(id){
  var list = cCAllEv(); var it=null;
  list.forEach(function(x){ if(x.id===id) it=x; });
  if(!it) return;
  var ta = document.getElementById("ev-note-"+id);
  var v = ta ? ta.value : it.notes;
  it.notes = v;
  try{ Svc().evidenceService.save(list); }catch(e){}
  cCAuditPush("EVIDENCE_NOTED", id, it.caseId, String(v||"").slice(0,120), it.shortHash);
  toast("success","Note saved","Audit-logged against "+id);
  persist(); render();
  var d=cCEvDrawerData(id); if(d) try{ openDrawer({ title: d.e.title, sub: d.e.id+" · "+d.e.caseId, body: d.body, footer: d.footer }); }catch(e){}
}
function evCopyHash(id){ var e=cCEvById(id); if(e) copyText(e.hash,"Evidence hash"); }
function evExport(id){
  var e = cCEvById(id); if(!e) return;
  var rows = [["Field","Value"],["Evidence ID",e.id],["Name",e.name],["Case",e.caseId],["Type",e.type],["Size",e.size],["SHA-256",e.hash],["Integrity",e.integrity],["Tags",(e.tags||[]).join("; ")],["Custodian",e.custodian||e.operator||""],["Added",e.added],["Notes",e.notes||""]];
  try{ Svc().download(e.id+"-metadata.csv", Svc().toCSV(rows), "text/csv"); }catch(err){}
  cCAuditPush("METADATA_EXPORTED", e.id, e.caseId, "Metadata CSV exported", e.shortHash);
  toast("success","Exported", e.id+"-metadata.csv");
}
function evExportAll(){
  var list = cCEvFiltered();
  if(!list.length){ toast("warning","Nothing to export","Adjust filters first."); return; }
  var rows = [["Evidence ID","Name","Case","Type","Size","SHA-256","Integrity","Tags","Custodian","Added"]].concat(list.map(function(e){ return [e.id,e.name,e.caseId,e.type,e.size,e.hash,e.integrity,(e.tags||[]).join("; "),e.custodian||e.operator||"",e.added]; }));
  try{ Svc().download("evidence-export.csv", Svc().toCSV(rows), "text/csv"); }catch(e){}
  toast("success","Exported", list.length+" rows · evidence-export.csv");
}
function evMoveModal(id){
  var e=cCEvById(id); if(!e) return;
  var opts = cCAllCases().map(function(c){ return '<option value="'+esc(c.id)+'"'+(c.id===e.caseId?" selected":"")+'>'+esc(c.id)+' · '+esc(c.name)+'</option>'; }).join("");
  openModal({ title: "Move to case", sub: e.id+" · currently "+e.caseId, body: '<label class="f">Destination case</label><select class="sel" id="evMoveCase" style="width:100%">'+opts+'</select>', footer: '<button class="btn ghost sm" onclick="PRM.closeModalX()">Cancel</button><button class="btn primary sm" onclick="PRM.evMoveSubmit(\''+esc(id)+'\')">Move</button>' });
}
function evMoveSubmit(id){
  var dest = (document.getElementById("evMoveCase")||{}).value;
  if(!dest) return;
  var list=cCAllEv(); var it=null;
  list.forEach(function(x){ if(x.id===id) it=x; });
  if(!it) return;
  var from=it.caseId; it.caseId=dest;
  try{ Svc().evidenceService.save(list); }catch(e){}
  cCAuditPush("EVIDENCE_MOVED", id, dest, "Moved "+from+" → "+dest, it.shortHash);
  try{ closeModal(); }catch(e){}
  toast("success","Moved", id+" → "+dest);
  persist(); render();
}
/* ---------- cases ---------- */
function renderCases(){
  var list = cCAllCases();
  var ev = cCAllEv();
  function countFor(id){ var n=0; ev.forEach(function(e){ if(e.caseId===id) n++; }); var c=cCCaseById(id); if(c&&c.evidenceCount&&n===0) return c.evidenceCount; return n; }
  var head = '<div class="page-head"><div><div class="eyebrow">Cases</div><h1>Cases</h1><p>Group evidence, operations, custody and reports per investigation.</p></div><div class="sp"><button class="btn primary sm" onclick="PRM.caseCreateModal()">Create Case</button></div></div>';
  if(!list.length){
    return head + emptyState('<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="12" height="10" rx="2"/><path d="M2 6h12"/></svg>', "No cases yet.", "Create your first case to group evidence and reports.", "Create Case", "PRM.caseCreateModal()");
  }
  var cards = '<div class="grid c2">'+list.map(function(c){
    return '<div class="panel" style="cursor:pointer" onclick="PRM.caseOpen(\''+esc(c.id)+'\')"><div class="panel-h"><span class="mono" style="font-size:12px;color:var(--mut)">'+esc(c.id)+'</span><span class="right">'+cCCaseBadge(c.status)+'</span></div><h3 style="margin:0 0 4px;font-size:16px">'+esc(c.name)+'</h3><p class="muted" style="font-size:12.5px;margin:0 0 10px">'+esc(c.description||"")+'</p><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-size:12px;color:var(--mut)"><span>'+countFor(c.id)+' evidence</span><span>·</span><span>'+esc(c.investigator||"")+'</span><span>·</span><span>'+esc(c.updated||c.created||"")+'</span></div><div style="display:flex;gap:8px;margin-top:12px"><button class="btn xs primary" onclick="event.stopPropagation();PRM.caseOpen(\''+esc(c.id)+'\')">Open</button><button class="btn xs ghost" onclick="event.stopPropagation();PRM.caseTabGo(\''+esc(c.id)+'\',\'evidence\')">Evidence</button><button class="btn xs ghost" onclick="event.stopPropagation();PRM.caseTabGo(\''+esc(c.id)+'\',\'reports\')">Reports</button></div></div>';
  }).join("")+'</div>';
  var rows = list.map(function(c){
    return '<tr onclick="PRM.caseOpen(\''+esc(c.id)+'\')"><td class="mono"><b>'+esc(c.id)+'</b></td><td><b>'+esc(c.name)+'</b><div class="dim" style="font-size:11.5px">'+esc(c.classification||"")+'</div></td><td>'+countFor(c.id)+'</td><td>'+esc(c.investigator||"")+'</td><td class="muted" style="font-size:12px">'+esc(c.updated||"")+'</td><td>'+cCCaseBadge(c.status)+'</td></tr>';
  }).join("");
  return head+cards+'<div style="height:14px"></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Case ID</th><th>Name</th><th>Evidence</th><th>Investigator</th><th>Updated</th><th>Status</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
}
function caseCreateModal(){
  var nid = cCNextCaseId();
  openModal({ title: "Create case", sub: "ID "+nid+" · auto-generated", body: '<label class="f">Case name</label><input class="inp" id="csName" placeholder="e.g. Unauthorized Data Access"><div style="height:10px"></div><label class="f">Description</label><textarea class="inp" id="csDesc" rows="2" placeholder="Scope, media, objective…"></textarea><div style="height:10px"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><label class="f">Investigator</label><input class="inp" id="csInv" value="'+esc(S.operator||"R. Patil")+'"></div><div><label class="f">Classification</label><select class="sel" id="csClass" style="width:100%"><option>Confidential</option><option>Restricted</option><option>Internal</option></select></div></div><div style="height:10px"></div><label class="f">Tags (comma separated)</label><input class="inp" id="csTags" placeholder="workstation, priority">', footer: '<button class="btn ghost sm" onclick="PRM.closeModalX()">Cancel</button><button class="btn primary sm" onclick="PRM.caseCreateSubmit()">Create</button>' });
}
function caseCreateSubmit(){
  var name = ((document.getElementById("csName")||{}).value||"").trim() || "Untitled Case";
  var desc = (document.getElementById("csDesc")||{}).value||"";
  var inv = (document.getElementById("csInv")||{}).value||S.operator||"R. Patil";
  var cls = (document.getElementById("csClass")||{}).value||"Confidential";
  var tags = ((document.getElementById("csTags")||{}).value||"").split(",").map(function(s){ return s.trim(); }).filter(Boolean);
  var id = cCNextCaseId();
  var c = { id: id, name: name, status: "Open", classification: cls, investigator: inv, created: Svc().nowStamp().slice(0,16), updated: "Just now", updatedTs: Svc().nowStamp(), evidenceCount: 0, description: desc, tags: tags, notes: "" };
  try{ Svc().caseService.create(c); }catch(e){}
  try{ closeModal(); }catch(e2){}
  toast("success","Case created", id+" · "+name);
  persist(); render();
  try{ nav("/workspace/cases/"+encodeURIComponent(id)); }catch(e){}
}
function caseOpen(id){ S.cases.openId=id; S.cases.openTab=S.cases.openTab||"overview"; persist(); try{ nav("/workspace/cases/"+encodeURIComponent(id)); }catch(e){ render(); } }
function caseBack(){ try{ nav("/workspace/cases"); }catch(e){ S.route="cases"; persist(); render(); } }
function caseTab(t){ S.cases.openTab=t; persist(); render(); }
function caseTabGo(id,t){ S.cases.openId=id; S.cases.openTab=t; persist(); try{ nav("/workspace/cases/"+encodeURIComponent(id)); }catch(e){ render(); } }
function caseNoteInput(v){ S.cases.noteDraft=v; persist(); }
function caseNoteSave(){
  var id = S.cases.openId || S.routeParam;
  var c = cCCaseById(id); if(!c){ toast("error","Case not found",""); return; }
  var ta = document.getElementById("caseNoteBox");
  var v = ta ? ta.value : (S.cases.noteDraft||"");
  var list = cCAllCases();
  list.forEach(function(x){ if(x.id===id){ x.notes=v; x.updated="Just now"; x.updatedTs=Svc().nowStamp(); } });
  try{ Svc().caseService.save(list); }catch(e){}
  S.cases.noteDraft="";
  cCAuditPush("CASE_NOTE", id, id, String(v).slice(0,140)||"Case note updated");
  toast("success","Note saved","Audit-logged against "+id);
  persist(); render();
}
function caseStatus(id,st){
  var list=cCAllCases(); list.forEach(function(x){ if(x.id===id){ x.status=st; x.updated="Just now"; } });
  try{ Svc().caseService.save(list); }catch(e){}
  cCAuditPush("CASE_STATUS", id, id, "Status → "+st);
  toast("success","Status updated", id+" → "+st);
  persist(); render();
}
function caseAttachModal(){
  var id = S.cases.openId || S.routeParam;
  var pool = cCAllEv().filter(function(e){ return e.caseId!==id; });
  var opts = pool.map(function(e){ return '<option value="'+esc(e.id)+'">'+esc(e.id)+' · '+esc(e.name)+' ('+esc(e.caseId)+')</option>'; }).join("") || '<option value="">No unassigned items</option>';
  openModal({ title: "Attach evidence", sub: id, body: '<label class="f">Evidence item</label><select class="sel" id="csAttachId" style="width:100%">'+opts+'</select>', footer: '<button class="btn ghost sm" onclick="PRM.closeModalX()">Cancel</button><button class="btn primary sm" onclick="PRM.caseAttachSubmit()">Attach</button>' });
}
function caseAttachSubmit(){
  var id = S.cases.openId || S.routeParam;
  var evId = (document.getElementById("csAttachId")||{}).value;
  if(!evId){ try{ closeModal(); }catch(e){} return; }
  var list=cCAllEv(); list.forEach(function(x){ if(x.id===evId) x.caseId=id; });
  try{ Svc().evidenceService.save(list); }catch(e){}
  cCAuditPush("EVIDENCE_MOVED", evId, id, "Attached to "+id);
  try{ closeModal(); }catch(e){}
  toast("success","Attached", evId+" → "+id);
  persist(); render();
}
function caseDetach(evId){
  var id = S.cases.openId || S.routeParam;
  var list=cCAllEv(); list.forEach(function(x){ if(x.id===evId) x.caseId="PRM-2026-0041"; });
  try{ Svc().evidenceService.save(list); }catch(e){}
  cCAuditPush("EVIDENCE_MOVED", evId, id, "Detached from "+id);
  toast("info","Detached", evId+" moved out of "+id);
  persist(); render();
}
function renderCaseDetail(){
  var id = S.cases.openId || S.routeParam;
  var c = cCCaseById(id);
  if(!c) return '<div class="page-head"><div><h1>Case not found</h1><p class="muted">'+esc(id||"")+'</p></div><div class="sp"><button class="btn sm" onclick="PRM.caseBack()">Back to cases</button></div></div>' + emptyState('◈',"Case unavailable.","It may have been renamed or removed.","Back to Cases","PRM.caseBack()");
  var tab = S.cases.openTab||"overview";
  var ev = cCAllEv().filter(function(e){ return e.caseId===c.id; });
  var ops = cCAllOps().filter(function(o){ return o.caseId===c.id; });
  var cus = cCCusForCase(c.id);
  var reps = cCAllReports().filter(function(r){ return r.caseId===c.id; });
  var tabs = [["overview","Overview"],["evidence","Evidence"],["operations","Operations"],["custody","Custody"],["reports","Reports"],["notes","Notes"]];
  var head = '<div class="page-head"><div><button class="btn xs ghost" onclick="PRM.caseBack()">← Cases</button><div class="mono dim" style="font-size:12px;margin-top:6px">'+esc(c.id)+' · '+esc(c.classification||"")+'</div><h1 style="margin-top:2px">'+esc(c.name)+'</h1><p>'+esc(c.description||"")+'</p><div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">'+cCCaseBadge(c.status)+'<span class="tagchip">'+esc(c.investigator||"")+'</span>'+(c.tags||[]).map(function(g){ return '<span class="tagchip">'+esc(g)+'</span>'; }).join("")+'</div></div><div class="sp"><select class="sel" onchange="PRM.caseStatus(\''+esc(c.id)+'\',this.value)" title="Set status"><option'+(c.status==="Open"?" selected":"")+'>Open</option><option'+(c.status==="Review"?" selected":"")+'>Review</option><option'+(c.status==="Closed"?" selected":"")+'>Closed</option></select><button class="btn sm" onclick="PRM.caseAttachModal()">Attach Evidence</button></div></div>';
  var bar = '<div class="cap-tabs">'+tabs.map(function(x){ return '<button class="'+(tab===x[0]?"on":"")+'" onclick="PRM.caseTab(\''+x[0]+'\')">'+x[1]+'</button>'; }).join("")+'</div><div style="height:14px"></div>';
  var b = "";
  if(tab==="overview"){
    b = '<div class="grid c3"><div class="stat-card"><div class="k">Evidence</div><div class="v">'+ev.length+'</div><div class="d">items in vault</div></div><div class="stat-card"><div class="k">Operations</div><div class="v">'+ops.length+'</div><div class="d">erase / recovery jobs</div></div><div class="stat-card"><div class="k">Reports</div><div class="v">'+reps.length+'</div><div class="d">generated artifacts</div></div></div><div style="height:14px"></div><div class="panel"><div class="panel-h"><h3>Case file</h3></div><dl><div class="kv"><dt>Case ID</dt><dd class="mono">'+esc(c.id)+'</dd></div><div class="kv"><dt>Investigator</dt><dd>'+esc(c.investigator||"—")+'</dd></div><div class="kv"><dt>Created</dt><dd class="mono">'+esc(c.created||"—")+'</dd></div><div class="kv"><dt>Updated</dt><dd>'+esc(c.updated||"—")+'</dd></div><div class="kv"><dt>Notes</dt><dd>'+esc(c.notes||"—")+'</dd></div></dl></div>';
  } else if(tab==="evidence"){
    b = '<div class="toolbar"><span class="muted" style="font-size:13px">'+ev.length+' items</span><span style="flex:1"></span><button class="btn sm" onclick="PRM.caseAttachModal()">Attach</button></div>' + (ev.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>ID</th><th>Name</th><th>Type</th><th>Hash</th><th>Integrity</th><th style="text-align:right">Action</th></tr></thead><tbody>'+ev.map(function(e){ return '<tr onclick="PRM.evOpen(\''+esc(e.id)+'\')"><td class="mono"><b>'+esc(e.id)+'</b></td><td>'+esc(e.name)+'</td><td>'+esc(e.type)+'</td><td class="hash">'+esc(e.shortHash||"")+'</td><td>'+cCEvBadge(e.integrity)+'</td><td><div class="row-actions"><button class="btn xs ghost" onclick="event.stopPropagation();PRM.caseDetach(\''+esc(e.id)+'\')">Detach</button></div></td></tr>'; }).join("")+'</tbody></table></div>' : emptyState('◈',"No evidence in this case.","Attach vault items to build the case file.","Attach Evidence","PRM.caseAttachModal()"));
  } else if(tab==="operations"){
    b = ops.length ? ops.map(function(o){ return '<div class="op-card"><div style="flex:1;min-width:200px"><b>'+esc(o.title||o.kind)+' · '+esc(o.id)+'</b><div class="dim mono" style="font-size:11.5px">'+esc(o.device||"")+' · '+esc(o.status||"")+' · '+esc(o.progress||0)+'%</div><div class="prog" style="margin-top:8px"><i style="width:'+esc(o.progress||0)+'%"></i></div></div><button class="btn xs" onclick="PRM.navGo(\'/workspace/activity\')">Open</button></div>'; }).join("") : '<div class="empty"><h3>No operations</h3><p>No erase or recovery jobs are linked to this case yet. Start one from Overview → New Operation.</p></div>';
  } else if(tab==="custody"){
    b = cus.length ? '<div class="tl">'+cus.map(function(x){ return '<button class="tl-ev info" onclick="PRM.cusOpen(\''+esc(x.id)+'\')"><div><b>'+esc(x.action)+'</b> · '+esc(x.evidence||x.evidenceId)+' · '+esc(x.actor)+'</div><div class="tt">'+esc(x.ts)+' · '+esc(x.ref)+'</div></button>'; }).join("")+'</div>' : '<div class="empty"><h3>No custody trail</h3><p>Custody events for this case\u2019s evidence will appear here.</p></div>';
  } else if(tab==="reports"){
    b = reps.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Report</th><th>Type</th><th>Generated</th><th>Operator</th><th>Status</th></tr></thead><tbody>'+reps.map(function(r){ return '<tr><td class="mono"><b>'+esc(r.id)+'</b></td><td>'+esc(r.type)+'</td><td class="muted">'+esc(r.generated)+'</td><td>'+esc(r.operator)+'</td><td><span class="badge ok">'+esc(r.status)+'</span></td></tr>'; }).join("")+'</tbody></table></div>' : '<div class="empty"><h3>No reports</h3><p>Generate a sanitization, recovery, verification or case report from Reports.</p><button class="btn primary sm" onclick="PRM.navGo(\'/workspace/reports\')">Go to Reports</button></div>';
  } else {
    var draft = (typeof S.cases.noteDraft==="string" && S.cases.noteDraft) ? S.cases.noteDraft : (c.notes||"");
    b = '<div class="panel"><div class="panel-h"><h3>Investigator notes</h3><span class="sub">saved with audit entry</span></div><textarea class="inp" id="caseNoteBox" rows="5" oninput="PRM.caseNoteInput(this.value)" placeholder="Timeline, hypothesis, next steps…">'+esc(draft)+'</textarea><div style="display:flex;gap:10px;margin-top:12px"><button class="btn primary sm" onclick="PRM.caseNoteSave()">Save note</button><span class="dim" style="font-size:12px">Last: '+esc(c.notes||"—")+'</span></div></div>';
  }
  return head+bar+b;
}
/* ---------- custody ---------- */
function renderCustody(){
  var q = String(S.custody.search||"").toLowerCase();
  var evF = S.custody.evFilter||"all";
  var all = cCAllCustody();
  var evs = cCAllEv();
  var opts = '<option value="all">All evidence</option>'+evs.map(function(e){ return '<option value="'+esc(e.id)+'"'+(evF===e.id?" selected":"")+'>'+esc(e.id)+' · '+esc(e.name)+'</option>'; }).join("");
  var list = all.filter(function(c){
    if(evF!=="all" && c.evidenceId!==evF && c.evidence!==evF) return false;
    if(q){
      var hay=(c.id+" "+c.ts+" "+c.actor+" "+c.action+" "+c.evidence+" "+c.evidenceId+" "+c.ref+" "+c.location).toLowerCase();
      if(hay.indexOf(q)<0) return false;
    }
    return true;
  });
  var head = '<div class="page-head"><div><div class="eyebrow">Custody</div><h1>Chain of Custody</h1><p>Chronological, audit-linked hand-offs. Click any event for the full record.</p></div><div class="sp"><button class="btn sm ghost" onclick="PRM.cusExport()">Export CSV</button></div></div>';
  var bar = '<div class="toolbar"><input class="inp" placeholder="Search actor, action, evidence, ref…" value="'+esc(S.custody.search||"")+'" oninput="PRM.cusSearch(this.value)"><select class="sel" onchange="PRM.cusFilter(this.value)">'+opts+'</select></div>';
  if(!list.length) return head+bar+emptyState('◈',"No custody events.","Try clearing search or choosing a different evidence filter.","Clear", "PRM.cusClear()");
  var tl = '<div class="tl">'+list.map(function(c){
    var cls = /verif|report|generat/i.test(c.action)?"ok":/transfer|export|recover|import/i.test(c.action)?"info":"warn";
    return '<button class="tl-ev '+cls+'" onclick="PRM.cusOpen(\''+esc(c.id)+'\')"><div><b>'+esc(c.action)+'</b> · '+esc(c.evidence||c.evidenceId)+' <span class="dim">· '+esc(c.actor)+'</span></div><div class="tt">'+esc(c.ts)+' · '+esc(c.location||"")+' · '+esc(c.ref||"")+'</div></button>';
  }).join("")+'</div>';
  return head+bar+tl;
}
function cusSearch(v){ S.custody.search=v; persist(); render(); }
function cusFilter(v){ S.custody.evFilter=v; persist(); render(); }
function cusClear(){ S.custody.search=""; S.custody.evFilter="all"; persist(); render(); }
function cusOpen(id){
  var c=null; cCAllCustody().forEach(function(x){ if(x.id===id) c=x; });
  if(!c){ toast("error","Event not found",""); return; }
  S.custody.openId=id; persist();
  openDrawer({ title: c.action, sub: c.id+" · "+c.ts, body: '<dl><div class="kv"><dt>Event ID</dt><dd class="mono">'+esc(c.id)+'</dd></div><div class="kv"><dt>Timestamp</dt><dd class="mono">'+esc(c.ts)+'</dd></div><div class="kv"><dt>Operator</dt><dd>'+esc(c.actor)+'</dd></div><div class="kv"><dt>Action</dt><dd>'+esc(c.action)+'</dd></div><div class="kv"><dt>Evidence</dt><dd>'+esc(c.evidence||"—")+' <span class="dim mono">'+esc(c.evidenceId||"")+'</span></dd></div><div class="kv"><dt>Location</dt><dd>'+esc(c.location||"—")+'</dd></div><div class="kv"><dt>Previous</dt><dd>'+esc(c.prev||"—")+'</dd></div><div class="kv"><dt>New custody</dt><dd>'+esc(c.next||"—")+'</dd></div><div class="kv"><dt>Hash</dt><dd class="mono">'+esc(c.hash||"—")+'</dd></div><div class="kv"><dt>Log ref</dt><dd class="mono">'+esc(c.ref||"—")+'</dd></div><div class="kv"><dt>Detail</dt><dd>'+esc(c.detail||"—")+'</dd></div></dl>', footer: '<button class="btn sm" onclick="PRM.cusCopyRef(\''+esc(c.id)+'\')">Copy event reference</button><button class="btn sm ghost" onclick="PRM.cusOpenEv(\''+esc(c.evidenceId||"")+'\')">Open evidence</button>' });
}
function cusOpenEv(evId){ if(!evId||evId==="—"){ toast("info","No linked item","This event references a report, not vault evidence."); return; } S.evidence.openId=evId; persist(); try{ nav("/workspace/evidence"); }catch(e){} setTimeout(function(){ try{ evOpen(evId); }catch(e){} },60); }
function cusCopyRef(id){ var c=null; cCAllCustody().forEach(function(x){ if(x.id===id) c=x; }); if(!c) return; copyText(c.id+" · "+c.ts+" · "+c.ref+" · "+c.hash, "Custody reference"); }
function cusExport(){
  var list = cCAllCustody();
  var rows = [["Event","Timestamp","Actor","Action","Evidence","Evidence ID","Location","Hash","Prev","Next","Ref"]].concat(list.map(function(c){ return [c.id,c.ts,c.actor,c.action,c.evidence,c.evidenceId,c.location,c.hash,c.prev,c.next,c.ref]; }));
  try{ Svc().download("custody-export.csv", Svc().toCSV(rows), "text/csv"); }catch(e){}
  toast("success","Exported", list.length+" events · custody-export.csv");
}
/* ---------- verify ---------- */
function cCVfAlgos(){ return ["SHA-256","SHA-512","SHA-1","MD5","BLAKE3"]; }
function renderVerify(){
  var v = S.verify;
  var isExpert = (S.mode==="expert");
  var algos = cCVfAlgos();
  var tabs = [["file","Verify File"],["evidence","Verify Evidence"],["compare","Compare Hashes"]];
  var head = '<div class="page-head"><div><div class="eyebrow">Verification</div><h1>Hash &amp; Verify</h1><p>'
    + (isExpert ? "Expert mode: full cryptographic suite, BLAKE3 and hardware acceleration active." : "Basic mode: SHA-256 verification — switch to Expert for BLAKE3, MD5, SHA-512, and acceleration.")
    + '</p></div><div class="sp">'
    + '<button class="btn sm ghost" onclick="PRM.vfReset()">Reset</button></div></div>';
  var tabBar = '<div class="seg">'+tabs.map(function(x){ return '<button class="'+(v.tab===x[0]?"on":"")+'" onclick="PRM.vfTab(\''+x[0]+'\')">'+x[1]+'</button>'; }).join("")+'</div>';
  var algoBar = '<div class="seg" style="margin-top:10px">'+algos.map(function(a){
    var locked = !isExpert && a!=="SHA-256";
    return '<button class="'+(v.algo===a?"on":"")+'" '+(locked?'disabled title="Expert mode required"':"")+' onclick="PRM.vfAlgo(\''+a+'\')">'+a+'</button>';
  }).join("")+'</div>';
  var top = "";
  if(v.tab==="file"){
    top = '<div class="drop" onclick="document.getElementById(\'vfFile\').click()" ondragover="PRM.vfDragOver(event)" ondrop="PRM.vfDrop(event)"><b>Drop a file here or click to browse</b><div class="dim" style="font-size:12.5px;margin-top:4px">Mock hashing in prototype · '+(v.fileName?('attached: <span class="mono">'+esc(v.fileName)+'</span>'):'no file attached yet')+'</div><input type="file" id="vfFile" style="display:none" onchange="PRM.vfFileChange(this)"></div>';
  } else if(v.tab==="evidence"){
    var evs = cCAllEv();
    var opts = '<option value="">Select vault item…</option>'+evs.map(function(e){ return '<option value="'+esc(e.id)+'"'+(v.evId===e.id?" selected":"")+'>'+esc(e.id)+' · '+esc(e.name)+'</option>'; }).join("");
    var sel = v.evId ? cCEvById(v.evId) : null;
    top = '<label class="f">Vault item</label><select class="sel" style="width:100%" onchange="PRM.vfPickEvidence(this.value)">'+opts+'</select>'+(sel?'<div class="ok-box" style="margin-top:10px">Selected <b>'+esc(sel.name)+'</b> · <span class="mono">'+esc(sel.shortHash||"")+'</span> · '+cCEvBadge(sel.integrity)+'</div>':'<p class="dim" style="font-size:12.5px">Pick an item — its stored hash becomes the reference.</p>');
  } else {
    top = '<div class="grid c2"><div><label class="f">Hash A</label><textarea class="inp mono" id="vfCmpA" rows="2" oninput="PRM.vfCompareInput(\'a\',this.value)" placeholder="paste first hash…">'+esc(v.cmpA||"")+'</textarea></div><div><label class="f">Hash B</label><textarea class="inp mono" id="vfCmpB" rows="2" oninput="PRM.vfCompareInput(\'b\',this.value)" placeholder="paste second hash…">'+esc(v.cmpB||"")+'</textarea></div></div><div style="margin-top:10px"><button class="btn sm primary" onclick="PRM.vfCompareGo()">Compare</button></div>';
  }
  var expRow = "";
  if(v.tab!=="compare"){
    expRow = '<div style="margin-top:12px"><label class="f">Expected hash (paste reference to compare — leave blank to just compute)</label><input class="inp mono" id="vfExpected" placeholder="a3f1c9d2…" value="'+esc(v.expected||"")+'" oninput="PRM.vfExpected(this.value)"></div><div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap"><button class="btn primary sm" onclick="PRM.vfStart()">'+(v.done?"Re-run verification":"Start verification")+'</button>'+(v.progress>0&&!v.done?'<span class="muted" style="font-size:12.5px">Hashing… '+esc(v.progress)+'%</span>':"")+'</div>';
  }
  var prog = "";
  if(v.progress>0 && !v.done && v.tab!=="compare") prog = '<div class="prog" style="margin-top:12px"><i style="width:'+Math.min(100,v.progress)+'%"></i></div>';
  var verdict = "";
  if(v.done && v.calc){
    var match = v.verdict==="match";
    verdict = '<div class="verdict '+(match?"match":"mismatch")+'" style="margin-top:14px"><div class="big">'+(match?"MATCH":"MISMATCH")+'</div><div class="mono" style="font-size:11.5px;margin-top:8px;word-break:break-all">expected&nbsp;&nbsp;: '+esc(v.expected||"(none — computed only)")+'<br>calculated ('+esc(v.algo)+'): '+esc(v.calc)+'</div>'+(match?"":'<div style="font-size:12.5px;margin-top:8px">The file differs from the reference — do not rely on it. Quarantine and re-acquire.</div>')+'<div style="display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap"><button class="btn xs" onclick="PRM.vfCopy()">Copy Hash</button><button class="btn xs" onclick="PRM.vfAddToCaseModal()">Add Verification to Case</button><button class="btn xs ghost" onclick="PRM.vfExport()">Export Result</button></div></div>';
  } else if(v.done && v.tab==="compare"){
    var m2 = v.verdict==="match";
    verdict = '<div class="verdict '+(m2?"match":"mismatch")+'" style="margin-top:14px"><div class="big">'+(m2?"MATCH":"MISMATCH")+'</div><div class="mono" style="font-size:11.5px;margin-top:8px;word-break:break-all">A: '+esc(v.cmpA||"—")+'<br>B: '+esc(v.cmpB||"—")+'</div><div style="display:flex;gap:8px;justify-content:center;margin-top:12px"><button class="btn xs" onclick="PRM.vfCopyCompare()">Copy</button><button class="btn xs ghost" onclick="PRM.vfExport()">Export Result</button></div></div>';
  }
  return head+'<div class="panel" style="max-width:760px"><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">'+tabBar+'</div>'+algoBar+'<div style="height:14px"></div>'+top+expRow+prog+verdict+'</div>';
}
function vfTab(t){ S.verify.tab=t; S.verify.progress=0; S.verify.done=false; S.verify.verdict=null; persist(); render(); }
function vfAlgo(a){ if(S.mode!=="expert" && a!=="SHA-256"){ toast("warning","Expert required","Switch to Expert Mode for "+a+"."); return; } S.verify.algo=a; persist(); render(); }
function vfFileChange(inp){
  var f = inp && inp.files && inp.files[0];
  if(!f){ return; }
  S.verify.fileName=f.name; S.verify.fileSeed=f.name+":"+f.size+":"+f.lastModified; S.verify.progress=0; S.verify.done=false; S.verify.verdict=null; S.verify.calc=null;
  toast("info","File attached", f.name+" · ready to verify");
  persist(); render();
}
function vfDragOver(e){ if(e) e.preventDefault(); }
function vfDrop(e){
  if(e) e.preventDefault();
  var f = e && e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if(f){ S.verify.fileName=f.name; S.verify.fileSeed=f.name+":"+f.size+":"+f.lastModified; S.verify.progress=0; S.verify.done=false; S.verify.verdict=null; S.verify.calc=null; toast("info","File attached", f.name); persist(); render(); }
}
function vfPickEvidence(id){ S.verify.evId=id||null; S.verify.progress=0; S.verify.done=false; S.verify.verdict=null; persist(); render(); }
function vfExpected(val){ S.verify.expected=val; }
function vfCompareInput(which,val){ if(which==="a") S.verify.cmpA=val; else S.verify.cmpB=val; }
function vfNorm(h){ return String(h||"").toLowerCase().replace(/[^a-f0-9]/g,""); }
function vfCompareGo(){
  var a=vfNorm(S.verify.cmpA), b=vfNorm(S.verify.cmpB);
  if(!a||!b){ toast("warning","Two hashes needed","Paste both values to compare."); return; }
  S.verify.done=true; S.verify.verdict=(a===b?"match":"mismatch"); S.verify.progress=100;
  cCAuditPush(S.verify.verdict==="match"?"HASH_VERIFIED":"VERIFY_MISMATCH", "manual-compare", "—", "Manual hash compare · "+S.verify.verdict);
  persist(); render();
  toast(S.verify.verdict==="match"?"success":"error", S.verify.verdict==="match"?"MATCH":"MISMATCH", "Hashes "+(S.verify.verdict==="match"?"are identical":"differ"));
}
function vfStart(){
  var v=S.verify;
  var seed=null, refExpected=String(v.expected||"").trim();
  if(v.tab==="evidence"){
    if(!v.evId){ toast("warning","Select evidence","Pick a vault item first."); return; }
    var e=cCEvById(v.evId);
    if(!e){ toast("error","Item missing",""); return; }
    seed="file:"+e.name+":"+e.hash;
    if(!refExpected) refExpected=e.hash;
  } else {
    if(!v.fileSeed && !v.fileName){ toast("warning","No file","Drop a file or click to browse first."); return; }
    seed="file:"+(v.fileSeed||v.fileName)+":"+v.algo;
  }
  v.progress=1; v.done=false; v.verdict=null; v.calc=null;
  persist(); render();
  var pct=1;
  var timer=setInterval(function(){
    pct += Math.ceil(12 + Math.random() * 15);
    if(pct>=100){
      clearInterval(timer);
      var calc=null;
      try{ calc=Svc().verificationService.hashFile(seed, v.algo); }
      catch(err){ try{ calc=Svc().stableHash(seed+":"+v.algo, v.algo==="SHA-512"?128:v.algo==="MD5"?32:v.algo==="SHA-1"?40:64); }catch(e2){ calc=""; } }
      v.calc=calc; v.progress=100; v.done=true;
      if(refExpected){
        v.expected=refExpected;
        v.verdict=(vfNorm(refExpected)===vfNorm(calc)?"match":"mismatch");
      } else {
        v.verdict=null;
      }
      if(v.tab==="evidence" && v.evId){
        cCAuditPush(v.verdict==="match"?"HASH_VERIFIED":"VERIFY_MISMATCH", v.evId, (cCEvById(v.evId)||{}).caseId||"—", v.algo+" "+(v.verdict||"computed"), Svc().shortHash(calc));
      }
      persist(); render();
      if(v.verdict==="match") toast("success","MATCH","Calculated hash equals expected.");
      else if(v.verdict==="mismatch") toast("error","MISMATCH","Calculated hash differs — see warning.");
      else toast("success","Verification complete","Hash calculated · no reference to compare.");
    } else {
      v.progress=Math.min(96,pct); persist();
      var bar=document.querySelector(".prog i");
      if(bar) bar.style.width=v.progress+"%";
      var lbl=document.querySelector(".panel .muted");
      void lbl;
    }
  },120);
}
function vfReset(){ S.verify.progress=0; S.verify.done=false; S.verify.verdict=null; S.verify.calc=null; S.verify.expected=""; S.verify.fileName=null; S.verify.fileSeed=null; S.verify.cmpA=""; S.verify.cmpB=""; persist(); render(); }
function vfCopy(){ if(S.verify.calc) copyText(S.verify.calc,"Verification hash"); }
function vfCopyCompare(){ copyText("A: "+(S.verify.cmpA||"")+"\nB: "+(S.verify.cmpB||""),"Comparison"); }
function vfAddToCaseModal(){
  var opts=cCAllCases().map(function(c){ return '<option value="'+esc(c.id)+'">'+esc(c.id)+' · '+esc(c.name)+'</option>'; }).join("");
  openModal({ title: "Add verification to case", sub: S.verify.algo+" · "+(S.verify.verdict||"computed"), body: '<label class="f">Case</label><select class="sel" id="vfCaseId" style="width:100%">'+opts+'</select><div style="height:8px"></div><p class="muted" style="font-size:12.5px">Attaches expected + calculated hashes with an audit entry.</p>', footer: '<button class="btn ghost sm" onclick="PRM.closeModalX()">Cancel</button><button class="btn primary sm" onclick="PRM.vfAddToCaseSubmit()">Attach</button>' });
}
function vfAddToCaseSubmit(){
  var cid=(document.getElementById("vfCaseId")||{}).value;
  if(!cid) return;
  cCAuditPush("HASH_VERIFIED", S.verify.evId||S.verify.fileName||"manual", cid, S.verify.algo+" · "+(S.verify.verdict||"computed")+" · "+String(S.verify.calc||"").slice(0,24), Svc().shortHash(S.verify.calc||""));
  try{ closeModal(); }catch(e){}
  toast("success","Attached", "Verification added to "+cid);
  persist(); render();
}
function vfExport(){
  var v=S.verify;
  var rows=[["Field","Value"],["Mode",v.tab],["Algorithm",v.algo],["File",v.fileName||v.evId||""],["Expected",v.expected||v.cmpA||""],["Calculated",v.calc||v.cmpB||""],["Verdict",v.verdict||"computed"],["Operator",S.operator||""],["Timestamp",Svc().nowStamp()]];
  try{ Svc().download("verification-result.csv", Svc().toCSV(rows), "text/csv"); }catch(e){}
  toast("success","Exported","verification-result.csv");
}
function navGo(p){ try{ nav(p); }catch(e){} }
function closeModalX(){ try{ closeModal(); }catch(e){} }
Object.assign(window.PRM, { renderEvidence: renderEvidence, evSetView: evSetView, evSearch: evSearch, evFilter: evFilter, evClearFilters: evClearFilters, evSort: evSort, evOpen: evOpen, evInsTab: evInsTab, evCloseDrawer: evCloseDrawer, evMenu: evMenu, evImportModal: evImportModal, evImportSubmit: evImportSubmit, evCollectionModal: evCollectionModal, evCollectionSubmit: evCollectionSubmit, evVerify: evVerify, evTagModal: evTagModal, evTagSubmit: evTagSubmit, evNoteModal: evNoteModal, evNoteSubmit: evNoteSubmit, evCopyHash: evCopyHash, evExport: evExport, evExportAll: evExportAll, evMoveModal: evMoveModal, evMoveSubmit: evMoveSubmit, renderCases: renderCases, renderCaseDetail: renderCaseDetail, caseCreateModal: caseCreateModal, caseCreateSubmit: caseCreateSubmit, caseOpen: caseOpen, caseBack: caseBack, caseTab: caseTab, caseTabGo: caseTabGo, caseNoteInput: caseNoteInput, caseNoteSave: caseNoteSave, caseStatus: caseStatus, caseAttachModal: caseAttachModal, caseAttachSubmit: caseAttachSubmit, caseDetach: caseDetach, renderCustody: renderCustody, cusSearch: cusSearch, cusFilter: cusFilter, cusClear: cusClear, cusOpen: cusOpen, cusOpenEv: cusOpenEv, cusCopyRef: cusCopyRef, cusExport: cusExport, renderVerify: renderVerify, vfTab: vfTab, vfAlgo: vfAlgo, vfFileChange: vfFileChange, vfDragOver: vfDragOver, vfDrop: vfDrop, vfPickEvidence: vfPickEvidence, vfExpected: vfExpected, vfCompareInput: vfCompareInput, vfCompareGo: vfCompareGo, vfStart: vfStart, vfReset: vfReset, vfCopy: vfCopy, vfCopyCompare: vfCopyCompare, vfAddToCaseModal: vfAddToCaseModal, vfAddToCaseSubmit: vfAddToCaseSubmit, vfExport: vfExport, navGo: navGo, closeModalX: closeModalX });
/*CHUNK_C_OK*/

/* ===== chunk_d1.js ===== */
/* PARMAAN chunk_d1 — audit logs + reports (runs inside existing IIFE) */
var _d1AuditReady=false;
var _d1GenTimer=null;
var _d1RepTypes=[
{id:"Sanitization Certificate",d:"Verified sanitization proof with hashes and seal.",m:"seal · hashes"},
{id:"Recovery Report",d:"Carved files, integrity tags and inventory.",m:"inventory · hashes"},
{id:"Verification Report",d:"Hash compare with MATCH verdict and method.",m:"verdict · method"},
{id:"Evidence Inventory",d:"Vault items per case with hashes and tags.",m:"table · CSV-ready"},
{id:"Chain-of-Custody Report",d:"Chronological hand-offs with references.",m:"timeline · refs"},
{id:"Case Summary Report",d:"Overview, evidence, operations and audit excerpt.",m:"summary · audit"}];
var _d1SecDefs=[["summary","Executive summary"],["inventory","Evidence inventory"],["hashes","Hash appendix"],["ops","Operations log"],["recovery","Recovery detail"],["custody","Custody trail"],["audit","Audit excerpt"],["operator","Operator & seal"]];
function d1AllAudit(){try{return Svc().auditService.list();}catch(e){try{return Data().AUDIT_SEED.slice();}catch(e2){return[];}}}
function d1AllReports(){try{return Svc().reportService.list();}catch(e){try{return Data().REPORTS.slice();}catch(e2){return[];}}}
function d1AllCases(){try{return Svc().caseService.list();}catch(e){try{return Data().CASES.slice();}catch(e2){return[];}}}
function d1Distinct(list,key){var m={},out=[];for(var i=0;i<list.length;i++){var v=list[i][key];if(v&&!m[v]){m[v]=1;out.push(v);}}out.sort();return out;}
function d1SevBadge(s){if(s==="high")return '<span class="badge bad">high</span>';if(s==="medium")return '<span class="badge warn">medium</span>';if(s==="low")return '<span class="badge">low</span>';return '<span class="badge info">info</span>';}
function d1StBadge(s){if(s==="success"||s==="Completed")return '<span class="badge ok">'+esc(s||"")+'</span>';if(s==="failed")return '<span class="badge bad">'+esc(s||"")+'</span>';if(s==="warning"||s==="queued"||s==="running")return '<span class="badge warn">'+esc(s||"")+'</span>';return '<span class="badge">'+esc(s||"—")+'</span>';}
function d1AuditFiltered(){var list=d1AllAudit();var f=S.audit||{};var q=String(f.search||"").toLowerCase();var out=list.filter(function(a){if(f.fUser&&f.fUser!=="all"&&a.actor!==f.fUser)return false;if(f.fAction&&f.fAction!=="all"&&a.action!==f.fAction)return false;if(f.fCase&&f.fCase!=="all"&&a.caseId!==f.fCase)return false;if(f.fSev&&f.fSev!=="all"&&a.severity!==f.fSev)return false;if(q){var hay=(a.id+" "+a.ts+" "+a.actor+" "+(a.role||"")+" "+a.action+" "+a.target+" "+a.caseId+" "+(a.device||"")+" "+(a.severity||"")+" "+(a.status||"")+" "+(a.hash||"")+" "+(a.detail||"")).toLowerCase();if(hay.indexOf(q)<0)return false;}return true;});var k=f.sort||"ts";var d=f.sortDir||-1;out.sort(function(a,b){var va=a[k]==null?"":a[k];var vb=b[k]==null?"":b[k];return String(va).localeCompare(String(vb))*d;});return out;}
function d1Th(lbl,key){var cur=(S.audit.sort||"ts")===key;var ar=cur?((S.audit.sortDir===-1)?" ▼":" ▲"):"";return '<th onclick="event.stopPropagation();PRM.auditSort(\''+key+'\')" style="cursor:pointer;user-select:none" title="Sort by '+esc(lbl)+'">'+esc(lbl)+ar+'</th>';}
function d1AuditById(id){var l=d1AllAudit();for(var i=0;i<l.length;i++)if(l[i].id===id)return l[i];return null;}
function renderAudit(){
if(!_d1AuditReady){_d1AuditReady=true;setTimeout(function(){try{if(S.route==="audit")render();}catch(e){}},400);return '<div class="page-head"><div><div class="skel" style="width:160px;height:12px"></div><div class="skel" style="width:260px;height:26px;margin-top:8px"></div></div><div class="sp"><div class="skel" style="width:120px;height:36px"></div></div></div><div class="toolbar"><div class="skel" style="width:220px;height:36px"></div><div class="skel" style="width:130px;height:36px"></div><div class="skel" style="width:130px;height:36px"></div></div><div class="skel" style="height:320px"></div>';}
var f=S.audit||{};var all=d1AllAudit();var list=d1AuditFiltered();
function opt(v,cur,lbl){return '<option value="'+esc(v)+'"'+(cur===v?" selected":"")+'>'+esc(lbl||v)+'</option>';}
var users=d1Distinct(all,"actor");var acts=d1Distinct(all,"action");var cases=d1Distinct(all,"caseId");var sevs=d1Distinct(all,"severity");
var head='<div class="page-head"><div><div class="eyebrow">Verification · Audit</div><h1>Audit Logs</h1><p>'+list.length+' of '+all.length+' events · every action is hash-linked · click a row for metadata and related links.</p></div><div class="sp"><button class="btn sm ghost" onclick="PRM.auditExport()">Export CSV</button></div></div>';
var bar='<div class="toolbar"><input class="inp" placeholder="Search actor, action, target, detail, hash…" value="'+esc(f.search||"")+'" oninput="PRM.auditSearch(this.value)"><select class="sel" onchange="PRM.auditFilter(\'fUser\',this.value)"><option value="all">All users</option>'+users.map(function(u){return opt(u,f.fUser);}).join("")+'</select><select class="sel" onchange="PRM.auditFilter(\'fAction\',this.value)"><option value="all">All actions</option>'+acts.map(function(a){return opt(a,f.fAction);}).join("")+'</select><select class="sel" onchange="PRM.auditFilter(\'fCase\',this.value)"><option value="all">All cases</option>'+cases.map(function(c){return opt(c,f.fCase);}).join("")+'</select><select class="sel" onchange="PRM.auditFilter(\'fSev\',this.value)"><option value="all">All severity</option>'+sevs.map(function(s){return opt(s,f.fSev);}).join("")+'</select>'+(f.search||f.fUser!=="all"||f.fAction!=="all"||f.fCase!=="all"||f.fSev!=="all"?'<button class="btn xs ghost" onclick="PRM.auditClear()">Clear</button>':"")+'</div>';
if(!all.length)return head+bar+emptyState("◈","No audit events.","Operations will append hash-linked entries here.","","");
if(!list.length)return head+bar+emptyState("◈","No matches.","Try a different search or clear the User / Action / Case / Severity filters.","Clear filters","PRM.auditClear()");
var rows=list.map(function(a){return '<tr onclick="PRM.auditOpen(\''+esc(a.id)+'\')"><td class="mono dim" style="white-space:nowrap;font-size:12px">'+esc(a.ts||"")+'</td><td><b>'+esc(a.actor||"")+'</b></td><td class="mono" style="font-size:11.5px">'+esc(a.action||"")+'</td><td class="mono" style="font-size:11.5px">'+esc(a.target||"")+'</td><td class="mono" style="font-size:11.5px">'+esc(a.caseId||"")+'</td><td>'+d1SevBadge(a.severity)+'</td><td>'+d1StBadge(a.status)+'</td><td class="mono" style="white-space:nowrap"><b>'+esc(a.id||"")+'</b></td></tr>';}).join("");
return head+bar+'<div class="tbl-wrap"><table class="tbl"><thead><tr>'+d1Th("Time","ts")+d1Th("Actor","actor")+d1Th("Action","action")+d1Th("Target","target")+d1Th("Case","caseId")+'<th>Severity</th>'+d1Th("Status","status")+d1Th("Event ID","id")+'</tr></thead><tbody>'+rows+'</tbody></table></div><p class="dim" style="font-size:12px;margin:10px 2px">'+list.length+' of '+all.length+' events · newest first by default · export keeps current filters.</p>';
}
function auditSearch(v){S.audit.search=String(v==null?"":v);persist();render();}
function auditFilter(k,v){S.audit[k]=v;persist();render();}
function auditClear(){S.audit.search="";S.audit.fUser="all";S.audit.fAction="all";S.audit.fCase="all";S.audit.fSev="all";persist();render();}
function auditSort(k){if((S.audit.sort||"ts")===k){S.audit.sortDir=(S.audit.sortDir===-1)?1:-1;}else{S.audit.sort=k;S.audit.sortDir=1;}persist();render();}
function auditOpen(id){var a=d1AuditById(id);if(!a){toast("error","Event not found","It may have been pruned.");return;}S.audit.openId=id;persist();var exp=S.mode==="expert";var rel="";if(a.caseId&&a.caseId!=="—")rel+='<button class="btn xs" onclick="PRM.auditGotoCase(\''+esc(a.caseId)+'\')">View case '+esc(a.caseId)+'</button>';if(a.target&&a.target.indexOf("PRM-EVD")===0)rel+='<button class="btn xs" onclick="PRM.auditGotoEv(\''+esc(a.target)+'\')">Open evidence</button>';if(a.target&&a.target.indexOf("PRM-RPT")===0)rel+='<button class="btn xs" onclick="PRM.auditGotoRep(\''+esc(a.target)+'\')">Open report</button>';if(a.prevRef&&a.prevRef!=="—"&&d1AuditById(a.prevRef))rel+='<button class="btn xs ghost" onclick="PRM.auditOpen(\''+esc(a.prevRef)+'\')">Previous '+esc(a.prevRef)+'</button>';if(!rel)rel='<span class="dim" style="font-size:12px">No linked case or vault item for this event.</span>';var raw=exp?'<div style="height:12px"></div><label class="f">Raw JSON · Expert Mode</label><div class="log">'+esc(JSON.stringify(a,null,2))+'</div>':'<p class="dim" style="font-size:12px">Expert Mode reveals raw JSON for this event.</p>';openDrawer({title:a.action||"Audit event",sub:(a.id||"")+" · "+(a.ts||""),body:'<dl><div class="kv"><dt>Event ID</dt><dd class="mono">'+esc(a.id||"")+'</dd></div><div class="kv"><dt>Time</dt><dd class="mono">'+esc(a.ts||"")+'</dd></div><div class="kv"><dt>Actor</dt><dd>'+esc(a.actor||"")+' <span class="dim">· '+esc(a.role||"")+'</span></dd></div><div class="kv"><dt>Action</dt><dd class="mono">'+esc(a.action||"")+'</dd></div><div class="kv"><dt>Target</dt><dd class="mono">'+esc(a.target||"")+'</dd></div><div class="kv"><dt>Case</dt><dd class="mono">'+esc(a.caseId||"")+'</dd></div><div class="kv"><dt>Device</dt><dd>'+esc(a.device||"—")+'</dd></div><div class="kv"><dt>Severity</dt><dd>'+d1SevBadge(a.severity)+'</dd></div><div class="kv"><dt>Status</dt><dd>'+d1StBadge(a.status)+'</dd></div><div class="kv"><dt>Hash</dt><dd class="mono" style="word-break:break-all">'+esc(a.hash||"—")+'</dd></div><div class="kv"><dt>Detail</dt><dd>'+esc(a.detail||"—")+'</dd></div><div class="kv"><dt>Prev ref</dt><dd class="mono">'+esc(a.prevRef||"—")+'</dd></div></dl><div style="height:8px"></div><label class="f">Related links</label><div style="display:flex;gap:8px;flex-wrap:wrap">'+rel+'</div>'+raw,footer:'<button class="btn sm" onclick="PRM.auditCopyHash(\''+esc(a.id)+'\')">Copy hash</button><button class="btn sm ghost" onclick="PRM.closeDrawer()">Close</button>'});}
function auditCopyHash(id){var a=d1AuditById(id);if(a&&a.hash)copyText(a.hash,"Audit hash");else toast("warning","No hash","This event carries no hash value.");}
function auditExport(){var list=d1AuditFiltered();if(!list.length){toast("warning","Nothing to export","Adjust filters first.");return;}var rows=[["Time","Actor","Role","Action","Target","Case","Device","Severity","Status","Hash","Detail","Event ID"]].concat(list.map(function(a){return [a.ts,a.actor,a.role,a.action,a.target,a.caseId,a.device,a.severity,a.status,a.hash,a.detail,a.id];}));try{Svc().download("audit-export.csv",Svc().toCSV(rows),"text/csv");}catch(e){}toast("success","Exported",list.length+" rows · audit-export.csv");}
function auditGotoCase(id){try{closeDrawer();}catch(e){}S.cases.openId=id;persist();try{nav("/workspace/cases/"+encodeURIComponent(id));}catch(e){render();}}
function auditGotoEv(id){try{closeDrawer();}catch(e){}try{nav("/workspace/evidence");}catch(e){}setTimeout(function(){try{if(typeof evOpen==="function")evOpen(id);}catch(e){}},80);}
function auditGotoRep(id){try{closeDrawer();}catch(e){}try{nav("/workspace/reports");}catch(e){}setTimeout(function(){try{repPreview(id);}catch(e){}},80);}
function d1NextReportId(){var list=d1AllReports();var mx=94;for(var i=0;i<list.length;i++){var m=String(list[i].id||"").match(/(\d+)\s*$/);if(m){var n=parseInt(m[1],10);if(n>mx)mx=n;}}var s=String(mx+1);while(s.length<4)s="0"+s;return "PRM-RPT-"+s;}
function d1SecsOn(){var s=(S.reports&&S.reports.secs)||{};return _d1SecDefs.filter(function(x){return s[x[0]];}).map(function(x){return x[0];});}
function renderReports(){var list=d1AllReports();var head='<div class="page-head"><div><div class="eyebrow">Output · Reports</div><h1>Reports</h1><p>'+list.length+' artifacts · certificates embed verification hashes · preview is A4 before export.</p></div><div class="sp"><button class="btn primary sm" onclick="PRM.repOpenWizard()">Generate Report</button></div></div>';if(!list.length)return head+emptyState("◈","No reports yet.","Generate a certificate or case report with the 5-step wizard.","Generate Report","PRM.repOpenWizard()");var rows=list.map(function(r){return '<tr onclick="PRM.repPreview(\''+esc(r.id)+'\')"><td class="mono" style="white-space:nowrap"><b>'+esc(r.id)+'</b></td><td><b>'+esc(r.type||"")+'</b><div class="dim" style="font-size:11px">'+esc(r.target||"")+'</div></td><td class="mono" style="font-size:11.5px">'+esc(r.caseId||"")+'</td><td class="muted" style="white-space:nowrap;font-size:12px">'+esc(r.generated||"")+'</td><td>'+esc(r.operator||"")+'</td><td><span class="badge ok">'+esc(r.status||"Completed")+'</span></td><td><div class="row-actions"><button class="btn xs" onclick="event.stopPropagation();PRM.repPreview(\''+esc(r.id)+'\')">Preview</button></div></td></tr>';}).join("");return head+'<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Report</th><th>Type</th><th>Case</th><th>Generated</th><th>Operator</th><th>Status</th><th style="text-align:right">Action</th></tr></thead><tbody>'+rows+'</tbody></table></div>';}
function d1WizSteps(){var cur=S.reports.wizStep||1;var labels=["Type","Scope","Sections","Review","Generate"];var h='<div class="stepper">';for(var i=0;i<5;i++){var n=i+1;var cls="step"+(n<cur?" done":"")+(n===cur?" on":"");h+='<button class="'+cls+'" onclick="PRM.repWizGoto('+n+')"><span class="sn">'+(n<cur?"✓":n)+'</span><span><b>'+labels[i]+'</b></span></button>';}return h+'</div>';}
function d1WizBody(){var st=S.reports;var step=st.wizStep||1;var h=d1WizSteps();if(step===1){h+='<div class="method-grid c4">'+_d1RepTypes.map(function(tp,i){var sel=st.wizType===tp.id;return '<button class="method-card'+(sel?" sel":"")+'" onclick="PRM.repWizType('+i+')"><h4>'+esc(tp.id)+'</h4><p>'+esc(tp.d)+'</p><div class="meta"><span>'+esc(tp.m)+'</span></div></button>';}).join("")+'</div>';}else if(step===2){var cs=d1AllCases();var opts=cs.map(function(c){return '<option value="'+esc(c.id)+'"'+(st.wizCase===c.id?" selected":"")+'>'+esc(c.id)+' · '+esc(c.name)+'</option>';}).join("");h+='<label class="f">Case scope</label><select class="sel" style="width:100%" onchange="PRM.repWizCase(this.value)">'+opts+'</select><div style="height:12px"></div><label class="f">Format</label><div class="seg"><button class="'+(st.wizFmt==="PDF"?"on":"")+'" onclick="PRM.repWizFmt(\'PDF\')">PDF</button><button class="'+(st.wizFmt==="CSV"?"on":"")+'" onclick="PRM.repWizFmt(\'CSV\')">CSV</button></div><p class="dim" style="font-size:12px;margin-top:10px">A4 preview renders for both formats · CSV exports tables only.</p>';}else if(step===3){var secs=st.secs||{};h+='<div class="grid c2">'+_d1SecDefs.map(function(x){return '<label class="check"><input type="checkbox"'+(secs[x[0]]?" checked":"")+' onchange="PRM.repWizSec(\''+x[0]+'\',this.checked)"> <span><b>'+esc(x[1])+'</b><br><span class="dim mono" style="font-size:11px">'+esc(x[0])+'</span></span></label>';}).join("")+'</div><p class="dim" style="font-size:12px;margin-top:10px">'+d1SecsOn().length+' of 8 sections enabled.</p>';}else if(step===4){var on=d1SecsOn();var c=null;try{c=Svc().caseService.get(st.wizCase);}catch(e){}if(!c){var all=d1AllCases();for(var i=0;i<all.length;i++)if(all[i].id===st.wizCase)c=all[i];}h+='<dl><div class="kv"><dt>Type</dt><dd><b>'+esc(st.wizType||"—")+'</b></dd></div><div class="kv"><dt>Case</dt><dd class="mono">'+esc(st.wizCase||"—")+(c?" · "+esc(c.name||""):"")+'</dd></div><div class="kv"><dt>Format</dt><dd>'+esc(st.wizFmt||"PDF")+'</dd></div><div class="kv"><dt>Sections</dt><dd>'+(on.length?on.map(function(k){return '<span class="tagchip">'+esc(k)+'</span>';}).join(" "):'<span class="badge warn">none selected</span>')+'</dd></div><div class="kv"><dt>Operator</dt><dd>'+esc(S.operator||"R. Patil")+'</dd></div></dl>'+(on.length?"":'<div class="warn-box">Select at least one section to generate a useful report.</div>')+'<div class="ok-box">Hashes embed automatically · report is audit-logged on generate.</div>';}else{var p=st.genProgress||0;var done=!!st.genDone;if(!done){h+='<div class="panel"><div class="panel-h"><h3>Generating… '+p+'%</h3><span class="right"><span class="badge info">working</span></span></div><div class="prog"><i id="d1GenBar" style="width:'+p+'%"></i></div><div class="log" style="margin-top:12px"><div>› Collecting sections · '+esc(d1SecsOn().join(", ")||"none")+'</div><div>› Resolving hashes · '+esc(st.wizCase||"")+'</div><div id="d1GenPct" class="hl">'+p+'%</div></div></div>';}else{h+='<div class="ok-box"><b>Report '+(st.lastId||"")+' generated.</b> Attached to '+esc(st.wizCase||"")+' · '+esc(st.wizType||"")+'.</div><div style="height:10px"></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary sm" onclick="PRM.repPreview(\''+esc(st.lastId||"")+'\')">Open preview</button></div>';}}return h;}
function d1WizFoot(){var s=S.reports.wizStep||1;var done=!!S.reports.genDone;if(s===1)return '<button class="btn ghost sm" onclick="PRM.closeModal()">Cancel</button><button class="btn primary sm" onclick="PRM.repWizNext()">Continue →</button>';if(s===2)return '<button class="btn ghost sm" onclick="PRM.repWizBack()">← Back</button><button class="btn primary sm" onclick="PRM.repWizNext()">Continue →</button>';if(s===3)return '<button class="btn ghost sm" onclick="PRM.repWizBack()">← Back</button><button class="btn primary sm" onclick="PRM.repWizNext()">Review →</button>';if(s===4)return '<button class="btn ghost sm" onclick="PRM.repWizBack()">← Back</button><button class="btn primary sm" onclick="PRM.repWizGenerate()">Generate</button>';if(done)return '<button class="btn ghost sm" onclick="PRM.closeModal()">Close</button><button class="btn primary sm" onclick="PRM.repPreview(\''+esc(S.reports.lastId||"")+'\')">Preview</button>';return '<button class="btn ghost sm" onclick="PRM.closeModal()">Cancel</button>';}
function d1WizOpen(){openModal({title:"Generate report",sub:"Step "+(S.reports.wizStep||1)+" of 5 · "+esc(S.reports.wizType||""),body:d1WizBody(),footer:d1WizFoot(),lg:true});}
function repOpenWizard(){S.reports.wizStep=S.reports.wizStep||1;S.reports.genProgress=0;S.reports.genDone=false;persist();d1WizOpen();}
function repWizType(i){var tp=_d1RepTypes[i||0];if(tp)S.reports.wizType=tp.id;persist();d1WizOpen();}
function repWizCase(v){S.reports.wizCase=v;persist();d1WizOpen();}
function repWizFmt(f){S.reports.wizFmt=f;persist();d1WizOpen();}
function repWizSec(k,on){if(!S.reports.secs)S.reports.secs={};S.reports.secs[k]=!!on;persist();d1WizOpen();}
function repWizGoto(n){n=Number(n)||1;if(n<1)n=1;if(n>5)n=5;if(n===5&&!S.reports.genDone){toast("info","Use Generate","Review then press Generate to run the simulation.");return;}S.reports.wizStep=n;persist();d1WizOpen();}
function repWizNext(){var s=S.reports.wizStep||1;if(s===4&&!d1SecsOn().length){toast("warning","No sections","Enable at least one section.");return;}if(s>=5)return;S.reports.wizStep=Math.min(5,s+1);persist();d1WizOpen();}
function repWizBack(){S.reports.wizStep=Math.max(1,(S.reports.wizStep||1)-1);persist();d1WizOpen();}
function repWizGenerate(){if(!d1SecsOn().length){toast("warning","No sections","Enable at least one section.");return;}S.reports.wizStep=5;S.reports.genProgress=0;S.reports.genDone=false;persist();d1WizOpen();if(_d1GenTimer){clearInterval(_d1GenTimer);_d1GenTimer=null;}_d1GenTimer=setInterval(function(){S.reports.genProgress=Math.min(100,(S.reports.genProgress||0)+9);var b=document.getElementById("d1GenBar");if(b)b.style.width=S.reports.genProgress+"%";var t=document.getElementById("d1GenPct");if(t)t.textContent=S.reports.genProgress+"%";if(S.reports.genProgress>=100){clearInterval(_d1GenTimer);_d1GenTimer=null;var nid=d1NextReportId();var on2=d1SecsOn();var hsh="";try{hsh=Svc().stableHash(nid+S.reports.wizType+S.reports.wizCase+on2.join(","),64);}catch(e){hsh=nid;}var nr={id:nid,type:S.reports.wizType,caseId:S.reports.wizCase,generated:"",operator:S.operator||"R. Patil",status:"Completed",target:S.reports.wizCase+" · "+S.reports.wizType,method:S.reports.wizFmt+" · "+on2.length+" sections ("+on2.join(", ")+")",hash:hsh,format:S.reports.wizFmt||"PDF",secs:Object.assign({},S.reports.secs||{})};try{nr.generated=Svc().nowStamp();}catch(e){nr.generated="2026-09-03 09:00:00";}try{Svc().reportService.generate(nr);}catch(e){try{var l=d1AllReports();l.unshift(nr);Svc().reportService.save(l);}catch(e2){}}S.reports.genDone=true;S.reports.lastId=nid;persist();d1WizOpen();try{render();}catch(e){}toast("success","Report generated",nid);}},180);}
function d1RepById(id){var l=d1AllReports();for(var i=0;i<l.length;i++)if(l[i].id===id)return l[i];return null;}
function d1RepA4(r){var secs=r.secs||S.reports.secs||{};var on=[];for(var i=0;i<_d1SecDefs.length;i++)if(secs[_d1SecDefs[i][0]])on.push(_d1SecDefs[i][1]);return '<div class="a4"><div class="a4sub">PARMAAN · '+esc(r.type||"Report")+'</div><h1>'+esc(r.type||"Report")+'</h1><div class="a4sub">'+esc(r.id||"")+' · '+esc(r.status||"Completed")+'</div><table><tr><th>Field</th><th>Value</th></tr><tr><td>Report ID</td><td class="mono">'+esc(r.id||"")+'</td></tr><tr><td>Case</td><td class="mono">'+esc(r.caseId||"")+'</td></tr><tr><td>Generated</td><td class="mono">'+esc(r.generated||"")+'</td></tr><tr><td>Operator</td><td>'+esc(r.operator||"")+'</td></tr><tr><td>Target</td><td>'+esc(r.target||"")+'</td></tr><tr><td>Method</td><td>'+esc(r.method||"")+'</td></tr><tr><td>Sections</td><td>'+esc(on.join(", ")||"—")+'</td></tr><tr><td>Hash</td><td class="mono" style="word-break:break-all">'+esc(r.hash||"")+'</td></tr></table><div><span class="seal">SEALED</span></div><p style="color:#6B6E76;font-size:11px;margin-top:14px">Prototype artifact · hashes embedded for audit readiness · '+esc(r.id||"")+'.</p></div>';}
function repPreview(id){var r=d1RepById(id);if(!r){toast("error","Report not found","It may have been removed.");return;}S.reports.openId=id;persist();openModal({title:r.type||"Report",sub:(r.id||"")+" · "+(r.caseId||"")+" · "+(r.generated||""),body:d1RepA4(r),footer:'<button class="btn sm" onclick="PRM.repExportPDF(\''+esc(r.id)+'\')">Export PDF</button><button class="btn sm" onclick="PRM.repExportCSV(\''+esc(r.id)+'\')">Export CSV</button><button class="btn sm ghost" onclick="PRM.repDuplicate(\''+esc(r.id)+'\')">Duplicate</button><button class="btn sm ghost" onclick="PRM.repPrint()">Print</button><button class="btn sm ghost" onclick="PRM.repCopyId(\''+esc(r.id)+'\')">Copy ID</button>',lg:true});}
function repExportPDF(id){var r=d1RepById(id);if(!r)return;var lines=["Report "+r.id,r.type||"", "Case "+(r.caseId||""),"Generated "+(r.generated||""),"Operator "+(r.operator||""),"Target "+(r.target||""),"Method "+(r.method||""),"Hash "+(r.hash||"")];try{Svc().download(r.id+".pdf",Svc().toPDF((r.type||"Report")+" - "+r.id,lines),"application/pdf");}catch(e){}toast("success","Exported",r.id+".pdf");}
function repExportCSV(id){var r=d1RepById(id);if(!r)return;var rows=[["Field","Value"],["Report ID",r.id],["Type",r.type],["Case",r.caseId],["Generated",r.generated],["Operator",r.operator],["Status",r.status],["Target",r.target],["Method",r.method],["Hash",r.hash]];try{Svc().download(r.id+".csv",Svc().toCSV(rows),"text/csv");}catch(e){}toast("success","Exported",r.id+".csv");}
function repDuplicate(id){var r=d1RepById(id);if(!r)return;var nid=d1NextReportId();var hsh=r.hash||"";try{hsh=Svc().stableHash(nid+r.type+r.caseId+"dup",64);}catch(e){}var cp={id:nid,type:r.type,caseId:r.caseId,generated:"",operator:S.operator||r.operator||"R. Patil",status:"Completed",target:r.target,method:r.method,hash:hsh,format:r.format||"PDF",secs:Object.assign({},r.secs||S.reports.secs||{})};try{cp.generated=Svc().nowStamp();}catch(e){cp.generated=r.generated;}try{Svc().reportService.generate(cp);}catch(e){}toast("success","Duplicated",id+" → "+nid);persist();try{render();}catch(e){}repPreview(nid);}
function repPrint(){try{window.print();}catch(e){toast("info","Print","Use browser print for the A4 preview.");}}
function repCopyId(id){copyText(id,"Report ID");}
Object.assign(window.PRM,{renderAudit:renderAudit,auditSearch:auditSearch,auditFilter:auditFilter,auditClear:auditClear,auditSort:auditSort,auditOpen:auditOpen,auditCopyHash:auditCopyHash,auditExport:auditExport,auditGotoCase:auditGotoCase,auditGotoEv:auditGotoEv,auditGotoRep:auditGotoRep,renderReports:renderReports,repOpenWizard:repOpenWizard,repWizType:repWizType,repWizCase:repWizCase,repWizFmt:repWizFmt,repWizSec:repWizSec,repWizGoto:repWizGoto,repWizNext:repWizNext,repWizBack:repWizBack,repWizGenerate:repWizGenerate,repPreview:repPreview,repExportPDF:repExportPDF,repExportCSV:repExportCSV,repDuplicate:repDuplicate,repPrint:repPrint,repCopyId:repCopyId});
/*CHUNK_D1_OK*/
/* ===== chunk_d2.js ===== */
/* PARMAAN chunk_d2 — devices / activity / settings (runs inside existing IIFE) */
var d2PendingCancel = null;
function d2Devs() {
  var base = [];
  try { base = Data().DEVICES.slice(); } catch (e) { base = []; }
  var ex = [];
  try { ex = lsGet("extraDevices", []); } catch (e2) { ex = []; }
  if (!ex) ex = [];
  var seen = {};
  var i;
  for (i = 0; i < base.length; i++) seen[base[i].id] = 1;
  for (i = 0; i < ex.length; i++) { if (ex[i] && ex[i].id && !seen[ex[i].id]) { base.push(ex[i]); seen[ex[i].id] = 1; } }
  return base;
}
function d2DevById(id) {
  var all = d2Devs();
  for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
  return null;
}
function d2Dot(d) {
  if (!d) return '<span class="st-dot info"></span>';
  if (d.status === "ready") return '<span class="st-dot ok"></span>';
  return '<span class="st-dot warn"></span>';
}
function d2Badge(o) {
  if (!o) return '<span class="badge">—</span>';
  if (o.paused) return '<span class="badge warn">Paused</span>';
  if (o.status === "running") return '<span class="badge info">Running</span>';
  if (o.status === "queued") return '<span class="badge">Queued</span>';
  if (o.status === "completed") return '<span class="badge ok">Completed</span>';
  if (o.status === "cancelled") return '<span class="badge bad">Cancelled</span>';
  if (o.status === "failed") return '<span class="badge bad">Failed</span>';
  return '<span class="badge">' + esc(o.status || "") + '</span>';
}
function d2Health(h) {
  var v = (h == null ? 100 : Number(h));
  if (isNaN(v)) v = 100;
  var cls = v >= 90 ? " ok" : v >= 70 ? " warn" : "";
  return '<div style="min-width:110px"><div class="prog' + cls + '"><i style="width:' + Math.max(0, Math.min(100, v)) + '%"></i></div><div class="dim mono" style="font-size:11px;margin-top:3px">' + v + '%</div></div>';
}
function renderDevices() {
  var q = String((S.devices && S.devices.search) || "").toLowerCase();
  var all = d2Devs();
  var list = all.filter(function (d) {
    if (!q) return true;
    var hay = ((d.name || "") + " " + (d.path || "") + " " + (d.model || "") + " " + (d.serial || "") + " " + (d.interface || "") + " " + (d.capacity || "") + " " + (d.filesystem || "")).toLowerCase();
    return hay.indexOf(q) >= 0;
  });
  var head = '<div class="page-head"><div><div class="eyebrow">System · Devices</div><h1>Connected Devices</h1><p>' + all.length + ' targets · click a row for the inspector · Start Erase preselects the workflow.</p></div><div class="sp"><button class="btn sm" onclick="PRM.d2DevRefresh()">Refresh</button><button class="btn primary sm" onclick="PRM.d2DevDetectModal()">Detect Device</button></div></div>';
  var bar = '<div class="toolbar"><input class="inp" id="d2-dev-q" placeholder="Search name, path, model, serial…" value="' + esc((S.devices && S.devices.search) || "") + '" oninput="PRM.d2DevSearch(this.value)"><span class="muted" style="font-size:12.5px">' + list.length + ' of ' + all.length + '</span><span style="flex:1"></span><span class="badge' + (S.mode === "expert" ? " acc" : "") + '">' + (S.mode === "expert" ? "Expert Mode" : "Guided") + '</span></div>';
  if (S.devices && S.devices.loading) {
    return head + bar + '<div class="grid c2"><div class="skel" style="height:64px"></div><div class="skel" style="height:64px"></div></div><div style="height:12px"></div><div class="skel" style="height:220px"></div>';
  }
  var body = "";
  if (!all.length) {
    body = emptyState("◈", "No devices detected.", "Connect media or use Detect Device to add a mock target.", "Detect Device", "PRM.d2DevDetectModal()");
  } else if (!list.length) {
    body = emptyState("◈", "No matches.", "Try a different search or detect a new device.", "Clear search", "PRM.d2DevClearSearch()");
  } else {
    body = '<div class="tbl-wrap"><table class="tbl" style="min-width:1020px"><thead><tr><th></th><th>Device</th><th>Model</th><th>Serial</th><th>Interface</th><th>Capacity</th><th>Filesystem</th><th>Mount</th><th>Health</th><th style="text-align:right">⋯</th></tr></thead><tbody>' + list.map(function (d) {
      return '<tr onclick="PRM.d2DevOpen(\'' + esc(d.id) + '\')"><td>' + d2Dot(d) + '</td><td><b>' + esc(d.name) + '</b><div class="dim mono" style="font-size:11px">' + esc(d.path || "") + '</div></td><td class="muted">' + esc(d.model || "") + '</td><td class="mono" style="font-size:11.5px">' + esc(d.serial || "") + '</td><td>' + esc(d.interface || "") + '</td><td style="white-space:nowrap">' + esc(d.capacity || "") + '</td><td>' + esc(d.filesystem || "") + '</td><td class="muted" style="font-size:12px">' + esc(d.mounted || "—") + '</td><td>' + d2Health(d.health) + '</td><td><div class="row-actions"><button class="btn xs ghost" onclick="event.stopPropagation();PRM.d2DevOpen(\'' + esc(d.id) + '\')">Details</button><button class="icon-btn" title="Row actions" onclick="event.stopPropagation();PRM.d2DevMenu(\'' + esc(d.id) + '\',event)">⋯</button></div></td></tr>';
    }).join("") + '</tbody></table></div><p class="dim" style="font-size:12px;margin:10px 2px">Mount and health are mock values until hardware agents connect.</p>';
  }
  return head + bar + body;
}
function d2DevRefresh() {
  if (S.devices.loading) return;
  S.devices.loading = true;
  try { render(); } catch (e) {}
  setTimeout(function () {
    S.devices.loading = false;
    try { render(); } catch (e2) {}
    toast("success", "Devices refreshed", d2Devs().length + " connected · 0 errors (mock).");
  }, 800);
}
function d2DevSearch(v) {
  S.devices.search = String(v == null ? "" : v);
  try { render(); } catch (e) {}
  try { var el = document.getElementById("d2-dev-q"); if (el) { el.focus(); var L = el.value.length; try { el.setSelectionRange(L, L); } catch (e2) {} } } catch (e3) {}
}
function d2DevClearSearch() { S.devices.search = ""; try { render(); } catch (e) {} }
function d2DevDetectModal() {
  openModal({
    title: "Detect device", sub: "Mock detection · stays local, no backend",
    body: '<label class="f">Device name</label><input class="inp" id="d2-dd-name" placeholder="e.g. Kingston DataTraveler"><div style="height:10px"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><label class="f">Model</label><input class="inp" id="d2-dd-model" placeholder="e.g. Kingston DT 64GB"></div><div><label class="f">Device path</label><input class="inp mono" id="d2-dd-path" placeholder="/dev/sdc"></div></div><div style="height:10px"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><label class="f">Serial</label><input class="inp mono" id="d2-dd-serial" placeholder="e.g. KDT64GX812"></div><div><label class="f">Capacity</label><input class="inp" id="d2-dd-cap" placeholder="e.g. 64 GB"></div></div><div style="height:10px"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><label class="f">Interface</label><select class="sel" id="d2-dd-if" style="width:100%"><option>USB 3.1</option><option>NVMe</option><option>SATA III</option><option>E01 image</option></select></div><div><label class="f">Filesystem</label><select class="sel" id="d2-dd-fs" style="width:100%"><option>exFAT</option><option>NTFS</option><option>EXT4</option><option>Unknown</option></select></div></div>',
    footer: '<button class="btn ghost sm" onclick="PRM.d2DevDetectNo()">Cancel</button><button class="btn primary sm" onclick="PRM.d2DevDetectSubmit()">Add device</button>'
  });
}
function d2DevDetectNo() { try { closeModal(); } catch (e) {} }
function d2DevDetectSubmit() {
  function val(id, fb) { var el = document.getElementById(id); var v = el ? String(el.value || "").trim() : ""; return v || fb; }
  var n = val("d2-dd-name", "External Media " + (d2Devs().length + 1));
  var id = "dev-extra-" + (Date.now() % 100000);
  var d = { id: id, name: n, model: val("d2-dd-model", n), path: val("d2-dd-path", "/dev/sdc"), serial: val("d2-dd-serial", "MOCK" + (Date.now() % 100000)), interface: val("d2-dd-if", "USB 3.1"), type: "USB Flash", capacity: val("d2-dd-cap", "64 GB"), filesystem: val("d2-dd-fs", "exFAT"), partition: "MBR", smart: "Good", mounted: "Not mounted", rw: "Read/Write", status: "ready", statusLabel: "Ready", health: 100, supportsCrypto: false, notes: "Manually detected mock target." };
  try {
    var ex = lsGet("extraDevices", []) || [];
    ex.unshift(d); lsSet("extraDevices", ex);
  } catch (e) {}
  try { if (Data().DEVICES) { var f = false; for (var i = 0; i < Data().DEVICES.length; i++) if (Data().DEVICES[i].id === id) f = true; if (!f) Data().DEVICES.push(d); } } catch (e2) {}
  try { closeModal(); } catch (e3) {}
  toast("success", "Device detected", d.name + " · " + d.serial);
  try { render(); } catch (e4) {}
}
function d2DevOpen(id) {
  var d = d2DevById(id);
  if (!d) { toast("error", "Device unavailable", "It may have been disconnected."); return; }
  S.devices.openId = id;
  var expert = S.mode === "expert";
  var kv = '<dl><div class="kv"><dt>Model</dt><dd>' + esc(d.model || d.name) + '</dd></div><div class="kv"><dt>Device path</dt><dd class="mono">' + esc(d.path || "—") + '</dd></div><div class="kv"><dt>Serial</dt><dd class="mono">' + esc(d.serial || "—") + '</dd></div><div class="kv"><dt>Interface</dt><dd>' + esc(d.interface || "—") + '</dd></div><div class="kv"><dt>Capacity</dt><dd>' + esc(d.capacity || "—") + '</dd></div><div class="kv"><dt>Filesystem</dt><dd>' + esc(d.filesystem || "—") + '</dd></div>';
  if (expert) {
    kv += '<div class="kv"><dt>Partition</dt><dd>' + esc(d.partition || "—") + '</dd></div><div class="kv"><dt>SMART</dt><dd>' + esc(d.smart || "—") + '</dd></div><div class="kv"><dt>Mounted</dt><dd>' + esc(d.mounted || "—") + '</dd></div><div class="kv"><dt>Access</dt><dd>' + esc(d.rw || "—") + '</dd></div><div class="kv"><dt>Health</dt><dd>' + esc(d.health != null ? d.health + "%" : "—") + '</dd></div><div class="kv"><dt>Type</dt><dd>' + esc(d.type || "—") + '</dd></div>';
  } else {
    kv += '<div class="kv"><dt>Status</dt><dd>' + esc(d.statusLabel || d.status || "—") + '</dd></div>';
  }
  kv += '<div class="kv"><dt>Notes</dt><dd>' + esc(d.notes || "—") + '</dd></div></dl>';
  if (!expert) kv += '<p class="dim" style="font-size:12px">Guided view — Expert Mode reveals SMART, mount and partition detail.</p>';
  else kv += '<label class="f">Raw JSON (expert)</label><div class="log" style="max-height:150px;white-space:pre-wrap">' + esc(JSON.stringify(d, null, 2)) + '</div>';
  openDrawer({
    title: d.name || d.id, sub: d.id + " · " + (d.serial || ""),
    body: kv + '<div style="margin-top:10px">' + d2Health(d.health) + '</div>',
    footer: '<button class="btn sm primary" onclick="PRM.d2DevStartErase(\'' + esc(d.id) + '\')">Start Erase</button><button class="btn sm" onclick="PRM.d2DevStartRecovery(\'' + esc(d.id) + '\')">Start Recovery</button><button class="btn sm ghost" onclick="PRM.d2DevAnalyze(\'' + esc(d.id) + '\')">Analyze</button>'
  });
}
function d2DevMenu(id, ev) {
  var d = d2DevById(id);
  var x = window.innerWidth - 250, y = 160;
  try { if (ev && ev.clientX != null) { x = Math.max(8, Math.min(window.innerWidth - 240, ev.clientX - 40)); y = Math.max(8, Math.min(window.innerHeight - 280, ev.clientY + 8)); } } catch (e) {}
  overlay.menu = {
    x: x, y: y, title: d ? d.name : id, items: [
      { label: "View details", icon: "devices", fn: "PRM.d2DevOpen('" + esc(id) + "')" },
      { label: "Start Erase", icon: "erase", fn: "PRM.d2DevStartErase('" + esc(id) + "')" },
      { label: "Start Recovery", icon: "recover", fn: "PRM.d2DevStartRecovery('" + esc(id) + "')" },
      { label: "Analyze SMART", icon: "activity", fn: "PRM.d2DevAnalyze('" + esc(id) + "')" },
      { head: "More" },
      { label: "Copy serial", icon: "verify", fn: "PRM.d2DevCopySerial('" + esc(id) + "')" }
    ]
  };
  renderOverlays();
}
function d2DevStartErase(id) {
  var d = d2DevById(id);
  try { overlay.menu = null; } catch (e) {}
  try { S.erase.deviceId = id; S.erase.step = 1; S.erase.confirm = false; S.erase.typeConfirm = ""; persist(); } catch (e2) {}
  try { closeDrawer(); } catch (e3) {}
  try { renderOverlays(); } catch (e4) {}
  toast("success", "Device selected", (d ? d.name : id) + " · preselected for erasure.");
  nav("/workspace/erase");
}
function d2DevStartRecovery(id) {
  var d = d2DevById(id);
  try { overlay.menu = null; } catch (e) {}
  try { S.recover.sourceId = id; S.recover.step = 1; persist(); } catch (e2) {}
  try { closeDrawer(); } catch (e3) {}
  try { renderOverlays(); } catch (e4) {}
  toast("success", "Source selected", (d ? d.name : id) + " · preselected for recovery.");
  nav("/workspace/recover");
}
function d2DevAnalyze(id) {
  var d = d2DevById(id);
  if (!d) return;
  try { overlay.menu = null; renderOverlays(); } catch (e) {}
  openModal({
    title: "SMART analysis", sub: (d.name || id) + " · " + (d.serial || ""),
    body: '<dl><div class="kv"><dt>Health</dt><dd>' + esc(d.health != null ? d.health + "%" : "—") + '</dd></div><div class="kv"><dt>SMART</dt><dd>' + esc(d.smart || "—") + '</dd></div><div class="kv"><dt>Interface</dt><dd>' + esc(d.interface || "—") + '</dd></div><div class="kv"><dt>Filesystem</dt><dd>' + esc(d.filesystem || "—") + '</dd></div></dl>' + d2Health(d.health) + '<div style="height:10px"></div><div class="ok-box">Mock analysis · no host SMART command executed. Reallocated-sector growth: 0.</div>',
    footer: '<button class="btn ghost sm" onclick="PRM.d2DevDetectNo()">Close</button><button class="btn primary sm" onclick="PRM.d2DevStartErase(\'' + esc(d.id) + '\')">Start Erase</button>'
  });
}
function d2DevCopySerial(id) {
  var d = d2DevById(id);
  try { overlay.menu = null; renderOverlays(); } catch (e) {}
  if (d && d.serial) copyText(d.serial, "Device serial");
  else toast("warning", "No serial", "Nothing to copy.");
}
/* ---------- activity ---------- */
function d2Ops() { try { return Svc().eraseService.all(); } catch (e) { return []; } }
function d2OpById(id) { var a = d2Ops(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
function d2Counts() {
  var a = d2Ops();
  var c = { running: 0, completed: 0, failed: 0, queued: 0 };
  for (var i = 0; i < a.length; i++) {
    var s = a[i].status;
    if (s === "running") c.running++;
    else if (s === "completed") c.completed++;
    else if (s === "failed" || s === "cancelled") c.failed++;
    else if (s === "queued") c.queued++;
    else if (a[i].paused) c.running++;
  }
  return c;
}
function renderActivity() {
  var tab = (S.activity && S.activity.tab) || "running";
  var c = d2Counts();
  var all = d2Ops();
  var list = all.filter(function (o) {
    if (tab === "running") return o.status === "running";
    if (tab === "completed") return o.status === "completed";
    if (tab === "failed") return o.status === "failed" || o.status === "cancelled";
    if (tab === "queued") return o.status === "queued";
    return true;
  });
  var head = '<div class="page-head"><div><div class="eyebrow">System · Activity</div><h1>Activity</h1><p>Running, queued, completed and failed operations · open any card for logs and hashes.</p></div><div class="sp"><button class="btn sm" onclick="PRM.d2ActChooseDevice()">Devices</button><button class="btn primary sm" onclick="PRM.newOperation()">New Operation</button></div></div>';
  var tabs = '<div class="seg" style="margin-bottom:12px"><button class="' + (tab === "running" ? "on" : "") + '" onclick="PRM.d2ActTab(\'running\')">Running · ' + c.running + '</button><button class="' + (tab === "completed" ? "on" : "") + '" onclick="PRM.d2ActTab(\'completed\')">Completed · ' + c.completed + '</button><button class="' + (tab === "failed" ? "on" : "") + '" onclick="PRM.d2ActTab(\'failed\')">Failed · ' + c.failed + '</button><button class="' + (tab === "queued" ? "on" : "") + '" onclick="PRM.d2ActTab(\'queued\')">Queued · ' + c.queued + '</button></div>';
  var errCard = '<div class="op-card" style="border-color:rgba(224,96,94,.45)"><span class="st-dot bad"></span><div style="flex:1;min-width:220px"><b>Device disconnected</b> <span class="badge bad">Error · AUD-2031</span><div class="dim mono" style="font-size:11.5px;margin:4px 0">Seagate Barracuda · dev-hdd-03 · media no longer available · retry suggested</div><div class="muted" style="font-size:12.5px">The selected media is no longer available.</div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn xs" onclick="PRM.d2ActRetryDisc()">Retry</button><button class="btn xs ghost" onclick="PRM.d2ActChooseDevice()">Choose Another Device</button></div></div>';
  var body = "";
  if (!list.length) {
    var msgs = { running: ["No running operations.", "Start an erase or recovery run. Live progress appears here."], completed: ["No completed operations yet.", "Finished runs land here with verification hashes."], failed: ["No failed operations.", "Cancelled and failed runs appear here with retry."], queued: ["Queue is empty.", "Re-queued operations wait here before execution."] };
    var m = msgs[tab] || msgs.running;
    var btn = tab === "queued" ? "" : '<button class="btn primary sm" onclick="PRM.newOperation()">New Operation</button>';
    body = '<div class="empty"><div class="eic">◈</div><h3>' + esc(m[0]) + '</h3><p>' + esc(m[1]) + '</p>' + btn + '</div>';
  } else {
    body = '<div style="display:grid;gap:10px">' + list.map(function (o) {
      var pct = o.progress || 0;
      var meta = esc(o.device || "") + ' · ' + esc(o.method || o.scan || o.title || "") + ' · by ' + esc(o.operator || "—") + ' · elapsed ' + esc(o.elapsed || 0) + 's · ETA ' + esc(o.eta || "—");
      var btns = '<button class="btn xs" onclick="PRM.d2ActOpen(\'' + esc(o.id) + '\')">Open</button>';
      if (o.status === "running" && !o.paused) btns += '<button class="btn xs ghost" onclick="PRM.d2ActPause(\'' + esc(o.id) + '\')">Pause</button><button class="btn xs danger" onclick="PRM.d2ActCancelAsk(\'' + esc(o.id) + '\')">Cancel</button>';
      else if (o.paused || (o.status === "running" && o.paused)) btns += '<button class="btn xs primary" onclick="PRM.d2ActResume(\'' + esc(o.id) + '\')">Resume</button><button class="btn xs danger" onclick="PRM.d2ActCancelAsk(\'' + esc(o.id) + '\')">Cancel</button>';
      else if (o.status === "queued") btns += '<button class="btn xs danger" onclick="PRM.d2ActCancelAsk(\'' + esc(o.id) + '\')">Cancel</button>';
      else btns += '<button class="btn xs" onclick="PRM.d2ActRetry(\'' + esc(o.id) + '\')">Retry</button>';
      return '<div class="op-card"><div class="ring">' + ringSVG(pct, 64) + '</div><div style="flex:1;min-width:220px"><b>' + esc(o.title || o.kind) + ' · ' + esc(o.id) + '</b><div class="dim mono" style="font-size:11.5px;margin:3px 0 8px">' + meta + '</div><div class="prog"><i style="width:' + Math.min(100, pct) + '%"></i></div></div><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' + d2Badge(o) + btns + '</div></div>';
    }).join("") + '</div>';
  }
  return head + tabs + errCard + '<div style="height:12px"></div>' + body;
}
function d2ActTab(t) { S.activity.tab = t; persist(); render(); }
function d2ActOpen(id) {
  var o = d2OpById(id);
  if (!o) { toast("error", "Operation unavailable", "It may have finished already."); return; }
  var pct = o.progress || 0;
  var hash = o.verifyHash || "";
  var hashRow = hash ? '<div class="kv"><dt>Verify hash</dt><dd class="mono" style="word-break:break-all">' + esc(hash) + '</dd></div>' : '<div class="kv"><dt>Verify hash</dt><dd class="dim">Available after verified completion.</dd></div>';
  var logs = (o.logs || []).slice(-8).map(function (l) { return '<div>› ' + esc(l) + '</div>'; }).join("") || '<div class="dim">No log entries yet.</div>';
  var foot = '<button class="btn sm" onclick="PRM.d2ActOpenCopy(\'' + esc(o.id) + '\')">Copy hash</button>';
  if (o.status === "running" && !o.paused) foot += '<button class="btn sm" onclick="PRM.d2ActPause(\'' + esc(o.id) + '\')">Pause</button><button class="btn sm danger" onclick="PRM.d2ActCancelAsk(\'' + esc(o.id) + '\')">Cancel</button>';
  else if (o.paused) foot += '<button class="btn sm primary" onclick="PRM.d2ActResume(\'' + esc(o.id) + '\')">Resume</button><button class="btn sm danger" onclick="PRM.d2ActCancelAsk(\'' + esc(o.id) + '\')">Cancel</button>';
  else if (o.status === "queued") foot += '<button class="btn sm danger" onclick="PRM.d2ActCancelAsk(\'' + esc(o.id) + '\')">Cancel</button>';
  else foot += '<button class="btn sm" onclick="PRM.d2ActRetry(\'' + esc(o.id) + '\')">Retry</button>';
  openDrawer({
    title: (o.title || o.kind) + " · " + o.id, sub: (o.device || "") + " · " + (o.status || "") + (o.paused ? " · paused" : ""),
    body: '<div class="ring-wrap">' + ringSVG(pct, 84) + '<div><b>' + esc(o.device || "") + '</b><div class="dim mono" style="font-size:11.5px;margin-top:4px">' + esc(o.method || o.scan || "") + ' · ' + esc(o.operator || "") + ' · case ' + esc(o.caseId || "—") + '</div><div style="margin-top:8px">' + d2Badge(o) + '</div></div></div><div style="height:10px"></div><div class="prog"><i style="width:' + Math.min(100, pct) + '%"></i></div><div style="height:10px"></div><dl>' + hashRow + '<div class="kv"><dt>Elapsed / ETA</dt><dd>' + esc(o.elapsed || 0) + 's / ' + esc(o.eta || "—") + '</dd></div><div class="kv"><dt>Updated</dt><dd class="mono">' + esc(o.updated || "") + '</dd></div></dl><label class="f">Logs</label><div class="log">' + logs + '</div>',
    footer: foot
  });
}
function d2ActOpenCopy(id) {
  var o = d2OpById(id);
  if (o && o.verifyHash) copyText(o.verifyHash, "Operation hash");
  else if (o) copyText(o.id + " · " + (o.device || "") + " · " + (o.status || ""), "Operation reference");
}
function d2ActPause(id) {
  var o = d2OpById(id);
  if (!o) return;
  try { if (o.kind === "recovery") Svc().recoveryService.pause(id); else Svc().eraseService.pause(id); } catch (e) {}
  toast("info", "Operation paused", id + " · " + (o.progress || 0) + "%");
  persist(); render();
}
function d2ActResume(id) {
  var o = d2OpById(id);
  if (!o) return;
  try { if (o.kind === "recovery") Svc().recoveryService.resume(id); else Svc().eraseService.resume(id); } catch (e) {}
  toast("success", "Operation resumed", id);
  persist(); render();
}
function d2ActDoCancel(id) {
  var o = d2OpById(id);
  if (!o) return;
  try { if (o.kind === "recovery") Svc().recoveryService.cancel(id); else Svc().eraseService.cancel(id); } catch (e) {}
  toast("info", "Operation cancelled", id + " · left for re-verify.");
  persist(); render();
}
function d2ActCancelAsk(id) {
  var o = d2OpById(id);
  if (!o) return;
  if (S.settings && S.settings.confirmDestructive) {
    d2PendingCancel = id;
    openModal({ title: "Cancel operation?", sub: id + " · partial work is kept for review", body: '<div class="warn-box">Cancelling stops the run. The target is left untouched pending re-verify. This entry is audit-logged.</div>', footer: '<button class="btn ghost sm" onclick="PRM.d2ActCancelNo()">Keep running</button><button class="btn solid-danger sm" onclick="PRM.d2ActCancelYes()">Confirm Cancel</button>' });
  } else d2ActDoCancel(id);
}
function d2ActCancelNo() { d2PendingCancel = null; try { closeModal(); } catch (e) {} }
function d2ActCancelYes() { var id = d2PendingCancel; d2PendingCancel = null; try { closeModal(); } catch (e) {} if (id) d2ActDoCancel(id); }
function d2ActRetry(id) {
  var o = d2OpById(id);
  if (!o) return;
  try { if (o.kind === "recovery") Svc().recoveryService.retry(id); else Svc().eraseService.retry(id); } catch (e) {}
  toast("success", "Re-queued", id);
  persist(); render();
}
function d2ActRetryDisc() { toast("info", "Retrying connection", "Probing dev-hdd-03 · still unavailable (mock)."); }
function d2ActChooseDevice() { nav("/workspace/devices"); }
/* ---------- settings ---------- */
function d2RowTgl(key, title, desc) {
  var on = !!(S.settings && S.settings[key]);
  return '<div class="set-row"><div><b>' + esc(title) + '</b><small>' + esc(desc) + '</small></div><button class="toggle" aria-checked="' + (on ? "true" : "false") + '" onclick="PRM.d2Toggle(\'' + key + '\')" aria-label="' + esc(title) + '"></button></div>';
}
function d2RowSel(key, title, desc, opts) {
  var cur = S.settings ? S.settings[key] : "";
  var o = opts.map(function (v) { return '<option value="' + esc(v) + '"' + (String(cur) === String(v) ? " selected" : "") + '>' + esc(v) + '</option>'; }).join("");
  return '<div class="set-row"><div><b>' + esc(title) + '</b><small>' + esc(desc) + '</small></div><select class="sel" onchange="PRM.d2Set(\'' + key + '\',this.value)">' + o + '</select></div>';
}
function renderSettings() {
  var tab = S.settingsTab || "general";
  var tabs = [["general", "General"], ["appearance", "Appearance"], ["language", "Language"], ["security", "Security"], ["reports", "Reports"], ["storage", "Storage"], ["advanced", "Advanced"]];
  var head = '<div class="page-head"><div><div class="eyebrow">System · Settings</div><h1>Settings</h1><p>Workspace preferences · every change saves locally with a toast.</p></div><div class="sp"><button class="btn sm" onclick="PRM.d2DiagModal()">Diagnostics</button><button class="btn sm ghost" onclick="PRM.d2ClearCache()">Clear cache</button></div></div>';
  var bar = '<div class="set-tabs">' + tabs.map(function (x) { return '<button class="' + (tab === x[0] ? "on" : "") + '" onclick="PRM.d2SetTab(\'' + x[0] + '\')">' + x[1] + '</button>'; }).join("") + '</div>';
  var b = "";
  if (tab === "general") {
    var roles = ["clerk", "investigator", "admin", "expert"];
    var seg = '<div class="seg">' + roles.map(function (r) { return '<button class="' + (S.role === r ? "on" : "") + '" onclick="PRM.d2SetRole(\'' + r + '\')">' + r + '</button>'; }).join("") + '</div>';
    b = '<div class="panel">' + d2RowSel("defWorkspace", "Default workspace", "Active workspace for this prototype.", ["Forensics Workspace"]) + d2RowSel("defStart", "Default start page", "Landing view after Open Workspace.", ["Overview", "Erase", "Recover", "Evidence", "Verify", "Reports"]) + d2RowTgl("confirmDestructive", "Confirm destructive actions", "Require confirmation before cancel or erase.") + '<div class="set-row"><div><b>Role (demo)</b><small>Clerk limited · investigator standard · admin system · expert all.</small></div>' + seg + '</div></div>';
  } else if (tab === "appearance") {
    b = '<div class="panel">' + d2RowSel("theme", "Theme", "Dark is the supported prototype theme.", ["Dark", "System"]) + d2RowSel("density", "Density", "Compact tightens tables and cards.", ["Comfortable", "Compact"]) + d2RowTgl("reducedMotion", "Reduced motion", "Minimize animations and transitions.") + '</div>';
  } else if (tab === "language") {
    var langs = [];
    try { langs = Data().LANGS; } catch (e) { langs = [{ id: "en", label: "English" }]; }
    var opts = langs.map(function (l) { return '<option value="' + esc(l.id) + '"' + (S.lang === l.id ? " selected" : "") + '>' + esc(l.label) + '</option>'; }).join("");
    b = '<div class="panel"><div class="set-row"><div><b>Interface language</b><small>Stored locally · key labels translate.</small></div><select class="sel" onchange="PRM.d2SetLang(this.value)">' + opts + '</select></div>' + d2RowTgl("voice", "Voice assistance", "Enable read-aloud in Guide.") + '<div class="set-row"><div><b>Offline language pack</b><small>Mock bundle · staged locally.</small></div><button class="btn sm" onclick="PRM.d2Pack()">Download pack</button></div></div>';
  } else if (tab === "security") {
    b = '<div class="panel">' + d2RowSel("sessionTimeout", "Session timeout", "Auto-lock after inactivity (mock).", ["15 min", "30 min", "60 min", "Never"]) + d2RowTgl("confirmDestructive", "Require confirmation", "Destructive operations need explicit confirm.") + d2RowTgl("clipboardWarn", "Clipboard warning", "Warn when copying sensitive hashes.") + '<div class="set-row"><div><b>Lock workspace</b><small>Full-screen prototype lock.</small></div><button class="btn sm" onclick="PRM.d2LockModal()">Lock Workspace</button></div></div>';
  } else if (tab === "reports") {
    b = '<div class="panel">' + d2RowSel("defFormat", "Default format", "Preferred export for new reports.", ["PDF", "CSV"]) + d2RowTgl("incHashes", "Include verification hashes", "Embed SHA-256 in generated reports.") + d2RowTgl("incOperator", "Include operator information", "Attach operator and role to reports.") + '<div class="set-row"><div><b>Certificate prefix</b><small>Prepended to sanitization IDs.</small></div><input class="inp mono" id="d2-cert-prefix" style="max-width:220px" value="' + esc((S.settings && S.settings.certPrefix) || "PRM-SAN-2026-") + '" onchange="PRM.d2SetStr(\'certPrefix\',\'d2-cert-prefix\')"></div></div>';
  } else if (tab === "storage") {
    b = '<div class="panel">' + d2RowSel("evLocation", "Evidence location", "Where vault bytes are staged (mock).", ["Local encrypted vault", "External drive", "Network share"]) + '<div class="set-row"><div><b>Database status</b><small>Local prototype store · connected.</small></div><span class="badge ok">Connected</span></div><div class="set-row"><div style="flex:1"><b>Storage usage</b><small>Vault 12.4 GB of 100 GB · reports 1.1 GB.</small><div class="prog" style="margin-top:8px"><i style="width:14%"></i></div></div><button class="btn sm ghost" onclick="PRM.d2ClearCache()">Clear cache</button></div></div>';
  } else {
    if (S.mode !== "expert") {
      b = '<div class="empty"><div class="eic">◈</div><h3>Advanced requires Expert Mode</h3><p>Low-level endpoints, timeouts and verbose logs are expert-gated.</p><button class="btn primary sm" onclick="PRM.d2EnableExpert()">Enable Expert</button></div>';
    } else {
      b = '<div class="panel"><div class="set-row"><div><b>Mock API endpoint</b><small>Base for future hardware agents.</small></div><input class="inp mono" id="d2-api-ep" style="max-width:260px" value="' + esc((S.settings && S.settings.apiEndpoint) || "http://localhost:8000/api") + '" onchange="PRM.d2SetStr(\'apiEndpoint\',\'d2-api-ep\')"></div>' + d2RowSel("opTimeout", "Operation timeout", "Simulated engine watchdog.", ["30s", "60s", "120s", "300s"]) + d2RowTgl("verbose", "Verbose logs", "Show raw engine lines in drawers.") + '<div class="set-row"><div><b>Developer diagnostics</b><small>State snapshot for debugging.</small></div><button class="btn sm" onclick="PRM.d2DiagModal()">Open diagnostics</button></div></div>';
    }
  }
  return head + bar + b;
}
function d2SetTab(t) { S.settingsTab = t; persist(); render(); }
function d2Set(k, v) { if (!S.settings) S.settings = {}; S.settings[k] = v; persist(); render(); toast("success", "Settings saved", k + " → " + v); }
function d2Toggle(k) { if (!S.settings) S.settings = {}; S.settings[k] = !S.settings[k]; persist(); render(); toast("success", "Settings saved", k + " " + (S.settings[k] ? "on" : "off")); }
function d2SetStr(k, elId) { var el = document.getElementById(elId); var v = el ? el.value : ""; if (!S.settings) S.settings = {}; S.settings[k] = v; persist(); render(); toast("success", "Settings saved", k + " updated."); }
function d2SetLang(v) { S.lang = v; if (!S.settings) S.settings = {}; S.settings.lang = v; persist(); var lbl = v; try { lbl = langLabel(v); } catch (e) {} toast("success", "Language changed", lbl); render(); }
function d2SetRole(r) {
  S.role = r;
  if (r === "expert") S.mode = "expert";
  persist(); render();
  toast("success", "Role switched", "Now acting as " + r + (r === "expert" ? " · expert mode on." : "."));
}
function d2EnableExpert() { S.mode = "expert"; persist(); render(); toast("success", "Expert Mode enabled", "Advanced parameters are now visible."); }
function d2LockModal() {
  openModal({ title: "Lock workspace?", sub: "Prototype lock · data stays in this browser", body: '<div class="warn-box">Locking hides the workspace until you unlock. Operations keep their mock state.</div>', footer: '<button class="btn ghost sm" onclick="PRM.d2DevDetectNo()">Cancel</button><button class="btn primary sm" onclick="PRM.d2LockConfirm()">Lock Workspace</button>' });
}
function d2LockConfirm() {
  try { closeModal(); } catch (e) {}
  try { if (typeof _aLock === "function") { _aLock(); return; } } catch (e2) {}
  try { if (window.PRM && window.PRM.lockWorkspace && String(window.PRM.lockWorkspace).indexOf("d2") < 0) { window.PRM.lockWorkspace(); return; } } catch (e3) {}
  toast("info", "Locked", "Workspace lock is unavailable in this build.");
}
function d2ClearCache() {
  try { lsSet("extraDevices", []); } catch (e) {}
  try { var arr = Data().DEVICES; for (var i = arr.length - 1; i >= 0; i--) if (arr[i].id && arr[i].id.indexOf("dev-extra-") === 0) arr.splice(i, 1); } catch (e2) {}
  S.devices.search = "";
  persist();
  toast("success", "Cache cleared", "Detected devices removed · seeds kept.");
  render();
}
function d2DiagModal() {
  var info = {};
  try { info.devices = d2Devs().length; } catch (e) { info.devices = "—"; }
  try { info.ops = d2Ops().length; } catch (e2) { info.ops = "—"; }
  try { info.evidence = Svc().evidenceService.list().length; } catch (e3) { info.evidence = "—"; }
  try { info.cases = Svc().caseService.list().length; } catch (e4) { info.cases = "—"; }
  info.mode = S.mode; info.role = S.role; info.lang = S.lang; info.route = S.route; info.settings = S.settings;
  openModal({ title: "Diagnostics", sub: "Local state snapshot · mock", body: '<div class="log" style="max-height:260px;white-space:pre-wrap">' + esc(JSON.stringify(info, null, 2)) + '</div>', footer: '<button class="btn ghost sm" onclick="PRM.d2DevDetectNo()">Close</button><button class="btn sm" onclick="PRM.d2DiagCopy()">Copy snapshot</button>' });
}
function d2DiagCopy() {
  var s = "";
  try { s = JSON.stringify({ mode: S.mode, role: S.role, lang: S.lang, route: S.route, settings: S.settings }, null, 2); } catch (e) { s = "diagnostics"; }
  copyText(s, "Diagnostics");
}
function d2Pack() { toast("success", "Language pack ready", "Offline pack staged locally (mock)."); }
function d2Copy(v, l) { copyText(v, l || "Copied"); }
Object.assign(window.PRM, { d2DevRefresh: d2DevRefresh, d2DevSearch: d2DevSearch, d2DevClearSearch: d2DevClearSearch, d2DevDetectModal: d2DevDetectModal, d2DevDetectNo: d2DevDetectNo, d2DevDetectSubmit: d2DevDetectSubmit, d2DevOpen: d2DevOpen, d2DevMenu: d2DevMenu, d2DevStartErase: d2DevStartErase, d2DevStartRecovery: d2DevStartRecovery, d2DevAnalyze: d2DevAnalyze, d2DevCopySerial: d2DevCopySerial, d2ActTab: d2ActTab, d2ActOpen: d2ActOpen, d2ActOpenCopy: d2ActOpenCopy, d2ActPause: d2ActPause, d2ActResume: d2ActResume, d2ActCancelAsk: d2ActCancelAsk, d2ActCancelNo: d2ActCancelNo, d2ActCancelYes: d2ActCancelYes, d2ActRetry: d2ActRetry, d2ActRetryDisc: d2ActRetryDisc, d2ActChooseDevice: d2ActChooseDevice, d2SetTab: d2SetTab, d2Set: d2Set, d2Toggle: d2Toggle, d2SetStr: d2SetStr, d2SetLang: d2SetLang, d2SetRole: d2SetRole, d2EnableExpert: d2EnableExpert, d2LockModal: d2LockModal, d2LockConfirm: d2LockConfirm, d2ClearCache: d2ClearCache, d2DiagModal: d2DiagModal, d2DiagCopy: d2DiagCopy, d2Pack: d2Pack, d2Copy: d2Copy });
/*CHUNK_D2_OK*/
})();
