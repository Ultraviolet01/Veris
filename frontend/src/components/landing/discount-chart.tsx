import { useEffect, useRef } from "react";

export function DiscountChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number = 0;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      // Draw subtle grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
      ctx.lineWidth = 1;
      const numLines = 5;
      for (let i = 0; i <= numLines; i++) {
        const y = (height / numLines) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Points for SLA freshness curve
      const dataPoints = [
        { x: 0.05, y: 0.88 },
        { x: 0.2, y: 0.72 },
        { x: 0.35, y: 0.45 },
        { x: 0.5, y: 0.32 },
        { x: 0.65, y: 0.22 },
        { x: 0.8, y: 0.16 },
        { x: 0.95, y: 0.12 },
      ];

      // Red gradient fill under primary curve
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "rgba(239, 68, 68, 0.35)");
      gradient.addColorStop(1, "rgba(239, 68, 68, 0.0)");

      ctx.beginPath();
      dataPoints.forEach((p, idx) => {
        const px = p.x * width;
        const py = p.y * height;
        if (idx === 0) {
          ctx.moveTo(px, py);
        } else {
          const prev = dataPoints[idx - 1];
          const cpx = (prev.x * width + px) / 2;
          ctx.bezierCurveTo(cpx, prev.y * height, cpx, py, px, py);
        }
      });

      // Close path for fill
      ctx.lineTo(dataPoints[dataPoints.length - 1].x * width, height);
      ctx.lineTo(dataPoints[0].x * width, height);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Stroke primary line
      ctx.beginPath();
      dataPoints.forEach((p, idx) => {
        const px = p.x * width;
        const py = p.y * height;
        if (idx === 0) {
          ctx.moveTo(px, py);
        } else {
          const prev = dataPoints[idx - 1];
          const cpx = (prev.x * width + px) / 2;
          ctx.bezierCurveTo(cpx, prev.y * height, cpx, py, px, py);
        }
      });
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Dashed baseline curve (stale refund rate)
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "#525252";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      dataPoints.forEach((p, idx) => {
        const px = p.x * width;
        const py = (1.05 - p.y) * height * 0.4 + height * 0.55;
        if (idx === 0) {
          ctx.moveTo(px, py);
        } else {
          const prev = dataPoints[idx - 1];
          const prevPy = (1.05 - prev.y) * height * 0.4 + height * 0.55;
          const cpx = (prev.x * width + px) / 2;
          ctx.bezierCurveTo(cpx, prevPy, cpx, py, px, py);
        }
      });
      ctx.stroke();
      ctx.restore();
    };

    render();
    window.addEventListener("resize", render);

    return () => {
      window.removeEventListener("resize", render);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}
