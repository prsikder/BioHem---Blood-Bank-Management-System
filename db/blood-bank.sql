-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 10, 2026 at 05:07 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `blood-bank`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `actor` varchar(191) DEFAULT NULL,
  `action` varchar(255) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `actor`, `action`, `details`, `created_at`) VALUES
(1, 'heya123@gmail.com', 'donation', 'Donor 2 donated 1 units of AB+', '2025-12-02 17:57:26'),
(2, 'heya123@gmail.com', 'donation', 'Donor 2 donated 1 units of AB+', '2025-12-02 18:06:23'),
(3, 'heya123@gmail.com', 'donation', 'Donor 2 donated 1 units of AB+', '2025-12-02 18:48:59'),
(4, 'heya123@gmail.com', 'donation', 'Donor 2 donated 1 units of AB+', '2025-12-02 19:26:07'),
(5, 'heya123@gmail.com', 'donation', 'Donor 2 donated 1 units of AB+', '2025-12-02 19:26:09'),
(6, 'admin123@gmail.com', 'donation', 'Donor 2 donated 1 units of AB+', '2025-12-04 09:59:04'),
(7, 'admin123@gmail.com', 'donation', 'Donor 2 donated 1 units of AB+', '2025-12-04 09:59:07'),
(8, 'admin123@gmail.com', 'fulfilled_request', 'Request 3 fulfilled by admin123@gmail.com', '2025-12-04 10:09:43'),
(9, 'admin123@gmail.com', 'donation', 'Admin admin123@gmail.com recorded 1 units for donor 1 (A+)', '2025-12-04 11:44:29'),
(10, 'admin123@gmail.com', 'donation', 'Admin admin123@gmail.com recorded 2 units for donor 2 (AB+)', '2025-12-04 11:45:06'),
(11, 'ragibrabeya123@gmail.com', 'hospital_request', 'Hospital 3 requested 5 units of A-', '2025-12-04 12:26:18'),
(12, 'osmani123@gmail.com', 'hospital_request', 'Hospital 2 requested 10 units of A-', '2025-12-04 14:00:14'),
(13, 'osmani123@gmail.com', 'blood_request', 'Hospital 2 requested 2 units of A+ (Emergency)', '2026-01-08 17:34:36'),
(14, 'ibnsina23@gmail.com', 'hospital_request', 'Hospital 4 requested 4 units of O+ (Emergency)', '2026-01-08 18:23:33'),
(15, 'ibnsina23@gmail.com', 'hospital_request', 'Hospital 4 requested 3 units of B+ (General)', '2026-01-08 18:23:48'),
(16, 'admin123@gmail.com', 'add_stock', 'Added 1 units of A+ to inventory', '2026-01-08 18:59:01'),
(17, 'admin123@gmail.com', 'add_stock', 'Added 1 units of A+ to inventory', '2026-01-08 18:59:08'),
(18, 'ibnsina23@gmail.com', 'hospital_update', 'Updated profile for hospital 4: Ibn Sina Hospital', '2026-01-08 19:38:44');

-- --------------------------------------------------------

--
-- Table structure for table `blood_stock`
--

