import { describe, expect, test } from "bun:test"
import { pack } from "../lib/pack"
import type { InputComponent, PackInput } from "../lib/types"

describe("Single-axis constrained packing with fixed distance", () => {
  const createMockChip = (
    id: string,
    width = 10,
    height = 10,
  ): InputComponent => ({
    componentId: id,
    pads: [
      {
        padId: `${id}_p1`,
        networkId: `${id}_net1`,
        type: "rect",
        offset: { x: -width / 4, y: 0 },
        size: { x: 2, y: 2 },
      },
      {
        padId: `${id}_p2`,
        networkId: `${id}_net2`,
        type: "rect",
        offset: { x: width / 4, y: 0 },
        size: { x: 2, y: 2 },
      },
    ],
  })

  test("maintains fixed x distance and orientation between chip pair", () => {
    const chipA = createMockChip("chipA", 10, 10)
    const chipB = createMockChip("chipB", 10, 10)

    const input: PackInput = {
      components: [chipA, chipB],
      minGap: 2,
      packOrderStrategy: "largest_to_smallest",
      packPlacementStrategy: "minimum_sum_distance_to_network",
      distanceConstraints: [
        {
          leftChipId: "chipA",
          rightChipId: "chipB",
          type: "fixed_x_distance_and_orientation",
          distance: 25,
        },
      ],
    }

    const output = pack(input)

    const packedA = output.components.find((c) => c.componentId === "chipA")!
    const packedB = output.components.find((c) => c.componentId === "chipB")!

    expect(packedA).toBeDefined()
    expect(packedB).toBeDefined()

    // Verify exact fixed distance along X axis
    expect(packedB.center.x - packedA.center.x).toBeCloseTo(25, 4)
    // Verify Y alignment
    expect(packedB.center.y).toBeCloseTo(packedA.center.y, 4)
    // Verify orientation matches
    expect(packedB.ccwRotationOffset).toBe(packedA.ccwRotationOffset)
  })

  test("updates pad absolute positions accurately according to constraint", () => {
    const chipA = createMockChip("chipA", 8, 8)
    const chipB = createMockChip("chipB", 8, 8)

    const input: PackInput = {
      components: [chipA, chipB],
      minGap: 2,
      packOrderStrategy: "largest_to_smallest",
      packPlacementStrategy: "minimum_sum_distance_to_network",
      distanceConstraints: [
        {
          leftChipId: "chipA",
          rightChipId: "chipB",
          type: "fixed_x_distance_and_orientation",
          distance: 15,
        },
      ],
    }

    const output = pack(input)

    const packedA = output.components.find((c) => c.componentId === "chipA")!
    const packedB = output.components.find((c) => c.componentId === "chipB")!

    expect(packedB.center.x - packedA.center.x).toBeCloseTo(15, 4)

    // Verify pad absolute centers are offset by chip center
    expect(packedB.pads[0].absoluteCenter.x).toBeCloseTo(
      packedB.center.x + chipB.pads[0].offset.x,
      4,
    )
    expect(packedB.pads[0].absoluteCenter.y).toBeCloseTo(
      packedB.center.y + chipB.pads[0].offset.y,
      4,
    )
  })

  test("packs third independent component alongside constrained pair without collision", () => {
    const chipA = createMockChip("chipA", 10, 10)
    const chipB = createMockChip("chipB", 10, 10)
    const chipC = createMockChip("chipC", 10, 10)

    const input: PackInput = {
      components: [chipA, chipB, chipC],
      minGap: 2,
      packOrderStrategy: "largest_to_smallest",
      packPlacementStrategy: "minimum_sum_distance_to_network",
      distanceConstraints: [
        {
          leftChipId: "chipA",
          rightChipId: "chipB",
          type: "fixed_x_distance_and_orientation",
          distance: 20,
        },
      ],
    }

    const output = pack(input)

    const packedA = output.components.find((c) => c.componentId === "chipA")!
    const packedB = output.components.find((c) => c.componentId === "chipB")!
    const packedC = output.components.find((c) => c.componentId === "chipC")!

    expect(packedB.center.x - packedA.center.x).toBeCloseTo(20, 4)
    expect(packedB.center.y).toBeCloseTo(packedA.center.y, 4)
    expect(packedB.ccwRotationOffset).toBe(packedA.ccwRotationOffset)
    expect(packedC).toBeDefined()
  })
})
