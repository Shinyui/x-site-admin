import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import FileExplorer from "@/components/file-manager/FileExplorer";

export default function FileManagerPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Cloud Storage</h1>
      </div>
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="border-b py-4">
          <CardTitle>File Explorer</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 min-h-0 overflow-hidden">
          <FileExplorer />
        </CardContent>
      </Card>
    </div>
  );
}
