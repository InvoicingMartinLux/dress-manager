import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum — Dress Manager",
  description: "Anbieterkennzeichnung gemäß § 5 DDG.",
};

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  FILL THIS IN. Every "«…»" value below is a placeholder.
 *
 *  Required by § 5 DDG: real name, a physical address (a P.O. box is not
 *  sufficient), and a means of fast electronic contact. Set optional fields
 *  to null and their section disappears.
 * ─────────────────────────────────────────────────────────────────────────
 */
const IMPRESSUM = {
  /** Private individual, or the company name including its legal form. */
  name: "«Vor- und Nachname»",
  /** Only for companies, e.g. "Vertreten durch: Max Mustermann". */
  vertretenDurch: null as string | null,
  street: "«Straße und Hausnummer»",
  postalCode: "«PLZ»",
  city: "«Ort»",
  country: "Deutschland",

  email: "«E-Mail-Adresse»",
  /** Optional under § 5 DDG if another fast electronic channel exists. */
  phone: null as string | null,

  /** e.g. "Amtsgericht «Ort», HRB «Nummer»" — omit if not registered. */
  registereintrag: null as string | null,
  /** USt-IdNr. nach § 27a UStG — omit if not VAT registered. */
  umsatzsteuerId: null as string | null,
  /** Supervisory authority, if the activity requires authorisation. */
  aufsichtsbehoerde: null as string | null,

  /**
   * § 18 Abs. 2 MStV — only required for journalistic-editorial content.
   * Usually the same person and address as above.
   */
  inhaltlichVerantwortlich: null as string | null,
} as const;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-[1.5rem] font-bold tracking-tight">{title}</h2>
      <div className="mt-2 space-y-2 text-ink-muted">{children}</div>
    </section>
  );
}

export default function ImpressumPage() {
  const {
    name,
    vertretenDurch,
    street,
    postalCode,
    city,
    country,
    email,
    phone,
    registereintrag,
    umsatzsteuerId,
    aufsichtsbehoerde,
    inhaltlichVerantwortlich,
  } = IMPRESSUM;

  return (
    <div className="mx-auto max-w-[68ch]">
      <p className="label-caps text-ink-faint">Rechtliches</p>
      <h1 className="mt-1 text-[2.25rem] font-bold leading-tight tracking-tight">
        Impressum
      </h1>

      <Section title="Angaben gemäß § 5 DDG">
        <p className="whitespace-pre-line">
          {[name, vertretenDurch, street, `${postalCode} ${city}`, country]
            .filter(Boolean)
            .join("\n")}
        </p>
      </Section>

      <Section title="Kontakt">
        <p>
          E-Mail:{" "}
          <a href={`mailto:${email}`} className="text-accent hover:underline">
            {email}
          </a>
        </p>
        {phone && <p>Telefon: {phone}</p>}
      </Section>

      {registereintrag && (
        <Section title="Registereintrag">
          <p className="whitespace-pre-line">{registereintrag}</p>
        </Section>
      )}

      {umsatzsteuerId && (
        <Section title="Umsatzsteuer-Identifikationsnummer">
          <p>
            Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:{" "}
            {umsatzsteuerId}
          </p>
        </Section>
      )}

      {aufsichtsbehoerde && (
        <Section title="Aufsichtsbehörde">
          <p className="whitespace-pre-line">{aufsichtsbehoerde}</p>
        </Section>
      )}

      {inhaltlichVerantwortlich && (
        <Section title="Redaktionell verantwortlich">
          <p className="whitespace-pre-line">
            Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV:
            {"\n"}
            {inhaltlichVerantwortlich}
          </p>
        </Section>
      )}

      <Section title="Verbraucherstreitbeilegung">
        <p>
          Wir sind nicht bereit und nicht verpflichtet, an
          Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
          teilzunehmen.
        </p>
      </Section>

      <Section title="Haftung für Inhalte">
        <p>
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte
          auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach
          §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht
          verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
          überwachen oder nach Umständen zu forschen, die auf eine
          rechtswidrige Tätigkeit hinweisen.
        </p>
        <p>
          Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
          Informationen nach den allgemeinen Gesetzen bleiben hiervon
          unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem
          Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
          Bekanntwerden entsprechender Rechtsverletzungen werden wir diese
          Inhalte umgehend entfernen.
        </p>
      </Section>

      <Section title="Haftung für Links">
        <p>
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren
          Inhalte wir keinen Einfluss haben. Deshalb können wir für diese
          fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
          verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
          Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der
          Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige
          Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
        </p>
        <p>
          Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist
          jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht
          zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir
          derartige Links umgehend entfernen.
        </p>
      </Section>

      <Section title="Urheberrecht">
        <p>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen
          Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung,
          Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
          Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des
          jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite
          sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
        </p>
        <p>
          Von Nutzerinnen und Nutzern hochgeladene Fotos verbleiben im
          Eigentum der jeweiligen Person und werden ausschließlich zur
          Bereitstellung des Dienstes verarbeitet.
        </p>
      </Section>
    </div>
  );
}
