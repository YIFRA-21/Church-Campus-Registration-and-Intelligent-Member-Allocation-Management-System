-- ============================================================================
-- C-CIMAS Master Unified Database Schema: ccmas_db.sql
-- Church Campus Information Management and Allocation System
-- Target Platform: Supabase / PostgreSQL 15+
-- Modules Included:
--   00: Authentication, Profiles & Two-Role RBAC (ADMIN, EVALUATOR)
--   01: Campus Management & Multitenancy (Campuses, Contacts, Status History)
--   02: Department Management & Quotas (Departments, 100% Targets, Capacity)
--   03: Member Management (17 Official Ethiopian Campus Fellowship Fields)
--   04: Import & Validation Staging (CSV Engine, Staged Rows, Review Decisions)
--   05: Eligibility Management Engine (Evaluation Runs, Criteria, Exceptions)
--   06: Capacity Management (Utilization Thresholds, Overrides, History)
--   07: Intelligent Allocation Engine (Hamilton-Hare Apportionment, Balancing)
--   08: Allocation Approval & Exception Overrides
--   10: Performance Evaluation Tasks & Scored Assessments
--   12: Immutable System Audit Ledger
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS & PREREQUISITES
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. SEQUENCES
-- ----------------------------------------------------------------------------
-- Concurrency-safe atomic sequence for Member Codes (ተ.ቁ)
CREATE SEQUENCE IF NOT EXISTS seq_member_code_counter START WITH 1000;
CREATE SEQUENCE IF NOT EXISTS seq_eligibility_run_counter START WITH 1;
CREATE SEQUENCE IF NOT EXISTS seq_allocation_run_counter START WITH 1;

-- ----------------------------------------------------------------------------
-- 3. CORE MULTI-TENANCY & CAMPUSES (MODULE 1)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code CITEXT NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    region VARCHAR(100),
    city VARCHAR(100) NOT NULL,
    sub_city VARCHAR(100),
    woreda VARCHAR(100),
    address TEXT,
    phone_number VARCHAR(50),
    email CITEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,

    CONSTRAINT chk_campuses_code_len CHECK (LENGTH(TRIM(code)) >= 2),
    CONSTRAINT chk_campuses_name_len CHECK (LENGTH(TRIM(name)) >= 2)
);

-- Campus Contacts (Allows multiple contacts, exactly ONE primary contact per campus)
CREATE TABLE IF NOT EXISTS campus_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    contact_name VARCHAR(150) NOT NULL,
    position VARCHAR(100),
    phone VARCHAR(50) NOT NULL,
    email CITEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_contacts_name_len CHECK (LENGTH(TRIM(contact_name)) >= 2)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_campus_contacts_single_primary 
ON campus_contacts (campus_id) 
WHERE (is_primary = TRUE);

-- Campus Status History (Audit trail of status transitions)
CREATE TABLE IF NOT EXISTS campus_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    old_status VARCHAR(20) NOT NULL,
    new_status VARCHAR(20) NOT NULL,
    reason TEXT NOT NULL,
    changed_by UUID,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. AUTHENTICATION, ROLES & PROFILES (MODULE 0)
-- ----------------------------------------------------------------------------
-- Standard TWO Application Roles: ADMIN and EVALUATOR
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE CHECK (name IN ('ADMIN', 'EVALUATOR')),
    description TEXT,
    default_permissions JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles Table (Extends Supabase auth.users or acts as standalone identity)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email CITEXT NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    phone_number VARCHAR(50),
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'EVALUATOR')),
    custom_permissions JSONB NOT NULL DEFAULT '[]'::JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- ----------------------------------------------------------------------------
-- 5. MINISTRIES & DEPARTMENTS (MODULES 2 & 6)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    code CITEXT NOT NULL UNIQUE, -- Globally unique department code
    name VARCHAR(255) NOT NULL,
    description TEXT,
    capacity INTEGER NOT NULL DEFAULT 500 CHECK (capacity >= 0),
    allocated_members_count INTEGER NOT NULL DEFAULT 0 CHECK (allocated_members_count >= 0),
    target_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (target_percentage >= 0.00 AND target_percentage <= 100.00),
    priority INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    over_capacity BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Department Target Configurations (Allocation Cycles)
