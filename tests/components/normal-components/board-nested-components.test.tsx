import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board auto-sizes with deeply nested components", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <group>
        <group>
          <resistor
            name="R1"
            resistance="10k"
            footprint="0402"
            pcbX={10}
            pcbY={10}
          />
        </group>
      </group>
      <group>
        <resistor
          name="R2"
          resistance="10k"
          footprint="0402"
          pcbX={-10}
          pcbY={-10}
        />
      </group>
    </board>,
  )

  circuit.render()
  const pcb_board = circuit.db.pcb_board.list()[0]

  // Should be at least 20mm (component spread) + padding
  expect(pcb_board.width).toBeGreaterThan(22)
  expect(pcb_board.height).toBeGreaterThan(22)
})

test("board auto-sizes with subcircuits", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board>
      <group subcircuit>
        <resistor
          name="R1"
          resistance="10k"
          footprint="0402"
          pcbX={15}
          pcbY={15}
        />
        <capacitor
          name="C1"
          capacitance="10uF"
          footprint="0603"
          pcbX={-15}
          pcbY={-15}
        />
      </group>
    </board>,
  )

  circuit.render()
  const pcb_board = circuit.db.pcb_board.list()[0]

  // Should be at least 30mm (component spread) + padding
  expect(pcb_board.width).toBeGreaterThan(32)
  expect(pcb_board.height).toBeGreaterThan(32)
})
