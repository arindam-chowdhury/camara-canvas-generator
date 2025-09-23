// "use client";

// import React, { useState, useRef, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
// import { Minus, RectangleHorizontal, Square, Expand, Trash2, Send } from 'lucide-react';
// import { toast } from "sonner";
// import Hls from "hls.js";

// type DrawingMode = 'line' | 'rectangle' | 'square' | 'none';
// type Point = { x: number; y: number };
// type Shape = {
//   type: DrawingMode;
//   start: Point;
//   end: Point;
// };

// const DrawingCanvas = () => {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const [drawingMode, setDrawingMode] = useState<DrawingMode>('none');
//   const [isDrawing, setIsDrawing] = useState(false);
//   const [startPoint, setStartPoint] = useState<Point | null>(null);
//   const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
//   const [shapes, setShapes] = useState<Shape[]>([]);
//   const [isWebcamAvailable, setIsWebcamAvailable] = useState(true);

//   const getCanvasCoordinates = (clientX: number, clientY: number): Point => {
//     const canvas = canvasRef.current;
//     if (!canvas) return { x: 0, y: 0 };
//     const rect = canvas.getBoundingClientRect();
//     const scaleX = canvas.width / rect.width;
//     const scaleY = canvas.height / rect.height;
//     return {
//       x: (clientX - rect.left) * scaleX,
//       y: (clientY - rect.top) * scaleY,
//     };
//   };

//   const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
//     if (drawingMode === 'none') return;
//     setIsDrawing(true);
//     const point = getCanvasCoordinates(event.clientX, event.clientY);
//     setStartPoint(point);
//     setCurrentPoint(point);
//   };

//   const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
//     if (!isDrawing || !startPoint) return;
//     const point = getCanvasCoordinates(event.clientX, event.clientY);
//     setCurrentPoint(point);
//   };

//   const handleMouseUp = () => {
//     if (!isDrawing || !startPoint || !currentPoint) return;

//     let newShape: Shape = { type: drawingMode, start: startPoint, end: currentPoint };

//     if (drawingMode === 'square') {
//       const width = currentPoint.x - startPoint.x;
//       const height = currentPoint.y - startPoint.y;
//       const side = Math.max(Math.abs(width), Math.abs(height));
//       newShape.end = {
//         x: startPoint.x + (width > 0 ? side : -side),
//         y: startPoint.y + (height > 0 ? side : -side)
//       };
//     }

//     setShapes([...shapes, newShape]);
//     setIsDrawing(false);
//     setStartPoint(null);
//     setCurrentPoint(null);
//   };

//   const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
//     if (drawingMode === 'none') return;
//     event.preventDefault();
//     setIsDrawing(true);
//     const touch = event.touches[0];
//     const point = getCanvasCoordinates(touch.clientX, touch.clientY);
//     setStartPoint(point);
//     setCurrentPoint(point);
//   };

//   const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
//     if (!isDrawing || !startPoint) return;
//     event.preventDefault();
//     const touch = event.touches[0];
//     const point = getCanvasCoordinates(touch.clientX, touch.clientY);
//     setCurrentPoint(point);
//   };

//   const selectWholeArea = () => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     const wholeAreaShape: Shape = {
//       type: 'rectangle',
//       start: { x: 0, y: 0 },
//       end: { x: canvas.width, y: canvas.height }
//     };
//     setShapes([...shapes, wholeAreaShape]);
//   };

//   const handleSubmit = () => {
//     if (shapes.length === 0) {
//       toast.warning("Canvas is empty. Draw something to submit!");
//       return;
//     }
//     console.log('Submitted Shapes:', shapes);
//     toast.success(`Successfully submitted ${shapes.length} shape(s).`);
//   };

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     const ctx = canvas.getContext('2d');
//     if (!ctx) return;

//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     ctx.strokeStyle = 'black';
//     ctx.lineWidth = 2;
//     ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';

//     shapes.forEach(shape => {
//       drawShape(ctx, shape);
//     });

//     if (isDrawing && startPoint && currentPoint) {
//       let previewShape: Shape = { type: drawingMode, start: startPoint, end: currentPoint };
//       if (drawingMode === 'square') {
//         const width = currentPoint.x - startPoint.x;
//         const height = currentPoint.y - startPoint.y;
//         const side = Math.max(Math.abs(width), Math.abs(height));
//         previewShape.end = {
//           x: startPoint.x + (width > 0 ? side : -side),
//           y: startPoint.y + (height > 0 ? side : -side)
//         };
//       }
//       drawShape(ctx, previewShape);
//     }
//   }, [shapes, isDrawing, startPoint, currentPoint, drawingMode]);

//   useEffect(() => {
//     const video = videoRef.current;
//     if (!video) return;

//     if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
//       navigator.mediaDevices.getUserMedia({ video: true })
//         .then(stream => {
//           video.srcObject = stream;
//           video.play();
//         })
//         .catch(err => {
//           console.error("Error accessing webcam: ", err);
//           toast.error("Error accessing webcam. Please ensure you have a webcam connected and have granted permission.");
//           setIsWebcamAvailable(false);
//         });
//     } else {
//       setIsWebcamAvailable(false);
//     }
//   }, []);

//   useEffect(() => {
//     if (!isWebcamAvailable) {
//       const video = videoRef.current;
//       if (!video) return;

