import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { addWatermark, downloadBlob } from './exportUtils';
import { useAnimationStore } from '../../stores/animationStore';
import { useCanvasStore } from '../../stores/canvasStore';
import { renderFramesOffline } from './offlineRenderer';

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

interface MP4ExportOptions {
  duration?: number;
  fps?: number;
  watermark?: boolean;
  quality?: 'high' | 'medium' | 'low';
  onProgress?: (progress: number) => void;
}

export async function exportToMP4(
  element: HTMLElement,
  options: MP4ExportOptions = {}
): Promise<void> {
  const {
    duration: exportDuration = 5,
    watermark = false,
    quality = 'high',
    onProgress = () => {},
  } = options;

  try {
    onProgress(5);

    // 导出前清空画布选中状态，避免选中特效被录入视频
    const canvasStore = useCanvasStore.getState();
    canvasStore.setSelection([]);
    canvasStore.setSelectedConnection(null);

    const ffmpegInstance = await loadFFmpeg();
    onProgress(10);

    const targetFps = 60;

    const {
      frames: frameCanvases,
      originalSettings,
      wasPlaying,
    } = await renderFramesOffline({
      element,
      duration: exportDuration,
      fps: targetFps,
      onProgress,
      progressStart: 15,
      progressEnd: 70,
    });

    const frames: string[] = [];
    for (let i = 0; i < frameCanvases.length; i++) {
      let finalCanvas = frameCanvases[i];
      if (watermark) {
        finalCanvas = addWatermark(finalCanvas, 'FlowDyno');
      }

      const blob = await new Promise<Blob>((resolve) => {
        finalCanvas.toBlob((b: Blob | null) => resolve(b!), 'image/png');
      });

      const fileName = `frame${i.toString().padStart(4, '0')}.png`;
      await ffmpegInstance.writeFile(fileName, await fetchFile(blob));
      frames.push(fileName);

      onProgress(70 + (i / frameCanvases.length) * 15);
    }

    const animationStore = useAnimationStore.getState();
    animationStore.updateSettings(originalSettings);
    if (wasPlaying) {
      animationStore.play();
    }

    onProgress(85);

    if (frames.length === 0) {
      throw new Error('No frames rendered');
    }

    const crf = quality === 'high' ? '18' : quality === 'medium' ? '23' : '28';

    // 使用相同的输入和输出帧率，避免时间映射问题
    const ffmpegArgs = [
      '-framerate',
      String(targetFps),
      '-i',
      'frame%04d.png',
      '-c:v',
      'libx264',
      '-r',
      String(targetFps),
      '-preset',
      'medium',
      '-crf',
      crf,
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      'output.mp4',
    ];

    await ffmpegInstance.exec(ffmpegArgs);

    onProgress(95);

    const data = await ffmpegInstance.readFile('output.mp4');
    const mp4Blob = new Blob([data as any], {
      type: 'video/mp4',
    });

    for (const frame of frames) {
      await ffmpegInstance.deleteFile(frame);
    }
    await ffmpegInstance.deleteFile('output.mp4');

    onProgress(100);

    const timestamp = new Date().toISOString().split('T')[0];
    downloadBlob(mp4Blob, `flowdyno-${timestamp}.mp4`);

    onProgress(100);
  } catch (error) {
    console.error('MP4 export failed:', error);

    const animationStore = useAnimationStore.getState();
    animationStore.stop();

    throw new Error('Failed to export MP4. Please try again.');
  }
}
