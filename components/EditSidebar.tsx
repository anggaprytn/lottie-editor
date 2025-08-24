"use client";

import { useState } from "react";
import { useAnimation } from "@/lib/hooks/useAnimation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover";
import { RgbaColorPicker } from "react-colorful";
import { SidebarItem } from "./SidebarItem";
import { ColorIcon } from "./ui/ColorIcon";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import {
  getDimensions,
  getFramerate,
  getSelectedShape,
  RgbaColor,
  getColorGroups,
} from "@/lib/animation";
import { Loading } from "./ui/Loading";

export const EditSidebar = () => {
  const [showUnique, setShowUnique] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const {
    animationJson,
    selectedShapePath,
    updateSelectedShapeColor,
    updateFramerate,
    isAnimationLoading,
    updateDimensions,
    updateColorGlobally,
    setHoveredShapePaths,
    hoveredShapePaths,
    setIsPlaying,
  } = useAnimation();

  const selectedShape =
    animationJson &&
    selectedShapePath &&
    getSelectedShape(animationJson, selectedShapePath);

  const framerate = (animationJson && getFramerate(animationJson)) || 0;

  const { width = 0, height = 0 } =
    (animationJson && getDimensions(animationJson)) || {};

  const colorGroups = animationJson ? getColorGroups(animationJson) : [];

  const handleColorChange = (color: RgbaColor) => {
    updateSelectedShapeColor(color);
  };

  const handleFramerateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFramerate = parseInt(e.target.value, 10);
    updateFramerate(newFramerate);
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value, 10);
    updateDimensions(newWidth, height);
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(e.target.value, 10);
    updateDimensions(width, newHeight);
  };

  return (
    <div className="border-l bg-muted/40 p-4 w-52 shrink-0">
      <div className="flex flex-col justify-between h-full">
        {selectedShape && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Edit {selectedShape.name}</h3>
            </div>
            <div className="flex flex-col gap-2">
              <Popover onOpenChange={(open) => open && setIsPlaying(false)}>
                <PopoverTrigger>
                  <SidebarItem text="Color">
                    <ColorIcon color={selectedShape.colorRgb} />
                  </SidebarItem>
                </PopoverTrigger>
                <PopoverContent>
                  <RgbaColorPicker
                    color={selectedShape.colorRgb}
                    onChange={handleColorChange}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
        {(animationJson || isAnimationLoading) && (
          <div className="flex flex-col gap-4 mt-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Global Settings</h3>
            </div>
            <Loading isLoading={isAnimationLoading} className="h-8">
              <div className="flex items-center gap-2">
                <Label htmlFor="framerate">Width</Label>
                <Input
                  id="width"
                  type="number"
                  onChange={handleWidthChange}
                  value={width}
                  className="w-20"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="framerate">Height</Label>
                <Input
                  id="height"
                  type="number"
                  onChange={handleHeightChange}
                  value={height}
                  className="w-20"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="framerate">Framerate</Label>
                <Input
                  id="framerate"
                  type="number"
                  onChange={handleFramerateChange}
                  value={framerate}
                  className="w-20"
                />
              </div>
            </Loading>
          </div>
        )}

        {(animationJson || isAnimationLoading) && (
          <div className="flex flex-col gap-4 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Unique Colors</h3>
              <button
                className="text-xs text-muted-foreground hover:underline"
                onClick={() => setShowUnique((v) => !v)}
              >
                {showUnique ? "Hide" : "Show"}
              </button>
            </div>
            <Loading isLoading={isAnimationLoading} className="h-8">
              {showUnique && (
                <div className="grid grid-cols-7 gap-2">
                  {colorGroups.map((group, idx) => (
                    // Use a stable key so the popover & picker don't remount during drag
                    <Popover key={`global-color-${idx}`} onOpenChange={(open) => open && setIsPlaying(false)}>
                      <PopoverTrigger>
                        <button
                          className={
                            group.shapePaths.some((p) => hoveredShapePaths.includes(p))
                              ? "ring-2 ring-primary rounded-full"
                              : "rounded-full"
                          }
                          onMouseEnter={() => setHoveredShapePaths(group.shapePaths)}
                          onMouseLeave={() => setHoveredShapePaths([])}
                        >
                          <ColorIcon color={group.color} size={18} withBorder />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <RgbaColorPicker
                          color={group.color}
                          onChange={(c) => updateColorGlobally(group.color, c)}
                        />
                      </PopoverContent>
                    </Popover>
                  ))}
                  {colorGroups.length === 0 && (
                    <div className="text-sm text-muted-foreground">No colors detected</div>
                  )}
                </div>
              )}
            </Loading>
          </div>
        )}

        {(animationJson || isAnimationLoading) && colorGroups.length > 0 && (
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">All Colors</h3>
              <button
                className="text-xs text-muted-foreground hover:underline"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? "Hide" : "Show"}
              </button>
            </div>
            <Loading isLoading={isAnimationLoading} className="h-8">
              {showAll && (
                <div className="grid grid-cols-7 gap-2 max-h-40 overflow-y-auto pr-1">
                  {colorGroups.flatMap((group, gIdx) =>
                    group.shapePaths.map((path, pIdx) => (
                      <button
                        key={`all-color-${gIdx}-${pIdx}`}
                        className={
                          hoveredShapePaths.includes(path)
                            ? "ring-2 ring-primary rounded-full"
                            : "rounded-full"
                        }
                        onMouseEnter={() => setHoveredShapePaths([path])}
                        onMouseLeave={() => setHoveredShapePaths([])}
                        title={path}
                      >
                        <ColorIcon color={group.color} size={14} withBorder />
                      </button>
                    )),
                  )}
                </div>
              )}
            </Loading>
          </div>
        )}
      </div>
    </div>
  );
};