//       const hlsUrl = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

//       if (Hls.isSupported()) {
//         const hls = new Hls();
//         hls.loadSource(hlsUrl);
//         hls.attachMedia(video);
//         hls.on(Hls.Events.MANIFEST_PARSED, () => {
//           video.play();
//         });
//         return () => {
//           hls.destroy();
//         };
//       } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
//         video.src = hlsUrl;
//         video.addEventListener("loadedmetadata", () => {
//           video.play();
//         });
//       }
//     }
//   }, [isWebcamAvailable]);

//   const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
//     ctx.beginPath();
//     const { type, start, end } = shape;
//     switch (type) {
//       case 'line':
//         ctx.moveTo(start.x, start.y);
//         ctx.lineTo(end.x, end.y);
//         ctx.stroke();
//         break;
//       case 'rectangle':
//       case 'square':
//         const width = end.x - start.x;
//         const height = end.y - start.y;
//         ctx.strokeRect(start.x, start.y, width, height);
//         ctx.fillRect(start.x, start.y, width, height);
//         break;
//       default:
//         break;
//     }
//   };

//   return (
//     <div className="flex flex-col items-center gap-4 p-4">
//       <div className="flex flex-wrap justify-center gap-2">
//         <Button variant={drawingMode === 'line' ? 'secondary' : 'outline'} onClick={() => setDrawingMode('line')}>
//           <Minus className="mr-2 h-4 w-4" /> Line
//         </Button>
//         <Button variant={drawingMode === 'rectangle' ? 'secondary' : 'outline'} onClick={() => setDrawingMode('rectangle')}>
//           <RectangleHorizontal className="mr-2 h-4 w-4" /> Rectangle
//         </Button>
//         <Button variant={drawingMode === 'square' ? 'secondary' : 'outline'} onClick={() => setDrawingMode('square')}>
//           <Square className="mr-2 h-4 w-4" /> Square
//         </Button>
//         <Button variant="outline" onClick={selectWholeArea}>
//           <Expand className="mr-2 h-4 w-4" /> Whole Area
//         </Button>
//         <Button variant="destructive" onClick={() => setShapes([])}>
//           <Trash2 className="mr-2 h-4 w-4" /> Clear
//         </Button>
//         <Button onClick={handleSubmit}>
//           <Send className="mr-2 h-4 w-4" /> Submit
//         </Button>
//       </div>
//       <div className="relative w-full max-w-[1065px]">
//         <video
//           ref={videoRef}
//           width="1065"
//           height="599"
//           className="rounded-md w-full h-auto"
//           autoPlay
//           playsInline
//           muted
//         />
//         <canvas
//           ref={canvasRef}
//           width="1065"
//           height="599"
//           className="absolute top-0 left-0 w-full h-full bg-transparent border border-gray-400 rounded-md max-w-full"
//           onMouseDown={handleMouseDown}
//           onMouseMove={handleMouseMove}
//           onMouseUp={handleMouseUp}
//           onMouseLeave={handleMouseUp}
//           onTouchStart={handleTouchStart}
//           onTouchMove={handleTouchMove}
//           onTouchEnd={handleMouseUp}
//         />
//       </div>
//     </div>
//   );
// };

// export default DrawingCanvas;














"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Minus,
  RectangleHorizontal,
  Square,
  Expand,
  Trash2,
  Send,
  Triangle,
} from "lucide-react";
import { toast } from "sonner";
import Hls from "hls.js";

type DrawingMode = "line" | "rectangle" | "square" | "polygon" | "none";
type Point = { x: number; y: number };
type Shape = {
  type: DrawingMode;
  start?: Point;
  end?: Point;
  points?: Point[]; // For polygons
};

type DragInfo = { shapeIndex: number; offsetX: number; offsetY: number } | null;
type ResizeInfo = { shapeIndex: number; corner: "tl" | "tr" | "bl" | "br" } | null;

