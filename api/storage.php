<?php

if (php_sapi_name() === 'cli-server') {
    define('DATA_DIR', __DIR__ . '/../local-data');
    if (!is_dir(DATA_DIR)) {
        @mkdir(DATA_DIR);
    }
} else {
    define('DATA_DIR', '/var/www/data');
}

define('DATA_FILE', DATA_DIR . '/portfolios.json');

function lockData()
{
    static $lock = null;
    if ($lock === null) {

        $lock = @fopen(DATA_DIR . '/data.lock', 'c');
        if ($lock === false) {
            cannotSave(DATA_DIR . '/data.lock');
        }
        flock($lock, LOCK_EX);
    }
}

function readPortfolios()
{
    lockData();
    if (!file_exists(DATA_FILE)) {
        return [];
    }
    return json_decode(file_get_contents(DATA_FILE), true) ?? [];
}

function writePortfolios($portfolios)
{
    $json = json_encode($portfolios, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        sendJson(['error' => 'Data could not be converted to JSON'], 500);
    }

    if (@file_put_contents(DATA_FILE, $json, LOCK_EX) === false) {
        cannotSave(DATA_FILE);
    }
}

function cannotSave($file)
{
    if (php_sapi_name() === 'cli-server') {

        $fix = 'On your laptop: make sure api/storage.php is the newest one from the starter, '
            . 'and that your project folder is not read-only.';
    } else {

        $fix = 'On EC2 run: sudo mkdir -p /var/www/data && sudo chown www-data:www-data /var/www/data';
    }
    sendJson(['error' => 'Server cannot save to ' . $file . '. ' . $fix], 500);
}

function sendJson($data, $status = 200)
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

const MAX_JSON_BYTES = 1000000;
const MAX_PORTFOLIOS = 100;
const MAX_ITEMS      = 100;
const MAX_SKILLS     = 10;
const ID_PATTERN     = '/^[A-Za-z0-9_-]{1,64}$/';
const CATEGORIES     = ['discover', 'mix', 'levelup'];

function fail($message)
{
    sendJson(['error' => $message], 400);
}

function requirePost()
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendJson(['error' => 'Use POST for this address'], 405);
    }
}

function postText($name)
{
    $value = $_POST[$name] ?? '';
    return is_string($value) ? trim($value) : '';
}

function textLength($text)
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($text);
    }
    return preg_match_all('/./su', $text);
}

function textProblem($name, $value, $max, $required = true)
{
    if (!is_string($value)) {
        return "$name must be text";
    }
    $value = trim($value);
    if ($value === '') {
        return $required ? "$name is required" : null;
    }
    if (!preg_match('//u', $value)) {
        return "$name must be valid UTF-8 text";
    }
    if (textLength($value) > $max) {
        return "$name must be at most $max characters";
    }
    return null;
}

function dateProblem($value)
{
    if (!is_string($value)) {
        return 'date must be text like 2026-11-24';
    }
    $date = DateTime::createFromFormat('Y-m-d', $value);
    if (!$date || $date->format('Y-m-d') !== $value) {
        return 'date must be a real date like 2026-11-24';
    }
    return null;
}

function urlProblem($value)
{
    if (!is_string($value) || !preg_match('#^https?://[^\s]+$#i', trim($value))) {
        return 'evidence must be a link starting with http:// or https://';
    }
    return null;
}

function idProblem($value)
{
    if (!is_string($value) || !preg_match(ID_PATTERN, $value)) {
        return 'id may only contain letters, numbers, - and _ (max 64 characters)';
    }
    return null;
}

function isList($value)
{
    return is_array($value) && $value === array_values($value);
}

