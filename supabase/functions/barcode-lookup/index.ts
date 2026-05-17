import { createClient } from "npm:@supabase/supabase-js@2";

type BarcodeLookupResult = {
  barcode: string;
  name: string | null;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
};

type OpenFoodFactsProduct = {
  product_name?: string;
  brands?: string;
  quantity?: string;
};

type OpenFoodFactsResponse = {
  status: number;
  product?: OpenFoodFactsProduct;
};

type CacheRow = {
  barcode: string;
  response: BarcodeLookupResult;
  expires_at: string;
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

function parseQuantity(raw: string | undefined): { quantity: number | null; unit: string | null } {
  if (!raw) return { quantity: null, unit: null };
  const trimmed = raw.trim();
  const m = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)$/);
  if (!m) return { quantity: null, unit: trimmed.slice(0, 12) || null };
  const value = Number(m[1].replace(",", "."));
  if (!Number.isFinite(value)) return { quantity: null, unit: m[2].toLowerCase() };
  return { quantity: value, unit: m[2].toLowerCase() };
}

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeResult(barcode: string, body: OpenFoodFactsResponse): BarcodeLookupResult {
  if (body.status !== 1 || !body.product) {
    return { barcode, name: null, quantity: null, unit: null, notes: "No product found for this barcode." };
  }

  const { quantity, unit } = parseQuantity(body.product.quantity);
  const name = body.product.product_name?.trim() || null;
  const brand = body.product.brands?.split(",")[0]?.trim();
  const notes = brand ? `Brand: ${brand}` : null;

  return { barcode, name, quantity, unit, notes };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return json({ error: "unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "server_not_configured" }, 500);

  const callerToken = authHeader.slice(7);
  const callerClient = createClient(supabaseUrl, callerToken, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error: authError } = await callerClient.auth.getUser();
  if (authError || !user) return json({ error: "unauthorized" }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let barcode = "";
  try {
    const payload = (await req.json()) as { barcode?: unknown };
    barcode = typeof payload.barcode === "string" ? payload.barcode.trim() : "";
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  if (!/^\d{8,14}$/.test(barcode)) {
    return json({ barcode, name: null, quantity: null, unit: null, notes: "Barcode format not supported." }, 200);
  }

  const now = new Date().toISOString();
  const { data: cachedRow } = await admin
    .from("barcode_lookup_cache")
    .select("barcode, response, expires_at")
    .eq("barcode", barcode)
    .gt("expires_at", now)
    .maybeSingle();
  const cached = cachedRow as CacheRow | null;

  if (cached?.response) return json(cached.response, 200);

  try {
    const res = await fetchWithTimeout(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
      5000
    );
    if (!res.ok) {
      return json({ barcode, name: null, quantity: null, unit: null, notes: "Could not fetch product details." }, 502);
    }

    const body = (await res.json()) as OpenFoodFactsResponse;
    const result = normalizeResult(barcode, body);
    const cacheHours = result.name ? 24 * 7 : 24;

    await admin.from("barcode_lookup_cache").upsert({
      barcode,
      response: result,
      source: "open_food_facts",
      fetched_at: new Date().toISOString(),
      expires_at: hoursFromNow(cacheHours),
    });

    return json(result, 200);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return json({ barcode, name: null, quantity: null, unit: null, notes: "Lookup timed out. Please try again." }, 504);
    }
    return json({ barcode, name: null, quantity: null, unit: null, notes: "Lookup unavailable right now." }, 502);
  }
});
