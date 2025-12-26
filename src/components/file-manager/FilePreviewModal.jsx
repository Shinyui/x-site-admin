import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { getPathAfterBucket, joinUrl, requireEnv } from "@/lib/utils";

export default function FilePreviewModal({ file, isOpen, onClose }) {
  if (!file) return null;

  const mimeType = file.mimeType || file.type || "";
  const isImage = mimeType.startsWith("image/");
  const isVideo = mimeType.startsWith("video/");

  const cdnBaseUrl = String(requireEnv("CDN_BASE_URL")).replace(/\/+$/, "");
  const originalUrl = file.url || "";
  const cdnUrl = joinUrl(cdnBaseUrl, getPathAfterBucket(originalUrl));
  const previewUrl = cdnUrl || originalUrl;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="w-[60vw] h-[60vh] p-0 overflow-hidden bg-black/95 border-none text-white"
      >
        <DialogHeader className="p-4 bg-black/50 absolute top-0 w-full z-10 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-white">{file.name}</DialogTitle>
            <DialogDescription className="text-white/70">
              {file.size ? (file.size / 1024 / 1024).toFixed(2) + " MB" : ""}
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            {previewUrl && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => window.open(previewUrl, "_blank")}
              >
                <Download className="w-5 h-5" />
              </Button>
            )}
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="flex items-center justify-center h-full p-4 pt-16">
          {isImage && (
            <img
              src={previewUrl}
              alt={file.name}
              className="max-w-full max-h-full object-contain"
            />
          )}

          {isVideo && (
            <video
              controls
              autoPlay
              className="max-w-full max-h-full"
              src={previewUrl}
            >
              Your browser does not support the video tag.
            </video>
          )}

          {!isImage && !isVideo && (
            <div className="text-center text-white/50">
              <p>Preview not available for this file type.</p>
              <Button
                variant="outline"
                className="mt-4 text-black"
                disabled={!previewUrl}
                onClick={() => previewUrl && window.open(previewUrl, "_blank")}
              >
                Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
