import { test } from "node:test"
import assert from "node:assert/strict"
import { toThreadsRow } from "./steps/StepDataTable"

test("toThreadsRow maps ThreadsPost to ThreadsDataRow at index", () => {
  const row = toThreadsRow({ date: "18.05", postText: "", postUrl: "", comment: "" }, 0)
  assert.equal(row.id, 1)
  assert.equal(row.date, "18.05")
  assert.equal(row.status, "ожидает")
  assert.equal(row.postUrl, "")
  assert.equal(row.postText, "")
  assert.equal(row.comment, "")
})

test("toThreadsRow assigns correct id from index", () => {
  const r0 = toThreadsRow({ date: "a" } as never, 0)
  const r4 = toThreadsRow({ date: "b" } as never, 4)
  assert.equal(r0.id, 1)
  assert.equal(r4.id, 5)
})
