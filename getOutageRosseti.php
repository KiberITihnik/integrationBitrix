<?php
require_once($_SERVER["DOCUMENT_ROOT"]."/local/lib/ajax/common_header.php");

use Local\Integrations\RossetiOutage\RossetiOutageController;

$logDir = $_SERVER["DOCUMENT_ROOT"] . '/local/log/outageRosseti/';
$logFilePath = $logDir . 'getOutageRosseti.log';

if (!is_dir($logDir)) {
    if (!mkdir($logDir, 0755, true) && !is_dir($logDir)) {
        die(json_encode([
            "status" => "error",
            "message" => "Не удалось создать директорию логов"
        ]));
    }
}

$dateTime = date('Y-m-d H:i:s');
//file_put_contents($logFilePath, '------getOutageRosseti-----' . PHP_EOL . $dateTime . PHP_EOL, FILE_APPEND | LOCK_EX);

try {
    if (!isset($_POST['objectId'])) {
        throw new Exception('Параметр objectId отсутствует');
    }
    $objectId = trim($_POST['objectId']);
    $objectId = strip_tags($objectId);
    $objectId = htmlspecialchars($objectId, ENT_QUOTES, 'UTF-8');

    $rossetiOutage = new RossetiOutageController($objectId);

    $result = $rossetiOutage->processRequest();

    if (!$result || !is_array($result)) {
        throw new Exception('Получен пустой массив от RossetiOutageController');
    }

    $response = json_encode([
        'success' => true,
        'message' => 'Data processed successfully',
        'rossetiOutage' => $result,
    ]);

    header('Content-Type: application/json');
    echo $response;

} catch (Exception $e) {
    file_put_contents($logFilePath, "Error: " . $e->getMessage() . "\n", FILE_APPEND);
    file_put_contents($logFilePath, "Stack Trace: " . $e->getTraceAsString() . "\n", FILE_APPEND);

    header('Content-Type: application/json');
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage(),
    ]);
}