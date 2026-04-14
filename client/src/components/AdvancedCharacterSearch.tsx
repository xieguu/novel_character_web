import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X, ChevronDown, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface SearchFilters {
  name?: string;
  identity?: string;
  personality?: string;
  appearance?: string;
  motivation?: string;
  sortBy?: "name" | "created" | "updated";
  sortOrder?: "asc" | "desc";
}

interface AdvancedCharacterSearchProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading?: boolean;
}

const SORT_OPTIONS = [
  { value: "name", label: "名称" },
  { value: "created", label: "创建时间" },
  { value: "updated", label: "更新时间" },
];

export function AdvancedCharacterSearch({
  onSearch,
  isLoading = false,
}: AdvancedCharacterSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: "name",
    sortOrder: "asc",
  });
  const [savedSearches, setSavedSearches] = useState<
    Array<{ name: string; filters: SearchFilters }>
  >([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState("");

  const handleFilterChange = useCallback(
    (key: keyof SearchFilters, value: string) => {
      const newFilters = { ...filters, [key]: value || undefined };
      setFilters(newFilters);
    },
    [filters]
  );

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters({
      sortBy: "name",
      sortOrder: "asc",
    });
  };

  const handleSaveSearch = () => {
    if (!searchName.trim()) {
      toast.error("请输入搜索名称");
      return;
    }

    setSavedSearches([
      ...savedSearches,
      { name: searchName, filters: { ...filters } },
    ]);
    setSearchName("");
    setShowSaveDialog(false);
    toast.success("搜索条件已保存");
  };

  const handleLoadSearch = (savedFilters: SearchFilters) => {
    setFilters(savedFilters);
    onSearch(savedFilters);
  };

  const handleDeleteSearch = (index: number) => {
    setSavedSearches(savedSearches.filter((_, i) => i !== index));
    toast.success("已删除保存的搜索");
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v && v !== "name" && v !== "asc"
  ).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">人物名称</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索人物名称..."
                  value={filters.name || ""}
                  onChange={(e) => handleFilterChange("name", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Advanced Filters */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <ChevronDown className="w-4 h-4" />
                  高级过滤
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary">{activeFilterCount}</Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 space-y-4">
                {/* Identity Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">身份</label>
                  <Input
                    placeholder="如：英雄、反派..."
                    value={filters.identity || ""}
                    onChange={(e) => handleFilterChange("identity", e.target.value)}
                  />
                </div>

                {/* Personality Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">性格特征</label>
                  <Input
                    placeholder="如：勇敢、聪慧..."
                    value={filters.personality || ""}
                    onChange={(e) =>
                      handleFilterChange("personality", e.target.value)
                    }
                  />
                </div>

                {/* Appearance Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">外观描述</label>
                  <Input
                    placeholder="如：高个子、蓝眼睛..."
                    value={filters.appearance || ""}
                    onChange={(e) => handleFilterChange("appearance", e.target.value)}
                  />
                </div>

                {/* Motivation Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">动机</label>
                  <Input
                    placeholder="如：寻求复仇、保护家人..."
                    value={filters.motivation || ""}
                    onChange={(e) => handleFilterChange("motivation", e.target.value)}
                  />
                </div>
              </PopoverContent>
            </Popover>

            {/* Sort Options */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">排序方式</label>
                <Select
                  value={filters.sortBy || "name"}
                  onValueChange={(value) =>
                    handleFilterChange("sortBy", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">排序顺序</label>
                <Select
                  value={filters.sortOrder || "asc"}
                  onValueChange={(value) =>
                    handleFilterChange("sortOrder", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">升序</SelectItem>
                    <SelectItem value="desc">降序</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className="flex-1"
              >
                <Search className="w-4 h-4 mr-2" />
                搜索
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
              >
                <X className="w-4 h-4" />
              </Button>
              <Popover open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Save className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">保存搜索条件</label>
                    <Input
                      placeholder="输入搜索名称..."
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                    />
                    <Button
                      onClick={handleSaveSearch}
                      className="w-full"
                      size="sm"
                    >
                      保存
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">已保存的搜索</h3>
              <div className="flex flex-wrap gap-2">
                {savedSearches.map((saved, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full"
                  >
                    <button
                      onClick={() => handleLoadSearch(saved.filters)}
                      className="text-xs hover:underline cursor-pointer"
                    >
                      {saved.name}
                    </button>
                    <button
                      onClick={() => handleDeleteSearch(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
