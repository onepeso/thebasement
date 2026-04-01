import { FONT_STYLES, TEXT_COLORS } from '@/types/database';

export function getUsernameStyle(fontStyleId?: string): React.CSSProperties {
  if (!fontStyleId || fontStyleId === 'default') {
    return {};
  }
  
  const font = FONT_STYLES.find(f => f.id === fontStyleId);
  if (!font) return {};
  
  return {
    fontFamily: font.fontFamily,
    fontWeight: (font as any).fontWeight || 'inherit',
    fontStyle: (font as any).fontStyle || 'inherit',
  };
}

export function getTextColor(textColorId?: string): string {
  if (!textColorId || textColorId === 'default') {
    return '#818cf8'; // Default indigo color
  }
  const color = TEXT_COLORS.find(c => c.id === textColorId);
  return color?.color || '#818cf8';
}

export function getFontById(fontStyleId?: string) {
  if (!fontStyleId || fontStyleId === 'default') {
    return FONT_STYLES[0];
  }
  return FONT_STYLES.find(f => f.id === fontStyleId) || FONT_STYLES[0];
}
