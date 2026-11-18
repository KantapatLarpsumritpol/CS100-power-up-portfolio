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


function lockData() {
    static $lock = null;                       
    if ($lock === null) {
        
        $lock = @fopen(DATA_DIR . '/data.lock', 'c');
        if ($lock === false) {
            cannotSave(DATA_DIR . '/data.lock');
        }
        flock($lock, LOCK_EX);                
    }
}


function readPortfolios() {
    lockData();
    if (!file_exists(DATA_FILE)) {
        return [];
    }
    return json_decode(file_get_contents(DATA_FILE), true) ?? [];
}


function writePortfolios($portfolios) {
    $json = json_encode($portfolios, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    
    if (@file_put_contents(DATA_FILE, $json, LOCK_EX) === false) {
        cannotSave(DATA_FILE);
    }
}


function cannotSave($file) {
    if (php_sapi_name() === 'cli-server') {
        
        $fix = 'On your laptop: make sure api/storage.php is the newest one from the starter, '
             . 'and that your project folder is not read-only.';
    } else {
       
        $fix = 'On EC2 run: sudo mkdir -p /var/www/data && sudo chown www-data:www-data /var/www/data';
    }
    sendJson(['error' => 'Server cannot save to ' . $file . '. ' . $fix], 500);
}


function sendJson($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
