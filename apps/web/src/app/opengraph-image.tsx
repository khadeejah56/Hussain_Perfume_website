import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#171717",
          color: "#ffffff",
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 8, color: "#cba052", textTransform: "uppercase" }}>
          Hussain Perfumes
        </div>
        <div style={{ width: 64, height: 1, background: "#7d5926", marginTop: 20, marginBottom: 20 }} />
        <div style={{ fontSize: 56, fontFamily: "serif", textAlign: "center", padding: "0 60px" }}>
          A scent that stays with you
        </div>
      </div>
    ),
    size,
  );
}
