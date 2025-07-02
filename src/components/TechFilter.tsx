'use client';

import { useState } from 'react';

interface TechFilterProps {
  selectedSourceTypes: string[];
  onSourceTypesChange: (types: string[]) => void;
  selectedTechTags: string[];
  onTechTagsChange: (tags: string[]) => void;
  sortBy: 'latest' | 'popular' | 'trending';
  onSortChange: (sort: 'latest' | 'popular' | 'trending') => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

// 热门技术标签
const POPULAR_TECH_TAGS = [
  { name: 'JavaScript', icon: '🟨', color: 'bg-yellow-100 text-yellow-800' },
  { name: 'Python', icon: '🐍', color: 'bg-blue-100 text-blue-800' },
  { name: 'React', icon: '⚛️', color: 'bg-cyan-100 text-cyan-800' },
  { name: 'TypeScript', icon: '🔷', color: 'bg-blue-100 text-blue-800' },
  { name: 'Node.js', icon: '🟢', color: 'bg-green-100 text-green-800' },
  { name: 'Vue.js', icon: '💚', color: 'bg-green-100 text-green-800' },
  { name: 'Go', icon: '🐹', color: 'bg-cyan-100 text-cyan-800' },
  { name: 'Rust', icon: '🦀', color: 'bg-orange-100 text-orange-800' },
  { name: 'Docker', icon: '🐳', color: 'bg-blue-100 text-blue-800' },
  { name: 'Kubernetes', icon: '☸️', color: 'bg-blue-100 text-blue-800' },
  { name: 'AI/ML', icon: '🤖', color: 'bg-purple-100 text-purple-800' },
  { name: 'Web3', icon: '🌐', color: 'bg-indigo-100 text-indigo-800' },
];

// 数据源选项
const SOURCE_TYPE_OPTIONS = [
  { 
    value: 'github', 
    label: 'GitHub项目', 
    icon: '📦', 
    description: '开源项目和代码仓库',
    color: 'bg-gray-100 text-gray-800'
  },
  { 
    value: 'stackoverflow', 
    label: 'StackOverflow', 
    icon: '❓', 
    description: '技术问答和解决方案',
    color: 'bg-orange-100 text-orange-800'
  },
];

// 排序选项
const SORT_OPTIONS = [
  { value: 'latest', label: '最新发布', icon: '🕒' },
  { value: 'popular', label: '最受欢迎', icon: '🔥' },
  { value: 'trending', label: '趋势热门', icon: '📈' },
];

export default function TechFilter({
  selectedSourceTypes,
  onSourceTypesChange,
  selectedTechTags,
  onTechTagsChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: TechFilterProps) {
  const [showAllTags, setShowAllTags] = useState(false);

  // 处理数据源类型选择
  const handleSourceTypeToggle = (type: string) => {
    if (selectedSourceTypes.includes(type)) {
      onSourceTypesChange(selectedSourceTypes.filter(t => t !== type));
    } else {
      onSourceTypesChange([...selectedSourceTypes, type]);
    }
  };

  // 处理技术标签选择
  const handleTechTagToggle = (tag: string) => {
    if (selectedTechTags.includes(tag)) {
      onTechTagsChange(selectedTechTags.filter(t => t !== tag));
    } else {
      onTechTagsChange([...selectedTechTags, tag]);
    }
  };

  // 清除所有筛选
  const clearAllFilters = () => {
    onSourceTypesChange(['github', 'stackoverflow']);
    onTechTagsChange([]);
    onSortChange('latest');
  };

  const displayedTags = showAllTags ? POPULAR_TECH_TAGS : POPULAR_TECH_TAGS.slice(0, 8);

  return (
    <div className="space-y-4">
      {/* 第一行：数据源和排序 - 移动端优化 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* 数据源选择 */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">数据源:</span>
          <div className="flex flex-wrap gap-2">
            {SOURCE_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSourceTypeToggle(option.value)}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedSourceTypes.includes(option.value)
                    ? 'bg-blue-600 text-white'
                    : `${option.color} hover:bg-blue-100 hover:text-blue-800`
                }`}
                title={option.description}
              >
                <span className="mr-1">{option.icon}</span>
                <span className="hidden sm:inline">{option.label}</span>
                <span className="sm:hidden">{option.icon}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 排序选择 */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">排序:</span>
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onSortChange(option.value as any)}
                className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  sortBy === option.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="mr-1">{option.icon}</span>
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 视图模式切换 - 桌面端显示 */}
        <div className="hidden sm:flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">视图:</span>
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="网格视图"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="列表视图"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>


      </div>

      {/* 第二行：技术标签 - 暂时隐藏，因为真实数据中标签不完整 */}
      {false && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">技术标签:</span>
            <div className="flex items-center space-x-2">
              {selectedTechTags.length > 0 && (
                <button
                  onClick={() => onTechTagsChange([])}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  清除标签
                </button>
              )}
              <button
                onClick={() => setShowAllTags(!showAllTags)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {showAllTags ? '收起' : '显示全部'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {displayedTags.map((tag) => (
              <button
                key={tag.name}
                onClick={() => handleTechTagToggle(tag.name)}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedTechTags.includes(tag.name)
                    ? 'bg-blue-600 text-white'
                    : `${tag.color} hover:bg-blue-100 hover:text-blue-800`
                }`}
              >
                <span className="mr-1">{tag.icon}</span>
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 活跃筛选条件和清除按钮 */}
      {(selectedTechTags.length > 0 || selectedSourceTypes.length !== 2) && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">活跃筛选:</span>
            <div className="flex flex-wrap gap-1">
              {selectedSourceTypes.map((type) => {
                const option = SOURCE_TYPE_OPTIONS.find(o => o.value === type);
                return option ? (
                  <span key={type} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                    {option.icon} {option.label}
                  </span>
                ) : null;
              })}
              {selectedTechTags.map((tag) => {
                const tagInfo = POPULAR_TECH_TAGS.find(t => t.name === tag);
                return (
                  <span key={tag} className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
                    {tagInfo?.icon} {tag}
                  </span>
                );
              })}
            </div>
          </div>
          <button
            onClick={clearAllFilters}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            清除全部筛选
          </button>
        </div>
      )}
    </div>
  );
}
