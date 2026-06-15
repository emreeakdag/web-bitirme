-- ============================================
-- EGITIM PLATFORMU - MySQL VERITABANI SEMasi
-- Modul A: Kahoot tarzi Yarisma Sistemi
-- Modul B: Padlet tarzi Ortak Calisma Panosu
-- ============================================

CREATE DATABASE IF NOT EXISTS egitim_platformu 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE egitim_platformu;

-- ============================================
-- 1. USERS (Ogretmen ve kayitli ogrenciler)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('teacher', 'student') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. QUIZZES (Yarismalar)
-- ============================================
CREATE TABLE IF NOT EXISTS quizzes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    pin_code VARCHAR(10) NOT NULL UNIQUE,
    teacher_id BIGINT UNSIGNED NOT NULL,
    status ENUM('draft', 'active', 'completed', 'cancelled') DEFAULT 'draft',
    current_question_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_pin (pin_code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. QUESTIONS (Quiz Sorulari)
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    quiz_id BIGINT UNSIGNED NOT NULL,
    question_text TEXT NOT NULL,
    image_url VARCHAR(500),
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255) NOT NULL,
    option_d VARCHAR(255) NOT NULL,
    correct_option ENUM('A', 'B', 'C', 'D') NOT NULL,
    time_limit INT DEFAULT 20,
    order_index INT NOT NULL DEFAULT 0,
    points INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    INDEX idx_quiz_order (quiz_id, order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. QUIZ_PARTICIPANTS (Yarismaya katilanlar - nickname ile)
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_participants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    quiz_id BIGINT UNSIGNED NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    socket_id VARCHAR(255),
    score INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    total_answers INT DEFAULT 0,
    streak INT DEFAULT 0,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_nickname_per_quiz (quiz_id, nickname),
    INDEX idx_quiz_score (quiz_id, score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. QUIZ_ANSWERS (Verilen cevaplar)
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_answers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    participant_id BIGINT UNSIGNED NOT NULL,
    question_id BIGINT UNSIGNED NOT NULL,
    selected_option ENUM('A', 'B', 'C', 'D') NOT NULL,
    is_correct BOOLEAN NOT NULL,
    time_taken INT DEFAULT 0,
    points_earned INT DEFAULT 0,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES quiz_participants(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_participant (participant_id),
    INDEX idx_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. BOARDS (Ortak Calisma Panolari)
-- ============================================
CREATE TABLE IF NOT EXISTS boards (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    code VARCHAR(20) NOT NULL UNIQUE,
    teacher_id BIGINT UNSIGNED NOT NULL,
    bg_image VARCHAR(50) NOT NULL DEFAULT 'default',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_code (code),
    INDEX idx_teacher (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. BOARD_POSTS (Pano icerikleri - MUTLAKA User ID ile bagli)
-- ============================================
CREATE TABLE IF NOT EXISTS board_posts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    board_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    content TEXT NOT NULL,
    cover_image_url VARCHAR(500),
    file_url VARCHAR(500),
    attachments JSON NULL,
    file_type ENUM('image', 'video', 'document', 'link', 'none') DEFAULT 'none',
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_board (board_id),
    INDEX idx_user (user_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. BOARD_LIKES (Begeni sistemi)
-- ============================================
CREATE TABLE IF NOT EXISTS board_likes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES board_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (post_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. BOARD_MEMBERS (Panoya katilan uyeler)
-- ============================================
CREATE TABLE IF NOT EXISTS board_members (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    board_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    role ENUM('owner', 'member') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_member (board_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ORNEK VERILER (Development icin)
-- ============================================

-- Default Teacher Account (password: teacher123)
INSERT INTO users (full_name, email, password_hash, role) VALUES
('Ahmet Ogretmen', 'ahmet@okul.edu', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher'),
('Ayse Ogretmen', 'ayse@okul.edu', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher');

-- Default Student Accounts (password: student123)
INSERT INTO users (full_name, email, password_hash, role) VALUES
('Mehmet Ogrenci', 'mehmet@okul.edu', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('Zeynep Ogrenci', 'zeynep@okul.edu', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
('Can Ogrenci', 'can@okul.edu', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student');
