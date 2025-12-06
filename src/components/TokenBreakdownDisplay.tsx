import { traceParserService } from '../services/traceParser';

interface TokenBreakdownDisplayProps {
  cacheRead: number;
  cacheWrite: number;
  input: number;
  output: number;
  className?: string;
}

export function TokenBreakdownDisplay({
  cacheRead,
  cacheWrite,
  input,
  output,
  className = '',
}: TokenBreakdownDisplayProps) {
  const totalInput = cacheRead + cacheWrite + input;
  const formatTokenCount = traceParserService.formatTokenCount;

  const formattedTotalInput = formatTokenCount(totalInput);
  const formattedCacheRead = formatTokenCount(cacheRead);
  const formattedCacheWrite = formatTokenCount(cacheWrite);
  const formattedInput = formatTokenCount(input);
  const formattedOutput = formatTokenCount(output);

  return (
    <span className={`whitespace-nowrap ${className}`}>
      <span className="text-data-400">{formattedTotalInput}</span>
      <span className="text-text-muted">
        ({formattedCacheRead}, {formattedCacheWrite}, {formattedInput})/
      </span>
      <span className="text-data-400">{formattedOutput}</span>
    </span>
  );
}
