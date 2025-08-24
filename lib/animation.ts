import {
  Animation,
  Layer,
  Shape,
} from "@lottie-animation-community/lottie-types";
import { set, get } from "lodash-es";

const LayerTypes = {
  Precomp: 0,
  Shape: 4,
};

const ShapeTypes = {
  Fill: "fl",
  Stroke: "st",
  Group: "gr",
};

const defaultColor = { r: 0, g: 0, b: 0, a: 1 };

export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface ColorGroup {
  color: RgbaColor;
  count: number;
  shapePaths: string[];
}

export interface LayerInfo {
  path: string;
  name: string;
  hidden: boolean;
  shapes: ShapeInfo[];
  childrenLayers?: LayerInfo[];
}

export interface ShapeInfo {
  path: string;
  name: string;
  colorRgb: RgbaColor;
  children: ShapeInfo[];
}

export const getAnimationLayers = (animation: Animation): LayerInfo[] => {
  return getLayersFromArray(animation, animation.layers, "layers");
};

const getLayersFromArray = (
  animation: Animation,
  layers: Layer.Value[],
  basePath: string,
): LayerInfo[] => {
  return layers.map((layer, i) => {
    const path = `${basePath}.${i}`;
    const layerInfo: LayerInfo = {
      path,
      name: (layer as any).nm || "Unnamed Layer",
      hidden: !!(layer as any).hd,
      shapes: [],
      childrenLayers: [],
    };
    switch ((layer as any).ty) {
      case LayerTypes.Shape: {
        layerInfo.shapes = getShapesFromLayer(
          (layer as Layer.Shape).shapes,
          `${path}.shapes`,
        );
        break;
      }
      case LayerTypes.Precomp: {
        const refId = (layer as any).refId as string | undefined;
        if (refId && Array.isArray((animation as any).assets)) {
          const assets = (animation as any).assets as any[];
          const assetIndex = assets.findIndex((a) => a.id === refId);
          if (assetIndex >= 0 && Array.isArray(assets[assetIndex].layers)) {
            const childLayers = assets[assetIndex].layers as Layer.Value[];
            layerInfo.childrenLayers = getLayersFromArray(
              animation,
              childLayers,
              `assets.${assetIndex}.layers`,
            );
          }
        }
        break;
      }
      default:
        break;
    }
    return layerInfo;
  });
};

export const getShape = (shape: Shape.Value | undefined, path: string): ShapeInfo => {
  const shapeInfo: ShapeInfo = {
    path: path,
    name: (shape as any)?.nm || "Unnamed Shape",
    colorRgb: defaultColor,
    children: [],
  };
  if (!shape || !(shape as any).ty) return shapeInfo;
  switch ((shape as any).ty) {
    case ShapeTypes.Fill:
      shapeInfo.colorRgb = getColorsFromFillShape(shape as Shape.Fill);
      break;
    case ShapeTypes.Stroke:
      shapeInfo.colorRgb = getColorsFromStrokeShape(shape as Shape.Stroke);
      break;
    case ShapeTypes.Group:
      shapeInfo.children = getShapesFromLayer(
        (shape as Shape.Group).it || [],
        `${path}.it`,
      );
      break;
  }

  return shapeInfo;
};

const getShapesFromLayer = (
  shapes: Shape.Value[] | undefined,
  path: string,
): ShapeInfo[] => {
  if (!Array.isArray(shapes)) return [];
  return shapes
    .map((shape, i) => getShape(shape as any, `${path}.${i}`))
    .filter(Boolean);
};

const getColorsFromFillShape = (shape: Shape.Fill): RgbaColor => {
  const rgba = readColorFromProperty(shape.c);
  return rgba ? toRgbColor(rgba) : defaultColor;
};

const getColorsFromStrokeShape = (shape: Shape.Stroke): RgbaColor => {
  const rgba = readColorFromProperty(shape.c);
  return rgba ? toRgbColor(rgba) : defaultColor;
};

const toRgbColor = (color: number[]): RgbaColor => {
  const [r, g, b, a] = color;

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a: a === undefined ? 1 : a,
  };
};

const fromRgbColor = (color: RgbaColor): number[] => {
  const { r, g, b, a } = color;
  return [r / 255, g / 255, b / 255, a];
};

