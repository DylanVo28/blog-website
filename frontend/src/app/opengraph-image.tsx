import { ImageResponse } from "next/og";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          background:
            "linear-gradient(135deg, rgb(24, 59, 45), rgb(36, 83, 62) 45%, rgb(139, 182, 90))",
          color: "white",
          padding: "64px",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            fontSize: 28,
            letterSpacing: 6,
            textTransform: "uppercase",
            opacity: 0.9,
          }}
        >
          Inkline
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "900px" }}>
          <div style={{ fontSize: 84, lineHeight: 1.02, fontWeight: 700 }}>{APP_NAME}</div>
          <div style={{ fontSize: 34, lineHeight: 1.45, opacity: 0.88 }}>{APP_DESCRIPTION}</div>
        </div>

        <div style={{ fontSize: 28, opacity: 0.8 }}>Profile • Admin • Questions • Wallet</div>
      </div>
    ),
    size,
  );
}
