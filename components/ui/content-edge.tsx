import { cn } from "@/lib/utils"

type ContentEdgeProps = {
  /**
   * Overrides the shared edge width for this instance (e.g. "480px",
   * "32rem"). Omit to use the shared --container-edge token so this
   * surface's edges stay aligned with the others.
   */
  width?: string
} & React.ComponentProps<"div">

/**
 * Caps inner content width at the `lg` breakpoint and centers it, staying
 * fluid below. Wraps content inside a fluid card/drawer/header — it doesn't
 * constrain the outer surface itself.
 */
function ContentEdge({ width, className, style, ...props }: ContentEdgeProps) {
  return (
    <div
      data-slot="content-edge"
      className={cn("w-full lg:mx-auto lg:max-w-(--content-edge-width)", className)}
      style={{ "--content-edge-width": width ?? "var(--container-edge)", ...style } as React.CSSProperties}
      {...props}
    />
  )
}

export { ContentEdge }
