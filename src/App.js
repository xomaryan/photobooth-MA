import './App.css';
import React from "react";
import Photobooth from "./components/photobooth";
import "./styles/global.css";

const logoSrc = "/assets/logo/logo-ma.png";

function App() {
  return (
    <div className="App" style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <div style={{
        display: "flex",
        width: "100%",
        maxWidth: 1200,
        gap: 12,
        alignItems: "center",
        padding: "20px 32px"
      }}>
        <img src={logoSrc} alt="Photobooth Ma" style={{ width: 50 }} />
        <h1 style={{
          fontFamily: "Cantika Cute",
          color: "#8c5b4a",
          margin: 0
        }}>
          Photobooth MA
        </h1>
      </div>

      <div style={{
        flex: 1,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: "40px"
      }}>
        <Photobooth />
      </div>
    </div>
  );
}

export default App;