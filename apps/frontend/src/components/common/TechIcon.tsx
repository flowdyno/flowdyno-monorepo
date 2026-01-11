import { useMemo, useState, useEffect } from 'react';
import { CUSTOM_ICONS, TECH_CATEGORIES } from '@flowdyno/shared-config';

interface TechIconProps {
  name: string;
  size?: number;
  className?: string;
  variant?: string;
}

const svgCache = new Map<string, string>();

export function TechIcon({ name, size = 24, className = '', variant }: TechIconProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);

  const iconData = useMemo(() => {
    if (!name) return null;

    const normalizedName = name.toLowerCase();

    // 优先级 1: 检查自定义本地图标
    const customIconPath = CUSTOM_ICONS[normalizedName];
    if (customIconPath) {
      return { type: 'custom' as const, path: customIconPath };
    }

    // 优先级 2: 从 TECH_CATEGORIES 中查找图标及其变体
    let iconVariants: string[] = [];
    let foundInCategories = false;
    for (const category of TECH_CATEGORIES) {
      const techStack = category.techStacks.find((ts) => ts.id === normalizedName);
      if (techStack) {
        iconVariants = techStack.variants;
        foundInCategories = true;
        break;
      }
    }

    // 如果图标不在 TECH_CATEGORIES 中，返回 null（显示占位符）
    if (!foundInCategories) {
      console.warn(`[TechIcon] Icon "${name}" not found in TECH_CATEGORIES`);
      return null;
    }

    // 选择变体：用户指定 > 第一个可用变体 > 'plain' 作为后备
    const selectedVariant = variant || iconVariants[0] || 'plain';

    return {
      type: 'devicon-svg' as const,
      name: normalizedName,
      variant: selectedVariant,
      svgUrl: `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${normalizedName}/${normalizedName}-${selectedVariant}.svg`,
    };
  }, [name, variant]);

  useEffect(() => {
    if (iconData?.type === 'devicon-svg') {
      const cached = svgCache.get(iconData.svgUrl);
      if (cached) {
        setSvgContent(cached);
        return;
      }

      setSvgContent(null);

      fetch(iconData.svgUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return response.text();
        })
        .then((svgText) => {
          // 验证返回内容是有效的 SVG
          if (!svgText.includes('<svg') || svgText.includes('Package size exceeded')) {
            throw new Error('Invalid SVG content');
          }
          svgCache.set(iconData.svgUrl, svgText);
          setSvgContent(svgText);
        })
        .catch((error) => {
          console.error('Failed to load SVG:', iconData.name, error.message);
          setSvgContent(null);
        });
    } else {
      setSvgContent(null);
    }
  }, [iconData]);

  // 渲染 Devicon 内联 SVG
  if (iconData?.type === 'devicon-svg') {
    if (!svgContent) {
      return (
        <div
          className={className}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
          }}
        />
      );
    }

    const processedSvg = svgContent
      .replace(/<svg/, `<svg width="${size}" height="${size}"`)
      .replace(/width="[^"]*"/, `width="${size}"`)
      .replace(/height="[^"]*"/, `height="${size}"`);

    return (
      <div
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        dangerouslySetInnerHTML={{ __html: processedSvg }}
      />
    );
  }

  // 渲染自定义本地图标
  if (iconData?.type === 'custom') {
    return (
      <img
        src={iconData.path}
        alt={name}
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'contain',
        }}
      />
    );
  }

  // 未找到图标，显示占位符
  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: '#cccccc',
        borderRadius: '4px',
      }}
    />
  );
}
