import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface RandomCharacterGeneratorProps {
  novelId: number;
  onCharacterGenerated?: () => void;
}

export function RandomCharacterGenerator({ novelId, onCharacterGenerated }: RandomCharacterGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [gender, setGender] = useState<string>("");
  const [occupationType, setOccupationType] = useState<string>("");
  const [count, setCount] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMutation = trpc.randomCharacter.generate.useMutation();
  const generateMultipleMutation = trpc.randomCharacter.generateMultiple.useMutation();

  const occupations = [
    "医生", "律师", "教师", "工程师", "商人", "艺术家",
    "作家", "演员", "音乐家", "摄影师", "设计师", "程序员",
    "农民", "工人", "警察", "士兵", "记者", "导演",
  ];

  const handleGenerateSingle = async () => {
    setIsGenerating(true);
    try {
      await generateMutation.mutateAsync({
        novelId,
        gender: gender || undefined,
        occupationType: occupationType || undefined,
      });
      toast.success("✨ 人物已生成！");
      setOpen(false);
      onCharacterGenerated?.();
    } catch (error) {
      toast.error("生成失败，请重试");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateMultiple = async () => {
    if (count < 1 || count > 10) {
      toast.error("请输入 1-10 之间的数字");
      return;
    }
    setIsGenerating(true);
    try {
      await generateMultipleMutation.mutateAsync({
        novelId,
        count,
      });
      toast.success(`✨ 已生成 ${count} 个人物！`);
      setOpen(false);
      onCharacterGenerated?.();
    } catch (error) {
      toast.error("生成失败，请重试");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-purple-200 text-purple-600 hover:bg-purple-50"
        >
          <Sparkles className="h-4 w-4" />
          随机生成人物
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            随机生成人物模板
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 单个生成选项 */}
          <div className="space-y-4 rounded-lg border border-purple-100 bg-purple-50 p-4">
            <h3 className="font-semibold text-purple-900">生成单个人物</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">性别（可选）</label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue placeholder="随机选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">随机选择</SelectItem>
                  <SelectItem value="男">男</SelectItem>
                  <SelectItem value="女">女</SelectItem>
                  <SelectItem value="非二元">非二元</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">职业（可选）</label>
              <Select value={occupationType} onValueChange={setOccupationType}>
                <SelectTrigger>
                  <SelectValue placeholder="随机选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">随机选择</SelectItem>
                  {occupations.map((occ) => (
                    <SelectItem key={occ} value={occ}>
                      {occ}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleGenerateSingle}
              disabled={isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  生成单个人物
                </>
              )}
            </Button>
          </div>

          {/* 批量生成选项 */}
          <div className="space-y-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h3 className="font-semibold text-blue-900">批量生成人物</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                生成数量: <span className="font-bold text-blue-600">{count}</span>
              </label>
              <Slider
                value={[count]}
                onValueChange={(value) => setCount(value[0])}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1</span>
                <span>10</span>
              </div>
            </div>

            <Button
              onClick={handleGenerateMultiple}
              disabled={isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  批量生成 {count} 个人物
                </>
              )}
            </Button>
          </div>

          {/* 提示信息 */}
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            💡 <strong>提示：</strong> 系统会根据设定的参数使用 AI 生成创意人物档案，包括姓名、外貌、性格、背景故事等。
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
