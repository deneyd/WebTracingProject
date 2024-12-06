BEGIN;
INSERT INTO users (first_name, last_name, email_address, password_hash, phone_number, user_type)
VALUES ("teseting", "testing", "testing@testing.com", "adada", "12312", "normal");
SET @last_user_id=LAST_INSERT_ID();
INSERT INTO addresses (street, suburb, state, postcode, latitude, longitude)
VALUES ("!23 street", "wynnvale", "sa", "5127", "12.3213123", "-90.12323");
SET @last_address_id=LAST_INSERT_ID();
INSERT INTO normal_users (user, gender, date_of_birth, address)
VALUES (@last_user_id, 'M', '2000-09-26', @last_address_id);
COMMIT;
