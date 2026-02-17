import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { passcode } = await request.json();
    const correct = (process.env.SCANNER_PASSCODE || "lindsey").toLowerCase();

    if (passcode.toLowerCase().trim() === correct) {
      const response = NextResponse.json({ ok: true });
      response.cookies.set("rons-scanner-auth", "authenticated", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
      return response;
    }

    return NextResponse.json({ ok: false }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
