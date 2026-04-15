type LegalSection = {
  title: string
  paragraphs: string[]
  items?: string[]
}

export const agreementEffectiveDate = '2024年1月1日'

export const agreementSections: LegalSection[] = [
  {
    title: '第一条 协议的接受',
    paragraphs: [
      '欢迎使用益辛友取水服务！本协议是您与益辛友平台之间的法律协议。使用我们的服务即表示您同意遵守本协议的所有条款。'
    ]
  },
  {
    title: '第二条 服务内容',
    paragraphs: ['我们提供以下服务：'],
    items: ['净水器设备租赁服务', '取水点定位与导航服务', '积分管理与消费服务', 'VIP会员增值服务', '设备维护与技术支持']
  },
  {
    title: '第三条 用户权利与义务',
    paragraphs: ['用户享有服务使用权，同时需要：'],
    items: ['提供真实、准确的个人信息', '合理使用服务，不得恶意消耗资源', '遵守取水点的使用规范', '及时支付相关费用']
  },
  {
    title: '第四条 积分规则',
    paragraphs: ['积分获取与使用规则：'],
    items: ['注册成功获得15积分', '每次取水消耗1积分', '积分有效期为1个月', '积分不可转让，仅限本人使用']
  },
  {
    title: '第五条 服务费用',
    paragraphs: ['服务费用说明：'],
    items: ['基础取水服务：1积分/次', 'VIP会员服务：按套餐收费', '设备租赁费用：根据设备型号确定', '支付方式：积分、微信支付、支付宝']
  },
  {
    title: '第六条 免责声明',
    paragraphs: ['在法律允许的范围内，平台对以下情况不承担责任：'],
    items: ['因不可抗力导致的服务中断', '用户违规使用造成的损失', '第三方设备故障', '网络连接问题']
  },
  {
    title: '第七条 协议修改',
    paragraphs: ['我们保留随时修改本协议的权利。修改后的协议将在平台上公布，继续使用服务即视为同意修改后的协议。']
  },
  {
    title: '第八条 争议解决',
    paragraphs: ['因本协议产生的争议，双方应友好协商解决。协商不成的，提交至平台所在地人民法院解决。']
  }
]

export const agreementContact = {
  phone: '4006625818',
  email: 'service@yixinyou.com'
}

export const privacyEffectiveDate = '2024年1月1日'

export const privacySections: LegalSection[] = [
  {
    title: '第一条 引言',
    paragraphs: ['益辛友平台非常重视用户的隐私保护。本政策详细说明了我们如何收集、使用、存储和保护您的个人信息。']
  },
  {
    title: '第二条 信息收集',
    paragraphs: ['我们可能收集以下信息：'],
    items: ['基本信息：姓名、手机号、地址', '微信信息：昵称、头像、OpenID', '使用信息：取水记录、积分变动', '设备信息：设备型号、使用状态', '位置信息：取水点位置（仅在使用时）']
  },
  {
    title: '第三条 信息使用',
    paragraphs: ['我们使用收集的信息用于：'],
    items: ['提供和改进服务', '处理订单和支付', '客户服务和技术支持', '发送服务通知', '防范欺诈和滥用']
  },
  {
    title: '第四条 信息共享',
    paragraphs: ['我们不会出售、交易或转让您的个人信息给第三方，除非：'],
    items: ['获得您的明确同意', '法律法规要求', '保护平台和用户权益', '与可信的服务提供商合作']
  },
  {
    title: '第五条 信息存储',
    paragraphs: ['您的信息存储在中国境内的安全服务器上，我们采用行业标准的安全措施保护您的数据。个人信息的保存期限不会超过实现目的所必需的期限。']
  },
  {
    title: '第六条 信息安全',
    paragraphs: ['我们采取以下措施保护您的信息：'],
    items: ['数据加密传输和存储', '访问权限控制', '定期安全审计', '员工隐私培训']
  },
  {
    title: '第七条 您的权利',
    paragraphs: ['您对个人信息享有以下权利：'],
    items: ['查询和获取个人信息', '更正不准确的信息', '删除个人信息', '撤回同意', '投诉举报']
  },
  {
    title: '第八条 Cookie和类似技术',
    paragraphs: ['我们使用Cookie和类似技术来改善用户体验、分析服务使用情况。您可以通过浏览器设置控制Cookie的使用。']
  },
  {
    title: '第九条 未成年人保护',
    paragraphs: ['我们不会故意收集14岁以下儿童的个人信息。如果您是未成年人，请在监护人指导下使用我们的服务。']
  },
  {
    title: '第十条 政策更新',
    paragraphs: ['我们可能会不时更新本隐私政策。重大变更时，我们会通过适当方式通知您。']
  },
  {
    title: '第十一条 联系我们',
    paragraphs: ['如果您对本隐私政策有任何疑问或需要行使相关权利，请联系我们。']
  }
]

export const privacyContact = {
  phone: '4006625818',
  email: 'privacy@yixinyou.com'
}

export type { LegalSection }
