"""
PARMAAN — SecureErase & Recover — Backend

Run: pip install -r requirements.txt && uvicorn backend.main:app --port 8000
UI : http://localhost:8000/
Docs: http://localhost:8000/docs

NOTE: Forensic engines are SIMULATED for demo. Real integrations
(nwipe/scrub/srm/blkdiscard/hdparm, TestDisk/PhotoRec/TSK/Autopsy)
plug into run_erasure_sim() / run_recovery_sim() behind the same API.
"""
import asyncio, csv, hashlib, io, random, time, uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="PARMAAN", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ---------------------------------------------------------------- stores
DEVICES = [
    {"id":"SSD-SAMS-512","label":"Samsung 980 SSD 512GB","type":"SSD/NVMe","size":"512 GB","interface":"NVMe","serial":"S69X****21A","health":"Good","location":"Forensic Lab Workstation-02","icon":"💾"},
    {"id":"HDD-SEAG-1TB","label":"Seagate Barracuda 1TB","type":"HDD","size":"1 TB","interface":"SATA","serial":"ST1000****7K2","health":"Good","location":"Malkhana / Seized Lot #14","icon":"🖴"},
    {"id":"USB-SAND-64","label":"SanDisk Cruzer 64GB (USB)","type":"USB Flash","size":"64 GB","interface":"USB 3.0","serial":"SDCZ60****91Q","health":"Good","location":"District Office Desk","icon":"🔌"},
    {"id":"PART-D-DATA","label":"Partition D: \\DATA (NTFS)","type":"Partition","size":"220 GB","interface":"Logical","serial":"VOL-DATA-04","health":"Damaged FS","location":"Case IMG-2025-118","icon":"🗂️"},
    {"id":"IMG-CASE-118","label":"Forensic Image CASE-118.E01","type":"Disk Image","size":"128 GB","interface":"E01 image","serial":"CASE-118-E01","health":"Deleted files present","location":"Evidence Server","icon":"🧾"},
    {"id":"FOLDER-DOCS","label":"Folder \\SeizedDocs\\ (2,340 files)","type":"Files/Folder","size":"18.4 GB","interface":"SMB share","serial":"FOLD-SEZ-2340","health":"Indexed","location":"Document Cell","icon":"📁"},
]

ERASURE_METHODS = [
    {"id":"quick-1pass","name":"Quick Wipe — 1 Pass Zero","standard":"NIST Clear","passes":1,"engine":"scrub / blkdiscard","time":"~4 min / 100GB","level":"Basic","desc":"Single zero-fill + verify. For low-risk reuse inside the team.","expert_only":False},
    {"id":"dod-3pass","name":"DoD 5220.22-M — 3 Pass","standard":"DoD 3-pass","passes":3,"engine":"nwipe","time":"~18 min / 100GB","level":"Standard","desc":"0x00 → 0xFF → Random + verify. Default for transfer and disposal.","expert_only":False},
    {"id":"nist-purge","name":"NIST 800-88 Purge — Crypto + Overwrite","standard":"NIST SP 800-88 Purge","passes":4,"engine":"hdparm Secure Erase + srm","time":"~25 min / 100GB","level":"High","desc":"Crypto-erase + overwrite + firmware verify. For SSDs and case closure.","expert_only":False},
    {"id":"gutmann-7","name":"Deep Overwrite — 7 Pass (Expert)","standard":"Extended overwrite","passes":7,"engine":"nwipe expert profile","time":"~55 min / 100GB","level":"Maximum","desc":"Expert mode only. For highly sensitive media, needs admin approval.","expert_only":True},
]

RECOVERY_MODES = [
    {"id":"quick-scan","name":"Quick Scan — Deleted files","engine":"TSK / TestDisk","time":"~2 min","desc":"MFT / inode undelete. Best for recently deleted files."},
    {"id":"deep-scan","name":"Deep Scan — Carving","engine":"PhotoRec carver","time":"~8 min","desc":"Signature carving (JPG/PDF/DOCX/MP4/SQLite). For formatted drives."},
    {"id":"partition","name":"Partition Recovery","engine":"TestDisk rebuild","time":"~6 min","desc":"Rebuild lost / damaged partition table, preview before write."},
    {"id":"case-triage","name":"Case Triage + Tagging","engine":"Autopsy pipeline","time":"~10 min","desc":"Full triage: hash, timeline, keyword hits, auto-tag to vault."},
]

