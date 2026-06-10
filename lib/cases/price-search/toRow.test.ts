import { test } from "node:test"
import assert from "node:assert/strict"
import { toPriceRow } from "./steps/StepDataTable"

test("toPriceRow maps string to PriceDataRow at index", () => {
  const row = toPriceRow("iPhone 15", 0)
  assert.equal(row.id, 1)
  assert.equal(row.product, "iPhone 15")
  assert.equal(row.price, "")
  assert.equal(row.status, "ожидает")
})

test("toPriceRow assigns correct id from index", () => {
  assert.equal(toPriceRow("A", 0).id, 1)
  assert.equal(toPriceRow("B", 4).id, 5)
  assert.equal(toPriceRow("C", 99).id, 100)
})

test("toPriceRow returns ожидает status for every input", () => {
  const statuses = ["a", "b", "c"].map((s, i) => toPriceRow(s, i).status)
  assert.deepEqual(statuses, ["ожидает", "ожидает", "ожидает"])
})
