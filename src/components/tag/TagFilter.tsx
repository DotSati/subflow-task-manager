
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Check } from 'lucide-react';
import { Tag } from '@/types/tag';
import { TagBadge } from './TagBadge';

interface TagFilterProps {
  tags: Tag[];
  selectedTagIds: string[];
  onFilterChange: (tagIds: string[]) => void;
}

export const TagFilter = ({ tags, selectedTagIds, onFilterChange }: TagFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id));

  const handleTagToggle = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onFilterChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onFilterChange([...selectedTagIds, tagId]);
    }
  };

  const clearFilters = () => {
    onFilterChange([]);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filter by Tags
          {selectedTagIds.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedTagIds.length}
            </Badge>
          )}
        </Button>

        {selectedTagIds.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedTags.map((tag) => (
            <TagBadge
              key={tag.id}
              tag={tag}
              removable
              clickable={false}
              onRemove={() => handleTagToggle(tag.id)}
            />
          ))}
        </div>
      )}

      {/* Tag Filter Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg p-3 min-w-64">
          {tags.length > 0 ? (
            <div className="space-y-1 max-h-60 overflow-auto">
              <p className="text-sm font-medium mb-2 text-foreground">Select tags to filter:</p>
              {tags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <div
                    key={tag.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    <Check
                      className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'opacity-100 text-primary' : 'opacity-0'}`}
                    />
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-sm truncate">{tag.name}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tags available</p>
          )}
        </div>
      )}
    </div>
  );
};

