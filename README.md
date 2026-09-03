# PARMAAN — Digital Forensics & Data Sanitization Workspace

> **Trust every byte. Erase with certainty. Recover with evidence.**
> 
> A unified, high-integrity digital forensics and secure data sanitization platform combining NIST-compliant media destruction, signature-based file carving, tamper-evident evidence vaulting, immutable chain-of-custody tracking, and court-admissible audit reporting.

---

## Final Goal & Vision

**PARMAAN** is architected to bridge the operational gap between low-level forensic tooling and modern, accessible user experiences for forensic examiners, cyber incident responders, and compliance clerks. 

The ultimate objective of PARMAAN is to deliver an **air-gapped, offline-first, tamper-proof digital forensics suite** that guarantees legal admissibility and mathematical certainty across the complete lifecycle of storage media:

1. **Guaranteed Data Sanitization**:
   - Multi-standard overwriting (NIST SP 800-88 Rev. 1 Clear/Purge, DoD 5220.22-M 3-Pass, Gutmann 7-Pass, and Crypto Erase).
   - Direct hardware command execution (`blkdiscard`, `hdparm ATA Secure Erase`, `nvme-cli`, `nwipe`, `scrub`, `srm`) bypassing OS cache layers via `O_DIRECT`.
   - Comprehensive post-wipe residual verification (100% block sampling with SHA-256 pre/post hashing) producing cryptographically signed sanitization certificates.

2. **Forensic Recovery & Carving**:
   - Hardware write-blocked, read-only acquisition from raw block devices, physical partitions, and forensic disk images (`.E01`, `.dd`, `.raw`).
   - Deep signature carving across critical digital evidence formats (JPEG, PDF, DOCX, MP4, SQLite/DB, ZIP/PST) with parallel pattern matching.
   - Deleted file undelete via filesystem metadata parsers (MFT records, inode tables, FAT directory structures) with integrity-tagged triage.

3. **Tamper-Evident Evidence Vault**:
   - Cryptographic sealing with multi-hash checksum generation (SHA-256, BLAKE3).
   - Automated status monitoring (`Verified`, `Pending`, `Changed/Compromised`).
   - Granular case tagging, cross-case referencing, and artifact isolation.

4. **Immutable Chain-of-Custody & Audit Trail**:
   - Every read, carve, wipe, tag, export, and mode switch generates an append-only, chronologically timestamped audit log.
   - Role-based attribution (`Clerk`, `Investigator`, `Admin`, `Expert`) enforcing separation of duties.

5. **Court-Admissible Export Engine**:
   - Client-side and server-side PDF and CSV report generation embedded with hardware serials, firmware hashes, operator signatures, and verification hashes.
   - Instant A4 print-ready proof certificates.

6. **Adaptive Dual-Mode Workflow**:
   - **Guided Mode**: Safe, step-by-step guardrails and recommended profiles designed for field officers and clerks without risk of accidental data loss.
   - **Expert Mode**: Low-level forensic parameters, custom sector boundaries (LBA), block sizing, entropy scraping, and raw hex sector inspection.

7. **Full Multilingual Accessibility**:
   - 100% complete UI localization across English, Hindi (`हिन्दी`), Marathi (`मराठी`), Bengali (`বাংলা`), Tamil (`தமிழ்`), and Telugu (`తెలుగు`), enabling regional law enforcement and local forensics labs to operate natively without language barriers.

---

## Core Capabilities

| Capability | Disciplines & Capabilities | Standards / Engines |
|---|---|---|
| **Secure Erasure** | 6-step guided sanitization, multi-pass wipe, cryptographic purge, TRIM discard | NIST SP 800-88 Rev. 1, DoD 5220.22-M, ATA Secure Erase, NVMe Format |
| **Forensic Recovery** | Read-only drive acquisition, partition repair, signature carving, live discovery feed | TSK (The Sleuth Kit), TestDisk, PhotoRec carver |
| **Evidence Vault** | Sealed evidence repository, hash verification, metadata extraction, case assignment | SHA-256, BLAKE3, RFC 3161 timestamps |
| **Integrity Verification** | Hash matching, residual sample PASS/FAIL checks, mismatch warning system | Hardware-assisted SHA-256 / BLAKE3 |
| **Audit & Custody** | Append-only event stream, chronological timeline, custody transfer tracking | ISO/IEC 27037 digital evidence guidelines |
| **Reports & Proof** | Formal sanitization certificates, forensic case summaries, A4 preview, PDF/CSV export | ReportLab PDF engine, JSON/CSV exports |

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PARMAAN Client (Browser)                      │
│   • Dark High-Contrast Forensic Theme  • Offline-First Single-Page App │
│   • Multi-Language Engine (hi/mr/bn/ta/te/en)                          │
│   • Guided / Expert Mode State Machine • Direct Hex & Entropy Viewer   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST & WebSockets
┌───────────────────────────────────▼────────────────────────────────────┐
│                       PARMAAN Backend (FastAPI)                        │
│   • Asynchronous Job Runner            • Device & Media Discovery      │
│   • ReportLab Certificate Generator    • Audit & Custody Logger        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Direct I/O / Subprocess
┌───────────────────────────────────▼────────────────────────────────────┐
│                    Forensic & Sanitization Subsystem                   │
│   • nwipe / scrub / srm / blkdiscard   • hdparm / nvme-cli             │
│   • The Sleuth Kit / TestDisk / PhotoRec• SHA-256 / BLAKE3 Verifier     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Quickstart

### Prerequisites
- Python 3.9+ installed
- Modern Chromium or WebKit browser

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/dedsec-terminal/parmaan.git
cd parmaan

# Install dependencies
pip install -r requirements.txt

# Start the application server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

### Access Points
- **Web UI Workspace**: [http://localhost:8000/](http://localhost:8000/)
- **Landing Page**: [http://localhost:8000/#/](http://localhost:8000/#/)
- **Erasure Flow**: [http://localhost:8000/#/workspace/erase](http://localhost:8000/#/workspace/erase)
- **Recovery Flow**: [http://localhost:8000/#/workspace/recover](http://localhost:8000/#/workspace/recover)
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Project Structure

```
c:\parmaan\
├── backend/
│   ├── main.py              # FastAPI server, REST routes, simulation & PDF report engine
│   └── static/
│       ├── index.html       # HTML5 shell, font declarations, overlay roots
│       ├── app.js           # Core UI state machine, router, steppers, i18n renderer
│       ├── data.js          # Hardware mock registries, case seeds, translation dictionaries
│       ├── services.js      # Mock service layer, cryptographic hashers, localStorage
│       └── style.css        # Professional forensic dark theme, typography, responsive grid
├── requirements.txt         # FastAPI, Uvicorn, ReportLab
├── notes.txt                # Engineering specifications & verification checklist
├── .gitignore               # Python & temporary asset exclusions
└── README.md                # Platform mission, architecture, and documentation
```

---

## Brand & Compliance Guarantee

The product name, documentation, UI tokens, and certificates are strictly unified under the **PARMAAN** identity. No unapproved naming, third-party sponsors, or external dependencies are exposed.
