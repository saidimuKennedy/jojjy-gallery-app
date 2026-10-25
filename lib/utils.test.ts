import { test } from "node:test";
import assert from "node:assert/strict";
import { formatUsdPrice } from "./utils";

test("formatUsdPrice keeps two decimal places for whole and fractional amounts", () => {
  assert.equal(formatUsdPrice(55), "$ 55.00");
  assert.equal(formatUsdPrice(42.5), "$ 42.50");
});
