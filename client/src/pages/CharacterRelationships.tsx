import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CharacterRelationshipGraph from "@/components/CharacterRelationshipGraph";
import { useState } from "react";
import { ArrowLeft, User, Network } from "lucide-react";

export default function CharacterRelationships() {
  const { novelId } = useParams<{ novelId: string }>();
  const [, setLocation] = useLocation();
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);

  const { data: novel, isLoading: novelLoading } = trpc.novels.getById.useQuery(
    { id: parseInt(novelId || "0") },
    { enabled: !!novelId }
  );

  const { data: characters = [] } = trpc.characters.list.useQuery(
    { novelId: parseInt(novelId || "0") },
    { enabled: !!novelId }
  );

  const { data: relationships = [] } = trpc.characters.getRelationships.useQuery(
    { novelId: parseInt(novelId || "0") },
    { enabled: !!novelId }
  );

  if (novelLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/50">
        <div className="container flex items-center h-14">
          <Button variant="ghost" size="sm" onClick={() => setLocation(`/novel/${novelId}`)} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            返回项目
          </Button>
          <div className="h-5 w-px bg-border mx-3" />
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground text-sm">人物关系网络</span>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">人物关系网络</h1>
          <p className="text-muted-foreground mt-1">{novel?.title} - 共 {characters.length} 个人物</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Graph */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-4">
                {characters.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Network className="w-12 h-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">还没有人物信息，请先提取人物</p>
                  </div>
                ) : (
                  <CharacterRelationshipGraph
                    characters={characters}
                    relationships={relationships}
                    onCharacterClick={setSelectedCharacter}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detail Panel */}
          <div>
            <Card className="sticky top-20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {selectedCharacter ? "人物详情" : "选择人物"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedCharacter ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {selectedCharacter.avatarUrl ? (
                        <img
                          src={selectedCharacter.avatarUrl}
                          alt={selectedCharacter.name}
                          className="w-12 h-12 rounded-xl object-cover border border-border"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-foreground">{selectedCharacter.name}</h3>
                        <p className="text-xs text-muted-foreground">{selectedCharacter.identity || "身份未知"}</p>
                      </div>
                    </div>

                    {selectedCharacter.personality && (
                      <div>
                        <h4 className="text-xs font-medium text-foreground mb-1">性格</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{selectedCharacter.personality}</p>
                      </div>
                    )}

                    {selectedCharacter.appearance && (
                      <div>
                        <h4 className="text-xs font-medium text-foreground mb-1">外貌</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{selectedCharacter.appearance}</p>
                      </div>
                    )}

                    {selectedCharacter.motivation && (
                      <div>
                        <h4 className="text-xs font-medium text-foreground mb-1">动机</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{selectedCharacter.motivation}</p>
                      </div>
                    )}

                    {/* Relationships */}
                    <div>
                      <h4 className="text-xs font-medium text-foreground mb-2">相关关系</h4>
                      <div className="space-y-2">
                        {relationships
                          .filter(rel => rel.characterId1 === selectedCharacter.id || rel.characterId2 === selectedCharacter.id)
                          .map((rel) => {
                            const otherCharId = rel.characterId1 === selectedCharacter.id ? rel.characterId2 : rel.characterId1;
                            const otherChar = characters.find(c => c.id === otherCharId);
                            return (
                              <div key={rel.id} className="p-2.5 bg-secondary/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-foreground">{otherChar?.name}</span>
                                  <Badge variant="secondary" className="text-[10px] h-5">{rel.relationshipType}</Badge>
                                </div>
                                {rel.description && (
                                  <p className="text-[11px] text-muted-foreground mt-1">{rel.description}</p>
                                )}
                              </div>
                            );
                          })}
                        {relationships.filter(rel => rel.characterId1 === selectedCharacter.id || rel.characterId2 === selectedCharacter.id).length === 0 && (
                          <p className="text-xs text-muted-foreground">暂无关系数据</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <User className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">点击关系图中的节点查看人物详情</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
