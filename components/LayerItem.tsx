import { useState } from "react";
import { Layers, Trash2 } from "lucide-react";
import { LayerInfo } from "@/lib/animation";
import { ShapeItem } from "./ShapeItem";
import { SidebarItem } from "./SidebarItem";
import { Button } from "./ui/Button";
import { useAnimation } from "@/lib/hooks/useAnimation";

interface LayerListProps {
  layer: LayerInfo;
  layerIndex: number;
}

export const LayerItem = ({ layer, layerIndex }: LayerListProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { deleteLayer } = useAnimation();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteLayer(layerIndex);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <SidebarItem text={layer.name} onClick={() => setIsExpanded(!isExpanded)}>
            <Layers className="h-4 w-4" />
          </SidebarItem>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
          title={`Delete ${layer.name}`}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      {isExpanded &&
        layer.shapes.map((shape, i) => <ShapeItem key={i} shape={shape} />)}
    </div>
  );
};
