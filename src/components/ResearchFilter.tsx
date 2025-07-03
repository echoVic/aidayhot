'use client';

import { useState } from 'react';

interface ResearchFilterProps {
  selectedSourceTypes: string[];
  onSourceTypesChange: (types: string[]) => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  sortBy: 'latest' | 'popular' | 'trending';
  onSortChange: (sort: 'latest' | 'popular' | 'trending') => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export default function ResearchFilter({
  selectedSourceTypes,
  onSourceTypesChange,
  selectedCategories,
  onCategoriesChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange
}: ResearchFilterProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // 源类型选项
  const sourceTypeOptions = [
    { value: 'arxiv', label: 'arXiv 预印本', icon: '📄', description: '最新的预印本论文' },
    { value: 'paper', label: '正式论文', icon: '📚', description: '已发表的学术论文' }
  ];

  // 学科分类选项
  const categoryOptions = [
    { value: 'cs.AI', label: '人工智能', icon: '🤖' },
    { value: 'cs.LG', label: '机器学习', icon: '🧠' },
    { value: 'cs.CV', label: '计算机视觉', icon: '👁️' },
    { value: 'cs.CL', label: '自然语言处理', icon: '💬' },
    { value: 'cs.RO', label: '机器人学', icon: '🤖' },
    { value: 'stat.ML', label: '统计学习', icon: '📊' },
    { value: 'math.OC', label: '优化控制', icon: '⚙️' },
    { value: 'physics', label: '物理学', icon: '⚛️' },
    { value: 'biology', label: '生物学', icon: '🧬' },
    { value: 'chemistry', label: '化学', icon: '🧪' }
  ];

  // 排序选项
  const sortOptions = [
    { value: 'latest', label: '最新发布', icon: '🕒' },
    { value: 'popular', label: '最受欢迎', icon: '🔥' },
    { value: 'trending', label: '趋势热门', icon: '📈' }
  ];

  // 处理源类型变化
  const handleSourceTypeChange = (type: string) => {
    if (selectedSourceTypes.includes(type)) {
      onSourceTypesChange(selectedSourceTypes.filter(t => t !== type));
    } else {
      onSourceTypesChange([...selectedSourceTypes, type]);
    }
  };

  // 处理分类变化
  const handleCategoryChange = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  // 清除所有筛选
  const clearAllFilters = () => {
    onSourceTypesChange(['arxiv', 'paper']);
    onCategoriesChange([]);
    onSortChange('latest');
  };

  return (
    <div className="space-y-4">
      {/* 主要筛选器 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
        {/* 源类型筛选 */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 flex items-center">
            数据源:
          </span>
          {sourceTypeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handleSourceTypeChange(option.value)}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedSourceTypes.includes(option.value)
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>

        {/* 排序和视图控制 */}
        <div className="flex items-center space-x-4">
          {/* 排序选择 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">排序:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 视图模式切换 */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded text-sm transition-colors ${
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
              className={`p-1.5 rounded text-sm transition-colors ${
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

          {/* 高级筛选切换 */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            高级筛选
            <svg className={`w-4 h-4 ml-1 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 高级筛选器 */}
      {showAdvancedFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          {/* 学科分类筛选 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">学科分类:</span>
              {selectedCategories.length > 0 && (
                <button
                  onClick={() => onCategoriesChange([])}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  清除分类筛选
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleCategoryChange(option.value)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategories.includes(option.value)
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-1">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 筛选状态和操作 */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {selectedSourceTypes.length > 0 || selectedCategories.length > 0 ? (
                <span>
                  已选择: {selectedSourceTypes.length} 个数据源, {selectedCategories.length} 个分类
                </span>
              ) : (
                <span>未设置筛选条件</span>
              )}
            </div>
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              清除所有筛选
            </button>
          </div>
        </div>
      )}

      {/* 活跃筛选条件显示 */}
      {(selectedSourceTypes.length < 2 || selectedCategories.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {selectedSourceTypes.length < 2 && selectedSourceTypes.map(type => {
            const option = sourceTypeOptions.find(opt => opt.value === type);
            return option ? (
              <span
                key={type}
                className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
              >
                {option.icon} {option.label}
                <button
                  onClick={() => handleSourceTypeChange(type)}
                  className="ml-1 text-blue-500 hover:text-blue-700"
                >
                  ×
                </button>
              </span>
            ) : null;
          })}
          {selectedCategories.map(category => {
            const option = categoryOptions.find(opt => opt.value === category);
            return option ? (
              <span
                key={category}
                className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md"
              >
                {option.icon} {option.label}
                <button
                  onClick={() => handleCategoryChange(category)}
                  className="ml-1 text-green-500 hover:text-green-700"
                >
                  ×
                </button>
              </span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
