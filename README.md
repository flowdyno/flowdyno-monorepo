# FlowDyno

> **AI-Powered Dynamic Architecture Diagrams - Generate, Animate, Export in Seconds**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Open Source](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-red.svg)](https://github.com/flowdyno/flowdyno-monorepo)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/flowdyno/flowdyno-monorepo/pulls)
[![GitHub Stars](https://img.shields.io/github/stars/flowdyno/flowdyno-monorepo?style=social)](https://github.com/flowdyno/flowdyno-monorepo)
[![Product Hunt](https://img.shields.io/badge/Product%20Hunt-Launch-ff6154.svg)](https://www.producthunt.com/)

🎉 **Free & Open Source** | 🔑 **Bring Your Own API Key** | 🚀 **Unlimited Usage** | 🏠 **Self-Hosted**

An AI-powered dynamic architecture diagram generator built for software developers, architects, and engineering teams.

---

## ✨ Features

- ⚡ **AI-Powered Generation**: Describe your system in plain English, get a professional diagram instantly
- 🎨 **Auto Animations**: Path drawing + node pulse effects - no manual work needed
- 📦 **Multi-Format Export**: GIF / MP4 / PNG / SVG / HTML / JSON
- 🎭 **Dark Neon Theme**: Cyberpunk-inspired design perfect for technical presentations
- 🔑 **4 AI Models Supported**:
  - OpenAI (GPT-4, GPT-3.5)
  - Anthropic (Claude 3.5 Sonnet)
  - Google (Gemini Pro)
  - DeepSeek
- 🏠 **Fully Self-Hosted**: No registration, no login, all data stored locally
- 💯 **No Limits**: Unlimited generations, unlimited nodes, unlimited diagrams
- 🆓 **Free Forever**: Completely open source under MIT license
- 🖼️ **500+ Tech Icons**: Every major technology stack at your fingertips

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 10.13.1
- API Key from any AI provider (OpenAI / Anthropic / Google / DeepSeek)

### Installation

```bash
# Clone the repository
git clone https://github.com/flowdyno/flowdyno-monorepo.git
cd flowdyno-monorepo

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:3000
```

**Common Commands:**

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm lint         # Run ESLint
pnpm typecheck    # TypeScript type checking
```

### Configure API Key

1. Launch the app and click "Get Started" to enter the editor
2. Click "Settings" in the top navigation
3. Select your AI provider (OpenAI / Anthropic / Google / DeepSeek)
4. Enter your API key
5. Save settings

**Get Your API Key:**

- [OpenAI API Key](https://platform.openai.com/api-keys)
- [Anthropic API Key](https://console.anthropic.com/settings/keys)
- [Google AI Studio](https://makersuite.google.com/app/apikey)
- [DeepSeek API Key](https://platform.deepseek.com/api_keys)

**Note**: API keys are stored only in your browser's localStorage and never uploaded to any server.

---

## 📁 Project Structure

```
flowdyno-monorepo/
├── apps/
│   └── frontend/                    # Next.js frontend application
│       ├── src/
│       │   ├── components/          # React components
│       │   │   ├── canvas/          # Canvas components (ReactFlow)
│       │   │   ├── common/          # Shared components (Header, Footer, Icon)
│       │   │   ├── editor/          # Editor core components
│       │   │   │   ├── NodePalette.tsx      # Node selection panel
│       │   │   │   ├── PropertyPanel.tsx    # Property editor
│       │   │   │   ├── Toolbar.tsx          # Toolbar
│       │   │   │   ├── PromptInput.tsx      # AI prompt input
│       │   │   │   └── AnimationEffectSelector.tsx
│       │   │   ├── export/          # Export functionality
│       │   │   ├── import/          # Import functionality
│       │   │   ├── pages/           # Page-level components
│       │   │   │   └── EditorPage.tsx       # Main editor page
│       │   │   └── settings/        # Settings components
│       │   │       ├── ApiKeySettings.tsx   # API key configuration
│       │   │       └── SettingsPanel.tsx    # Settings sidebar
│       │   ├── hooks/               # Custom React hooks
│       │   ├── pages/               # Next.js page routes
│       │   │   ├── index.tsx        # Home page
│       │   │   ├── Home.tsx         # Home content
│       │   │   └── editor.tsx       # Editor page
│       │   ├── services/            # Service layer
│       │   │   └── aiService.ts     # AI model calls (4 providers)
│       │   ├── stores/              # Zustand state management
│       │   │   ├── settingsStore.ts # API keys & model selection
│       │   │   ├── canvasStore.ts   # Canvas data
│       │   │   ├── animationStore.ts # Animation config
│       │   │   └── userStore.ts     # User preferences
│       │   ├── types/               # TypeScript type definitions
│       │   └── utils/               # Utility functions
│       │       └── graphLayout.ts   # Auto-layout algorithms
│       └── package.json
│
├── packages/
│   └── shared-config/               # Shared configuration package
│       └── src/
│           ├── icons.ts             # 500+ tech icon configs
│           └── animations.ts        # Animation effect configs
│
├── package.json                     # Root package config
├── pnpm-workspace.yaml              # pnpm workspace config
└── LICENSE                          # MIT license
```

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 16 (Pages Router) + React 18 + TypeScript 5.9
- **Canvas Rendering**: React Flow - Complex interactions and node editing
- **Animation Engine**: CSS + SVG animations
- **Video Export**: FFmpeg.wasm - Pure frontend video generation
- **UI Styling**: TailwindCSS - Dark neon theme
- **State Management**: Zustand with persist - localStorage persistence
- **HTTP Client**: Fetch API - Direct calls to AI provider APIs
- **Deployment**: Static Site Generation (SSG) - Deploy anywhere

### AI Integration

- **Supported Models**:
  - OpenAI: GPT-4 Turbo
  - Anthropic: Claude 3.5 Sonnet
  - Google: Gemini 1.5 Pro
  - DeepSeek: deepseek-chat
- **Architecture**: Client-side direct calls (no backend proxy)
- **Storage**: API keys stored in browser localStorage

### Icon Resources

- **Tech Icons**: 500+ SimpleIcons technology icons
- **Concept Icons**: Custom icons (users, devices, documents, etc.)

---

## 📖 Core Features

### AI-Powered Generation

Describe your system architecture in natural language, AI generates a professional diagram:

```
Example Input:
"Design an e-commerce system with a React frontend, Node.js backend, MySQL database, and Redis cache"

AI Generates:
- Nodes: React, Node.js, MySQL, Redis
- Connections: HTTP API, DB connections, cache connections
- Layout: Auto-arranged
- Animations: Auto-added path animations
```

### Canvas Editing

- Drag nodes to adjust positions
- Add/delete nodes and connections
- Modify node properties (color, size, text)
- 500+ tech icons to choose from
- Real-time preview

### Animation Effects

9 built-in animation types:

1. **Path Drawing** - Connections draw progressively
2. **Path Flow** - Data flow effect
3. **Node Pulse** - Breathing light effect
4. **Fade In** - Node fade in
5. **Circuit Pulse** - Circuit board effect
6. **Rotate** - Node rotation
7. **3D Flip** - Card flip effect
8. **Charging Bar** - Loading progress
9. **Shake** - Alert effect

### Multi-Format Export

- **PNG/JPG** - High-quality static images
- **SVG** - Scalable vector graphics
- **GIF** - Animated image (15fps, 5s loop)
- **MP4** - High-definition video (30fps)
- **HTML** - Self-contained webpage, shareable
- **JSON** - Architecture data, re-importable

All formats are free, no watermarks, no limits!

---

## 🎨 Usage Examples

### 1. Launch App & Configure API Key

```bash
pnpm dev
# Visit http://localhost:3000
# Click Settings -> Select AI Model -> Enter API Key -> Save
```

### 2. AI Generate Diagram

In the editor, enter a description:

```
"A microservices architecture with user service, order service, payment service, using Kafka message queue and PostgreSQL database"
```

Click "AI Generate" button, wait a few seconds for a complete architecture diagram.

### 3. Edit & Beautify

- Drag nodes to adjust layout
- Modify node colors and styles
- Add animation effects
- Adjust connection paths

### 4. Export & Share

Click "Export" button:

- Select format (GIF for demos, MP4 for videos, SVG for print)
- Download file
- Share with team or embed in docs

---

## 📚 Documentation

### API Reference

**settingsStore** - API Key & Model Management

```typescript
import { useSettingsStore } from '@/stores/settingsStore';

// Get current config
const { apiKeys, selectedProvider } = useSettingsStore();

// Set API Key
useSettingsStore.getState().setApiKey('openai', 'sk-...');

// Switch model
useSettingsStore.getState().setProvider('anthropic');
```

**aiService** - AI Generation Service

```typescript
import { generateArchitecture } from '@/services/aiService';

const result = await generateArchitecture(
  'your system description',
  'openai', // or 'anthropic', 'google', 'deepseek'
  'sk-...' // API key
);
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to submit code, report issues, or suggest features.

### How to Contribute

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guide

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run linter
pnpm lint

# Type checking
pnpm typecheck

# Build for production
pnpm build
```

### Report Issues

If you encounter bugs or have feature suggestions, please [create an Issue](https://github.com/flowdyno/flowdyno-monorepo/issues).

---

## 🗺️ Roadmap

- [x] ✅ AI-powered diagram generation
- [x] ✅ Multiple animation effects
- [x] ✅ Multi-format export (GIF/MP4/SVG/PNG/HTML/JSON)
- [x] ✅ 500+ tech icons
- [x] ✅ Dark neon theme
- [x] ✅ Support for 4 AI models
- [x] ✅ Open source & self-hosted
- [ ] 🔜 Custom themes and colors
- [ ] 🔜 Team collaboration & real-time editing
- [ ] 🔜 Version history & rollback

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

This means you can:

- ✅ Commercial use
- ✅ Modify the code
- ✅ Distribute copies
- ✅ Private use

Only requirement: Keep copyright and license notices.

---

## ❓ FAQ

### Q: Why do I need to provide an API key?

A: FlowDyno is a completely open-source and self-hosted application with no backend servers. Your API key is used directly to call AI provider APIs. Data doesn't pass through any third-party servers, ensuring privacy and security.

### Q: Will my API key be uploaded to a server?

A: **No**. API keys are stored only in your browser's localStorage. All AI calls are sent directly from your browser to the AI provider. FlowDyno never collects or uploads your API keys.

### Q: Which AI model is best?

A: Recommendations:

- **OpenAI GPT-4**: Best overall performance, most accurate diagram generation
- **DeepSeek**: Best value, fast response
- **Claude**: Strong at understanding complex systems
- **Gemini**: Large free tier

### Q: Where can I deploy this?

A: FlowDyno is a pure static site and can be deployed to:

- Vercel (recommended)
- Netlify
- GitHub Pages
- Cloudflare Pages
- Any hosting service supporting Next.js

### Q: Are exported videos watermarked?

A: **No**. All export formats are completely free with no watermarks.

### Q: Does it support private deployment?

A: **Fully supported**. You can deploy FlowDyno in an intranet environment. Just ensure access to AI provider APIs (or use an internal proxy).

---

## 🔗 Links

- **X (Twitter)**: [@hyperyond_ai](https://x.com/hyperyond_ai)
- **GitHub**: [github.com/flowdyno/flowdyno-monorepo](https://github.com/flowdyno/flowdyno-monorepo)
- **Issues**: [Submit bugs or suggestions](https://github.com/flowdyno/flowdyno-monorepo/issues)

---

## 🙏 Acknowledgments

Thanks to these amazing open source projects:

- [Next.js](https://nextjs.org/) - React framework
- [React Flow](https://reactflow.dev/) - Flowchart rendering
- [FFmpeg.wasm](https://ffmpegwasm.netlify.app/) - Video export
- [TailwindCSS](https://tailwindcss.com/) - UI styling
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [SimpleIcons](https://simpleicons.org/) - Tech icons
- [Devicon](https://github.com/devicons/devicon/) - Tech icons

---

## 👥 Author

- **Oliver** - [@chihyungchang](https://github.com/chihyungchang)

---

**Made with ❤️ by the FlowDyno Community**

⭐ If this project helps you, please give it a star!
