<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDBConnection();

if ($method === 'GET') {
    if (isset($_GET['car_id'])) {
        $stmt = $pdo->prepare("SELECT * FROM drivers WHERE car_id = ? ORDER BY number");
        $stmt->execute([$_GET['car_id']]);
        echo json_encode($stmt->fetchAll());
    } else {
        $stmt = $pdo->query("SELECT d.*, c.name as car_name FROM drivers d JOIN cars c ON d.car_id = c.id ORDER BY d.car_id, d.number");
        echo json_encode($stmt->fetchAll());
    }
}
?>