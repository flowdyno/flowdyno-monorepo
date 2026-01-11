import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/common/Header';

const MAX_CHARS = 100;

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [prompt]);

  // Handle input with character limit
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setPrompt(value);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <Header variant="fixed" showBeta activeNav="home" />

      {/* Open Source Banner */}
      <div className="fixed top-20 left-0 right-0 z-40 bg-gradient-to-r from-neon-purple/10 via-neon-blue/10 to-neon-purple/10 border-b border-neon-purple/20 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-3 flex items-center justify-center gap-6">
          <p className="text-sm text-gray-300">
            <span className="font-semibold text-neon-purple">🎉 Free & Open Source</span>
            {' · '}Bring your own API key
          </p>
          <a
            href="https://github.com/flowdyno/flowdyno-monorepo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-dark-800/50 border border-white/10 rounded-lg hover:border-neon-purple/50 transition-all text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            <span>Star on GitHub</span>
          </a>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 flex-1 flex items-center justify-center px-6 py-32 pt-52">
        <div className="w-full max-w-[1400px] mx-auto text-center">
          {/* Product Hunt Badge */}
          <a
            href="https://www.producthunt.com/products/flowdyno?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-flowdyno"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mb-8 hover:opacity-90 transition-opacity"
          >
            <img
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1047298&theme=dark&t=1765190160479"
              alt="FlowDyno - AI Dynamic Architecture Diagram Generator | Product Hunt"
              style={{ width: 250, height: 54 }}
              width="250"
              height="54"
            />
          </a>

          {/* Main Heading */}
          <h1 className="text-7xl font-bold mb-8 leading-tight tracking-tight">
            <span className="block bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent mb-2">
              AI-Powered
            </span>
            <span className="block bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text text-transparent mb-2">
              Dynamic Architecture
            </span>
            <span className="block bg-gradient-to-r from-neon-pink to-neon-orange bg-clip-text text-transparent">
              Diagrams
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Generate, animate, and export professional system diagrams in seconds
          </p>

          <div className="flex items-center justify-center gap-3 mb-12">
            <span className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-sm font-semibold text-green-300">
              ✓ Free Forever
            </span>
            <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-sm font-semibold text-blue-300">
              ✓ Open Source
            </span>
            <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-sm font-semibold text-purple-300">
              ✓ Self-Hosted
            </span>
          </div>

          {/* Demo Input */}
          <div className="w-full max-w-[900px] mx-auto mb-10">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300" />
              <div className="relative bg-dark-800/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                <style jsx>{`
                  textarea::-webkit-scrollbar {
                    width: 6px;
                  }
                  textarea::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  textarea::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                  }
                  textarea::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                  }
                  textarea {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
                  }
                `}</style>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={prompt}
                  onChange={handleInputChange}
                  placeholder="Describe your system architecture in plain English..."
                  className="w-full px-6 py-5 bg-transparent focus:outline-none text-white placeholder-gray-500 text-lg resize-none overflow-y-auto"
                  style={{ minHeight: '80px', maxHeight: '200px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && prompt.trim()) {
                      e.preventDefault();
                      router.push(`/editor?prompt=${encodeURIComponent(prompt)}`);
                    }
                  }}
                />

                {/* Bottom bar */}
                <div className="flex items-center justify-between px-6 py-3 border-t border-white/5 bg-white/5">
                  <div className="flex items-center gap-4">
                    <div
                      className={`text-xs font-medium ${
                        prompt.length >= MAX_CHARS ? 'text-neon-pink' : 'text-gray-500'
                      }`}
                    >
                      {prompt.length}/{MAX_CHARS}
                    </div>
                    <div className="text-xs text-gray-600">Press Enter ↵</div>
                  </div>
                  <button
                    onClick={() => {
                      if (prompt.trim()) {
                        router.push(`/editor?prompt=${encodeURIComponent(prompt)}`);
                      }
                    }}
                    disabled={!prompt.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-neon-purple to-neon-blue rounded-lg font-semibold hover:shadow-lg hover:shadow-neon-purple/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm transform hover:scale-105"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col items-center justify-center space-y-4 mb-16">
            <button
              onClick={() => router.push('/editor')}
              className="px-10 py-5 bg-gradient-to-r from-neon-purple to-neon-blue rounded-xl font-bold hover:shadow-xl hover:shadow-neon-purple/40 transition-all transform hover:scale-105 text-lg"
            >
              Start Creating Free
            </button>
            <p className="text-gray-500 text-sm">
              Free & Open Source · No API Key Required for Basic Use
            </p>
          </div>

          {/* Demo Canvas - Preset Examples */}
          <div className="w-full max-w-[1200px] mx-auto">
            <div className="text-center mb-8">
              <p className="text-gray-400 text-sm">Try these examples 👇</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ExampleCard
                title="E-commerce Platform"
                description="Online shopping system with microservices architecture"
                icon="🛒"
                templatePath="/templates/ecommerce.json"
                clickToTryText="Click to try"
                onClick={(templatePath) => {
                  router.push(`/editor?template=${encodeURIComponent(templatePath)}`);
                }}
              />
              <ExampleCard
                title="Microservices System"
                description="Distributed services with API gateway and service mesh"
                icon="🔧"
                templatePath="/templates/microservices.json"
                clickToTryText="Click to try"
                onClick={(templatePath) => {
                  router.push(`/editor?template=${encodeURIComponent(templatePath)}`);
                }}
              />
              <ExampleCard
                title="Data Pipeline"
                description="Real-time data processing with stream analytics"
                icon="📊"
                templatePath="/templates/data-pipeline.json"
                clickToTryText="Click to try"
                onClick={(templatePath) => {
                  router.push(`/editor?template=${encodeURIComponent(templatePath)}`);
                }}
              />
              <ExampleCard
                title="Authentication System"
                description="OAuth 2.0 with JWT and multi-factor auth"
                icon="🔐"
                templatePath="/templates/auth-system.json"
                clickToTryText="Click to try"
                onClick={(templatePath) => {
                  router.push(`/editor?template=${encodeURIComponent(templatePath)}`);
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section - Commented out during beta */}
      {/* <section className="relative z-10 py-20 px-6 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <StatCard number="1,000+" label="Active Users" icon="👥" />
            <StatCard number="2,000+" label="Diagrams Created" icon="📊" />
            <StatCard number="98%" label="Satisfaction" icon="⭐" />
          </div>

          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
              {TEXT.home.testimonials.title}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TestimonialCard
              quote={TEXT.home.testimonials.quote1}
              author={TEXT.home.testimonials.author1}
              role="Senior Architect"
              avatar="https://i.pravatar.cc/150?img=12"
            />
            <TestimonialCard
              quote={TEXT.home.testimonials.quote2}
              author={TEXT.home.testimonials.author2}
              role="Tech Lead"
              avatar="https://i.pravatar.cc/150?img=47"
            />
            <TestimonialCard
              quote={TEXT.home.testimonials.quote3}
              author={TEXT.home.testimonials.author3}
              role="DevOps Engineer"
              avatar="https://i.pravatar.cc/150?img=33"
            />
          </div>
        </div>
      </section> */}

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
              Everything You Need
            </h2>
            <p className="text-gray-400 text-lg">Professional architecture diagrams made simple</p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon="🤖"
              title="AI Generation"
              description="Describe your system in plain English, get a professional diagram instantly"
              gradient="from-neon-purple to-neon-pink"
            />
            <FeatureCard
              icon="✨"
              title="Auto Animation"
              description="Path tracing and node pulse effects bring your architecture to life"
              gradient="from-neon-blue to-neon-purple"
            />
            <FeatureCard
              icon="📦"
              title="Multi-Format Export"
              description="Download as GIF, MP4, PNG, SVG, or HTML"
              gradient="from-neon-pink to-neon-orange"
            />
            <FeatureCard
              icon="🎨"
              title="500+ Tech Icons"
              description="Every major technology stack at your fingertips"
              gradient="from-neon-orange to-neon-blue"
            />
            <FeatureCard
              icon="⚡"
              title="Real-Time Preview"
              description="See changes instantly as you edit"
              gradient="from-neon-green to-neon-blue"
            />
            <FeatureCard
              icon="🌙"
              title="Dark Neon Theme"
              description="Cyberpunk-inspired design perfect for presentations"
              gradient="from-neon-purple to-neon-blue"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            <div className="flex items-center space-x-3">
              <img src="/logo.svg" alt="FlowDyno" className="w-8 h-8" />
              <span className="text-xl font-bold bg-gradient-to-r from-neon-purple to-neon-blue bg-clip-text text-transparent">
                FlowDyno
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <a
                href="https://github.com/flowdyno/flowdyno-monorepo"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://github.com/flowdyno/flowdyno-monorepo/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                MIT License
              </a>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>© 2026 FlowDyno. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

function FeatureCard({ icon, title, description, gradient }: FeatureCardProps) {
  return (
    <div className="group relative">
      {/* Glow Effect */}
      <div
        className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300`}
      />

      {/* Card Content */}
      <div className="relative p-8 bg-dark-800/50 backdrop-blur-sm border border-white/10 rounded-2xl hover:border-white/20 transition-all">
        <div className="text-5xl mb-5">{icon}</div>
        <h3
          className={`text-xl font-bold mb-3 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
        >
          {title}
        </h3>
        <p className="text-gray-400 leading-relaxed text-sm">{description}</p>
      </div>
    </div>
  );
}

interface ExampleCardProps {
  title: string;
  description: string;
  icon: string;
  templatePath: string;
  onClick: (templatePath: string) => void;
  clickToTryText: string;
}

function ExampleCard({
  title,
  description,
  icon,
  templatePath,
  onClick,
  clickToTryText,
}: ExampleCardProps) {
  return (
    <div
      onClick={() => onClick(templatePath)}
      className="group relative cursor-pointer transform transition-all duration-300 hover:scale-105"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-purple to-neon-blue rounded-xl blur opacity-0 group-hover:opacity-50 transition duration-300" />
      <div className="relative p-6 bg-dark-800/80 backdrop-blur-sm border border-white/10 rounded-xl hover:border-neon-purple/50 transition-all">
        <div className="text-4xl mb-3">{icon}</div>
        <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
        <p className="text-gray-400 text-xs leading-relaxed">{description}</p>
        <div className="mt-4 flex items-center text-neon-purple text-xs font-medium">
          <span>{clickToTryText}</span>
          <span className="ml-1 transform group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </div>
    </div>
  );
}
