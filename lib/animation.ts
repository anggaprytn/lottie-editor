import {
  Animation,
  Layer,
  Shape,
} from "@lottie-animation-community/lottie-types";
import { set, get } from "lodash-es";

const LayerTypes = {
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

export interface LayerInfo {
  path: string;
  name: string;
  shapes: ShapeInfo[];
}

export interface ShapeInfo {
  path: string;
  name: string;
  colorRgb: RgbaColor;
  children: ShapeInfo[];
}

export const getAnimationLayers = (animation: Animation): LayerInfo[] => {
  const layers = animation.layers;
  return layers.map((layer, i) => {
    const path = `layers.${i}`;
    const layerInfo: LayerInfo = {
      path: path,
      name: layer.nm || "Unnamed Layer",
      shapes: [],
    };
    switch (layer.ty) {
      case LayerTypes.Shape:
        layerInfo.shapes = getShapesFromLayer(
          (layer as Layer.Shape).shapes,
          `${path}.shapes`,
        );
        break;
      default:
        break;
    }
    return layerInfo;
  });
};

export const getShape = (shape: Shape.Value, path: string): ShapeInfo => {
  const shapeInfo: ShapeInfo = {
    path: path,
    name: shape.nm || "Unnamed Shape",
    colorRgb: defaultColor,
    children: [],
  };
  switch (shape.ty) {
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
  shapes: Shape.Value[],
  path: string,
): ShapeInfo[] => {
  return shapes.map((shape, i) => getShape(shape, `${path}.${i}`));
};

const getColorsFromFillShape = (shape: Shape.Fill): RgbaColor => {
  return toRgbColor(shape.c.k as number[]);
};

const getColorsFromStrokeShape = (shape: Shape.Stroke): RgbaColor => {
  if (shape.c.a === 1) return defaultColor; // TODO: handle multiple colors
  return toRgbColor(shape.c.k as number[]);
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
