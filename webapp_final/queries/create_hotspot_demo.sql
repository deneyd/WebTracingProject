BEGIN;


INSERT INTO addresses (street, suburb, postcode, longitude, latitude) VALUES ('128 King William St', 'Adelaide', '5000', '138.6002127', '-34.9260454');
SET @aid = LAST_INSERT_ID();
INSERT INTO users (first_name, last_name, email_address, user_type) VALUES ('normal', 'user', 'normal@user.com', 'normal');
SET @uid = LAST_INSERT_ID();
INSERT INTO normal_users (user, address) VALUES (@uid, @aid);


INSERT INTO users (first_name, last_name, email_address, user_type) VALUES ('venue', 'user', 'venue@user.com', 'venue');
SET @vuid = LAST_INSERT_ID();


INSERT INTO users (first_name, last_name, email_address, user_type) VALUES ('admin', 'user', 'admin@user.com', 'admin');
SET @adid = LAST_INSERT_ID();


INSERT INTO addresses (street, suburb, postcode, longitude, latitude) VALUES ('155 East Pkwy',
'Lightsview', '5085',  '138.623381', '-34.863522');
SET @aid = LAST_INSERT_ID();
INSERT INTO venues (owner, name, checkin_code, address, phone_number) VALUES (@vuid, 'venue 1', '1', @aid ,'1');
SET @vid = LAST_INSERT_ID();
INSERT INTO hotspots (venue, admin_added) VALUES (@vid, @adid);


INSERT INTO addresses (street, suburb, postcode, longitude, latitude) VALUES ('134 Buxton St', 'North Adelaide', '5006', '138.586295', '-34.906100');
SET @aid = LAST_INSERT_ID();
INSERT INTO venues (owner, name, checkin_code, address, phone_number) VALUES (@vuid, 'venue 2', '2', @aid ,'2');
SET @vid = LAST_INSERT_ID();
INSERT INTO hotspots (venue, admin_added) VALUES (@vid, @adid);


INSERT INTO addresses (street, suburb, postcode, longitude, latitude) VALUES ('13 Coongie Ave', 'Edwardstown', '5039', '138.572538', '-34.989783');
SET @aid = LAST_INSERT_ID();
INSERT INTO venues (owner, name, checkin_code, address, phone_number) VALUES (@vuid, 'venue 3', '3', @aid, '3');SET @vid = LAST_INSERT_ID();
INSERT INTO hotspots (venue, admin_added) VALUES (@vid, @adid);

INSERT INTO addresses (street, suburb, postcode, longitude, latitude) VALUES ('17 Grosvenor Pl','Wynn Vale', '5127', '138.685825', '-34.798154');
SET @aid = LAST_INSERT_ID();
INSERT INTO venues (owner, name, checkin_code, address, phone_number) VALUES ('2', 'Testing your name', '4', '6', '0412345678');
SET @vid = LAST_INSERT_ID();
INSERT INTO hotspots (venue, admin_added) VALUES (@vid, '4');


INSERT INTO addresses (street, suburb, postcode, longitude, latitude) VALUES ('9A Dryden Ave','Hazelwood Park', '5066', '138.659558', '-34.943118' );
SET @aid = LAST_INSERT_ID();
INSERT INTO venues (owner, name, checkin_code, address, phone_number) VALUES ('2', 'abc company', '5', @aid, '0412345578');
SET @vid = LAST_INSERT_ID();
INSERT INTO hotspots (venue, admin_added) VALUES (@vid, '4');

COMMIT;
