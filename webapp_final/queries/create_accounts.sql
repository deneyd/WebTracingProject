BEGIN;

SET @password = '$argon2i$v=19$m=4096,t=3,p=1$wfpXTiHA/wUamwyHZOXVEw$aT39+sAeWLN11Bg54NiUJKV2voK3KZTrdqtoexBKvak';
SET @phone = '0412345678';
INSERT INTO users (first_name, last_name, email_address, password_hash, phone_number, user_type)
VALUES ('normal', 'user', 'normal@test.com', @password, @phone, 'normal');
SET @last_user_id=LAST_INSERT_ID();
INSERT INTO normal_users (user)
VALUES (@last_user_id);



INSERT INTO users (first_name, last_name, email_address, password_hash, phone_number, user_type)
VALUES ('admin', 'user', 'admin@test.com', @password, @phone, 'admin');
SET @auid=LAST_INSERT_ID();
INSERT INTO admin_users (admin)
VALUES (@auid);


INSERT INTO users (first_name, last_name, email_address, password_hash, phone_number, user_type)
VALUES ('venue', 'user', 'venue@test.com', @password, @phone, 'venue');
SET @vuid=LAST_INSERT_ID();



INSERT INTO addresses (street, suburb, postcode, longitude, latitude) VALUES ('134 Buxton St', 'North Adelaide', '5006', '138.586295', '-34.906100');
SET @aid = LAST_INSERT_ID();
INSERT INTO venues (owner, name, checkin_code, address, phone_number) VALUES (@vuid, 'venue 2', '2', @aid ,'0412345678');
SET @vid = LAST_INSERT_ID();
INSERT INTO hotspots (venue, admin_added) VALUES (@vid, @auid);


INSERT INTO addresses (street, suburb, postcode, longitude, latitude) VALUES ('13 Coongie Ave', 'Edwardstown', '5039', '138.572538', '-34.989783');
SET @aid = LAST_INSERT_ID();
INSERT INTO venues (owner, name, checkin_code, address, phone_number) VALUES (@vuid, 'venue 3', '3', @aid, '0412345678');
SET @vid = LAST_INSERT_ID();
INSERT INTO hotspots (venue, admin_added) VALUES (@vid, @auid);

INSERT INTO addresses (street, suburb, postcode, longitude, latitude) VALUES ('17 Grosvenor Pl','Wynn Vale', '5127', '138.685825', '-34.798154');
SET @aid = LAST_INSERT_ID();
INSERT INTO venues (owner, name, checkin_code, address, phone_number) VALUES (@vuid, 'Testing your name', '4', @aid, '0412345678');
SET @vid = LAST_INSERT_ID();
INSERT INTO hotspots (venue, admin_added) VALUES (@vid, @auid);


INSERT INTO addresses (street, suburb, postcode, longitude, latitude) VALUES ('9A Dryden Ave','Hazelwood Park', '5066', '138.659558', '-34.943118' );
SET @aid = LAST_INSERT_ID();
INSERT INTO venues (owner, name, checkin_code, address, phone_number) VALUES (@vuid, 'abc company', '5', @aid, '0412345578');
SET @vid = LAST_INSERT_ID();
INSERT INTO hotspots (venue, admin_added) VALUES (@vid, @auid);






COMMIT;
