import { MAX_ITEM_MEGABYTES, MAX_REQUESTS_PER_ADD } from "shared";

import { DIFF_MODE_DETAILS, DIFF_OPTION_LABELS } from "@/presentation/diff";
import {
  PANEL_ACTIONS,
  PANEL_TITLES,
  SEND_LABELS,
} from "@/presentation/panels";

type Entry = { title: string; text: string };

type Guide = { title: string; steps: string[] };

type ComparisonType = Entry & { titleClass: string; useWhen: string };

type ContactLink = { href: string; icon: string; label: string };

export const SECTIONS = [
  { id: "what-is-compare", title: "What is Compare?" },
  { id: "quick-start", title: "Quick Start" },
  { id: "data-input", title: "Data Input Methods" },
  { id: "comparison-types", title: "Comparison Types" },
  { id: "panel-management", title: "Panel Management" },
  { id: "http-history", title: "HTTP History Integration" },
  { id: "about", title: "About" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

export const INTRODUCTION = [
  "Compare is a plugin for Caido that shows HTTP requests, responses, and files side by side and highlights every difference.",
  "Think of it as a diff tool built into Caido: load two pieces of data, compare them by words, bytes, or lines, and see what changed at a glance.",
];

export const QUICK_START_STEPS: Entry[] = [
  {
    title: `1. Add Data to ${PANEL_TITLES.original}`,
    text: `Paste content, load a file, or right-click a request in HTTP History and select "${SEND_LABELS.original}".`,
  },
  {
    title: `2. Add Data to ${PANEL_TITLES.modified}`,
    text: "Add the second piece of content you want to compare the same way: paste it, load a file, or send it from HTTP History.",
  },
  {
    title: "3. Select Items",
    text: `Click one item in the ${PANEL_TITLES.original} panel and one item in the ${PANEL_TITLES.modified} panel.`,
  },
  {
    title: "4. Compare",
    text: `Click "${DIFF_MODE_DETAILS.words.buttonLabel}" for text, "${DIFF_MODE_DETAILS.bytes.buttonLabel}" for character-by-character changes, or "${DIFF_MODE_DETAILS.lines.buttonLabel}" for line-by-line changes.`,
  },
];

export const QUICK_START_NOTE =
  "That's it! The comparison window shows the differences between your two selections in color.";

export const INPUT_METHODS: Entry[] = [
  {
    title: "1. Paste from Clipboard",
    text: `Copy any text and click "${PANEL_ACTIONS.paste.label}". The content is added as a clipboard item.`,
  },
  {
    title: "2. Load from File",
    text: `Click "${PANEL_ACTIONS.load.label}" and pick a text file of up to ${MAX_ITEM_MEGABYTES} MB.`,
  },
];

export const HISTORY_INPUT: Guide = {
  title: "3. Send from HTTP History",
  steps: [
    `Select "${SEND_LABELS.original}" to add to the ${PANEL_TITLES.original} panel`,
    `Select "${SEND_LABELS.modified}" to add to the ${PANEL_TITLES.modified} panel`,
    `Select up to ${MAX_REQUESTS_PER_ADD} requests at once`,
  ],
};

export const COMPARISON_TYPES: ComparisonType[] = [
  {
    title: "Word-Level Comparison",
    titleClass: "text-green-400",
    text: "Best for HTTP requests, responses, and other text. Highlights the words that changed inside each changed line.",
    useWhen:
      "Comparing API responses, HTML content, configuration files, or any structured text.",
  },
  {
    title: "Byte-Level Comparison",
    titleClass: "text-blue-400",
    text: "Compares character by character and highlights every byte that changed.",
    useWhen:
      "Comparing encoded content, binary-like data, or when you need exact character differences.",
  },
  {
    title: "Line-Level Comparison",
    titleClass: "text-amber-400",
    text: "Compares text line by line. Ideal for config files, scripts, and HTTP bodies where changes are often whole lines.",
    useWhen: "Comparing multi-line content where each line is a logical unit.",
  },
];

export const COMPARISON_OPTIONS: Entry[] = [
  {
    title: DIFF_OPTION_LABELS.ignoreWhitespace,
    text: "Treats differences in spacing and indentation within a line as equal, while still showing your original text.",
  },
  {
    title: DIFF_OPTION_LABELS.ignoreCase,
    text: "Treats upper and lower case as equal, while still showing your original text.",
  },
];

export const PANEL_ACTION_GUIDES: Entry[] = [
  {
    title: PANEL_ACTIONS.remove.label,
    text: `Select items and click "${PANEL_ACTIONS.remove.label}" to delete them from the panel.`,
  },
  {
    title: PANEL_ACTIONS.clear.label,
    text: `Click "${PANEL_ACTIONS.clear.label}" to empty a panel at once.`,
  },
  {
    title: PANEL_ACTIONS.move.label,
    text: `Right-click an item and select "${PANEL_ACTIONS.move.label}" to send it to the other panel. Works with several selected items.`,
  },
  {
    title: "Multi-Select",
    text: "Use the checkboxes to select several items at once.",
  },
];

export const PER_PROJECT_NOTE = `Data is saved per project. Each project keeps its own ${PANEL_TITLES.original} and ${PANEL_TITLES.modified} items.`;

export const HISTORY_GUIDES: Guide[] = [
  {
    title: "Individual Requests",
    steps: [
      "Right-click any request in HTTP History",
      `Select "${SEND_LABELS.original}" or "${SEND_LABELS.modified}"`,
      "The request appears in Compare right away",
    ],
  },
  {
    title: "Bulk Operations",
    steps: [
      `Select up to ${MAX_REQUESTS_PER_ADD} requests`,
      `Right-click and choose "${SEND_LABELS.original}" or "${SEND_LABELS.modified}"`,
      "All selected requests are added",
    ],
  },
];

export const ABOUT_TEXT =
  "Compare is a Caido plugin for security testers who need precise side-by-side comparison.";

export const AUTHOR = { name: "Amr Elsagaei", url: "https://amrelsagaei.com" };

export const CONTACT_LINKS: ContactLink[] = [
  {
    href: "mailto:info@amrelsagaei.com",
    icon: "fas fa-envelope",
    label: "Email",
  },
  {
    href: "https://www.linkedin.com/in/amrelsagaei",
    icon: "fab fa-linkedin",
    label: "LinkedIn",
  },
  {
    href: "https://x.com/amrelsagaei",
    icon: "fab fa-x-twitter",
    label: "X/Twitter",
  },
];
