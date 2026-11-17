<?php
require 'storage.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    sendJson(readPortfolios());
}


$input = json_decode(file_get_contents('php://input'), true);
if (is_array($input)) {
    writePortfolios($input);
    sendJson($input, 200);
    exit;
}

$name = trim($_POST['displayName'] ?? '');

if ($name === '') {
    sendJson(['error' => 'Display name is required'], 400);
}

$portfolio = [
    'id'          => uniqid('p'),
    'displayName' => $name,
    'whatEnjoy'   => trim($_POST['whatEnjoy'] ?? ''),    
    'whatTried'   => trim($_POST['whatTried'] ?? ''),    
    'whatCurious' => trim($_POST['whatCurious'] ?? ''), 
    'items'       => [],
];

$portfolios = readPortfolios();
$portfolios[] = $portfolio;          
writePortfolios($portfolios);

sendJson($portfolio, 201);