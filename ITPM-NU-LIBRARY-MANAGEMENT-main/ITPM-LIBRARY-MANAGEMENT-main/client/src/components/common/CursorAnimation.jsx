import { useEffect, useRef, useState } from "react";

const CursorAnimation = () => {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  const requestRef = useRef(null);

  // Mouse absolute coords
  const mouse = useRef({ x: 0, y: 0 });
  
  // Dot follows mouse directly
  const dot = useRef({ x: 0, y: 0 });
  
  // Ring follows with easing "antigravity" float
  const ring = useRef({ x: 0, y: 0 });

  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Track mouse coordinates
  const handleMouseMove = (e) => {
    mouse.current.x = e.clientX;
    mouse.current.y = e.clientY;
  };

  const handleMouseDown = () => setClicked(true);
  const handleMouseUp = () => setClicked(false);

  const update = () => {
    // Easing factor for dot (fast)
    dot.current.x += (mouse.current.x - dot.current.x) * 0.5;
    dot.current.y += (mouse.current.y - dot.current.y) * 0.5;

    // Easing factor for ring (slow floaty antigravity)
    ring.current.x += (mouse.current.x - ring.current.x) * 0.08;
    ring.current.y += (mouse.current.y - ring.current.y) * 0.08;

    if (dotRef.current) {
      dotRef.current.style.transform = `translate3d(${dot.current.x}px, ${dot.current.y}px, 0) translate(-50%, -50%)`;
    }

    if (ringRef.current) {
      ringRef.current.style.transform = `translate3d(${ring.current.x}px, ${ring.current.y}px, 0) translate(-50%, -50%)`;
    }

    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    requestRef.current = requestAnimationFrame(update);

    // Initial positioning check for iteractive elements
    const handleMouseOver = (e) => {
      if (
        e.target.tagName.toLowerCase() === 'a' ||
        e.target.tagName.toLowerCase() === 'button' ||
        e.target.closest('a') ||
        e.target.closest('button') ||
        e.target.classList.contains('input-field')
      ) {
        setHovered(true);
      } else {
        setHovered(false);
      }
    };

    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseover", handleMouseOver);
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        className={`pointer-events-none fixed top-0 left-0 z-[9999] rounded-full mix-blend-difference transition-all duration-300 ease-out will-change-transform ${
          hovered ? "h-16 w-16 bg-white/30 backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,255,0.4)]" : "h-10 w-10 border border-white/50 bg-transparent shadow-[0_0_15px_rgba(255,255,255,0.2)]"
        } ${clicked ? "scale-75 opacity-50" : "scale-100 opacity-100"}`}
        style={{
          border: hovered ? 'none' : '1.5px solid rgba(41, 82, 255, 0.6)',
          backgroundColor: hovered ? 'rgba(41, 82, 255, 0.2)' : 'transparent',
          boxShadow: hovered ? '0 0 20px rgba(41, 82, 255, 0.4)' : '0 0 10px rgba(41, 82, 255, 0.1)'
        }}
      />
      <div
        ref={dotRef}
        className={`pointer-events-none fixed top-0 left-0 z-[10000] rounded-full bg-[color:var(--accent)] transition-all duration-200 ease-out will-change-transform ${
          hovered ? "h-0 w-0 opacity-0" : "h-2 w-2 opacity-100"
        }`}
      />
    </>
  );
};

export default CursorAnimation;
