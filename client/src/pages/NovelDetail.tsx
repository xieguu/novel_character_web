import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft, Download, Edit2, Loader2, Trash2, Wand2, Network,
  Upload, FileText, Sparkles, User, Users, BookOpen, ImageIcon, LogOut
} from "lucide-react";
import { useParams, useLocation } from "wouter";
import { useState, useRef } from "react";
import { toast } from "sonner";

export default function NovelDetail() {
  const { novelId } = useParams<{ novelId: string }>();
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [extractText, setExtractText] = useState("");
  const [editingCharacter, setEditingCharacter] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    name: "", identity: "", personality: "", appearance: "", motivation: "", relationships: "",
  });
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    onSuccess: (result) => {
      toast.success(`成功提取 ${result.characterCount} 个人物！`);
      setExtractText("");
      refetchCharacters();
    },
    onError: (error) => {
      toast.error(error.message || "提取失败，请重试");
    },
  });

  const updateCharacterMutation = trpc.characters.update.useMutation({
    onSuccess: () => {
      toast.success("人物信息已更新");
      setEditingCharacter(null);
      refetchCharacters();
    },
  });

  const deleteCharacterMutation = trpc.characters.delete.useMutation({
    onSuccess: () => {
      toast.success("人物已删除");
      refetchCharacters();
    },
  });

  const generateAvatarMutation = trpc.characters.generateAvatar.useMutation({
    onSuccess: () => {
      toast.success("头像生成成功！");
      refetchCharacters();
    },
    onError: () => {
      toast.error("头像生成失败，请重试");
    },
  });

  const uploadMultipleMutation = trpc.files.uploadMultiple.useMutation();

  const handleExtract = () => {
    if (!extractText.trim()) {
      toast.error("请输入小说内容");
      return;
    }
    extractMutation.mutate({ novelId: novelIdNum, text: extractText });
  };

  const handleFileUpload = async () => {
    if (uploadFiles.length === 0) return;
    setIsUploading(true);
    setUploadProgress(10);

    try {
      // 读取所有文件内容
      const fileContents = await Promise.all(
        uploadFiles.map(async (file) => ({
          name: file.name,
          content: await file.text(),
        }))
      );
      setUploadProgress(30);

      // 上传文件到 S3
      await uploadMultipleMutation.mutateAsync({
        novelId: novelIdNum,
        files: fileContents,
      });
      setUploadProgress(50);

      // 合并所有文件内容并提取人物
      const combinedText = fileContents.map(f => f.content).join("\n\n---\n\n");
      setUploadProgress(60);

      await extractMutation.mutateAsync({
        novelId: novelIdNum,
        text: combinedText,
      });
      setUploadProgress(100);

      toast.success(`已上传 ${uploadFiles.length} 个文件并完成人物提取！`);
      setUploadFiles([]);
    } catch (error) {
      toast.error("处理失败，请重试");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const txtFiles = Array.from(files).filter(f => f.name.endsWith(".txt"));
    if (txtFiles.length === 0) {
      toast.error("仅支持 .txt 格式文件");
      return;
    }
    setUploadFiles(prev => [...prev, ...txtFiles]);
    toast.success(`已选择 ${txtFiles.length} 个文件`);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEditCharacter = (character: any) => {
    setEditingCharacter(character);
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
    if (!editingCharacter) return;
    updateCharacterMutation.mutate({
      characterId: editingCharacter.id,
      ...editFormData,
    });
  };

  const handleDeleteCharacter = (characterId: number) => {
    if (confirm("确定要删除这个人物吗？")) {
      deleteCharacterMutation.mutate({ characterId });
    }
  };

  const handleGenerateAvatar = (character: any) => {
    if (!character.appearance) {
      toast.error("该人物没有外貌描述，无法生成头像");
      return;
    }
    generateAvatarMutation.mutate({
      characterId: character.id,
      name: character.name,
      appearance: character.appearance,
      personality: character.personality || undefined,
    });
  };

  const handleExportMarkdown = (character: any) => {
    const markdown = `# ${character.name}

## 基本信息
| 属性 | 描述 |
|------|------|
| **姓名** | ${character.name} |
| **身份/职业** | ${character.identity || "不详"} |

## 性格特征
${character.personality || "暂无描述"}

## 外貌描写
${character.appearance || "暂无描述"}

## 核心动机
${character.motivation || "暂无描述"}

## 人际关系
${character.relationships || "暂无描述"}

---
*由小说人物提取与管理系统自动生成*
`;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${character.name}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    if (!characters || characters.length === 0) return;
    const allMarkdown = characters.map(c => {
      return `# ${c.name}\n\n- **身份**: ${c.identity || "不详"}\n- **性格**: ${c.personality || "不详"}\n- **外貌**: ${c.appearance || "不详"}\n- **动机**: ${c.motivation || "不详"}\n- **关系**: ${c.relationships || "不详"}\n`;
    }).join("\n---\n\n");

    const blob = new Blob([allMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${novel?.title || "人物档案"}_全部人物.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  if (!novel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">项目不存在</p>
        <Button variant="outline" onClick={() => setLocation("/")}>返回首页</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">返回</span>
            </Button>
            <div className="h-5 w-px bg-border" />
            <span className="font-medium text-foreground text-sm truncate max-w-[200px]">{novel.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        {/* Project Info Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Badge variant="secondary" className="gap-1">
            <FileText className="w-3 h-3" />
            {(novel.content?.length || 0).toLocaleString()} 字
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Users className="w-3 h-3" />
            {characters?.length || 0} 个人物
          </Badge>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setLocation(`/novel/${novelId}/relationships`)}
            disabled={!characters || characters.length === 0}
          >
            <Network className="w-3.5 h-3.5" />
            关系网络图
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleExportAll}
            disabled={!characters || characters.length === 0}
          >
            <Download className="w-3.5 h-3.5" />
            导出全部
          </Button>
        </div>

        {/* Extraction Area */}
        <Tabs defaultValue="text" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="text" className="gap-1.5">
              <Wand2 className="w-3.5 h-3.5" />
              文本提取
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              文件上传
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">AI 人物提取</CardTitle>
                <CardDescription>粘贴小说文本，AI 将自动识别并提取其中的人物信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="粘贴小说文本内容..."
                  value={extractText}
                  onChange={(e) => setExtractText(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {extractText.length > 0 ? `${extractText.length.toLocaleString()} 字` : ""}
                  </span>
                  <Button
                    onClick={handleExtract}
                    disabled={extractMutation.isPending || !extractText.trim()}
                    className="gap-1.5"
                  >
                    {extractMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        提取中...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        开始提取
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">批量文件上传</CardTitle>
                <CardDescription>上传 .txt 文件，系统将自动提取所有文件中的人物信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-foreground font-medium mb-1">点击选择文件</p>
                  <p className="text-xs text-muted-foreground">支持 .txt 格式，可选择多个文件</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {uploadFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm flex-1 truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
                        <button
                          onClick={() => setUploadFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>处理中...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-1.5" />
                  </div>
                )}

                {uploadFiles.length > 0 && (
                  <Button
                    onClick={handleFileUpload}
                    disabled={isUploading}
                    className="w-full gap-1.5"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        处理中...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        上传并提取人物 ({uploadFiles.length} 个文件)
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Characters Section */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-foreground">人物档案</h2>
            {characters && characters.length > 0 && (
              <span className="text-sm text-muted-foreground">{characters.length} 个人物</span>
            )}
          </div>

          {charactersLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : characters && characters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {characters.map((character) => (
                <Card key={character.id} className="group hover:shadow-md transition-all duration-200 overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {character.avatarUrl ? (
                          <img
                            src={character.avatarUrl}
                            alt={character.name}
                            className="w-14 h-14 rounded-xl object-cover border border-border"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center border border-border/50">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateAvatar(character);
                          }}
                          disabled={generateAvatarMutation.isPending}
                          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                          title="生成 AI 头像"
                        >
                          {generateAvatarMutation.isPending && generateAvatarMutation.variables?.characterId === character.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ImageIcon className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base line-clamp-1">{character.name}</CardTitle>
                        <CardDescription className="line-clamp-1 mt-0.5">
                          {character.identity || "身份未知"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2.5 text-sm pt-0">
                    {character.personality && (
                      <div>
                        <p className="font-medium text-foreground text-xs mb-0.5">性格特征</p>
                        <p className="text-muted-foreground text-xs line-clamp-2">{character.personality}</p>
                      </div>
                    )}
                    {character.appearance && (
                      <div>
                        <p className="font-medium text-foreground text-xs mb-0.5">外貌描写</p>
                        <p className="text-muted-foreground text-xs line-clamp-2">{character.appearance}</p>
                      </div>
                    )}
                    {character.motivation && (
                      <div>
                        <p className="font-medium text-foreground text-xs mb-0.5">核心动机</p>
                        <p className="text-muted-foreground text-xs line-clamp-2">{character.motivation}</p>
                      </div>
                    )}
                    <div className="flex gap-1.5 pt-2 border-t border-border/50">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditCharacter(character)}
                        className="flex-1 h-8 text-xs gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        编辑
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportMarkdown(character)}
                        className="h-8 w-8 p-0"
                        title="导出 Markdown"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCharacter(character.id)}
                        className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                        title="删除"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <BookOpen className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground mb-1">还没有提取任何人物</h3>
                <p className="text-sm text-muted-foreground">在上方输入小说文本或上传文件，点击"开始提取"来识别人物</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editingCharacter} onOpenChange={() => setEditingCharacter(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑人物信息</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium mb-1.5">姓名</label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">身份/职业</label>
              <Input
                value={editFormData.identity}
                onChange={(e) => setEditFormData({ ...editFormData, identity: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">性格特征</label>
              <Textarea
                value={editFormData.personality}
                onChange={(e) => setEditFormData({ ...editFormData, personality: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">外貌描写</label>
              <Textarea
                value={editFormData.appearance}
                onChange={(e) => setEditFormData({ ...editFormData, appearance: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">核心动机</label>
              <Textarea
                value={editFormData.motivation}
                onChange={(e) => setEditFormData({ ...editFormData, motivation: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">人际关系</label>
              <Textarea
                value={editFormData.relationships}
                onChange={(e) => setEditFormData({ ...editFormData, relationships: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>
            <Button
              onClick={handleSaveCharacter}
              disabled={updateCharacterMutation.isPending}
              className="w-full"
            >
              {updateCharacterMutation.isPending ? "保存中..." : "保存修改"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
