DROP DATABASE IF EXISTS `ds4100project`;
CREATE DATABASE `ds4100project`;

USE ds4100project;

DROP TABLE IF EXISTS `playlists`;
CREATE TABLE `playlists` (
  id VARCHAR(255) PRIMARY KEY,
  href VARCHAR(255),
  `name` VARCHAR(255),
  `owner` VARCHAR(255),
  followers INT,
  collaborative TINYINT(1)
);

DROP TABLE IF EXISTS `tracks`;
CREATE TABLE `tracks` (
  id VARCHAR(255) PRIMARY KEY,
  `name` VARCHAR(255),
  popularity INT,
  album VARCHAR(255),
  artists VARCHAR(255),
  duration_in_ms INT,
  `explicit` TINYINT(1)
);

DROP TABLE IF EXISTS `track_audio_features`;
CREATE TABLE `track_audio_features`(
  id VARCHAR(255) PRIMARY KEY,
  danceability DECIMAL(21, 6),
  energy DECIMAL(21, 6),
  integer_key DECIMAL(21, 6),
  loudness DECIMAL(21, 6),
  mode DECIMAL(21, 6),
  speechiness DECIMAL(21, 6),
  acousticness DECIMAL(21, 6),
  instrumentalness DECIMAL(21, 6),
  liveness DECIMAL(21, 6),
  valence DECIMAL(21, 6),
  tempo DECIMAL(21, 6)
);

DROP TABLE IF EXISTS `tracks_to_playlists`;
CREATE TABLE `tracks_to_playlists` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  playlist_id VARCHAR(255),
  track_id VARCHAR(255)
);

