import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function NumberField({
  label,
  value,
  min = 0,
  max = 999,
  step = 1,
  hint,
  onCommit,
}) {
  // ✅ 用 string state 讓使用者可以輸入「空字串 / 0. / .5」等中間狀態
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = (raw) => {
    const s = raw ?? draft;
    const n = Number(s);
    if (!Number.isFinite(n)) {
      setDraft(String(value));
      return;
    }
    const next = clamp(n, min, max);
    setDraft(String(next));
    onCommit(next);
  };

  return (
    <div>
      <div className="text-[11px] text-muted-foreground mb-1">{label}</div>
      <Input
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit()}
        onKeyDown={(e) => {
          // Enter：提交並結束輸入（同時避免換行/不觸發 form submit）
          if (e.key === "Enter") {
            e.preventDefault();
            commit(e.currentTarget.value);
            e.currentTarget.blur();
          }
          // Esc：放棄本次輸入，回到原值
          if (e.key === "Escape") {
            e.preventDefault();
            setDraft(String(value));
            e.currentTarget.blur();
          }
          // ↑↓：可選，用鍵盤微調（不需要按鈕也能快速調）
          if (e.key === "ArrowUp") {
            e.preventDefault();
            const next = clamp(value + step, min, max);
            setDraft(String(next));
            onCommit(next);
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            const next = clamp(value - step, min, max);
            setDraft(String(next));
            onCommit(next);
          }
        }}
      />
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
