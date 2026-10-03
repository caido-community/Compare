import { type CompareItem, type Panel } from "shared";

export const TEST_ROOT = "/data";

export const FIXED_TIME = "2026-10-03T00:00:00.000Z";

export const TEST_PROJECT_ID = "project-a";

export const OTHER_PROJECT_ID = "project-b";

export const buildTestItem = (
  id: number,
  data = `item ${id}`,
): CompareItem => ({
  id,
  kind: "clipboard",
  source: "clipboard",
  data,
  createdAt: FIXED_TIME,
});

export const buildItemPath = (
  panel: Panel,
  id: number,
  projectId = TEST_PROJECT_ID,
) => `${TEST_ROOT}/projects/${projectId}/${panel}/${id}.json`;
