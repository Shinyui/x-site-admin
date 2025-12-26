import React from "react";
import { motion } from "framer-motion";

function Media({ asset }) {
  // Demo：只用 image。實務上你會加上 lazy loading / srcset / blur placeholder
  return (
    <img
      src={asset.src}
      alt={asset.id}
      className="h-full w-full object-cover rounded-[10px]"
      loading="lazy"
      decoding="async"
    />
  );
}

function EmptyCell() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-[10px] border border-dashed bg-muted/40 text-xs text-muted-foreground">
      empty
    </div>
  );
}

function renderItems(block, assets) {
  const items = block.assetIds.map((id) => assets[id]).filter(Boolean);

  if (block.type === "single") {
    const a = items[0];
    return a ? <Media key={a.id} asset={a} /> : <EmptyCell />;
  }

  if (block.type === "split") {
    return (
      <>
        <div className="h-full w-full min-w-0 min-h-0 overflow-hidden relative">
          {items[0] ? <Media asset={items[0]} /> : <EmptyCell />}
        </div>
        <div className="h-full w-full min-w-0 min-h-0 overflow-hidden relative">
          {items[1] ? <Media asset={items[1]} /> : <EmptyCell />}
        </div>
      </>
    );
  }

  // grid
  const cols = block.columns ?? 2;
  // Calculate total slots needed based on spans
  // Or simply render items and let grid-auto-flow handle placement,
  // but we want to apply spans to specific items.

  return (
    <>
      {items.map((a, i) => {
        const span = block.spans?.[i] || { cols: 1, rows: 1 };
        const style = {
          gridColumn: `span ${span.cols}`,
          gridRow: `span ${span.rows}`,
        };
        return (
          <div
            key={(a?.id ?? "empty") + i}
            className="h-full w-full min-w-0 min-h-0 overflow-hidden relative"
            style={style}
          >
            {a ? <Media asset={a} /> : <EmptyCell />}
          </div>
        );
      })}
    </>
  );
}

export default function BlockRenderer({ block, assets, selected, onSelect }) {
  const style = {
    borderRadius: "16px", // Fixed parent radius
  };

  return (
    <motion.div
      layout
      className={`overflow-hidden border bg-card ${
        selected ? "ring-2 ring-primary/50" : ""
      }`}
      style={style}
      onClick={onSelect}
    >
      <div
        className="relative w-full"
        style={{ aspectRatio: `${1} / ${block.aspect}` }}
      >
        <div
          className="absolute inset-0"
          style={{
            display: block.type === "single" ? "block" : "grid",
            gridTemplateColumns:
              block.type === "split"
                ? `${block.columnWeights?.[0] ?? 1}fr ${
                    block.columnWeights?.[1] ?? 1
                  }fr`
                : block.type === "grid"
                ? `repeat(${block.columns ?? 2}, 1fr)` // Force equal width
                : undefined,
            gridTemplateRows:
              block.type === "grid"
                ? `repeat(${block.columns ?? 2}, 1fr)` // Force equal height
                : block.type === "split"
                ? "1fr" // Force split to take full height
                : undefined,
            columnGap: (block.spacing?.gapX ?? 8) + "px",
            rowGap: (block.spacing?.gapY ?? 8) + "px",
            padding: `${block.spacing?.padY ?? 8}px ${
              block.spacing?.padX ?? 8
            }px`,
          }}
        >
          {renderItems(block, assets)}
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2 text-[11px] text-muted-foreground">
        <span>{block.type}</span>
        <span>aspect {block.aspect}</span>
      </div>
    </motion.div>
  );
}