CREATE TABLE IF NOT EXISTS department_target_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    cycle_name VARCHAR(150) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Department Targets (Target percentages per department per cycle)
CREATE TABLE IF NOT EXISTS department_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID REFERENCES campuses(id) ON DELETE CASCADE,
    configuration_id UUID REFERENCES department_target_configurations(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    cycle_name VARCHAR(100),
    target_percentages JSONB,
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (percentage >= 0.00 AND percentage <= 100.00),
    calculated_target INTEGER NOT NULL DEFAULT 0,
    final_allocated INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Department Status Transitions
CREATE TABLE IF NOT EXISTS department_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    old_status VARCHAR(20) NOT NULL,
    new_status VARCHAR(20) NOT NULL,
    reason TEXT NOT NULL,
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Department Capacity Change History (Module 6)
CREATE TABLE IF NOT EXISTS department_capacity_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    previous_capacity INTEGER NOT NULL,
    new_capacity INTEGER NOT NULL,
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    change_reason TEXT,
    confirmation_required BOOLEAN NOT NULL DEFAULT FALSE,
    confirmation_given BOOLEAN NOT NULL DEFAULT FALSE,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Department Capacity Overrides (Module 6 & 7)
CREATE TABLE IF NOT EXISTS capacity_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    requested_count INTEGER NOT NULL,
    existing_allocated_count INTEGER NOT NULL,
    capacity_limit INTEGER NOT NULL,
    projected_allocation_count INTEGER NOT NULL,
    override_reason TEXT NOT NULL,
    requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approval_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'cancelled')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

-- Eligibility Rules Configuration (Modules 2 & 5)
CREATE TABLE IF NOT EXISTS eligibility_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL DEFAULT 'Default Rule',
    rule_type VARCHAR(50) NOT NULL DEFAULT 'GENERAL', -- 'GENDER', 'CATEGORY', 'SPIRITUAL_STATUS', 'CUSTOM'
    operator VARCHAR(50) NOT NULL DEFAULT 'IN',
    value JSONB NOT NULL DEFAULT '[]'::JSONB,
    criteria JSONB NOT NULL DEFAULT '{"rules": []}'::JSONB,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. MEMBERS REGISTRY (MODULE 3)
-- ----------------------------------------------------------------------------
-- Includes ALL 17 Official Ethiopian Orthodox Campus Fellowship (Mahibere Kidusan) Fields
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    
    -- 1. ተ.ቁ (No. / Member ID / Identifier Code)
    member_id VARCHAR(100) NOT NULL UNIQUE,
    
    -- 2. ሙሉ ስም (Full Name) & Separate Name Tokens
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    
    -- 3. ክርስትና ስም (Christian / Baptismal Name)
    christian_name VARCHAR(150),
    
    -- 4. ጾታ (Gender: MALE, FEMALE, OTHER)
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    
    -- 5. ስልክ ቁጥር (Primary Mobile Phone Number)
    phone_number VARCHAR(50),
    email CITEXT,
    
    -- 6. ዲፓርትመንት (Academic Department / University Faculty)
    academic_department VARCHAR(255),
    
    -- 7. የመጡበት ክልል (Origin Region)
    origin_region VARCHAR(100),
    
    -- 8. ዞን (Administrative Zone)
    zone VARCHAR(100),
    
    -- 9. ወረዳ (Woreda / District)
    woreda VARCHAR(100),
    
    -- 10. ቀበሌ (Kebele / Sub-district)
    kebele VARCHAR(100),
    
    -- 11. ብሎክ (Dormitory Block)
    dorm_block VARCHAR(50),
    
    -- 12. ዶርም (Dormitory Room)
    dorm_room VARCHAR(50),
    
    -- 13. ቋንቋ (Primary Spoken Language)
    language VARCHAR(100) NOT NULL DEFAULT 'አማርኛ',
    
    -- 14. የተጠሪ ስም (Emergency Contact / Sponsor Name)
    emergency_contact_name VARCHAR(150),
    
    -- 15. የተጠሪ ስልክ (Emergency Contact Phone)
    emergency_contact_phone VARCHAR(50),
    
    -- 16. የሰንበት ት/ቤት ቆይታ (Sunday School Duration / Spiritual Background)
    sunday_school_duration VARCHAR(100),
    
    -- 17. ዕድሜ (Age)
    age INTEGER CHECK (age >= 0 AND age <= 150),
    
    -- Ecclesiastical Classification & Spiritual Demographics
    category VARCHAR(50) NOT NULL DEFAULT 'STUDENT' CHECK (category IN ('YOUTH', 'ADULT', 'ELDER', 'STUDENT', 'CHILDREN', 'YOUNG_ADULT')),
    spiritual_status VARCHAR(50) NOT NULL DEFAULT 'REGULAR' CHECK (spiritual_status IN ('DEACON', 'SERVANT', 'REGULAR')),
    education_level VARCHAR(100),
    address TEXT,
    emergency_contact VARCHAR(100),
    
    -- Member Lifecycle Status (ንቁ / ቦዘኔ / የታገደ / በመጠባበቅ ላይ)
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'ON_HOLD')),
    
    -- Current Ministry Allocation (Single Active Allocation)
    current_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Member Status Change History
