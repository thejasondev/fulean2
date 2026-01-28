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

// Initialize WASM once
let wasmInitialized = false;
async function ensureWasm() {
  if (wasmInitialized) return;
  try {
    // We import the wasm file. Vite handles this as a URL or Asset.
    // But for @resvg/resvg-wasm, we typically need to load it.
    // In some setups, just importing initWasm is enough if we satisfy the loader.
    // For simplicity in Vercel/Node, we rely on the package's index which might require fs/fetch.

    // However, standard @resvg/resvg-wasm usage often expects manual loading in basic envs.
    // Let's try the simplest: `await initWasm(import(".../index_bg.wasm"))` pattern if supported,
    // OR just `await initWasm(fetch(...))`

    // BETTER APPROACH for Vercel/Astro:
    // Use the index_bg.wasm directly from node_modules if possible, or fetch from CDN to be safe and lazy.
    const response = await fetch(
      "https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm",
    );
    const buffer = await response.arrayBuffer();
    await initWasm(buffer);
    wasmInitialized = true;
  } catch (e) {
    console.error("Failed to init Resvg WASM:", e);
  }
}

// Fetch font once
let fontData: ArrayBuffer | null = null;
async function getFont() {
  if (fontData) return fontData;
  const response = await fetch(
    "https://github.com/google/fonts/raw/main/ofl/inter/Inter-Bold.ttf",
  );
  fontData = await response.arrayBuffer();
  return fontData;
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
