<?php
require 'storage.php';

requirePost();

$portfolioId = postText('portfolioId');
if (idProblem($portfolioId) !== null) {
    fail('portfolioId is missing or invalid');
}

$skills = [];
foreach (explode(',', postText('skills')) as $skill) {
    $skill = trim($skill);
    if ($skill !== '') {
        $skills[] = $skill;
    }
}

$item = [
    'id'           => postText('id') !== '' ? postText('id') : uniqid('item'),
    'title'        => postText('title'),
    'type'         => postText('type'),
    'date'         => postText('date'),
    'role'         => postText('role'),
    'description'  => postText('description'),
    'skills'       => $skills,
    'whatIDid'     => postText('whatIDid'),
    'whatILearned' => postText('whatILearned'),
    'challenge'    => postText('challenge'),
    'nextStep'     => postText('nextStep'),
    'evidence'     => postText('evidence'),
];
foreach (['challengeId', 'hostGroup', 'category'] as $key) {
    if (postText($key) !== '') {
        $item[$key] = postText($key);
    }
}

$problem = itemProblem($item);
if ($problem !== null) {
    fail($problem);
}
$item = cleanItem($item);

$portfolios = readPortfolios();

foreach ($portfolios as $i => $portfolio) {
    if (($portfolio['id'] ?? null) === $portfolioId) {
        foreach ($portfolio['items'] ?? [] as $existing) {
            if (($existing['id'] ?? null) === $item['id']) {
                sendJson(['error' => 'This item is already in this portfolio'], 409);
            }
        }
        $portfolios[$i]['items'][] = $item;
        writePortfolios($portfolios);
        sendJson($item, 201);
    }
}

sendJson(['error' => 'Portfolio not found'], 404);
