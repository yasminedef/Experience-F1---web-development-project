-- =====================================================
-- F1 DIGITAL MUSEUM - Base de données complète
-- =====================================================

USE f1_museum;

-- -----------------------------------------------------
-- 1. Table: users
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) ,
    balance DECIMAL(10,2) DEFAULT 1000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------
-- 2. Table: cars
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS cars (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    team VARCHAR(100) NOT NULL,
    year INT NOT NULL,
    stock INT DEFAULT 5,
    speed VARCHAR(20),
    engine VARCHAR(100),
    hp VARCHAR(20),
    description TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------
-- 3. Table: tickets
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    race VARCHAR(150) NOT NULL,
    location VARCHAR(200) NOT NULL,
    date DATE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 50,
    category ENUM('standard', 'Premium', 'VIP') DEFAULT 'standard',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------
-- 4. Table: purchases
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    ticket_id INT NOT NULL,
    quantity INT DEFAULT 1,
    total_amount DECIMAL(10,2) NOT NULL,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- 5. Table: favorites
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    car_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (user_id, car_id)
);

-- -----------------------------------------------------
-- 6. Table: notifications
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
    status ENUM('read', 'unread') DEFAULT 'unread',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- INSERTION DES DONNÉES
-- -----------------------------------------------------

-- Utilisateurs (mots de passe en clair pour le développement)
INSERT INTO users (username, password, email, role, balance) VALUES
('yas', 'yasadmin', 'yas@f1museum.com', 9999.00),
('driver1', 'password', 'driver1@email.com',  1500.00);

-- Voitures
INSERT INTO cars (name, team, year, stock, speed, engine, hp, description) VALUES
('Ferrari SF-23', 'Scuderia Ferrari', 2026, 5, '380 km/h', '1.6L V6', '1000+ HP', 'La Ferrari SF-23, une merveille d\'ingénierie italienne.'),
('Red Bull RB19', 'Oracle Red Bull Racing', 2026, 3, '378 km/h', '1.6L V6', '1020+ HP', 'La dominante Red Bull RB19, championne du monde.'),
('Mercedes W14', 'Mercedes-AMG Petronas', 2026, 8, '370 km/h', '1.6L V6', '1000+ HP', 'La Mercedes W14, l\'élégance allemande.'),
('McLaren MCL60', 'McLaren F1 Team', 2026, 6, '372 km/h', '1.6L V6', '1000+ HP', 'La McLaren MCL60, le retour de la gloire.'),
('Aston Martin AMR23', 'Aston Martin Aramco', 2026, 4, '365 km/h', '1.6L V6', '1000+ HP', 'L\'Aston Martin AMR23, l\'élégance britannique.'),
('Alpine A523', 'BWT Alpine F1 Team', 2026, 7, '362 km/h', '1.6L V6', '1000+ HP', 'L\'Alpine A523, le savoir-faire français.'),
('Williams FW45', 'Williams Racing', 2026, 9, '358 km/h', '1.6L V6', '1000+ HP', 'La Williams FW45, la résurgence.'),
('Haas VF-23', 'MoneyGram Haas F1 Team', 2026, 10, '355 km/h', '1.6L V6', '1000+ HP', 'La Haas VF-23, le challenger américain.'),
('Alfa Romeo C43', 'Alfa Romeo F1 Team', 2026, 5, '360 km/h', '1.6L V6', '1000+ HP', 'L\'Alfa Romeo C43, le dernier chapitre.');

-- Tickets
INSERT INTO tickets (race, location, date, price, stock, category) VALUES
('Monaco Grand Prix', 'Circuit de Monaco, Monte Carlo', '2026-05-26', 450.00, 50, 'Grandstand'),
('British Grand Prix', 'Silverstone Circuit, UK', '2026-07-07', 280.00, 75, 'General Admission'),
('Italian Grand Prix', 'Autodromo di Monza, Italy', '2026-09-01', 220.00, 3, 'Grandstand'),
('Japanese Grand Prix', 'Suzuka Circuit, Japan', '2026-04-07', 350.00, 0, 'Premium'),
('Abu Dhabi Grand Prix', 'Yas Marina Circuit, UAE', '2026-12-08', 380.00, 8, 'VIP');

SELECT '✅ Base de données F1 Museum créée avec succès !' as message;