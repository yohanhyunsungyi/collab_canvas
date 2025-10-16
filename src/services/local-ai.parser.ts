import type { AIToolCall } from '../types/ai.types';
import type { CanvasShape } from '../types/canvas.types';

const COLOR_WORDS = [
  'red','green','blue','yellow','black','white','purple','orange','pink','gray','grey','cyan','magenta','teal'
];

function extractColor(input: string): string | undefined {
  const hex = input.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/);
  if (hex) return hex[0];
  const word = COLOR_WORDS.find((c) => new RegExp(`\\b${c}\\b`, 'i').test(input));
  return word;
}

function toToolCall(name: string, args: Record<string, unknown>): AIToolCall {
  return {
    id: `tool_${name}_${Date.now()}`,
    type: 'function',
    function: {
      name,
      arguments: JSON.stringify(args),
    },
  };
}

export function parseLocalCommandToToolCalls(prompt: string): AIToolCall[] {
  const p = prompt.trim();
  const lower = p.toLowerCase();

  // Circle: "create a red circle at position 100, 200 with radius 50"
  if (/\bcircle\b/.test(lower) && /\bcreate|make|add\b/.test(lower)) {
    const pos = p.match(/at (?:position )?(?<x>-?\d+)\s*,\s*(?<y>-?\d+)/i);
    const radiusMatch = p.match(/(?:radius|r)\s*(?<radius>\d+)/i);
    const color = extractColor(p) || '#ff0000';
    const x = pos ? Number((pos.groups as any).x) : 100;
    const y = pos ? Number((pos.groups as any).y) : 100;
    const radius = radiusMatch ? Number((radiusMatch.groups as any).radius) : 50;
    return [toToolCall('createCircle', { x, y, radius, color })];
  }

  // Rectangle: "make a 200x300 blue rectangle (at 100,200)"
  if (/\brectangle\b/.test(lower) && /\bcreate|make|add\b/.test(lower)) {
    const size = p.match(/(?<w>\d+)\s*[x×]\s*(?<h>\d+)/i);
    const pos = p.match(/at (?:position )?(?<x>-?\d+)\s*,\s*(?<y>-?\d+)/i);
    const color = extractColor(p) || '#0000ff';
    const width = size ? Number((size.groups as any).w) : 200;
    const height = size ? Number((size.groups as any).h) : 100;
    const x = pos ? Number((pos.groups as any).x) : 100;
    const y = pos ? Number((pos.groups as any).y) : 100;
    return [toToolCall('createRectangle', { x, y, width, height, color })];
  }

  // Text: "add a text layer that says 'Hello World' (at 100, 200)"
  if (/\btext\b/.test(lower) && /\bcreate|make|add\b/.test(lower)) {
    const quoted = p.match(/['\"]([^'\"]+)['\"]/);
    const says = p.match(/says?\s+['\"]?([^'\"]+)['\"]?/i);
    const text = quoted?.[1] || says?.[1] || 'Text';
    const pos = p.match(/at (?:position )?(?<x>-?\d+)\s*,\s*(?<y>-?\d+)/i);
    const x = pos ? Number((pos.groups as any).x) : 100;
    const y = pos ? Number((pos.groups as any).y) : 100;
    const color = extractColor(p) || '#000000';
    return [toToolCall('createText', { x, y, text, color })];
  }

  return [];
}

/**
 * Parse with context to support manipulation commands that need shape IDs
 */
export function parseLocalCommandWithContext(
  prompt: string,
  shapes: CanvasShape[],
  canvasWidth?: number,
  canvasHeight?: number
): AIToolCall[] {
  const p = prompt.trim();
  const lower = p.toLowerCase();

  const byNewest = (arr: CanvasShape[]) =>
    [...arr].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  // Move the blue rectangle to the center
  if (/\bmove\b/.test(lower) && /\brectangle\b/.test(lower) && /\bcenter|centre|middle\b/.test(lower)) {
    const color = extractColor(p);
    const allRects = shapes.filter((s) => s.type === 'rectangle');
    let candidates = allRects;
    if (color) {
      const cLower = color.toLowerCase();
      const colored = allRects.filter((s) => (s.color || '').toLowerCase() === cLower);
      candidates = colored.length > 0 ? colored : allRects; // fallback to any rectangle
    }
    const target = byNewest(candidates)[0];
    if (target) {
      return [toToolCall('centerShape', { shapeId: target.id, canvasWidth, canvasHeight })];
    }
  }

  // Make the circle twice as big
  if ((/\bmake\b|\bscale\b|\bresize\b/.test(lower)) && /\bcircle\b/.test(lower) && /\btwice|2x|double\b/.test(lower)) {
    const target = byNewest(shapes.filter((s) => s.type === 'circle'))[0];
    if (target && target.radius) {
      return [toToolCall('resizeShape', { shapeId: target.id, radius: target.radius * 2 })];
    }
  }

  // Change the text to say 'Updated'
  if ((/\bchange\b|\bupdate\b|\bset\b/.test(lower)) && /\btext\b/.test(lower)) {
    const quoted = p.match(/['\"]([^'\"]+)['\"]/);
    const afterTo = p.match(/to\s+['\"]?([^'\"]]+)['\"]?/i);
    const newText = quoted?.[1] || afterTo?.[1];
    if (newText) {
      const target = byNewest(shapes.filter((s) => s.type === 'text'))[0];
      if (target) {
        return [toToolCall('updateText', { shapeId: target.id, text: newText })];
      }
    }
  }

  return [];
}


