import Link from 'next/link';

interface UpgradePromptProps {
  message: string;
  onClose: () => void;
}

export default function UpgradePrompt({ message, onClose }: UpgradePromptProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-neon-purple/50 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-neon-purple/20">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-neon-purple to-neon-blue rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚡</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Pro</h2>
          <p className="text-gray-400">{message}</p>
        </div>

        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <h3 className="text-white font-semibold mb-3">Pro Features:</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex items-center">
              <span className="text-neon-purple mr-2">✓</span>
              Unlimited AI generations
            </li>
            <li className="flex items-center">
              <span className="text-neon-purple mr-2">✓</span>
              Unlimited projects
            </li>
            <li className="flex items-center">
              <span className="text-neon-purple mr-2">✓</span>
              No watermark exports
            </li>
            <li className="flex items-center">
              <span className="text-neon-purple mr-2">✓</span>
              MP4 video export
            </li>
            <li className="flex items-center">
              <span className="text-neon-purple mr-2">✓</span>
              Priority support
            </li>
          </ul>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg font-semibold hover:bg-white/10 transition-all"
          >
            Maybe Later
          </button>
          <Link
            href="/pricing"
            className="flex-1 px-4 py-3 bg-gradient-to-r from-neon-purple to-neon-blue rounded-lg font-semibold hover:shadow-lg hover:shadow-neon-purple/40 transition-all text-center"
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    </div>
  );
}
