import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Folder,
  FileText,
  FileImage,
  FileVideo,
  FileMusic,
  MoreVertical,
  ChevronRight,
  Home,
  ArrowLeft,
  Plus,
  Upload,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, getPathAfterBucket, joinUrl, requireEnv } from "@/lib/utils";

import Uppy from "@uppy/core";
import Tus from "@uppy/tus";
import DashboardModal from "@uppy/react/dashboard-modal";
import FilePreviewModal from "./FilePreviewModal";

import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";

const BACKEND_API_BASE_URL = String(
  requireEnv("VITE_BACKEND_API_BASE_URL")
).replace(/\/+$/, "");
const TUS_ENDPOINT = String(requireEnv("VITE_TUS_ENDPOINT")).replace(
  /\/+$/,
  ""
);

const getFileIcon = (fileType) => {
  if (!fileType) return <FileText className="w-8 h-8 text-gray-500" />;
  if (fileType.startsWith("image/"))
    return <FileImage className="w-8 h-8 text-purple-500" />;
  if (fileType.startsWith("video/"))
    return <FileVideo className="w-8 h-8 text-red-500" />;
  if (fileType.startsWith("audio/"))
    return <FileMusic className="w-8 h-8 text-yellow-500" />;
  if (fileType.includes("pdf"))
    return <FileText className="w-8 h-8 text-orange-500" />;
  return <FileText className="w-8 h-8 text-gray-500" />;
};

