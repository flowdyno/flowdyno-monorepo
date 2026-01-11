# @flowdyno/shared-config

FlowDyno 项目的共享配置包，包含产品计划限制、图标等共享资源。

## 安装

```bash
pnpm add @flowdyno/shared-config
```

## 使用

### 产品计划限制

```typescript
import {
  PlanType,
  getPlanLimits,
  getPlanPricing,
  canPerformAction,
  hasReachedLimit,
} from '@flowdyno/shared-config';

// 获取计划限制
const limits = getPlanLimits(PlanType.PRO);
console.log(limits.maxDiagrams); // 100
console.log(limits.maxAIGenerationsPerMonth); // 100

// 获取计划价格
const pricing = getPlanPricing(PlanType.PRO);
console.log(pricing.monthly); // 19
console.log(pricing.yearly); // 190

// 检查是否可以执行某个操作
const canExportVideo = canPerformAction(PlanType.FREE, 'canExportVideo');
console.log(canExportVideo); // false

// 检查是否达到限制
const reachedLimit = hasReachedLimit(PlanType.FREE, 'maxDiagrams', 5);
console.log(reachedLimit); // true
```

## 计划对比

| 功能           | Free | Basic | Pro    |
| -------------- | ---- | ----- | ------ |
| 最大架构图数量 | 3    | 20    | 无限制 |
| 每月创建数量   | 5    | 30    | 无限制 |
| 每图最大节点数 | 20   | 50    | 无限制 |
| AI 生成次数/月 | 3    | 50    | 无限制 |
| 协作者数量     | 0    | 0     | 10     |
| 版本历史 (天)  | 3    | 30    | 无限制 |
| 存储空间 (MB)  | 50   | 500   | 无限制 |
| 每月导出次数   | 5    | 50    | 无限制 |
| 导出视频       | ❌   | ✅    | ✅     |
| 导出 PNG       | ✅   | ✅    | ✅     |
| 导出 SVG       | ❌   | ✅    | ✅     |
| 导出 PDF       | ❌   | ✅    | ✅     |
| 自定义域名     | ❌   | ❌    | ✅     |
| 私有架构图     | ❌   | ✅    | ✅     |
| 团队工作区     | ❌   | ❌    | ✅     |
| 高级 AI        | ❌   | ❌    | ✅     |
| 优先支持       | ❌   | ❌    | ✅     |
| 自定义品牌     | ❌   | ❌    | ✅     |

## 价格

| 计划  | 月付   | 年付    |
| ----- | ------ | ------- |
| Free  | $0     | $0      |
| Basic | $9/月  | $90/年  |
| Pro   | $29/月 | $290/年 |

## API

### PlanType

```typescript
enum PlanType {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
}
```

### PlanLimits

```typescript
interface PlanLimits {
  maxDiagrams: number; // 最大架构图数量 (-1 表示无限制)
  maxDiagramsPerMonth: number; // 每月创建数量
  maxNodesPerDiagram: number; // 每图最大节点数
  maxAIGenerationsPerMonth: number; // AI 生成次数/月
  maxCollaborators: number; // 协作者数量
  maxVersionHistory: number; // 版本历史保留天数
  maxStorageMB: number; // 存储空间 (MB)
  maxExportsPerMonth: number; // 每月导出次数
  canExportVideo: boolean; // 是否可以导出视频
  canExportPNG: boolean; // 是否可以导出 PNG
  canExportSVG: boolean; // 是否可以导出 SVG
  canExportPDF: boolean; // 是否可以导出 PDF
  canUseCustomDomain: boolean; // 是否可以使用自定义域名
  canUsePrivateDiagrams: boolean; // 是否可以创建私有架构图
  canUseTeamWorkspace: boolean; // 是否可以使用团队工作区
  canUseAdvancedAI: boolean; // 是否可以使用高级 AI
  prioritySupport: boolean; // 是否有优先支持
  customBranding: boolean; // 是否可以自定义品牌
}
```

### 工具函数

#### getPlanLimits(planType: PlanType): PlanLimits

获取指定计划的限制配置。

#### getPlanPricing(planType: PlanType): PlanPricing

获取指定计划的价格信息。

#### canPerformAction(planType: PlanType, action: keyof PlanLimits): boolean

检查指定计划是否可以执行某个操作（仅适用于布尔类型的限制）。

#### hasReachedLimit(planType: PlanType, limitKey: keyof PlanLimits, currentUsage: number): boolean

检查当前使用量是否已达到限制（仅适用于数字类型的限制）。

## 开发

```bash
# 安装依赖
pnpm install

# 构建
pnpm build

# 开发模式（监听文件变化）
pnpm dev
```

## License

MIT
