<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDBConnection();

if ($method === 'POST') {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $ticketId = $input['ticket_id'];
    $quantity = $input['quantity'] ?? 1;
    $userId = $_SESSION['user_id'];
    
    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("SELECT * FROM tickets WHERE id = ? FOR UPDATE");
        $stmt->execute([$ticketId]);
        $ticket = $stmt->fetch();
        if (!$ticket) throw new Exception('Ticket not found');
        if ($ticket['stock'] < $quantity) throw new Exception('Not enough stock');
        
        $totalAmount = $ticket['price'] * $quantity;
        $stmt = $pdo->prepare("SELECT balance FROM users WHERE id = ? FOR UPDATE");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        if ($user['balance'] < $totalAmount) throw new Exception('Insufficient balance');
        
        $stmt = $pdo->prepare("UPDATE tickets SET stock = stock - ? WHERE id = ?");
        $stmt->execute([$quantity, $ticketId]);
        $stmt = $pdo->prepare("UPDATE users SET balance = balance - ? WHERE id = ?");
        $stmt->execute([$totalAmount, $userId]);
        $stmt = $pdo->prepare("INSERT INTO purchases (user_id, ticket_id, quantity, total_amount) VALUES (?, ?, ?, ?)");
        $stmt->execute([$userId, $ticketId, $quantity, $totalAmount]);
        
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Purchase successful', 'new_balance' => $user['balance'] - $totalAmount]);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} elseif ($method === 'GET') {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }
    $userId = $_SESSION['user_id'];
    $stmt = $pdo->prepare("SELECT p.*, t.race, t.location FROM purchases p JOIN tickets t ON p.ticket_id = t.id WHERE p.user_id = ? ORDER BY p.purchase_date DESC");
    $stmt->execute([$userId]);
    echo json_encode($stmt->fetchAll());
}
?>