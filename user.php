<?php
require_once 'config.php';

header('Content-Type: application/json');

try {
    $pdo = getDBConnection();
    $stmt = $pdo->query("SELECT id, username, password, role, balance FROM users");
    echo json_encode($stmt->fetchAll());
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>