const DrawingCanvasPrev = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [drawingMode, setDrawingMode] = useState<DrawingMode>("none");
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isWebcamAvailable, setIsWebcamAvailable] = useState(true);
  const [dragInfo, setDragInfo] = useState<DragInfo>(null);
  const [resizeInfo, setResizeInfo] = useState<ResizeInfo>(null);

    // polygon-specific states
  const [activePolygon, setActivePolygon] = useState<Point[]>([]);
  const [draggingPoint, setDraggingPoint] = useState<{
    shapeIndex: number;
    pointIndex: number;
  } | null>(null);

  const getCanvasCoordinates = (clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const getShapeAtPoint = (point: Point): number | null => {
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      const minX = Math.min(shape.start.x, shape.end.x);
      const maxX = Math.max(shape.start.x, shape.end.x);
      const minY = Math.min(shape.start.y, shape.end.y);
      const maxY = Math.max(shape.start.y, shape.end.y);

      if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) {
        return i;
      }
    }
    return null;
  };

  const getCornerAtPoint = (point: Point): ResizeInfo | null => {
    const threshold = 10;
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      if (shape.type === "rectangle" || shape.type === "square") {
        const { start, end } = shape;
        const corners = {
          tl: start,
          tr: { x: end.x, y: start.y },
          bl: { x: start.x, y: end.y },
          br: end,
        };
        for (const cornerName in corners) {
          const cornerPos = corners[cornerName as keyof typeof corners];
          const dx = point.x - cornerPos.x;
          const dy = point.y - cornerPos.y;
          if (Math.sqrt(dx * dx + dy * dy) <= threshold) {
            return { shapeIndex: i, corner: cornerName as "tl" | "tr" | "bl" | "br" };
          }
        }
      }
    }
    return null;
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasCoordinates(event.clientX, event.clientY);

    // Resize check first
    const resizeTarget = getCornerAtPoint(point);
    if (resizeTarget) {
      setResizeInfo(resizeTarget);
      return;
    }

    // Drag check second
    const shapeIndex = getShapeAtPoint(point);
    if (shapeIndex !== null) {
      const shape = shapes[shapeIndex];
      setDragInfo({
        shapeIndex,
        offsetX: point.x - shape.start.x,
        offsetY: point.y - shape.start.y,
      });
      return;
    }

    // Drawing mode last
    if (drawingMode !== "none") {
      setIsDrawing(true);
      setStartPoint(point);
      setCurrentPoint(point);
    }
  };

    // ---------------- Polygon handling ----------------
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawingMode === "polygon") {
      const point = getCanvasCoordinates(event.clientX, event.clientY);
      setActivePolygon((prev) => [...prev, point]);
    }
  };

  const finishPolygon = () => {
    if (activePolygon.length >= 3) {
      setShapes([...shapes, { type: "polygon", points: activePolygon }]);
      setActivePolygon([]);
    } else {
      toast.warning("Polygon needs at least 3 points.");
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasCoordinates(event.clientX, event.clientY);

    if (isDrawing && startPoint) {
      setCurrentPoint(point);
    } else if (dragInfo) {
      const { shapeIndex, offsetX, offsetY } = dragInfo;
      const shape = shapes[shapeIndex];
      const width = shape.end.x - shape.start.x;
      const height = shape.end.y - shape.start.y;

      const newShapes = [...shapes];
      newShapes[shapeIndex] = {
        ...shape,
        start: { x: point.x - offsetX, y: point.y - offsetY },
        end: { x: point.x - offsetX + width, y: point.y - offsetY + height },
      };
      setShapes(newShapes);
    } else if (resizeInfo) {
      const { shapeIndex, corner } = resizeInfo;
      const shape = shapes[shapeIndex];
      const newShape = { ...shape };

      switch (corner) {
        case "tl":
          newShape.start = point;
          break;
        case "tr":
          newShape.start.y = point.y;
          newShape.end.x = point.x;
          break;
        case "bl":
          newShape.start.x = point.x;
          newShape.end.y = point.y;
          break;
        case "br":
          newShape.end = point;
          break;
      }

      setShapes((prev) => {
        const newArr = [...prev];
        newArr[shapeIndex] = newShape;
        return newArr;
      });
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && startPoint && currentPoint) {
      let newShape: Shape = { type: drawingMode, start: startPoint, end: currentPoint };
      if (drawingMode === "square") {
        const width = currentPoint.x - startPoint.x;
        const height = currentPoint.y - startPoint.y;
        const side = Math.max(Math.abs(width), Math.abs(height));
        newShape.end = {
          x: startPoint.x + (width > 0 ? side : -side),
          y: startPoint.y + (height > 0 ? side : -side),
        };
      }
      setShapes([...shapes, newShape]);
    }
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
    setDragInfo(null);
    setResizeInfo(null);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (drawingMode === "none") return;
    event.preventDefault();
    const touch = event.touches[0];
    const point = getCanvasCoordinates(touch.clientX, touch.clientY);
    setIsDrawing(true);
    setStartPoint(point);
    setCurrentPoint(point);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;
    event.preventDefault();
    const touch = event.touches[0];
    const point = getCanvasCoordinates(touch.clientX, touch.clientY);
    setCurrentPoint(point);
  };

  const selectWholeArea = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const wholeAreaShape: Shape = {
      type: "rectangle",
      start: { x: 0, y: 0 },
      end: { x: canvas.width, y: canvas.height },
    };
    setShapes([...shapes, wholeAreaShape]);
  };

  const handleSubmit = () => {
    if (shapes.length === 0) {
      toast.warning("Canvas is empty. Draw something to submit!");
      return;
    }
    console.log("Submitted Shapes:", shapes);
    toast.success(`Successfully submitted ${shapes.length} shape(s).`);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.fillStyle = "rgba(0, 0, 255, 0.1)";

    shapes.forEach((shape) => {
      drawShape(ctx, shape);

      if (shape.type === "rectangle" || shape.type === "square") {
        const { start, end } = shape;
        const corners = [start, { x: end.x, y: start.y }, { x: start.x, y: end.y }, end];
        ctx.fillStyle = "red";
        corners.forEach((c) => ctx.fillRect(c.x - 4, c.y - 4, 8, 8));
        ctx.fillStyle = "rgba(0, 0, 255, 0.1)";
      }
    });

    if (isDrawing && startPoint && currentPoint) {
      let previewShape: Shape = { type: drawingMode, start: startPoint, end: currentPoint };
      if (drawingMode === "square") {
        const width = currentPoint.x - startPoint.x;
        const height = currentPoint.y - startPoint.y;
        const side = Math.max(Math.abs(width), Math.abs(height));
        previewShape.end = {
          x: startPoint.x + (width > 0 ? side : -side),
          y: startPoint.y + (height > 0 ? side : -side),
        };
      }
      drawShape(ctx, previewShape);
    }
  }, [shapes, isDrawing, startPoint, currentPoint, drawingMode]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          video.srcObject = stream;
          video.play();
        })
        .catch((err) => {
          console.error("Error accessing webcam: ", err);
          toast.error(
            "Error accessing webcam. Please ensure you have a webcam connected and have granted permission."
          );
          setIsWebcamAvailable(false);
        });
    } else {
      setIsWebcamAvailable(false);
    }
  }, []);

  useEffect(() => {
    if (!isWebcamAvailable) {
      const video = videoRef.current;
      if (!video) return;
      const hlsUrl = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play();
        });
        return () => hls.destroy();
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = hlsUrl;
        video.addEventListener("loadedmetadata", () => video.play());
      }
    }
  }, [isWebcamAvailable]);

  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.beginPath();
    const { type, start, end } = shape;
    switch (type) {
      case "line":
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        break;
      case "rectangle":
      case "square":
        const width = end.x - start.x;
        const height = end.y - start.y;
        ctx.strokeRect(start.x, start.y, width, height);
        ctx.fillRect(start.x, start.y, width, height);
        break;
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          variant={drawingMode === "line" ? "secondary" : "outline"}
          onClick={() => setDrawingMode("line")}
        >
          <Minus className="mr-2 h-4 w-4" /> Line
        </Button>
        <Button
          variant={drawingMode === "rectangle" ? "secondary" : "outline"}
          onClick={() => setDrawingMode("rectangle")}
        >
          <RectangleHorizontal className="mr-2 h-4 w-4" /> Rectangle
        </Button>
        <Button
          variant={drawingMode === "square" ? "secondary" : "outline"}
          onClick={() => setDrawingMode("square")}
        >
          <Square className="mr-2 h-4 w-4" /> Square
        </Button>
        <Button
          variant={drawingMode === "polygon" ? "secondary" : "outline"}
          onClick={() => setDrawingMode("polygon")}
        >
          <Triangle className="mr-2 h-4 w-4" /> Polygon
        </Button>
        <Button variant="outline" onClick={finishPolygon}>
          Finish Polygon
        </Button>
        <Button variant="outline" onClick={selectWholeArea}>
          <Expand className="mr-2 h-4 w-4" /> Whole Area
        </Button>
        <Button variant="destructive" onClick={() => setShapes([])}>
          <Trash2 className="mr-2 h-4 w-4" /> Clear
        </Button>
        <Button onClick={handleSubmit}>
          <Send className="mr-2 h-4 w-4" /> Submit
        </Button>
      </div>
      <div className="relative w-full max-w-[1065px]">
        <video
          ref={videoRef}
          width="1065"
          height="599"
          className="rounded-md w-full h-auto"
          autoPlay
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          width="1065"
          height="599"
          className="absolute top-0 left-0 w-full h-full bg-transparent border border-gray-400 rounded-md max-w-full"
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
        />
      </div>
    </div>
  );
};

