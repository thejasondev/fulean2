import satori from "satori";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import React from "react";

// Types for our Receipt
interface ReceiptData {
  type: "COMPRA" | "VENTA";
  amount: number;
  currency: string;
  rate: number;
  total: number;
  date: Date;
}

// Initialize WASM once with robust fallback
let wasmInitialized = false;
let wasmInitPromise: Promise<void> | null = null;

async function ensureWasm(): Promise<void> {
  if (wasmInitialized) return;

  // Prevent multiple simultaneous initialization attempts
  if (wasmInitPromise) return wasmInitPromise;

  wasmInitPromise = (async () => {
    // Multiple CDN sources for reliability
    const wasmUrls = [
      "https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm",
      "https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm@2.6.2/index_bg.wasm",
      "https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm",
    ];

    for (const url of wasmUrls) {
      try {
        console.log(`Attempting WASM load from: ${url}`);
        const response = await fetch(url, {
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (!response.ok) {
          console.warn(`WASM fetch failed (${response.status}): ${url}`);
          continue;
        }

        const buffer = await response.arrayBuffer();
        await initWasm(buffer);
        wasmInitialized = true;
        console.log(`WASM initialized successfully from: ${url}`);
        return;
      } catch (e) {
        console.warn(`WASM init failed from ${url}:`, e);
      }
    }

    throw new Error("Failed to load WASM from all sources");
  })();

  return wasmInitPromise;
}

// Fetch font once with fallback
let fontData: ArrayBuffer | null = null;

async function getFont(): Promise<ArrayBuffer> {
  if (fontData) return fontData;

  // Multiple font sources for reliability
  const fontUrls = [
    "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff",
    "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeAmM.woff",
  ];

  for (const url of fontUrls) {
    try {
      console.log(`Attempting font load from: ${url}`);
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.warn(`Font fetch failed (${response.status}): ${url}`);
        continue;
      }

      fontData = await response.arrayBuffer();
      console.log(`Font loaded successfully from: ${url}`);
      return fontData;
    } catch (e) {
      console.warn(`Font load failed from ${url}:`, e);
    }
  }

  throw new Error("Failed to load font from all sources");
}

export async function generateReceiptImage(data: ReceiptData): Promise<Buffer> {
  await ensureWasm();
  const font = await getFont();

  const isBuy = data.type === "COMPRA";
  const statusColor = isBuy ? "#10b981" : "#f59e0b"; // Emerald / Amber
  const bgColor = "#0a0a0a";
  const textColor = "#ffffff";
  const textMuted = "#a1a1aa";

  // Satori Element (JSX)
  const element = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "400px",
        height: "500px",
        backgroundColor: bgColor,
        padding: "20px",
        fontFamily: "Inter",
        color: textColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Card Container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#171717",
          borderRadius: "24px",
          overflow: "hidden",
          border: "1px solid #262626",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "20px",
            backgroundColor: isBuy
              ? "rgba(16, 185, 129, 0.1)"
              : "rgba(245, 158, 11, 0.1)",
            borderBottom: "2px dashed #404040",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", fontSize: 24, fontWeight: 900 }}>
            <span>Fulean</span>
            <span style={{ color: "#34d399" }}>2</span>
          </div>
          <div style={{ fontSize: 12, color: textMuted, marginTop: "5px" }}>
            {data.date.toLocaleDateString("es-CU")} •{" "}
            {data.date.toLocaleTimeString("es-CU")}
          </div>
        </div>

        {/* Badge */}
        <div
          style={{ display: "flex", justifyContent: "center", padding: "20px" }}
        >
          <div
            style={{
              display: "flex",
              padding: "8px 20px",
              borderRadius: "99px",
              border: `1px solid ${statusColor}`,
              color: statusColor,
              backgroundColor: isBuy
                ? "rgba(16, 185, 129, 0.1)"
                : "rgba(245, 158, 11, 0.1)",
              fontSize: 16,
              fontWeight: 800,
            }}
          >
            {data.type}
          </div>
        </div>

        {/* Info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "0 30px",
            gap: "10px",
            width: "100%",
          }}
        >
          {/* Amount */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <span style={{ color: textMuted, fontSize: 16 }}>Monto</span>
            <span style={{ fontSize: 22, fontWeight: 700 }}>
              {data.amount.toFixed(2)} {data.currency}
            </span>
          </div>

          {/* Rate */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <span style={{ color: textMuted, fontSize: 16 }}>Tasa</span>
            <span style={{ fontSize: 18, color: "#d4d4d8" }}>
              1 {data.currency} = {data.rate} CUP
            </span>
          </div>

          {/* Divider */}
          <div
            style={{
              height: "1px",
              backgroundColor: "#404040",
              margin: "10px 0",
              borderStyle: "dashed",
              width: "100%",
            }}
          />

          {/* Total */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <span style={{ color: textMuted, fontSize: 16 }}>Total</span>
            <span style={{ fontSize: 32, fontWeight: 900, color: statusColor }}>
              {data.total.toLocaleString("es-CU")} CUP
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "auto",
            padding: "15px",
            backgroundColor: "rgba(255,255,255,0.03)",
            display: "flex",
            justifyContent: "center",
            borderTop: "1px solid #262626",
            width: "100%",
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: textMuted,
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            Comprobante Digital
          </span>
        </div>
      </div>
    </div>
  );

  const svg = await satori(element, {
    width: 400,
    height: 500,
    fonts: [
      {
        name: "Inter",
        data: font!,
        weight: 700,
        style: "normal",
      },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 800 },
  });

  return Buffer.from(resvg.render().asPng());
}
