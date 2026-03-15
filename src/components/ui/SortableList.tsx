"use client";

import {
  closestCenter,
  DndContext,
  type DraggableAttributes,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type ReactNode, useCallback } from "react";

import { DragHandle } from "@/components/icons";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────────

export interface SortableItem {
  id: string;
}

export interface DragHandleProps {
  attributes: DraggableAttributes;
  listeners: Record<string, unknown> | undefined;
}

export interface SortableRowProps<T extends SortableItem> {
  item: T;
  index: number;
  isDragging: boolean;
  dragHandleProps: DragHandleProps;
}

interface SortableListProps<T extends SortableItem> {
  items: T[];
  onReorder: (reordered: T[]) => void;
  renderRow: (props: SortableRowProps<T>) => ReactNode;
  disabled?: boolean;
}

// ── Sortable Row Wrapper ────────────────────────────────────────────────────

function SortableRow<T extends SortableItem>({
  item,
  index,
  renderRow,
  disabled,
}: {
  item: T;
  index: number;
  renderRow: (props: SortableRowProps<T>) => ReactNode;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging && "opacity-50 scale-[1.02] shadow-lg z-50",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      {renderRow({
        item,
        index,
        isDragging,
        dragHandleProps: { attributes, listeners },
      })}
    </div>
  );
}

// ── DragHandleButton ────────────────────────────────────────────────────────

export function DragHandleButton({ dragHandleProps }: { dragHandleProps: DragHandleProps }) {
  return (
    <button
      type="button"
      {...dragHandleProps.attributes}
      {...dragHandleProps.listeners}
      className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
      aria-label="Drag to reorder"
    >
      <DragHandle className="w-4 h-4" />
    </button>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function SortableList<T extends SortableItem>({
  items,
  onReorder,
  renderRow,
  disabled = false,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      onReorder(arrayMove(items, oldIndex, newIndex));
    },
    [items, onReorder],
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item, index) => (
            <SortableRow
              key={item.id}
              item={item}
              index={index}
              renderRow={renderRow}
              disabled={disabled}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
