import { useRouter } from 'next/router';

interface HeaderProps {
  variant?: 'fixed' | 'sticky';
  showBeta?: boolean;
  activeNav?: 'home' | 'features';
}

export default function Header({ variant = 'sticky', showBeta = false, activeNav }: HeaderProps) {
  const router = useRouter();

  const headerClass =
    variant === 'fixed'
      ? 'fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-dark-900/60 backdrop-blur-2xl shadow-lg shadow-black/10'
      : 'border-b border-white/5 bg-dark-900/80 backdrop-blur-xl sticky top-0 z-50';

  const navItems = [
    { id: 'home', href: '/', label: 'Home' },
    { id: 'features', href: '#features', label: 'Features', homeOnly: true },
  ];

  return (
    <header className={headerClass}>
      <div className="container mx-auto px-6 py-5 flex items-center justify-between">
        <div
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => router.push('/')}
        >
          <img src="/logo.svg" alt="FlowDyno" className="w-10 h-10" />
          <span className="text-2xl font-bold bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue bg-clip-text text-transparent">
            FlowDyno
          </span>
          {showBeta && (
            <span className="px-2 py-1 text-xs font-semibold bg-neon-purple/20 text-neon-purple border border-neon-purple/30 rounded-md">
              ALPHA
            </span>
          )}
        </div>
        <nav className="flex items-center space-x-6">
          {navItems.map((item) => {
            if (item.homeOnly && activeNav !== 'home' && activeNav !== 'features') return null;
            const isActive = activeNav === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  isActive ? 'text-white font-semibold' : 'text-gray-300 hover:text-white'
                }`}
              >
                {item.label}
              </a>
            );
          })}
          <button
            onClick={() => router.push('/editor')}
            className="px-6 py-2.5 bg-gradient-to-r from-neon-purple to-neon-blue rounded-lg font-semibold text-sm hover:shadow-lg hover:shadow-neon-purple/30 transition-all transform hover:scale-105"
          >
            Get Started
          </button>
        </nav>
      </div>
    </header>
  );
}
