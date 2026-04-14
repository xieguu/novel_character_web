import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: number;
  name: string;
  description?: string;
  category: string;
  identity?: string;
  personality?: string;
  appearance?: string;
  motivation?: string;
}

interface CharacterTemplateSelectorProps {
  templates: Template[];
  isLoading?: boolean;
  onSelectTemplate: (templateId: number, characterName: string) => Promise<void>;
}

const CATEGORY_LABELS: Record<string, string> = {
  protagonist: "主角",
  antagonist: "反派",
  supporting: "配角",
  mentor: "导师",
  love_interest: "爱情线",
  comic_relief: "搞笑角色",
  villain: "恶棍",
  hero: "英雄",
  anti_hero: "反英雄",
  sidekick: "搭档",
};

export function CharacterTemplateSelector({
  templates,
  isLoading = false,
  onSelectTemplate,
}: CharacterTemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [characterName, setCharacterName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTemplates =
    selectedCategory === "all"
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  const handleSelectTemplate = async () => {
    if (!selectedTemplate) {
      toast.error("请选择模板");
      return;
    }

    if (!characterName.trim()) {
      toast.error("请输入人物名称");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSelectTemplate(selectedTemplate.id, characterName);
      setOpen(false);
      setSelectedTemplate(null);
      setCharacterName("");
      setSelectedCategory("all");
    } catch (error) {
      toast.error("创建人物失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ["all", ...Object.keys(CATEGORY_LABELS)];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Sparkles className="w-4 h-4" />
          从模板创建
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>从模板创建人物</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">选择分类</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部模板</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="col-span-2 flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                没有可用的模板
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? "ring-2 ring-primary border-primary"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {CATEGORY_LABELS[template.category] || template.category}
                      </Badge>
                    </div>
                    {template.description && (
                      <CardDescription className="text-xs">
                        {template.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {template.identity && (
                      <div className="text-xs">
                        <span className="font-medium">身份：</span>
                        <span className="text-muted-foreground">{template.identity}</span>
                      </div>
                    )}
                    {template.personality && (
                      <div className="text-xs">
                        <span className="font-medium">性格：</span>
                        <span className="text-muted-foreground truncate">
                          {template.personality}
                        </span>
                      </div>
                    )}
                    {template.motivation && (
                      <div className="text-xs">
                        <span className="font-medium">动机：</span>
                        <span className="text-muted-foreground truncate">
                          {template.motivation}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Character Name Input */}
          {selectedTemplate && (
            <div className="space-y-2 pt-2 border-t">
              <label className="text-sm font-medium">人物名称</label>
              <Input
                placeholder="输入新人物的名称..."
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              onClick={handleSelectTemplate}
              disabled={!selectedTemplate || !characterName.trim() || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  创建人物
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
