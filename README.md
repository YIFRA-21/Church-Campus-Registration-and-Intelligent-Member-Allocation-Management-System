# C-CIMAS — Church Campus Registration & Intelligent Member Allocation Management System
### የግቢ ጉባኤ አባላት ምዝገባ፣ ክፍል ክፍፍልና አስተዳደር ሥርዓት

A multi-campus web application engineered for centralized church campus member registration, Excel batch validation, percentage-based department target management, and intelligent member allocation with 100% member accounting (Option A).

---

## Official Accounts & Credentials

The system implements strictly **TWO** application roles per the Master Specification:

| Role | Email Address | Password | Account Holder | Scope & Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@c-cimas.org` | `admin123` | Rev. Solomon Tadesse | **Full System Governance (21 Capabilities)**: Campus & Department management, percentage targets (Hare-Niemeyer rounding), Excel/CSV bulk import, Intelligent Allocation Engine, Admin exception overrides, final approval, evaluator task assignment & review, reports, audit trail. |
| **EVALUATOR** | `evaluator@c-cimas.org` | `admin123` | Dr. Aster Melaku | **Assessment & Scoring (6 Capabilities)**: View assigned evaluation tasks, inspect authorized member records, score candidates (0–100 with sub-criteria), save drafts, submit final evaluations, view submission history, receive correction requests. |

---

## Quick Start (Local Development)

### 1. Start Backend API Server (Port `5000`)
```bash
npm run dev:backend
```
Backend runs at `http://localhost:5000` with JWT authentication and RESTful endpoints under `/api/v1/`.

### 2. Start Frontend Client (Port `5173`)
```bash
npm run dev:frontend
```
Frontend runs at `http://localhost:5173` (proxies `/api` to the backend server).

---

## Core Business Decisions & Verified Guarantees

1. **Strictly 2 Roles**: Only `ADMIN` and `EVALUATOR` are supported, enforced at both the backend authorization middleware and database RLS layers.
2. **Target Basis = CAMPUS_SHARE**: Every campus has its own percentage configuration. Department percentage targets must sum to exactly **100%** before an allocation process can start.
3. **Largest Remainder Method (Hare-Niemeyer)**: Target quotas strictly sum to the exact campus population with zero integer rounding loss.
4. **Option A (100% Member Accounting)**: Every successfully imported member is accounted for. Ineligible members or full departments route to the Admin exception review queue. No silent exclusions.
5. **Rule 13 (Exception Gate)**: Final allocation batch approval is strictly blocked until every exception is resolved or placed on hold.
6. **Immutable Audit Ledger**: All actions (logins, imports, percentage changes, overrides, approvals) are permanently logged with actor attribution.

---

## Automated Verification Suite

Run all 9 test suites (61 tests) including the 5,000-member high-capacity benchmark:

```bash
npm run test:backend
```

Build production bundles:
```bash
npm run build
```
