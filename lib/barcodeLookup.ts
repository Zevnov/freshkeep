import { supabase } from "@/lib/supabase";

export type BarcodeLookupResult = {
  barcode: string;
  name: string | null;
  quantity: number | null;
  unit: string | null;
  notes: string | null;
};

export async function lookupBarcodeProduct(barcode: string): Promise<BarcodeLookupResult> {
  const code = barcode.trim();
  if (!/^\d{8,14}$/.test(code)) {
    return { barcode: code, name: null, quantity: null, unit: null, notes: "Barcode format not supported." };
  }

  try {
    const invokePromise = supabase.functions.invoke<BarcodeLookupResult>("barcode-lookup", {
      body: { barcode: code },
    });
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("timeout")), 7000);
    });
    const { data, error } = await Promise.race([invokePromise, timeoutPromise]);
    if (error) {
      return { barcode: code, name: null, quantity: null, unit: null, notes: "Could not fetch product details." };
    }
    if (!data || data.barcode !== code) {
      return { barcode: code, name: null, quantity: null, unit: null, notes: "Lookup unavailable right now." };
    }
    return data;
  } catch (error) {
    if (error instanceof Error && error.message === "timeout") {
      return { barcode: code, name: null, quantity: null, unit: null, notes: "Lookup timed out. Please try again." };
    }
    return { barcode: code, name: null, quantity: null, unit: null, notes: "Lookup unavailable right now." };
  }
}
