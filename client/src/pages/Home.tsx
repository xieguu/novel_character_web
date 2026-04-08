import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { BookOpen, Plus } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", content: "" });

  const { data: novels, isLoading } = trpc.novels.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createNovelMutation = trpc.novels.create.useMutation({
    onSuccess: (data) => {
      setFormData({ title: "", description: "", content: "" });
      setIsCreating(false);
      // Navigate to the novel detail page
      if (data && typeof data === "object" && "insertId" in data) {
        setLocation(`/novel/${(data as any).insertId}`);
      }
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-6">
          <BookOpen className="w-16 h-16 mx-auto text-indigo-600" />
          <h1 className="text-4xl font-bold text-gray-900">小说人物提取与管理系统</h1>
          <p className="text-xl text-gray-600 max-w-md">
            使用 AI 智能提取小说中的人物信息，轻松管理和可视化人物关系
          </p>
          <Button size="lg" className="mt-8" onClick={() => window.location.href = getLoginUrl()}>
            登录开始使用
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">我的小说项目</h1>
            <p className="text-gray-600 mt-2">欢迎回来，{user?.name}</p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                新建项目
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>创建新项目</DialogTitle>
                <DialogDescription>输入小说信息以创建新项目</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">项目名称</label>
                  <Input
                    placeholder="输入项目名称"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">描述</label>
                  <Input
                    placeholder="输入项目描述（可选）"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">小说内容</label>
                  <Textarea
                    placeholder="粘贴小说文本或输入内容"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                  />
                </div>
                <Button
                  onClick={() =>
                    createNovelMutation.mutate({
                      title: formData.title,
                      description: formData.description || undefined,
                      content: formData.content,
                    })
                  }
                  disabled={!formData.title || !formData.content || createNovelMutation.isPending}
                  className="w-full"
                >
                  {createNovelMutation.isPending ? "创建中..." : "创建项目"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">加载项目中...</div>
        ) : novels && novels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {novels.map((novel) => (
              <Card
                key={novel.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setLocation(`/novel/${novel.id}`)}
              >
                <CardHeader>
                  <CardTitle className="line-clamp-2">{novel.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{novel.description || "暂无描述"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    创建于 {new Date(novel.createdAt).toLocaleDateString("zh-CN")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">还没有任何项目</p>
              <Button onClick={() => setIsCreating(true)}>创建第一个项目</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
