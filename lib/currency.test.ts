import { test } from "node:test";
import assert from "node:assert/strict";
import { musicCatalogPrice, normalizeToUsd } from "./currency";

test("USD catalogue price is passed through", () => {
  assert.deepEqual(musicCatalogPrice(12, "USD"), {
    price: 12,
    currency: "USD",
  });
});

test("legacy KES catalogue price is converted to USD at KES_PER_USD", () => {
  const previous = process.env.KES_PER_USD;
  process.env.KES_PER_USD = "130";
  try {
    assert.deepEqual(musicCatalogPrice(1300, "KES"), {
      price: 10,
      currency: "USD",
    });
  } finally {
    if (previous === undefined) delete process.env.KES_PER_USD;
    else process.env.KES_PER_USD = previous;
  }
});

test("unsupported currency is refused instead of relabelled as USD", () => {
  assert.throws(() => normalizeToUsd(10, "EUR"), /Unsupported catalogue currency/);
});