CREATE TABLE IF NOT EXISTS member_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    old_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Member Secondary Contacts
CREATE TABLE IF NOT EXISTS member_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    contact_name VARCHAR(150) NOT NULL,
    relationship VARCHAR(100),
    phone_number VARCHAR(50) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. CSV IMPORT & VALIDATION STAGING (MODULE 4)
-- ----------------------------------------------------------------------------
-- Table 1: import_batches
CREATE TABLE IF NOT EXISTS import_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_type VARCHAR(20) NOT NULL DEFAULT 'csv',
    file_size INTEGER NOT NULL DEFAULT 0,
    file_checksum VARCHAR(64), -- SHA-256 Checksum
    total_rows INTEGER NOT NULL DEFAULT 0,
    valid_rows INTEGER NOT NULL DEFAULT 0,
    invalid_rows INTEGER NOT NULL DEFAULT 0,
    duplicate_rows INTEGER NOT NULL DEFAULT 0,
    approved_rows INTEGER NOT NULL DEFAULT 0,
    imported_rows INTEGER NOT NULL DEFAULT 0,
    updated_rows INTEGER NOT NULL DEFAULT 0,
    failed_rows INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'validation_completed', 'awaiting_review', 'approved', 'importing', 'completed', 'completed_with_errors', 'rejected', 'cancelled')),
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Table 2: import_column_mappings
CREATE TABLE IF NOT EXISTS import_column_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
    csv_column_name VARCHAR(150) NOT NULL,
    system_field_name VARCHAR(100) NOT NULL,
    column_index INTEGER NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    mapping_status VARCHAR(50) NOT NULL DEFAULT 'MAPPED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(batch_id, column_index)
);

-- Table 3: import_rows (Staged CSV rows)
CREATE TABLE IF NOT EXISTS import_rows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    original_data JSONB NOT NULL,
    normalized_data JSONB,
    validation_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid')),
    duplicate_status VARCHAR(50) NOT NULL DEFAULT 'not_checked' CHECK (duplicate_status IN ('not_checked', 'no_duplicate', 'possible_duplicate', 'confirmed_duplicate')),
    review_status VARCHAR(50) NOT NULL DEFAULT 'not_required' CHECK (review_status IN ('not_required', 'pending', 'approved_create', 'approved_update', 'rejected', 'needs_more_information')),
    import_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (import_status IN ('pending', 'processing', 'imported', 'updated', 'failed', 'skipped')),
    matched_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    created_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(batch_id, row_number)
);

-- Table 4: import_validation_errors
CREATE TABLE IF NOT EXISTS import_validation_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_row_id UUID NOT NULL REFERENCES import_rows(id) ON DELETE CASCADE,
    field_name VARCHAR(100),
    error_code VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'error' CHECK (severity IN ('error', 'warning')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 5: import_duplicate_candidates
CREATE TABLE IF NOT EXISTS import_duplicate_candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_row_id UUID NOT NULL REFERENCES import_rows(id) ON DELETE CASCADE,
    existing_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    match_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    matching_fields JSONB NOT NULL DEFAULT '[]'::JSONB,
    match_reason TEXT NOT NULL,
    review_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(import_row_id, existing_member_id)
);

-- Table 6: import_review_decisions
CREATE TABLE IF NOT EXISTS import_review_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_row_id UUID NOT NULL REFERENCES import_rows(id) ON DELETE CASCADE,
    administrator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    decision VARCHAR(50) NOT NULL CHECK (decision IN ('create_new_member', 'update_existing_member', 'reject_row', 'request_correction')),
    selected_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 7: import_execution_logs