CREATE TABLE `blood_stock` (
  `id` int(11) NOT NULL,
  `blood_group` varchar(10) DEFAULT NULL,
  `units` int(11) DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `blood_stock`
--

INSERT INTO `blood_stock` (`id`, `blood_group`, `units`, `updated_at`) VALUES
(1, 'AB+', 8, '2025-12-02 17:57:26'),
(2, 'A+', 3, '2025-12-04 11:44:29');

-- --------------------------------------------------------

--
-- Table structure for table `donations`
--

CREATE TABLE `donations` (
  `id` int(11) NOT NULL,
  `donor_id` int(11) NOT NULL,
  `blood_group` varchar(10) DEFAULT NULL,
  `units` int(11) NOT NULL DEFAULT 1,
  `recorded_by` varchar(191) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donations`
--

INSERT INTO `donations` (`id`, `donor_id`, `blood_group`, `units`, `recorded_by`, `created_at`) VALUES
(1, 1, 'A+', 1, 'admin123@gmail.com', '2025-12-04 11:44:29'),
(2, 2, 'AB+', 2, 'admin123@gmail.com', '2025-12-04 11:45:06');

-- --------------------------------------------------------

--
-- Table structure for table `donors`
--

CREATE TABLE `donors` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `blood_group` varchar(10) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `age` int(11) DEFAULT NULL,
  `last_donation_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `donors`
--

INSERT INTO `donors` (`id`, `name`, `email`, `phone`, `blood_group`, `city`, `address`, `photo`, `created_at`, `age`, `last_donation_date`) VALUES
(1, 'hey', 'hey123@gmail.com', '01891234513', 'A+', 'Dhaka', NULL, '/uploads/1764694462341-Screenshot_2025-11-06_205343.png', '2025-12-02 16:54:22', NULL, '2025-12-04'),
(2, 'Heya', 'heya123@gmail.com', '01345676812', 'AB+', 'Chittagong', NULL, '/uploads/1764703564160-Screenshot_2025-03-28_231350.png', '2025-12-02 17:41:24', 22, '2025-12-04');

-- --------------------------------------------------------

--
-- Table structure for table `hospitals`
--

CREATE TABLE `hospitals` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hospitals`
--

INSERT INTO `hospitals` (`id`, `name`, `email`, `phone`, `city`, `address`, `created_at`) VALUES
(1, 'Mount Adora', 'mdora@gmail.com', '01917123142', 'Sylhet', NULL, '2025-12-02 16:55:38'),
(2, 'Osmani Medical', 'osmani123@gmail.com', '01761234512', 'Sylhet', 'Sylhet', '2025-12-02 17:43:31'),
(3, 'Ragib Rabeya', 'ragibrabeya123@gmail.com', '01761234512', 'Sylhet', 'Sylhet', '2025-12-04 12:25:44'),
(4, 'Ibn Sina Hospital', 'ibnsina23@gmail.com', '+8801761234512', 'Sylhet', 'Sylhet', '2026-01-08 18:09:34');

-- --------------------------------------------------------

--
-- Table structure for table `requests`
--

CREATE TABLE `requests` (
  `id` int(11) NOT NULL,
  `hospital_id` int(11) DEFAULT NULL,
  `blood_group` varchar(10) DEFAULT NULL,
  `units` int(11) DEFAULT NULL,
  `status` enum('pending','approved','rejected','fulfilled') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `urgency` enum('Emergency','General') DEFAULT 'General',
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `requests`
--

INSERT INTO `requests` (`id`, `hospital_id`, `blood_group`, `units`, `status`, `created_at`, `urgency`, `notes`) VALUES
(1, 2, 'A-', 3, 'pending', '2025-12-02 17:59:20', 'General', NULL),
(2, 2, 'B+', 5, 'pending', '2025-12-02 18:07:22', 'General', NULL),
(3, 2, 'AB+', 1, 'fulfilled', '2025-12-04 09:53:55', 'General', NULL),
(4, 3, 'A-', 5, 'pending', '2025-12-04 12:26:18', 'General', NULL),
(5, 2, 'A-', 10, 'pending', '2025-12-04 14:00:14', 'General', NULL),
(6, 2, 'A+', 2, 'pending', '2026-01-08 17:34:36', 'Emergency', ''),
(7, 4, 'O+', 4, 'pending', '2026-01-08 18:23:33', 'Emergency', NULL),
(8, 4, 'B+', 3, 'pending', '2026-01-08 18:23:48', 'General', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','staff','donor') DEFAULT 'staff',
  `donor_id` int(11) DEFAULT NULL,
  `hospital_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `donor_id`, `hospital_id`, `created_at`) VALUES
(1, 'Admin', 'admin123@gmail.com', '$2a$12$fhEzwIMSI5S1vca0tuoU6OyrztUd8MbtnURvY5bc8zZGmJpYtpYsa', 'admin', NULL, NULL, '2025-12-02 16:17:29'),
(2, 'Heya', 'heya123@gmail.com', '$2a$10$tpfwi9BX/zOPEjhknOpFqunmp8H37SC/6PFQD7qdDmutrEBL8qvM6', 'donor', 2, NULL, '2025-12-02 17:41:24'),
(3, 'Osmani Medical', 'osmani123@gmail.com', '$2a$10$yTJfh5Gt8fARTJBe97btHOPecbmJZju0BQUpgHPbuDSA0QCPYeT7O', 'staff', NULL, 2, '2025-12-02 17:43:31'),
(4, 'Ragib Rabeya', 'ragibrabeya123@gmail.com', '$2a$10$0EMXCJEAmBlt.eHNRqH56uaG4Vw2bsN8RdTaEJZbxQY09CGisdrc.', 'staff', NULL, 3, '2025-12-04 12:25:44'),
(5, 'Ibn Sina', 'ibnsina23@gmail.com', '$2a$10$kyBsIvGnBroXMa3oKJRDmeaDMHB8jz9vxhWUmM8oC3mjCZmDL3uYm', 'staff', NULL, 4, '2026-01-08 18:09:34');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `blood_stock`
--
ALTER TABLE `blood_stock`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `donations`
--
ALTER TABLE `donations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `donor_id` (`donor_id`);

--
-- Indexes for table `donors`
--
ALTER TABLE `donors`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `hospitals`
--
ALTER TABLE `hospitals`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `requests`
--
ALTER TABLE `requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_requests_urgency` (`urgency`),
  ADD KEY `idx_requests_hospital_created` (`hospital_id`,`created_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_users_donor` (`donor_id`),
  ADD KEY `fk_users_hospital` (`hospital_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `blood_stock`
--
ALTER TABLE `blood_stock`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `donations`
--
ALTER TABLE `donations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `donors`
--
ALTER TABLE `donors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `hospitals`
--
ALTER TABLE `hospitals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `requests`
--
ALTER TABLE `requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `donations`
--
ALTER TABLE `donations`
  ADD CONSTRAINT `donations_ibfk_1` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `requests`
--
ALTER TABLE `requests`
  ADD CONSTRAINT `requests_ibfk_1` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_donor` FOREIGN KEY (`donor_id`) REFERENCES `donors` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_users_hospital` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
