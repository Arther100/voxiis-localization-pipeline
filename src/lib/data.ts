

export interface TranslationInput {
  key: string;
  comment: string;
  source: string;
}

export interface ScoringInput {
  key: string;
  source: string;
  existingTranslation: string;
}

export const PART1_STRINGS: TranslationInput[] = [
  {
    key: "ticket.button.open",
    comment: "Button an agent clicks to open a closed support ticket back up",
    source: "Open",
  },
  {
    key: "settings.hours.status_label_open",
    comment: "Label shown when the support desk is currently open for business",
    source: "Open",
  },
  {
    key: "ticket.button.close",
    comment: "Button an agent clicks to mark a ticket as resolved/closed",
    source: "Close",
  },
  {
    key: "feed.button.post",
    comment: "Button to publish a new post to the internal team feed",
    source: "Post",
  },
  {
    key: "mail.label.post",
    comment: "Label for a physical mail correspondence address field",
    source: "Post",
  },
  {
    key: "ticket.button.assign",
    comment: "Button to assign a ticket to a specific agent",
    source: "Assign",
  },
  {
    key: "ticket.field.due",
    comment: "Field showing the due date/deadline for resolving a ticket",
    source: "Due",
  },
  {
    key: "invoice.field.amount_due",
    comment: "Field showing the amount of money owed on an invoice",
    source: "Due",
  },
  {
    key: "ticket.button.share",
    comment: "Button to share a ticket's link with another teammate",
    source: "Share",
  },
  {
    key: "report.button.export",
    comment: "Button to export a report as a CSV or PDF file",
    source: "Export",
  },
];

export const PART2_STRINGS: ScoringInput[] = [
  { key: "ticket.button.open", source: "Open", existingTranslation: "Abierto" },
  { key: "ticket.button.close", source: "Close", existingTranslation: "Cerrar" },
  { key: "invoice.field.amount_due", source: "Due", existingTranslation: "Vencido" },
  { key: "ticket.field.due", source: "Due", existingTranslation: "Vencimiento" },
  { key: "ticket.button.assign", source: "Assign", existingTranslation: "Asignar" },
  { key: "ticket.button.share", source: "Share", existingTranslation: "Compartir" },
  { key: "feed.button.post", source: "Post", existingTranslation: "Correo" },
  { key: "report.button.export", source: "Export", existingTranslation: "Exportar" },
];

export function getCommentForKey(key: string): string {
  const match = PART1_STRINGS.find((s) => s.key === key);
  return match?.comment ?? "No additional context available for this key.";
}
