import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  SplitSquareVertical,
  Square,
} from "lucide-react";

// shadcn/ui
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import BlockInspector from "@/components/album-builder/BlockInspector";
import BlockRenderer from "@/components/album-builder/BlockRenderer";

// ---------------------------
// Demo Seed Data
// ---------------------------

const seedAssets = {
  img_001: {
    id: "img_001",
    type: "image",
    src: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1400&q=80",
    width: 1400,
    height: 875,
  },
  img_002: {
    id: "img_002",
    type: "image",
    src: "https://images.unsplash.com/photo-1471879832106-c7ab9e0cee23?auto=format&fit=crop&w=1400&q=80",
    width: 1400,
    height: 933,
  },
  img_003: {
    id: "img_003",
    type: "image",
    src: "https://images.unsplash.com/photo-1520975661595-6453be3f7070?auto=format&fit=crop&w=1400&q=80",
    width: 1400,
    height: 933,
  },
};

const seedPage = {
  pageId: "album_001",
  title: "Sample Album",
  assets: seedAssets,
  blocks: [
    {
      id: "b1",
      type: "single",
      aspect: 1,
      assetIds: ["img_001"],
      spacing: { gapX: 8, gapY: 8, padX: 8, padY: 8 },
      radius: 16,
    },
    {
      id: "b2",
      type: "split",
      aspect: 0.6,
      columnWeights: [7, 3],
      assetIds: ["img_002", "img_003"],
      spacing: { gapX: 8, gapY: 8, padX: 8, padY: 8 },
      radius: 16,
    },
    {
      id: "b3",
      type: "grid",
      aspect: 1,
      columns: 2,
      assetIds: ["img_003", "img_002", "img_001", "img_003"],
      spacing: { gapX: 8, gapY: 8, padX: 8, padY: 8 },
      radius: 16,
    },
  ],
};

// ---------------------------
// Helpers
// ---------------------------

const uid = () => Math.random().toString(36).slice(2, 10);

function getDefaultBlock(type, allAssetIds) {
  const pick = () =>
    allAssetIds[Math.floor(Math.random() * allAssetIds.length)] || "";
  const base = {
    spacing: { gapX: 8, gapY: 8, padX: 8, padY: 8 },
    radius: 16,
  };
  if (type === "single") {
    return {
      id: `b_${uid()}`,
      type,
      aspect: 1,
      assetIds: [pick()],
      ...base,
    };
  }
  if (type === "split") {
    return {
      id: `b_${uid()}`,
      type,
      aspect: 0.6,
      columnWeights: [1, 1],
      assetIds: [pick(), pick()],
      ...base,
    };
  }
  return {
    id: `b_${uid()}`,
    type: "grid",
    aspect: 1,
    columns: 2,
    assetIds: [pick(), pick(), pick(), pick()].filter(Boolean),
    spacing: { gapX: 8, gapY: 8, padX: 8, padY: 8 },
    radius: 16,
  };
}

// ---------------------------
// Main
// ---------------------------

