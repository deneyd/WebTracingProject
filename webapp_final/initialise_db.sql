-- MySQL dump 10.13  Distrib 8.0.25, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: covid_tracing
-- ------------------------------------------------------
-- Server version	8.0.19-0ubuntu5

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `covid_tracing`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `covid_tracing` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `covid_tracing`;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addresses` (
  `address_id` int unsigned NOT NULL AUTO_INCREMENT,
  `street` varchar(64) NOT NULL,
  `suburb` varchar(64) NOT NULL,
  `state` varchar(32) DEFAULT 'South Australia',
  `postcode` smallint unsigned NOT NULL,
  `country` varchar(64) DEFAULT 'Australia',
  `longitude` decimal(9,6) NOT NULL,
  `latitude` decimal(9,6) NOT NULL,
  `created_timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`address_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_users`
--

DROP TABLE IF EXISTS `admin_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_users` (
  `admin` int unsigned NOT NULL,
  `occupation` varchar(16) DEFAULT NULL,
  `referencer` int unsigned DEFAULT NULL,
  `created_timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`admin`),
  KEY `referencer` (`referencer`),
  CONSTRAINT `admin_users_ibfk_1` FOREIGN KEY (`admin`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `admin_users_ibfk_2` FOREIGN KEY (`referencer`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_users`
--

LOCK TABLES `admin_users` WRITE;
/*!40000 ALTER TABLE `admin_users` DISABLE KEYS */;
INSERT INTO `admin_users` VALUES (2,NULL,NULL,'2021-06-14 13:55:30');
/*!40000 ALTER TABLE `admin_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cases`
--

DROP TABLE IF EXISTS `cases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cases` (
  `case_id` int unsigned NOT NULL AUTO_INCREMENT,
  `is_active` tinyint(1) DEFAULT '1',
  `found_datetime` datetime DEFAULT NULL,
  `venue` int unsigned DEFAULT NULL,
  PRIMARY KEY (`case_id`),
  KEY `venue` (`venue`),
  CONSTRAINT `cases_ibfk_1` FOREIGN KEY (`venue`) REFERENCES `venues` (`venue_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cases`
--

LOCK TABLES `cases` WRITE;
/*!40000 ALTER TABLE `cases` DISABLE KEYS */;
/*!40000 ALTER TABLE `cases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `checkins`
--

DROP TABLE IF EXISTS `checkins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `checkins` (
  `checkin_id` int unsigned NOT NULL AUTO_INCREMENT,
  `venue` int unsigned NOT NULL,
  `user` int unsigned NOT NULL,
  `checkin_datetime` datetime DEFAULT CURRENT_TIMESTAMP,
  `method` enum('qr','num') DEFAULT NULL,
  PRIMARY KEY (`checkin_id`),
  KEY `venue` (`venue`),
  KEY `user` (`user`),
  CONSTRAINT `checkins_ibfk_1` FOREIGN KEY (`venue`) REFERENCES `venues` (`venue_id`) ON DELETE CASCADE,
  CONSTRAINT `checkins_ibfk_2` FOREIGN KEY (`user`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `checkins`
--

LOCK TABLES `checkins` WRITE;
/*!40000 ALTER TABLE `checkins` DISABLE KEYS */;
/*!40000 ALTER TABLE `checkins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hotspots`
--

DROP TABLE IF EXISTS `hotspots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hotspots` (
  `hotspot_id` int unsigned NOT NULL AUTO_INCREMENT,
  `venue` int unsigned NOT NULL,
  `admin_added` int unsigned DEFAULT NULL,
  `start_datetime` datetime DEFAULT CURRENT_TIMESTAMP,
  `end_datetime` datetime DEFAULT NULL,
  PRIMARY KEY (`hotspot_id`),
  KEY `venue` (`venue`),
  KEY `admin_added` (`admin_added`),
  CONSTRAINT `hotspots_ibfk_1` FOREIGN KEY (`venue`) REFERENCES `venues` (`venue_id`) ON DELETE CASCADE,
  CONSTRAINT `hotspots_ibfk_2` FOREIGN KEY (`admin_added`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hotspots`
--

LOCK TABLES `hotspots` WRITE;
/*!40000 ALTER TABLE `hotspots` DISABLE KEYS */;
/*!40000 ALTER TABLE `hotspots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `normal_users`
--

DROP TABLE IF EXISTS `normal_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `normal_users` (
  `user` int unsigned NOT NULL,
  `gender` char(1) DEFAULT 'N',
  `date_of_birth` datetime DEFAULT NULL,
  `address` int unsigned DEFAULT NULL,
  `created_timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user`),
  UNIQUE KEY `address` (`address`),
  CONSTRAINT `normal_users_ibfk_1` FOREIGN KEY (`user`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `normal_users_ibfk_2` FOREIGN KEY (`address`) REFERENCES `addresses` (`address_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `normal_users`
--

LOCK TABLES `normal_users` WRITE;
/*!40000 ALTER TABLE `normal_users` DISABLE KEYS */;
INSERT INTO `normal_users` VALUES (1,'N',NULL,NULL,'2021-06-14 13:55:30');
/*!40000 ALTER TABLE `normal_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(64) NOT NULL,
  `last_name` varchar(64) NOT NULL,
  `email_address` varchar(64) NOT NULL,
  `password_hash` varchar(256) DEFAULT NULL,
  `phone_number` varchar(16) DEFAULT NULL,
  `user_type` enum('admin','normal','venue') NOT NULL,
  `created_timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'normal','user','normal@test.com','$argon2i$v=19$m=4096,t=3,p=1$wfpXTiHA/wUamwyHZOXVEw$aT39+sAeWLN11Bg54NiUJKV2voK3KZTrdqtoexBKvak','0412345678','normal','2021-06-14 13:55:30'),(2,'admin','user','admin@test.com','$argon2i$v=19$m=4096,t=3,p=1$wfpXTiHA/wUamwyHZOXVEw$aT39+sAeWLN11Bg54NiUJKV2voK3KZTrdqtoexBKvak','0412345678','admin','2021-06-14 13:55:30'),(3,'venue','user','venue@test.com','$argon2i$v=19$m=4096,t=3,p=1$wfpXTiHA/wUamwyHZOXVEw$aT39+sAeWLN11Bg54NiUJKV2voK3KZTrdqtoexBKvak','0412345678','venue','2021-06-14 13:55:30');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `venues`
--

DROP TABLE IF EXISTS `venues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `venues` (
  `venue_id` int unsigned NOT NULL AUTO_INCREMENT,
  `owner` int unsigned NOT NULL,
  `name` varchar(64) NOT NULL,
  `description` tinytext,
  `checkin_code` varchar(32) NOT NULL,
  `address` int unsigned DEFAULT NULL,
  `phone_number` varchar(16) NOT NULL,
  `created_timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`venue_id`),
  UNIQUE KEY `checkin_code` (`checkin_code`),
  UNIQUE KEY `address` (`address`),
  KEY `owner` (`owner`),
  CONSTRAINT `venues_ibfk_1` FOREIGN KEY (`owner`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `venues_ibfk_2` FOREIGN KEY (`address`) REFERENCES `addresses` (`address_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `venues`
--

LOCK TABLES `venues` WRITE;
/*!40000 ALTER TABLE `venues` DISABLE KEYS */;
/*!40000 ALTER TABLE `venues` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-06-14 13:56:21
