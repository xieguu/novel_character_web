import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { BookOpen, Plus, Users, Network, Sparkles, LogOut, FileText, ChevronRight, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Home() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", content: "" });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const { data: novels, isLoading } = trpc.novels.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createNovelMutation = trpc.novels.create.useMutation({
    onSuccess: (data) => {
      setFormData({ title: "", description: "", content: "" });
      setUploadedFiles([]);
      setIsCreating(false);
      utils.novels.list.invalidate();
      toast.success("项目创建成功！");
      if (data && typeof data === "object" && "insertId" in data) {
        setLocation(`/novel/${(data as any).insertId}`);
      }
    },
    onError: (error) => {
      toast.error(error.message || "创建失败，请重试");
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.name.endsWith(".txt")) {
      toast.error("仅支持 .txt 格式文件");
      return;
    }

    try {
      const text = await file.text();
      setFormData(prev => ({ ...prev, content: text }));
      setUploadedFiles([file]);
      toast.success(`已加载文件: ${file.name}`);
    } catch {
      toast.error("文件读取失败");
    }
  };

  const handleCreate = () => {
    if (!formData.title.trim()) {
      toast.error("请输入项目名称");
      return;
    }
    if (!formData.content.trim()) {
      toast.error("请输入小说内容或上传文件");
      return;
    }
    createNovelMutation.mutate({
      title: formData.title,
      description: formData.description || undefined,
      content: formData.content,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录 - 展示 Landing Page
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
          <div className="container relative py-20 lg:py-32">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
                <Sparkles className="w-4 h-4" />
                AI 驱动的智能人物分析
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                小说人物提取
                <br />
                <span className="text-primary">与管理系统</span>
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                上传小说文本，AI 自动识别所有角色，生成详细的人物档案。
                支持关系网络可视化和 AI 头像生成，让角色管理变得简单高效。
              </p>
              <Button
                size="lg"
                className="h-12 px-8 text-base font-medium shadow-lg shadow-primary/25"
                onClick={() => window.location.href = getLoginUrl()}
              >
                登录开始使用
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-card border border-border/50 shadow-sm">
              <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-card-foreground">智能人物提取</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                AI 自动识别小说中的所有角色，提取姓名、身份、性格、外貌、动机和人际关系等关键信息
              </p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-card border border-border/50 shadow-sm">
              <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-primary/10 flex items-center justify-center">
                <Network className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-card-foreground">关系网络图</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                自动生成交互式人物关系网络图，直观展示角色之间的复杂关系，支持点击查看详情
              </p>
            </div>
            <div className="text-center p-8 rounded-2xl bg-card border border-border/50 shadow-sm">
              <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-card-foreground">AI 头像生成</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                基于人物外貌描述，自动生成独特的 AI 头像图片，丰富人物档案的视觉呈现
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 已登录 - 展示项目管理界面
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary" />
            <span className="font-semibold text-foreground">小说人物管理</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.name || "用户"}
            </span>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">我的小说项目</h1>
            <p className="text-muted-foreground mt-1">管理你的小说人物提取项目</p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-sm">
                <Plus className="w-4 h-4" />
                新建项目
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>创建新项目</DialogTitle>
                <DialogDescription>输入小说信息或上传 .txt 文件来创建新项目</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-foreground">项目名称 *</label>
                  <Input
                    placeholder="例如：三体、红楼梦..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-foreground">描述</label>
                  <Input
                    placeholder="简要描述这个项目（可选）"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-foreground">小说内容 *</label>
                  <div className="space-y-2">
                    <Textarea
                      placeholder="粘贴小说文本内容..."
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={6}
                      className="resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        上传 .txt 文件
                      </Button>
                      {uploadedFiles.length > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {uploadedFiles[0].name}
                        </span>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={!formData.title.trim() || !formData.content.trim() || createNovelMutation.isPending}
                  className="w-full"
                >
                  {createNovelMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      创建中...
                    </>
                  ) : (
                    "创建项目"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground text-sm">加载项目中...</p>
            </div>
          </div>
        ) : novels && novels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {novels.map((novel) => (
              <Card
                key={novel.id}
                className="group cursor-pointer hover:shadow-md hover:border-primary/20 transition-all duration-200"
                onClick={() => setLocation(`/novel/${novel.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">
                        {novel.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 mt-1.5">
                        {novel.description || "暂无描述"}
                      </CardDescription>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {(novel.content?.length || 0).toLocaleString()} 字
                    </span>
                    <span>
                      {new Date(novel.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">还没有任何项目</h3>
            <p className="text-muted-foreground text-sm mb-6">创建你的第一个小说项目，开始提取人物信息</p>
            <Button onClick={() => setIsCreating(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              创建第一个项目
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
