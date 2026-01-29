const API_URL = "https://api.hyperliquid.xyz/info";
const REFRESH_MS = 15000;

const elements = {
  apiStatus: document.getElementById("api-status"),
  lastUpdated: document.getElementById("last-updated"),
  refreshButton: document.getElementById("refresh-button"),
  hypePrice: document.getElementById("hype-price"),
  hypeChange: document.getElementById("hype-change"),
  hypeVolume: document.getElementById("hype-volume"),
  hypeOpenInterest: document.getElementById("hype-open-interest"),
  hypeFunding: document.getElementById("hype-funding"),
  totalVolume: document.getElementById("total-volume"),
  totalOpenInterest: document.getElementById("total-open-interest"),
  marketCount: document.getElementById("market-count"),
  apiHealth: document.getElementById("api-health"),
  annualVolume: document.getElementById("annual-volume"),
  annualFees: document.getElementById("annual-fees"),
  tokenCashflow: document.getElementById("token-cashflow"),
  dcfValue: document.getElementById("dcf-value"),
  impliedPrice: document.getElementById("implied-price"),
  impliedMarketCap: document.getElementById("implied-market-cap"),
  priceUpside: document.getElementById("price-upside"),
  useLiveVolume: document.getElementById("use-live-volume"),
  customDailyVolume: document.getElementById("custom-daily-volume"),
  feeRate: document.getElementById("fee-rate"),
  tokenShare: document.getElementById("token-share"),
  growthRate: document.getElementById("growth-rate"),
  discountRate: document.getElementById("discount-rate"),
  terminalMultiple: document.getElementById("terminal-multiple"),
  forecastYears: document.getElementById("forecast-years"),
  circulatingSupply: document.getElementById("circulating-supply"),
};

const state = {
  stats: null,
  hypeSpot: null,
};

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const usdPriceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 4,
});

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

function toNumber(value) {
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCompact(value, suffix = "") {
  if (!Number.isFinite(value)) {
    return "--";
  }
  return `${compactFormatter.format(value)}${suffix}`;
}

function formatUsd(value, compact = false) {
  if (!Number.isFinite(value)) {
    return "--";
  }
  if (compact) {
    return `$${compactFormatter.format(value)}`;
  }
  return usdFormatter.format(value);
}

function formatUsdPrice(value) {
  if (!Number.isFinite(value)) {
    return "--";
  }
  return usdPriceFormatter.format(value);
}

function formatPercent(value, decimals = 2) {
  if (!Number.isFinite(value)) {
    return "--";
  }
  return `${value.toFixed(decimals)}%`;
}

function updateStatus(status, color) {
  elements.apiStatus.textContent = status;
  elements.apiStatus.style.background = color;
}

function updateLastUpdated(timestamp) {
  const date = timestamp ? new Date(timestamp) : new Date();
  elements.lastUpdated.textContent = `Last updated: ${date.toLocaleTimeString()}`;
}

async function fetchExchangeStats() {
  const start = performance.now();
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "metaAndAssetCtxs" }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const [meta, ctxs] = data;
  const universe = meta.universe || [];
  const hypeIndex = universe.findIndex((asset) => asset.name === "HYPE");
  const hypeCtx = hypeIndex >= 0 ? ctxs[hypeIndex] : null;

  const totalVolume = ctxs.reduce(
    (sum, ctx) => sum + toNumber(ctx.dayNtlVlm),
    0
  );
  const totalOpenInterest = ctxs.reduce(
    (sum, ctx) => sum + toNumber(ctx.openInterest),
    0
  );

  const hypePrice = hypeCtx
    ? toNumber(hypeCtx.midPx || hypeCtx.markPx || hypeCtx.oraclePx)
    : null;
  const hypePrevPrice = hypeCtx ? toNumber(hypeCtx.prevDayPx) : null;
  const hypeChange =
    hypePrice && hypePrevPrice ? (hypePrice - hypePrevPrice) / hypePrevPrice : null;

  const latency = performance.now() - start;

  return {
    totalVolume,
    totalOpenInterest,
    marketCount: universe.length,
    hype: hypeCtx
      ? {
          price: hypePrice,
          change: hypeChange,
          volume: toNumber(hypeCtx.dayNtlVlm),
          openInterest: toNumber(hypeCtx.openInterest),
          funding: toNumber(hypeCtx.funding),
        }
      : null,
    latency,
  };
}

