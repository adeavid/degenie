# Lightweight Charts v5 Migration Summary

## Key Changes in v5

### 1. Series Creation API
The series creation API has changed from method-based to a unified `addSeries()` approach:

**Old (v4):**
```javascript
const candlestickSeries = chart.addCandlestickSeries(options);
const histogramSeries = chart.addHistogramSeries(options);
```

**New (v5):**
```javascript
import { CandlestickSeries, HistogramSeries } from 'lightweight-charts';

const candlestickSeries = chart.addSeries(CandlestickSeries, options);
const histogramSeries = chart.addSeries(HistogramSeries, options);
```

### 2. Import Structure
The series definitions are exported as named exports:
- `CandlestickSeries` (which is actually an alias for `candlestickSeries`)
- `HistogramSeries` (which is actually an alias for `histogramSeries`)
- `AreaSeries`, `BarSeries`, `BaselineSeries`, `LineSeries`

### 3. TypeScript Types
The types are still available for TypeScript usage:
- `IChartApi` - The main chart interface
- `ISeriesApi<T>` - The series interface
- `CandlestickData`, `HistogramData`, etc. - Data types

## Implementation in Our Code

### LightweightChart.tsx
- Uses dynamic imports to avoid SSR issues
- Correctly imports and uses `CandlestickSeries` and `HistogramSeries` from the dynamic import
- Uses `chart.addSeries(CandlestickSeries, options)` syntax

### TradingViewChart.tsx
- Imports `CandlestickSeries` and `HistogramSeries` as named exports
- Uses `chart.addSeries(CandlestickSeries, options)` syntax
- Maintains proper TypeScript typing with `ISeriesApi<'Candlestick'>`

## Common Issues and Solutions

1. **Error: `addCandlestickSeries is not a function`**
   - Solution: Use `chart.addSeries(CandlestickSeries, options)` instead

2. **Error: `CandlestickSeries is not defined`**
   - Solution: Import it from 'lightweight-charts': `import { CandlestickSeries } from 'lightweight-charts'`

3. **SSR Issues**
   - Solution: Use dynamic imports as shown in LightweightChart.tsx

## Testing
Both chart components have been updated to use the correct v5 API and should now render properly with lightweight-charts v5.0.7.