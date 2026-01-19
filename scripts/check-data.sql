-- Check remaining data
SELECT 'users' AS table_name, COUNT(*) AS count FROM users
UNION ALL
SELECT 'subjects', COUNT(*) FROM subjects
UNION ALL
SELECT 'notes', COUNT(*) FROM notes
UNION ALL
SELECT 'learning_tools', COUNT(*) FROM learning_tools
UNION ALL
SELECT 'learning_tool_notes', COUNT(*) FROM learning_tool_notes;
