'use client';

import { useMemoizedFn } from 'ahooks';

interface CommunityFilterProps {
  selectedContentType: string;
  sortBy: 'latest' | 'popular' | 'trending';
  viewMode: 'grid' | 'list';
  onFilterChange: (filters: {
    contentType?: string;
    sortBy?: 'latest' | 'popular' | 'trending';
    viewMode?: 'grid' | 'list';
  }) => void;
}

export default function CommunityFilter({
  selectedContentType,
  sortBy,
  viewMode,
  onFilterChange
}: CommunityFilterProps) {

  const handleContentTypeChange = useMemoizedFn((contentType: string) => {
    onFilterChange({ contentType });
  });

  const handleSortChange = useMemoizedFn((newSortBy: 'latest' | 'popular' | 'trending') => {
    onFilterChange({ sortBy: newSortBy });
  });

  const handleViewModeChange = useMemoizedFn((newViewMode: 'grid' | 'list') => {
    onFilterChange({ viewMode: newViewMode });
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
      {/* 左侧：内容类型筛选 */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-700 flex items-center">
          内容类型:
        </span>
        
        {/* 全部 */}
        <button
          onClick={() => handleContentTypeChange('全部')}
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            selectedContentType === '全部'
              ? 'bg-blue-100 text-blue-800 border-blue-200'
              : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
          }`}
        >
          <span className="mr-1">📋</span>
          全部内容
        </button>

        {/* 社交媒体 */}
        <button
          onClick={() => handleContentTypeChange('社交媒体')}
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            selectedContentType === '社交媒体'
              ? 'bg-blue-100 text-blue-800 border-blue-200'
              : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
          }`}
        >
          <span className="mr-1">💬</span>
          社交媒体
        </button>

        {/* 播客 */}
        <button
          onClick={() => handleContentTypeChange('播客')}
          className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            selectedContentType === '播客'
              ? 'bg-blue-100 text-blue-800 border-blue-200'
              : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
          }`}
        >
          <span className="mr-1">🎙️</span>
          播客节目
        </button>
      </div>

      {/* 右侧：排序和视图控制 */}
      <div className="flex items-center space-x-4">
        {/* 排序选择 */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">排序:</span>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as 'latest' | 'popular' | 'trending')}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="latest">🕒 最新发布</option>
            <option value="popular">🔥 最受欢迎</option>
            <option value="trending">📈 趋势热门</option>
          </select>
        </div>

        {/* 视图模式切换 */}
        <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
          <button
            onClick={() => handleViewModeChange('grid')}
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
            onClick={() => handleViewModeChange('list')}
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
      </div>
    </div>
  );
}
