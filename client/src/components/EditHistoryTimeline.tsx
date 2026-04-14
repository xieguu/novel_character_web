import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Plus, Edit2, Trash2 } from "lucide-react";

interface EditHistoryEntry {
  id: number;
  novelId: number;
  userId: number;
  entityType: "character" | "relationship";
  entityId: number;
  action: "create" | "update" | "delete";
  changes?: Record<string, any>;
  createdAt: Date | string;
}

interface EditHistoryTimelineProps {
  history: EditHistoryEntry[];
  isLoading?: boolean;
}

const ACTION_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  create: {
    label: "创建",
    icon: Plus,
    color: "bg-green-100 text-green-800",
  },
  update: {
    label: "修改",
    icon: Edit2,
    color: "bg-blue-100 text-blue-800",
  },
  delete: {
    label: "删除",
    icon: Trash2,
    color: "bg-red-100 text-red-800",
  },
};

const ENTITY_LABELS: Record<string, string> = {
  character: "人物",
  relationship: "关系",
};

export function EditHistoryTimeline({
  history,
  isLoading = false,
}: EditHistoryTimelineProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            编辑历史
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">加载中...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            编辑历史
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">暂无编辑历史</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          编辑历史
        </CardTitle>
        <CardDescription>
          共 {history.length} 条编辑记录
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {history.map((entry, index) => {
              const actionInfo = ACTION_LABELS[entry.action];
              const ActionIcon = actionInfo.icon;
              const timestamp = new Date(entry.createdAt);

              return (
                <div key={entry.id} className="flex gap-4">
                  {/* Timeline dot and line */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${actionInfo.color}`}
                    >
                      <ActionIcon className="w-4 h-4" />
                    </div>
                    {index < history.length - 1 && (
                      <div className="w-0.5 h-12 bg-border mt-2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={actionInfo.color}>
                        {actionInfo.label}
                      </Badge>
                      <Badge variant="secondary">
                        {ENTITY_LABELS[entry.entityType]}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {format(timestamp, "PPp", { locale: zhCN })}
                      </span>
                    </div>

                    {/* Changes details */}
                    {entry.changes && Object.keys(entry.changes).length > 0 && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs space-y-1">
                        {Object.entries(entry.changes).map(([key, value]) => (
                          <div key={key} className="text-muted-foreground">
                            <span className="font-medium">{key}:</span>{" "}
                            {typeof value === "object"
                              ? JSON.stringify(value)
                              : String(value).substring(0, 50)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
