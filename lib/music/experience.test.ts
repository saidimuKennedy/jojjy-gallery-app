import { test } from "node:test";
import assert from "node:assert/strict";
import { releaseExperience, experienceTone } from "./experience";

test("permanent ownership wins over studio access", () => {
  assert.equal(
    releaseExperience({ owned: true, isStudioMember: true }),
    "OWNED"
  );
});

test("active membership without unlock is STUDIO", () => {
  assert.equal(
    releaseExperience({ owned: false, isStudioMember: true }),
    "STUDIO"
  );
});

test("neither is DISCOVERY", () => {
  assert.equal(
    releaseExperience({ owned: false, isStudioMember: false }),
    "DISCOVERY"
  );
});

test("missing/undefined access is DISCOVERY", () => {
  assert.equal(releaseExperience(undefined), "DISCOVERY");
  assert.equal(releaseExperience(null), "DISCOVERY");
  assert.equal(releaseExperience({}), "DISCOVERY");
});

test("tone: discovery is light, acquired is dark", () => {
  assert.equal(experienceTone("DISCOVERY"), "light");
  assert.equal(experienceTone("OWNED"), "dark");
  assert.equal(experienceTone("STUDIO"), "dark");
});
