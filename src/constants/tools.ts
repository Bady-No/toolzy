import {
  Minimize2,
  RefreshCw,
  Layers,
  Scissors,
  Scaling,
  QrCode,
  ScanLine,
  type LucideIcon,
} from 'lucide-react';
import { ToolId } from '../types';

export interface ToolDefinition {
  id: Exclude<ToolId, 'home'>;
  titleKey: string;
  shortDescKey: string;
  longDescKey: string;
  icon: LucideIcon;
  /** Tailwind gradient classes for the icon tile */
  gradient: string;
  /** Tailwind classes for the soft icon-tile background in light UI */
  soft: string;
  /** Short capability badge shown on the home card */
  badge: string;
  keywords: string[];
}

export const TOOLS: ToolDefinition[] = [
  {
    id: 'compress',
    titleKey: 'tools.compress.title',
    shortDescKey: 'tools.compress.shortDesc',
    longDescKey: 'tools.compress.longDesc',
    icon: Minimize2,
    gradient: 'from-blue-500 to-indigo-600',
    soft: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    badge: 'JPG · PNG · WebP',
    keywords: ['image', 'picture', 'photo', 'compress', 'size', 'صورة', 'صور', 'ضغط', '图片'],
  },
  {
    id: 'convert',
    titleKey: 'tools.convert.title',
    shortDescKey: 'tools.convert.shortDesc',
    longDescKey: 'tools.convert.longDesc',
    icon: RefreshCw,
    gradient: 'from-indigo-500 to-purple-600',
    soft: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    badge: 'ZIP Download',
    keywords: ['convert', 'format', 'png', 'jpg', 'webp', 'pdf', 'تحويل', 'صيغ', '格式'],
  },
  {
    id: 'pdf',
    titleKey: 'tools.pdf.title',
    shortDescKey: 'tools.pdf.shortDesc',
    longDescKey: 'tools.pdf.longDesc',
    icon: Layers,
    gradient: 'from-rose-500 to-red-600',
    soft: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    badge: 'Merge & Compress',
    keywords: ['pdf', 'merge', 'combine', 'document', 'دمج', 'مستندات', '合并'],
  },
  {
    id: 'remove-bg',
    titleKey: 'tools.removeBg.title',
    shortDescKey: 'tools.removeBg.shortDesc',
    longDescKey: 'tools.removeBg.longDesc',
    icon: Scissors,
    gradient: 'from-pink-500 to-rose-600',
    soft: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    badge: 'Instant Cutout',
    keywords: ['background', 'remove', 'transparent', 'cutout', 'خلفية', 'تعرية', '背景'],
  },
  {
    id: 'resize',
    titleKey: 'tools.resize.title',
    shortDescKey: 'tools.resize.shortDesc',
    longDescKey: 'tools.resize.longDesc',
    icon: Scaling,
    gradient: 'from-emerald-500 to-teal-600',
    soft: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    badge: 'Social Templates',
    keywords: ['resize', 'scale', 'dimension', 'social', 'تكبير', 'تصغير', 'حجم', '尺寸'],
  },
  {
    id: 'qr-generate',
    titleKey: 'tools.qrGenerate.title',
    shortDescKey: 'tools.qrGenerate.shortDesc',
    longDescKey: 'tools.qrGenerate.longDesc',
    icon: QrCode,
    gradient: 'from-amber-500 to-orange-600',
    soft: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    badge: 'PNG + SVG',
    keywords: ['qr', 'code', 'generate', 'barcode', 'رمز', 'استجابة', '二维码'],
  },
  {
    id: 'qr-read',
    titleKey: 'tools.qrRead.title',
    shortDescKey: 'tools.qrRead.shortDesc',
    longDescKey: 'tools.qrRead.longDesc',
    icon: ScanLine,
    gradient: 'from-cyan-500 to-blue-600',
    soft: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    badge: 'Instant Decode',
    keywords: ['qr', 'scan', 'read', 'decode', 'مسح', 'قراءة', '扫码'],
  },
];

export const getTool = (id: string): ToolDefinition | undefined =>
  TOOLS.find((tool) => tool.id === id);
