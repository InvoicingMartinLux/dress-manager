/**
 * ─────────────────────────────────────────────────────────────────────────
 *  FILL THIS IN. Every "«…»" value below is a placeholder.
 *
 *  Shared by the Impressum and the Datenschutzerklärung, so the controller's
 *  details are defined once. § 5 DDG requires a real name and a physical
 *  address — a P.O. box is not sufficient — plus a means of fast electronic
 *  contact.
 *
 *  Optional fields are null; each one omits its own section rather than
 *  rendering an empty row.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const CONTROLLER = {
  /** Private individual, or the company name including its legal form. */
  name: "«Vor- und Nachname»",
  /** Companies only, e.g. "Vertreten durch: Max Mustermann". */
  vertretenDurch: null as string | null,
  street: "«Straße und Hausnummer»",
  postalCode: "«PLZ»",
  city: "«Ort»",
  country: "Deutschland",

  email: "«E-Mail-Adresse»",
  /** Optional under § 5 DDG where another fast electronic channel exists. */
  phone: null as string | null,

  /** e.g. "Amtsgericht «Ort», HRB «Nummer»" — omit if not registered. */
  registereintrag: null as string | null,
  /** USt-IdNr. nach § 27a UStG — omit if not VAT registered. */
  umsatzsteuerId: null as string | null,
  /** Supervisory authority, where the activity requires authorisation. */
  aufsichtsbehoerde: null as string | null,
  /** § 18 Abs. 2 MStV — only for journalistic-editorial content. */
  inhaltlichVerantwortlich: null as string | null,

  /**
   * A data protection officer is only mandatory where at least 20 people are
   * regularly engaged in automated processing (§ 38 BDSG) or under
   * Art. 37 GDPR. Set to null when none is appointed.
   */
  datenschutzbeauftragter: null as string | null,
} as const;

/** Shown as the "Stand" of the privacy policy. Update when it changes. */
export const LEGAL_STAND = "August 2026";

/** Postal address as a single block. */
export function addressLines(): string[] {
  return [
    CONTROLLER.name,
    CONTROLLER.vertretenDurch,
    CONTROLLER.street,
    `${CONTROLLER.postalCode} ${CONTROLLER.city}`,
    CONTROLLER.country,
  ].filter((line): line is string => Boolean(line));
}
