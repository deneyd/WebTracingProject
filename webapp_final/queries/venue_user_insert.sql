BEGIN;
INSERT INTO users (first_name, last_name, email_address, password_hash, phone_number, user_type)
VALUES (?, ?, ?, ?, ?, 'venue');
SET @last_user_id=LAST_INSERT_ID();
INSERT INTO addresses (street, suburb, state, postcode, latitude, longitude)
VALUES (?, ?, ?, ?, ?, ?);
SET @last_address_id=LAST_INSERT_ID();
INSERT INTO venues (owner, name, address, checkin_code)
VALUES (@last_user_id, ?, @last_address_id, CONCAT(@last_user_id, @last_address_id));
COMMIT;
