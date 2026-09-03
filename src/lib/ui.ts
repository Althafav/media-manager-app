// Shared Tailwind utility-class strings for the ledger design system.
// Kept as plain strings (not @apply/CSS classes) so every page composes
// the same look purely out of Tailwind utilities.

export const page = "mx-auto w-full max-w-[960px] px-5 pt-8 pb-16";

export const h1 =
  "block w-fit font-display font-extrabold text-[2.1rem] leading-none tracking-wide uppercase pb-2.5 border-b-[3px] border-accent mb-2";

export const h2 =
  "font-display font-bold text-xl tracking-wide uppercase text-accent-ink mt-7 mb-2.5 pl-2.5 border-l-4 border-accent";

export const muted = "text-ink-soft text-sm";

export const backLink =
  "inline-flex items-center gap-1.5 font-mono text-xs font-medium tracking-wider uppercase text-ink-soft mb-3 hover:text-accent hover:underline hover:decoration-accent";

export const button =
  "font-mono text-[0.8rem] font-medium tracking-wider uppercase px-4 py-2.5 border border-ink rounded-[2px] bg-ink text-paper cursor-pointer w-fit transition-colors duration-150 enabled:hover:bg-accent enabled:hover:border-accent disabled:opacity-60 disabled:cursor-not-allowed";

export const table = "w-full border-collapse my-2 mb-6";
export const th =
  "text-left px-2.5 py-2 border-b-2 border-ink font-mono text-xs uppercase tracking-wider text-ink-soft";
export const td = "text-left px-2.5 py-2 border-b border-rule align-top";
export const trHover = "hover:bg-accent/5";

export const card =
  "relative bg-paper-card border border-rule border-l-[6px] border-l-accent-ink rounded-[2px] px-4.5 py-4 mb-3";

const badgeBase =
  "clip-tag inline-flex items-center h-6 pl-3.5 pr-2 font-mono text-xs font-medium tracking-wider uppercase mr-1.5";
export const badge = `${badgeBase} bg-rule text-ink`;
export const badgeClasses = (extra: string) => `${badgeBase} ${extra}`;

export const tagChip =
  "clip-tag-sm inline-flex items-center h-6 gap-1.5 pl-3 pr-2 font-mono text-xs bg-rule text-ink mr-1.5";

export const bannerOk = "px-3.5 py-2.5 mb-3 border-l-4 border-l-ok bg-ok/10 text-ok text-sm";
export const bannerError = "px-3.5 py-2.5 mb-3 border-l-4 border-l-danger bg-danger/10 text-danger text-sm";

export const formStack =
  "flex flex-col gap-4 max-w-[520px] px-5 py-4 bg-paper-card border border-rule border-l-4 border-l-accent-ink";
export const formInline =
  "flex flex-wrap gap-2.5 items-end mb-4 px-4 py-3.5 bg-paper-card border border-rule";

export const label = "flex flex-col gap-1 font-mono text-xs font-medium tracking-wider uppercase text-ink-soft";

export const input =
  "w-full font-sans normal-case tracking-normal px-2.5 py-2 border border-rule rounded-[2px] bg-paper text-ink";

export const errorText = "font-mono text-xs normal-case tracking-normal text-danger";

export const radioGroup = "flex flex-wrap gap-4";
export const radioOption =
  "inline-flex items-center gap-1.5 font-sans normal-case tracking-normal text-sm text-ink";
export const radioInput = "accent-accent-ink";

export const filterBar =
  "flex flex-col gap-2.5 mb-4 px-4 py-3.5 bg-paper-card border border-rule md:flex-row md:flex-wrap md:items-end";

export const dayChipStrip =
  "flex gap-2 overflow-x-auto -mx-5 px-5 pb-2 mb-4 md:flex-wrap md:overflow-visible md:mx-0 md:px-0 md:pb-0";
export const dayChip =
  "clip-tag-sm shrink-0 inline-flex items-center gap-1.5 h-9 pl-4 pr-3 font-mono text-xs font-medium tracking-wider uppercase whitespace-nowrap transition-colors border";
export const dayChipInactive = "border-rule bg-paper-card text-ink-soft hover:border-accent-ink hover:text-ink";
export const dayChipActive = "border-accent-ink bg-accent-ink text-paper";

export const sessionList = "flex flex-col divide-y divide-rule";
export const sessionRow = "py-1";
export const sessionRowSummary =
  "list-none cursor-pointer flex flex-col gap-1.5 min-h-11 py-2.5 px-1 md:flex-row md:items-center md:gap-3 hover:bg-accent/5";
export const sessionRowTime = "font-mono text-xs text-ink-soft whitespace-nowrap";
export const sessionRowBody = "px-1 pb-4 pt-1";

export const quickAddForm = "flex flex-col gap-2.5 mt-2 pt-3 border-t border-rule";
export const quickAddRow = "flex flex-col gap-2.5 md:flex-row md:items-center";
export const quickAddMoreToggle =
  "font-mono text-xs text-ink-soft underline decoration-dotted w-fit hover:text-accent";

export const iconButton =
  "inline-flex items-center justify-center w-6 h-6 text-ink-soft border border-rule rounded-[2px] bg-paper-card hover:text-accent hover:border-accent transition-colors";
