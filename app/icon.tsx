import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default async function Icon() {
  try {
    const logoPath = join(process.cwd(), "public", "logo.jpeg");
    const logoData = await readFile(logoPath);
    const logoBase64 = `data:image/jpeg;base64,${logoData.toString("base64")}`;

    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
          borderRadius: "50%",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoBase64}
          alt="Nihal Tech"
          width="64"
          height="64"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>,
      {
        ...size,
      },
    );
  } catch {
    // Fallback: return a simple colored circle
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1f4b99",
          borderRadius: "50%",
          color: "white",
          fontSize: "32px",
          fontWeight: "bold",
        }}
      >
        N
      </div>,
      {
        ...size,
      },
    );
  }
}
