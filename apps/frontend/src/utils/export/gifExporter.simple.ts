import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { addWatermark, downloadBlob } from './exportUtils';
import { useCanvasStore } from '../../stores/canvasStore';
import html2canvas from 'html2canvas';

let ffmpeg: FFmpeg | null = null;
let isLoading = false;

async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;

  if (isLoading) {
    await new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (ffmpeg) {
          clearInterval(checkInterval);
          resolve(ffmpeg);
        }
      }, 100);
    });
    return ffmpeg!;
  }

  isLoading = true;
  ffmpeg = new FFmpeg();

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  isLoading = false;
  return ffmpeg;
}

interface GIFExportOptions {
  duration?: number;
  fps?: number;
  watermark?: boolean;
  onProgress?: (progress: number) => void;
}

export async function exportToGIFSimple(
  element: HTMLElement,
  options: GIFExportOptions = {}
): Promise<void> {
  const { watermark = false, onProgress = () => {} } = options;

  try {
    onProgress(5);

    const canvasStore = useCanvasStore.getState();

    canvasStore.setSelection([]);
    canvasStore.setSelectedConnection(null);

    if (canvasStore.nodes.length === 0) {
      throw new Error('请先在画布上添加一些节点');
    }

    const ffmpegInstance = await loadFFmpeg();
    onProgress(10);

    const exportDuration = 3;
    const targetFps = 15;
    const totalFrames = Math.round(exportDuration * targetFps);

    console.log(`简化版GIF导出: ${totalFrames}帧, ${targetFps}fps, ${exportDuration}秒`);

    const viewportElement = element.querySelector('.react-flow__viewport') as HTMLElement;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    canvasStore.nodes.forEach((node) => {
      const x = node.position.x;
      const y = node.position.y;
      const width = node.width || 85;
      const height = node.height || 85;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    const padding = 100;
    const boundsWidth = Math.max(100, maxX - minX + padding * 2);
    const boundsHeight = Math.max(100, maxY - minY + padding * 2);

    const originalTransform = viewportElement ? viewportElement.style.transform : '';
    const originalWidth = element.style.width;
    const originalHeight = element.style.height;
    const originalOverflow = element.style.overflow;

    if (viewportElement) {
      const offsetX = -(minX - padding);
      const offsetY = -(minY - padding);
      viewportElement.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(1)`;
    }

    element.style.width = `${boundsWidth}px`;
    element.style.height = `${boundsHeight}px`;
    element.style.overflow = 'hidden';

    const frames: string[] = [];

    try {
      for (let i = 0; i <= totalFrames; i++) {
        const canvas = await html2canvas(element, {
          backgroundColor: '#1a1a2e',
          scale: 1,
          logging: false,
          useCORS: true,
          width: boundsWidth,
          height: boundsHeight,
        });

        if (i === 0) {
          console.log('Canvas尺寸:', canvas.width, 'x', canvas.height);
        }

        let finalCanvas = canvas;
        if (watermark) {
          finalCanvas = addWatermark(canvas, 'FlowDyno');
        }

        const blob = await new Promise<Blob>((resolve, reject) => {
          finalCanvas.toBlob((b: Blob | null) => {
            if (b) resolve(b);
            else reject(new Error(`帧${i}转换失败`));
          }, 'image/png');
        });

        const fileName = `frame${i.toString().padStart(4, '0')}.png`;
        await ffmpegInstance.writeFile(fileName, await fetchFile(blob));
        frames.push(fileName);

        onProgress(10 + (i / totalFrames) * 70);
      }

      console.log(`已生成${frames.length}帧`);
      onProgress(80);

      await ffmpegInstance.exec([
        '-framerate',
        String(targetFps),
        '-i',
        'frame%04d.png',
        '-vf',
        'fps=15,scale=640:-1:flags=lanczos',
        '-loop',
        '0',
        'output.gif',
      ]);

      onProgress(90);

      const data = await ffmpegInstance.readFile('output.gif');
      console.log(`GIF大小: ${data.length} bytes`);

      if (data.length === 0) {
        throw new Error('GIF文件为空,请查看控制台日志');
      }

      const gifBlob = new Blob([data as any], { type: 'image/gif' });

      for (const frame of frames) {
        await ffmpegInstance.deleteFile(frame);
      }
      await ffmpegInstance.deleteFile('output.gif');

      onProgress(100);

      const timestamp = new Date().toISOString().split('T')[0];
      downloadBlob(gifBlob, `flowdyno-simple-${timestamp}.gif`);

      console.log('GIF导出成功!');
    } finally {
      if (viewportElement) {
        viewportElement.style.transform = originalTransform;
      }
      element.style.width = originalWidth;
      element.style.height = originalHeight;
      element.style.overflow = originalOverflow;
    }
  } catch (error) {
    console.error('GIF导出失败:', error);
    throw error;
  }
}
