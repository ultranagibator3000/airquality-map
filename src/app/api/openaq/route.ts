
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get("country") ?? "US";
    const limit = searchParams.get("limit") ?? "50";
    const apiUrl = `https://api.openaq.org/v3/locations?country=${encodeURIComponent(country)}&limit=${encodeURIComponent(limit)}`;
    const headers: Record<string, string> = {};
    if (process.env.OPENAQ_API_KEY) headers["X-API-Key"] = process.env.OPENAQ_API_KEY;
    const res = await fetch(apiUrl, { headers });
    const text = await res.text();
    if (!res.ok) return new NextResponse(text, { status: res.status });
    const json = JSON.parse(text);
    return NextResponse.json(json);
  } catch (err: any) {
    return new NextResponse(String(err.message || err), { status: 500 });
  }
}
