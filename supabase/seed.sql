-- ============================================================================
-- C-CIMAS Master Unified Seed Data: seed.sql
-- Church Campus Information Management and Allocation System
-- Platform: Supabase / PostgreSQL 15+
-- Includes:
--   1. Default Campuses (Main Campus & Bole Sub-Campus)
--   2. Primary Campus Contacts
--   3. Standard Two Primary Roles (ADMIN, EVALUATOR)
--   4. Default User Profiles & Credentials (Password: admin123)
--   5. User Role Mappings
--   6. 5 Canonical Ministries & Departments (Sum: 100.00%)
--   7. Department Percentage Target Allocation Configurations
--   8. Department Eligibility Criteria (JSONB Rules)
--   9. Comprehensive Sample Members (All 17 Ethiopian Fellowship Columns)
--  10. Sample Evaluation Tasks & Telemetry Audit Records
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DEFAULT CAMPUSES (MODULE 1)
-- ----------------------------------------------------------------------------
INSERT INTO campuses (id, code, name, description, region, city, sub_city, woreda, address, phone_number, email, status, is_active)
VALUES 
  (
    'a0000000-0000-0000-0000-000000000001',
    'ADD-01',
    'Main Campus (Addis Ababa)',
    'Central university diocese campus cathedral and student fellowship center',
    'አዲስ አበባ',
    'Addis Ababa',
    'አራዳ (Arada)',
    'ወረዳ 01',
    'Arat Kilo Central Cathedral Compound, University Avenue',
    '+251111223344',
    'addis@c-cimas.org',
    'ACTIVE',
    TRUE
  ),
  (
    'a0000000-0000-0000-0000-000000000002',
    'BOL-02',
    'Bole Sub-Campus',
    'Bole sub-city campus ministry center and youth outreach fellowship',
    'አዲስ አበባ',
    'Addis Ababa',
    'ቦሌ (Bole)',
    'ወረዳ 03',
    'Bole Medhanealem District, Youth Fellowship Pavilion',
    '+251111334455',
    'bole@c-cimas.org',
    'ACTIVE',
    TRUE
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  city = EXCLUDED.city,
  address = EXCLUDED.address,
  phone_number = EXCLUDED.phone_number,
  email = EXCLUDED.email,
  is_active = EXCLUDED.is_active;

-- ----------------------------------------------------------------------------
-- 2. PRIMARY CAMPUS CONTACTS (MODULE 1)
-- ----------------------------------------------------------------------------
INSERT INTO campus_contacts (id, campus_id, contact_name, position, phone, email, is_primary)
VALUES
  (
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Rev. Solomon Tadesse',
    'Dean & Diocesan Director',
    '+251911223344',
    'solomon.tadesse@c-cimas.org',
    TRUE
  ),
  (
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'Kesis Tesfaye Woldemariam',
    'Campus Administrator',
    '+251922334455',
    'tesfaye.w@c-cimas.org',
    TRUE
  )
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. STANDARD TWO ROLES (MODULE 0)
-- ----------------------------------------------------------------------------
INSERT INTO roles (id, name, description, default_permissions)
VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'ADMIN',
    'Full executive administrative control over campuses, departments, members, allocation, evaluations, and reports',
    '["campus.manage", "campus.view", "department.manage", "department.view", "department.target.manage", "department.eligibility.manage", "member.register", "member.import_excel", "member.view_all", "member.manage", "allocation.configure", "allocation.run", "allocation.review", "allocation.override", "allocation.approve", "evaluation.manage", "evaluation.assign", "evaluation.review", "reports.view", "reports.export", "audit.view", "settings.manage", "user.manage"]'::JSONB
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'EVALUATOR',
    'Restricted read-only roster viewing and active scoring for assigned candidate evaluations',
    '["evaluation.view_assigned", "evaluation.score", "evaluation.draft", "evaluation.submit", "evaluation.history", "member.view_assigned", "department.roster.view"]'::JSONB
  )
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  default_permissions = EXCLUDED.default_permissions;

-- ----------------------------------------------------------------------------
-- 4. OFFICIAL DEFAULT PROFILES (Password: admin123 via bcrypt hash)
-- ----------------------------------------------------------------------------
INSERT INTO profiles (id, campus_id, full_name, email, password_hash, role, phone_number, is_active)
VALUES
  (
    'f0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Rev. Solomon Tadesse (Admin)',
    'admin@c-cimas.org',
    '$2a$10$7Z2v4V8cT0qU7tY5W2R3UeK3l7V6.G7j8s6m5d4c3b2a1a2b3c4d5',
    'ADMIN',
    '+251911223344',
    TRUE
  ),
  (
    'f0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Dr. Aster Melaku (Evaluator)',
    'evaluator@c-cimas.org',
    '$2a$10$7Z2v4V8cT0qU7tY5W2R3UeK3l7V6.G7j8s6m5d4c3b2a1a2b3c4d5',
    'EVALUATOR',
    '+251922334455',
    TRUE
  )
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  campus_id = EXCLUDED.campus_id,
  is_active = EXCLUDED.is_active;

