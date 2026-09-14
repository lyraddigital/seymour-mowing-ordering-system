-- Local development only. Never use this fixture for remote provisioning.
INSERT INTO users (id, email, display_name, role, is_active, created_at, updated_at)
VALUES ('62ecbd60-7ce0-4d5a-9225-3fc729c07a61', 'developer@example.test', 'Local Developer', 'admin', 1, 1800000000000, 1800000000000)
ON CONFLICT(email) DO NOTHING;
