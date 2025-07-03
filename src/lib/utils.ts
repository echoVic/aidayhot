/**
 * 公共工具函数库
 * 包含格式化、验证、转换等通用功能
 */

/**
 * 格式化数字显示
 * 将大数字转换为更易读的格式（K、M）
 * @param num 要格式化的数字
 * @returns 格式化后的字符串
 * @example
 * formatNumber(1234) // "1.2K"
 * formatNumber(1234567) // "1.2M"
 * formatNumber(123) // "123"
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * 格式化时间显示
 * 将日期转换为相对时间格式（几天前、几周前等）
 * @param dateString 日期字符串
 * @returns 格式化后的相对时间字符串
 * @example
 * formatDate("2023-12-01") // "3天前"
 * formatDate("2023-11-01") // "1个月前"
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1天前';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}周前`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)}个月前`;
    return `${Math.ceil(diffDays / 365)}年前`;
  } catch {
    return '未知';
  }
}

/**
 * 格式化相对时间显示（更精确的版本）
 * 将日期转换为相对时间格式，支持分钟、小时等更精确的时间单位
 * @param date 日期对象
 * @returns 格式化后的相对时间字符串
 * @example
 * formatDistanceToNow(new Date()) // "刚刚"
 * formatDistanceToNow(new Date(Date.now() - 60000)) // "1分钟前"
 */
export function formatDistanceToNow(date: Date): string {
  try {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}周前`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)}个月前`;
    return `${Math.ceil(diffDays / 365)}年前`;
  } catch {
    return '未知';
  }
}

/**
 * 编程语言颜色映射
 * 为不同的编程语言提供对应的颜色
 */
export const LANGUAGE_COLORS: Record<string, string> = {
  'JavaScript': '#f1e05a',
  'TypeScript': '#2b7489',
  'Python': '#3572A5',
  'Java': '#b07219',
  'C++': '#f34b7d',
  'C': '#555555',
  'C#': '#239120',
  'Go': '#00ADD8',
  'Rust': '#dea584',
  'PHP': '#4F5D95',
  'Ruby': '#701516',
  'Swift': '#ffac45',
  'Kotlin': '#F18E33',
  'Dart': '#00B4AB',
  'HTML': '#e34c26',
  'CSS': '#1572B6',
  'Vue': '#4FC08D',
  'React': '#61DAFB',
  'Shell': '#89e051',
  'Dockerfile': '#384d54',
};

/**
 * 获取编程语言对应的颜色
 * @param language 编程语言名称
 * @returns 对应的颜色值（十六进制）
 */
export function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] || '#6b7280';
}

/**
 * 问题状态颜色映射
 * 为不同的问题状态提供对应的样式类
 */
export const STATUS_COLORS = {
  answered: 'bg-green-100 text-green-800',
  unanswered: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  closed: 'bg-gray-100 text-gray-800',
} as const;

/**
 * 获取问题状态信息
 * @param hasAcceptedAnswer 是否有被采纳的答案
 * @param isAnswered 是否已回答
 * @returns 状态信息对象
 */
export function getQuestionStatus(hasAcceptedAnswer: boolean, isAnswered: boolean) {
  if (hasAcceptedAnswer) return { status: 'accepted' as const, label: '已采纳', icon: '✅' };
  if (isAnswered) return { status: 'answered' as const, label: '已回答', icon: '💬' };
  return { status: 'unanswered' as const, label: '待回答', icon: '❓' };
}

/**
 * 安全地获取文本值
 * 处理可能为 undefined 或 null 的文本值
 * @param value 可能的文本值
 * @param defaultValue 默认值
 * @returns 安全的文本值
 */
export function getTextValue(value: string | undefined | null, defaultValue = ''): string {
  return value || defaultValue;
}

/**
 * 截断文本
 * 如果文本超过指定长度，则截断并添加省略号
 * @param text 要截断的文本
 * @param maxLength 最大长度
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * 生成唯一的组件 key
 * 结合多个值生成唯一的 React key
 * @param parts 组成 key 的各个部分
 * @returns 唯一的 key 字符串
 */
export function generateUniqueKey(...parts: (string | number)[]): string {
  return parts.join('_');
}

/**
 * 检查数组是否为空
 * @param arr 要检查的数组
 * @returns 是否为空数组
 */
export function isEmptyArray<T>(arr: T[] | undefined | null): boolean {
  return !arr || arr.length === 0;
}

/**
 * 安全地解析 JSON
 * @param jsonString JSON 字符串
 * @param defaultValue 解析失败时的默认值
 * @returns 解析后的对象或默认值
 */
export function safeJsonParse<T>(jsonString: string | undefined | null, defaultValue: T): T {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString);
  } catch {
    return defaultValue;
  }
}

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param delay 延迟时间（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}
