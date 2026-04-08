import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CharacterRelationshipGraph from "@/components/CharacterRelationshipGraph";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => setLocation(`/novel/${novelId}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回项目
        </Button>

        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">人物关系网络</h1>
          <p className="text-gray-600 mt-2">{novel?.title} - 人物关系可视化</p>
        </div>

        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 关系图 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>人物关系图</CardTitle>
              </CardHeader>
              <CardContent>
                {characters.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    还没有人物信息，请先提取人物
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

          {/* 人物详情 */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedCharacter ? "人物详情" : "选择人物"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedCharacter ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {selectedCharacter.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedCharacter.identity}
                      </p>
                    </div>

                    {selectedCharacter.appearance && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1">外貌</h4>
                        <p className="text-sm text-gray-700">
                          {selectedCharacter.appearance}
                        </p>
                      </div>
                    )}

                    {selectedCharacter.personality && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1">性格</h4>
                        <p className="text-sm text-gray-700">
                          {selectedCharacter.personality}
                        </p>
                      </div>
                    )}

                    {selectedCharacter.motivation && (
                      <div>
                        <h4 className="font-semibold text-sm mb-1">动机</h4>
                        <p className="text-sm text-gray-700">
                          {selectedCharacter.motivation}
                        </p>
                      </div>
                    )}

                    {/* 相关关系 */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2">相关关系</h4>
                      <div className="space-y-2">
                        {relationships
                          .filter(
                            (rel) =>
                              rel.characterId1 === selectedCharacter.id ||
                              rel.characterId2 === selectedCharacter.id
                          )
                          .map((rel) => {
                            const otherCharId =
                              rel.characterId1 === selectedCharacter.id
                                ? rel.characterId2
                                : rel.characterId1;
                            const otherChar = characters.find(
                              (c) => c.id === otherCharId
                            );
                            return (
                              <div
                                key={rel.id}
                                className="text-sm bg-gray-100 p-2 rounded"
                              >
                                <p className="font-medium">
                                  {otherChar?.name} - {rel.relationshipType}
                                </p>
                                {rel.description && (
                                  <p className="text-gray-600 text-xs mt-1">
                                    {rel.description}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    点击关系图中的节点查看人物详情
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