RECOVERY_FILE_POOL = [
    ("FIR_Copy_2024.pdf","PDF", "2.4 MB"),("seized_ledger.xlsx","XLSX","1.1 MB"),
    ("site_photo_0142.jpg","JPG","3.8 MB"),("cctv_clip_09.mp4","MP4","48 MB"),
    ("whatsapp_export.db","SQLite","12 MB"),("land_record_7-12.pdf","PDF","0.9 MB"),
    ("contract_draft.docx","DOCX","0.4 MB"),("email_dump.pst","PST","210 MB"),
    ("deleted_note.txt","TXT","4 KB"),("invoice_scan_221.jpg","JPG","1.2 MB"),
    ("aadhaar_masked_copy.pdf","PDF","0.6 MB"),("disk_index.dat","DAT","8 MB"),
    ("meeting_audio.m4a","Audio","6.7 MB"),("backup_keys.csv","CSV","22 KB"),
    ("tender_doc_final.pdf","PDF","5.1 MB"),("photo_IMG_8890.jpg","JPG","2.9 MB"),
]

JOBS: Dict[str, dict] = {}
VAULT: List[dict] = [
    {"id":"EV-1001","name":"FIR_Copy_2024.pdf","case":"CASE-118","hash":"9f2c…a41d","added":"2025-11-02 11:20","by":"Investigator R. Patil","tag":"FIR","custody":["Seized → Malkhana","Imaged → Lab-02","Verified → Vault"]},
    {"id":"EV-1002","name":"site_photo_0142.jpg","case":"CASE-118","hash":"71bd…09e2","added":"2025-11-02 11:34","by":"Investigator R. Patil","tag":"Photo evidence","custody":["Recovered via PhotoRec","Hashed + tagged","Locked in vault"]},
]
AUDIT: List[dict] = [
    {"ts":"2025-11-02 11:18:04","actor":"Admin (S. Iyer)","role":"admin","action":"LOGIN","detail":"MFA verified · Lab-02","hash":"—"},
    {"ts":"2025-11-02 11:20:31","actor":"R. Patil","role":"investigator","action":"RECOVERY_COMPLETE","detail":"CASE-118 · Quick Scan · 14 files · PhotoRec","hash":"71bd…09e2"},
    {"ts":"2025-11-02 11:42:10","actor":"Clerk A. Deshmukh","role":"clerk","action":"ERASURE_REQUEST","detail":"USB-SAND-64 · DoD 3-pass · awaiting approval","hash":"—"},
]

def now(): return datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d %H:%M:%S")
def fake_hash(seed: str) -> str:
    h = hashlib.sha256(f"{seed}-{time.time()}-{random.random()}".encode()).hexdigest()
    return f"{h[:4]}…{h[-4:]} / {h[:16]}…"
def full_hash(seed: str) -> str:
    return hashlib.sha256(f"{seed}-{time.time()}-{random.random()}".encode()).hexdigest()
def audit(actor, role, action, detail, h="—"):
    AUDIT.insert(0, {"ts": now(), "actor": actor, "role": role, "action": action, "detail": detail, "hash": h})

# ---------------------------------------------------------------- models
class EraseReq(BaseModel):
    device_id: str
    method_id: str
    operator: str = "Demo Operator"
    role: str = "investigator"
    case_id: str = "CASE-DEMO-01"
    confirm_text: str = "ERASE"
    mode: str = "normal"

class RecoverReq(BaseModel):
    device_id: str
    scan_type: str = "quick-scan"
    file_types: List[str] = ["JPG","PDF","DOCX","MP4"]
    operator: str = "Demo Operator"
    role: str = "investigator"
    case_id: str = "CASE-DEMO-01"

class TagReq(BaseModel):
    file_id: str
    tag: str = "Evidence"
    to_vault: bool = True
    actor: str = "Demo Operator"

