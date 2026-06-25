import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createAgentSchema,
  updateAgentSchema,
} from "../../src/modules/agent/agent.schema.js";

test("createAgentSchema accepts console template slugs", () => {
  for (const templateId of ["blank", "business", "medical", "support"]) {
    const parsed = createAgentSchema.parse({
      name: "Sales Qualifier",
      isActive: true,
      templateId,
    });

    assert.equal(parsed.templateId, templateId);
  }
});

test("createAgentSchema still accepts null and UUID template ids", () => {
  const uuidTemplate = createAgentSchema.parse({
    name: "Support Agent",
    isActive: true,
    templateId: "8d55565f-1111-4111-8111-f95fd03f0df2",
  });
  assert.equal(
    uuidTemplate.templateId,
    "8d55565f-1111-4111-8111-f95fd03f0df2"
  );

  const nullTemplate = createAgentSchema.parse({
    name: "Blank Agent",
    isActive: true,
    templateId: null,
  });
  assert.equal(nullTemplate.templateId, null);
});

test("createAgentSchema rejects unknown template strings", () => {
  assert.throws(
    () =>
      createAgentSchema.parse({
        name: "Bad Template",
        isActive: true,
        templateId: "not-a-real-template",
      }),
    /Invalid template ID/
  );
});

test("updateAgentSchema accepts partial template slug updates", () => {
  const parsed = updateAgentSchema.parse({ templateId: "business" });
  assert.equal(parsed.templateId, "business");
});
