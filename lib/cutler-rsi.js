/**
 * Cutler's RSI — uses Simple Moving Average instead of Exponential Moving Average.
 * This makes it non-path-dependent unlike Wilder's standard RSI.
 */

export function calculateCutlerRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;

  const gains = [];
  const losses = [];

  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(Math.max(change, 0));
    losses.push(Math.max(-change, 0));
  }

  // We need at least `period` gain/loss values
  if (gains.length < period) return null;

  // Calculate SMA of gains and losses over the last `period` values
  const recentGains = gains.slice(-period);
  const recentLosses = losses.slice(-period);

  const avgGain =
    recentGains.reduce((sum, g) => sum + g, 0) / period;
  const avgLoss =
    recentLosses.reduce((sum, l) => sum + l, 0) / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Calculate Cutler's RSI for the full series (returns array of RSI values).
 * Each RSI[i] uses the SMA of gains/losses ending at index i.
 */
export function calculateCutlerRSISeries(closes, period = 14) {
  if (closes.length < period + 1) return [];

  const gains = [];
  const losses = [];
  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    gains.push(Math.max(change, 0));
    losses.push(Math.max(-change, 0));
  }

  const rsiValues = [];
  for (let i = period - 1; i < gains.length; i++) {
    let sumGain = 0;
    let sumLoss = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumGain += gains[j];
      sumLoss += losses[j];
    }
    const avgGain = sumGain / period;
    const avgLoss = sumLoss / period;

    if (avgLoss === 0) {
      rsiValues.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsiValues.push(100 - 100 / (1 + rs));
    }
  }

  return rsiValues;
}
