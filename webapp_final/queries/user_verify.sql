SELECT user_id, user_type, password_hash
FROM users
WHERE email_address = ?;
