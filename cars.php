<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDBConnection();

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM cars WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        echo json_encode($stmt->fetch() ?: ['error' => 'Car not found']);
    } else {
        $search = $_GET['search'] ?? '';
        if ($search) {
            $stmt = $pdo->prepare("SELECT * FROM cars WHERE name LIKE ? OR team LIKE ?");
            $stmt->execute(["%$search%", "%$search%"]);
        } else {
            $stmt = $pdo->query("SELECT * FROM cars ORDER BY id");
        }
        echo json_encode($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    if (!isset($_SESSION['user_id']) || !isAdmin($_SESSION['user_id'], $pdo)) {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("INSERT INTO cars (name, team, year, stock, speed, engine, hp, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $input['name'], $input['team'], $input['year'], $input['stock'] ?? 5,
        $input['speed'] ?? '', $input['engine'] ?? '', $input['hp'] ?? '',
        $input['description'] ?? '', $input['image_url'] ?? ''
    ]);
    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
} elseif ($method === 'PUT') {
    if (!isset($_SESSION['user_id']) || !isAdmin($_SESSION['user_id'], $pdo)) {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }
    $id = $_GET['id'] ?? 0;
    $input = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("UPDATE cars SET name=?, team=?, year=?, stock=?, speed=?, engine=?, hp=?, description=?, image_url=? WHERE id=?");
    $stmt->execute([
        $input['name'], $input['team'], $input['year'], $input['stock'] ?? 5,
        $input['speed'] ?? '', $input['engine'] ?? '', $input['hp'] ?? '',
        $input['description'] ?? '', $input['image_url'] ?? '', $id
    ]);
    echo json_encode(['success' => true]);
} elseif ($method === 'DELETE') {
    if (!isset($_SESSION['user_id']) || !isAdmin($_SESSION['user_id'], $pdo)) {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }
    $id = $_GET['id'] ?? 0;
    $stmt = $pdo->prepare("DELETE FROM cars WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
}
?>