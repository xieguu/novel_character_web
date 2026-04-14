import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Download, Trash2, ImageIcon, Loader2, Sparkles, FileText } from "lucide-react";
import type { Character } from "@shared/types";

interface CharacterCardProps {
  character: Character;
  onEdit: (character: Character) => void;
  onDelete: (characterId: number) => void;
  onExport: (character: Character) => void;
  onExportPDF?: (character: Character) => void;
  onGenerateAvatar: (character: Character) => void;
  isGeneratingAvatar?: boolean;
}

export default function CharacterCard({
  character,
  onEdit,
  onDelete,
  onExport,
  onExportPDF,
  onGenerateAvatar,
  isGeneratingAvatar = false,
}: CharacterCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-l-4 border-l-primary/50 hover:border-l-primary">
      {/* Header with Avatar */}
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-start gap-4">
          {/* Avatar Section */}
          <div className="relative flex-shrink-0">
            {character.avatarUrl ? (
              <img
                src={character.avatarUrl}
                alt={character.name}
                className="w-16 h-16 rounded-xl object-cover border-2 border-primary/20 shadow-md group-hover:shadow-lg transition-shadow"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
                <Sparkles className="w-8 h-8 text-primary/60" />
              </div>
            )}
            {/* Generate Avatar Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGenerateAvatar(character);
              }}
              disabled={isGeneratingAvatar}
              className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/80 border-2 border-background shadow-md flex items-center justify-center hover:shadow-lg transition-all hover:scale-110 disabled:opacity-50"
              title="生成 AI 头像"
            >
              {isGeneratingAvatar ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <ImageIcon className="w-3.5 h-3.5 text-white" />
              )}
            </button>
          </div>

          {/* Character Info */}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {character.name}
            </CardTitle>
            <CardDescription className="line-clamp-1 mt-1">
              {character.identity || "身份未知"}
            </CardDescription>
            {character.personality && (
              <div className="mt-2 flex flex-wrap gap-1">
                {character.personality.split("、").slice(0, 2).map((trait, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {trait.trim()}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="space-y-3 pt-3">
        {/* Character Details */}
        <div className="space-y-2.5">
          {character.appearance && (
            <div className="bg-muted/50 rounded-lg p-2.5">
              <p className="font-semibold text-xs text-foreground mb-1">外貌</p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {character.appearance}
              </p>
            </div>
          )}
          {character.motivation && (
            <div className="bg-muted/50 rounded-lg p-2.5">
              <p className="font-semibold text-xs text-foreground mb-1">动机</p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {character.motivation}
              </p>
            </div>
          )}
          {character.relationships && (
            <div className="bg-muted/50 rounded-lg p-2.5">
              <p className="font-semibold text-xs text-foreground mb-1">关系</p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {character.relationships}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-border/50">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(character)}
            className="flex-1 h-8 text-xs gap-1 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
          >
            <Edit2 className="w-3 h-3" />
            编辑
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onExport(character)}
            className="h-8 w-8 p-0 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all"
            title="导出 Markdown"
          >
            <Download className="w-3 h-3" />
          </Button>
          {onExportPDF && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onExportPDF(character)}
              className="h-8 w-8 p-0 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all"
              title="导出 PDF"
            >
              <FileText className="w-3 h-3" />
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(character.id)}
            className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all"
            title="删除"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
