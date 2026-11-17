<?php
require 'storage.php';


$title = trim($_POST['title'] ?? '');

if ($title === '') {
    sendJson(['error' => 'Title is required'], 400);
}


$item = [
    'id'          => uniqid('item'),
    'title'       => $title,
    'type'        => trim($_POST['type'] ?? ''),
    'date'        => trim($_POST['date'] ?? ''),
    'role'        => trim($_POST['role'] ?? ''),
    'description' => trim($_POST['description'] ?? ''),
    'skills'      => array_map('trim', explode(',', $_POST['skills'] ?? '')),
    'whatIDid'    => trim($_POST['whatIDid'] ?? ''),
    'whatILearned'=> trim($_POST['whatILearned'] ?? ''),
    'challenge'   => trim($_POST['challenge'] ?? ''),
    'nextStep'    => trim($_POST['nextStep'] ?? ''),
    'evidence'    => trim($_POST['evidence'] ?? ''),
];

$portfolios = readPortfolios();

foreach ($portfolios as $i => $portfolio) {
    if ($portfolio['id'] === ($_POST['portfolioId'] ?? '')) {
        $portfolios[$i]['items'][] = $item;   
        writePortfolios($portfolios);
        sendJson($item, 201);
    }
}

sendJson(['error' => 'Portfolio not found'], 404);