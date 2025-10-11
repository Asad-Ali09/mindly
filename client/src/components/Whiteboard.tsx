'use client';

import React, { useRef, useEffect, useState } from 'react';

interface Point {
  x: number;
  y: number;
}

interface DrawingElement {
  type: 
    | 'line'           // Straight lines for diagrams
    | 'curve'          // Smooth curves for natural annotations
    | 'arrow'          // Directional pointers
    | 'circle'         // Circles and highlights
    | 'rectangle'      // Boxes and shapes
    | 'text'           // Labels and explanations
    | 'polygon'        // Any multi-sided shape (triangles, pentagons, etc.)
    | 'highlighter'    // Semi-transparent emphasis
    | 'axis'           // Coordinate system
    | 'graph'          // Plot points/functions
    | 'angle'          // Angle markers with arc
    | 'dashed-line';   // Auxiliary/construction lines
  
  points?: Point[];
  start?: Point;
  end?: Point;
  radius?: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  color: string;
  lineWidth: number;
  opacity?: number;       // For highlighter
  fill?: boolean;         // Fill shapes or just stroke
  degrees?: number;       // For angle markers
  plotFunction?: string;  // For graph: function to plot
  xRange?: [number, number]; // For axis/graph
  yRange?: [number, number]; // For axis/graph
  dashPattern?: number[]; // For dashed lines
}