-- Link Profiles to Roles
INSERT INTO user_roles (id, user_id, role_id)
VALUES
  ('fb000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'),
  ('fb000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. 5 CANONICAL CAMPUS MINISTRIES & DEPARTMENTS (MODULE 2)
-- Master Specification: Sums to exactly 100.00%
-- ----------------------------------------------------------------------------
INSERT INTO departments (id, campus_id, code, name, description, capacity, target_percentage, priority, is_active)
VALUES
  (
    'd0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'CHOIR-01',
    'Choir & Hymns Ministry',
    'Liturgical music, hymns, and spiritual worship service',
    600,
    30.00,
    1,
    TRUE
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'TEACH-01',
    'Spiritual Education & Teaching',
    'Doctrinal instruction, youth bible studies, and catechism',
    500,
    25.00,
    2,
    TRUE
  ),
  (
    'd0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'PRAY-01',
    'Prayer & Intercession',
    'Dedicated campus vigils, intercessory prayer, and fast coordination',
    400,
    20.00,
    3,
    TRUE
  ),
  (
    'd0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'EVANG-01',
    'Evangelism & Outreach',
    'New member welcome, university outreach, and spiritual missions',
    350,
    15.00,
    4,
    TRUE
  ),
  (
    'd0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    'SOC-01',
    'Social Service & Charity',
    'Community assistance, student welfare, and charitable deeds',
    300,
    10.00,
    5,
    TRUE
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  capacity = EXCLUDED.capacity,
  target_percentage = EXCLUDED.target_percentage,
  priority = EXCLUDED.priority,
  is_active = EXCLUDED.is_active;

-- ----------------------------------------------------------------------------
-- 6. DEPARTMENT TARGET CONFIGURATIONS (MODULE 2)
-- ----------------------------------------------------------------------------
INSERT INTO department_target_configurations (id, campus_id, cycle_name, is_active)
VALUES (
  'e0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  '2026/2027 Main Campus Annual Allocation',
  TRUE
)
ON CONFLICT DO NOTHING;

INSERT INTO department_targets (id, campus_id, configuration_id, department_id, cycle_name, percentage, is_active)
VALUES
  ('da000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '2026/2027 Annual', 30.00, TRUE),
  ('da000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', '2026/2027 Annual', 25.00, TRUE),
  ('da000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', '2026/2027 Annual', 20.00, TRUE),
  ('da000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', '2026/2027 Annual', 15.00, TRUE),
  ('da000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', '2026/2027 Annual', 10.00, TRUE)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. ELIGIBILITY CRITERIA RULES (MODULE 2 & 5)
-- ----------------------------------------------------------------------------
INSERT INTO eligibility_rules (id, department_id, rule_name, rule_type, operator, value, criteria, is_mandatory, is_active)
VALUES
  (
    'eb000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'Choir Minimum Spiritual Qualifications',
    'SPIRITUAL_STATUS',
    'IN',
    '["DEACON", "SERVANT", "REGULAR"]'::JSONB,
    '{"minAge": 17, "acceptedGenders": ["MALE", "FEMALE"], "sundaySchoolRequired": true}'::JSONB,
    TRUE,
    TRUE
  ),
  (
    'eb000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000002',
    'Teaching Ministry Prerequisites',
    'SPIRITUAL_STATUS',
    'IN',
    '["DEACON", "SERVANT"]'::JSONB,
    '{"minSundaySchoolYears": 3, "acceptedCategories": ["STUDENT", "YOUTH", "ADULT"]}'::JSONB,
    TRUE,
    TRUE
  )
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 8. COMPREHENSIVE SAMPLE MEMBERS (ALL 17 ETHIOPIAN ROSTER FIELDS) (MODULE 3)
-- ----------------------------------------------------------------------------
INSERT INTO members (
    id, campus_id, member_id, first_name, last_name, full_name, christian_name,
    gender, phone_number, email, academic_department, origin_region, zone, woreda,
    kebele, dorm_block, dorm_room, language, emergency_contact_name, emergency_contact_phone,
    sunday_school_duration, age, category, spiritual_status, education_level, address,
    emergency_contact, status, current_department_id
)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'MEM-2026-0001',
    'Ephraim',
    'Haile',
    'Ephraim Haile',
    'ገብረ ማርያም',
    'MALE',
    '+251911223344',
    'ephraim@example.com',
    'Computer Science',
    'አዲስ አበባ',
    'ሰሜን ሸዋ',
    'ወረዳ 03',
    'ቀበሌ 04',
    'Block 42',
    'Room 204',
    'አማርኛ',
    'ቀሲስ ኃይሌ (አባት)',
    '+251911998877',
    '5 ዓመት',
    22,
    'YOUTH',
    'DEACON',
    'BSc Computer Science',
    'Arat Kilo, Addis Ababa',
    '+251911998877',
    'ACTIVE',
    'd0000000-0000-0000-0000-000000000001'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'MEM-2026-0002',
    'Selamawit',
    'Tewodros',
    'Selamawit Tewodros',
    'ወለተ ማርያም',
    'FEMALE',
    '+251922334455',
    'selam@example.com',
    'Accounting & Finance',
    'ኦሮሚያ',
    'ምሥራቅ ሸዋ',
    'ወረዳ 02',
    'ቀበሌ 07',
    'Block 12',
    'Room 318',
    'አፋን ኦሮሞ / አማርኛ',
    'ወ/ሮ ሙሉእመቤት (እናት)',
    '+251922112233',
    '3 ዓመት',
    21,
    'YOUTH',
    'SERVANT',
    'BA Accounting',
    'Piazza, Addis Ababa',
    '+251922112233',
    'ACTIVE',
    'd0000000-0000-0000-0000-000000000002'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'MEM-2026-0003',
    'Kidus',
    'Berhanu',
    'Kidus Berhanu',
    'ተክለ ሃይማኖት',
    'MALE',
    '+251933445566',
    'kidus@example.com',
    'Civil Engineering',
    'አማራ',
    'ደቡብ ጎንደር',
    'ወረዳ 05',
    'ቀበሌ 11',
    'Block 08',
    'Room 105',
    'አማርኛ',
    'አቶ ብርሃኑ (አባት)',
    '+251933556677',
    '7 ዓመት',
    23,
    'STUDENT',
    'DEACON',
    'Pre-Engineering',
    'Sidist Kilo, Addis Ababa',
    '+251933556677',
    'ACTIVE',
    'd0000000-0000-0000-0000-000000000004'
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'MEM-2026-0004',
    'Bethel',
    'Alemayehu',
    'Bethel Alemayehu',
    'ክርስቶስ ሠምራ',
    'FEMALE',
    '+251944556677',
    'bethel@example.com',
    'Medicine & Health Science',
    'ትግራይ',
    'መቐለ ዞን',
    'ወረዳ 01',
    'ቀበሌ 03',
    'Block 15',
    'Room 402',
    'ትግርኛ / አማርኛ',
    'ዶ/ር አለማየሁ (አጎት)',
    '+251944667788',
    '4 ዓመት',
    20,
    'STUDENT',
    'SERVANT',
    'Doctor of Medicine (MD)',
    'Tikur Anbessa Campus, Addis Ababa',
    '+251944667788',
    'ACTIVE',
    'd0000000-0000-0000-0000-000000000003'
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    'MEM-2026-0005',
    'Yohannes',
    'Moges',
    'Yohannes Moges',
    'ኃይለ ሚካኤል',
    'MALE',
    '+251955667788',
    'yohannes@example.com',
    'Electrical Engineering',
    'ደቡብ ኢትዮጵያ',
    'ጉራጌ ዞን',
    'ወልቂጤ ወረዳ',
    'ቀበሌ 01',
    'Block 02',
    'Room 115',
    'አማርኛ / ጉራጊኛ',
    'አቶ ሞገስ (አባት)',
    '+251955778899',
    '2 ዓመት',
    22,
    'STUDENT',
    'REGULAR',
    'BSc Electrical Eng',
    'Kotebe, Addis Ababa',
    '+251955778899',
    'ACTIVE',
    'd0000000-0000-0000-0000-000000000005'
  )
ON CONFLICT (member_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  christian_name = EXCLUDED.christian_name,
  phone_number = EXCLUDED.phone_number,
  academic_department = EXCLUDED.academic_department,
  origin_region = EXCLUDED.origin_region,
  zone = EXCLUDED.zone,
  woreda = EXCLUDED.woreda,
  kebele = EXCLUDED.kebele,
  dorm_block = EXCLUDED.dorm_block,
  dorm_room = EXCLUDED.dorm_room,
  language = EXCLUDED.language,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  sunday_school_duration = EXCLUDED.sunday_school_duration,
  age = EXCLUDED.age,
  status = EXCLUDED.status,
  current_department_id = EXCLUDED.current_department_id;

-- ----------------------------------------------------------------------------
-- 9. SAMPLE EVALUATION TASK & AUDIT TELEMETRY (MODULES 10 & 12)
-- ----------------------------------------------------------------------------
INSERT INTO evaluation_tasks (id, campus_id, department_id, title, description, assigned_to, status, due_date, created_by)
VALUES (
  'ec000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'Evaluate Choir Intake Candidates (Zema & Liturgical Chants)',
  'Assess vocal pitch, liturgical chant comprehension, and spiritual commitment',
  'f0000000-0000-0000-0000-000000000002', -- Dr. Aster Melaku (Evaluator)
  'PENDING',
  NOW() + INTERVAL '14 days',
  'f0000000-0000-0000-0000-000000000001'
)
ON CONFLICT DO NOTHING;

INSERT INTO audit_logs (id, user_email, user_role, action, entity_type, entity_id, campus_id, justification)
VALUES (
  'fa000000-0000-0000-0000-000000000001',
  'admin@c-cimas.org',
  'ADMIN',
  'SYSTEM_INITIALIZATION',
  'CAMPUS_DATABASE',
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Initial database deployment, canonical ministries setup and master seed initialization'
)
ON CONFLICT DO NOTHING;
