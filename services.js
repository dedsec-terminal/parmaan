/* PARMAAN — service layer. Mock-first for the prototype; every method mirrors the
   FastAPI contract in backend/main.py so it can be swapped to fetch() without
   changing callers. Endpoints: /api/devices /api/methods/* /api/jobs/* /api/vault
   /api/audit /api/reports/{id}.pdf|.csv */
(function () {
  "use strict";

  var LS_PREFIX = "prm_";
  function lsGet(k, fb) { try { var v = localStorage.getItem(LS_PREFIX + k); return v == null ? fb : JSON.parse(v); } catch (e) { return fb; } }
  function lsSet(k, v) { try { localStorage.setItem(LS_PREFIX + k, JSON.stringify(v)); } catch (e) {} }

  /* Deterministic pseudo-hash from a seed (stable across reloads — no Math.random in UI). */
  function stableHash(seed, len) {
    var h1 = 0x811c9dc5, h2 = 0x01000193, out = "";
    var s = String(seed);
    for (var r = 0; r < 4; r++) {
      h1 = 0x811c9dc5 ^ r; h2 = 0x01000193 ^ (r * 31);
      for (var i = 0; i < s.length; i++) { h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619) >>> 0; h2 = Math.imul(h2 ^ (s.charCodeAt(i) + r), 2246822519) >>> 0; }
      out += ("0000000" + h1.toString(16)).slice(-8) + ("0000000" + h2.toString(16)).slice(-8);
    }
    return out.slice(0, len || 64);
  }
  function shortHash(h) { return h ? (h.slice(0, 4) + "…" + h.slice(-4)) : "—"; }
  function nowStamp() {
    var d = new Date();
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  }
  function uid(prefix) {
    var n = lsGet("seq", 100);
    lsSet("seq", n + 1);
    return prefix + "-" + String(n) + Math.floor(((Date.now() / 1000) % 90) + 10);
  }

  /* Best-effort FastAPI probe (kept compatible; falls back silently offline). */
  function apiGet(path) {
    return fetch(path, { headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error("api " + r.status); return r.json(); })
      .catch(function () { return null; });
  }

  var deviceService = {
    list: function () { return Promise.resolve(PRM_DATA.DEVICES.slice()); },
    listLive: function () { return apiGet("/api/devices"); },
    get: function (id) { return PRM_DATA.DEVICES.filter(function (d) { return d.id === id; })[0] || null; }
  };

  /* ---- operation engine (simulated timing, real state) ---- */
  var listeners = [];
  function emit() { listeners.forEach(function (fn) { try { fn(); } catch (e) {} }); }
  function getOps() { return lsGet("ops", []); }
  function setOps(o) { lsSet("ops", o); emit(); }
  function pushAudit(ev) {
    var a = lsGet("audit", null);
    if (!a) { a = PRM_DATA.AUDIT_SEED.slice(); }
    a.unshift(ev); lsSet("audit", a.slice(0, 120));
  }
  function pushNotif(n) {
    var list = lsGet("notifications", null) || PRM_DATA.NOTIFICATIONS_SEED.slice();
    list.unshift(n); lsSet("notifications", list.slice(0, 30));
  }

  function baseOp(o) {
    return Object.assign({ progress: 0, status: "queued", logs: [], created: nowStamp(), updated: nowStamp(), paused: false, elapsed: 0, eta: "—" }, o);
  }

  var eraseService = {
    onChange: function (fn) { listeners.push(fn); },
    list: function () { return getOps().filter(function (o) { return o.kind === "erase"; }); },
    all: getOps,
    get: function (id) { return getOps().filter(function (o) { return o.id === id; })[0] || null; },
    start: function (opts) {
      var ops = getOps();
      var op = baseOp({ id: uid("E"), kind: "erase", title: "Secure Erase", deviceId: opts.deviceId, device: (deviceService.get(opts.deviceId) || {}).name || opts.deviceId, method: opts.methodName, methodId: opts.methodId, tool: opts.tool || null, passes: opts.passes || 3, caseId: opts.caseId || "—", operator: opts.operator || "R. Patil", status: "running", progress: 1, totalTicks: 40, tick: 0, logs: ["Job queued · target locked for review"] });
      ops.unshift(op); setOps(ops);
      pushAudit({ id: uid("AUD"), ts: nowStamp(), actor: op.operator, role: "Investigator", action: "ERASURE_START", target: op.id, caseId: op.caseId, device: op.device, severity: "info", status: "running", hash: "—", detail: op.device + " · " + op.method, prevRef: "—" });
      eraseService._pump(op.id);
      return op;
    },
    _pump: function (id) {
      var timer = setInterval(function () {
        var ops = getOps();
        var op = ops.filter(function (o) { return o.id === id; })[0];
        if (!op) { clearInterval(timer); return; }
        if (op.paused || op.status === "cancelled" || op.status === "completed" || op.status === "failed") { if (op.status !== "running" && op.status !== "queued") { clearInterval(timer); } if (op.paused) return; if (op.status !== "running") { clearInterval(timer); return; } }
        op.tick += 1;
        var pct = Math.min(96, Math.round((op.tick / op.totalTicks) * 96));
        op.progress = pct; op.elapsed += 2;
        var remain = Math.max(0, Math.round(((op.totalTicks - op.tick) * 2) / 60));
        op.eta = remain < 1 ? "< 1 min" : ("~" + remain + " min");
        var phases = ["Initializing target", "Locking target", "Executing sanitization", "Verifying", "Finalizing"];
        var ph = phases[Math.min(4, Math.floor(op.tick / (op.totalTicks / 5)))];
        op.phase = ph;
        if (op.tick === 2) op.logs.push("Pre-check: SMART read · mount state confirmed · target locked");
        if (op.tick === 5) op.logs.push("Engine armed: " + (op.tool || op.method) + " · " + op.passes + " pass(es)");
        if (op.tick % 8 === 0 && op.tick < op.totalTicks - 4) op.logs.push("Pass " + Math.min(op.passes, 1 + Math.floor(op.tick / 8)) + "/" + op.passes + ": writing pattern … verifying … OK");
        if (op.tick === op.totalTicks - 4) op.logs.push("Bad-sector remap check: 0 pending · 0 reallocated growth");
        op.updated = nowStamp();
        if (op.tick >= op.totalTicks) {
          op.progress = 100; op.status = "completed"; op.completed = nowStamp(); op.phase = "Completed";
          op.verifyHash = stableHash(op.id + op.deviceId + "verify", 64);
          op.logs.push("Final verify: full-media read-back + SHA-256 spot-checks");
          op.logs.push("Post-wipe hash: " + op.verifyHash.slice(0, 24) + "…  → residual check PASS");
          op.logs.push("Certificate staged: PRM-SAN-2026-" + op.id.replace(/\D/g, "").slice(-5));
          clearInterval(timer);
          pushNotif({ id: uid("n"), title: "Erasure completed", body: op.device + " · residual PASS", ts: "Just now", route: "/workspace/erase", read: false, kind: "success" });
          pushAudit({ id: uid("AUD"), ts: nowStamp(), actor: op.operator, role: "Investigator", action: "ERASURE_COMPLETE", target: op.id, caseId: op.caseId, device: op.device, severity: "info", status: "success", hash: shortHash(op.verifyHash), detail: op.method + " · VERIFIED", prevRef: "—" });
        }
        setOps(ops);
      }, 900);
    },
    pause: function (id) { var ops = getOps(); var o = ops.filter(function (x) { return x.id === id; })[0]; if (o && o.status === "running") { o.paused = true; o.logs.push("Paused by operator at " + o.progress + "%"); setOps(ops); } },
    resume: function (id) { var ops = getOps(); var o = ops.filter(function (x) { return x.id === id; })[0]; if (o) { o.paused = false; o.logs.push("Resumed by operator"); setOps(ops); } },
    cancel: function (id) { var ops = getOps(); var o = ops.filter(function (x) { return x.id === id; })[0]; if (o) { o.status = "cancelled"; o.logs.push("Cancelled by operator — target left untouched pending re-verify"); o.updated = nowStamp(); setOps(ops); pushAudit({ id: uid("AUD"), ts: nowStamp(), actor: o.operator, role: "Investigator", action: "ERASURE_CANCELLED", target: o.id, caseId: o.caseId, device: o.device, severity: "medium", status: "warning", hash: "—", detail: "Cancelled at " + o.progress + "%", prevRef: "—" }); } },
    retry: function (id) { var ops = getOps(); var o = ops.filter(function (x) { return x.id === id; })[0]; if (o) { o.status = "running"; o.paused = false; o.tick = 0; o.progress = 1; o.logs.push("Re-queued by operator"); setOps(ops); eraseService._pump(id); } }
  };

  var recoveryService = {
    list: function () { return getOps().filter(function (o) { return o.kind === "recovery"; }); },
    get: function (id) { return getOps().filter(function (o) { return o.id === id; })[0] || null; },
    start: function (opts) {
      var ops = getOps();
      var op = baseOp({ id: uid("R"), kind: "recovery", title: "Recovery scan", deviceId: opts.deviceId, device: opts.sourceLabel || ((deviceService.get(opts.deviceId) || {}).name) || opts.deviceId, scan: opts.scanName || "Deep Recovery", scanId: opts.scanId || "deep", caseId: opts.caseId || "—", operator: opts.operator || "R. Patil", status: "running", progress: 1, totalTicks: 30, tick: 0, sector: 0, sectorsTotal: 2000000, filesFound: 0, logs: ["Source attached read-only via write-blocker"], feed: [] });
      ops.unshift(op); setOps(ops);
      pushAudit({ id: uid("AUD"), ts: nowStamp(), actor: op.operator, role: "Investigator", action: "RECOVERY_START", target: op.id, caseId: op.caseId, device: op.device, severity: "info", status: "running", hash: "—", detail: op.scan + " started", prevRef: "—" });
      recoveryService._pump(op.id);
      return op;
    },
    _pump: function (id) {
      var pool = PRM_DATA.RECOVERY_FILES;
      var timer = setInterval(function () {
        var ops = getOps();
        var op = ops.filter(function (o) { return o.id === id; })[0];
        if (!op) { clearInterval(timer); return; }
        if (op.paused) return;
        if (op.status !== "running") { clearInterval(timer); return; }
        op.tick += 1;
        op.sector = Math.min(op.sectorsTotal, Math.round((op.tick / op.totalTicks) * op.sectorsTotal));
        op.filesFound = Math.min(pool.length, Math.floor((op.tick / op.totalTicks) * pool.length) + (op.tick > 4 ? 2 : 0));
        op.progress = Math.min(96, Math.round((op.tick / op.totalTicks) * 96));
        op.elapsed += 2;
        var f = pool[(op.tick - 1) % pool.length];
        if (f && op.tick % 2 === 0) { op.feed.unshift(f.name); op.feed = op.feed.slice(0, 8); op.logs.push("Discovered: " + f.name + " · " + f.size); }
        if (op.tick === 3) op.logs.push("Phase 1/4: file-system walk … entries indexed");
        if (op.tick === 10) op.logs.push("Phase 2/4: unallocated carve (JPG/PDF/DOCX/MP4/SQLite) … hits streaming");
        if (op.tick === 20) op.logs.push("Phase 3/4: hash + timeline triage …");
        op.updated = nowStamp();
        if (op.tick >= op.totalTicks) {
          op.progress = 100; op.status = "completed"; op.completed = nowStamp(); op.filesFound = pool.length;
          op.results = pool.map(function (x) { return x.id; });
          op.logs.push("Phase 4/4: preview index built · chain-of-custody opened");
          clearInterval(timer);
          pushNotif({ id: uid("n"), title: "Recovery scan completed", body: op.device + " · " + pool.length + " files ready", ts: "Just now", route: "/workspace/recover", read: false, kind: "success" });
          pushAudit({ id: uid("AUD"), ts: nowStamp(), actor: op.operator, role: "Investigator", action: "RECOVERY_COMPLETE", target: op.id, caseId: op.caseId, device: op.device, severity: "info", status: "success", hash: shortHash(stableHash(op.id, 64)), detail: pool.length + " files · " + op.scan, prevRef: "—" });
        }
        setOps(ops);
      }, 800);
    },
    pause: function (id) { var ops = getOps(); var o = ops.filter(function (x) { return x.id === id; })[0]; if (o && o.status === "running") { o.paused = true; o.logs.push("Paused by operator"); setOps(ops); } },
    resume: function (id) { var ops = getOps(); var o = ops.filter(function (x) { return x.id === id; })[0]; if (o) { o.paused = false; o.logs.push("Resumed by operator"); setOps(ops); } },
    cancel: function (id) { var ops = getOps(); var o = ops.filter(function (x) { return x.id === id; })[0]; if (o) { o.status = "cancelled"; o.logs.push("Scan stopped by operator — partial results kept"); setOps(ops); } },
    retry: function (id) { var ops = getOps(); var o = ops.filter(function (x) { return x.id === id; })[0]; if (o) { o.status = "running"; o.paused = false; o.tick = 0; setOps(ops); recoveryService._pump(id); } }
  };

  var evidenceService = {
    list: function () { return lsGet("evidence", null) || PRM_DATA.EVIDENCE.slice(); },
    save: function (list) { lsSet("evidence", list); emit(); },
    add: function (item) { var l = evidenceService.list(); l.unshift(item); evidenceService.save(l); pushAudit({ id: uid("AUD"), ts: nowStamp(), actor: item.operator || "R. Patil", role: "Investigator", action: "VAULT_ADD", target: item.id, caseId: item.caseId, device: "—", severity: "info", status: "success", hash: item.shortHash || "—", detail: item.name + " imported", prevRef: "—" }); return item; },
    verify: function (id) {
      var l = evidenceService.list();
      var it = l.filter(function (x) { return x.id === id; })[0];
      if (!it) return null;
      if (it.integrity === "Changed") return { match: false, hash: it.hash };
      it.integrity = "Verified";
      evidenceService.save(l);
      pushAudit({ id: uid("AUD"), ts: nowStamp(), actor: "R. Patil", role: "Investigator", action: "HASH_VERIFIED", target: id, caseId: it.caseId, device: "—", severity: "info", status: "success", hash: it.shortHash, detail: "Manual re-verify · match", prevRef: "—" });
      return { match: true, hash: it.hash };
    }
  };

  var caseService = {
    list: function () { return lsGet("cases", null) || PRM_DATA.CASES.slice(); },
    save: function (l) { lsSet("cases", l); emit(); },
    create: function (c) { var l = caseService.list(); l.unshift(c); caseService.save(l); pushAudit({ id: uid("AUD"), ts: nowStamp(), actor: c.investigator, role: "Investigator", action: "CASE_CREATED", target: c.id, caseId: c.id, device: "—", severity: "info", status: "success", hash: "—", detail: c.name, prevRef: "—" }); return c; },
    get: function (id) { return caseService.list().filter(function (c) { return c.id === id; })[0] || null; }
  };

  var verificationService = {
    hashFile: function (seed, algo) {
      var len = algo === "SHA-512" ? 128 : algo === "MD5" ? 32 : algo === "SHA-1" ? 40 : 64;
      return stableHash("file:" + seed + ":" + algo, len);
    }
  };

  var reportService = {
    list: function () { return lsGet("reports", null) || PRM_DATA.REPORTS.slice(); },
    save: function (l) { lsSet("reports", l); emit(); },
    generate: function (r) { var l = reportService.list(); l.unshift(r); reportService.save(l); pushNotif({ id: uid("n"), title: "Report " + r.id + " generated", body: r.type + " · " + r.caseId, ts: "Just now", route: "/workspace/reports", read: false, kind: "success" }); pushAudit({ id: uid("AUD"), ts: nowStamp(), actor: r.operator, role: "Investigator", action: "REPORT_GENERATED", target: r.id, caseId: r.caseId, device: "—", severity: "info", status: "success", hash: shortHash(r.hash), detail: r.type, prevRef: "—" }); return r; }
  };

  var auditService = {
    list: function () { return lsGet("audit", null) || PRM_DATA.AUDIT_SEED.slice(); }
  };

  /* Seed localStorage once */
  if (lsGet("seeded", false) !== true) {
    lsSet("cases", PRM_DATA.CASES.slice());
    lsSet("evidence", PRM_DATA.EVIDENCE.slice());
    lsSet("reports", PRM_DATA.REPORTS.slice());
    lsSet("audit", PRM_DATA.AUDIT_SEED.slice());
    lsSet("notifications", PRM_DATA.NOTIFICATIONS_SEED.slice());
    if (!lsGet("ops", null)) lsSet("ops", [
      { id: "E-88E0A7", kind: "erase", title: "Secure Erase", deviceId: "dev-nvme-01", device: "Samsung SSD 970 EVO", method: "Recommended Secure Erase", methodId: "recommended", passes: 3, caseId: "PRM-2026-0042", operator: "R. Patil", status: "running", progress: 62, tick: 24, totalTicks: 40, phase: "Executing sanitization", elapsed: 492, eta: "~8 min", logs: ["Pre-check: SMART read · target locked", "Engine armed: nwipe · 3-pass · 3 pass(es)", "Pass 1/3: writing pattern … verifying … OK", "Pass 2/3: writing pattern … verifying … OK"], created: "2026-09-03 06:48:00", updated: "2026-09-03 07:52:00" },
      { id: "R-7C2A91", kind: "recovery", title: "Recovery scan", deviceId: "dev-usb-02", device: "SanDisk Extreme", scan: "Deep Recovery", scanId: "deep", caseId: "PRM-2026-0041", operator: "S. Iyer", status: "running", progress: 31, tick: 9, totalTicks: 30, sector: 620000, sectorsTotal: 2000000, filesFound: 5, elapsed: 180, eta: "~6 min", logs: ["Source attached read-only via write-blocker", "Phase 1/4: file-system walk … entries indexed", "Discovered: document.pdf · 2.4 MB", "Discovered: photo_0142.jpg · 3.8 MB"], feed: ["photo_0142.jpg", "document.pdf", "archive.zip"], created: "2026-09-03 07:20:00", updated: "2026-09-03 07:51:00" }
    ]);
    lsSet("seeded", true);
  }

  function download(filename, content, mime) {
    var blob = new Blob([content], { type: mime || "text/plain" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
  }
  function toCSV(rows) {
    return rows.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? "" : c).replace(/"/g, '""') + '"'; }).join(","); }).join("\n");
  }
  /* Minimal valid single-page PDF (mock artifact, client-generated). */
  function toPDF(title, lines) {
    function esc(s) { return String(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").slice(0, 160); }
    var text = ["BT /F1 14 Tf 56 780 Td (" + esc(title) + ") Tj ET"];
    var y = 756;
    lines.slice(0, 44).forEach(function (ln) { text.push("BT /F1 9 Tf 56 " + y + " Td (" + esc(ln) + ") Tj ET"); y -= 14; });
    text.push("BT /F1 8 Tf 56 40 Td (PARMAAN · Digital Forensics Workspace · prototype artifact) Tj ET");
    var content = text.join("\n");
    var objs = ["1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj", "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj", "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj", "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj", "5 0 obj << /Length " + content.length + " >> stream\n" + content + "\nendstream endobj"];
    var pdf = "%PDF-1.4\n"; var offsets = [0];
    objs.forEach(function (o) { offsets.push(pdf.length); pdf += o + "\n"; });
    var xref = pdf.length;
    pdf += "xref\n0 " + (objs.length + 1) + "\n0000000000 65535 f \n" + offsets.slice(1).map(function (o) { return ("0000000000" + o).slice(-10) + " 00000 n \n"; }).join("") + "trailer << /Size " + (objs.length + 1) + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF";
    return pdf;
  }

  window.PRM_SERVICES = { lsGet: lsGet, lsSet: lsSet, stableHash: stableHash, shortHash: shortHash, nowStamp: nowStamp, uid: uid, apiGet: apiGet, deviceService: deviceService, eraseService: eraseService, recoveryService: recoveryService, evidenceService: evidenceService, caseService: caseService, verificationService: verificationService, reportService: reportService, auditService: auditService, download: download, toCSV: toCSV, toPDF: toPDF, subscribe: function (fn) { listeners.push(fn); } };
})();
