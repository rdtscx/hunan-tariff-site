/**
 * 多运营商数据同步脚本
 * 从原网站同步联通/电信/广电数据，移动数据使用本地爬虫
 * 运行方式: node sync_all.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ORIGIN_BASE = 'https://hnvip.qd.je';
const ROOT_DIR = path.join(__dirname, '..', '..');
const DEFAULT_PROVINCE = 'beijing';

// 运营商配置
const OPERATORS = [
  { key: 'mobile', dir: '', name: '中国移动' },
  { key: 'unicom', dir: 'unicom', name: '中国联通' },
  { key: 'telecom', dir: 'telecom', name: '中国电信' },
  { key: 'broadnet', dir: 'gb', name: '中国广电' }
];

// 需要同步的省份（至少包含全国和北京）
const PROVINCES = ['quanguo', 'beijing'];

// HTTPS GET 请求（忽略证书错误）
function fetch(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36',
        'Accept': 'application/json,text/html,*/*'
      },
      rejectUnauthorized: false,
      timeout
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout: ' + url));
    });
    req.end();
  });
}

// 下载并保存JSON文件
async function downloadJson(remotePath, localPath) {
  const url = ORIGIN_BASE + remotePath;
  try {
    const res = await fetch(url);
    if (res.status === 200 && res.data) {
      // 验证是否为有效JSON
      try {
        const parsed = JSON.parse(res.data);
        fs.mkdirSync(path.dirname(localPath), { recursive: true });
        fs.writeFileSync(localPath, JSON.stringify(parsed, null, 2));
        console.log(`  ✓ ${remotePath} (${res.data.length} bytes)`);
        return true;
      } catch (e) {
        console.log(`  ✗ ${remotePath} - 无效JSON，跳过`);
        return false;
      }
    } else {
      console.log(`  ✗ ${remotePath} - HTTP ${res.status}`);
      return false;
    }
  } catch (e) {
    console.log(`  ✗ ${remotePath} - ${e.message}`);
    return false;
  }
}

// 更新 latest.json 的 default 省份
function updateDefaultProvince(latestPath) {
  try {
    if (!fs.existsSync(latestPath)) return;
    const data = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
    data.default = DEFAULT_PROVINCE;
    // 确保北京在sections中
    if (data.sections && Array.isArray(data.sections)) {
      const hasBeijing = data.sections.some(s => s.section === 'beijing');
      if (!hasBeijing) {
        data.sections.push({ section: 'beijing', name: '北京', total: 0, updated: new Date().toISOString() });
      }
    }
    fs.writeFileSync(latestPath, JSON.stringify(data, null, 2));
    console.log(`  ✓ 默认省份已更新为北京`);
  } catch (e) {
    console.log(`  ✗ 更新默认省份失败: ${e.message}`);
  }
}

// 将移动公告数据中的湖南转换为北京
function convertAnnounceToBeijing(announcePath) {
  try {
    if (!fs.existsSync(announcePath)) return;
    const data = JSON.parse(fs.readFileSync(announcePath, 'utf8'));
    let changed = false;
    (data.items || []).forEach(item => {
      for (const field of ['title', 'summary', 'content']) {
        if (typeof item[field] === 'string' && item[field].includes('湖南')) {
          item[field] = item[field].replace(/湖南/g, '北京');
          changed = true;
        }
      }
      if (typeof item.page_url === 'string') {
        item.page_url = item.page_url.replace(/hn\/index_731_731/g, 'bj/index_010_010');
      }
      if (Array.isArray(item.attachments)) {
        item.attachments.forEach(att => {
          if (typeof att.url === 'string') {
            att.url = att.url.replace(/\/hn\//g, '/bj/');
          }
          if (typeof att.name === 'string' && att.name.includes('湖南')) {
            att.name = att.name.replace(/湖南/g, '北京');
            changed = true;
          }
        });
      }
    });
    if (changed) {
      fs.writeFileSync(announcePath, JSON.stringify(data, null, 2));
      console.log(`  ✓ 公告数据已转换为北京`);
    }
  } catch (e) {
    console.log(`  ✗ 公告转换失败: ${e.message}`);
  }
}

// 确保北京明细数据存在
function ensureBeijingData(dataDir) {
  const beijingPath = path.join(dataDir, 'beijing.json');
  if (!fs.existsSync(beijingPath)) {
    fs.writeFileSync(beijingPath, JSON.stringify({ scope: 'beijing', items: [] }, null, 2));
    console.log(`  ✓ 创建空北京数据文件`);
  } else {
    // 验证是否为有效JSON
    try {
      JSON.parse(fs.readFileSync(beijingPath, 'utf8'));
    } catch (e) {
      fs.writeFileSync(beijingPath, JSON.stringify({ scope: 'beijing', items: [] }, null, 2));
      console.log(`  ✓ 修复损坏的北京数据文件`);
    }
  }
}

// 同步单个运营商
async function syncOperator(op) {
  console.log(`\n=== 同步 ${op.name} ===`);
  const dataDir = op.dir ? path.join(ROOT_DIR, op.dir, 'data') : path.join(ROOT_DIR, 'data');
  const remotePrefix = op.dir ? `/${op.dir}/data` : '/data';

  // 同步 latest.json
  await downloadJson(`${remotePrefix}/latest.json`, path.join(dataDir, 'latest.json'));

  // 同步 announce.json
  await downloadJson(`${remotePrefix}/announce.json`, path.join(dataDir, 'announce.json'));

  // 移动公告数据：湖南→北京转换
  if (op.key === 'mobile') {
    convertAnnounceToBeijing(path.join(dataDir, 'announce.json'));
  }

  // 同步省份明细数据
  for (const prov of PROVINCES) {
    await downloadJson(`${remotePrefix}/${prov}.json`, path.join(dataDir, `${prov}.json`));
    await new Promise(r => setTimeout(r, 500));
  }

  // 更新默认省份
  updateDefaultProvince(path.join(dataDir, 'latest.json'));

  // 确保北京数据存在
  ensureBeijingData(dataDir);
}

// 主函数
async function main() {
  console.log('开始多运营商数据同步...');
  console.log(`原站: ${ORIGIN_BASE}`);
  console.log(`默认省份: ${DEFAULT_PROVINCE}`);

  // 1. 运行移动本地爬虫
  console.log('\n=== 运行中国移动本地爬虫 ===');
  try {
    execSync('cd pipelines/mobile && node crawl_all.js', {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      timeout: 600000
    });
    console.log('✓ 移动爬虫完成');
  } catch (e) {
    console.log(`⚠ 移动爬虫失败: ${e.message}`);
    console.log('将从原站同步移动数据作为兜底...');
    await syncOperator(OPERATORS[0]);
  }

  // 更新移动默认省份
  updateDefaultProvince(path.join(ROOT_DIR, 'data', 'latest.json'));
  ensureBeijingData(path.join(ROOT_DIR, 'data'));

  // 2. 同步联通/电信/广电（从原站）
  for (let i = 1; i < OPERATORS.length; i++) {
    await syncOperator(OPERATORS[i]);
  }

  console.log('\n=== 同步完成 ===');
  console.log('所有运营商数据已更新，默认省份：北京');
}

main().catch(error => {
  console.error('同步失败:', error);
  process.exit(1);
});