CREATE TABLE IF NOT EXISTS import_execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
    import_row_id UUID REFERENCES import_rows(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    result VARCHAR(50) NOT NULL,
    message TEXT,
    executed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Legacy Import Errors View / Compatibility
CREATE TABLE IF NOT EXISTS import_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    member_id VARCHAR(100),
    field_name VARCHAR(100),
    error_message TEXT NOT NULL,
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. ELIGIBILITY MANAGEMENT ENGINE (MODULE 5)
-- ----------------------------------------------------------------------------
-- Table 1: eligibility_evaluation_runs
CREATE TABLE IF NOT EXISTS eligibility_evaluation_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    run_number INTEGER NOT NULL,
    run_type VARCHAR(50) NOT NULL DEFAULT 'full_campus' CHECK (run_type IN ('full_campus', 'selected_members')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'completed_with_errors', 'failed', 'cancelled')),
    rules_snapshot JSONB NOT NULL DEFAULT '[]'::JSONB,
    rules_snapshot_hash VARCHAR(64),
    member_count INTEGER NOT NULL DEFAULT 0,
    department_count INTEGER NOT NULL DEFAULT 0,
    eligible_count INTEGER NOT NULL DEFAULT 0,
    ineligible_count INTEGER NOT NULL DEFAULT 0,
    review_required_count INTEGER NOT NULL DEFAULT 0,
    exception_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    started_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 2: member_department_eligibility
CREATE TABLE IF NOT EXISTS member_department_eligibility (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_run_id UUID NOT NULL REFERENCES eligibility_evaluation_runs(id) ON DELETE CASCADE,
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    eligibility_status VARCHAR(50) NOT NULL CHECK (eligibility_status IN ('eligible', 'ineligible', 'requires_review', 'evaluation_error')),
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(evaluation_run_id, member_id, department_id)
);

-- Table 3: eligibility_evaluation_reasons
CREATE TABLE IF NOT EXISTS eligibility_evaluation_reasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    eligibility_result_id UUID NOT NULL REFERENCES member_department_eligibility(id) ON DELETE CASCADE,
    rule_identifier VARCHAR(150) NOT NULL,
    rule_outcome VARCHAR(50) NOT NULL CHECK (rule_outcome IN ('passed', 'failed', 'not_evaluable', 'error')),
    field_name VARCHAR(100),
    expected_value JSONB,
    actual_value JSONB,
    explanation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 4: eligibility_exception_cases (Members with 0 eligible departments or requires_review)
CREATE TABLE IF NOT EXISTS eligibility_exception_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_run_id UUID NOT NULL REFERENCES eligibility_evaluation_runs(id) ON DELETE CASCADE,
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    exception_reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    UNIQUE(evaluation_run_id, member_id)
);

-- Table 5: eligibility_exception_decisions
CREATE TABLE IF NOT EXISTS eligibility_exception_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exception_case_id UUID NOT NULL REFERENCES eligibility_exception_cases(id) ON DELETE CASCADE,
    administrator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    decision_type VARCHAR(50) NOT NULL,
    selected_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    decision_reason TEXT NOT NULL,
    decision_details JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. INTELLIGENT ALLOCATION ENGINE & EXCEPTIONS (MODULES 7 & 8)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS allocation_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    cycle_name VARCHAR(150) NOT NULL,
    run_number INTEGER,
    run_type VARCHAR(50) NOT NULL DEFAULT 'full_campus',
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PREVIEW_READY', 'APPROVED', 'CANCELLED', 'COMMITTED')),
    eligibility_run_id UUID REFERENCES eligibility_evaluation_runs(id) ON DELETE SET NULL,
    target_configuration_id UUID REFERENCES department_target_configurations(id) ON DELETE SET NULL,
    total_members INTEGER NOT NULL DEFAULT 0,
    allocated_count INTEGER NOT NULL DEFAULT 0,
    unallocated_count INTEGER NOT NULL DEFAULT 0,
    exception_count INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS allocation_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES allocation_batches(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    target_percentage NUMERIC(5,2) NOT NULL,
    target_count INTEGER NOT NULL,
    allocated_count INTEGER NOT NULL DEFAULT 0,
    capacity INTEGER NOT NULL,
    target_deviation INTEGER NOT NULL DEFAULT 0
);

