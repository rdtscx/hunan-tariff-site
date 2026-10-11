<?php
/**
 * 中国移动资费API代理
 * 处理AES加密请求、缓存、gzip压缩输出
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// AES配置
define('AES_KEY', '1234123412ABCDEF');
define('AES_IV', 'ABCDEF1234123412');
define('API_URL', 'https://h.app.coc.10086.cn/website/nrapigate/nrtariff/new/Tariff/getTariffListInfo');
define('CACHE_DIR', __DIR__ . '/cache');
define('CACHE_TTL', 1800); // 30分钟

// 确保缓存目录存在
if (!is_dir(CACHE_DIR)) {
    mkdir(CACHE_DIR, 0755, true);
}

// AES-128-CBC加密
function aesEncrypt($plainText) {
    $padded = $plainText;
    $blockSize = 16;
    $pad = $blockSize - (strlen($plainText) % $blockSize);
    $padded .= str_repeat(chr($pad), $pad);
    return strtoupper(bin2hex(openssl_encrypt($padded, 'AES-128-CBC', AES_KEY, OPENSSL_RAW_DATA | OPENSSL_ZERO_PADDING, AES_IV)));
}

// AES-128-CBC解密
function aesDecrypt($hexText) {
    $decrypted = openssl_decrypt(hex2bin($hexText), 'AES-128-CBC', AES_KEY, OPENSSL_RAW_DATA | OPENSSL_ZERO_PADDING, AES_IV);
    $pad = ord($decrypted[strlen($decrypted) - 1]);
    if ($pad > 0 && $pad <= 16) {
        $decrypted = substr($decrypted, 0, -$pad);
    }
    return $decrypted;
}

// 生成UUID
function generateUUID() {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

// 调用中国移动API
function callMobileApi($province, $tariffAttr, $type1, $type2) {
    $params = [
        'cellNum' => '99999999999',
        'province' => $province,
        'isPublic' => 1,
        'linkScn' => 1,
        'tariffAttr' => $tariffAttr,
        'type1' => $type1,
        'type2' => $type2,
        'page' => 1,
        'limit' => 10000,
        'xk' => generateUUID()
    ];

    $plainText = json_encode($params, JSON_UNESCAPED_UNICODE);
    $encrypted = aesEncrypt($plainText);

    $ch = curl_init(API_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $encrypted,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'User-Agent: Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36'
        ],
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200 || !$response) {
        return null;
    }

    $data = json_decode($response, true);
    if (!$data || !isset($data['body'])) {
        return null;
    }

    $decrypted = aesDecrypt($data['body']);
    return json_decode($decrypted, true);
}

// 过滤空字段
function filterEmptyFields($items) {
    $result = [];
    foreach ($items as $item) {
        $filtered = [];
        foreach ($item as $key => $value) {
            if ($value !== null && $value !== '' && $value !== 0) {
                $filtered[$key] = $value;
            }
        }
        $result[] = $filtered;
    }
    return $result;
}

// 去重
function deduplicate($items) {
    $seen = [];
    $result = [];
    foreach ($items as $item) {
        $key = isset($item['tariffId']) ? $item['tariffId'] : (isset($item['id']) ? $item['id'] : md5(json_encode($item)));
        if (!isset($seen[$key])) {
            $seen[$key] = true;
            $result[] = $item;
        }
    }
    return $result;
}

// gzip压缩输出
function outputJson($data) {
    $json = json_encode($data, JSON_UNESCAPED_UNICODE);

    // 检测客户端是否支持gzip
    $acceptEncoding = isset($_SERVER['HTTP_ACCEPT_ENCODING']) ? $_SERVER['HTTP_ACCEPT_ENCODING'] : '';
    if (strpos($acceptEncoding, 'gzip') !== false) {
        $compressed = gzencode($json, 9);
        header('Content-Encoding: gzip');
        header('Content-Length: ' . strlen($compressed));
        echo $compressed;
    } else {
        header('Content-Length: ' . strlen($json));
        echo $json;
    }
    exit;
}

// 获取缓存
function getCache($key) {
    $file = CACHE_DIR . '/' . $key . '.json';
    if (file_exists($file) && (time() - filemtime($file)) < CACHE_TTL) {
        $content = file_get_contents($file);
        return json_decode($content, true);
    }
    return null;
}

// 设置缓存
function setCache($key, $data) {
    $file = CACHE_DIR . '/' . $key . '.json';
    file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE));
}

// 主逻辑
$action = isset($_GET['action']) ? $_GET['action'] : 'section';
$province = isset($_GET['province']) ? $_GET['province'] : '731';

if ($action === 'section') {
    // 获取某个省份的完整数据（全网+省份）
    $cacheKey = 'section_' . $province;
    $cached = getCache($cacheKey);

    if ($cached) {
        outputJson(['success' => true, 'data' => $cached, 'cached' => true]);
    }

    $allItems = [];

    // 全网资费
    foreach ([1, 2] as $type1) {
        foreach ([1, 2, 3] as $type2) {
            $result = callMobileApi($province, 1, $type1, $type2);
            if ($result && isset($result['data']['list'])) {
                $allItems = array_merge($allItems, $result['data']['list']);
            }
            usleep(300000);
        }
    }

    // 省份资费
    foreach ([1, 2] as $type1) {
        foreach ([1, 2, 3] as $type2) {
            $result = callMobileApi($province, 2, $type1, $type2);
            if ($result && isset($result['data']['list'])) {
                $allItems = array_merge($allItems, $result['data']['list']);
            }
            usleep(300000);
        }
    }

    $uniqueItems = deduplicate($allItems);
    $filtered = filterEmptyFields($uniqueItems);

    setCache($cacheKey, $filtered);
    outputJson(['success' => true, 'data' => $filtered, 'cached' => false]);

} elseif ($action === 'national') {
    // 获取全国数据
    $cacheKey = 'national';
    $cached = getCache($cacheKey);

    if ($cached) {
        outputJson(['success' => true, 'data' => $cached, 'cached' => true]);
    }

    $allItems = [];
    foreach ([1, 2] as $type1) {
        foreach ([1, 2, 3] as $type2) {
            $result = callMobileApi('100', 1, $type1, $type2);
            if ($result && isset($result['data']['list'])) {
                $allItems = array_merge($allItems, $result['data']['list']);
            }
            usleep(300000);
        }
    }

    $uniqueItems = deduplicate($allItems);
    $filtered = filterEmptyFields($uniqueItems);

    setCache($cacheKey, $filtered);
    outputJson(['success' => true, 'data' => $filtered, 'cached' => false]);

} elseif ($action === 'stats') {
    // 获取统计信息
    $cacheKey = 'stats_' . $province;
    $cached = getCache($cacheKey);

    if ($cached) {
        outputJson(['success' => true, 'data' => $cached, 'cached' => true]);
    }

    // 简化统计
    $stats = [
        'updateTime' => date('Y-m-d H:i:s'),
        'province' => $province
    ];

    outputJson(['success' => true, 'data' => $stats, 'cached' => false]);

} else {
    outputJson(['success' => false, 'error' => 'Unknown action']);
}