export const getSelectedShape = (
  animation: Animation,
  path: string,
): ShapeInfo => {
  const shape = get(animation, path) as Shape.Value;
  return getShape(shape, path);
};

export const updateShapeColor = (
  animation: Animation,
  shapePath: string,
  color: RgbaColor,
) => {
  return set({ ...animation }, `${shapePath}.c.k`, fromRgbColor(color));
};

const colorKey = (c: RgbaColor) => `${c.r},${c.g},${c.b},${c.a}`;

// Try to read a concrete RGBA array from a Lottie color property.
// Supports both static values and keyframed arrays. Returns the first keyframe's
// value when animated.
const readColorFromProperty = (
  cProp?: { a?: number; k?: unknown },
): number[] | null => {
  if (!cProp) return null;
  const k = (cProp as any).k;
  if (!Array.isArray(k)) return null;
  // Static color: k is number[]
  if (k.length > 0 && typeof k[0] === "number") {
    return k as number[];
  }
  // Animated: k is keyframes[]
  if (k.length > 0 && typeof k[0] === "object") {
    const first = k[0] as any;
    const candidate =
      (Array.isArray(first.s) ? first.s : null) ||
      (Array.isArray(first.k) ? first.k : null) ||
      (Array.isArray(first.e) ? first.e : null) ||
      null;
    return candidate;
  }
  return null;
};

const collectColorGroupsFromShapes = (
  shapes: Shape.Value[],
  basePath: string,
  groups: Map<string, { color: RgbaColor; shapePaths: string[] }>,
) => {
  if (!Array.isArray(shapes)) return;
  for (let i = 0; i < shapes.length; i++) {
    const shape = shapes[i];
    const shapePath = `${basePath}.${i}`;
    if (!shape || !(shape as any).ty) continue;
    switch ((shape as any).ty) {
      case ShapeTypes.Fill: {
        const rgb = readColorFromProperty((shape as Shape.Fill).c as any);
        if (rgb) {
          const color = toRgbColor(rgb);
          const key = colorKey(color);
          const group = groups.get(key) || { color, shapePaths: [] };
          group.shapePaths.push(shapePath);
          groups.set(key, group);
        }
        break;
      }
      case ShapeTypes.Stroke: {
        const rgb = readColorFromProperty((shape as Shape.Stroke).c as any);
        if (rgb) {
          const color = toRgbColor(rgb);
          const key = colorKey(color);
          const group = groups.get(key) || { color, shapePaths: [] };
          group.shapePaths.push(shapePath);
          groups.set(key, group);
        }
        break;
      }
      case ShapeTypes.Group: {
        const it = (shape as Shape.Group).it || [];
        collectColorGroupsFromShapes(it, `${shapePath}.it`, groups);
        break;
      }
    }
  }
};

export const getColorGroups = (animation: Animation): ColorGroup[] => {
  const groups = new Map<string, { color: RgbaColor; shapePaths: string[] }>();

  const traverseLayers = (layers: Layer.Value[], basePath: string) => {
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i] as any;
      const layerPath = `${basePath}.${i}`;
      if (layer.ty === LayerTypes.Shape) {
        const shapes = (layer as Layer.Shape).shapes || [];
        collectColorGroupsFromShapes(shapes, `${layerPath}.shapes`, groups);
      } else if (layer.ty === LayerTypes.Precomp) {
        const refId = layer.refId as string | undefined;
        if (refId && Array.isArray((animation as any).assets)) {
          const assets = (animation as any).assets as any[];
          const ai = assets.findIndex((a) => a.id === refId);
          if (ai >= 0 && Array.isArray(assets[ai].layers)) {
            traverseLayers(assets[ai].layers as Layer.Value[], `assets.${ai}.layers`);
          }
        }
      }
    }
  };

  traverseLayers(animation.layers, "layers");

  return Array.from(groups.values()).map((g) => ({
    color: g.color,
    count: g.shapePaths.length,
    shapePaths: g.shapePaths,
  }));
};