-- Member Allocations: Enforces ONE active department assignment per member
CREATE TABLE IF NOT EXISTS member_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES allocation_batches(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    allocation_status VARCHAR(50) NOT NULL DEFAULT 'PROPOSED' CHECK (allocation_status IN ('PROPOSED', 'COMMITTED', 'REASSIGNED', 'CANCELLED')),
    allocation_method VARCHAR(50) NOT NULL DEFAULT 'AUTOMATIC' CHECK (allocation_method IN ('AUTOMATIC', 'MANUAL_OVERRIDE')),
    is_override BOOLEAN NOT NULL DEFAULT FALSE,
    override_id UUID REFERENCES capacity_overrides(id) ON DELETE SET NULL,
    reason_code VARCHAR(100),
    override_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(batch_id, member_id)
);

-- Partial Unique Index: Exactly ONE active committed allocation per member
CREATE UNIQUE INDEX IF NOT EXISTS uq_member_single_active_allocation 
ON member_allocations (member_id) 
WHERE (allocation_status = 'COMMITTED');

CREATE TABLE IF NOT EXISTS allocation_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES allocation_batches(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    exception_type VARCHAR(50) NOT NULL CHECK (exception_type IN ('NO_ELIGIBLE_DEPARTMENT', 'CAPACITY_EXCEEDED', 'MANUAL_HOLD', 'MISSING_DATA')),
    reason TEXT NOT NULL,
    eligible_departments JSONB NOT NULL DEFAULT '[]'::JSONB,
    resolution_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (resolution_status IN ('PENDING', 'RESOLVED', 'ON_HOLD')),
    resolved_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolution_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS allocation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    allocation_id UUID REFERENCES member_allocations(id) ON DELETE CASCADE,
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    previous_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    new_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    reason TEXT,
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 10. PERFORMANCE EVALUATIONS & ASSESSMENTS (MODULE 10)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evaluation_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'NEEDS_CORRECTION', 'APPROVED')),
    correction_notes TEXT,
    due_date TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES evaluation_tasks(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    evaluator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    comments TEXT,
    criteria_scores JSONB NOT NULL DEFAULT '{}'::JSONB,
    is_draft BOOLEAN NOT NULL DEFAULT TRUE,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(task_id, member_id)
);

-- ----------------------------------------------------------------------------
-- 11. SYSTEM AUDIT LEDGER (MODULE 12)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_email VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
    before_state JSONB,
    after_state JSONB,
    justification TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 12. DATABASE FUNCTIONS & AUTOMATIC TRIGGERS
-- ----------------------------------------------------------------------------

-- Function: Atomic Member Code Generator (Triggered Before Insert)
CREATE OR REPLACE FUNCTION trg_generate_member_code_fn()
RETURNS TRIGGER AS $$
DECLARE
    curr_year TEXT;
    seq_val BIGINT;
