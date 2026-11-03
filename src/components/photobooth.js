import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

const frameOptions = [
    "/assets/frames/frames-white.png",
    "/assets/frames/frames-white-ma.png"
];

const videoConstraints = { width: 953, height: 599, facingMode: "user" };
const SLOT_WIDTH = 953;
const SLOT_HEIGHT = 599;

export default function Photobooth() {
    const webcamRef = useRef(null);
    const CanvaRef  = useRef(null);
    const frameImgRef = useRef(null);

    const slots = [
        { x: 123, y: 78 },
        { x: 123, y: 697 },
        { x: 123, y: 1286 },
        { x: 123, y: 1885 }
    ];

    const [selectedFrame, setSelectedFrame] = useState(null);
    const [mode, setMode] = useState("photo");

    return (
        <div>
            {frameOptions.map((src) => {
                const isSelected = selectedFrame === src;
                const frameThumb = {
                    width: "160px",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                };

                return (
                    <img
                        key={src}
                        src={src}
                        alt="frame"
                        onClick={() => setSelectedFrame(src)}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.08)";
                            e.currentTarget.style.boxShadow = "0 12px 30px rgba(255,122,162,0.45)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = isSelected ? "scale(1.08)" : "scale(1)";
                            e.currentTarget.style.boxShadow = isSelected
                                ? "0 12px 30px rgba(255,122,162,0.45)"
                                : frameThumb.boxShadow;
                        }}
                        style={{
                            ...frameThumb,
                            transform: isSelected ? "scale(1.08)" : "scale(1)",
                            transition: "transform 0.25s ease, box-shadow 0.25s ease",
                            boxShadow: isSelected
                                ? "0 12px 30px rgba(255,122,162,0.45)"
                                : frameThumb.boxShadow,
                        }}
                    />
                );
            })}
        </div>
    );
}

// styles
const centerCol = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20
};
const topBar = {
    width: 700,
    height: 60,
    position: "relative",
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
}
const buttonStyle = {
    padding: "10px 20px",
    fontSize: 20,
    cursor: "pointer",
    fontFamily: "CantikaCute",
    color: "#8c5b4a",
    border: "2px solid #8c5b4a",
    borderRadius: 8,
    background: "white"
};

const row = { display: "flex", gap: 40, alignItems: "flex-start" };
const frameThumb = {
    width: 180,
    cursor: "pointer",
    borderRadius: 12,
    boxShadow: "0 8px 8px rgba(0,0,0,0.15)"
};

const titleBar = {
    margin: 0,
    lineHeight: "60px",      // vertical center
    textAlign: "center",     // horizontal center
    width: "100%",            // occupy full width of top bar
}

const mainContent = {
    height: 600, // fixed content height
    width: 700,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
}