export default function AlbumBuilderPage() {
  const [page, setPage] = useState(seedPage);
  const [selectedBlockId, setSelectedBlockId] = useState(
    seedPage.blocks[0]?.id ?? ""
  );
  const [jsonDraft, setJsonDraft] = useState(
    JSON.stringify(seedPage.blocks, null, 2)
  );
  const [jsonError, setJsonError] = useState("");

  const allAssetIds = useMemo(() => Object.keys(page.assets), [page.assets]);

  // Keep JSON editor in sync (only when blocks change via UI)
  useEffect(() => {
    setJsonDraft(JSON.stringify(page.blocks, null, 2));
  }, [page.blocks]);

  const updateBlock = (blockId, patch) => {
    setPage((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) =>
        b.id === blockId ? { ...b, ...patch } : b
      ),
    }));
  };

  const addBlock = (type) => {
    setPage((prev) => ({
      ...prev,
      blocks: [...prev.blocks, getDefaultBlock(type, Object.keys(prev.assets))],
    }));
    // select new block after state flush
    requestAnimationFrame(() => {
      setSelectedBlockId((_) => {
        const next = page.blocks[page.blocks.length - 1]?.id;
        return next || selectedBlockId;
      });
    });
  };

  const removeBlock = (blockId) => {
    setPage((prev) => {
      const nextBlocks = prev.blocks.filter((b) => b.id !== blockId);
      return { ...prev, blocks: nextBlocks };
    });
    if (selectedBlockId === blockId) {
      const idx = page.blocks.findIndex((b) => b.id === blockId);
      const fallback =
        page.blocks[idx - 1]?.id || page.blocks[idx + 1]?.id || "";
      setSelectedBlockId(fallback);
    }
  };

  const moveBlock = (blockId, dir) => {
    setPage((prev) => {
      const idx = prev.blocks.findIndex((b) => b.id === blockId);
      if (idx < 0) return prev;
      const next = [...prev.blocks];
      const ni = idx + dir;
      if (ni < 0 || ni >= next.length) return prev;
      const [spliced] = next.splice(idx, 1);
      next.splice(ni, 0, spliced);
      return { ...prev, blocks: next };
    });
  };

  // JSON -> apply
  const applyJson = () => {
    try {
      setJsonError("");
      const parsed = JSON.parse(jsonDraft);
      if (!Array.isArray(parsed))
        throw new Error("JSON 必須是一個 blocks array");
      // Light validation
      parsed.forEach((b, i) => {
        if (!b.id || !b.type) throw new Error(`blocks[${i}] 缺少 id/type`);
        if (!Array.isArray(b.assetIds))
          throw new Error(`blocks[${i}].assetIds 必須是 array`);
      });
      setPage((prev) => ({ ...prev, blocks: parsed }));
      if (!parsed.some((b) => b.id === selectedBlockId)) {
        setSelectedBlockId(parsed[0]?.id ?? "");
      }
    } catch (e) {
      setJsonError(e?.message || "JSON 解析失敗");
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Album Builder</h1>
          <p className="text-sm text-muted-foreground mt-1">
            視覺化編排寫真集版面，即時預覽效果。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => addBlock("single")}>
            {" "}
            <Square className="mr-2 h-4 w-4" />
            新增 Single
          </Button>
          <Button variant="secondary" onClick={() => addBlock("split")}>
            {" "}
            <SplitSquareVertical className="mr-2 h-4 w-4" />
            新增 Split
          </Button>
          <Button variant="secondary" onClick={() => addBlock("grid")}>
            {" "}
            <LayoutGrid className="mr-2 h-4 w-4" />
            新增 Grid
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 flex-1 min-h-0">
        {/* Editor */}
        <Card className="flex flex-col min-h-0">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold">Editor</div>
              <Badge variant="secondary">blocks: {page.blocks.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <Tabs defaultValue="visual" className="w-full h-full flex flex-col">
              <div className="px-6 pt-4">
                <TabsList className="w-full">
                  <TabsTrigger value="visual" className="flex-1">
                    視覺編排
                  </TabsTrigger>
                  <TabsTrigger value="json" className="flex-1">
                    JSON
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="visual"
                className="flex-1 overflow-auto p-6 mt-0"
              >
                <div className="flex flex-col gap-3">
                  {page.blocks.map((b, idx) => (
                    <motion.div
                      key={b.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`rounded-2xl border p-3 cursor-pointer transition-colors ${
                        b.id === selectedBlockId
                          ? "border-primary/60 bg-primary/5 ring-1 ring-primary/20"
                          : "bg-card hover:bg-accent/50"
                      }`}
                      onClick={() => setSelectedBlockId(b.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{idx + 1}</Badge>
                            <div className="font-medium">{b.type}</div>
                            <div className="text-xs text-muted-foreground">
                              id: {b.id}
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            aspect: {b.aspect} · assets: {b.assetIds.length}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveBlock(b.id, -1);
                            }}
                            disabled={idx === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveBlock(b.id, 1);
                            }}
                            disabled={idx === page.blocks.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeBlock(b.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {b.id === selectedBlockId && (
                        <div className="mt-3">
                          <Separator className="mb-3" />
                          <BlockInspector
                            block={b}
                            allAssetIds={allAssetIds}
                            onChange={(patch) => updateBlock(b.id, patch)}
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent
                value="json"
                className="flex-1 overflow-auto p-6 mt-0"
              >
                <div className="flex flex-col gap-2 h-full">
                  <Textarea
                    value={jsonDraft}
                    onChange={(e) => setJsonDraft(e.target.value)}
                    className="flex-1 font-mono text-xs min-h-[300px]"
                  />
                  {jsonError && (
                    <div className="text-sm text-destructive">{jsonError}</div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Button onClick={applyJson}>
                      <Plus className="mr-2 h-4 w-4" />
                      套用 JSON
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setJsonDraft(JSON.stringify(page.blocks, null, 2))
                      }
                    >
                      重置
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    ✅ 後端可以直接存這份 blocks JSON。預覽端只要拿到 blocks +
                    assets 即可渲染。
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="flex flex-col min-h-0">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold">Preview（手機長條）</div>
              <Badge variant="secondary">scrollable</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-6 bg-muted/20">
            <div className="mx-auto w-full max-w-[420px] rounded-[28px] border bg-background p-3 shadow-xl">
              <div className="rounded-[22px] bg-background p-3 min-h-[600px]">
                <div className="mb-3 text-sm font-medium text-center">
                  {page.title}
                </div>
                <div className="flex flex-col gap-3">
                  {page.blocks.map((b) => (
                    <BlockRenderer
                      key={b.id}
                      block={b}
                      assets={page.assets}
                      onSelect={() => setSelectedBlockId(b.id)}
                      selected={b.id === selectedBlockId}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