BEGIN
    IF NEW.member_id IS NULL OR TRIM(NEW.member_id) = '' THEN
        curr_year := TO_CHAR(CURRENT_DATE, 'YYYY');
        seq_val := nextval('seq_member_code_counter');
        NEW.member_id := 'MEM-' || curr_year || '-' || LPAD(seq_val::TEXT, 4, '0');
    ELSE
        NEW.member_id := TRIM(NEW.member_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_members_auto_code ON members;
CREATE TRIGGER trg_members_auto_code
    BEFORE INSERT ON members
    FOR EACH ROW
    EXECUTE FUNCTION trg_generate_member_code_fn();

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION trg_set_timestamp_fn()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_campuses_updated_at ON campuses;
CREATE TRIGGER trg_campuses_updated_at BEFORE UPDATE ON campuses FOR EACH ROW EXECUTE FUNCTION trg_set_timestamp_fn();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION trg_set_timestamp_fn();

DROP TRIGGER IF EXISTS trg_departments_updated_at ON departments;
CREATE TRIGGER trg_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION trg_set_timestamp_fn();

DROP TRIGGER IF EXISTS trg_members_updated_at ON members;
CREATE TRIGGER trg_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION trg_set_timestamp_fn();

DROP TRIGGER IF EXISTS trg_import_batches_updated_at ON import_batches;
CREATE TRIGGER trg_import_batches_updated_at BEFORE UPDATE ON import_batches FOR EACH ROW EXECUTE FUNCTION trg_set_timestamp_fn();

DROP TRIGGER IF EXISTS trg_import_rows_updated_at ON import_rows;
CREATE TRIGGER trg_import_rows_updated_at BEFORE UPDATE ON import_rows FOR EACH ROW EXECUTE FUNCTION trg_set_timestamp_fn();

DROP TRIGGER IF EXISTS trg_eligibility_exceptions_updated_at ON eligibility_exception_cases;
CREATE TRIGGER trg_eligibility_exceptions_updated_at BEFORE UPDATE ON eligibility_exception_cases FOR EACH ROW EXECUTE FUNCTION trg_set_timestamp_fn();

DROP TRIGGER IF EXISTS trg_allocation_batches_updated_at ON allocation_batches;
CREATE TRIGGER trg_allocation_batches_updated_at BEFORE UPDATE ON allocation_batches FOR EACH ROW EXECUTE FUNCTION trg_set_timestamp_fn();

-- Helper function for Row Level Security
CREATE OR REPLACE FUNCTION auth_current_campus_id(p_user_id UUID) 
RETURNS UUID AS $$
DECLARE
    v_campus_id UUID;
BEGIN
    SELECT campus_id INTO v_campus_id FROM profiles WHERE id = p_user_id;
    RETURN v_campus_id;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION auth_is_super_admin(p_user_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles WHERE id = p_user_id AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- ----------------------------------------------------------------------------
-- 13. HIGH-PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_campuses_status ON campuses(status);
CREATE INDEX IF NOT EXISTS idx_campuses_city ON campuses(city);
CREATE INDEX IF NOT EXISTS idx_profiles_campus ON profiles(campus_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_departments_campus ON departments(campus_id);
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);
CREATE INDEX IF NOT EXISTS idx_departments_priority ON departments(priority ASC);
CREATE INDEX IF NOT EXISTS idx_eligibility_rules_dept ON eligibility_rules(department_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_rules_gin ON eligibility_rules USING GIN (criteria);
CREATE INDEX IF NOT EXISTS idx_members_campus_id ON members(campus_id);
CREATE INDEX IF NOT EXISTS idx_members_current_dept ON members(current_department_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_christian_name ON members(christian_name);
CREATE INDEX IF NOT EXISTS idx_members_origin_region ON members(origin_region);
CREATE INDEX IF NOT EXISTS idx_members_academic_dept ON members(academic_department);
CREATE INDEX IF NOT EXISTS idx_members_dorm_block ON members(dorm_block);
CREATE INDEX IF NOT EXISTS idx_members_language ON members(language);
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone_number);
CREATE INDEX IF NOT EXISTS idx_members_age ON members(age);
CREATE INDEX IF NOT EXISTS idx_import_batches_campus ON import_batches(campus_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_status ON import_batches(status);
CREATE INDEX IF NOT EXISTS idx_import_rows_batch ON import_rows(batch_id);
CREATE INDEX IF NOT EXISTS idx_import_rows_val_status ON import_rows(validation_status);
CREATE INDEX IF NOT EXISTS idx_import_rows_dup_status ON import_rows(duplicate_status);
CREATE INDEX IF NOT EXISTS idx_import_errors_row ON import_validation_errors(import_row_id);
CREATE INDEX IF NOT EXISTS idx_import_dup_row ON import_duplicate_candidates(import_row_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_runs_campus ON eligibility_evaluation_runs(campus_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_runs_status ON eligibility_evaluation_runs(status);
CREATE INDEX IF NOT EXISTS idx_member_dept_elig_run ON member_department_eligibility(evaluation_run_id);
CREATE INDEX IF NOT EXISTS idx_member_dept_elig_member ON member_department_eligibility(member_id);
CREATE INDEX IF NOT EXISTS idx_member_dept_elig_dept ON member_department_eligibility(department_id);
CREATE INDEX IF NOT EXISTS idx_member_dept_elig_status ON member_department_eligibility(eligibility_status);
CREATE INDEX IF NOT EXISTS idx_elig_reasons_result ON eligibility_evaluation_reasons(eligibility_result_id);
CREATE INDEX IF NOT EXISTS idx_elig_exceptions_run ON eligibility_exception_cases(evaluation_run_id);
CREATE INDEX IF NOT EXISTS idx_elig_exceptions_member ON eligibility_exception_cases(member_id);
CREATE INDEX IF NOT EXISTS idx_elig_exceptions_status ON eligibility_exception_cases(status);
CREATE INDEX IF NOT EXISTS idx_member_allocations_batch ON member_allocations(batch_id);
CREATE INDEX IF NOT EXISTS idx_member_allocations_member ON member_allocations(member_id);
CREATE INDEX IF NOT EXISTS idx_member_allocations_dept ON member_allocations(department_id);
CREATE INDEX IF NOT EXISTS idx_allocation_exceptions_batch ON allocation_exceptions(batch_id);
CREATE INDEX IF NOT EXISTS idx_allocation_exceptions_status ON allocation_exceptions(resolution_status);
CREATE INDEX IF NOT EXISTS idx_evaluation_tasks_assigned ON evaluation_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_evaluations_task ON evaluations(task_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator ON evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ----------------------------------------------------------------------------
-- 14. SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campus_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_target_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_capacity_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_evaluation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_department_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_evaluation_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_exception_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_exception_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_column_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_validation_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_duplicate_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_review_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocation_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocation_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocation_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Campuses Policy
DROP POLICY IF EXISTS rls_campuses_policy ON campuses;
CREATE POLICY rls_campuses_policy ON campuses
    FOR ALL TO authenticated
    USING (
        auth_is_super_admin(auth.uid()) OR 
        id = auth_current_campus_id(auth.uid()) OR 
        status = 'ACTIVE'
    );

-- Profiles Policy
DROP POLICY IF EXISTS rls_profiles_policy ON profiles;
CREATE POLICY rls_profiles_policy ON profiles
    FOR ALL TO authenticated
    USING (
        auth_is_super_admin(auth.uid()) OR 
        id = auth.uid() OR 
        campus_id = auth_current_campus_id(auth.uid())
    );

-- Departments Policy
DROP POLICY IF EXISTS rls_departments_select_policy ON departments;
CREATE POLICY rls_departments_select_policy ON departments
    FOR SELECT TO authenticated
    USING (
        auth_is_super_admin(auth.uid()) OR 
        campus_id = auth_current_campus_id(auth.uid()) OR 
        is_active = TRUE
    );

DROP POLICY IF EXISTS rls_departments_admin_policy ON departments;
CREATE POLICY rls_departments_admin_policy ON departments
    FOR ALL TO authenticated
    USING (auth_is_super_admin(auth.uid()))
    WITH CHECK (auth_is_super_admin(auth.uid()));

-- Members Policy
DROP POLICY IF EXISTS rls_members_select_policy ON members;
CREATE POLICY rls_members_select_policy ON members
    FOR SELECT TO authenticated
    USING (
        auth_is_super_admin(auth.uid()) OR 
        campus_id = auth_current_campus_id(auth.uid()) OR 
        status = 'ACTIVE'
    );

DROP POLICY IF EXISTS rls_members_admin_policy ON members;
CREATE POLICY rls_members_admin_policy ON members
    FOR ALL TO authenticated
    USING (auth_is_super_admin(auth.uid()))
    WITH CHECK (auth_is_super_admin(auth.uid()));

-- Import Batches & Rows Policy
DROP POLICY IF EXISTS rls_import_batches_policy ON import_batches;
CREATE POLICY rls_import_batches_policy ON import_batches
    FOR ALL TO authenticated
    USING (
        auth_is_super_admin(auth.uid()) OR 
        campus_id = auth_current_campus_id(auth.uid())
    );

DROP POLICY IF EXISTS rls_import_rows_policy ON import_rows;
CREATE POLICY rls_import_rows_policy ON import_rows
    FOR ALL TO authenticated
    USING (
        auth_is_super_admin(auth.uid()) OR 
        campus_id = auth_current_campus_id(auth.uid())
    );

-- Eligibility Runs Policy
DROP POLICY IF EXISTS rls_eligibility_runs_policy ON eligibility_evaluation_runs;
CREATE POLICY rls_eligibility_runs_policy ON eligibility_evaluation_runs
    FOR ALL TO authenticated
    USING (
        auth_is_super_admin(auth.uid()) OR 
        campus_id = auth_current_campus_id(auth.uid())
    );

-- Allocation Batches Policy
DROP POLICY IF EXISTS rls_allocation_batches_policy ON allocation_batches;
CREATE POLICY rls_allocation_batches_policy ON allocation_batches
    FOR ALL TO authenticated
    USING (
        auth_is_super_admin(auth.uid()) OR 
        campus_id = auth_current_campus_id(auth.uid())
    );
