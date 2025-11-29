-- Amara AI Database Schema
-- PostgreSQL (Cloud SQL compatible)

-- ============================================
-- 1. USERS TABLE (Authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    hashed_password TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer', -- 'admin', 'analyst', 'viewer'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- 2. CUSTOMERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_number VARCHAR(255) UNIQUE NOT NULL,
    date_of_birth DATE,
    marital_status VARCHAR(50),
    religion INTEGER,
    purpose TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_number ON customers(customer_number);

-- ============================================
-- 3. LOANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id VARCHAR(255) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    principal_amount DECIMAL(15,2),
    outstanding_amount DECIMAL(15,2),
    dpd INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loans_loan_id ON loans(loan_id);
CREATE INDEX IF NOT EXISTS idx_loans_customer ON loans(customer_id);
CREATE INDEX IF NOT EXISTS idx_loans_dpd ON loans(dpd);

-- ============================================
-- 4. BILLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
    bill_id VARCHAR(255),
    bill_scheduled_date DATE,
    bill_paid_date DATE,
    amount DECIMAL(15,2),
    paid_amount DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bills_loan ON bills(loan_id);
CREATE INDEX IF NOT EXISTS idx_bills_scheduled ON bills(bill_scheduled_date);

-- ============================================
-- 5. BRANCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id VARCHAR(255) UNIQUE NOT NULL,
    task_type VARCHAR(50),
    task_status VARCHAR(50),
    start_datetime TIMESTAMPTZ,
    end_datetime TIMESTAMPTZ,
    actual_datetime TIMESTAMPTZ,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    branch_id UUID REFERENCES branches(id),
    field_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_task_id ON tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(task_status);

-- ============================================
-- 7. TASK PARTICIPANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS task_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    participant_type VARCHAR(50),
    participant_id VARCHAR(255),
    is_face_matched BOOLEAN DEFAULT FALSE,
    is_qr_matched BOOLEAN DEFAULT FALSE,
    payment_amount DECIMAL(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participants_task ON task_participants(task_id);
CREATE INDEX IF NOT EXISTS idx_participants_type ON task_participants(participant_type);

-- ============================================
-- 8. PHOTOS TABLE (For Gemini Vision)
-- ============================================
CREATE TABLE IF NOT EXISTS photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    loan_id UUID REFERENCES loans(id),
    photo_type VARCHAR(50) NOT NULL, -- 'BUSINESS' or 'HOUSE'
    file_path TEXT,
    storage_url TEXT,
    analysis_result JSONB,
    analyzed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_customer ON photos(customer_id);
CREATE INDEX IF NOT EXISTS idx_photos_type ON photos(photo_type);

-- ============================================
-- 9. CREDIT ASSESSMENTS TABLE (Core Output)
-- ============================================
CREATE TABLE IF NOT EXISTS credit_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    loan_id UUID REFERENCES loans(id),

    -- ML Module Scores
    ml_score DECIMAL(5,4),
    ml_risk_category VARCHAR(50),
    ml_features JSONB,

    -- Vision Module Scores (Gemini Flash)
    vision_score DECIMAL(5,4),
    vision_business_scale VARCHAR(50),
    vision_asset_quality VARCHAR(50),
    vision_analysis JSONB,

    -- NLP Module Scores (Gemini Pro)
    nlp_score DECIMAL(5,4),
    nlp_income_signals JSONB,
    nlp_risk_flags JSONB,
    nlp_sentiment VARCHAR(50),
    nlp_analysis JSONB,

    -- Final Fused Score
    final_score DECIMAL(5,4),
    final_risk_category VARCHAR(50), -- 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'
    loan_recommendation VARCHAR(50), -- 'APPROVE', 'REVIEW', 'REJECT'
    income_consistency DECIMAL(5,4),

    -- Explainability
    explanation TEXT,
    confidence DECIMAL(5,4),

    -- Metadata
    assessed_by VARCHAR(100) DEFAULT 'AMARA_AI',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessments_customer ON credit_assessments(customer_id);
CREATE INDEX IF NOT EXISTS idx_assessments_loan ON credit_assessments(loan_id);
CREATE INDEX IF NOT EXISTS idx_assessments_risk ON credit_assessments(final_risk_category);
CREATE INDEX IF NOT EXISTS idx_assessments_recommendation ON credit_assessments(loan_recommendation);

-- ============================================
-- 10. UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'users_updated_at') THEN
        CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'customers_updated_at') THEN
        CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'loans_updated_at') THEN
        CREATE TRIGGER loans_updated_at BEFORE UPDATE ON loans
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END;
$$;
