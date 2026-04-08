import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Download, Edit2, Loader2, Trash2, Wand2, Network } from "lucide-react";
import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import MultiFileUploader from "@/components/MultiFileUploader";

export default function NovelDetail() {
  const { novelId } = useParams<{ novelId: string }>();
  const [, setLocation] = useLocation();
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractText, setExtractText] = useState("");
  const [editingCharacterId, setEditingCharacterId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    identity: "",
    personality: "",
    appearance: "",
    motivation: "",
    relationships: "",
  });

  const novelIdNum = novelId ? parseInt(novelId) : 0;

  const { data: novel, isLoading: novelLoading } = trpc.novels.get.useQuery(
    { novelId: novelIdNum },
    { enabled: !!novelIdNum }
  );

  const { data: characters, isLoading: charactersLoading, refetch: refetchCharacters } = trpc.characters.listByNovel.useQuery(
    { novelId: novelIdNum },
    { enabled: !!novelIdNum }
  );

  const extractMutation = trpc.extraction.extractCharacters.useMutation({
    onSuccess: () => {
      toast.success("人物提取成功！");
      setExtractText("");
      setIsExtracting(false);
      refetchCharacters();
    },
    onError: (error) => {
      toast.error(error.message || "提取失败，请重试");
    },
  });

  const updateCharacterMutation = trpc.characters.update.useMutation({
    onSuccess: () => {
      toast.success("人物信息已更新");
      setEditingCharacterId(null);
      refetchCharacters();
    },
  });

  const deleteCharacterMutation = trpc.characters.delete.useMutation({
    onSuccess: () => {
      toast.success("人物已删除");
      refetchCharacters();
    },
  });

  const handleExtract = async () => {
    if (!extractText.trim()) {
      toast.error("请输入小说内容");
      return;
    }
    extractMutation.mutate({
      novelId: novelIdNum,
      text: extractText,
    });
  };

  const handleEditCharacter = (character: any) => {
    setEditingCharacterId(character.id);
    setEditFormData({
      name: character.name,
      identity: character.identity || "",
      personality: character.personality || "",
      appearance: character.appearance || "",
      motivation: character.motivation || "",
      relationships: character.relationships || "",
    });
  };

  const handleSaveCharacter = () => {
    if (!editingCharacterId) return;
    updateCharacterMutation.mutate({
      characterId: editingCharacterId,
      ...editFormData,
    });
  };

  const handleDeleteCharacter = (characterId: number) => {
    if (confirm("确定要删除这个人物吗？")) {
      deleteCharacterMutation.mutate({ characterId });
    }
  };

  const handleViewRelationships = () => {
    setLocation(`/novel/${novelId}/relationships`);
  };

  const handleExportMarkdown = (character: any) => {
    const markdown = `# 人物档案：${character.name}

## 基本信息
- **姓名**：${character.name}
- **身份/职业**：${character.identity || "不详"}

## 角色画像
- **性格特征**：${character.personality || "不详"}
- **外貌描写**：${character.appearance || "不详"}

## 剧情关联
- **核心动机/目标**：${character.motivation || "不详"}
- **人际关系**：${character.relationships || "不详"}

---
*由小说人物提取与管理系统自动生成*`;

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/markdown;charset=utf-8," + encodeURIComponent(markdown));
    element.setAttribute("download", `${character.name}.md`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (novelLoading) {
    return <div className="container mx-auto py-8">加载中...</div>;
  }

  if (!novel) {
    return <div className="container mx-auto py-8">小说不存在</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Button variant="outline" onClick={() => setLocation("/")} className="mb-4">
          ← 返回
        </Button>
        <h1 className="text-3xl font-bold mb-2">{novel.title}</h1>
        <p className="text-gray-600">{novel.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                AI 人物提取
              </CardTitle>
              <CardDescription>输入小说文本，AI 将自动识别并提取其中的人物信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="粘贴小说文本或输入内容..."
                value={extractText}
                onChange={(e) => setExtractText(e.target.value)}
                rows={8}
              />
              <Button
                onClick={handleExtract}
                disabled={extractMutation.isPending || !extractText.trim()}
                className="w-full"
              >
                {extractMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    提取中...
                  </>
                ) : (
                  "开始提取"
                )}
              </Button>
            </CardContent>
          </Card>

          <MultiFileUploader novelId={novelIdNum} onUploadSuccess={() => refetchCharacters()} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>项目信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-gray-600">创建时间</p>
                <p className="font-medium">{new Date(novel.createdAt).toLocaleDateString("zh-CN")}</p>
              </div>
              <div>
                <p className="text-gray-600">人物总数</p>
                <p className="font-medium text-lg">{characters?.length || 0}</p>
              </div>
              <Button
                onClick={handleViewRelationships}
                disabled={!characters || characters.length === 0}
                className="w-full mt-4"
                variant="outline"
              >
                <Network className="w-4 h-4 mr-2" />
                查看关系网络
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">人物档案</h2>
        {charactersLoading ? (
          <div className="text-center py-12">加载人物中...</div>
        ) : characters && characters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {characters.map((character) => (
              <Card key={character.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{character.name}</CardTitle>
                  <CardDescription>{character.identity || "身份未知"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {character.personality && (
                    <div>
                      <p className="font-medium text-gray-700">性格特征</p>
                      <p className="text-gray-600 line-clamp-2">{character.personality}</p>
                    </div>
                  )}
                  {character.appearance && (
                    <div>
                      <p className="font-medium text-gray-700">外貌描写</p>
                      <p className="text-gray-600 line-clamp-2">{character.appearance}</p>
                    </div>
                  )}
                  {character.motivation && (
                    <div>
                      <p className="font-medium text-gray-700">核心动机</p>
                      <p className="text-gray-600 line-clamp-2">{character.motivation}</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditCharacter(character)}
                      className="flex-1"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExportMarkdown(character)}
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteCharacter(character.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">还没有提取任何人物</p>
              <p className="text-sm text-gray-500 mt-2">输入小说文本并点击"开始提取"来识别人物</p>
            </CardContent>
          </Card>
        )}
      </div>

      {editingCharacterId && (
        <Dialog open={!!editingCharacterId} onOpenChange={() => setEditingCharacterId(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>编辑人物信息</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">姓名</label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">身份</label>
                <Input
                  value={editFormData.identity}
                  onChange={(e) => setEditFormData({ ...editFormData, identity: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">性格特征</label>
                <Textarea
                  value={editFormData.personality}
                  onChange={(e) => setEditFormData({ ...editFormData, personality: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">外貌描写</label>
                <Textarea
                  value={editFormData.appearance}
                  onChange={(e) => setEditFormData({ ...editFormData, appearance: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">核心动机</label>
                <Textarea
                  value={editFormData.motivation}
                  onChange={(e) => setEditFormData({ ...editFormData, motivation: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">人际关系</label>
                <Textarea
                  value={editFormData.relationships}
                  onChange={(e) => setEditFormData({ ...editFormData, relationships: e.target.value })}
                  rows={3}
                />
              </div>
              <Button
                onClick={handleSaveCharacter}
                disabled={updateCharacterMutation.isPending}
                className="w-full"
              >
                {updateCharacterMutation.isPending ? "保存中..." : "保存"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