export default DrawingCanvasPrev;




 


























// "use client";

// import React, { useState, useRef, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   Minus,
//   RectangleHorizontal,
//   Square,
//   Expand,
//   Trash2,
//   Send,
// } from "lucide-react";
// import { toast } from "sonner";
// import Hls from "hls.js";

// type DrawingMode = "line" | "rectangle" | "square" | "none";
// type Point = { x: number; y: number };
// type Shape = {
//   type: DrawingMode;
//   start: Point;
//   end: Point;
// };

// type DragInfo = { shapeIndex: number; offsetX: number; offsetY: number } | null;

// const DrawingCanvas = () => {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const [drawingMode, setDrawingMode] = useState<DrawingMode>("none");
//   const [isDrawing, setIsDrawing] = useState(false);
//   const [startPoint, setStartPoint] = useState<Point | null>(null);
//   const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
//   const [shapes, setShapes] = useState<Shape[]>([]);
//   const [isWebcamAvailable, setIsWebcamAvailable] = useState(true);
//   const [dragInfo, setDragInfo] = useState<DragInfo>(null);

//   const getCanvasCoordinates = (clientX: number, clientY: number): Point => {
//     const canvas = canvasRef.current;
//     if (!canvas) return { x: 0, y: 0 };
//     const rect = canvas.getBoundingClientRect();
//     const scaleX = canvas.width / rect.width;
//     const scaleY = canvas.height / rect.height;
//     return {
//       x: (clientX - rect.left) * scaleX,
//       y: (clientY - rect.top) * scaleY,
//     };
//   };

//   // 🔍 Detect shape under cursor
//   const getShapeAtPoint = (point: Point): number | null => {
//     for (let i = shapes.length - 1; i >= 0; i--) {
//       const shape = shapes[i];
//       if (shape.type === "line") {
//         // crude bounding box for line
//         const buffer = 5;
//         const minX = Math.min(shape.start.x, shape.end.x) - buffer;
//         const maxX = Math.max(shape.start.x, shape.end.x) + buffer;
//         const minY = Math.min(shape.start.y, shape.end.y) - buffer;
//         const maxY = Math.max(shape.start.y, shape.end.y) + buffer;
//         if (
//           point.x >= minX &&
//           point.x <= maxX &&
//           point.y >= minY &&
//           point.y <= maxY
//         ) {
//           return i;
//         }
//       } else {
//         // rectangle/square
//         const minX = Math.min(shape.start.x, shape.end.x);
//         const maxX = Math.max(shape.start.x, shape.end.x);
//         const minY = Math.min(shape.start.y, shape.end.y);
//         const maxY = Math.max(shape.start.y, shape.end.y);
//         if (
//           point.x >= minX &&
//           point.x <= maxX &&
//           point.y >= minY &&
//           point.y <= maxY
//         ) {
//           return i;
//         }
//       }
//     }
//     return null;
//   };

