export * from './tech-icons';
export * from './concept-icons';

import { TECH_CATEGORIES, type TechStack } from './tech-icons';
import { CONCEPT_ICONS } from './concept-icons';

/**
 * 获取所有可用的技术图标列表
 */
export function getAllTechIcons(): string[] {
  const icons = new Set<string>();
  TECH_CATEGORIES.forEach((category) => {
    category.techStacks.forEach((tech) => {
      icons.add(tech.icon);
    });
  });
  return Array.from(icons).sort();
}

/**
 * 获取所有可用的概念图标列表
 */
export function getAllConceptIcons(): string[] {
  return Object.keys(CONCEPT_ICONS).sort();
}

/**
 * 检查图标是否为概念图标
 */
export function isConceptIcon(iconName: string): boolean {
  return iconName in CONCEPT_ICONS;
}

/**
 * 检查图标是否为技术图标
 */
export function isTechIcon(iconName: string): boolean {
  const techIcons = getAllTechIcons();
  return techIcons.includes(iconName);
}

/**
 * 根据图标名称获取图标类型
 */
export function getIconType(iconName: string): 'tech' | 'concept' | 'unknown' {
  if (isConceptIcon(iconName)) return 'concept';
  if (isTechIcon(iconName)) return 'tech';
  return 'unknown';
}

/**
 * 根据技术栈 ID 查找图标名称
 */
export function findIconByTechId(techId: string): string | null {
  for (const category of TECH_CATEGORIES) {
    const tech = category.techStacks.find((t) => t.id === techId);
    if (tech) return tech.icon;
  }
  return null;
}

/**
 * 根据技术栈标签查找图标名称
 */
export function findIconByLabel(label: string): string | null {
  const lowerLabel = label.toLowerCase();
  for (const category of TECH_CATEGORIES) {
    const tech = category.techStacks.find((t) => t.label.toLowerCase() === lowerLabel);
    if (tech) return tech.icon;
  }
  return null;
}

/**
 * 搜索技术栈
 */
export function searchTechStacks(query: string): TechStack[] {
  const lowerQuery = query.toLowerCase();
  const results: TechStack[] = [];

  TECH_CATEGORIES.forEach((category) => {
    category.techStacks.forEach((tech) => {
      if (
        tech.label.toLowerCase().includes(lowerQuery) ||
        tech.id.toLowerCase().includes(lowerQuery) ||
        tech.icon.toLowerCase().includes(lowerQuery)
      ) {
        results.push(tech);
      }
    });
  });

  return results;
}

/**
 * 根据节点类型获取推荐的图标
 */
export function getRecommendedIconsByNodeType(nodeType: string): string[] {
  const category = TECH_CATEGORIES.find((c) => c.type === nodeType);
  if (!category) return [];
  return category.techStacks.map((t) => t.icon);
}

/**
 * 验证图标名称是否有效
 */
export function isValidIcon(iconName: string): boolean {
  return isConceptIcon(iconName) || isTechIcon(iconName);
}
