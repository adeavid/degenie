'use client';

import { useEffect, useRef, useState } from 'react';
import { widget, ChartingLibraryWidgetOptions, IChartingLibraryWidget } from '../../public/charting_library';

interface RealTradingViewChartProps {
  tokenAddress: string;
  symbol: string;
  className?: string;
}

export function RealTradingViewChart({ tokenAddress, symbol, className }: RealTradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<IChartingLibraryWidget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      const widgetOptions: ChartingLibraryWidgetOptions = {
        // Required parameters
        symbol: tokenAddress,
        datafeed: {
          onReady: (callback) => {
            console.log('[TradingView] onReady called');
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tradingview/config`)
              .then(res => res.json())
              .then(config => {
                callback(config);
              })
              .catch(err => {
                console.error('[TradingView] Config error:', err);
                setHasError(true);
              });
          },
          
          searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
            console.log('[TradingView] searchSymbols:', userInput);
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tradingview/search?query=${userInput}&exchange=${exchange}&type=${symbolType}`)
              .then(res => res.json())
              .then(data => onResultReadyCallback(data))
              .catch(() => onResultReadyCallback([]));
          },
          
          resolveSymbol: (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
            console.log('[TradingView] resolveSymbol:', symbolName);
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tradingview/symbols?symbol=${symbolName}`)
              .then(res => res.json())
              .then(data => {
                if (data.s === 'no_data') {
                  onResolveErrorCallback('No data');
                } else {
                  onSymbolResolvedCallback(data);
                }
              })
              .catch(err => {
                console.error('[TradingView] Symbol error:', err);
                onResolveErrorCallback(err.message);
              });
          },
          
          getBars: (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
            console.log('[TradingView] getBars:', { symbolInfo: symbolInfo.name, resolution, from: periodParams.from, to: periodParams.to });
            const { from, to, firstDataRequest } = periodParams;
            
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tradingview/history?symbol=${symbolInfo.name}&resolution=${resolution}&from=${from}&to=${to}`)
              .then(res => res.json())
              .then(data => {
                if (data.s === 'no_data') {
                  onHistoryCallback([], { noData: true });
                } else if (data.s === 'ok') {
                  const bars = [];
                  for (let i = 0; i < data.t.length; i++) {
                    bars.push({
                      time: data.t[i] * 1000, // Convert to milliseconds
                      open: data.o[i],
                      high: data.h[i],
                      low: data.l[i],
                      close: data.c[i],
                      volume: data.v[i]
                    });
                  }
                  console.log(`[TradingView] Loaded ${bars.length} bars`);
                  onHistoryCallback(bars, { noData: false });
                } else {
                  console.error('[TradingView] History error:', data);
                  onErrorCallback('Failed to load data');
                }
              })
              .catch(err => {
                console.error('[TradingView] History error:', err);
                onErrorCallback(err.message);
              });
          },
          
          subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) => {
            console.log('[TradingView] subscribeBars:', symbolInfo.name);
            // WebSocket subscription would go here
            // For now, poll for updates
            const intervalId = setInterval(() => {
              const now = Math.floor(Date.now() / 1000);
              fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tradingview/history?symbol=${symbolInfo.name}&resolution=${resolution}&from=${now - 300}&to=${now}`)
                .then(res => res.json())
                .then(data => {
                  if (data.s === 'ok' && data.t.length > 0) {
                    const lastIndex = data.t.length - 1;
                    onRealtimeCallback({
                      time: data.t[lastIndex] * 1000,
                      open: data.o[lastIndex],
                      high: data.h[lastIndex],
                      low: data.l[lastIndex],
                      close: data.c[lastIndex],
                      volume: data.v[lastIndex]
                    });
                  }
                })
                .catch(console.error);
            }, 5000); // Update every 5 seconds
            
            // Store interval ID for cleanup
            (window as any)[`tv_sub_${subscriberUID}`] = intervalId;
          },
          
          unsubscribeBars: (subscriberUID) => {
            console.log('[TradingView] unsubscribeBars:', subscriberUID);
            const intervalId = (window as any)[`tv_sub_${subscriberUID}`];
            if (intervalId) {
              clearInterval(intervalId);
              delete (window as any)[`tv_sub_${subscriberUID}`];
            }
          },
          
          getServerTime: (callback) => {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/tradingview/time`)
              .then(res => res.json())
              .then(time => callback(time))
              .catch(() => callback(Math.floor(Date.now() / 1000)));
          }
        },
        interval: '15' as any,
        container: containerRef.current,
        library_path: '/charting_library/',
        locale: 'en',
        disabled_features: [
          'header_symbol_search',
          'symbol_search_hot_key',
          'header_compare',
          'header_saveload',
          'header_screenshot',
          'header_settings',
          'header_indicators',
          'header_chart_type',
          'timeframes_toolbar',
          'main_series_scale_menu',
          'display_market_status'
        ],
        enabled_features: [
          'hide_left_toolbar_by_default',
          'hide_volume_ma'
        ],
        charts_storage_url: 'https://saveload.tradingview.com',
        charts_storage_api_version: '1.1',
        client_id: 'degenie.com',
        user_id: 'public_user',
        fullscreen: false,
        autosize: true,
        theme: 'dark',
        overrides: {
          'paneProperties.background': '#0a0a0a',
          'paneProperties.backgroundType': 'solid',
          'paneProperties.vertGridProperties.color': '#1f2937',
          'paneProperties.horzGridProperties.color': '#1f2937',
          'scalesProperties.lineColor': '#374151',
          'scalesProperties.textColor': '#d1d5db',
          'mainSeriesProperties.candleStyle.upColor': '#10b981',
          'mainSeriesProperties.candleStyle.downColor': '#ef4444',
          'mainSeriesProperties.candleStyle.borderUpColor': '#10b981',
          'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
          'mainSeriesProperties.candleStyle.wickUpColor': '#10b981',
          'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444'
        },
        custom_css_url: '/tradingview-custom.css',
        loading_screen: { backgroundColor: '#0a0a0a' }
      };

      const widget = new window.TradingView.widget(widgetOptions);
      
      widget.onChartReady(() => {
        console.log('[TradingView] Chart ready');
        setIsLoading(false);
        widgetRef.current = widget;
      });

    } catch (error) {
      console.error('[TradingView] Widget error:', error);
      setHasError(true);
      setIsLoading(false);
    }

    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          console.log('[TradingView] Cleanup error:', e);
        }
        widgetRef.current = null;
      }
    };
  }, [tokenAddress, symbol]);

  if (hasError) {
    return (
      <div className={`bg-black rounded-xl border border-gray-800 p-8 text-center ${className}`}>
        <p className="text-red-400">Failed to load chart</p>
        <p className="text-sm text-gray-500 mt-2">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-xl border border-gray-800 overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading chart...</p>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-[500px]" />
    </div>
  );
}