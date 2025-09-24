"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  RectangleHorizontal,
  Square,
  Expand,
  Trash2,
  Send,
  Triangle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import Hls from "hls.js";


import { useNextStep } from 'nextstepjs';
import { useRouter } from "next/navigation";

// Types for drawing
type DrawingMode = "rectangle" | "square" | "polygon" | "none";
type Point = { x: number; y: number };
type Shape = { type: "rectangle" | "square" | "polygon" | "none"; points: Point[] };

type DragInfo = { shapeIndex: number; offsetX: number; offsetY: number } | null;
type ResizeInfo = { shapeIndex: number; corner: "tl" | "tr" | "bl" | "br" } | null;
type DraggingPoint = { shapeIndex: number; pointIndex: number } | null;

const DrawingCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // States
  const [drawingMode, setDrawingMode] = useState<DrawingMode>("none");
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isWebcamAvailable, setIsWebcamAvailable] = useState(true);
  const [dragInfo, setDragInfo] = useState<DragInfo>(null);
  const [resizeInfo, setResizeInfo] = useState<ResizeInfo>(null);
  const [draggingPoint, setDraggingPoint] = useState<DraggingPoint>(null);
  const [activePolygon, setActivePolygon] = useState<Point[]>([]);

  /** Convert mouse coordinates to canvas-relative coordinates */
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

  /**
   * Find the index of a shape that contains a given point (if any).
   * 
   * @param point - The mouse/canvas point to test.
   * @returns The index of the shape (from topmost to bottommost), or null if none.
  */
  const getShapeAtPoint = (point: Point): number | null => {
    // Loop backwards so top-most (latest drawn) shape is checked first
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];

      // Extract all x and y coordinates of this shape
      const xs = shape.points.map((p) => p.x);
      const ys = shape.points.map((p) => p.y);

      // Compute the bounding box of the shape
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      // Check if the given point lies inside the bounding box
      if (
        point.x >= minX &&
        point.x <= maxX &&
        point.y >= minY &&
        point.y <= maxY
      ) {
        // Return index of the shape that contains the point
        return i;
      }
    }

    // No shape found under this point
    return null;
  };


  /** 
   * Get corner information if the mouse point is near any corner of a rectangle/square.
   * Used for resizing shapes by dragging their corners.
  */
  const getCornerAtPoint = (point: Point): ResizeInfo | null => {
    const threshold = 10; // Maximum pixel distance allowed to "snap" to a corner

    // Loop through all shapes (starting from the topmost one - last in array)
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];

      // Only rectangles and squares have well-defined corners
      if (shape.type === "rectangle" || shape.type === "square") {
        // Extract the 4 corners of the shape
        const [tl, tr, br, bl] = shape.points;

        // Store corners with names for easier identification
        const corners: Record<"tl" | "tr" | "bl" | "br", Point> = { tl, tr, br, bl };

        // Check each corner to see if the given point is close enough
        for (const cornerName in corners) {
          const cornerPos = corners[cornerName as keyof typeof corners];

          // Calculate distance between mouse point and corner
          const dx = point.x - cornerPos.x;
          const dy = point.y - cornerPos.y;

          // If within threshold, return which shape and which corner was hit
          if (Math.sqrt(dx * dx + dy * dy) <= threshold) {
            return { shapeIndex: i, corner: cornerName as "tl" | "tr" | "bl" | "br" };
          }
        }
      }
    }

    // If no corner was found within threshold, return null
    return null;
  };


  /** Handle mouse down */
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasCoordinates(event.clientX, event.clientY);

    // Check if the mouse click is on an existing polygon point
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];

      // Only apply this logic for polygons
      if (shape.type === "polygon") {
        // Loop through each point of the polygon
        for (let j = 0; j < shape.points.length; j++) {
          // Calculate distance from the clicked point to the polygon vertex
          const dx = point.x - shape.points[j].x;
          const dy = point.y - shape.points[j].y;

          // If click is within 8px radius of a vertex, consider it as selecting that point
          if (Math.sqrt(dx * dx + dy * dy) <= 8) {
            // Store which polygon and which specific point is being dragged
            setDraggingPoint({ shapeIndex: i, pointIndex: j });
            return; // Exit once a point is found
          }
        }
      }
    }


    const resizeTarget = getCornerAtPoint(point);
    if (resizeTarget) {
      setResizeInfo(resizeTarget);
      return;
    }

    const shapeIndex = getShapeAtPoint(point);
    if (shapeIndex !== null) {
      const shape = shapes[shapeIndex];
      setDragInfo({
        shapeIndex,
        offsetX: point.x - shape.points[0].x,
        offsetY: point.y - shape.points[0].y,
      });
      return;
    }

    if (drawingMode !== "none") {
      setIsDrawing(true);
      setStartPoint(point);
      setCurrentPoint(point);
    }
  };

  /** Handle canvas click for polygon */
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawingMode === "polygon") {
      const point = getCanvasCoordinates(event.clientX, event.clientY);

      if (activePolygon.length >= 3) {
        const firstPoint = activePolygon[0];
        const dx = point.x - firstPoint.x;
        const dy = point.y - firstPoint.y;
        if (Math.sqrt(dx * dx + dy * dy) <= 8) {
          setShapes((prev) => [
            ...prev,
            { type: "polygon", points: [...activePolygon, firstPoint] },
          ]);
          setActivePolygon([]);
          setDrawingMode("none");
          return;
        }
      }
      setActivePolygon((prev) => [...prev, point]);
    }
  };

  /** 
   * Handle mouse movement over the canvas. 
   * This updates shapes depending on the current action:
   * - dragging polygon point
   * - drawing new shape
   * - dragging/moving entire shape
   * - resizing shape by corner
  */
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // Convert raw mouse coordinates to canvas coordinates
    const point = getCanvasCoordinates(event.clientX, event.clientY);

    // Case 1: Dragging a single point (e.g., polygon vertex)
    if (draggingPoint) {
      const { shapeIndex, pointIndex } = draggingPoint;
      const newShapes = [...shapes];
      const shape = newShapes[shapeIndex];

      // Update dragged point
      shape.points[pointIndex] = point;

      // If polygon, keep first & last point the same
      if (shape.type === "polygon") {
        if (pointIndex === 0) {
          // First point moved → update last point
          shape.points[shape.points.length - 1] = point;
        } else if (pointIndex === shape.points.length - 1) {
          // Last point moved → update first point
          shape.points[0] = point;
        }
      }

      setShapes(newShapes);

    // Case 2: Currently drawing (update live preview of shape)
    } else if (isDrawing && startPoint) {
      setCurrentPoint(point);

    // Case 3: Dragging/moving the whole shape
    } else if (dragInfo) {
      const { shapeIndex, offsetX, offsetY } = dragInfo;
      const shape = shapes[shapeIndex];
      const newShapes = [...shapes];

      // Compute movement delta relative to first point of shape
      const dx = point.x - offsetX - shape.points[0].x;
      const dy = point.y - offsetY - shape.points[0].y;

      // Shift every point of the shape by (dx, dy)
      newShapes[shapeIndex] = {
        ...shape,
        points: shape.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
      };

      setShapes(newShapes);

    // Case 4: Resizing a rectangle/square by dragging a corner
    } else if (resizeInfo) {
      const { shapeIndex, corner } = resizeInfo;
      const shape = shapes[shapeIndex];
      const [tl, tr, br, bl] = shape.points; // corners
      let newPoints = [...shape.points];

      // Adjust corners based on which one is being dragged
      switch (corner) {
        case "tl": // top-left corner
          newPoints = [point, { x: tr.x, y: point.y }, br, { x: point.x, y: bl.y }, point];
          break;
        case "tr": // top-right corner
          newPoints = [
            { x: tl.x, y: point.y },
            point,
            { x: point.x, y: br.y },
            bl,
            { x: tl.x, y: point.y },
          ];
          break;
        case "bl": // bottom-left corner
          newPoints = [
            { x: point.x, y: tl.y },
            tr,
            br,
            point,
            { x: point.x, y: tl.y },
          ];
          break;
        case "br": // bottom-right corner
          newPoints = [tl, { x: point.x, y: tl.y }, point, { x: tl.x, y: point.y }, tl];
          break;
      }

      // Update shape in state
      setShapes((prev) => {
        const newArr = [...prev];
        newArr[shapeIndex] = { ...shape, points: newPoints };
        return newArr;
      });
    }
  };


  /** Handle mouse up */
  const handleMouseUp = () => {
    if (isDrawing && startPoint && currentPoint && drawingMode !== "polygon") {
      let rectPoints: Point[];
      if (drawingMode === "square") {
        const width = currentPoint.x - startPoint.x;
        const height = currentPoint.y - startPoint.y;
        const side = Math.max(Math.abs(width), Math.abs(height));
        const endX = startPoint.x + (width > 0 ? side : -side);
        const endY = startPoint.y + (height > 0 ? side : -side);
        rectPoints = [
          startPoint,
          { x: endX, y: startPoint.y },
          { x: endX, y: endY },
          { x: startPoint.x, y: endY },
          startPoint,
        ];
      } else {
        rectPoints = [
          startPoint,
          { x: currentPoint.x, y: startPoint.y },
          currentPoint,
          { x: startPoint.x, y: currentPoint.y },
          startPoint,
        ];
      }
      setShapes((prev) => [...prev, { type: drawingMode, points: rectPoints }]);
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
    setDragInfo(null);
    setResizeInfo(null);
    setDraggingPoint(null);
  };

  /** Select whole area */
  const selectWholeArea = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rectPoints: Point[] = [
      { x: 0, y: 0 },
      { x: canvas.width, y: 0 },
      { x: canvas.width, y: canvas.height },
      { x: 0, y: canvas.height },
      { x: 0, y: 0 },
    ];
    const wholeAreaShape: Shape = { type: "rectangle", points: rectPoints };
    setShapes((prev) => [...prev, wholeAreaShape]);
  };

  /** Submit */
  const handleSubmit = () => {
    if (shapes.length === 0) {
      toast.warning("Canvas is empty. Draw something to submit!");
      return;
    }
    const data = shapes.map((shape) => (shape.points))
    console.log("Submitted Shapes:", data);
    toast.success(`Successfully submitted ${shapes.length} shape(s).`);
  };

  /** Draw shape */
  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.beginPath();
    ctx.moveTo(shape.points[0].x, shape.points[0].y);
    for (let i = 1; i < shape.points.length; i++) {
      ctx.lineTo(shape.points[i].x, shape.points[i].y);
    }
    ctx.stroke();
    ctx.fillStyle = "rgba(0, 0, 255, 0.1)";
    ctx.fill();
    ctx.fillStyle = "red";
    shape.points.forEach((p) => ctx.fillRect(p.x - 4, p.y - 4, 8, 8));
  };

  /** 
   * Effect to redraw shapes on canvas whenever state changes. 
   * This runs whenever shapes, drawing status, or polygon points are updated.
  */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // Exit if no canvas
    const ctx = canvas.getContext("2d");
    if (!ctx) return; // Exit if no context

    // Clear the whole canvas before redrawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all finalized shapes stored in state
    shapes.forEach((shape) => drawShape(ctx, shape));

    // If currently drawing (but not polygon), draw a preview shape
    if (isDrawing && startPoint && currentPoint && drawingMode !== "polygon") {
      let tempPoints: Point[] = [];

      // Case 1: Drawing a square
      if (drawingMode === "square") {
        const width = currentPoint.x - startPoint.x;
        const height = currentPoint.y - startPoint.y;

        // Square side is the larger of width/height (to enforce equal sides)
        const side = Math.max(Math.abs(width), Math.abs(height));

        // Calculate end coordinates while preserving drag direction
        const endX = startPoint.x + (width > 0 ? side : -side);
        const endY = startPoint.y + (height > 0 ? side : -side);

        // Define square corners
        tempPoints = [
          startPoint,
          { x: endX, y: startPoint.y },
          { x: endX, y: endY },
          { x: startPoint.x, y: endY },
          startPoint, // close the shape
        ];

      // Case 2: Drawing a rectangle
      } else {
        tempPoints = [
          startPoint,
          { x: currentPoint.x, y: startPoint.y },
          currentPoint,
          { x: startPoint.x, y: currentPoint.y },
          startPoint, // close the shape
        ];
      }

      // Draw the temporary preview shape
      drawShape(ctx, { type: drawingMode, points: tempPoints });
    }

    // If drawing a polygon, show in-progress polygon with live preview line
    if (drawingMode === "polygon" && activePolygon.length > 0) {
      ctx.beginPath();
      ctx.moveTo(activePolygon[0].x, activePolygon[0].y);

      // Draw lines between existing polygon points
      for (let i = 1; i < activePolygon.length; i++) {
        ctx.lineTo(activePolygon[i].x, activePolygon[i].y);
      }

      // Add a temporary line from last point to current mouse position
      if (currentPoint) ctx.lineTo(currentPoint.x, currentPoint.y);

      ctx.stroke();

      // Draw small red squares for each polygon vertex
      ctx.fillStyle = "red";
      activePolygon.forEach((p) => ctx.fillRect(p.x - 4, p.y - 4, 8, 8));
    }
  }, [shapes, isDrawing, startPoint, currentPoint, drawingMode, activePolygon]);


  /** Webcam setup */
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
        .catch(() => setIsWebcamAvailable(false));
    } else setIsWebcamAvailable(false);
  }, []);

  /** Fallback HLS */
  useEffect(() => {
    if (!isWebcamAvailable) {
      const video = videoRef.current;
      if (!video) return;
      const hlsUrl = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
        return () => hls.destroy();
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = hlsUrl;
        video.addEventListener("loadedmetadata", () => video.play());
      }
    }
  }, [isWebcamAvailable]);

  const { startNextStep } = useNextStep();
  const router = useRouter();

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" onClick={() => router.push("/ask-ai")}>Ask AI</Button>
        <Button variant="outline" onClick={() => startNextStep("mainTour")}>
           <Sparkles className="mr-2 h-4 w-4" /> Start the tour
        </Button>
        <Button
          id="step1"
          variant={drawingMode === "rectangle" ? "secondary" : "outline"}
          onClick={() => setDrawingMode("rectangle")}
        >
          <RectangleHorizontal className="mr-2 h-4 w-4" /> Rectangle
        </Button>
        {/* <Button
          variant={drawingMode === "square" ? "secondary" : "outline"}
          onClick={() => setDrawingMode("square")}
        >
          <Square className="mr-2 h-4 w-4" /> Square
        </Button> */}
        <Button
          id="step2"
          variant={drawingMode === "polygon" ? "secondary" : "outline"}
          onClick={() => setDrawingMode("polygon")}
        >
          <Triangle className="mr-2 h-4 w-4" /> Polygon
        </Button>
        <Button id="step3" variant="outline" onClick={selectWholeArea}>
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
        />
      </div>
    </div>
  );
};

export default DrawingCanvas;
