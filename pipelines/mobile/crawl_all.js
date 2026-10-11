const fs = require('fs');
const path = require('path');
const { getTariffList } = require('./api');
const config = require('./config');

// 确保输出目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 过滤空字段，减小JSON体积
function filterEmptyFields(items) {
  return items.map(item => {
    const filtered = {};
    for (const [key, value] of Object.entries(item)) {
      if (value !== null && value !== undefined && value !== '' && value !== 0) {
        filtered[key] = value;
      }
    }
    return filtered;
  });
}

// 抓取单个省份的所有数据
async function crawlProvince(provinceCode, provinceName) {
  console.log(`开始抓取: ${provinceName} (${provinceCode})`);
  const allItems = [];

  // 全网资费（tariffAttr=1）
  for (const type1 of [config.type1.personal, config.type1.enterprise]) {
    for (const type2 of [config.type2.package, config.type2.addon, config.type2.marketing]) {
      const result = await getTariffList(provinceCode, config.tariffAttr.national, type1, type2);
      if (result && result.data && result.data.beans) {
        allItems.push(...result.data.beans);
        console.log(`  全网 type1=${type1} type2=${type2}: ${result.data.beans.length} 条`);
      }
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // 省份资费（tariffAttr=2）
  for (const type1 of [config.type1.personal, config.type1.enterprise]) {
    for (const type2 of [config.type2.package, config.type2.addon, config.type2.marketing]) {
      const result = await getTariffList(provinceCode, config.tariffAttr.provincial, type1, type2);
      if (result && result.data && result.data.beans) {
        allItems.push(...result.data.beans);
        console.log(`  省份 type1=${type1} type2=${type2}: ${result.data.beans.length} 条`);
      }
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // 去重
  const uniqueItems = [];
  const seen = new Set();
  for (const item of allItems) {
    const key = item.tariffSeqno || item.tariffId || item.id || JSON.stringify(item);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(item);
    }
  }

  console.log(`${provinceName} 总计: ${uniqueItems.length} 条（去重后）`);
  return filterEmptyFields(uniqueItems);
}

// 主函数
async function main() {
  const outputDir = path.join(__dirname, config.outputDir);
  ensureDir(outputDir);

  const summary = {
    updateTime: new Date().toISOString(),
    provinces: {}
  };

  // 抓取全国数据
  const nationalData = await crawlProvince('100', '全国');
  fs.writeFileSync(path.join(outputDir, 'national.json'), JSON.stringify(nationalData, null, 2));
  summary.provinces['全国'] = nationalData.length;

  // 抓取各省份数据
  for (const [code, name] of Object.entries(config.provinces)) {
    if (code === '100') continue;
    try {
      const data = await crawlProvince(code, name);
      fs.writeFileSync(path.join(outputDir, `province_${code}.json`), JSON.stringify(data, null, 2));
      summary.provinces[name] = data.length;
    } catch (error) {
      console.error(`抓取 ${name} 失败:`, error.message);
      summary.provinces[name] = 0;
    }
  }

  // 写入汇总
  fs.writeFileSync(path.join(outputDir, 'latest.json'), JSON.stringify(summary, null, 2));
  console.log('抓取完成！汇总:', JSON.stringify(summary, null, 2));
}

main().catch(error => {
  console.error('爬虫运行失败:', error);
  process.exit(1);
});
