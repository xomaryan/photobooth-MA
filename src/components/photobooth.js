import React, { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";

const frameOptions = [
    "/assets/frames/blue-frame.png",
    "/assets/frames/lichtblue-frame.png"
];

const videoConstraints = { width: 953, height: 599, facingMode: "user" };

const SLOT_WIDTH = 953;
const SLOT_HEIGHT = 599;


const frameSlotsMap = {
    "/assets/frames/blue-frame.png": [
        { x: 5, y: 15, width: 380, height: 500 },  
        { x: 5, y: 300, width: 400, height: 520 },  
        { x: 5, y: 560, width: 380, height: 500 },   
        { x: 5, y: 800, width: 380, height: 500 }   
    ],
    "/assets/frames/lichtblue-frame.png": [
        { x: 5, y: 20, width: 380, height: 500 },
        { x: 5, y: 292, width: 380, height: 500 },
        { x: 5, y: 546, width: 380, height: 500 },
        { x: 5, y: 800, width: 380, height: 500 }
    ]
};

export default function Photobooth() {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const frameImgRef = useRef(null);

    const [selectedFrame, setSelectedFrame] = useState(null);
    const [mode, setMode] = useState("photo");

    const [photos, setPhotos] = useState([]);
    const [photoCount, setPhotoCount] = useState(0);
    const [canTakePhoto, setCanTakePhoto] = useState(true);
    const [draggingPhoto, setDraggingPhoto] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [countdown, setCountdown] = useState(null);

    // Haal de juiste slots op basis van het gekozen frame (valt terug op de eerste als er niets is geselecteerd)
    const currentSlots = selectedFrame ? frameSlotsMap[selectedFrame] : frameSlotsMap["/assets/frames/blue-frame.png"];

    const handleBack = () => {
        setSelectedFrame(null);
        setPhotos([]);
        setPhotoCount(0);
        setCanTakePhoto(true);
        setMode("photo");
    };

    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !frameImgRef.current) return;

        const ctx = canvas.getContext("2d");

        const frameWidth = frameImgRef.current.width;
        const frameHeight = frameImgRef.current.height;
        canvas.width = frameWidth;
        canvas.height = frameHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        photos.forEach((p, index) => {
            const slot = currentSlots[index];
            if (!slot) return;

            const drawW = p.img.width * p.scale;
            const drawH = p.img.height * p.scale;
            const dx = slot.x + p.offsetX;
            const dy = slot.y + p.offsetY;

            ctx.save();
            ctx.beginPath();
            ctx.rect(slot.x, slot.y, slot.width, slot.height);
            ctx.clip();
            ctx.drawImage(p.img, dx, dy, drawW, drawH);
            ctx.restore();
        });

        ctx.drawImage(frameImgRef.current, 0, 0, frameWidth, frameHeight);
    }, [photos, currentSlots]);

    // useEffect voor frames
    useEffect(() => {
        if (!selectedFrame) return;
        const img = new Image();
        img.src = selectedFrame;

        img.onload = () => {
            frameImgRef.current = img;
            drawCanvas();
        };
    }, [selectedFrame, drawCanvas]);

    useEffect(() => {
        drawCanvas();
    }, [photos, photoCount, drawCanvas]);

    // photos logica
    const addPhoto = img => {
        if (photoCount >= 4) return;

        const slot = currentSlots[photoCount];
        const scale = slot.width / img.width;
        const drawH = img.height * scale;
        const offsetY = drawH > slot.height ? (slot.height - drawH) / 2 : 0;

        setPhotos(p => [
            ...p,
            { img, slotIndex: photoCount, scale, offsetX: 0, offsetY }
        ]);

        setCanTakePhoto(true);
        setPhotoCount(c => c + 1);
    };

    const takePhotoNow = () => {
        const src = webcamRef.current.getScreenshot();
        if (!src) return;
        const img = new Image();
        img.src = src;
        img.onload = () => addPhoto(img);
    };

    const capturePhoto = () => {
        if (!canTakePhoto || countdown != null) return;

        setCanTakePhoto(false);
        setCountdown(3);

        let current = 3;
        const interval = setInterval(() => {
            current -= 1;

            if (current === 0) {
                clearInterval(interval);
                setCountdown(null);
                takePhotoNow();
            } else {
                setCountdown(current);
            }
        }, 1000);
    };

    const uploadPhoto = e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const img = new window.Image();
            img.src = reader.result;
            img.onload = () => addPhoto(img);
        };

        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const redoLastPhoto = () => {
        if (!photos.length) return;
        setPhotos(p => p.slice(0, -1));
        setPhotoCount(c => Math.max(0, c - 1));
        setCanTakePhoto(true);
    };

    const getCoords = e => {
        const r = canvasRef.current.getBoundingClientRect();
        return {
            x: (e.clientX - r.left) * (canvasRef.current.width / r.width),
            y: (e.clientY - r.top) * (canvasRef.current.height / r.height)
        };
    };

    const handleMouseDown = e => {
        const { x, y } = getCoords(e);
        if (mode === "photo") {
            for (let i = photos.length - 1; i >= 0; i--) {
                const p = photos[i];
                const slot = currentSlots[p.slotIndex];
                const w = p.img.width * p.scale;
                const h = p.img.height * p.scale;

                if (
                    x >= slot.x + p.offsetX &&
                    x <= slot.x + p.offsetX + w &&
                    y >= slot.y + p.offsetY &&
                    y <= slot.y + p.offsetY + h
                ) {
                    setDraggingPhoto(i);
                    setDragOffset({
                        x: x - slot.x - p.offsetX,
                        y: y - slot.y - p.offsetY
                    });
                    return;
                }
            }
        }
    };

    const handleMouseMove = e => {
        const { x, y } = getCoords(e);

        if (draggingPhoto !== null && mode === "photo") {
            setPhotos(prev => {
                const updated = [...prev];
                const p = updated[draggingPhoto];
                const slot = currentSlots[p.slotIndex];

                p.offsetX = x - slot.x - dragOffset.x;
                p.offsetY = y - slot.y - dragOffset.y;

                return updated;
            });
        }
    };

    const handleMouseUp = () => {
        setDraggingPhoto(null);
    };

    const downloadPhoto = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement("a");
        link.download = "photobooth-strip.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    };

    return (
        <div style={centerCol}>
            {/* top bar with back btn and text */}
            <div style={topBar}>
                {selectedFrame && (
                    <button
                        style={{
                            ...buttonStyle,
                            position: "absolute",
                            left: 0,
                            top: 10,
                            height: 40,
                            padding: "0 16px",
                            lineHeight: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                        onClick={handleBack}
                    >
                        Back
                    </button>
                )}
                <h1 style={titleBar}>
                    {!selectedFrame ? "Select a frame" : "Smile"}
                </h1>
            </div>
            <div style={mainContent}>
                {!selectedFrame ? (
                    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
                        {frameOptions.map((src) => {
                            const isSelected = selectedFrame === src;
                            return (
                                <img
                                    key={src}
                                    src={src}
                                    alt="frame"
                                    style={{
                                        ...frameThumb,
                                        transform: isSelected ? "scale(1.08)" : "scale(1)",
                                        transition: "transform 0.25s ease, box-shadow 0.25s ease",
                                        boxShadow: isSelected
                                            ? "0 12px 30px rgba(20, 28, 185, 0.45)"
                                            : frameThumb.boxShadow
                                    }}
                                    onClick={() => setSelectedFrame(src)}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "scale(1.08)";
                                        e.currentTarget.style.boxShadow = "0 12px 30px rgba(20, 28, 185, 0.45)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = isSelected ? "scale(1.08)" : "scale(1)";
                                        e.currentTarget.style.boxShadow = isSelected
                                            ? "0 12px 30px rgba(20, 28, 185, 0.45)"
                                            : frameThumb.boxShadow;
                                    }}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div style={row}>
                        <div>
                            {mode === "photo" && (
                                <div style={{ position: "relative", width: 400 }}>
                                    {/* Webcam */}
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/png"
                                        videoConstraints={videoConstraints}
                                        mirrored={true}
                                        style={{ width: "100%", borderRadius: 12 }}
                                    />

                                    {/* Overlay countdown */}
                                    {countdown != null && (
                                        <div style={{
                                            position: "absolute",
                                            inset: 0,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: 96,
                                            fontWeight: "bold",
                                            color: "white",
                                            textShadow: "0 4px 20px rgba(0,0,0,0.6)",
                                            background: "rgba(0,0,0,0.25)",
                                            borderRadius: 12,
                                            pointerEvents: "none",
                                        }}>
                                            {countdown}
                                        </div>
                                    )}

                                    {/* Buttons */}
                                    <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
                                        {canTakePhoto && photoCount < 4 && (
                                            <>
                                                <button style={buttonStyle} onClick={capturePhoto}>
                                                    Take Photo ({photoCount}/4)
                                                </button>
                                                <label style={{ ...buttonStyle, cursor: "pointer" }}>
                                                    Upload
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={uploadPhoto}
                                                        style={{ display: "none" }}
                                                    />
                                                </label>
                                            </>
                                        )}

                                        {/* redo btn */}
                                        {photoCount > 0 && photoCount < 4 && canTakePhoto && (
                                            <button style={{
                                                ...buttonStyle,
                                                fontSize: 18,
                                                padding: "10px 15px"
                                            }}
                                            onClick={redoLastPhoto}
                                            >
                                                Redo Last
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Display frame / canvas */}
                        <div>
                            <canvas ref={canvasRef}
                                style={{
                                    width: 180,
                                    height: 480,
                                    borderRadius: 16,
                                    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                                }}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                            />

                            {photoCount === 4 && (
                                <div style={{
                                    marginTop: 16,
                                    display: "flex",
                                    justifyContent: "center",
                                }}>
                                    <button style={{ ...buttonStyle, background: "#584a8c", color: "white" }} onClick={downloadPhoto}>
                                        Download Photo
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
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
};
const buttonStyle = {
    padding: "10px 20px",
    fontSize: 18,
    cursor: "pointer",
    fontFamily: "CantikaCute",
    color: "#e35ca7",
    border: "2px solid #e35ca7",
    borderRadius: 8,
    background: "white"
};

const row = { display: "flex", gap: 40, alignItems: "flex-start" };
const frameThumb = {
    width: 140,
    cursor: "pointer",
    borderRadius: 12,
    boxShadow: "0 8px 8px rgba(0,0,0,0.15)"
};

const titleBar = {
    margin: 0,
    lineHeight: "60px",
    textAlign: "center",
    width: "100%",
    color: "#e35ca7"
};

const mainContent = {
    height: 600,
    width: 700,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
};