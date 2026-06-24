import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

async function workflow(path) {
  return readFile(new URL(`../.github/workflows/${path}`, import.meta.url), "utf8");
}

function assertEcsDeploys(workflowBody, expectedContainerName) {
  assert.match(workflowBody, /group: quickvoice-backend-deploy-\$\{\{ github\.ref \}\}/);
  assert.match(workflowBody, /ECS_CLUSTER: \$\{\{ vars\.ECS_CLUSTER \}\}/);
  assert.match(workflowBody, /ECS_SERVICE: \$\{\{ vars\.ECS_SERVICE \}\}/);
  assert.match(workflowBody, new RegExp(`${expectedContainerName}_ECS_CONTAINER_NAME: \\$\\{\\{ vars\\.${expectedContainerName}_ECS_CONTAINER_NAME \\|\\| '${expectedContainerName === "SERVER" ? "quickvoice-server" : "quickvoice-ai"}' \\}\\}`));

  assert.match(workflowBody, /REQUIRED_ECS_CLUSTER: \$\{\{ env\.ECS_CLUSTER \}\}/);
  assert.match(workflowBody, /REQUIRED_ECS_SERVICE: \$\{\{ env\.ECS_SERVICE \}\}/);

  assert.match(workflowBody, /SERVER_IMAGE_URI: \$\{\{ steps\.login-ecr\.outputs\.registry \}\}\/\$\{\{ env\.SERVER_ECR_REPOSITORY \}\}@\$\{\{ steps\.server_build\.outputs\.digest \}\}/);
  assert.match(workflowBody, /AI_IMAGE_URI: \$\{\{ steps\.login-ecr\.outputs\.registry \}\}\/\$\{\{ env\.AI_ECR_REPOSITORY \}\}@\$\{\{ steps\.ai_build\.outputs\.digest \}\}/);
  assert.match(workflowBody, /SERVER_CHANGED: \$\{\{ needs\.changes\.outputs\.server \}\}/);
  assert.match(workflowBody, /AI_CHANGED: \$\{\{ needs\.changes\.outputs\.ai \}\}/);
  assert.match(workflowBody, /aws ecs describe-services/);
  assert.match(workflowBody, /aws ecs register-task-definition/);
  assert.match(workflowBody, /aws ecs update-service/);
  assert.match(workflowBody, /--force-new-deployment/);
  assert.match(workflowBody, /aws ecs wait services-stable/);
}

test("backend workflow deploys changed images to ECS once", async () => {
  const body = await workflow("backend-build.yml");

  assert.match(body, /Detect backend changes/);
  assert.match(body, /server_changed=true/);
  assert.match(body, /ai_changed=true/);
  assert.match(body, /Build and push server Docker image/);
  assert.match(body, /Build and push AI Docker image/);
  assert.match(body, /Deploy image\(s\) to ECS/);
  assertEcsDeploys(body, "SERVER");
  assertEcsDeploys(body, "AI");
});

test("legacy split backend deploy workflows are removed", async () => {
  await assert.rejects(
    access(new URL("../.github/workflows/server-build.yml", import.meta.url)),
    /ENOENT/
  );
  await assert.rejects(
    access(new URL("../.github/workflows/ai-build.yml", import.meta.url)),
    /ENOENT/
  );
});
