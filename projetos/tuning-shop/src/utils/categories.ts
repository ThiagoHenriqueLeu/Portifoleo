import { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

type IconName = ComponentProps<typeof Ionicons>["name"];

export function getCategoryIcon(category: string): IconName {
  const normalized = category.toLowerCase();

  if (normalized.includes("roda")) return "disc";
  if (normalized.includes("suspens")) return "swap-vertical";
  if (normalized.includes("ilumin") || normalized.includes("farol")) return "flashlight";
  if (normalized.includes("performance") || normalized.includes("turbo")) return "speedometer";
  if (normalized.includes("interior")) return "car";
  if (normalized.includes("aero")) return "airplane";

  return "construct";
}
