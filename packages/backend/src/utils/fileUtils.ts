import { mkdir, readdir, readFile, rm, writeFile } from "fs/promises";
import * as path from "path";

import { type SDK } from "caido:plugin";

import { type CompareItem } from "../types";

export async function ensureCompareDirectories(sdk: SDK): Promise<boolean> {
  try {
    const dataDir = getCompareDataDir(sdk);
    const panel1Dir = getPanel1Dir(sdk);
    const panel2Dir = getPanel2Dir(sdk);

    await mkdir(dataDir, { recursive: true });
    await mkdir(panel1Dir, { recursive: true });
    await mkdir(panel2Dir, { recursive: true });

    return true;
  } catch (error) {
    sdk.console.error(
      "Failed to initialize compare directories: " + (error as Error).message,
    );
    return false;
  }
}

function getCompareDataDir(sdk: SDK): string {
  return path.join(sdk.meta.path(), "compare-data");
}

function getPanel1Dir(sdk: SDK): string {
  return path.join(getCompareDataDir(sdk), "panel1");
}

function getPanel2Dir(sdk: SDK): string {
  return path.join(getCompareDataDir(sdk), "panel2");
}

function getPanelDir(sdk: SDK, panelNumber: 1 | 2): string {
  return panelNumber === 1 ? getPanel1Dir(sdk) : getPanel2Dir(sdk);
}

function getItemPath(sdk: SDK, panelNumber: 1 | 2, itemId: number): string {
  const panelDir = getPanelDir(sdk, panelNumber);
  return path.join(panelDir, `${itemId}.json`);
}

export async function saveItemToFile(
  sdk: SDK,
  panelNumber: 1 | 2,
  item: CompareItem,
): Promise<boolean> {
  try {
    const itemPath = getItemPath(sdk, panelNumber, item.id);

    const storageItem = {
      ...item,
      timestamp: item.timestamp.toISOString(),
    };

    await writeFile(itemPath, JSON.stringify(storageItem, null, 2));
    return true;
  } catch (error) {
    sdk.console.error(
      `Failed to save item ${item.id} to file: ${(error as Error).message}`,
    );
    return false;
  }
}

export async function deleteItemFile(
  sdk: SDK,
  panelNumber: 1 | 2,
  itemId: number,
): Promise<boolean> {
  try {
    const itemPath = getItemPath(sdk, panelNumber, itemId);
    await rm(itemPath);
    return true;
  } catch (error) {
    if ((error as Error & { code?: string }).code === "ENOENT") {
      return true;
    }
    sdk.console.error(
      `Failed to delete item ${itemId} file: ${(error as Error).message}`,
    );
    return false;
  }
}

async function loadItemsFromFiles(
  sdk: SDK,
  panelNumber: 1 | 2,
): Promise<CompareItem[]> {
  const items: CompareItem[] = [];

  try {
    const panelDir = getPanelDir(sdk, panelNumber);
    const files = await readdir(panelDir);

    for (const file of files) {
      if (file.endsWith(".json")) {
        try {
          const itemPath = path.join(panelDir, file);
          const content = await readFile(itemPath, "utf8");
          const storageItem = JSON.parse(content);

          const item: CompareItem = {
            ...storageItem,
            timestamp: new Date(storageItem.timestamp),
          };

          items.push(item);
        } catch (fileError) {
          sdk.console.warn(
            `Failed to load item from file ${file}: ${(fileError as Error).message}`,
          );
        }
      }
    }
  } catch (error) {
    sdk.console.error(
      `Failed to load items from ${panelNumber === 1 ? "Original" : "Modified"}: ${(error as Error).message}`,
    );
  }

  return items;
}

export async function clearPanelFiles(
  sdk: SDK,
  panelNumber: 1 | 2,
): Promise<boolean> {
  try {
    const panelDir = getPanelDir(sdk, panelNumber);

    try {
      const files = await readdir(panelDir);

      const deletePromises = files
        .filter((file) => file.endsWith(".json"))
        .map((file) => {
          const filePath = path.join(panelDir, file);
          return rm(filePath).catch((err: unknown) => {
            if ((err as Error & { code?: string }).code !== "ENOENT") {
              sdk.console.warn(
                `Failed to delete file ${file}: ${(err as Error).message}`,
              );
            }
          });
        });

      await Promise.all(deletePromises);
    } catch (dirError) {
      if ((dirError as Error & { code?: string }).code === "ENOENT") {
        return true;
      }
      throw dirError;
    }

    return true;
  } catch (error) {
    sdk.console.error(
      `Failed to clear ${panelNumber === 1 ? "Original" : "Modified"} files: ${(error as Error).message}`,
    );
    return false;
  }
}

export async function loadAllItemsFromFiles(
  sdk: SDK,
): Promise<{ panel1: CompareItem[]; panel2: CompareItem[] }> {
  const [panel1Items, panel2Items] = await Promise.all([
    loadItemsFromFiles(sdk, 1),
    loadItemsFromFiles(sdk, 2),
  ]);

  return {
    panel1: panel1Items,
    panel2: panel2Items,
  };
}
