import { test } from "node:test"
import assert from "node:assert/strict"
import type { ThreadsPost } from "./data"
import { toThreadsRow } from "./steps/StepDataTable"

const make = (date: string): ThreadsPost => ({
  date,
  postText: "",
  postUrl: "",
  comment: "",
})

test("toThreadsRow maps ThreadsPost to ThreadsDataRow at index", () => {
  const row = toThreadsRow(make("18.05"), 0)
  assert.equal(row.id, 1)
  assert.equal(row.date, "18.05")
  assert.equal(row.status, "ожидает")
  assert.equal(row.postUrl, "")
  assert.equal(row.postText, "")
  assert.equal(row.comment, "")
})

test("toThreadsRow assigns correct id from index", () => {
  assert.equal(toThreadsRow(make("a"), 0).id, 1)
  assert.equal(toThreadsRow(make("b"), 4).id, 5)
})
