-- ============================================================================
-- C-CIMAS Migration: 20261109000001_create_auth_and_core_schema.sql
-- Module 1 & 2: Core Tenancy, Authentication, Profiles and RBAC Schema
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- 1. CAMPUSES TABLE
CREATE TABLE IF NOT EXISTS campuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code CITEXT NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT,
    phone_number VARCHAR(50),
    email CITEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE, -- 'SUPER_ADMIN', 'CAMPUS_ADMIN', 'REGISTRATION_OFFICER', etc.
    description TEXT,
    default_permissions JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PROFILES TABLE (Mirrors and extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY, -- References auth.users(id) in Supabase production
    campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email CITEXT NOT NULL UNIQUE,
    phone_number VARCHAR(50),
    custom_permissions JSONB NOT NULL DEFAULT '[]'::JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. USER_ROLES TABLE
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- Indices for rapid lookup
CREATE INDEX IF NOT EXISTS idx_profiles_campus ON profiles(campus_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);

-- Helper functions for PostgreSQL Row Level Security (RLS)
CREATE OR REPLACE FUNCTION auth_current_campus_id(p_user_id UUID) 
RETURNS UUID AS $$
  SELECT campus_id FROM profiles WHERE id = p_user_id;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth_is_super_admin(p_user_id UUID) 
RETURNS BOOLEAN AS $$
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = p_user_id AND r.name = 'SUPER_ADMIN'
  );
$$ LANGUAGE sql STABLE;

-- Enable RLS
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policies for campuses
DROP POLICY IF EXISTS campus_isolation_policy ON campuses;
CREATE POLICY campus_isolation_policy ON campuses
FOR ALL TO authenticated
USING (
  auth_is_super_admin(auth.uid()) OR id = auth_current_campus_id(auth.uid())
);

-- Policies for profiles
DROP POLICY IF EXISTS profile_self_and_campus_policy ON profiles;
CREATE POLICY profile_self_and_campus_policy ON profiles
FOR ALL TO authenticated
USING (
  auth_is_super_admin(auth.uid()) OR id = auth.uid() OR campus_id = auth_current_campus_id(auth.uid())
);