//   // 🖱 Mouse down → drawing or dragging
//   const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
//     const point = getCanvasCoordinates(event.clientX, event.clientY);

//     if (drawingMode !== "none") {
//       setIsDrawing(true);
//       setStartPoint(point);
//       setCurrentPoint(point);
//     } else {
//       const shapeIndex = getShapeAtPoint(point);
//       if (shapeIndex !== null) {
//         const shape = shapes[shapeIndex];
//         setDragInfo({
//           shapeIndex,
//           offsetX: point.x - shape.start.x,
//           offsetY: point.y - shape.start.y,
//         });
//       }
//     }
//   };

//   // 🖱 Mouse move → update drawing preview or drag shape
//   const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
//     const point = getCanvasCoordinates(event.clientX, event.clientY);

//     if (isDrawing && startPoint) {
//       setCurrentPoint(point);
//     } else if (dragInfo) {
//       const { shapeIndex, offsetX, offsetY } = dragInfo;
//       const shape = shapes[shapeIndex];
//       const width = shape.end.x - shape.start.x;
//       const height = shape.end.y - shape.start.y;

//       const newShapes = [...shapes];
//       newShapes[shapeIndex] = {
//         ...shape,
//         start: { x: point.x - offsetX, y: point.y - offsetY },
//         end: { x: point.x - offsetX + width, y: point.y - offsetY + height },
//       };
//       setShapes(newShapes);
//     }
//   };

//   // 🖱 Mouse up → finalize drawing or stop dragging
//   const handleMouseUp = () => {
//     if (isDrawing) {
//       if (startPoint && currentPoint) {
//         let newShape: Shape = {
//           type: drawingMode,
//           start: startPoint,
//           end: currentPoint,
//         };
//         if (drawingMode === "square") {
//           const width = currentPoint.x - startPoint.x;
//           const height = currentPoint.y - startPoint.y;
//           const side = Math.max(Math.abs(width), Math.abs(height));
//           newShape.end = {
//             x: startPoint.x + (width > 0 ? side : -side),
//             y: startPoint.y + (height > 0 ? side : -side),
//           };
//         }
//         setShapes([...shapes, newShape]);
//       }
//       setIsDrawing(false);
//       setStartPoint(null);
//       setCurrentPoint(null);
//     }
//     setDragInfo(null);
//   };

//   // 📱 Touch support
//   const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
//     if (drawingMode === "none") return;
//     event.preventDefault();
//     setIsDrawing(true);
//     const touch = event.touches[0];
//     const point = getCanvasCoordinates(touch.clientX, touch.clientY);
//     setStartPoint(point);
//     setCurrentPoint(point);
//   };

//   const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
//     if (!isDrawing || !startPoint) return;
//     event.preventDefault();
//     const touch = event.touches[0];
//     const point = getCanvasCoordinates(touch.clientX, touch.clientY);
//     setCurrentPoint(point);
//   };

//   const selectWholeArea = () => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     const wholeAreaShape: Shape = {
//       type: "rectangle",
//       start: { x: 0, y: 0 },
//       end: { x: canvas.width, y: canvas.height },
//     };
//     setShapes([...shapes, wholeAreaShape]);
//   };

//   const handleSubmit = () => {
//     if (shapes.length === 0) {
//       toast.warning("Canvas is empty. Draw something to submit!");
//       return;
//     }
//     console.log("Submitted Shapes:", shapes);
//     toast.success(`Successfully submitted ${shapes.length} shape(s).`);
//   };

//   // 🎨 Draw on canvas
//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     const ctx = canvas.getContext("2d");
//     if (!ctx) return;

//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     ctx.strokeStyle = "black";
//     ctx.lineWidth = 2;
//     ctx.fillStyle = "rgba(0, 0, 255, 0.1)";

//     shapes.forEach((shape) => {
//       drawShape(ctx, shape);
//     });

//     if (isDrawing && startPoint && currentPoint) {
//       let previewShape: Shape = {
//         type: drawingMode,
//         start: startPoint,
//         end: currentPoint,
//       };
//       if (drawingMode === "square") {
//         const width = currentPoint.x - startPoint.x;
//         const height = currentPoint.y - startPoint.y;
//         const side = Math.max(Math.abs(width), Math.abs(height));
//         previewShape.end = {
//           x: startPoint.x + (width > 0 ? side : -side),
//           y: startPoint.y + (height > 0 ? side : -side),
//         };
//       }
//       drawShape(ctx, previewShape);
//     }
//   }, [shapes, isDrawing, startPoint, currentPoint, drawingMode]);

//   // 🎥 Webcam or fallback HLS stream
//   useEffect(() => {
//     const video = videoRef.current;
//     if (!video) return;

