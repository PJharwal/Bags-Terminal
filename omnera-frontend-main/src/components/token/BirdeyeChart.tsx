"use client";

import { FC } from "react";

interface BirdeyeChartProps {
  tokenMint: string;
}

export const BirdeyeChart: FC<BirdeyeChartProps> = ({ tokenMint }) => {
  const chartUrl = `https://birdeye.so/tv-widget/${tokenMint}?chain=solana&viewMode=pair&chartInterval=15&chartType=Candle&chartTimezone=Etc%2FUTC&chartLeftToolbar=show&theme=dark&cssCustomProperties=--tv-color-platform-background%3A%23101219&chartOverrides=paneProperties.backgroundType%3Asolid&chartOverrides=mainSeriesProperties.candleStyle.upColor%3A%2349ddb3&chartOverrides=mainSeriesProperties.candleStyle.borderUpColor%3A%2343ffca`;

  return (
    <div className="rounded-xl border border-border bg-surface/50 backdrop-blur-sm overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-white">Price Chart</h3>
      </div>
      <div className="relative w-full" style={{ height: "600px" }}>
        <iframe
          src={chartUrl}
          className="absolute inset-0 w-full h-full"
          frameBorder="0"
          allowFullScreen
          title="Birdeye Price Chart"
        />
      </div>
    </div>
  );
};
