import Head from 'next/head';
import { useRouter } from 'next/router';
import ApiKeySettings from '../components/settings/ApiKeySettings';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Settings - FlowDyno</title>
        <meta name="description" content="Configure your FlowDyno settings" />
      </Head>

      <div className="min-h-screen bg-dark-900 text-white">
        {/* Header */}
        <header className="border-b border-white/5 bg-dark-900/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-6 py-5 flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <img src="/logo.svg" alt="FlowDyno" className="w-10 h-10" />
              <span className="text-2xl font-bold bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue bg-clip-text text-transparent">
                FlowDyno
              </span>
            </button>
            <button
              onClick={() => router.push('/editor')}
              className="px-6 py-2.5 bg-gradient-to-r from-neon-purple to-neon-blue rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-neon-purple/30 transition-all transform hover:scale-105"
            >
              Go to Editor
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-12 max-w-4xl">
          <ApiKeySettings />
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 py-8 px-6 mt-16">
          <div className="container mx-auto max-w-4xl text-center text-sm text-gray-500">
            <p>© 2025 FlowDyno. Free & Open Source.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
