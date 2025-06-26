// 基于真实AI数据生成的内容
export const mockArticles = [
  {
    "id": "1",
    "title": "Preparing for future AI risks in biology",
    "summary": "Advanced AI can transform biology and medicine—but also raises biosecurity risks. We're proactively assessing capabilities and implementing safeguards to prevent misuse.",
    "category": "机器学习",
    "author": "技术专家",
    "publishTime": "2025-06-18",
    "readTime": "1分钟",
    "views": 31280,
    "likes": 1611,
    "tags": [
      "AI",
      "技术"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86?w=800&h=400&fit=crop",
    "isHot": true,
    "isNew": true
  },
  {
    "id": "2",
    "title": "Breaking bonds, breaking ground: Advancing the accuracy of computational chemist...",
    "summary": "<p>Microsoft researchers achieved a breakthrough in the accuracy of DFT, a method for predicting the properties of molecules and materials, by using deep learning. This work can lead to better batteries, green fertilizers, precision drug discovery, and more.</p>\n<p>The post <a href=\"https://www.microsoft.com/en-us/research/blog/breaking-bonds-breaking-ground-advancing-the-accuracy-of-computational-chemistry-with-deep-learning/\">Breaking bonds, breaking ground: Advancing the accuracy of computational chemistry with deep learning</a> appeared first on <a href=\"https://www.microsoft.com/en-us/research\">Microsoft Research</a>.</p>\n",
    "category": "机器学习",
    "author": "AI研究员",
    "publishTime": "2025-06-18",
    "readTime": "1分钟",
    "views": 49116,
    "likes": 307,
    "tags": [
      "AI",
      "技术"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86?w=800&h=400&fit=crop",
    "isHot": true,
    "isNew": true
  },
  {
    "id": "3",
    "title": "Data Science, No Degree",
    "summary": "An honest breakdown of the ups and downs I went through to get into the tech industry and top tips to learn from my mistakes.",
    "category": "机器学习",
    "author": "科技记者",
    "publishTime": "2025-06-20",
    "readTime": "1分钟",
    "views": 5864,
    "likes": 1070,
    "tags": [
      "AI",
      "技术"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86?w=800&h=400&fit=crop",
    "isHot": false,
    "isNew": true
  },
  {
    "id": "4",
    "title": "No Free Lunch: Rethinking Internal Feedback for LLM Reasoning",
    "summary": "  Reinforcement learning has emerged as a powerful paradigm for post-training\nlarge language models (LLMs) to improve reasoning. Approaches like\nReinforcement Learning from Human Feedback (RLHF) and Reinforcement Learning\nwith Verifiable Rewards (RLVR) have shown strong results, but they require\nextensive external supervision. We investigate an alternative class of methods,\nReinforcement Learning from Internal Feedback (RLIF), which relies solely on\nintrinsic model-derived signals instead of external rewards. In particular, we\nleverage unsupervised reward proxies such as token-level entropy,\ntrajectory-level entropy, and self-certainty. Our theoretical analysis shows\nthese internal objectives are partially equivalent, and we empirically evaluate\nvarious RLIF strategies on challenging math reasoning benchmarks. Experimental\nresults demonstrate that RLIF can boost the reasoning performance of base LLMs\nat the beginning phase of the training, matching or surpassing RLVR techniques\non these tasks. However, when training progresses, performance degrades even\nbelow the model before training. Moreover, we find that RLIF yields little\nimprovement for instruction-tuned models, indicating diminishing returns of\nintrinsic feedback once an LLM is already instruction-tuned. We further analyze\nthis limitation by mixing model weights and explain the reason of RLIF's\ntraining behaviors, providing practical guidelines for integrating internal\nfeedback signals into LLM training. We hope our analysis of internal feedback\nwill inform more principled and effective strategies for LLM post-training.\n",
    "category": "大模型",
    "author": "AI研究员",
    "publishTime": "2025-06-23",
    "readTime": "1分钟",
    "views": 49051,
    "likes": 1339,
    "tags": [
      "大模型",
      "LLM",
      "GPT"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop",
    "isHot": true,
    "isNew": true
  },
  {
    "id": "5",
    "title": "Machine Mental Imagery: Empower Multimodal Reasoning with Latent Visual Tokens",
    "summary": "  Vision-language models (VLMs) excel at multimodal understanding, yet their\ntext-only decoding forces them to verbalize visual reasoning, limiting\nperformance on tasks that demand visual imagination. Recent attempts train VLMs\nto render explicit images, but the heavy image-generation pre-training often\nhinders the reasoning ability. Inspired by the way humans reason with mental\nimagery-the internal construction and manipulation of visual cues-we\ninvestigate whether VLMs can reason through interleaved multimodal trajectories\nwithout producing explicit images. To this end, we present a Machine Mental\nImagery framework, dubbed as Mirage, which augments VLM decoding with latent\nvisual tokens alongside ordinary text. Concretely, whenever the model chooses\nto ``think visually'', it recasts its hidden states as next tokens, thereby\ncontinuing a multimodal trajectory without generating pixel-level images. Begin\nby supervising the latent tokens through distillation from ground-truth image\nembeddings, we then switch to text-only supervision to make the latent\ntrajectory align tightly with the task objective. A subsequent reinforcement\nlearning stage further enhances the multimodal reasoning capability.\nExperiments on diverse benchmarks demonstrate that Mirage unlocks stronger\nmultimodal reasoning without explicit image generation.\n",
    "category": "AI绘画",
    "author": "AI研究员",
    "publishTime": "2025-06-23",
    "readTime": "1分钟",
    "views": 5302,
    "likes": 885,
    "tags": [
      "AI绘画",
      "计算机视觉",
      "生成模型"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=400&fit=crop",
    "isHot": false,
    "isNew": true
  },
  {
    "id": "6",
    "title": "awesome-artificial-intelligence",
    "summary": "A curated list of Artificial Intelligence (AI) courses, books, video lectures and papers.",
    "category": "机器学习",
    "author": "学术研究者",
    "publishTime": "2015-01-27",
    "readTime": "1分钟",
    "views": 24564,
    "likes": 1845,
    "tags": [
      "AI",
      "技术"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86?w=800&h=400&fit=crop",
    "isHot": true,
    "isNew": false
  },
  {
    "id": "7",
    "title": "AI技术发展趋势第7期",
    "summary": "人工智能技术正在快速发展，本文探讨了最新的技术趋势和应用场景，为读者提供全面的AI行业洞察。",
    "category": "机器学习",
    "author": "AI研究员",
    "publishTime": "2025-06-23",
    "readTime": "5分钟",
    "views": 14522,
    "likes": 586,
    "tags": [
      "AI",
      "技术趋势",
      "机器学习"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86?w=800&h=400&fit=crop",
    "isHot": false,
    "isNew": true
  },
  {
    "id": "8",
    "title": "AI技术发展趋势第8期",
    "summary": "人工智能技术正在快速发展，本文探讨了最新的技术趋势和应用场景，为读者提供全面的AI行业洞察。",
    "category": "机器学习",
    "author": "AI研究员",
    "publishTime": "2025-06-23",
    "readTime": "5分钟",
    "views": 21281,
    "likes": 703,
    "tags": [
      "AI",
      "技术趋势",
      "机器学习"
    ],
    "imageUrl": "https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86?w=800&h=400&fit=crop",
    "isHot": false,
    "isNew": true
  }
];

export const categories = [
  {
    "name": "全部",
    "href": "/",
    "count": 286
  },
  {
    "name": "AI/机器学习",
    "href": "/category/ai-ml",
    "count": 83
  },
  {
    "name": "社交媒体",
    "href": "/category/social",
    "count": 95
  },
  {
    "name": "技术/开发",
    "href": "/category/tech",
    "count": 33
  },
  {
    "name": "新闻/资讯",
    "href": "/category/news",
    "count": 12
  },
  {
    "name": "播客",
    "href": "/category/podcast",
    "count": 17
  },
  {
    "name": "设计/UX",
    "href": "/category/design",
    "count": 3
  },
  {
    "name": "学术/研究",
    "href": "/category/academic",
    "count": 1
  },
  {
    "name": "其他",
    "href": "/category/other",
    "count": 42
  }
];
