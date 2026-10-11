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

  // 省份代码映射（使用电话区号，3位数格式，与api.php保持一致）
  provinces: {
    '100': '全国',
    '010': '北京',
    '021': '上海',
    '022': '天津',
    '023': '重庆',
    '020': '广东',
    '731': '湖南',
    '027': '湖北',
    '025': '江苏',
    '571': '浙江',
    '531': '山东',
    '371': '河南',
    '028': '四川',
    '591': '福建',
    '551': '安徽',
    '311': '河北',
    '351': '山西',
    '471': '内蒙古',
    '024': '辽宁',
    '431': '吉林',
    '451': '黑龙江',
    '791': '江西',
    '771': '广西',
    '898': '海南',
    '851': '贵州',
    '871': '云南',
    '891': '西藏',
    '029': '陕西',
    '931': '甘肃',
    '971': '青海',
    '951': '宁夏',
    '991': '新疆'
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
