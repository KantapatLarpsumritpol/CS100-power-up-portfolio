<?php
require 'storage.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    sendJson(readPortfolios());
}

requirePost();

$isJson = stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false;

if ($isJson) {
    $raw = file_get_contents('php://input');
    if (strlen($raw) > MAX_JSON_BYTES) {
        sendJson(['error' => 'Data is too large'], 413);
    }
    $input = json_decode($raw, true);
    $problem = portfolioListProblem($input);
    if ($problem !== null) {
        fail($problem);
    }
    $clean = array_map('cleanPortfolio', $input);
    lockData();
    writePortfolios($clean);
    sendJson($clean, 200);
}

$portfolio = [
    'id'          => uniqid('p'),
    'displayName' => postText('displayName'),
    'whatEnjoy'   => postText('whatEnjoy'),
    'whatTried'   => postText('whatTried'),
    'whatCurious' => postText('whatCurious'),
    'items'       => [],
];
$problem = portfolioProblem($portfolio);
if ($problem !== null) {
    fail($problem);
}

$portfolios = readPortfolios();
$portfolios[] = $portfolio;
writePortfolios($portfolios);

sendJson($portfolio, 201);