//     if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
//       navigator.mediaDevices
//         .getUserMedia({ video: true })
//         .then((stream) => {
//           video.srcObject = stream;
//           video.play();
//         })
//         .catch((err) => {
//           console.error("Error accessing webcam: ", err);
//           toast.error(
//             "Error accessing webcam. Please ensure you have a webcam connected and have granted permission."
//           );
//           setIsWebcamAvailable(false);
//         });
//     } else {
//       setIsWebcamAvailable(false);
//     }
//   }, []);

//   useEffect(() => {
//     if (!isWebcamAvailable) {
//       const video = videoRef.current;
//       if (!video) return;

//       const hlsUrl = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

//       if (Hls.isSupported()) {
//         const hls = new Hls();
//         hls.loadSource(hlsUrl);
//         hls.attachMedia(video);
//         hls.on(Hls.Events.MANIFEST_PARSED, () => {
//           video.play();
//         });
//         return () => {
//           hls.destroy();
//         };
//       } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
//         video.src = hlsUrl;
//         video.addEventListener("loadedmetadata", () => {
//           video.play();
//         });
//       }
//     }
//   }, [isWebcamAvailable]);

//   const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
//     ctx.beginPath();
//     const { type, start, end } = shape;
//     switch (type) {
//       case "line":
//         ctx.moveTo(start.x, start.y);
//         ctx.lineTo(end.x, end.y);
//         ctx.stroke();
//         break;
//       case "rectangle":
//       case "square":
//         const width = end.x - start.x;
//         const height = end.y - start.y;
//         ctx.strokeRect(start.x, start.y, width, height);
//         ctx.fillRect(start.x, start.y, width, height);
//         break;
//       default:
//         break;
//     }
//   };

//   return (
//     <div className="flex flex-col items-center gap-4 p-4">
//       <div className="flex flex-wrap justify-center gap-2">
//         <Button
//           variant={drawingMode === "line" ? "secondary" : "outline"}
//           onClick={() => setDrawingMode("line")}
//         >
//           <Minus className="mr-2 h-4 w-4" /> Line
//         </Button>
//         <Button
//           variant={drawingMode === "rectangle" ? "secondary" : "outline"}
//           onClick={() => setDrawingMode("rectangle")}
//         >
//           <RectangleHorizontal className="mr-2 h-4 w-4" /> Rectangle
//         </Button>
//         <Button
//           variant={drawingMode === "square" ? "secondary" : "outline"}
//           onClick={() => setDrawingMode("square")}
//         >
//           <Square className="mr-2 h-4 w-4" /> Square
//         </Button>
//         <Button variant="outline" onClick={selectWholeArea}>
//           <Expand className="mr-2 h-4 w-4" /> Whole Area
//         </Button>
//         <Button variant="destructive" onClick={() => setShapes([])}>
//           <Trash2 className="mr-2 h-4 w-4" /> Clear
//         </Button>
//         <Button onClick={handleSubmit}>
//           <Send className="mr-2 h-4 w-4" /> Submit
//         </Button>
//         <Button
//           variant={drawingMode === "none" ? "secondary" : "outline"}
//           onClick={() => setDrawingMode("none")}
//         >
//           Drag Mode
//         </Button>
//       </div>
//       <div className="relative w-full max-w-[1065px]">
//         <video
//           ref={videoRef}
//           width="1065"
//           height="599"
//           className="rounded-md w-full h-auto"
//           autoPlay
//           playsInline
//           muted
//         />
//         <canvas
//           ref={canvasRef}
//           width="1065"
//           height="599"
//           className="absolute top-0 left-0 w-full h-full bg-transparent border border-gray-400 rounded-md max-w-full"
//           onMouseDown={handleMouseDown}
//           onMouseMove={handleMouseMove}
//           onMouseUp={handleMouseUp}
//           onMouseLeave={handleMouseUp}
//           onTouchStart={handleTouchStart}
//           onTouchMove={handleTouchMove}
//           onTouchEnd={handleMouseUp}
//         />
//       </div>
//     </div>
//   );
// };

// export default DrawingCanvas;
















// "use client";

// import React, { useState, useRef, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   Minus,
//   RectangleHorizontal,
//   Square,
//   Expand,
//   Trash2,
//   Send,
//   Triangle,
// } from "lucide-react";
// import { toast } from "sonner";
// import Hls from "hls.js";

// type DrawingMode = "line" | "rectangle" | "square" | "polygon" | "none";
// type Point = { x: number; y: number };
// type Shape = {
//   type: DrawingMode;
//   start?: Point;
//   end?: Point;
//   points?: Point[]; // For polygons
// };

// const DrawingCanvas = () => {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const [drawingMode, setDrawingMode] = useState<DrawingMode>("none");
//   const [isDrawing, setIsDrawing] = useState(false);
//   const [startPoint, setStartPoint] = useState<Point | null>(null);
//   const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
//   const [shapes, setShapes] = useState<Shape[]>([]);
//   const [isWebcamAvailable, setIsWebcamAvailable] = useState(true);

//   // polygon-specific states
//   const [activePolygon, setActivePolygon] = useState<Point[]>([]);
//   const [draggingPoint, setDraggingPoint] = useState<{
//     shapeIndex: number;
//     pointIndex: number;
//   } | null>(null);

