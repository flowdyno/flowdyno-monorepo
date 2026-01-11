import { useState } from 'react';
import { useCanvasStore } from '../../stores/canvasStore';
import { useAnimationStore } from '../../stores/animationStore';
import {
  exportToPNG,
  exportToJPG,
  exportToSVG,
  exportToJSON,
  exportToHTML,
} from '../../utils/export/exportUtils';
import { exportToGIF } from '../../utils/export/gifExporter';
import { exportToMP4 } from '../../utils/export/mp4Exporter';

interface ExportModalProps {
  onClose: () => void;
}

type ExportFormat = 'png' | 'jpg' | 'svg' | 'json' | 'gif' | 'mp4' | 'html';

export default function ExportModal({ onClose }: ExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('gif');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { nodes, connections } = useCanvasStore();
  const animationSettings = useAnimationStore((state) => state.settings);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      const canvasElement = document.querySelector('.react-flow') as HTMLElement;
      if (!canvasElement) {
        throw new Error('Canvas not found');
      }

      switch (format) {
        case 'png':
          await exportToPNG(canvasElement, { format: 'png', watermark: false });
          break;
        case 'jpg':
          await exportToJPG(canvasElement, {
            format: 'jpg',
            watermark: false,
            quality: 0.9,
          });
          break;
        case 'svg':
          await exportToSVG(canvasElement);
          break;
        case 'json':
          exportToJSON(nodes, connections, animationSettings);
          break;
        case 'html':
          await exportToHTML(canvasElement);
          break;
        case 'gif':
          await exportToGIF(canvasElement, {
            duration: 5,
            fps: 30,
            watermark: false,
            onProgress: setProgress,
          });
          break;
        case 'mp4':
          await exportToMP4(canvasElement, {
            duration: 5,
            watermark: false,
            quality: 'high',
            onProgress: setProgress,
          });
          break;
        default:
          throw new Error('Unsupported format');
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  const formats = [
    {
      id: 'gif',
      name: 'GIF',
      icon: '🎞️',
      description: 'Animated image (30fps, 5s)',
    },
    {
      id: 'png',
      name: 'PNG',
      icon: '🖼️',
      description: 'High-quality static image',
    },
    {
      id: 'jpg',
      name: 'JPG',
      icon: '📷',
      description: 'Compressed static image',
    },
    {
      id: 'mp4',
      name: 'MP4',
      icon: '🎬',
      description: 'High-quality video',
    },
    {
      id: 'svg',
      name: 'SVG',
      icon: '🎨',
      description: 'Scalable vector graphics',
    },
    {
      id: 'html',
      name: 'HTML',
      icon: '🌐',
      description: 'Self-contained web page',
    },
    {
      id: 'json',
      name: 'JSON',
      icon: '📄',
      description: 'Diagram data for re-import',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-dark-600 rounded-lg max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold neon-blue">📦 Export Diagram</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-3">Select Format</label>
            <div className="space-y-2">
              {formats.map((fmt: any) => (
                <button
                  key={fmt.id}
                  onClick={() => setFormat(fmt.id as ExportFormat)}
                  className={`w-full p-4 rounded-lg border transition-all text-left ${
                    format === fmt.id
                      ? 'bg-neon-purple/20 border-neon-purple'
                      : 'bg-dark-700 border-dark-600 hover:border-dark-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{fmt.icon}</span>
                      <div>
                        <div className="font-semibold">
                          <span>{fmt.name}</span>
                        </div>
                        <div className="text-sm text-gray-400">{fmt.description}</div>
                      </div>
                    </div>
                    {format === fmt.id && <span className="text-neon-purple">✓</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
              <div className="flex items-start space-x-2">
                <span className="text-red-500">❌</span>
                <div className="text-sm text-red-200">{error}</div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-dark-700">
            <div className="text-sm text-gray-500">
              {isExporting ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2">⚙️</span>
                  {progress > 0 ? `Exporting ${Math.floor(progress)}%` : 'Exporting...'}
                </span>
              ) : (
                <span>💡 Includes animations</span>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded transition-colors"
                disabled={isExporting}
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="px-6 py-2 bg-gradient-to-r from-neon-blue to-neon-purple rounded font-semibold hover:shadow-lg hover:shadow-neon-blue/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
