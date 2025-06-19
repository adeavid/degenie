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
            // Set up WebSocket connection for real-time updates
            const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000'}/ws`);
            
            ws.onopen = () => {
              console.log('[TradingView] WebSocket connected');
              ws.send(JSON.stringify({ type: 'subscribe', tokenAddress: symbolInfo.name }));
            };
            
            ws.onmessage = (event) => {
              const data = JSON.parse(event.data);
              if (data.type === 'tradeUpdate' && data.tokenAddress === symbolInfo.name) {
                // Update the current candle with new trade data
                const timestamp = Math.floor(data.timestamp / 1000);
                const resolutionSeconds = parseInt(resolution) * 60; // Convert minutes to seconds
                const barTime = Math.floor(timestamp / resolutionSeconds) * resolutionSeconds;
                
                onRealtimeCallback({
                  time: barTime * 1000,
                  open: data.open || data.price,
                  high: data.high || data.price,
                  low: data.low || data.price,
                  close: data.price,
                  volume: data.volume || data.solAmount
                });
              }
            };
            
            // Store WebSocket for cleanup
            (window as any)[`tv_ws_${subscriberUID}`] = ws;
            
            // Fallback polling for redundancy
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
            }, 15000); // Update every 15 seconds as backup
            
            // Store interval ID for cleanup
            (window as any)[`tv_sub_${subscriberUID}`] = intervalId;
          },
          
          unsubscribeBars: (subscriberUID) => {
            console.log('[TradingView] unsubscribeBars:', subscriberUID);
            
            // Close WebSocket
            const ws = (window as any)[`tv_ws_${subscriberUID}`];
            if (ws) {
              ws.close();
              delete (window as any)[`tv_ws_${subscriberUID}`];
            }
            
            // Clear interval
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
        interval: '5' as any, // 5 minute default like pump.fun
        container: containerRef.current,
        library_path: '/charting_library/',
        locale: 'en',
        disabled_features: [
          'header_symbol_search',
          'symbol_search_hot_key',
          'header_compare',
          'use_localstorage_for_settings',
          'save_chart_properties_to_local_storage',
          'header_saveload',
          'header_undo_redo',
          'header_screenshot',
          'go_to_date',
          'compare_symbol',
          'border_around_the_chart',
          'remove_library_container_border',
          'legend_widget'
        ],
        enabled_features: [
          'hide_left_toolbar_by_default',
          'hide_volume_ma',
          'dont_show_boolean_study_arguments',
          'hide_last_na_study_output',
          'same_data_requery',
          'side_toolbar_in_fullscreen_mode',
          'disable_resolution_rebuild',
          'use_localstorage_for_studies'
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
          'paneProperties.vertGridProperties.color': '#1a1a1a',
          'paneProperties.horzGridProperties.color': '#1a1a1a',
          'paneProperties.crossHairProperties.color': '#758696',
          'scalesProperties.lineColor': '#2B2B43',
          'scalesProperties.textColor': '#B2B5BE',
          'mainSeriesProperties.candleStyle.upColor': '#0ECB81',
          'mainSeriesProperties.candleStyle.downColor': '#F6465D',
          'mainSeriesProperties.candleStyle.borderUpColor': '#0ECB81',
          'mainSeriesProperties.candleStyle.borderDownColor': '#F6465D',
          'mainSeriesProperties.candleStyle.wickUpColor': '#0ECB81',
          'mainSeriesProperties.candleStyle.wickDownColor': '#F6465D',
          'mainSeriesProperties.hollowCandleStyle.upColor': '#0ECB81',
          'mainSeriesProperties.hollowCandleStyle.downColor': '#F6465D',
          'mainSeriesProperties.haStyle.upColor': '#0ECB81',
          'mainSeriesProperties.haStyle.downColor': '#F6465D',
          'volumePaneSize': 'medium',
          'paneProperties.legendProperties.showStudyArguments': false,
          'paneProperties.legendProperties.showStudyTitles': true,
          'paneProperties.legendProperties.showStudyValues': true,
          'paneProperties.legendProperties.showSeriesTitle': true,
          'paneProperties.legendProperties.showSeriesOHLC': true,
          'paneProperties.legendProperties.showLegend': true
        },
        custom_css_url: '/tradingview-custom.css',
        loading_screen: { backgroundColor: '#0a0a0a', foregroundColor: '#0ECB81' },
        custom_formatters: {
          timeFormatter: {
            format: (date: any) => {
              const _date = new Date(date);
              return _date.toLocaleTimeString();
            }
          },
          dateFormatter: {
            format: (date: any) => {
              const _date = new Date(date);
              return _date.toLocaleDateString();
            }
          }
        },
        time_frames: [
          { text: "1m", resolution: "1", description: "1 minute" },
          { text: "5m", resolution: "5", description: "5 minutes" },
          { text: "15m", resolution: "15", description: "15 minutes" },
          { text: "1h", resolution: "60", description: "1 hour" },
          { text: "4h", resolution: "240", description: "4 hours" },
          { text: "1d", resolution: "1D", description: "1 day" }
        ]
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
      <div ref={containerRef} className="w-full h-[500px]" style={{ minHeight: '500px' }} />
    </div>
  );
}