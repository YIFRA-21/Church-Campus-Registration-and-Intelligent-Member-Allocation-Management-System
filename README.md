# C-CIMAS — Church Campus Registration & Intelligent Member Allocation Management System

> **Enterprise Church Campus Management & Autonomous Allocation Engine**  
> *Built to the C-CIMAS Business Requirements Specification (BRS v1.0 Draft)*

---

## 1. Overview & Vision

**C-CIMAS** is a centralized, secure, multi-campus platform designed to replace manual Excel-based church operations with an intelligent, rule-based member registration, department configuration, and automated allocation workflow.

### Core Architectural Principle
> **The allocation engine creates a proposal; the approval process commits it.**  
> The allocation engine never directly alters active member assignments. It generates an immutable allocation batch preview (`PREVIEW_READY` / `PENDING_APPROVAL`). Only an authorized administrator holding the explicit `allocation.approve` permission can commit the proposed batch into active assignments.

---

## 2. Business Decisions & Formal Policies Incorporated

All 5 foundational business decisions and the 6 technical-business policies (DEC-01 to DEC-06) from the BRS are operationalized in the codebase:

| ID | Confirmed Decision / Policy | Implementation Specification |
| :--- | :--- | :--- |
| **DEC-01** | **Percentage Denominator Basis** | Target percentage $p_d$ applies to **eligible unassigned members** ($E_d$) in that allocation cycle: $T_d = \operatorname{round}(E_d \times p_d)$. Members already allocated are accounted for separately. |
| **DEC-02** | **Overlapping Eligibility** | 3-tier deterministic resolution: (1) Department target deficit $(T_d - A_d) / T_d$, (2) Department priority level, (3) Stable cryptographic tie-breaker. |
| **DEC-03** | **Balancing Constraints** | Supports both **Hard Constraints** (strict eligibility filter) and **Soft Preferences** (optimization scoring weights). |
| **DEC-04** | **Partial Batch Approval** | Administrators can exclude individual candidate proposals; excluded members route to the Review Queue and the remaining proposals commit atomically. |
| **DEC-05** | **Approval Authority** | Verified by explicit permission check `allocation.approve` (Super Admin & assigned Campus Admin). |
| **DEC-06** | **Manual Overrides** | Requires `member.assign_exception` capability, mandatory written justification, and creates an immutable critical audit log. |

---

## 3. The 15 Implemented Business Modules

1. **Authentication & RBAC**: Capability-based role permissions (`SUPER_ADMIN`, `CAMPUS_ADMIN`, `REGISTRATION_OFFICER`, `DEPT_MANAGER`, `EVALUATOR`).
2. **Campus Administration**: Multi-campus tenancy with campus-scoped data isolation (`ADD-01`, `BOL-02`).
3. **Department Management**: Configurable target percentages ($p_d$), fixed maximum capacity ($M_d$), and priority rankings.
4. **Member Registration**: Unique registration IDs, phone validation, gender, category, and deacon status.
5. **Member Classification**: Configurable age and social categories (Youth, Adult, Elder, Student, Children, Young Adult).
6. **Excel Ingestion Pipeline**: Staged multi-sheet parser, header auto-mapping, phone/ID duplicate reconciliation preview, and batch commit.
7. **Eligibility Management**: Department-specific criteria (allowed genders, allowed categories, strict deacon requirements).
8. **Allocation Configuration**: Target %, capacity maximums, soft gender ratio targets, and category quotas.
9. **Intelligent Allocation Engine**: 9-step pure functional pipeline with deterministic outputs and explainability reason codes.
10. **Allocation Approval Workflow**: Interactive preview table, partial selection, one-click transactional commit inside `$transaction`.
11. **Controlled Member Reassignment**: Source deactivation and destination capacity check within a single atomic database transaction.
12. **Department Manager Portal**: Scoped visibility restricting department heads to their own assigned department.
13. **Evaluation & Reporting**: Target achievement vs. capacity utilization metrics, demographic breakdown, deacon ratios.
14. **Excel Export**: Authorized data export with filters and formatting.
15. **Governance & Audit Trail**: Immutable chronological event ledger capturing user attribution, operational diffs, and justifications.

---

## 4. Technology Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Database & ORM**: SQLite (for instant local zero-daemon operation) + Prisma ORM (with PostgreSQL dialect compatibility)
- **Styling & UI**: Tailwind CSS, Lucide Icons, clean responsive administrative interface
- **Spreadsheet Processing**: SheetJS (`xlsx`) for client and server import/export
- **Localization**: English (`en`) and Amharic (`am` / አማርኛ) language support

---

## 5. Quick Start & Demo Accounts

### 1. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Run Production Server
```bash
npm run build
npm start
```

### 3. Demo Accounts (Password: `admin123`)
The database is pre-seeded with accounts covering all 5 system roles:
- **Super Administrator**: `admin@c-cimas.org` (Full global campus access)
- **Campus Administrator**: `campusadmin@c-cimas.org` (Main Campus administration)
- **Registration Officer**: `regofficer@c-cimas.org` (Member registration & Excel import)
- **Department Manager**: `choirlead@c-cimas.org` (Choir & Music Ministry scope)
- **Evaluator**: `evaluator@c-cimas.org` (Read-only reports and audits)

---

## 6. Verification & Automated Test Suite

A comprehensive automated verification test suite is included at `src/tests/allocation_engine_test.ts` to validate all Section 14 business acceptance criteria:

```bash
npx ts-node src/tests/allocation_engine_test.ts
```

### Verified Business Criteria:
- [x] A member cannot have two active department allocations.
- [x] Department allocations never exceed fixed maximum capacity ($M_d$).
- [x] Ineligible members are routed to the Administrator Review queue without silent placement.
- [x] Strict deacon requirements (e.g. Diaconate & Altar Service) are strictly enforced.
- [x] Overlapping member eligibility is resolved deterministically with full explainability.
- [x] Repeatable runs with identical inputs produce 100% identical results.
- [x] Allocation previews do not modify active member records until approved.
- [x] Allocation commitments execute atomically inside database transactions.

