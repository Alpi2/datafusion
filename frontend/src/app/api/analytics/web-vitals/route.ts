import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    // For development, log the received payload to the server console.
    // In production you would persist or forward this to your analytics backend.
    // Keep this lightweight so the endpoint always returns 200 for beacons.
    // eslint-disable-next-line no-console
    console.log("[web-vitals] received:", body);
    return NextResponse.json({ received: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("/api/analytics/web-vitals error", err);
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
