-- Create test user with known password
-- Password: test123
-- Hash generated with bcrypt

INSERT INTO users (email, hashed_password, full_name, role, is_active)
VALUES (
    'test@amara.ai',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYsKvDXuXOG',
    'Test User',
    'admin',
    true
)
ON CONFLICT (email) DO UPDATE
SET hashed_password = EXCLUDED.hashed_password,
    updated_at = CURRENT_TIMESTAMP;

-- Display the user
SELECT id, email, full_name, role, is_active, created_at
FROM users
WHERE email = 'test@amara.ai';