import React from "react";

interface KartrLineProps {
  width?: number;
  circleSize?: number;
  gap?: number;
  color?: string;
  text?: string;
}

const KartrLine: React.FC<KartrLineProps> = ({
  width = 120,
  circleSize = 20,
  gap = 2,
  color = "#e11d48", // pinkish-red like image
  text = "Kartr",
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Line + Circles */}
      <div
        style={{
          position: "relative",
          width: width,
          height: circleSize,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",

        }}
      >
        {/* Line */}
        <div
          style={{
            position: "absolute",
            left: circleSize + gap,
            right: circleSize + gap,
            height: "6px",
            backgroundColor: color,
          }}
        />

        {/* Left Hollow Circle */}
        <div
          className="rotate-clockwise"
          style={{
            width: circleSize,
            height: circleSize,
            borderRadius: "50%",
            border: `5px dashed ${color}`,
            background: "transparent",
          }}
        />

        {/* Right Hollow Circle */}
        <div
          className="rotate-counterclockwise"
          style={{
            width: circleSize,
            height: circleSize,
            borderRadius: "50%",
            border: `5px dashed ${color}`,
            background: "transparent",
          }}
        />
      </div>

      {/* Text */}
      <span
        style={{
          marginTop: 2,
          fontSize: 14,
          fontWeight: 700,
          color,
          letterSpacing: "0.5px",
        }}
      >
        {text}
      </span>
    </div>
  );
};

export default KartrLine;
