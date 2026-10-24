import { test } from "node:test";
import assert from "node:assert/strict";
import {
  firstQueryValue,
  resolveCallbackReference,
  readMusicPaymentReference,
} from "./paystack-callback";

test("firstQueryValue: string / array / empty / undefined", () => {
  assert.equal(firstQueryValue("abc"), "abc");
  assert.equal(firstQueryValue(["", "abc"]), "abc");
  assert.equal(firstQueryValue([]), undefined);
  assert.equal(firstQueryValue(undefined), undefined);
  assert.equal(firstQueryValue(""), undefined);
});

test("resolveCallbackReference: single reference", () => {
  assert.deepEqual(resolveCallbackReference({ reference: "ref_1" }), {
    reference: "ref_1",
  });
});

test("resolveCallbackReference: reference + matching trxref", () => {
  assert.deepEqual(
    resolveCallbackReference({ reference: "ref_1", trxref: "ref_1" }),
    { reference: "ref_1" }
  );
});

test("resolveCallbackReference: duplicate identical array value", () => {
  assert.deepEqual(
    resolveCallbackReference({ reference: ["ref_1", "ref_1"], trxref: "ref_1" }),
    { reference: "ref_1" }
  );
});

test("resolveCallbackReference: mismatch is refused", () => {
  assert.deepEqual(
    resolveCallbackReference({ reference: "ref_1", trxref: "ref_2" }),
    { mismatch: true }
  );
});

test("resolveCallbackReference: missing reference", () => {
  assert.deepEqual(resolveCallbackReference({}), { reference: undefined });
});

test("readMusicPaymentReference: single value resolves", () => {
  assert.equal(readMusicPaymentReference("ref_1", undefined), "ref_1");
});

test("readMusicPaymentReference: duplicated identical values resolve", () => {
  assert.equal(
    readMusicPaymentReference(["ref_1", "ref_1"], "ref_1"),
    "ref_1"
  );
});

test("readMusicPaymentReference: reference + matching trxref resolve", () => {
  assert.equal(readMusicPaymentReference("ref_1", "ref_1"), "ref_1");
});

test("readMusicPaymentReference: conflict returns undefined (no hang)", () => {
  assert.equal(readMusicPaymentReference("ref_1", "ref_2"), undefined);
});

test("readMusicPaymentReference: missing returns undefined", () => {
  assert.equal(readMusicPaymentReference(undefined, undefined), undefined);
});