export const replaceColorGlobally = (
  animation: Animation,
  from: RgbaColor,
  to: RgbaColor,
) => {
  const newAnim: Animation = { ...animation } as Animation;

  const processShapesAtPath = (shapes: Shape.Value[] | undefined, basePath: string) => {
    const stack: { list: Shape.Value[]; path: string }[] = [
      { list: shapes || [], path: basePath },
    ];
    while (stack.length) {
      const { list, path } = stack.pop()!;
      for (let j = 0; j < list.length; j++) {
        const s = list[j];
        const sPath = `${path}.${j}`;
        if (!s || !(s as any).ty) continue;
        if ((s as any).ty === ShapeTypes.Group) {
          const it = (s as Shape.Group).it || [];
          stack.push({ list: it, path: `${sPath}.it` });
        } else if ((s as any).ty === ShapeTypes.Fill || (s as any).ty === ShapeTypes.Stroke) {
          const cPath = `${sPath}.c.k`;
          const k = get(newAnim as unknown as object, cPath) as unknown;
          if (!Array.isArray(k)) continue;
          // Static color
          if (k.length > 0 && typeof k[0] === "number") {
            const c = toRgbColor(k as number[]);
            if (c.r === from.r && c.g === from.g && c.b === from.b && c.a === from.a) {
              set(newAnim as unknown as object, cPath, fromRgbColor(to));
            }
          } else if (k.length > 0 && typeof k[0] === "object") {
            // Animated: replace color in each keyframe
            const newKeyframes = (k as any[]).map((kf) => {
              const next = { ...kf };
              if (Array.isArray(next.s)) {
                const sc = toRgbColor(next.s);
                if (sc.r === from.r && sc.g === from.g && sc.b === from.b && sc.a === from.a) {
                  next.s = fromRgbColor(to);
                }
              }
              if (Array.isArray(next.e)) {
                const ec = toRgbColor(next.e);
                if (ec.r === from.r && ec.g === from.g && ec.b === from.b && ec.a === from.a) {
                  next.e = fromRgbColor(to);
                }
              }
              if (Array.isArray(next.k)) {
                const kc = toRgbColor(next.k);
                if (kc.r === from.r && kc.g === from.g && kc.b === from.b && kc.a === from.a) {
                  next.k = fromRgbColor(to);
                }
              }
              return next;
            });
            set(newAnim as unknown as object, cPath, newKeyframes);
          }
        }
      }
    }
  };

  const traverseLayers = (layers: Layer.Value[], basePath: string) => {
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i] as any;
      const layerPath = `${basePath}.${i}`;
      if (layer.ty === LayerTypes.Shape) {
        const shapes = (layer as Layer.Shape).shapes || [];
        processShapesAtPath(shapes, `${layerPath}.shapes`);
      } else if (layer.ty === LayerTypes.Precomp) {
        const refId = layer.refId as string | undefined;
        if (refId && Array.isArray((newAnim as any).assets)) {
          const assets = (newAnim as any).assets as any[];
          const ai = assets.findIndex((a) => a.id === refId);
          if (ai >= 0 && Array.isArray(assets[ai].layers)) {
            traverseLayers(assets[ai].layers as Layer.Value[], `assets.${ai}.layers`);
          }
        }
      }
    }
  };

  traverseLayers(animation.layers, "layers");

  return newAnim;
};

export const getLayerHidden = (animation: Animation, layerPath: string): boolean => {
  const val = get(animation as unknown as object, `${layerPath}.hd`);
  return !!val;
};

export const setLayerHidden = (
  animation: Animation,
  layerPath: string,
  hidden: boolean,
): Animation => {
  const newAnim: Animation = { ...animation } as Animation;
  set(newAnim as unknown as object, `${layerPath}.hd`, hidden);
  return newAnim;
};

export const getFramerate = (animation: Animation) => {
  return animation.fr;
};

export const getDimensions = (animation: Animation) => {
  return { width: animation.w, height: animation.h };
};

export const updateDimensions = (
  animation: Animation,
  width: number,
  height: number,
) => {
  return { ...animation, w: width, h: height };
};

export const updateFramerate = (animation: Animation, framerate: number) => {
  return { ...animation, fr: framerate };
};

export const deleteLayer = (animation: Animation, layerIndex: number) => {
  const newLayers = [...animation.layers];
  newLayers.splice(layerIndex, 1);
  return { ...animation, layers: newLayers };
};
