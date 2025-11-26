import { useState } from 'react';
import type { RequestFilters as Filters, SortField, SortDirection } from '../services/requestAnalyzer';

interface RequestFiltersProps {
  availableModels: string[];
  availableToolsAvailable: string[];
  availableToolsUsed: string[];
  filters: Partial<Filters>;
  sortField: SortField;
  sortDirection: SortDirection;
  onFiltersChange: (filters: Partial<Filters>) => void;
  onSortChange: (field: SortField, direction: SortDirection) => void;
  onClearFilters: () => void;
  totalCount: number;
  filteredCount: number;
}

export function RequestFilters({
  availableModels,
  availableToolsAvailable,
  availableToolsUsed,
  filters,
  sortField,
  sortDirection,
  onFiltersChange,
  onSortChange,
  onClearFilters,
  totalCount,
  filteredCount
}: RequestFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilters = (updates: Partial<Filters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const handleSortClick = (field: SortField) => {
    if (sortField === field) {
      onSortChange(field, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(field, 'desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    );
  };

  const hasActiveFilters = Object.values(filters).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (value === null || value === undefined) return false;
    if (typeof value === 'object' && 'start' in value) {
      return value.start !== null || value.end !== null;
    }
    return true;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium text-gray-900">Filters & Sorting</h3>
          <div className="text-sm text-gray-500">
            Showing {filteredCount} of {totalCount} requests
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-900 font-medium"
          >
            {showAdvanced ? 'Hide Advanced' : 'Advanced Filters'}
          </button>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-red-600 hover:text-red-900 font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Sort Controls */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Sort by:</label>
        <div className="flex flex-wrap gap-2">
          {[
            { field: 'timestamp' as SortField, label: 'Time' },
            { field: 'duration' as SortField, label: 'Duration' },
            { field: 'totalTokens' as SortField, label: 'Total Tokens' },
            { field: 'inputTokens' as SortField, label: 'Input Tokens' },
            { field: 'outputTokens' as SortField, label: 'Output Tokens' },
            { field: 'model' as SortField, label: 'Model' }
          ].map(({ field, label }) => (
            <button
              key={field}
              onClick={() => handleSortClick(field)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                sortField === field
                  ? 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {label}
              {getSortIcon(field)}
            </button>
          ))}
        </div>
      </div>

      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Models</label>
          <div className="space-y-2">
            {availableModels.map(model => (
              <label key={model} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.models?.includes(model) || false}
                  onChange={(e) => {
                    const models = filters.models || [];
                    if (e.target.checked) {
                      updateFilters({ models: [...models, model] });
                    } else {
                      updateFilters({ models: models.filter(m => m !== model) });
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {model.replace('claude-3-5-', '').replace('claude-3-', '').replace('-20241022', '').replace('-20240229', '').replace('-20240307', '')}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="errorFilter"
                checked={filters.hasErrors === null || filters.hasErrors === undefined}
                onChange={() => updateFilters({ hasErrors: null })}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">All</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="errorFilter"
                checked={filters.hasErrors === false}
                onChange={() => updateFilters({ hasErrors: false })}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Success only</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="errorFilter"
                checked={filters.hasErrors === true}
                onChange={() => updateFilters({ hasErrors: true })}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Errors only</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Request Type</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="streamingFilter"
                checked={filters.isStreaming === null || filters.isStreaming === undefined}
                onChange={() => updateFilters({ isStreaming: null })}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">All</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="streamingFilter"
                checked={filters.isStreaming === true}
                onChange={() => updateFilters({ isStreaming: true })}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Streaming only</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="streamingFilter"
                checked={filters.isStreaming === false}
                onChange={() => updateFilters({ isStreaming: false })}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Non-streaming only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Tools Filters */}
      {availableToolsAvailable.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tools Available (offered to agent)</label>
          <div className="flex flex-wrap gap-2">
            {availableToolsAvailable.map(tool => (
              <label key={tool} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.toolsAvailable?.includes(tool) || false}
                  onChange={(e) => {
                    const tools = filters.toolsAvailable || [];
                    if (e.target.checked) {
                      updateFilters({ toolsAvailable: [...tools, tool] });
                    } else {
                      updateFilters({ toolsAvailable: tools.filter(t => t !== tool) });
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                  {tool}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {availableToolsUsed.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tools Actually Used (invoked by agent)</label>
          <div className="flex flex-wrap gap-2">
            {availableToolsUsed.map(tool => (
              <label key={tool} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.toolsUsed?.includes(tool) || false}
                  onChange={(e) => {
                    const tools = filters.toolsUsed || [];
                    if (e.target.checked) {
                      updateFilters({ toolsUsed: [...tools, tool] });
                    } else {
                      updateFilters({ toolsUsed: tools.filter(t => t !== tool) });
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 px-2 py-1 bg-amber-100 text-amber-700 rounded-md">
                  {tool}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration Range (ms)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minDuration || ''}
                onChange={(e) => updateFilters({ minDuration: e.target.value ? parseInt(e.target.value) : null })}
                className="w-24 rounded-md border-gray-300 text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxDuration || ''}
                onChange={(e) => updateFilters({ maxDuration: e.target.value ? parseInt(e.target.value) : null })}
                className="w-24 rounded-md border-gray-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Token Range</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minTokens || ''}
                onChange={(e) => updateFilters({ minTokens: e.target.value ? parseInt(e.target.value) : null })}
                className="w-24 rounded-md border-gray-300 text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxTokens || ''}
                onChange={(e) => updateFilters({ maxTokens: e.target.value ? parseInt(e.target.value) : null })}
                className="w-24 rounded-md border-gray-300 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}