export default function FileExplorer() {
  const [currentPath, setCurrentPath] = useState([]); // Array of folders {id, name}
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [menuOpenForId, setMenuOpenForId] = useState(null);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const deletingIdsRef = useRef(deletingIds);

  const cdnBaseUrl = String(requireEnv("CDN_BASE_URL")).replace(/\/+$/, "");

  const currentFolderId =
    currentPath.length > 0 ? currentPath[currentPath.length - 1].id : "root";
  // Keep track of currentFolderId in a ref for Uppy to access in callbacks
  const folderIdRef = useRef(currentFolderId);
  useEffect(() => {
    folderIdRef.current = currentFolderId;
  }, [currentFolderId]);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${BACKEND_API_BASE_URL}/folders/${currentFolderId}/content`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [currentFolderId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    deletingIdsRef.current = deletingIds;
  }, [deletingIds]);

  useEffect(() => {
    if (!menuOpenForId) return;

    const handleDocumentClick = () => setMenuOpenForId(null);
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [menuOpenForId]);

  const handleDelete = useCallback(
    async (item) => {
      try {
        if (deletingIdsRef.current.has(item.id)) return;
        setDeletingIds((prev) => new Set(prev).add(item.id));

        const endpoint =
          item.type === "folder"
            ? `${BACKEND_API_BASE_URL}/folders/${item.id}`
            : `${BACKEND_API_BASE_URL}/files/${item.id}`;

        const res = await fetch(endpoint, { method: "DELETE" });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error || "Failed to delete");
        }

        setSelectedItems((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        if (previewFile?.id === item.id) setPreviewFile(null);

        setMenuOpenForId(null);
        fetchItems();
      } catch (error) {
        console.error(error);
      } finally {
        setDeletingIds((prev) => {
          if (!prev.has(item.id)) return prev;
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
      }
    },
    [fetchItems, previewFile]
  );

  // Uppy Configuration
  const uppy = useMemo(() => {
    const u = new Uppy({
      autoProceed: false,
      restrictions: {
        maxFileSize: 1024 * 1024 * 1024 * 5, // 5GB
      },
    }).use(Tus, {
      endpoint: TUS_ENDPOINT,
      removeFingerprintOnSuccess: true,
      retryDelays: [0, 1000, 3000, 5000],
    });

    // Before upload starts, sync with backend to get fileId
    u.addPreProcessor(async (fileIDs) => {
      // fileIDs is an array of file IDs in Uppy
      await Promise.all(
        fileIDs.map(async (uppyId) => {
          const file = u.getFile(uppyId);
          try {
            // Init upload in Backend
            const initRes = await fetch(`${BACKEND_API_BASE_URL}/files/init`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: file.name,
                size: file.size,
                type: file.type,
                folderId: folderIdRef.current, // Use ref to get current folder
              }),
            });

            if (!initRes.ok) throw new Error("Failed to init upload");

            const { fileId: dbId } = await initRes.json();

            // Update file metadata for Tus
            u.setFileMeta(uppyId, {
              dbId: dbId,
              filename: file.name,
              filetype: file.type,
            });
          } catch (error) {
            console.error(`Failed to init upload for ${file.name}:`, error);
            u.removeFile(uppyId);
          }
        })
      );
    });

    u.on("complete", (result) => {
      console.log("Upload complete:", result);
      // We handle refresh in the useEffect below to avoid stale closures
    });

    return u;
  }, []); // Initialize once

  // Ensure fetchItems uses the latest folderIdRef when called from external closures if needed,
  // but here it's defined inside the component so it captures state.
  // However, uppy callback is defined in useMemo with [] dependency, so it captures stale `fetchItems`.
  // We need to fix this.

  // Better approach: Use a ref for fetchItems or trigger a state change that causes re-fetch.
  // Or simply add fetchItems to dependency array of useMemo? No, that would recreate Uppy instance.

  // Solution: Use a mutable ref to hold the current fetchItems function
  const fetchItemsRef = useRef(fetchItems);
  useEffect(() => {
    fetchItemsRef.current = fetchItems;
  }, [fetchItems]);

  // Re-bind the complete event if necessary, or just use the ref inside the static callback
  useEffect(() => {
    if (!uppy) return;

    const handleComplete = (result) => {
      if (result.successful.length > 0) {
        console.log("Refreshing content for folder:", folderIdRef.current);
        fetchItemsRef.current();
      }
    };

    uppy.on("complete", handleComplete);
    return () => uppy.off("complete", handleComplete);
  }, [uppy]);

  const handleNavigate = (folder) => {
    setCurrentPath([...currentPath, folder]);
    setSelectedItems(new Set());
  };

  const handleNavigateUp = () => {
    if (currentPath.length === 0) return;
    setCurrentPath(currentPath.slice(0, -1));
    setSelectedItems(new Set());
  };

  const handleBreadcrumbClick = (index) => {
    setCurrentPath(currentPath.slice(0, index + 1));
    setSelectedItems(new Set());
  };

  const toggleSelection = (id) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await fetch(`${BACKEND_API_BASE_URL}/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName,
          parentId: currentFolderId === "root" ? null : currentFolderId,
        }),
      });
      setNewFolderName("");
      setIsCreatingFolder(false);
      fetchItems();
    } catch (error) {
      console.error("Failed to create folder", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background/50">
      <DashboardModal
        uppy={uppy}
        open={isDashboardOpen}
        onRequestClose={() => setIsDashboardOpen(false)}
        closeModalOnClickOutside
        showProgressDetails={true}
        proudlyDisplayPoweredByUppy={false}
      />

      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />

      {/* Toolbar / Breadcrumbs */}
      <div className="flex items-center justify-between p-4 border-b bg-card/50 backdrop-blur">
        <div className="flex items-center gap-2 overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNavigateUp}
            disabled={currentPath.length === 0}
            className="mr-2 shrink-0"
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
              onClick={() => {
                setCurrentPath([]);
                setSelectedItems(new Set());
              }}
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

        <div className="flex items-center gap-2">
          {isCreatingFolder ? (
            <form
              onSubmit={handleCreateFolder}
              className="flex items-center gap-2"
            >
              <Input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                className="h-8 w-40"
              />
              <Button type="submit" size="sm" variant="ghost">
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setIsCreatingFolder(false)}
              >
                Cancel
              </Button>
            </form>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreatingFolder(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Folder
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsDashboardOpen(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </>
          )}
        </div>
      </div>

      {/* File Grid */}
      <div className="flex-1 p-4 overflow-auto">
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.map((item) => {
              const mimeType = item?.mimeType || "";
              const isReadyFile =
                item.type === "file"
                  ? (item.status === "READY" || item.status === "COMPLETED") &&
                    !!item.url
                  : true;
              const isDeletableFile =
                item.type === "file"
                  ? item.status === "READY" || item.status === "COMPLETED"
                  : true;
              const isMedia =
                mimeType.startsWith("image/") || mimeType.startsWith("video/");
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
                    "group relative flex flex-col items-center p-4 rounded-xl border border-transparent transition-all duration-200 cursor-pointer",
                    "hover:bg-accent/50 hover:border-border/50",
                    selectedItems.has(item.id)
                      ? "bg-accent border-primary/20 ring-1 ring-primary/20"
                      : "bg-card/30"
                  )}
                  onClick={(e) => {
                    if (item.type === "folder") {
                      handleNavigate(item);
                    } else {
                      if (e.metaKey || e.ctrlKey) {
                        toggleSelection(item.id);
                      } else {
                        setPreviewFile(item);
                      }
                    }
                  }}
                >
                  <div className="mb-3 transition-transform group-hover:scale-105">
                    {item.type === "folder" ? (
                      <Folder className="w-12 h-12 text-blue-400 fill-blue-400/20" />
                    ) : isReadyFile && isMedia && thumbnailUrl ? (
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
                          <video
                            src={thumbnailUrl}
                            preload="metadata"
                            muted
                            playsInline
                            className="w-full h-full object-cover pointer-events-none"
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

                  <div
                    className={cn(
                      "absolute top-2 right-2 transition-opacity",
                      menuOpenForId === item.id
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative">
                      {(() => {
                        const canDelete =
                          item.type === "folder" ||
                          (item.type === "file" && isDeletableFile);
                        return (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={!canDelete}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!canDelete) return;
                              setMenuOpenForId((prev) =>
                                prev === item.id ? null : item.id
                              );
                            }}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        );
                      })()}

                      {menuOpenForId === item.id && (
                        <div className="absolute right-0 mt-1 min-w-28 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                          <button
                            className={cn(
                              "w-full px-3 py-2 text-left text-sm text-destructive",
                              deletingIds.has(item.id)
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-accent"
                            )}
                            disabled={deletingIds.has(item.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item);
                            }}
                          >
                            <span className="inline-flex items-center gap-2">
                              {deletingIds.has(item.id) && (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              )}
                              Delete
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer / Status Bar */}
      <div className="border-t p-2 px-4 text-xs text-muted-foreground bg-card/50 flex justify-between">
        <span>{items.length} items</span>
        <span>
          {selectedItems.size > 0 ? `${selectedItems.size} selected` : ""}
        </span>
      </div>
    </div>
  );
}