//   const getCanvasCoordinates = (clientX: number, clientY: number): Point => {
//     const canvas = canvasRef.current;
//     if (!canvas) return { x: 0, y: 0 };
//     const rect = canvas.getBoundingClientRect();
//     const scaleX = canvas.width / rect.width;
//     const scaleY = canvas.height / rect.height;
//     return {
//       x: (clientX - rect.left) * scaleX,
//       y: (clientY - rect.top) * scaleY,
//     };
//   };

//   // ---------------- Polygon handling ----------------
//   const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
//     if (drawingMode === "polygon") {
//       const point = getCanvasCoordinates(event.clientX, event.clientY);
//       setActivePolygon((prev) => [...prev, point]);
//     }
//   };

//   const finishPolygon = () => {
//     if (activePolygon.length >= 3) {
//       setShapes([...shapes, { type: "polygon", points: activePolygon }]);
//       setActivePolygon([]);
//     } else {
//       toast.warning("Polygon needs at least 3 points.");
//     }
//   };

//   // ---------------- Line/Rectangle/Square handling ----------------
//   const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
//     if (drawingMode === "polygon") {
//       // detect drag on polygon points
//       const point = getCanvasCoordinates(event.clientX, event.clientY);
//       shapes.forEach((shape, shapeIndex) => {
//         if (shape.type === "polygon" && shape.points) {
//           shape.points.forEach((p, pointIndex) => {
//             const dx = p.x - point.x;
//             const dy = p.y - point.y;
//             if (Math.sqrt(dx * dx + dy * dy) < 8) {
//               setDraggingPoint({ shapeIndex, pointIndex });
//             }
//           });
//         }
//       });
//       return;
//     }

//     if (drawingMode === "none") return;
//     setIsDrawing(true);
//     const point = getCanvasCoordinates(event.clientX, event.clientY);
//     setStartPoint(point);
//     setCurrentPoint(point);
//   };

//   const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
//     if (draggingPoint) {
//       const { shapeIndex, pointIndex } = draggingPoint;
//       const point = getCanvasCoordinates(event.clientX, event.clientY);
//       setShapes((prev) =>
//         prev.map((shape, i) => {
//           if (i === shapeIndex && shape.type === "polygon" && shape.points) {
//             const newPoints = [...shape.points];
//             newPoints[pointIndex] = point;
//             return { ...shape, points: newPoints };
//           }
//           return shape;
//         })
//       );
//       return;
//     }

//     if (!isDrawing || !startPoint) return;
//     const movePoint = getCanvasCoordinates(event.clientX, event.clientY);
//     setCurrentPoint(movePoint);
//   };

//   const handleMouseUp = () => {
//     setDraggingPoint(null);
//     if (!isDrawing || !startPoint || !currentPoint) return;

//     let newShape: Shape = {
//       type: drawingMode,
//       start: startPoint,
//       end: currentPoint,
//     };

//     if (drawingMode === "square") {
//       const width = currentPoint.x - startPoint.x;
//       const height = currentPoint.y - startPoint.y;
//       const side = Math.max(Math.abs(width), Math.abs(height));
//       newShape.end = {
//         x: startPoint.x + (width > 0 ? side : -side),
//         y: startPoint.y + (height > 0 ? side : -side),
//       };
//     }

//     if (drawingMode !== "polygon") {
//       setShapes([...shapes, newShape]);
//     }

//     setIsDrawing(false);
//     setStartPoint(null);
//     setCurrentPoint(null);
//   };

//   // ---------------- Whole area ----------------
//   const selectWholeArea = () => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     const wholeAreaShape: Shape = {
//       type: "rectangle",
//       start: { x: 0, y: 0 },
//       end: { x: canvas.width, y: canvas.height },
//     };
//     setShapes([...shapes, wholeAreaShape]);
//   };

//   const handleSubmit = () => {
//     if (shapes.length === 0) {
//       toast.warning("Canvas is empty. Draw something to submit!");
//       return;
//     }
//     console.log("Submitted Shapes:", shapes);
//     toast.success(`Successfully submitted ${shapes.length} shape(s).`);
//   };

//   // ---------------- Canvas Drawing ----------------
//   const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
//     ctx.beginPath();
//     const { type, start, end } = shape;
//     switch (type) {
//       case "line":
//         if (start && end) {
//           ctx.moveTo(start.x, start.y);
//           ctx.lineTo(end.x, end.y);
//           ctx.stroke();
//         }
//         break;
//       case "rectangle":
//       case "square":
//         if (start && end) {
//           const width = end.x - start.x;
//           const height = end.y - start.y;
//           ctx.strokeRect(start.x, start.y, width, height);
//           ctx.fillRect(start.x, start.y, width, height);
//         }
//         break;
//       case "polygon":
//         if (shape.points && shape.points.length > 1) {
//           ctx.moveTo(shape.points[0].x, shape.points[0].y);
//           shape.points.forEach((p, i) => {
//             if (i > 0) ctx.lineTo(p.x, p.y);
//           });
//           ctx.closePath();
//           ctx.stroke();
//           ctx.fill();

//           // draw draggable points
//           shape.points.forEach((p) => {
//             ctx.beginPath();
//             ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
//             ctx.fillStyle = "red";
//             ctx.fill();
//             ctx.strokeStyle = "black";
//             ctx.stroke();
//           });
//         }
//         break;
//     }
//   };

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
//     const ctx = canvas.getContext("2d");
//     if (!ctx) return;