const Whiteboard = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<DrawingElement[]>([]);

  // Sample data - educational content about mathematics
  const sampleData: DrawingElement[] = [
    // Title text
    {
      type: 'text',
      start: { x: 50, y: 50 },
      text: 'Pythagorean Theorem',
      color: '#2563eb',
      lineWidth: 2,
    },
    // Formula
    {
      type: 'text',
      start: { x: 50, y: 100 },
      text: 'a² + b² = c²',
      color: '#dc2626',
      lineWidth: 2,
    },
    // Right triangle - vertical line
    {
      type: 'line',
      points: [
        { x: 100, y: 300 },
        { x: 100, y: 150 },
      ],
      color: '#1f2937',
      lineWidth: 3,
    },
    // Right triangle - horizontal line
    {
      type: 'line',
      points: [
        { x: 100, y: 300 },
        { x: 300, y: 300 },
      ],
      color: '#1f2937',
      lineWidth: 3,
    },
    // Right triangle - hypotenuse
    {
      type: 'line',
      points: [
        { x: 100, y: 150 },
        { x: 300, y: 300 },
      ],
      color: '#1f2937',
      lineWidth: 3,
    },
    // Labels
    {
      type: 'text',
      start: { x: 60, y: 220 },
      text: 'a',
      color: '#059669',
      lineWidth: 2,
    },
    {
      type: 'text',
      start: { x: 190, y: 330 },
      text: 'b',
      color: '#059669',
      lineWidth: 2,
    },
    {
      type: 'text',
      start: { x: 220, y: 210 },
      text: 'c',
      color: '#dc2626',
      lineWidth: 2,
    },
    // Circle to highlight right angle
    {
      type: 'rectangle',
      start: { x: 100, y: 280 },
      width: 20,
      height: 20,
      color: '#1f2937',
      lineWidth: 2,
    },
    // Example values
    {
      type: 'text',
      start: { x: 400, y: 150 },
      text: 'Example:',
      color: '#2563eb',
      lineWidth: 2,
    },
    {
      type: 'text',
      start: { x: 400, y: 190 },
      text: 'If a = 3 and b = 4',
      color: '#1f2937',
      lineWidth: 1.5,
    },
    {
      type: 'text',
      start: { x: 400, y: 230 },
      text: 'Then c = √(9 + 16) = 5',
      color: '#1f2937',
      lineWidth: 1.5,
    },
    // Arrow pointing to triangle
    {
      type: 'arrow',
      start: { x: 380, y: 270 },
      end: { x: 320, y: 270 },
      color: '#7c3aed',
      lineWidth: 2,
    },
    // Smooth curve for annotation/emphasis
    {
      type: 'curve',
      points: [
        { x: 50, y: 120 },
        { x: 80, y: 110 },
        { x: 110, y: 115 },
        { x: 140, y: 120 },
        { x: 170, y: 118 },
        { x: 200, y: 120 },
      ],
      color: '#dc2626',
      lineWidth: 2,
    },
    // Curved arrow-like underline for emphasis
    {
      type: 'curve',
      points: [
        { x: 400, y: 160 },
        { x: 430, y: 165 },
        { x: 460, y: 163 },
        { x: 490, y: 160 },
      ],
      color: '#2563eb',
      lineWidth: 2,
    },
    // Highlighter over formula
    {
      type: 'highlighter',
      start: { x: 45, y: 80 },
      width: 160,
      height: 35,
      color: '#fbbf24',
      opacity: 0.3,
      lineWidth: 0,
    },
    // Polygon - filled triangle
    {
      type: 'polygon',
      points: [
        { x: 550, y: 450 },
        { x: 650, y: 450 },
        { x: 600, y: 380 },
      ],
      color: '#10b981',
      lineWidth: 2,
      fill: true,
      opacity: 0.3,
    },
    // Dashed line for construction
    {
      type: 'dashed-line',
      start: { x: 300, y: 150 },
      end: { x: 100, y: 300 },
      color: '#6b7280',
      lineWidth: 1,
      dashPattern: [5, 5],
    },
    // Angle marker at right angle
    {
      type: 'angle',
      start: { x: 100, y: 300 },
      degrees: 90,
      radius: 30,
      color: '#8b5cf6',
      lineWidth: 2,
    },
    // Coordinate axis
    {
      type: 'axis',
      start: { x: 550, y: 300 },
      width: 200,
      height: 150,
      color: '#1f2937',
      lineWidth: 2,
      xRange: [-5, 5],
      yRange: [-3, 3],
    },
  ];

  useEffect(() => {
    setElements(sampleData);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid pattern (like a real whiteboard)
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    const gridSize = 30;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw all elements
    elements.forEach((element) => {
      ctx.strokeStyle = element.color;
      ctx.fillStyle = element.color;
      ctx.lineWidth = element.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      switch (element.type) {
        case 'line':
          if (element.points && element.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(element.points[0].x, element.points[0].y);
            for (let i = 1; i < element.points.length; i++) {
              ctx.lineTo(element.points[i].x, element.points[i].y);
            }
            ctx.stroke();
          }
          break;

        case 'circle':
          if (element.start && element.radius) {
            ctx.beginPath();
            ctx.arc(element.start.x, element.start.y, element.radius, 0, 2 * Math.PI);
            ctx.stroke();
          }
          break;

        case 'rectangle':
          if (element.start && element.width && element.height) {
            ctx.strokeRect(element.start.x, element.start.y, element.width, element.height);
          }
          break;

        case 'text':
          if (element.start && element.text) {
            // Determine font size based on content or explicit fontSize
            const fontSize = element.fontSize || 20;
            const isTitle = element.text.includes('Theorem') || element.text.includes('Example');
            ctx.font = isTitle ? `bold ${fontSize + 4}px Arial` : `${fontSize}px Arial`;
            ctx.fillText(element.text, element.start.x, element.start.y);
          }
          break;

        case 'arrow':
          if (element.start && element.end) {
            const headLength = 15;
            const angle = Math.atan2(element.end.y - element.start.y, element.end.x - element.start.x);

            // Draw line
            ctx.beginPath();
            ctx.moveTo(element.start.x, element.start.y);
            ctx.lineTo(element.end.x, element.end.y);
            ctx.stroke();

            // Draw arrowhead
            ctx.beginPath();
            ctx.moveTo(element.end.x, element.end.y);
            ctx.lineTo(
              element.end.x - headLength * Math.cos(angle - Math.PI / 6),
              element.end.y - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(element.end.x, element.end.y);
            ctx.lineTo(
              element.end.x - headLength * Math.cos(angle + Math.PI / 6),
              element.end.y - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }
          break;

        case 'curve':
          if (element.points && element.points.length > 2) {
            ctx.beginPath();
            ctx.moveTo(element.points[0].x, element.points[0].y);

            // Use quadratic curves for smooth drawing
            for (let i = 1; i < element.points.length - 1; i++) {
              const currentPoint = element.points[i];
              const nextPoint = element.points[i + 1];
              
              // Calculate control point (midpoint between current and next)
              const controlX = (currentPoint.x + nextPoint.x) / 2;
              const controlY = (currentPoint.y + nextPoint.y) / 2;
              
              ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, controlX, controlY);
            }

            // Draw to the last point
            const lastPoint = element.points[element.points.length - 1];
            ctx.lineTo(lastPoint.x, lastPoint.y);
            ctx.stroke();
          }
          break;

        case 'polygon':
          if (element.points && element.points.length > 2) {
            ctx.beginPath();
            ctx.moveTo(element.points[0].x, element.points[0].y);
            for (let i = 1; i < element.points.length; i++) {
              ctx.lineTo(element.points[i].x, element.points[i].y);
            }
            ctx.closePath();
            
            if (element.fill) {
              const prevAlpha = ctx.globalAlpha;
              ctx.globalAlpha = element.opacity || 1;
              ctx.fill();
              ctx.globalAlpha = prevAlpha;
            }
            ctx.stroke();
          }
          break;

        case 'highlighter':
          if (element.start && element.width && element.height) {
            const prevAlpha = ctx.globalAlpha;
            ctx.globalAlpha = element.opacity || 0.3;
            ctx.fillRect(element.start.x, element.start.y, element.width, element.height);
            ctx.globalAlpha = prevAlpha;
          }
          break;

        case 'dashed-line':
          if (element.start && element.end) {
            ctx.setLineDash(element.dashPattern || [5, 5]);
            ctx.beginPath();
            ctx.moveTo(element.start.x, element.start.y);
            ctx.lineTo(element.end.x, element.end.y);
            ctx.stroke();
            ctx.setLineDash([]); // Reset
          }
          break;

        case 'angle':
          if (element.start && element.degrees && element.radius) {
            const angleRad = (element.degrees * Math.PI) / 180;
            
            // Draw arc
            ctx.beginPath();
            ctx.arc(element.start.x, element.start.y, element.radius, 0, angleRad);
            ctx.stroke();

            // Draw angle lines
            ctx.beginPath();
            ctx.moveTo(element.start.x, element.start.y);
            ctx.lineTo(element.start.x + element.radius, element.start.y);
            ctx.moveTo(element.start.x, element.start.y);
            ctx.lineTo(
              element.start.x + element.radius * Math.cos(angleRad),
              element.start.y + element.radius * Math.sin(angleRad)
            );
            ctx.stroke();

            // Draw degree label
            ctx.font = '14px Arial';
            ctx.fillText(
              `${element.degrees}°`,
              element.start.x + element.radius * 0.5,
              element.start.y - 10
            );
          }
          break;

        case 'axis':
          if (element.start && element.width && element.height) {
            const centerX = element.start.x + element.width / 2;
            const centerY = element.start.y + element.height / 2;

            // Draw X axis
            ctx.beginPath();
            ctx.moveTo(element.start.x, centerY);
            ctx.lineTo(element.start.x + element.width, centerY);
            ctx.stroke();

            // Draw Y axis
            ctx.beginPath();
            ctx.moveTo(centerX, element.start.y);
            ctx.lineTo(centerX, element.start.y + element.height);
            ctx.stroke();

            // Draw arrow heads
            const arrowSize = 8;
            // X-axis arrow
            ctx.beginPath();
            ctx.moveTo(element.start.x + element.width, centerY);
            ctx.lineTo(element.start.x + element.width - arrowSize, centerY - arrowSize / 2);
            ctx.lineTo(element.start.x + element.width - arrowSize, centerY + arrowSize / 2);
            ctx.closePath();
            ctx.fill();

            // Y-axis arrow
            ctx.beginPath();
            ctx.moveTo(centerX, element.start.y);
            ctx.lineTo(centerX - arrowSize / 2, element.start.y + arrowSize);
            ctx.lineTo(centerX + arrowSize / 2, element.start.y + arrowSize);
            ctx.closePath();
            ctx.fill();

            // Labels
            ctx.font = '12px Arial';
            ctx.fillText('x', element.start.x + element.width - 10, centerY + 15);
            ctx.fillText('y', centerX + 10, element.start.y + 10);
            ctx.fillText('0', centerX - 15, centerY + 15);
          }
          break;
      }
    });
  }, [elements]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-gray-800 text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <h2 className="text-xl font-semibold">AI Tutor - Whiteboard</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setElements(sampleData)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Load Sample
          </button>
          <button
            onClick={() => setElements([])}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-2xl border-4 border-gray-300" style={{ padding: '20px' }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="border-2 border-gray-200 rounded cursor-crosshair"
          />
        </div>
      </div>

    </div>
  );
};

export default Whiteboard;
