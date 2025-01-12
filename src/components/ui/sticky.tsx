import { type ReactNode } from "react";
import { Separator } from "./separator";
import { cn } from "~/lib/utils";

export function StickyTop({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("sticky top-0 bg-background", className)}>
      <div className="p-4">{children}</div>
      <Separator />
    </div>
  );
}

export function StickyBottom({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("sticky bottom-0 bg-background", className)}>
      <Separator />
      <div className="p-4">{children}</div>
    </div>
  );
}
