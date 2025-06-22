import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // 排除爬虫文件和测试文件，它们不应该被打包到客户端
    config.externals = config.externals || [];
    config.externals.push({
      'src/crawlers': 'commonjs src/crawlers',
      'test': 'commonjs test',
      'scripts': 'commonjs scripts'
    });
    
    return config;
  },
  eslint: {
    // 在构建时忽略爬虫文件的ESLint检查
    ignoreDuringBuilds: false,
    dirs: ['src/app', 'src/components'] // 只检查这些目录
  }
};

export default nextConfig;
