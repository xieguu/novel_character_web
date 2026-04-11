import React, { useState, useMemo } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Character {
  id: number;
  name: string;
  identity: string;
  personality: string;
  appearance: string;
  motivation: string;
  avatarUrl?: string;
}

interface CharacterSearchProps {
  characters: Character[];
  onFilterChange: (filtered: Character[]) => void;
}

export default function CharacterSearch({
  characters,
  onFilterChange,
}: CharacterSearchProps) {
  const [searchText, setSearchText] = useState('');
  const [filterIdentity, setFilterIdentity] = useState('');
  const [filterPersonality, setFilterPersonality] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // 提取所有唯一的身份和性格标签
  const identities = useMemo(
    () => Array.from(new Set(characters.map((c) => c.identity).filter(Boolean))),
    [characters]
  );

  const personalities = useMemo(() => {
    const allPersonalities = new Set<string>();
    characters.forEach((c) => {
      if (c.personality) {
        c.personality.split(/[,，、]/).forEach((p) => {
          const trimmed = p.trim();
          if (trimmed) allPersonalities.add(trimmed);
        });
      }
    });
    return Array.from(allPersonalities);
  }, [characters]);

  // 执行搜索和筛选
  const filteredCharacters = useMemo(() => {
    return characters.filter((character) => {
      // 文本搜索
      const searchLower = searchText.toLowerCase();
      const matchesSearch =
        character.name.toLowerCase().includes(searchLower) ||
        character.identity.toLowerCase().includes(searchLower) ||
        character.personality.toLowerCase().includes(searchLower) ||
        character.appearance.toLowerCase().includes(searchLower) ||
        character.motivation.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // 身份筛选
      if (filterIdentity && character.identity !== filterIdentity) {
        return false;
      }

      // 性格筛选
      if (
        filterPersonality &&
        !character.personality.includes(filterPersonality)
      ) {
        return false;
      }

      return true;
    });
  }, [characters, searchText, filterIdentity, filterPersonality]);

  // 当筛选条件改变时，通知父组件
  React.useEffect(() => {
    onFilterChange(filteredCharacters);
  }, [filteredCharacters, onFilterChange]);

  const handleClearFilters = () => {
    setSearchText('');
    setFilterIdentity('');
    setFilterPersonality('');
  };

  const hasActiveFilters =
    searchText || filterIdentity || filterPersonality;

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="搜索人物名字、身份、性格..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          title="显示高级筛选"
        >
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* 高级筛选面板 */}
      {showFilters && (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-800 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 身份筛选 */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                按身份筛选
              </label>
              <Select value={filterIdentity} onValueChange={setFilterIdentity}>
                <SelectTrigger>
                  <SelectValue placeholder="选择身份..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部身份</SelectItem>
                  {identities.filter(Boolean).map((identity) => (
                    <SelectItem key={identity} value={identity}>
                      {identity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 性格筛选 */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                按性格筛选
              </label>
              <Select
                value={filterPersonality}
                onValueChange={setFilterPersonality}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择性格..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部性格</SelectItem>
                  {personalities.filter(Boolean).map((personality) => (
                    <SelectItem key={personality} value={personality}>
                      {personality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 清除筛选按钮 */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              清除所有筛选
            </Button>
          )}
        </div>
      )}

      {/* 筛选结果统计 */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          显示 <Badge variant="secondary">{filteredCharacters.length}</Badge> /
          <Badge variant="secondary">{characters.length}</Badge> 个人物
        </span>
        {hasActiveFilters && (
          <span className="text-blue-600 dark:text-blue-400">
            已应用筛选条件
          </span>
        )}
      </div>
    </div>
  );
}