function updateStatsUI(stats) {
  if (!stats) {
    return;
  }

  elements.totalVolume.textContent = formatUsd(stats.totalVolume, true);
  elements.totalOpenInterest.textContent = formatCompact(stats.totalOpenInterest);
  elements.marketCount.textContent = formatCompact(stats.marketCount);
  elements.apiHealth.textContent = `${Math.round(stats.latency)} ms`;

  if (!stats.hype) {
    elements.hypePrice.textContent = "--";
    elements.hypeChange.textContent = "HYPE market not found.";
    elements.hypeChange.classList.remove("trend-up", "trend-down");
    elements.hypeVolume.textContent = "--";
    elements.hypeOpenInterest.textContent = "--";
    elements.hypeFunding.textContent = "--";
    return;
  }

  elements.hypePrice.textContent = formatUsdPrice(stats.hype.price);

  if (Number.isFinite(stats.hype.change)) {
    const changePct = stats.hype.change * 100;
    elements.hypeChange.textContent = `24h change: ${formatPercent(changePct, 2)}`;
    elements.hypeChange.classList.toggle("trend-up", changePct >= 0);
    elements.hypeChange.classList.toggle("trend-down", changePct < 0);
  } else {
    elements.hypeChange.textContent = "24h change: --";
  }

  elements.hypeVolume.textContent = formatUsd(stats.hype.volume, true);
  elements.hypeOpenInterest.textContent = formatCompact(stats.hype.openInterest);
  elements.hypeFunding.textContent = formatPercent(stats.hype.funding * 100, 4);
}

function readInputValue(input, fallback = 0) {
  const value = toNumber(input.value);
  return Number.isFinite(value) ? value : fallback;
}

function computeDCF(params) {
  let cashflow = params.baseCashflow;
  let discounted = 0;

  for (let year = 1; year <= params.years; year += 1) {
    if (year > 1) {
      cashflow *= 1 + params.growthRate;
    }
    const discountFactor = Math.pow(1 + params.discountRate, year);
    discounted += cashflow / discountFactor;
  }

  const terminalValue = cashflow * params.terminalMultiple;
  const terminalPV = terminalValue / Math.pow(1 + params.discountRate, params.years);

  return discounted + terminalPV;
}

function updateModel() {
  const useLiveVolume = elements.useLiveVolume.checked;
  elements.customDailyVolume.disabled = useLiveVolume;

  const liveVolume = state.stats ? state.stats.totalVolume : null;
  const hasLiveVolume = Number.isFinite(liveVolume);
  const customDailyVolume = readInputValue(elements.customDailyVolume, 0);
  const dailyVolume = useLiveVolume && hasLiveVolume ? liveVolume : customDailyVolume;

  const feeRatePct = readInputValue(elements.feeRate, 0);
  const tokenSharePct = readInputValue(elements.tokenShare, 0);
  const growthRatePct = readInputValue(elements.growthRate, 0);
  const discountRatePct = readInputValue(elements.discountRate, 0);
  const terminalMultiple = Math.max(0, readInputValue(elements.terminalMultiple, 0));
  const years = Math.max(1, Math.round(readInputValue(elements.forecastYears, 5)));
  const supply = Math.max(0, readInputValue(elements.circulatingSupply, 0));

  const annualVolume = dailyVolume * 365;
  const feeRevenue = annualVolume * (feeRatePct / 100);
  const tokenCashflow = feeRevenue * (tokenSharePct / 100);

  const dcfValue = computeDCF({
    baseCashflow: tokenCashflow,
    growthRate: growthRatePct / 100,
    discountRate: discountRatePct / 100,
    terminalMultiple,
    years,
  });

  const impliedPrice = supply > 0 ? dcfValue / supply : null;
  const impliedMarketCap = supply > 0 && Number.isFinite(impliedPrice) ? impliedPrice * supply : null;

  elements.annualVolume.textContent = formatUsd(annualVolume, true);
  elements.annualFees.textContent = formatUsd(feeRevenue, true);
  elements.tokenCashflow.textContent = formatUsd(tokenCashflow, true);
  elements.dcfValue.textContent = formatUsd(dcfValue, true);
  elements.impliedPrice.textContent = formatUsdPrice(impliedPrice);
  elements.impliedMarketCap.textContent = formatUsd(impliedMarketCap, true);

  if (state.hypeSpot && Number.isFinite(impliedPrice)) {
    const upside = (impliedPrice - state.hypeSpot) / state.hypeSpot;
    elements.priceUpside.textContent = formatPercent(upside * 100, 2);
  } else {
    elements.priceUpside.textContent = "--";
  }
}

async function refreshData() {
  updateStatus("Refreshing...", "#2563eb");

  try {
    const stats = await fetchExchangeStats();
    state.stats = stats;
    state.hypeSpot = stats.hype ? stats.hype.price : null;
    updateStatsUI(stats);
    updateModel();
    updateStatus("Live", "#16a34a");
    updateLastUpdated();
  } catch (error) {
    updateStatus("API error", "#dc2626");
    elements.apiHealth.textContent = "Unavailable";
    updateModel();
  }
}

function registerInputHandlers() {
  const inputs = [
    elements.useLiveVolume,
    elements.customDailyVolume,
    elements.feeRate,
    elements.tokenShare,
    elements.growthRate,
    elements.discountRate,
    elements.terminalMultiple,
    elements.forecastYears,
    elements.circulatingSupply,
  ];

  inputs.forEach((input) => {
    input.addEventListener("input", updateModel);
    input.addEventListener("change", updateModel);
  });

  elements.refreshButton.addEventListener("click", refreshData);
}

registerInputHandlers();
updateModel();
refreshData();
setInterval(refreshData, REFRESH_MS);
