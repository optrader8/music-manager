import React, { useState } from 'react';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { debounce } from '../lib/utils';
import { COMMON_GENRES, SUPPORTED_AUDIO_FORMATS } from '../constants';
import type { SearchFilters as SearchFiltersType } from '../types/api';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
  showAdvanced?: boolean;
}

export function SearchFilters({
  filters,
  onFiltersChange,
  showAdvanced = false,
}: SearchFiltersProps) {
  const [localQuery, setLocalQuery] = useState(filters.query || '');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(showAdvanced);

  // Debounced search query update
  React.useEffect(() => {
    const debouncedSearch = debounce((query: unknown) => {
      if (typeof query === 'string') {
        onFiltersChange({ ...filters, query: query || undefined });
      }
    }, 500);

    debouncedSearch(localQuery);

    return () => {
      debouncedSearch.cancel();
    };
  }, [localQuery, onFiltersChange, filters]);

  const handleGenreToggle = (genre: string) => {
    const currentGenres = filters.genres || [];
    const newGenres = currentGenres.includes(genre)
      ? currentGenres.filter((g) => g !== genre)
      : [...currentGenres, genre];

    onFiltersChange({
      ...filters,
      genres: newGenres.length > 0 ? newGenres : undefined,
    });
  };

  const handleYearRangeChange = (type: 'min' | 'max', value: string) => {
    const year = parseInt(value) || undefined;
    const newYears = filters.years || [];

    if (type === 'min') {
      onFiltersChange({
        ...filters,
        years: year ? [year, newYears[1] || new Date().getFullYear()] : undefined,
      });
    } else {
      onFiltersChange({
        ...filters,
        years: year ? [newYears[0] || 1900, year] : undefined,
      });
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardContent className="p-4 space-y-4">
        {/* Main search */}
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search music library..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            className="flex-1"
          />
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showAdvancedFilters ? 'Hide' : 'Show'} Filters
          </button>
        </div>

        {/* Advanced filters */}
        {showAdvancedFilters && (
          <div className="space-y-4 border-t pt-4">
            {/* Genres */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Genres
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_GENRES.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => handleGenreToggle(genre)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      filters.genres?.includes(genre)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Year range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  From Year
                </label>
                <Input
                  type="number"
                  placeholder="1900"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={filters.years?.[0] || ''}
                  onChange={(e) => handleYearRangeChange('min', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  To Year
                </label>
                <Input
                  type="number"
                  placeholder={new Date().getFullYear().toString()}
                  min="1900"
                  max={new Date().getFullYear()}
                  value={filters.years?.[1] || ''}
                  onChange={(e) => handleYearRangeChange('max', e.target.value)}
                />
              </div>
            </div>

            {/* Audio formats */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Audio Formats
              </label>
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_AUDIO_FORMATS.map((format) => (
                  <button
                    key={format}
                    onClick={() => {
                      const currentFormats = filters.formats || [];
                      const newFormats = currentFormats.includes(format)
                        ? currentFormats.filter((f) => f !== format)
                        : [...currentFormats, format];

                      onFiltersChange({
                        ...filters,
                        formats: newFormats.length > 0 ? newFormats : undefined,
                      });
                    }}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      filters.formats?.includes(format)
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear filters */}
            <div className="flex justify-end">
              <button
                onClick={() => onFiltersChange({})}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
