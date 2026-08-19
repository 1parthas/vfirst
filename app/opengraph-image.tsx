import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "VFirst Fresh & Natural - Pure. Natural. Hygienic.";
export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

const logoUrl = "https://vfirstindia.com/vfirst-logo.png";

export default async function Image() {
  const background = await readFile(
    join(process.cwd(), "public/vfirst-surreal-spice-panorama.png")
  );
  const backgroundSrc = `data:image/png;base64,${background.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#07100a",
          color: "#fffdf8",
          display: "flex",
          height: "100%",
          overflow: "hidden",
          position: "relative",
          width: "100%"
        }}
      >
        <img
          alt=""
          height="630"
          src={backgroundSrc}
          style={{
            height: "100%",
            objectFit: "cover",
            position: "absolute",
            width: "100%"
          }}
          width="1200"
        />
        <div
          style={{
            background:
              "linear-gradient(90deg, rgba(5,13,7,0.9) 0%, rgba(5,13,7,0.66) 45%, rgba(5,13,7,0.2) 100%)",
            display: "flex",
            inset: 0,
            position: "absolute"
          }}
        />
        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(5,13,7,0.08), rgba(5,13,7,0.76))",
            display: "flex",
            inset: 0,
            position: "absolute"
          }}
        />

        <div
          style={{
            background: "rgba(255,253,248,0.92)",
            border: "1px solid rgba(255,255,255,0.78)",
            borderRadius: 46,
            display: "flex",
            height: 164,
            left: 72,
            padding: "22px 34px",
            position: "absolute",
            top: 58,
            width: 402
          }}
        >
          <img
            alt="VFirst"
            height="120"
            src={logoUrl}
            style={{
              height: 120,
              objectFit: "contain",
              width: 294
            }}
            width="294"
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            left: 76,
            position: "absolute",
            top: 262,
            width: 720
          }}
        >
          <div
            style={{
              alignItems: "center",
              background: "rgba(255,253,248,0.13)",
              border: "1px solid rgba(255,255,255,0.28)",
              borderRadius: 999,
              display: "flex",
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 5,
              lineHeight: 1,
              padding: "13px 20px",
              textTransform: "uppercase",
              width: 342
            }}
          >
            Fresh & Natural
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 82,
              fontWeight: 500,
              letterSpacing: -1,
              lineHeight: 0.96,
              marginTop: 24
            }}
          >
            <span>Pure. Natural.</span>
            <span>Hygienic.</span>
          </div>
          <div
            style={{
              color: "rgba(255,253,248,0.88)",
              display: "flex",
              fontSize: 30,
              fontWeight: 400,
              lineHeight: 1.28,
              marginTop: 26,
              width: 680
            }}
          >
            Premium natural products, fresh spice blends, and hygienic everyday
            essentials from VFirst.
          </div>
        </div>

        <div
          style={{
            alignItems: "center",
            background: "rgba(255,253,248,0.16)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 999,
            bottom: 48,
            color: "#fffdf8",
            display: "flex",
            fontSize: 22,
            fontWeight: 700,
            height: 56,
            justifyContent: "center",
            padding: "0 24px",
            position: "absolute",
            right: 58
          }}
        >
          vfirst-pi.vercel.app
        </div>
      </div>
    ),
    size
  );
}
