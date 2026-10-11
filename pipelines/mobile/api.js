const crypto = require('crypto');
const https = require('https');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');

// 全局HTTPS Agent（复用连接，启用legacy renegotiation）
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
  keepAlive: true,
  maxSockets: 5
});

// AES-128-CBC加密（与PHP版本一致：手动PKCS7填充 + 禁用自动填充）
function encrypt(plainText) {
  const key = Buffer.from(config.aes.key, 'utf8');
  const iv = Buffer.from(config.aes.iv, 'utf8');
  const cipher = crypto.createCipheriv(config.aes.algorithm, key, iv);
  cipher.setAutoPadding(false);

  // 手动PKCS7填充
  const blockSize = 16;
  const byteLength = Buffer.byteLength(plainText, 'utf8');
  const pad = blockSize - (byteLength % blockSize);
  const padded = plainText + String.fromCharCode(pad).repeat(pad);

  let encrypted = cipher.update(padded, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted.toUpperCase();
}

// AES-128-CBC解密（与PHP版本一致：禁用自动填充 + 手动去除填充）
function decrypt(hexText) {
  const key = Buffer.from(config.aes.key, 'utf8');
  const iv = Buffer.from(config.aes.iv, 'utf8');
  const decipher = crypto.createDecipheriv(config.aes.algorithm, key, iv);
  decipher.setAutoPadding(false);

  let decrypted = decipher.update(hexText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  // 手动去除PKCS7填充
  const pad = decrypted.charCodeAt(decrypted.length - 1);
  if (pad > 0 && pad <= 16) {
    decrypted = decrypted.substring(0, decrypted.length - pad);
  }
  return decrypted;
}

// 构建请求参数
function buildParams(provinceCode, tariffAttr, type1, type2) {
  return {
    cellNum: config.request.cellNum,
    province: provinceCode,
    isPublic: config.request.isPublic,
    linkScn: config.request.linkScn,
    tariffAttr: tariffAttr,
    type1: type1,
    type2: type2,
    page: config.request.page,
    limit: config.request.limit,
    xk: uuidv4()
  };
}

// 使用原生https发送POST请求
function postRequest(url, body, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36',
        'Content-Length': Buffer.byteLength(body)
      },
      agent: httpsAgent,
      timeout: timeout
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(body);
    req.end();
  });
}

// 调用API获取资费列表
async function getTariffList(provinceCode, tariffAttr, type1, type2) {
  const params = buildParams(provinceCode, tariffAttr, type1, type2);
  const plainText = JSON.stringify(params);
  const encrypted = encrypt(plainText);

  try {
    const response = await postRequest(config.apiUrl, encrypted);

    if (response.status === 200 && response.data) {
      const json = JSON.parse(response.data);
      if (json.body) {
        const decrypted = decrypt(json.body);
        return JSON.parse(decrypted);
      }
    }
    return null;
  } catch (error) {
    console.error(`API请求失败 [province=${provinceCode}, attr=${tariffAttr}, type1=${type1}, type2=${type2}]:`, error.message);
    return null;
  }
}

module.exports = {
  encrypt,
  decrypt,
  getTariffList
};
