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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RelationshipEditDialogProps {
  novelId: number;
  character1Id: number;
  character1Name: string;
  character2Id: number;
  character2Name: string;
  onAdd: (data: { novelId: number; characterId1: number; characterId2: number; relationshipType: string; description?: string }) => Promise<void>;
  isLoading?: boolean;
}

const RELATIONSHIP_TYPES = [
  "亲属",
  "朋友",
  "敌人",
  "同事",
  "导师",
  "学生",
  "情人",
  "对手",
  "盟友",
  "其他",
];

export function RelationshipEditDialog({
  novelId,
  character1Id,
  character1Name,
  character2Id,
  character2Name,
  onAdd,
  isLoading = false,
}: RelationshipEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [relationshipType, setRelationshipType] = useState("朋友");
  const [description, setDescription] = useState("");

  const handleAdd = async () => {
    if (!relationshipType.trim()) {
      toast.error("请选择关系类型");
      return;
    }

    try {
      await onAdd({
        novelId,
        characterId1: character1Id,
        characterId2: character2Id,
        relationshipType,
        description: description.trim() || undefined,
      });
      setRelationshipType("朋友");
      setDescription("");
      setOpen(false);
    } catch (error) {
      toast.error("添加关系失败");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 w-full">
          <Plus className="w-3.5 h-3.5" />
          添加关系
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加人物关系</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{character1Name}</span>
              {" "}与{" "}
              <span className="font-medium text-foreground">{character2Name}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship-type" className="text-sm font-medium">
              关系类型
            </Label>
            <Select value={relationshipType} onValueChange={setRelationshipType}>
              <SelectTrigger id="relationship-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              关系描述（可选）
            </Label>
            <Textarea
              id="description"
              placeholder="描述两个人物之间的关系细节..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-24 resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button onClick={handleAdd} disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  添加中...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  添加关系
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