//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     ctx.strokeStyle = "black";
//     ctx.lineWidth = 2;
//     ctx.fillStyle = "rgba(0, 0, 255, 0.1)";

//     // Draw saved shapes
//     shapes.forEach((shape) => {
//       drawShape(ctx, shape);
//     });

//     // Draw preview of active polygon
//     if (drawingMode === "polygon" && activePolygon.length > 0) {
//       ctx.beginPath();
//       ctx.moveTo(activePolygon[0].x, activePolygon[0].y);
//       activePolygon.forEach((p, i) => {
//         if (i > 0) ctx.lineTo(p.x, p.y);
//       });
//       ctx.stroke();

//       activePolygon.forEach((p) => {
//         ctx.beginPath();
//         ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
//         ctx.fillStyle = "blue";
//         ctx.fill();
//       });
//     }

//     // Draw preview shape for line/rectangle/square
//     if (isDrawing && startPoint && currentPoint && drawingMode !== "polygon") {
//       let previewShape: Shape = {
//         type: drawingMode,
//         start: startPoint,
//         end: currentPoint,
//       };
//       if (drawingMode === "square") {
//         const width = currentPoint.x - startPoint.x;
//         const height = currentPoint.y - startPoint.y;
//         const side = Math.max(Math.abs(width), Math.abs(height));
//         previewShape.end = {
//           x: startPoint.x + (width > 0 ? side : -side),
//           y: startPoint.y + (height > 0 ? side : -side),
//         };
//       }
//       drawShape(ctx, previewShape);
//     }
//   }, [shapes, isDrawing, startPoint, currentPoint, drawingMode, activePolygon]);

//   // ---------------- Video / Webcam ----------------
//   useEffect(() => {
//     const video = videoRef.current;
//     if (!video) return;

//     if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
//       navigator.mediaDevices
//         .getUserMedia({ video: true })
//         .then((stream) => {
//           video.srcObject = stream;
//           video.play();
//         })
//         .catch((err) => {
//           console.error("Error accessing webcam: ", err);
//           toast.error(
//             "Error accessing webcam. Please ensure you have a webcam connected and have granted permission."
//           );
//           setIsWebcamAvailable(false);
//         });
//     } else {
//       setIsWebcamAvailable(false);
//     }
//   }, []);

//   useEffect(() => {
//     if (!isWebcamAvailable) {
//       const video = videoRef.current;
//       if (!video) return;

//       const hlsUrl = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

//       if (Hls.isSupported()) {
//         const hls = new Hls();
//         hls.loadSource(hlsUrl);
//         hls.attachMedia(video);
//         hls.on(Hls.Events.MANIFEST_PARSED, () => {
//           video.play();
//         });
//         return () => {
//           hls.destroy();
//         };
//       } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
//         video.src = hlsUrl;
//         video.addEventListener("loadedmetadata", () => {
//           video.play();
//         });
//       }
//     }
//   }, [isWebcamAvailable]);

//   return (
//     <div className="flex flex-col items-center gap-4 p-4">
//       <div className="flex flex-wrap justify-center gap-2">
//         <Button
//           variant={drawingMode === "line" ? "secondary" : "outline"}
//           onClick={() => setDrawingMode("line")}
//         >
//           <Minus className="mr-2 h-4 w-4" /> Line
//         </Button>
//         <Button
//           variant={drawingMode === "rectangle" ? "secondary" : "outline"}
//           onClick={() => setDrawingMode("rectangle")}
//         >
//           <RectangleHorizontal className="mr-2 h-4 w-4" /> Rectangle
//         </Button>
//         <Button
//           variant={drawingMode === "square" ? "secondary" : "outline"}
//           onClick={() => setDrawingMode("square")}
//         >
//           <Square className="mr-2 h-4 w-4" /> Square
//         </Button>
//         <Button
//           variant={drawingMode === "polygon" ? "secondary" : "outline"}
//           onClick={() => setDrawingMode("polygon")}
//         >
//           <Triangle className="mr-2 h-4 w-4" /> Polygon
//         </Button>
//         <Button variant="outline" onClick={finishPolygon}>
//           Finish Polygon
//         </Button>
//         <Button variant="outline" onClick={selectWholeArea}>
//           <Expand className="mr-2 h-4 w-4" /> Whole Area
//         </Button>
//         <Button variant="destructive" onClick={() => setShapes([])}>
//           <Trash2 className="mr-2 h-4 w-4" /> Clear
//         </Button>
//         <Button onClick={handleSubmit}>
//           <Send className="mr-2 h-4 w-4" /> Submit
//         </Button>
//       </div>

//       <div className="relative w-full max-w-[1065px]">
//         <video
//           ref={videoRef}
//           width="1065"
//           height="599"
//           className="rounded-md w-full h-auto"
//           autoPlay
//           playsInline
//           muted
//         />
//         <canvas
//           ref={canvasRef}
//           width="1065"
//           height="599"
//           className="absolute top-0 left-0 w-full h-full bg-transparent border border-gray-400 rounded-md max-w-full"
//           onClick={handleCanvasClick}
//           onMouseDown={handleMouseDown}
//           onMouseMove={handleMouseMove}
//           onMouseUp={handleMouseUp}
//           onMouseLeave={handleMouseUp}
//         />
//       </div>
//     </div>
//   );
// };

// export default DrawingCanvas;
