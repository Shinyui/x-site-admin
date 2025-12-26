import React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import NumberField from "./NumberField";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function safeNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export default function BlockInspector({ block, allAssetIds, onChange }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <NumberField
            label="aspect（H/W）"
            value={block.aspect}
            min={0.2}
            max={2}
            step={0.05}
            hint="例：1 = 1:1、0.5 = 2:1、1.25 = 4:5"
            onCommit={(next) => onChange({ aspect: next })}
          />
        </div>
        <div>
          <div className="text-xs mb-1 text-muted-foreground">
            spacing（px）
          </div>
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label="gapX（左右間距）"
              value={block.spacing?.gapX ?? 8}
              min={0}
              max={24}
              step={1}
              onCommit={(next) =>
                onChange({
                  spacing: { ...(block.spacing ?? {}), gapX: next },
                })
              }
            />
            <NumberField
              label="gapY（上下間距）"
              value={block.spacing?.gapY ?? 8}
              min={0}
              max={24}
              step={1}
              onCommit={(next) =>
                onChange({
                  spacing: { ...(block.spacing ?? {}), gapY: next },
                })
              }
            />
            <NumberField
              label="padX（左右內距）"
              value={block.spacing?.padX ?? 8}
              min={0}
              max={24}
              step={1}
              onCommit={(next) =>
                onChange({
                  spacing: { ...(block.spacing ?? {}), padX: next },
                })
              }
            />
            <NumberField
              label="padY（上下內距）"
              value={block.spacing?.padY ?? 8}
              min={0}
              max={24}
              step={1}
              onCommit={(next) =>
                onChange({
                  spacing: { ...(block.spacing ?? {}), padY: next },
                })
              }
            />
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">
            ✅ gap 控制 item 之間距離；pad 控制容器內距（上下左右）
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {block.type === "grid" && (
          <div>
            <NumberField
              label="columns"
              value={block.columns ?? 2}
              min={2}
              max={4}
              step={1}
              onCommit={(next) => onChange({ columns: next })}
            />
          </div>
        )}
      </div>

      {block.type === "split" && (
        <div>
          <div className="text-xs mb-1 text-muted-foreground">
            split 權重（例如 7,3）
          </div>
          <Input
            value={(block.columnWeights ?? [1, 1]).join(",")}
            onChange={(e) => {
              const parts = e.target.value
                .split(",")
                .map((x) => clamp(safeNumber(x.trim(), 1), 1, 12));
              const weights = [parts[0] ?? 1, parts[1] ?? 1];
              onChange({ columnWeights: weights });
            }}
          />
        </div>
      )}

      {block.type === "grid" && (
        <div>
          <div className="text-xs mb-2 text-muted-foreground">
            Grid Spans (每張圖佔幾格，預設 1x1)
          </div>
          <div className="grid grid-cols-2 gap-2">
            {block.assetIds.map((aid, i) => {
              const span = block.spans?.[i] || { cols: 1, rows: 1 };
              return (
                <div key={aid + i} className="p-2 border rounded-md text-xs">
                  <div className="mb-1 font-medium truncate">{aid}</div>
                  <div className="flex gap-1">
                    <label className="flex items-center gap-1">
                      <span>C:</span>
                      <input
                        type="number"
                        min={1}
                        max={block.columns}
                        className="w-8 border rounded px-1"
                        value={span.cols}
                        onChange={(e) => {
                          const val = clamp(
                            Number(e.target.value),
                            1,
                            block.columns
                          );
                          const nextSpans = [...(block.spans || [])];
                          // Fill missing previous spans with default
                          for (let k = 0; k <= i; k++) {
                            if (!nextSpans[k])
                              nextSpans[k] = { cols: 1, rows: 1 };
                          }
                          nextSpans[i] = { ...nextSpans[i], cols: val };
                          onChange({ spans: nextSpans });
                        }}
                      />
                    </label>
                    <label className="flex items-center gap-1">
                      <span>R:</span>
                      <input
                        type="number"
                        min={1}
                        max={block.columns}
                        className="w-8 border rounded px-1"
                        value={span.rows}
                        onChange={(e) => {
                          const val = clamp(
                            Number(e.target.value),
                            1,
                            block.columns
                          );
                          const nextSpans = [...(block.spans || [])];
                          // Fill missing previous spans with default
                          for (let k = 0; k <= i; k++) {
                            if (!nextSpans[k])
                              nextSpans[k] = { cols: 1, rows: 1 };
                          }
                          nextSpans[i] = { ...nextSpans[i], rows: val };
                          onChange({ spans: nextSpans });
                        }}
                      />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="text-xs mb-2 text-muted-foreground">
          assets（拖曳式後台通常就是修改這裡的順序/內容）
        </div>
        <div className="flex flex-wrap gap-2">
          {block.assetIds.map((aid, i) => (
            <Badge key={aid + i} variant="secondary" className="gap-2">
              {aid}
              <button
                className="ml-1 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  const next = [...block.assetIds];
                  next.splice(i, 1);
                  onChange({ assetIds: next });
                }}
                title="remove"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              onChange({ assetIds: [...block.assetIds, v] });
              e.currentTarget.selectedIndex = 0;
            }}
          >
            <option value="">+ 加入 asset</option>
            {allAssetIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
