import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse, type NextRequest } from "next/server";
import { VFIRST_API_BASE } from "@/lib/vfirst-api";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function targetUrl(request: NextRequest) {
  const target = new URL("/api/products", VFIRST_API_BASE);

  request.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  return target.toString();
}

async function fetchWithCurl(url: string) {
  const { stdout } = await execFileAsync("curl", [
    "-sS",
    "-L",
    "--max-time",
    "10",
    url
  ]);

  return JSON.parse(stdout) as unknown;
}

export async function GET(request: NextRequest) {
  const url = targetUrl(request);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json"
      },
      signal: AbortSignal.timeout(7000)
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: `VFirst API responded with ${response.status}` },
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    try {
      return NextResponse.json(await fetchWithCurl(url));
    } catch {
      return NextResponse.json(
        { success: false, message: "Unable to reach VFirst product API" },
        { status: 502 }
      );
    }
  }
}
