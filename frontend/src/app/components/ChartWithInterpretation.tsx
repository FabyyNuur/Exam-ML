import React from "react";
import { ChartPanel } from "./ChartPanel";
import type { PageFigure } from "@/lib/api";

type Variant = "red" | "indigo";

const VARIANT_STYLES: Record<Variant, string> = {
  red: "bg-red-50 border-red-100 text-red-900",
  indigo: "bg-indigo-50 border-indigo-100 text-indigo-900",
};

function InterpretationBlock({
  text,
  variant,
}: {
  text: string;
  variant: Variant;
}) {
  return (
    <div
      className={`border px-4 py-3 rounded-lg text-sm leading-relaxed ${VARIANT_STYLES[variant]}`}
    >
      <strong>Interprétation :</strong> {text}
    </div>
  );
}

function hasDistinctInterpretation(figure?: PageFigure): boolean {
  return Boolean(
    figure?.interpretation &&
      figure.interpretation.trim() !== (figure.caption ?? "").trim(),
  );
}

export function ChartWithInterpretation({
  filename,
  figure,
  height = 480,
  variant = "red",
}: {
  filename: string;
  figure?: PageFigure;
  height?: number;
  variant?: Variant;
}) {
  if (!hasDistinctInterpretation(figure)) {
    return (
      <ChartPanel
        filename={filename}
        title={figure?.title}
        caption={figure?.caption}
        height={height}
        className="w-full"
      />
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm w-full overflow-hidden">
      {(figure?.title || figure?.caption) && (
        <div className="px-4 py-3 border-b border-slate-100">
          {figure?.title && (
            <h4 className="text-sm font-bold text-slate-800 uppercase">
              {figure.title}
            </h4>
          )}
          {figure?.caption && (
            <p className="text-xs text-slate-500 mt-1">{figure.caption}</p>
          )}
        </div>
      )}
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 min-w-0 p-2">
          <ChartPanel filename={filename} height={height} bare className="w-full" />
        </div>
        <div className="lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 p-4 flex items-center">
          <InterpretationBlock text={figure!.interpretation!} variant={variant} />
        </div>
      </div>
    </div>
  );
}
