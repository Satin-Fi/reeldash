import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#08090b",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 23 11 L 37 25 L 23 39 L 9 25 Z"
            stroke="#8B5CF6"
            strokeWidth="6"
            strokeLinejoin="miter"
          />
          <path
            d="M 41 25 L 55 39 L 41 53 L 27 39 Z"
            stroke="#FFFFFF"
            strokeWidth="6"
            strokeLinejoin="miter"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
