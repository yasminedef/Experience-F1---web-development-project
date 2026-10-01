<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDBConnection();

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare("SELECT * FROM tickets WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        echo json_encode($stmt->fetch());
    } else {
        $stmt = $pdo->query("SELECT * FROM tickets ORDER BY date ASC");
        echo json_encode($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    if (!isset($_SESSION['user_id']) || !isAdmin($_SESSION['user_id'], $pdo)) {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("INSERT INTO tickets (race, location, date, price, stock, category) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $input['race'], $input['location'], $input['date'],
        $input['price'], $input['stock'] ?? 50, $input['category'] ?? 'General Admission'
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
    $stmt = $pdo->prepare("UPDATE tickets SET race=?, location=?, date=?, price=?, stock=?, category=? WHERE id=?");
    $stmt->execute([
        $input['race'], $input['location'], $input['date'],
        $input['price'], $input['stock'] ?? 50, $input['category'] ?? 'General Admission', $id
    ]);
    echo json_encode(['success' => true]);
} elseif ($method === 'DELETE') {
    if (!isset($_SESSION['user_id']) || !isAdmin($_SESSION['user_id'], $pdo)) {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }
    $id = $_GET['id'] ?? 0;
    $stmt = $pdo->prepare("DELETE FROM tickets WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
}
?>