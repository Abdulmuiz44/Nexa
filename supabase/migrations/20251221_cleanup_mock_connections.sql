-- Clean up mock and test connections from database
-- Remove any test data that may have been created during development

DELETE FROM composio_connections 
WHERE account_username IN ('mock', 'test', 'demo', 'test_user', 'mock_user')
   OR account_username LIKE 'mock_%'
   OR account_username LIKE 'test_%'
   OR composio_connection_id LIKE 'mock-%'
   OR composio_connection_id = '';

-- Ensure no NULL or empty account_username values
DELETE FROM composio_connections 
WHERE account_username IS NULL 
   OR account_username = '';
