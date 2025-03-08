import { boardProps } from "@tscircuit/props"
import { type Matrix, identity } from "transformation-matrix"
import { Group } from "../primitive-components/Group/Group"
import { getBoundsOfPcbComponents } from "../../utils/get-bounds-of-pcb-components"

export class Board extends Group<typeof boardProps> {
  pcb_board_id: string | null = null

  get isSubcircuit() {
    return true
  }

  get config() {
    return {
      componentName: "Board",
      zodProps: boardProps,
    }
  }

  get boardThickness() {
    const { _parsedProps: props } = this
    return 1.4 // TODO use prop
  }

  /**
   * Get all available layers for the board
   */
  get allLayers() {
    // TODO use the board numLayers prop
    return ["top", "bottom", "inner1", "inner2"]
  }

  doInitialPcbBoardAutoSize(): void {
    if (this.root?.pcbDisabled) return
    if (!this.pcb_board_id) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    // Skip if width and height are explicitly provided
    if (props.width && props.height) return

    // Use getBoundsOfPcbComponents to recursively get bounds of all components
    const bounds = getBoundsOfPcbComponents(this.children)

    // If no components found, use default minimal size
    if (bounds.width === 0 || bounds.height === 0) return

    // Add padding around components (e.g. 2mm on each side)
    const padding = 2
    const computedWidth = bounds.width + padding * 2
    const computedHeight = bounds.height + padding * 2

    // Center the board around the components
    const center = {
      x: (bounds.minX + bounds.maxX) / 2 + (props.outlineOffsetX ?? 0),
      y: (bounds.minY + bounds.maxY) / 2 + (props.outlineOffsetY ?? 0),
    }

    // Update the board dimensions
    db.pcb_board.update(this.pcb_board_id, {
      width: computedWidth,
      height: computedHeight,
      center,
    })
  }

  doInitialPcbComponentRender(): void {
    if (this.root?.pcbDisabled) return
    const { db } = this.root!
    const { _parsedProps: props } = this

    // Initialize with minimal dimensions if not provided
    // They will be updated in PcbBoardAutoSize phase
    let computedWidth = props.width ?? 0
    let computedHeight = props.height ?? 0

    // Compute width and height from outline if not provided
    if (props.outline) {
      const xValues = props.outline.map((point) => point.x)
      const yValues = props.outline.map((point) => point.y)

      const minX = Math.min(...xValues)
      const maxX = Math.max(...xValues)
      const minY = Math.min(...yValues)
      const maxY = Math.max(...yValues)

      computedWidth = maxX - minX
      computedHeight = maxY - minY
    }

    const pcb_board = db.pcb_board.insert({
      center: {
        x: (props.pcbX ?? 0) + (props.outlineOffsetX ?? 0),
        y: (props.pcbY ?? 0) + (props.outlineOffsetY ?? 0),
      },

      thickness: this.boardThickness,
      num_layers: this.allLayers.length,

      width: computedWidth!,
      height: computedHeight!,
      outline: props.outline?.map((point) => ({
        x: point.x + (props.outlineOffsetX ?? 0),
        y: point.y + (props.outlineOffsetY ?? 0),
      })),
    })

    this.pcb_board_id = pcb_board.pcb_board_id!
  }

  removePcbComponentRender(): void {
    const { db } = this.root!
    if (!this.pcb_board_id) return
    db.pcb_board.delete(this.pcb_board_id!)
    this.pcb_board_id = null
  }

  _computePcbGlobalTransformBeforeLayout(): Matrix {
    return identity()
  }
}
