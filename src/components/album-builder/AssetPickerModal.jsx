import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  FileImage,
  FileText,
  FileVideo,
  Folder,
  Home,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, getPathAfterBucket, joinUrl, requireEnv } from "@/lib/utils";

const BACKEND_API_BASE_URL = String(
  requireEnv("VITE_BACKEND_API_BASE_URL")
).replace(/\/+$/, "");

function getFileIcon(mimeType) {
  const type = String(mimeType || "");
  if (!type) return <FileText className="w-8 h-8 text-gray-500" />;
  if (type.startsWith("image/"))
    return <FileImage className="w-8 h-8 text-purple-500" />;
  if (type.startsWith("video/"))
    return <FileVideo className="w-8 h-8 text-red-500" />;
  return <FileText className="w-8 h-8 text-gray-500" />;
}

function VideoThumbnail({ src, name }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleLoadedMetadata = () => {
      try {
        el.currentTime = 0.1;
      } catch (error) {
        void error;
      }
    };
    const handleSeeked = () => {
      try {
        el.pause();
      } catch (error) {
        void error;
      }
    };

    el.addEventListener("loadedmetadata", handleLoadedMetadata);
    el.addEventListener("seeked", handleSeeked);
    return () => {
      el.removeEventListener("loadedmetadata", handleLoadedMetadata);
      el.removeEventListener("seeked", handleSeeked);
    };
  }, [src]);

  return (
    <video
      ref={ref}
      src={src}
      preload="metadata"
      muted
      playsInline
      aria-label={name}
      className="w-full h-full object-cover pointer-events-none"
    />
  );
}

export default function AssetPickerModal({ isOpen, onClose, onPick }) {
  const [currentPath, setCurrentPath] = useState([]);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const cdnBaseUrl = String(requireEnv("CDN_BASE_URL")).replace(/\/+$/, "");

  const currentFolderId =
    currentPath.length > 0 ? currentPath[currentPath.length - 1].id : "root";

  useEffect(() => {
    if (!isOpen) return;
    setCurrentPath([]);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();

    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `${BACKEND_API_BASE_URL}/folders/${currentFolderId}/content`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setItems(data);
      } catch (error) {
        if (error?.name !== "AbortError") console.error(error);
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [isOpen, currentFolderId]);

  const handleNavigate = (folder) =>
    setCurrentPath((prev) => [...prev, folder]);
  const handleNavigateUp = () =>
    setCurrentPath((prev) => (prev.length === 0 ? prev : prev.slice(0, -1)));
  const handleBreadcrumbClick = (index) =>
    setCurrentPath((prev) => prev.slice(0, index + 1));

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-7xl w-[96vw] h-[92vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle>選擇媒體</DialogTitle>
              <DialogDescription className="truncate">
                從檔案庫挑選要加入到 block 的媒體
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex items-center justify-between p-4 border-b bg-card/40">
          <div className="flex items-center gap-2 overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNavigateUp}
              disabled={currentPath.length === 0}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center text-sm text-muted-foreground overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "px-2 h-8",
                  currentPath.length === 0 && "text-foreground font-medium"
                )}
                onClick={() => setCurrentPath([])}
              >
                <Home className="w-4 h-4 mr-1" />
                Home
              </Button>

              {currentPath.map((folder, index) => (
                <div key={folder.id} className="flex items-center shrink-0">
                  <ChevronRight className="w-4 h-4 mx-1 opacity-50" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "px-2 h-8",
                      index === currentPath.length - 1 &&
                        "text-foreground font-medium"
                    )}
                    onClick={() => handleBreadcrumbClick(index)}
                  >
                    {folder.name}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 p-4 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
              <Folder className="w-16 h-16 mb-4" />
              <p>This folder is empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
              {items.map((item) => {
                const mimeType = item.mimeType || item.type || "";
                const isReadyFile =
                  item.type === "file"
                    ? (item.status === "READY" ||
                        item.status === "COMPLETED") &&
                      !!item.url
                    : true;
                const isSelectable =
                  item.type === "folder" ||
                  (isReadyFile &&
                    (mimeType.startsWith("image/") ||
                      mimeType.startsWith("video/")));
                const originalUrl = item?.url || "";
                const cdnUrl = joinUrl(
                  cdnBaseUrl,
                  getPathAfterBucket(originalUrl)
                );
                const thumbnailUrl = cdnUrl || originalUrl;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "group relative flex flex-col items-center p-4 rounded-xl border border-transparent transition-all duration-200",
                      isSelectable ? "cursor-pointer" : "cursor-not-allowed",
                      isSelectable
                        ? "hover:bg-accent/50 hover:border-border/50"
                        : "opacity-60",
                      "bg-card/30"
                    )}
                    onClick={() => {
                      if (item.type === "folder") {
                        handleNavigate(item);
                        return;
                      }
                      if (!isSelectable) return;
                      onPick(item);
                    }}
                  >
                    <div className="mb-3 transition-transform group-hover:scale-105">
                      {item.type === "folder" ? (
                        <Folder className="w-12 h-12 text-blue-400 fill-blue-400/20" />
                      ) : isReadyFile &&
                        (mimeType.startsWith("image/") ||
                          mimeType.startsWith("video/")) &&
                        thumbnailUrl ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted/30 border border-border/40">
                          {mimeType.startsWith("image/") ? (
                            <img
                              src={thumbnailUrl}
                              alt={item.name}
                              loading="lazy"
                              draggable={false}
                              className="w-full h-full object-cover pointer-events-none"
                            />
                          ) : (
                            <VideoThumbnail
                              src={thumbnailUrl}
                              name={item.name}
                            />
                          )}
                        </div>
                      ) : (
                        getFileIcon(mimeType)
                      )}
                    </div>
                    <div className="text-center w-full">
                      <p
                        className="text-sm font-medium truncate w-full px-2"
                        title={item.name}
                      >
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.type === "folder"
                          ? "Folder"
                          : item.status === "PENDING"
                          ? "Uploading..."
                          : "Ready"}
                      </p>
                    </div>

                    <div className="pointer-events-none absolute inset-x-2 bottom-2 z-10 hidden rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow group-hover:block">
                      <span className="block whitespace-normal break-words text-center">
                        {item.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
