import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '社区动态 - AI每日热点',
  description: '社交媒体讨论、播客节目和社区观点',
  keywords: ['社区动态', '社交媒体', '播客', '技术讨论', '行业观点'],
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
