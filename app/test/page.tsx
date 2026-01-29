"use client";

import { useState } from "react";

export default function TestPage() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: "50px", background: "black", minHeight: "100vh" }}>
      <h1 style={{ color: "white", fontSize: "32px", marginBottom: "20px" }}>
        JavaScript Test Page
      </h1>

      <p style={{ color: "lime", fontSize: "24px", marginBottom: "20px" }}>
        Count: {count}
      </p>

      <button
        onClick={() => {
          console.log("Button clicked! Count:", count + 1);
          alert("Button clicked! Count: " + (count + 1));
          setCount(count + 1);
        }}
        style={{
          background: "red",
          color: "white",
          padding: "20px 40px",
          fontSize: "24px",
          border: "5px solid yellow",
          cursor: "pointer",
          borderRadius: "10px",
        }}
      >
        CLICK ME - TEST JAVASCRIPT
      </button>

      <p style={{ color: "gray", marginTop: "20px" }}>
        If clicking the button shows an alert and updates the count, JavaScript
        is working.
      </p>
    </div>
  );
}