# ---------------------------------------------------------------- engines
ERASURE_LOGS = [
    "Pre-check: SMART OK · HPA/DCO inspected · write-blocker OFF for target",
    "Engine: {engine} — profile loaded ({method}, {passes} passes)",
    "Pass {p}/{passes}: writing pattern … verifying … OK",
    "Bad-sector remap check: 0 pending · 0 reallocated growth",
    "Final verify: full-media read-back + SHA256 spot-checks",
    "Certificate staged: operator, timestamps, device, method, hashes",
]
RECOVERY_LOGS = [
    "Source mounted READ-ONLY via write-blocker · hash of source captured",
    "Engine: {engine} — {mode} started on {dev}",
    "Phase 1/4: MFT / inode walk … {n1} entries",
    "Phase 2/4: unallocated carve (JPG/PDF/DOCX/MP4/SQLite) … {n2} hits",
    "Phase 3/4: hash + timeline + keyword triage …",
    "Phase 4/4: preview index built · chain-of-custody opened",
]

async def run_erasure_sim(job_id: str):
    job = JOBS[job_id]
    method = next(m for m in ERASURE_METHODS if m["id"] == job["method_id"])
    job["status"] = "running"
    audit(job["operator"], job["role"], "ERASURE_START", f'{job["device_id"]} · {method["name"]} · {job["case_id"]}')
    total_passes = method["passes"]
    ticks = total_passes * 6 + 4
    for i in range(ticks):
        await asyncio.sleep(0.55)  # demo speed ~ (passes*6+4)*0.55s
        job["progress"] = min(96, int((i + 1) / ticks * 96))
        if i == 0:
            job["logs"].append(ERASURE_LOGS[0]); job["logs"].append(ERASURE_LOGS[1].format(engine=method["engine"], method=method["name"], passes=total_passes))
        elif i < ticks - 2 and i % 6 == 2:
            p = min(total_passes, i // 6 + 1)
            job["logs"].append(ERASURE_LOGS[2].format(p=p, passes=total_passes))
        elif i == ticks - 3:
            job["logs"].append(ERASURE_LOGS[3])
        job["updated"] = now()
    job["status"] = "verifying"; job["progress"] = 97
    job["logs"].append(ERASURE_LOGS[4]); await asyncio.sleep(0.8)
    pre = full_hash(job_id + "pre"); post = full_hash(job_id + "post")
    # pre != post, post-media reads as zeros → success
    job["hashes"] = {"pre": pre[:32] + "…", "post": post[:32] + "…", "verify": "PASS — no recoverable residual"}
    job["logs"].append(f"Pre-wipe hash : {pre[:24]}…")
    job["logs"].append(f"Post-wipe hash: {post[:24]}…  → residual check PASS")
    job["logs"].append(ERASURE_LOGS[5])
    job["status"] = "completed"; job["progress"] = 100; job["completed"] = now()
    audit(job["operator"], job["role"], "ERASURE_COMPLETE", f'{job["device_id"]} · {method["standard"]} · VERIFIED', job["hashes"]["post"][:12] + "…")

async def run_recovery_sim(job_id: str):
    job = JOBS[job_id]
    mode = next(m for m in RECOVERY_MODES if m["id"] == job["scan_type"])
    job["status"] = "running"
    audit(job["operator"], job["role"], "RECOVERY_START", f'{job["device_id"]} · {mode["name"]} · {job["case_id"]}')
    n1, n2 = random.randint(1800, 4200), random.randint(18, 64)
    steps = 12
    for i in range(steps):
        await asyncio.sleep(0.6)
        job["progress"] = min(95, int((i + 1) / steps * 95))
        if i == 0:
            job["logs"].append(RECOVERY_LOGS[0]); job["logs"].append(RECOVERY_LOGS[1].format(engine=mode["engine"], mode=mode["name"], dev=job["device_id"]))
        elif i == 4: job["logs"].append(RECOVERY_LOGS[2].format(n1=n1))
        elif i == 7: job["logs"].append(RECOVERY_LOGS[3].format(n2=n2))
        elif i == 9: job["logs"].append(RECOVERY_LOGS[4])
        elif i == 11: job["logs"].append(RECOVERY_LOGS[5])
        job["updated"] = now()
    # build mock results
    random.seed(job_id)
    files = []
    for idx, (nm, typ, sz) in enumerate(random.sample(RECOVERY_FILE_POOL, k=min(len(RECOVERY_FILE_POOL), 12))):
        if job.get("file_types") and typ not in job["file_types"] and typ not in ("PDF","JPG"):
            continue
        files.append({"id": f"F-{job_id[:4]}-{idx:02d}", "name": nm, "type": typ, "size": sz,
                      "status": random.choice(["Excellent","Good","Partial","Excellent","Good"]),
                      "path": f"/unalloc/{random.randint(1000,9999)}/{nm}",
                      "hash": full_hash(nm + job_id)[:32] + "…",
                      "preview": "Preview available"})
    job["results"] = files
    job["status"] = "completed"; job["progress"] = 100; job["completed"] = now()
    audit(job["operator"], job["role"], "RECOVERY_COMPLETE", f'{job["device_id"]} · {len(files)} files · {mode["name"]}', fake_hash(job_id))

# ---------------------------------------------------------------- API
@app.get("/api/overview")
def overview():
    done_e = sum(1 for j in JOBS.values() if j["type"] == "erasure" and j["status"] == "completed")
    done_r = sum(1 for j in JOBS.values() if j["type"] == "recovery" and j["status"] == "completed")
    return {"sanitized": 128 + done_e, "recovered_files": 3420 + sum(len(j.get("results", [])) for j in JOBS.values()),
            "reports": 96 + done_e + done_r, "compliance": "NIST 800-88 · DoD · Audit-ready",
            "active_jobs": sum(1 for j in JOBS.values() if j["status"] in ("queued","running","verifying"))}

@app.get("/api/devices")
def devices(): return {"devices": DEVICES}
@app.get("/api/methods/erasure")
def e_methods(): return {"methods": ERASURE_METHODS}
@app.get("/api/methods/recovery")
def r_methods(): return {"modes": RECOVERY_MODES}

@app.post("/api/jobs/erasure")
async def create_erasure(req: EraseReq):
    dev = next((d for d in DEVICES if d["id"] == req.device_id), None)
    met = next((m for m in ERASURE_METHODS if m["id"] == req.method_id), None)
    if not dev or not met: raise HTTPException(400, "Unknown device or method")
    if met.get("expert_only") and req.mode != "expert" and req.role not in ("admin","expert"):
        raise HTTPException(403, "Expert method needs Expert mode + Admin/Expert role (demo guard)")
    if req.confirm_text.strip().upper() != "ERASE":
        raise HTTPException(400, "Type ERASE to confirm (safety interlock demo)")
    jid = "E-" + uuid.uuid4().hex[:6].upper()
    JOBS[jid] = {"id": jid, "type": "erasure", "device_id": dev["id"], "device_label": dev["label"],
                 "method_id": met["id"], "method_name": met["name"], "standard": met["standard"],
                 "operator": req.operator, "role": req.role, "case_id": req.case_id,
                 "status": "queued", "progress": 2, "logs": [f"Job {jid} queued · {dev['label']} · {met['name']} · case {req.case_id}"],
                 "created": now(), "updated": now(), "hashes": {}}
    asyncio.create_task(run_erasure_sim(jid))
    return {"job_id": jid, "status": "queued"}

@app.post("/api/jobs/recovery")
async def create_recovery(req: RecoverReq):
    dev = next((d for d in DEVICES if d["id"] == req.device_id), None)
    if not dev: raise HTTPException(400, "Unknown device")
    jid = "R-" + uuid.uuid4().hex[:6].upper()
    JOBS[jid] = {"id": jid, "type": "recovery", "device_id": dev["id"], "device_label": dev["label"],
                 "scan_type": req.scan_type, "file_types": req.file_types,
                 "operator": req.operator, "role": req.role, "case_id": req.case_id,
                 "status": "queued", "progress": 2, "logs": [f"Job {jid} queued · {dev['label']} · {req.scan_type}"],
                 "created": now(), "updated": now(), "results": []}
    asyncio.create_task(run_recovery_sim(jid))
    return {"job_id": jid, "status": "queued"}

@app.get("/api/jobs")
def list_jobs(): return {"jobs": sorted(JOBS.values(), key=lambda j: j["created"], reverse=True)}

@app.get("/api/jobs/{jid}")
def get_job(jid: str):
    if jid not in JOBS: raise HTTPException(404, "Job not found")
    return JOBS[jid]

@app.post("/api/jobs/{jid}/tag")
def tag_file(jid: str, req: TagReq):
    job = JOBS.get(jid)
    if not job or job["type"] != "recovery": raise HTTPException(404, "Recovery job not found")
    f = next((x for x in job.get("results", []) if x["id"] == req.file_id), None)
    if not f: raise HTTPException(404, "File not found in results")
    f["tag"] = req.tag
    if req.to_vault:
        ev = {"id": f"EV-{random.randint(1003,9999)}", "name": f["name"], "case": job["case_id"],
              "hash": f["hash"][:12] + "…", "added": now(), "by": req.actor, "tag": req.tag,
              "custody": [f"Recovered {jid} → tagged '{req.tag}'", "Hashed + preview logged", "Locked in vault (sim AES-256)"]}
        VAULT.insert(0, ev)
        audit(req.actor, "investigator", "VAULT_ADD", f'{f["name"]} · {job["case_id"]} · tag={req.tag}', ev["hash"])
    return {"ok": True, "file": f}

@app.get("/api/vault")
def vault(): return {"items": VAULT}
@app.get("/api/audit")
def audit_log(limit: int = 50): return {"logs": AUDIT[:limit]}

@app.get("/api/reports/{jid}.csv")
def report_csv(jid: str):
    job = JOBS.get(jid)
    if not job: raise HTTPException(404, "Job not found")
    buf = io.StringIO(); w = csv.writer(buf)
    w.writerow(["PARMAAN — Forensic Report (Prototype)"])
    w.writerow(["Job", job["id"], "Type", job["type"], "Status", job["status"]])
    w.writerow(["Device", job.get("device_label"), "Case", job.get("case_id")])
    w.writerow(["Operator", job.get("operator"), "Created", job.get("created")])
    w.writerow([]); w.writerow(["Timestamp", "Log"])
    for l in job.get("logs", []): w.writerow([job.get("created"), l])
    if job["type"] == "recovery":
        w.writerow([]); w.writerow(["File", "Type", "Size", "Hash"])
        for f in job.get("results", []): w.writerow([f["name"], f["type"], f["size"], f["hash"]])
    if job.get("hashes"): w.writerow([]); w.writerow(["Pre", job["hashes"].get("pre")]); w.writerow(["Post", job["hashes"].get("post")])
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv",
                             headers={"Content-Disposition": f"attachment; filename={jid}-report.csv"})

