CREATE DATABASE IF NOT EXISTS catering_management
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE catering_management;

CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(12) NOT NULL DEFAULT 'customer',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_users_email (email),
    CONSTRAINT chk_users_role CHECK (role IN ('customer', 'staff', 'admin'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admins (
    admin_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (admin_id),
    UNIQUE KEY uq_admins_user (user_id),
    CONSTRAINT fk_admins_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS staff (
    staff_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    job_title VARCHAR(100) NOT NULL DEFAULT 'Catering Staff',
    PRIMARY KEY (staff_id),
    UNIQUE KEY uq_staff_user (user_id),
    CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS packages (
    package_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    price_per_guest DECIMAL(12, 2) NOT NULL,
    minimum_guests INT NOT NULL DEFAULT 20,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (package_id),
    UNIQUE KEY uq_packages_name (name),
    CONSTRAINT chk_packages_price CHECK (price_per_guest > 0),
    CONSTRAINT chk_packages_guests CHECK (minimum_guests > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bookings (
    booking_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id BIGINT UNSIGNED NOT NULL,
    package_id BIGINT UNSIGNED NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    guest_count INT NOT NULL,
    venue VARCHAR(255) NOT NULL,
    special_requests TEXT NULL,
    quoted_total DECIMAL(14, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (booking_id),
    KEY idx_bookings_customer (customer_id),
    KEY idx_bookings_date (event_date),
    KEY idx_bookings_status (status),
    KEY idx_bookings_package (package_id),
    CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES users(user_id),
    CONSTRAINT fk_bookings_package FOREIGN KEY (package_id) REFERENCES packages(package_id),
    CONSTRAINT chk_bookings_guests CHECK (guest_count > 0),
    CONSTRAINT chk_bookings_total CHECK (quoted_total >= 0),
    CONSTRAINT chk_bookings_status CHECK (status IN ('pending', 'confirmed', 'in_preparation', 'completed', 'cancelled'))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
    payment_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    booking_id BIGINT UNSIGNED NOT NULL,
    amount DECIMAL(14, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    paid_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (payment_id),
    KEY idx_payments_booking (booking_id),
    CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    CONSTRAINT chk_payments_amount CHECK (amount > 0),
    CONSTRAINT chk_payments_status CHECK (status IN ('pending', 'paid', 'failed', 'refunded'))
) ENGINE=InnoDB;
