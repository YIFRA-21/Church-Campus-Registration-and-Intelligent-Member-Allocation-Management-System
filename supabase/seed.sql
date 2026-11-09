-- ============================================================================
-- C-CIMAS Seed Data: Initial Campuses, Roles, and Permissions
-- ============================================================================

-- 1. Insert Default Campuses
INSERT INTO campuses (id, code, name, city, address, is_active)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'ADD-01', 'Main Campus (Addis Ababa)', 'Addis Ababa', 'Arat Kilo Central Cathedral', TRUE),
  ('a0000000-0000-0000-0000-000000000002', 'BOL-02', 'Bole Sub-Campus', 'Addis Ababa', 'Bole Medhanealem District', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 2. Insert Standard 6 Primary Roles with capability tokens
INSERT INTO roles (id, name, description, default_permissions)
VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'SUPER_ADMIN',
    'Global System Administrator with complete multi-campus governance',
    '["campus.manage", "campus.view", "user.manage", "department.manage", "department.view", "member.register", "member.import_excel", "member.view_all", "member.view_dept", "allocation.configure", "allocation.run", "allocation.approve", "member.reassign", "member.assign_exception", "reports.view", "export.excel", "audit.view", "settings.manage"]'::JSONB
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'CAMPUS_ADMIN',
    'Campus Administrator with full administrative authority over assigned campus',
    '["campus.view", "user.manage", "department.manage", "department.view", "member.register", "member.import_excel", "member.view_all", "member.view_dept", "allocation.configure", "allocation.run", "allocation.approve", "member.reassign", "member.assign_exception", "reports.view", "export.excel", "audit.view"]'::JSONB
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'REGISTRATION_OFFICER',
    'Registration Officer for member data entry and Excel bulk imports',
    '["campus.view", "member.register", "member.import_excel", "member.view_all", "department.view"]'::JSONB
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    'DEPT_MANAGER',
    'Department Manager with restricted access exclusively to own department roster',
    '["campus.view", "department.view", "member.view_dept", "reports.view", "export.excel"]'::JSONB
  ),
  (
    'b0000000-0000-0000-0000-000000000005',
    'EVALUATOR',
    'Monitoring and Evaluation Officer with analytical and report access',
    '["campus.view", "department.view", "member.view_all", "reports.view", "export.excel", "audit.view"]'::JSONB
  ),
  (
    'b0000000-0000-0000-0000-000000000006',
    'VIEWER_AUDITOR',
    'Read-only Compliance and Governance Auditor',
    '["campus.view", "department.view", "member.view_all", "reports.view", "audit.view"]'::JSONB
  )
ON CONFLICT (name) DO NOTHING;

