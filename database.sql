-- Base de données pour l'application de gestion des absences

CREATE DATABASE IF NOT EXISTS absence_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE absence_manager;

-- Table des groupes
CREATE TABLE IF NOT EXISTS `groups` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des utilisateurs (stagiaires + formateurs/admins)
CREATE TABLE IF NOT EXISTS `users` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'TRAINER', 'TRAINEE') NOT NULL DEFAULT 'TRAINEE',
  account_status ENUM('SUSPENDED', 'PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'SUSPENDED',
  access_status ENUM('ALLOWED', 'BLOCKED') NOT NULL DEFAULT 'ALLOWED',
  group_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE SET NULL
);

-- Table des présences
CREATE TABLE IF NOT EXISTS `attendance` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  group_id INT NOT NULL,
  date DATE NOT NULL,
  time_slot ENUM('08:30-11:00', '11:00-13:30', '13:30-16:00', '16:00-18:00') NOT NULL,
  status ENUM('PRESENT', 'ABSENT', 'LATE') NOT NULL,
  arrival_time TIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_date_slot (user_id, date, time_slot),
  CONSTRAINT fk_attendance_user FOREIGN KEY (user_id) REFERENCES `users`(id) ON DELETE CASCADE,
  CONSTRAINT fk_attendance_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE
);

-- Justificatifs d'absence soumis par les stagiaires et valides par l'administration
CREATE TABLE IF NOT EXISTS `absence_certificates` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attendance_id INT NOT NULL,
  user_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  file_data MEDIUMTEXT NOT NULL,
  review_status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  admin_comment VARCHAR(500) NULL,
  reviewed_by INT NULL,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_certificate_attendance FOREIGN KEY (attendance_id) REFERENCES `attendance`(id) ON DELETE CASCADE,
  CONSTRAINT fk_certificate_user FOREIGN KEY (user_id) REFERENCES `users`(id) ON DELETE CASCADE,
  CONSTRAINT fk_certificate_reviewer FOREIGN KEY (reviewed_by) REFERENCES `users`(id) ON DELETE SET NULL
);

-- Table de liaison formateurs / groupes (relation many-to-many)
CREATE TABLE IF NOT EXISTS `trainer_groups` (
  trainer_id INT NOT NULL,
  group_id INT NOT NULL,
  PRIMARY KEY (trainer_id, group_id),
  CONSTRAINT fk_tg_trainer FOREIGN KEY (trainer_id) REFERENCES `users`(id) ON DELETE CASCADE,
  CONSTRAINT fk_tg_group FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE
);


-- Utilisateur admin par défaut
-- Identifiants : admin@example.com / Admin123!
INSERT INTO `users` (first_name, last_name, email, password_hash, role, account_status)
VALUES ('Admin', 'Principal', 'admin@example.com',  '$2b$10$Z9F2hH8uQvY2G8Hj8VnK9eQy8c0G4WlJ8qF2sGJ9Ew6A2M1DkP3aS', 'ADMIN', 'APPROVED')
ON DUPLICATE KEY UPDATE email = email;