@app.get("/api/reports/{jid}.pdf")
def report_pdf(jid: str):
    job = JOBS.get(jid)
    if not job: raise HTTPException(404, "Job not found")
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
        from reportlab.lib.units import mm
    except ImportError:
        return JSONResponse({"error": "reportlab not installed — use CSV"}, status_code=501)
    buf = io.BytesIO(); c = canvas.Canvas(buf, pagesize=A4); W, H = A4
    y = H - 22 * mm
    c.setFont("Helvetica-Bold", 15); c.drawString(18 * mm, y, "PARMAAN - SecureErase & Recover"); y -= 7 * mm
    c.setFont("Helvetica", 9); c.drawString(18 * mm, y, f"Tamper-evident sanitization / recovery report · PARMAAN"); y -= 6 * mm
    c.setFont("Helvetica-Bold", 11); c.drawString(18 * mm, y, f"Job {job['id']}  ·  {job['type'].upper()}  ·  {job['status'].upper()}"); y -= 8 * mm
    c.setFont("Helvetica", 9)
    for k in [("Device", job.get("device_label")), ("Method/Scan", job.get("method_name", job.get("scan_type"))),
              ("Case", job.get("case_id")), ("Operator", f"{job.get('operator')} ({job.get('role')})"),
              ("Created", job.get("created")), ("Completed", job.get("completed", "—")),
              ("Standard", job.get("standard", "Forensic triage"))]:
        c.drawString(18 * mm, y, f"{k[0]}: {k[1]}"); y -= 5 * mm
    if job.get("hashes"):
        y -= 2 * mm; c.setFont("Helvetica-Bold", 10); c.drawString(18 * mm, y, "Verification"); y -= 5 * mm
        c.setFont("Helvetica", 8)
        for k, v in job["hashes"].items(): c.drawString(18 * mm, y, f"{k}: {v}"); y -= 4.5 * mm
    y -= 2 * mm; c.setFont("Helvetica-Bold", 10); c.drawString(18 * mm, y, "Execution log"); y -= 5 * mm
    c.setFont("Helvetica", 7.5)
    for line in job.get("logs", []):
        if y < 22 * mm: c.showPage(); y = H - 18 * mm; c.setFont("Helvetica", 7.5)
        c.drawString(18 * mm, y, "• " + line[:120]); y -= 4 * mm
    if job["type"] == "recovery" and job.get("results"):
        if y < 30 * mm: c.showPage(); y = H - 18 * mm
        y -= 2 * mm; c.setFont("Helvetica-Bold", 10); c.drawString(18 * mm, y, f"Recovered files ({len(job['results'])})"); y -= 5 * mm
        c.setFont("Helvetica", 7.5)
        for f in job["results"][:30]:
            if y < 22 * mm: c.showPage(); y = H - 18 * mm; c.setFont("Helvetica", 7.5)
            c.drawString(18 * mm, y, f"• {f['name']} [{f['type']}/{f['size']}] {f['hash'][:20]}…"); y -= 4 * mm
    y -= 4 * mm; c.setFont("Helvetica-Oblique", 7.5)
    c.drawString(18 * mm, y, "PARMAAN verified report — hashes and chain-of-custody retained for audit.")
    c.setFont("Helvetica", 7.5); c.drawString(18 * mm, 14 * mm, f"Generated {now()} · Chain-of-custody retained in audit log · Verify via /api/audit")
    c.showPage(); c.save(); buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf",
                             headers={"Content-Disposition": f"attachment; filename={jid}-report.pdf"})

