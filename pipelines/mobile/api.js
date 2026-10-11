const crypto = require('crypto');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');

// AES-128-CBC加密
function encrypt(plainText) {
  const key = Buffer.from(config.aes.key, 'utf8');
  const iv = Buffer.from(config.aes.iv, 'utf8');
  const cipher = crypto.createCipheriv(config.aes.algorithm, key, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted.toUpperCase();
}

// AES-128-CBC解密
function decrypt(hexText) {
  const key = Buffer.from(config.aes.key, 'utf8');
  const iv = Buffer.from(config.aes.iv, 'utf8');
  const decipher = crypto.createDecipheriv(config.aes.algorithm, key, iv);
  let decrypted = decipher.update(hexText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
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

// 调用API获取资费列表
async function getTariffList(provinceCode, tariffAttr, type1, type2) {
  const params = buildParams(provinceCode, tariffAttr, type1, type2);
  const plainText = JSON.stringify(params);
  const encrypted = encrypt(plainText);

  try {
    const response = await axios.post(config.apiUrl, encrypted, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36'
      },
      timeout: 30000,
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false,
        secureOptions: require('crypto').constants.SSL_OP_LEGACY_SERVER_CONNECT
      })
    });

    if (response.data && response.data.body) {
      const decrypted = decrypt(response.data.body);
      return JSON.parse(decrypted);
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
