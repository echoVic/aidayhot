// 模拟文章数据
export const mockArticles = [
  {
    id: '1',
    title: 'ChatGPT-4发布重大更新：多模态能力全面提升，支持图像、语音和视频理解',
    summary: 'OpenAI最新发布的ChatGPT-4版本在多模态理解能力上取得重大突破，不仅能够理解文本，还能处理图像、语音和视频内容，为AI应用带来了更多可能性。',
    category: '大模型',
    author: 'AI研究员',
    publishTime: '2024-01-15',
    readTime: '5分钟',
    views: 12843,
    likes: 856,
    tags: ['ChatGPT', '多模态', 'OpenAI', '大模型'],
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop',
    isHot: true,
    isNew: true
  },
  {
    id: '2',
    title: '谷歌发布新一代AI芯片TPU v5，性能提升300%，能耗降低50%',
    summary: '谷歌在I/O大会上正式发布了第五代张量处理单元(TPU v5)，相比上一代产品在AI推理性能上提升了300%，同时功耗降低了50%，将大幅降低AI应用的部署成本。',
    category: 'AI芯片',
    author: '硬件分析师',
    publishTime: '2024-01-14',
    readTime: '7分钟',
    views: 9876,
    likes: 654,
    tags: ['谷歌', 'TPU', 'AI芯片', '硬件'],
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop',
    isHot: true
  },
  {
    id: '3',
    title: 'Meta开源Llama 3模型，支持免费商用，引发开源AI生态变革',
    summary: 'Meta公司宣布开源其最新的Llama 3大语言模型，并提供免费商用许可。这一举措预计将加速开源AI生态的发展，为中小企业提供更多AI应用机会。',
    category: '开源AI',
    author: '开源观察者',
    publishTime: '2024-01-13',
    readTime: '6分钟',
    views: 8765,
    likes: 543,
    tags: ['Meta', 'Llama 3', '开源', '商用许可'],
    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
    isNew: true
  },
  {
    id: '4',
    title: '自动驾驶技术新突破：百度Apollo实现城市道路L4级自动驾驶量产',
    summary: '百度Apollo自动驾驶平台在复杂城市道路环境下实现了L4级自动驾驶的量产部署，标志着自动驾驶技术从测试阶段正式迈入商业化应用阶段。',
    category: '自动驾驶',
    author: '汽车科技记者',
    publishTime: '2024-01-12',
    readTime: '8分钟',
    views: 7654,
    likes: 432,
    tags: ['百度', 'Apollo', '自动驾驶', 'L4级'],
    imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=400&fit=crop'
  },
  {
    id: '5',
    title: 'AI绘画版权争议升级：艺术家集体起诉AI公司侵犯知识产权',
    summary: '多位知名艺术家联合起诉多家AI绘画公司，指控其在未经授权的情况下使用艺术作品训练AI模型。这一事件引发了关于AI技术与知识产权保护的广泛讨论。',
    category: 'AI伦理',
    author: '法律分析师',
    publishTime: '2024-01-11',
    readTime: '10分钟',
    views: 6543,
    likes: 321,
    tags: ['AI绘画', '版权', '知识产权', '法律'],
    imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=400&fit=crop'
  },
  {
    id: '6',
    title: '微软Copilot整合Office套件，AI办公助手正式商业化',
    summary: '微软宣布将Copilot AI助手深度整合到Office 365套件中，提供智能文档编辑、数据分析和演示文稿制作等功能，开启AI办公新时代。',
    category: '办公AI',
    author: '企业软件专家',
    publishTime: '2024-01-10',
    readTime: '6分钟',
    views: 5432,
    likes: 298,
    tags: ['微软', 'Copilot', 'Office', '办公助手'],
    imageUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=400&fit=crop'
  },
  {
    id: '7',
    title: 'DeepMind发布AlphaFold 3，蛋白质结构预测准确率达到95%',
    summary: 'DeepMind发布的AlphaFold 3在蛋白质结构预测方面取得重大突破，准确率提升至95%，将加速新药研发和生物医学研究的进展。',
    category: '生物AI',
    author: '生物信息学专家',
    publishTime: '2024-01-09',
    readTime: '9分钟',
    views: 4321,
    likes: 287,
    tags: ['DeepMind', 'AlphaFold', '蛋白质', '生物医学'],
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop'
  },
  {
    id: '8',
    title: '字节跳动发布大模型训练平台，支持千亿参数模型训练',
    summary: '字节跳动推出全新的大模型训练平台，支持千亿参数规模的模型训练，并提供完整的模型开发、训练和部署工具链。',
    category: '训练平台',
    author: '技术架构师',
    publishTime: '2024-01-08',
    readTime: '7分钟',
    views: 3987,
    likes: 245,
    tags: ['字节跳动', '训练平台', '大模型', '千亿参数'],
    imageUrl: 'https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86?w=800&h=400&fit=crop'
  }
];

export const categories = [
  { name: '全部', href: '/', count: 1234 },
  { name: '大模型', href: '/category/llm', count: 234 },
  { name: 'AI芯片', href: '/category/chip', count: 156 },
  { name: '自动驾驶', href: '/category/auto', count: 123 },
  { name: '机器学习', href: '/category/ml', count: 189 },
  { name: '计算机视觉', href: '/category/cv', count: 167 },
  { name: '自然语言处理', href: '/category/nlp', count: 145 },
  { name: 'AI伦理', href: '/category/ethics', count: 89 },
  { name: '开源AI', href: '/category/opensource', count: 76 },
  { name: '办公AI', href: '/category/office', count: 54 }
]; 