I18N = {
    "en": {"tagline":"Sanitize what must disappear · Recover what must be investigated","erase":"Secure Erasure","recover":"Advanced Recovery","vault":"Evidence Vault","audit":"Audit & Reports","arch":"Architecture","start_demo":"Start guided demo","normal":"Normal","expert":"Expert"},
    "hi": {"tagline":"जो मिटना चाहिए उसे मिटाएँ · जो जाँचना चाहिए उसे पुनर्प्राप्त करें","erase":"सुरक्षित मिटान","recover":"उन्नत पुनर्प्राप्ति","vault":"साक्ष्य तिजोरी","audit":"ऑडिट व रिपोर्ट","arch":"आर्किटेक्चर","start_demo":"निर्देशित डेमो शुरू करें","normal":"सामान्य","expert":"विशेषज्ञ"},
}
@app.get("/api/i18n/{lang}")
def i18n(lang: str): return I18N.get(lang, I18N["en"])

# ---------------------------------------------------------------- static UI
STATIC_DIR = Path(__file__).parent / "static"
STATIC_DIR.mkdir(exist_ok=True)
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/", response_class=HTMLResponse)
def index():
    idx = STATIC_DIR / "index.html"
    if idx.exists(): return idx.read_text(encoding="utf-8")
    return "<h2>Frontend not built yet — see /docs</h2>"

@app.get("/style.css")
def get_css(): return FileResponse(STATIC_DIR / "style.css")

@app.get("/app.js")
def get_app_js(): return FileResponse(STATIC_DIR / "app.js")

@app.get("/data.js")
def get_data_js(): return FileResponse(STATIC_DIR / "data.js")

@app.get("/services.js")
def get_services_js(): return FileResponse(STATIC_DIR / "services.js")
