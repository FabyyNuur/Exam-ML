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
  return (
    <div className="flex flex-col gap-3 w-full">
      <ChartPanel
        filename={filename}
        title={figure?.title}
        caption={figure?.caption}
        height={height}
        className="w-full"
      />
      {hasDistinctInterpretation(figure) && (
        <InterpretationBlock
          text={figure!.interpretation!}
          variant={variant}
        />
      )}
    </div>
  );
}
