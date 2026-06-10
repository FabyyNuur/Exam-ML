import React from 'react';
import { FigureImage } from './FigureImage';
import { PlotlyChart } from './PlotlyChart';
import { usePlotlyChart } from '@/lib/hooks';

interface ChartPanelProps {
  filename: string;
  title?: string;
  caption?: string;
  className?: string;
  preferPlotly?: boolean;
  height?: number;
}

export function chartIdFromFilename(filename: string): string {
  return filename.replace(/\.png$/i, '');
}

export function ChartPanel({
  filename,
  title,
  caption,
  className,
  preferPlotly = true,
  height,
}: ChartPanelProps) {
  const chartId = chartIdFromFilename(filename);
  const { data, loading, error } = usePlotlyChart(chartId);

  if (preferPlotly && (loading || data)) {
    return (
      <PlotlyChart
        data={data}
        loading={loading}
        error={error}
        title={title}
        caption={caption}
        className={className}
        height={height}
      />
    );
  }

  if (preferPlotly && error) {
    return <FigureImage filename={filename} title={title} caption={caption} className={className} />;
  }

  return <FigureImage filename={filename} title={title} caption={caption} className={className} />;
}
