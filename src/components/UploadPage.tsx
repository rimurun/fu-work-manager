"use client";

import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, Check, AlertCircle, X } from "lucide-react";
import { STORES } from "@/lib/stores";

interface UploadPageProps {
  selectedStore: string;
}

interface UploadedFile {
  name: string;
  status: "uploading" | "success" | "error";
  message?: string;
}

export default function UploadPage({ selectedStore }: UploadPageProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const storeName = STORES.find((s) => s.id === selectedStore)?.name || "";

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check if it's an Excel file
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        setUploadedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            status: "error",
            message: "Excelファイル (.xlsx, .xls) のみ対応しています",
          },
        ]);
        continue;
      }

      // Add file with uploading status
      setUploadedFiles((prev) => [
        ...prev,
        { name: file.name, status: "uploading" },
      ]);

      try {
        // Create form data
        const formData = new FormData();
        formData.append("file", file);
        formData.append("store", selectedStore);
        formData.append("year", selectedYear.toString());
        formData.append("month", selectedMonth.toString());

        // Upload to API
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.name === file.name
                ? { ...f, status: "success", message: "アップロード完了" }
                : f
            )
          );
        } else {
          const error = await response.json();
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.name === file.name
                ? { ...f, status: "error", message: error.message || "エラーが発生しました" }
                : f
            )
          );
        }
      } catch (error) {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.name === file.name
              ? { ...f, status: "error", message: "アップロードに失敗しました" }
              : f
          )
        );
      }
    }
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  const years = [2024, 2025, 2026, 2027];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">データアップロード</h1>
        <p className="text-gray-400 mt-1">
          {storeName} のExcelデータをアップロード
        </p>
      </div>

      {/* Date Selector */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">データ期間を選択</h3>
        <div className="flex gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">年</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-dark-300 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-accent-purple"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}年
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">月</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-dark-300 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-accent-purple"
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}月
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`glass rounded-xl p-12 border-2 border-dashed transition-all ${
          dragActive
            ? "border-accent-purple bg-accent-purple/10"
            : "border-white/20 hover:border-white/40"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <div
            className={`p-4 rounded-full mb-4 transition-colors ${
              dragActive ? "bg-accent-purple/30" : "bg-dark-100"
            }`}
          >
            <Upload
              className={`w-12 h-12 ${
                dragActive ? "text-accent-purple" : "text-gray-400"
              }`}
            />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            Excelファイルをドロップ
          </h3>
          <p className="text-gray-400 mb-4">
            または、クリックしてファイルを選択
          </p>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
            multiple
          />
          <label
            htmlFor="file-upload"
            className="px-6 py-3 bg-gradient-to-r from-accent-purple to-accent-pink rounded-lg cursor-pointer hover:opacity-90 transition-opacity font-medium"
          >
            ファイルを選択
          </label>
          <p className="text-sm text-gray-500 mt-4">
            対応形式: .xlsx, .xls
          </p>
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">アップロード状況</h3>
          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-dark-300 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet
                    className={`w-5 h-5 ${
                      file.status === "success"
                        ? "text-green-500"
                        : file.status === "error"
                        ? "text-red-500"
                        : "text-accent-purple"
                    }`}
                  />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    {file.message && (
                      <p
                        className={`text-sm ${
                          file.status === "error"
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      >
                        {file.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {file.status === "uploading" && (
                    <div className="w-5 h-5 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
                  )}
                  {file.status === "success" && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                  {file.status === "error" && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <button
                    onClick={() => removeFile(file.name)}
                    className="p-1 hover:bg-dark-100 rounded"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">アップロード手順</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-400">
          <li>上部のセレクターで店舗・年月を確認</li>
          <li>統計Excelファイルをドラッグ&ドロップ</li>
          <li>アップロード完了後、ダッシュボードで確認</li>
        </ol>
        <div className="mt-4 p-4 bg-accent-purple/10 rounded-lg border border-accent-purple/30">
          <p className="text-sm">
            <span className="text-accent-purple font-medium">ヒント:</span>{" "}
            同じ期間のデータを再アップロードすると、既存データが更新されます
          </p>
        </div>
      </div>
    </div>
  );
}
