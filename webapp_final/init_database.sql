-- initialise database

DROP DATABASE IF EXISTS covid_tracing;
CREATE DATABASE covid_tracing;
USE covid_tracing;

CREATE TABLE users (
  user_id INT UNSIGNED AUTO_INCREMENT,
  first_name VARCHAR(64) NOT NULL,
  last_name VARCHAR(64) NOT NULL,
  email_address VARCHAR(64) NOT NULL,
  password_hash VARCHAR(256),
  phone_number VARCHAR (16),
  user_type ENUM('admin', 'normal', 'venue') NOT NULL,
  created_timestamp DATETIME DEFAULT NOW(),
  PRIMARY KEY (user_id)
);

CREATE TABLE addresses (
  address_id INT UNSIGNED AUTO_INCREMENT,
  street VARCHAR(64) NOT NULL,
  suburb VARCHAR(64) NOT NULL,
  state VARCHAR(32) DEFAULT 'South Australia',
  postcode SMALLINT UNSIGNED NOT NULL,
  country VARCHAR(64) DEFAULT 'Australia',
  longitude DECIMAL(9,6) NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  created_timestamp DATETIME DEFAULT NOW(),
  PRIMARY KEY (address_id)
);

CREATE TABLE normal_users (
  user INT UNSIGNED,
  gender CHAR DEFAULT 'N',
  date_of_birth DATETIME,
  address INT UNSIGNED UNIQUE,
  created_timestamp DATETIME DEFAULT NOW(),
  PRIMARY KEY (user),
  FOREIGN KEY (user) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (address) REFERENCES addresses(address_id) ON DELETE SET NULL
);

CREATE TABLE admin_users (
  admin INT UNSIGNED,
  occupation VARCHAR(16),
  referencer INT UNSIGNED,
  created_timestamp DATETIME DEFAULT NOW(),
  PRIMARY KEY (admin),
  FOREIGN KEY (admin) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (referencer) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE venues (
  venue_id INT UNSIGNED AUTO_INCREMENT,
  owner INT UNSIGNED NOT NULL,
  name VARCHAR(64) NOT NULL,
  description TINYTEXT,
  checkin_code VARCHAR(32) UNIQUE NOT NULL,
  address INT UNSIGNED UNIQUE,
  phone_number VARCHAR(16) NOT NULL,
  PRIMARY KEY (venue_id),
  created_timestamp DATETIME DEFAULT NOW(),
  FOREIGN KEY (owner) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (address) REFERENCES addresses(address_id) ON DELETE SET NULL
);

CREATE TABLE checkins (
  checkin_id INT UNSIGNED AUTO_INCREMENT,
  venue INT UNSIGNED NOT NULL,
  user INT UNSIGNED NOT NULL,
  checkin_datetime DATETIME DEFAULT NOW(),
  method ENUM('qr', 'num'),
  PRIMARY KEY (checkin_id),
  FOREIGN KEY (venue) REFERENCES venues(venue_id) ON DELETE CASCADE,
  FOREIGN KEY (user) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE hotspots (
  hotspot_id INT UNSIGNED AUTO_INCREMENT,
  venue INT UNSIGNED NOT NULL,
  admin_added INT UNSIGNED,
  start_datetime DATETIME DEFAULT NOW(),
  end_datetime DATETIME DEFAULT NULL,
  PRIMARY KEY (hotspot_id),
  FOREIGN KEY (venue) REFERENCES venues(venue_id) ON DELETE CASCADE,
  FOREIGN KEY (admin_added) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE cases (
  case_id INT UNSIGNED AUTO_INCREMENT,
  is_active BOOL DEFAULT TRUE,
  found_datetime DATETIME,
  venue INT UNSIGNED,
  PRIMARY KEY (case_id),
  FOREIGN KEY (venue) REFERENCES venues(venue_id) ON DELETE SET NULL
);


-- create accounts

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

