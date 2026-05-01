import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MyBusinessFormation — Florida LLC & Corporation Formation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1C2E44 0%, #1e40af 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Background pattern circles */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "rgba(37,99,235,0.15)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "-60px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(5,150,105,0.12)",
            display: "flex",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            width: "80px",
            height: "80px",
            background: "linear-gradient(135deg, #2563EB, #1C2E44)",
            borderRadius: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "3px solid rgba(255,255,255,0.2)",
            marginBottom: "24px",
          }}
        >
          <span
            style={{
              color: "#fff",
              fontSize: "32px",
              fontWeight: 900,
              letterSpacing: "-1px",
            }}
          >
            FL
          </span>
        </div>

        {/* Wordmark */}
        <div
          style={{
            color: "#fff",
            fontSize: "52px",
            fontWeight: 800,
            letterSpacing: "-1.5px",
            marginBottom: "14px",
            textAlign: "center",
          }}
        >
          MyBusinessFormation
        </div>

        {/* Tagline */}
        <div
          style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: "26px",
            fontWeight: 400,
            textAlign: "center",
            marginBottom: "36px",
            maxWidth: "700px",
          }}
        >
          Florida LLC & Corporation Formation — 100% Online
        </div>

        {/* Pills */}
        <div
          style={{
            display: "flex",
            gap: "14px",
            alignItems: "center",
          }}
        >
          {["Basic $0", "Standard $199", "Premium $299"].map((label) => (
            <div
              key={label}
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1.5px solid rgba(255,255,255,0.25)",
                borderRadius: "40px",
                padding: "10px 24px",
                color: "#fff",
                fontSize: "18px",
                fontWeight: 600,
                display: "flex",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* URL badge */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            color: "rgba(255,255,255,0.45)",
            fontSize: "18px",
            display: "flex",
          }}
        >
          mybusinessformation.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
