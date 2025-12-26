import FileUploader from "@/components/upload/FileUploader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">File Upload</h1>
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Upload Media</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorBoundary>
            <FileUploader
              endpoint={`${import.meta.env.VITE_API_BASE_URL || "/api"}/tus`}
            />
          </ErrorBoundary>
          <p className="text-sm text-muted-foreground mt-4">
            Supports resumeable uploads via Tus protocol.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
