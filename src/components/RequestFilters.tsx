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
        <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg className="w-3 h-3 text-cyan-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-3 h-3 text-cyan-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-gray-200">Filters & Sorting</h3>
          <div className="text-xs text-gray-500 font-mono">
            {filteredCount} / {totalCount}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
          >
            {showAdvanced ? 'Hide Advanced' : 'Advanced'}
          </button>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-red-400 hover:text-red-300 font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Sort Controls */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Sort by:</label>
        <div className="flex flex-wrap gap-2">
          {[
            { field: 'timestamp' as SortField, label: 'Time' },
            { field: 'duration' as SortField, label: 'Duration' },
            { field: 'totalTokens' as SortField, label: 'Tokens' },
            { field: 'inputTokens' as SortField, label: 'Input' },
            { field: 'outputTokens' as SortField, label: 'Output' },
            { field: 'model' as SortField, label: 'Model' }
          ].map(({ field, label }) => (
            <button
              key={field}
              onClick={() => handleSortClick(field)}
              className={`inline-flex items-center gap-2 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                sortField === field
                  ? 'text-cyan-950 bg-cyan-400 hover:bg-cyan-300'
                  : 'text-gray-400 bg-gray-800 hover:bg-gray-700 border border-gray-700'
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
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Models</label>
          <div className="space-y-1.5">
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
                  className="rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900"
                />
                <span className="ml-2 text-xs text-gray-300">
                  {model.replace('claude-3-5-', '').replace('claude-3-', '').replace('-20241022', '').replace('-20240229', '').replace('-20240307', '')}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Status</label>
          <div className="space-y-1.5">
            <label className="flex items-center">
              <input
                type="radio"
                name="errorFilter"
                checked={filters.hasErrors === null || filters.hasErrors === undefined}
                onChange={() => updateFilters({ hasErrors: null })}
                className="border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900"
              />
              <span className="ml-2 text-xs text-gray-300">All</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="errorFilter"
                checked={filters.hasErrors === false}
                onChange={() => updateFilters({ hasErrors: false })}
                className="border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900"
              />
              <span className="ml-2 text-xs text-gray-300">Success only</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="errorFilter"
                checked={filters.hasErrors === true}
                onChange={() => updateFilters({ hasErrors: true })}
                className="border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900"
              />
              <span className="ml-2 text-xs text-gray-300">Errors only</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Request Type</label>
          <div className="space-y-1.5">
            <label className="flex items-center">
              <input
                type="radio"
                name="streamingFilter"
                checked={filters.isStreaming === null || filters.isStreaming === undefined}
                onChange={() => updateFilters({ isStreaming: null })}
                className="border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900"
              />
              <span className="ml-2 text-xs text-gray-300">All</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="streamingFilter"
                checked={filters.isStreaming === true}
                onChange={() => updateFilters({ isStreaming: true })}
                className="border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900"
              />
              <span className="ml-2 text-xs text-gray-300">Streaming only</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="streamingFilter"
                checked={filters.isStreaming === false}
                onChange={() => updateFilters({ isStreaming: false })}
                className="border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900"
              />
              <span className="ml-2 text-xs text-gray-300">Non-streaming only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Tools Filters */}
      {availableToolsAvailable.length > 0 && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Tools Available</label>
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
                  className="rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900"
                />
                <span className="ml-2 text-xs text-gray-500 px-2 py-0.5 bg-gray-800 border border-gray-700 rounded font-mono">
                  {tool}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {availableToolsUsed.length > 0 && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Tools Actually Used</label>
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
                  className="rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900"
                />
                <span className="ml-2 text-xs text-amber-400 px-2 py-0.5 bg-amber-950/30 border border-amber-700/50 rounded font-mono">
                  {tool}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-800">
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Duration Range (ms)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minDuration || ''}
                onChange={(e) => updateFilters({ minDuration: e.target.value ? parseInt(e.target.value) : null })}
                className="w-24 rounded border-gray-700 bg-gray-800 text-gray-300 text-xs placeholder-gray-600 focus:border-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-gray-500 text-xs">to</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxDuration || ''}
                onChange={(e) => updateFilters({ maxDuration: e.target.value ? parseInt(e.target.value) : null })}
                className="w-24 rounded border-gray-700 bg-gray-800 text-gray-300 text-xs placeholder-gray-600 focus:border-cyan-500 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Token Range</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minTokens || ''}
                onChange={(e) => updateFilters({ minTokens: e.target.value ? parseInt(e.target.value) : null })}
                className="w-24 rounded border-gray-700 bg-gray-800 text-gray-300 text-xs placeholder-gray-600 focus:border-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-gray-500 text-xs">to</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxTokens || ''}
                onChange={(e) => updateFilters({ maxTokens: e.target.value ? parseInt(e.target.value) : null })}
                className="w-24 rounded border-gray-700 bg-gray-800 text-gray-300 text-xs placeholder-gray-600 focus:border-cyan-500 focus:ring-cyan-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}