function itemProblem($item)
{
    if (!is_array($item)) {
        return 'item must be an object';
    }
    if (isset($item['id']) && ($problem = idProblem($item['id']))) {
        return $problem;
    }
    $limits = [
        'title' => 100,
        'type' => 50,
        'role' => 50,
        'description' => 2000,
        'whatIDid' => 2000,
        'whatILearned' => 2000,
        'challenge' => 2000,
        'nextStep' => 2000,
        'evidence' => 500,
    ];
    foreach ($limits as $name => $max) {
        if ($problem = textProblem($name, $item[$name] ?? null, $max)) {
            return $problem;
        }
    }
    if ($problem = dateProblem($item['date'] ?? null)) {
        return $problem;
    }
    if ($problem = urlProblem($item['evidence'])) {
        return $problem;
    }
    $skills = $item['skills'] ?? null;
    if (!isList($skills) || count($skills) < 1 || count($skills) > MAX_SKILLS) {
        return 'skills must be a list of 1 to ' . MAX_SKILLS . ' skills';
    }
    foreach ($skills as $skill) {
        if ($problem = textProblem('each skill', $skill, 50)) {
            return $problem;
        }
    }
    foreach (['challengeId', 'hostGroup'] as $name) {
        if (array_key_exists($name, $item) && ($problem = textProblem($name, $item[$name], 100))) {
            return $problem;
        }
    }
    if (array_key_exists('category', $item) && !in_array($item['category'], CATEGORIES, true)) {
        return 'category must be discover, mix or levelup';
    }
    return null;
}

function cleanItem($item)
{
    $clean = [];
    $keys = [
        'id',
        'title',
        'type',
        'date',
        'role',
        'description',
        'skills',
        'whatIDid',
        'whatILearned',
        'challenge',
        'nextStep',
        'evidence',
        'challengeId',
        'hostGroup',
        'category'
    ];
    foreach ($keys as $key) {
        if (!array_key_exists($key, $item)) continue;
        $value = $item[$key];
        if (is_string($value)) {
            $value = trim($value);
        } elseif ($key === 'skills') {
            $value = array_map('trim', $value);
        }
        $clean[$key] = $value;
    }
    return $clean;
}

function portfolioProblem($portfolio)
{
    if (!is_array($portfolio)) {
        return 'portfolio must be an object';
    }
    if (isset($portfolio['id']) && ($problem = idProblem($portfolio['id']))) {
        return $problem;
    }
    $limits = ['displayName' => 80, 'whatEnjoy' => 1000, 'whatTried' => 1000, 'whatCurious' => 1000];
    foreach ($limits as $name => $max) {
        if ($problem = textProblem($name, $portfolio[$name] ?? null, $max)) {
            return $problem;
        }
    }
    $items = $portfolio['items'] ?? null;
    if (!isList($items) || count($items) > MAX_ITEMS) {
        return 'items must be a list of at most ' . MAX_ITEMS . ' items';
    }
    $seen = [];
    foreach ($items as $n => $item) {
        if ($problem = itemProblem($item)) {
            return 'item ' . ($n + 1) . ': ' . $problem;
        }
        if (!isset($item['id'])) {
            return 'item ' . ($n + 1) . ': id is required';
        }
        if (isset($seen[$item['id']])) {
            return 'item ' . ($n + 1) . ': duplicate item id "' . $item['id'] . '"';
        }
        $seen[$item['id']] = true;
    }
    return null;
}

function cleanPortfolio($portfolio)
{
    $clean = [];
    if (isset($portfolio['id'])) {
        $clean['id'] = $portfolio['id'];
    }
    foreach (['displayName', 'whatEnjoy', 'whatTried', 'whatCurious'] as $key) {
        $clean[$key] = trim($portfolio[$key]);
    }
    $clean['items'] = array_map('cleanItem', $portfolio['items']);
    return $clean;
}

function portfolioListProblem($list)
{
    if (!isList($list) || count($list) > MAX_PORTFOLIOS) {
        return 'body must be a list of at most ' . MAX_PORTFOLIOS . ' portfolios';
    }
    $seen = [];
    foreach ($list as $n => $portfolio) {
        if ($problem = portfolioProblem($portfolio)) {
            return 'portfolio ' . ($n + 1) . ': ' . $problem;
        }
        if (isset($portfolio['id'])) {
            if (isset($seen[$portfolio['id']])) {
                return 'portfolio ' . ($n + 1) . ': duplicate portfolio id "' . $portfolio['id'] . '"';
            }
            $seen[$portfolio['id']] = true;
        }
    }
    return null;
}
