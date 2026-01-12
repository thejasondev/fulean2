import type { APIRoute } from "astro";

// ============================================
// El Toque API Proxy
// Securely proxies requests to El Toque API
// Hides API token from client
// ============================================

// Disable prerendering - this route must run on the server
export const prerender = false;

const ELTOQUE_API_URL = "https://tasas.eltoque.com/v1/trmi";

export const GET: APIRoute = async () => {
  const token = import.meta.env.ELTOQUE_API_TOKEN;

  // If no token configured, return mock data for development
  if (!token || token === "your_token_here") {
    console.warn("El Toque API token not configured, using mock data");
    return new Response(
      JSON.stringify({
        USD: 460,
        EUR: 505,
        MLC: 400,
        CAD: 300,
        ZELLE: 457,
        CLA: 427,
        mock: true,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
        },
      }
    );
  }

  try {
    console.log("Fetching El Toque rates with token...");

    const response = await fetch(ELTOQUE_API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("El Toque API error:", response.status, errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch rates",
          status: response.status,
          details: errorText,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    console.log("El Toque raw response:", JSON.stringify(data, null, 2));

    // Pass through the raw data - let frontend parse it
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("El Toque API fetch error:", error);
    return new Response(
      JSON.stringify({ error: "Network error", details: String(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
