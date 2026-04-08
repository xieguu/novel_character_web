import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface MultiFileUploaderProps {
  novelId: number;
  onUploadSuccess?: () => void;
}

interface FileItem {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export default function MultiFileUploader({
  novelId,
  onUploadSuccess,
}: MultiFileUploaderProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.files.uploadMultiple.useMutation({
    onSuccess: () => {
      setFiles([]);
      onUploadSuccess?.();
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.currentTarget.files;
    if (!selectedFiles) return;

    const newFiles: FileItem[] = Array.from(selectedFiles).map((file) => ({
      id: Math.random().toString(36),
      file,
      progress: 0,
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    try {
      const fileContents = await Promise.all(
        files.map(async (item) => ({
          name: item.file.name,
          content: await item.file.text(),
        }))
      );

      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: "uploading", progress: 50 }))
      );

      await uploadMutation.mutateAsync({
        novelId,
        files: fileContents,
      });

      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: "success", progress: 100 }))
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: "error",
          error: errorMessage,
        }))
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>批量上传文件</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 文件输入 */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600">
            点击或拖拽文件到此处上传
            <br />
            <span className="text-sm text-gray-500">支持 .txt 格式</span>
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* 文件列表 */}
        {files.length > 0 && (
          <div className="space-y-3">
            {files.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">
                      {item.file.name}
                    </p>
                    {item.status === "success" && (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                    {item.status === "error" && (
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <Progress value={item.progress} className="h-1" />
                  {item.error && (
                    <p className="text-xs text-red-600 mt-1">{item.error}</p>
                  )}
                </div>
                {item.status === "pending" && (
                  <button
                    onClick={() => handleRemoveFile(item.id)}
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 上传按钮 */}
        {files.length > 0 && (
          <Button
            onClick={handleUpload}
            disabled={uploadMutation.isPending}
            className="w-full"
          >
            {uploadMutation.isPending ? "上传中..." : `上传 ${files.length} 个文件`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
