// 中国移动资费API配置
module.exports = {
  // API端点
  apiUrl: 'https://h.app.coc.10086.cn/website/nrapigate/nrtariff/new/Tariff/getTariffListInfo',

  // AES加密配置
  aes: {
    key: '1234123412ABCDEF',
    iv: 'ABCDEF1234123412',
    algorithm: 'aes-128-cbc'
  },

  // 省份代码映射
  provinces: {
    '100': '全国',
    '731': '湖南',
    '734': '广东',
    '735': '广西',
    '736': '海南',
    '737': '湖北',
    '738': '河南',
    '739': '河北',
    '740': '北京',
    '741': '上海',
    '742': '天津',
    '743': '重庆',
    '744': '四川',
    '745': '贵州',
    '746': '云南',
    '747': '西藏',
    '748': '陕西',
    '749': '甘肃',
    '750': '青海',
    '751': '宁夏',
    '752': '新疆',
    '753': '辽宁',
    '754': '吉林',
    '755': '黑龙江',
    '756': '江苏',
    '757': '浙江',
    '758': '安徽',
    '759': '福建',
    '760': '江西',
    '761': '山东',
    '762': '山西',
    '763': '内蒙古'
  },

  // 业务类型
  type1: {
    personal: 1,
    enterprise: 2
  },

  // 套餐类型
  type2: {
    package: 1,
    addon: 2,
    marketing: 3
  },

  // 资费属性
  tariffAttr: {
    national: 1,
    provincial: 2
  },

  // 输出目录
  outputDir: '../../data',

  // 请求配置
  request: {
    cellNum: '99999999999',
    isPublic: 1,
    linkScn: 1,
    page: 1,
    limit: 10000
  }
};
