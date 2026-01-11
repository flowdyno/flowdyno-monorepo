// @ts-nocheck

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { defineNuxtModule } from '@nuxt/kit';

export default defineNuxtModule({
  meta: {
    name: 'tsconfig-app-patch',
  },
  setup(_options, nuxt) {
    const writeIfMissing = async (file: string, content: any) => {
      const fullPath = join(nuxt.options.buildDir, file);
      try {
        await fs.access(fullPath);
        // 文件已存在，不做任何操作
      } catch {
        await fs.writeFile(fullPath, JSON.stringify(content, null, 2), 'utf-8');
      }
    };

    const writeAll = async () => {
      const tsconfigApp = {
        extends: './tsconfig.json',
        compilerOptions: {
          composite: true,
          lib: ['DOM', 'DOM.Iterable', 'ES6'],
          types: ['vite/client'],
        },
        include: ['../**/*', '../.nuxt/nuxt.d.ts'],
        exclude: ['../node_modules', '../.nuxt/dist'],
      };

      const tsconfigShared = {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          allowJs: true,
          skipLibCheck: true,
          strict: false,
          forceConsistentCasingInFileNames: true,
          noEmit: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: 'preserve',
          incremental: true,
          baseUrl: '..',
          paths: {
            '~/*': ['../*'],
            '@/*': ['../*'],
            '~~/*': ['../*'],
            '@@/*': ['../*'],
          },
        },
      };

      const tsconfigNode = {
        extends: './tsconfig.shared.json',
        compilerOptions: {
          composite: true,
          types: ['node'],
        },
        include: ['../nuxt.config.ts', '../tailwind.config.js'],
      };

      await writeIfMissing('tsconfig.app.json', tsconfigApp);
      await writeIfMissing('tsconfig.shared.json', tsconfigShared);
      await writeIfMissing('tsconfig.node.json', tsconfigNode);
    };

    // 确保文件在构建器准备前后存在
    nuxt.hook('prepare:types', writeAll);
    nuxt.hook('builder:prepared', writeAll);
  },
});
