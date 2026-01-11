import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { addWatermark, downloadBlob } from './exportUtils';
import { renderFramesOffline } from './offlineRenderer';
import { useAnimationStore } from '../../stores/animationStore';

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

export async function exportToGIF(
  element: HTMLElement,
  options: GIFExportOptions = {}
): Promise<void> {
  const { watermark = false, onProgress = () => {} } = options;

  try {
    onProgress(5);
    const ffmpegInstance = await loadFFmpeg();
    onProgress(10);

    const exportDuration = 5;
    const targetFps = 15;

    console.log('Starting frame rendering...');
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

    console.log(`Rendered ${frameCanvases.length} frames`);

    if (frameCanvases.length === 0) {
      throw new Error('No frames were rendered. Please check your canvas.');
    }

    const frames: string[] = [];
    const batchSize = 10;

    console.log('Converting frames to PNG...');
    for (let i = 0; i < frameCanvases.length; i++) {
      let finalCanvas = frameCanvases[i];

      if (!finalCanvas || finalCanvas.width === 0 || finalCanvas.height === 0) {
        console.error(`Invalid canvas at frame ${i}:`, finalCanvas);
        throw new Error(`Frame ${i} has invalid dimensions`);
      }

      if (watermark) {
        finalCanvas = addWatermark(finalCanvas, 'FlowDyno');
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        finalCanvas.toBlob(
          (b: Blob | null) => {
            if (b) {
              resolve(b);
            } else {
              reject(new Error(`Failed to create blob for frame ${i}`));
            }
          },
          'image/png',
          0.95
        );
      });

      if (blob.size === 0) {
        throw new Error(`Frame ${i} blob is empty`);
      }

      const fileName = `frame${i.toString().padStart(4, '0')}.png`;
      const fileData = await fetchFile(blob);
      await ffmpegInstance.writeFile(fileName, fileData);
      frames.push(fileName);

      if (i === 0) {
        console.log(`First frame: ${fileName}, size: ${fileData.length} bytes`);
      }

      if (i % batchSize === 0 && i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      onProgress(70 + (i / frameCanvases.length) * 15);
    }

    console.log(`Converted ${frames.length} frames to PNG`);
    frameCanvases.length = 0;

    const animationStore = useAnimationStore.getState();
    animationStore.updateSettings(originalSettings);
    if (wasPlaying) {
      animationStore.play();
    }

    onProgress(85);

    console.log('Running FFmpeg to create GIF...');
    console.log(`Total frames to encode: ${frames.length}`);

    ffmpegInstance.on('log', ({ message }) => {
      console.log('FFmpeg:', message);
    });

    try {
      const files = await ffmpegInstance.listDir('/');
      console.log(
        'Files in FFmpeg filesystem:',
        files.map((f) => f.name)
      );
    } catch (e) {
      console.log('Could not list files:', e);
    }

    console.log(`Creating GIF from ${frames.length} frames at ${targetFps}fps...`);

    try {
      await ffmpegInstance.exec([
        '-framerate',
        String(targetFps),
        '-i',
        'frame%04d.png',
        '-vf',
        'fps=15,scale=640:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3',
        '-loop',
        '0',
        '-y',
        'output.gif',
      ]);
      console.log('FFmpeg exec completed');
    } catch (error) {
      console.error('FFmpeg exec failed:', error);
      throw error;
    }

    onProgress(95);

    console.log('Checking if output.gif exists...');
    try {
      const filesAfter = await ffmpegInstance.listDir('/');
      console.log(
        'Files after encoding:',
        filesAfter.map((f) => f.name)
      );
      const outputFile = filesAfter.find((f) => f.name === 'output.gif');
      if (outputFile) {
        console.log('output.gif found');
      } else {
        console.error('output.gif not found in filesystem!');
      }
    } catch (e) {
      console.log('Could not list files after encoding:', e);
    }

    console.log('Reading output GIF...');
    const data = await ffmpegInstance.readFile('output.gif');
    console.log(`GIF file size: ${data.length} bytes`);

    if (data.length === 0) {
      throw new Error('Generated GIF file is empty. Check FFmpeg logs above for errors.');
    }

    const gifBlob = new Blob([data as any], {
      type: 'image/gif',
    });

    console.log(`GIF blob size: ${gifBlob.size} bytes`);

    for (const frame of frames) {
      await ffmpegInstance.deleteFile(frame);
    }
    await ffmpegInstance.deleteFile('output.gif');

    onProgress(100);

    const timestamp = new Date().toISOString().split('T')[0];
    downloadBlob(gifBlob, `flowdyno-${timestamp}.gif`);
    console.log('GIF export completed successfully');
  } catch (error) {
    console.error('GIF export failed:', error);
    throw error instanceof Error ? error : new Error('Failed to export GIF. Please try again.');
  }
}
