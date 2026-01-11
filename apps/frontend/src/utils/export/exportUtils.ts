import { renderStaticOffline } from './offlineRenderer';

export interface ExportOptions {
  format: 'png' | 'jpg' | 'svg' | 'json' | 'gif' | 'mp4' | 'html';
  quality?: number;
  watermark?: boolean;
  width?: number;
  height?: number;
}

export async function captureCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  const { canvas } = await renderStaticOffline(element);
  return canvas;
}

export function addWatermark(
  canvas: HTMLCanvasElement,
  text: string = 'Made with FlowDyno'
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const fontSize = Math.max(12, Math.min(18, canvas.width / 80));
  ctx.font = `500 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

  const gradient = ctx.createLinearGradient(
    canvas.width - 200,
    canvas.height - 40,
    canvas.width - 20,
    canvas.height - 20
  );
  gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
  gradient.addColorStop(1, 'rgba(59, 130, 246, 0.4)');

  ctx.fillStyle = gradient;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';

  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  const padding = 16;
  ctx.fillText(text, canvas.width - padding, canvas.height - padding);

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  return canvas;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number = 0.95
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      type,
      quality
    );
  });
}

export async function exportToPNG(element: HTMLElement, options: ExportOptions): Promise<void> {
  const canvas = await captureCanvas(element);

  if (options.watermark) {
    addWatermark(canvas);
  }

  const blob = await canvasToBlob(canvas, 'image/png');
  downloadBlob(blob, `flowdyno-${Date.now()}.png`);
}

export async function exportToJPG(element: HTMLElement, options: ExportOptions): Promise<void> {
  const canvas = await captureCanvas(element);

  if (options.watermark) {
    addWatermark(canvas);
  }

  const blob = await canvasToBlob(canvas, 'image/jpeg', options.quality || 0.9);
  downloadBlob(blob, `flowdyno-${Date.now()}.jpg`);
}

export async function exportToSVG(element: HTMLElement): Promise<void> {
  const { canvas } = await renderStaticOffline(element);

  const imageData = canvas.toDataURL('image/png');

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
  <rect width="100%" height="100%" fill="#1a1a2e"/>
  <image width="${canvas.width}" height="${canvas.height}" xlink:href="${imageData}"/>
</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  downloadBlob(blob, `flowdyno-${Date.now()}.svg`);
}

export function exportToJSON(nodes: any[], connections: any[], animationSettings?: any): void {
  // Add default width/height to nodes that don't have them
  const processedNodes = nodes.map((node) => {
    // If node already has width and height, use them
    if (node.width !== undefined && node.height !== undefined) {
      return node;
    }

    // Determine default size based on node type
    let defaultWidth = 85;
    let defaultHeight = 85;

    if (node.type === 'frame') {
      defaultWidth = node.width || 300;
      defaultHeight = node.height || 200;
    } else if (node.type === 'text') {
      defaultWidth = node.width || 200;
      defaultHeight = node.height || 60;
    } else if (node.type === 'image') {
      defaultWidth = node.width || 85;
      defaultHeight = node.height || 85;
    } else if (node.type === 'icon') {
      defaultWidth = node.width || 60;
      defaultHeight = node.height || 60;
    }

    return {
      ...node,
      width: defaultWidth,
      height: defaultHeight,
    };
  });

  const data = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    nodes: processedNodes,
    connections,
    animationSettings,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const timestamp = new Date().toISOString().split('T')[0];
  downloadBlob(blob, `flowdyno-${timestamp}.json`);
}

export function importFromJSON(
  onSuccess: (data: { nodes: any[]; connections: any[]; animationSettings?: any }) => void,
  onError: (error: string) => void
): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.nodes || !data.connections) {
        throw new Error('Invalid FlowDyno JSON file: missing nodes or connections');
      }

      if (data.version !== '1.0.0') {
        console.warn('JSON file version mismatch, attempting to import anyway');
      }

      onSuccess({
        nodes: data.nodes,
        connections: data.connections,
        animationSettings: data.animationSettings,
      });
    } catch (error) {
      console.error('Import failed:', error);
      onError(error instanceof Error ? error.message : 'Failed to import JSON file');
    }
  };

  input.click();
}

export async function exportToHTML(element: HTMLElement): Promise<void> {
  const canvas = await captureCanvas(element);
  const imageData = canvas.toDataURL('image/png');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FlowDyno Architecture Diagram</title>
  <style>
    body { margin: 0; padding: 20px; background: #0a0a0f; font-family: Arial, sans-serif; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #fff; text-align: center; }
    img { width: 100%; height: auto; border-radius: 8px; }
    .footer { text-align: center; color: #666; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Architecture Diagram</h1>
    <img src="${imageData}" alt="Architecture Diagram" />
    <div class="footer">
      <p>Created with <a href="https://flowdyno.ai" style="color: #8b5cf6;">FlowDyno</a></p>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  downloadBlob(blob, `flowdyno-${Date.now()}.html`);
}
