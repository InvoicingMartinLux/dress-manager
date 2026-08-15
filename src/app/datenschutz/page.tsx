import type { Metadata } from "next";
import Link from "next/link";
import { CONTROLLER, LEGAL_STAND, addressLines } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Datenschutzerklärung — Dress Manager",
  description: "Informationen zur Verarbeitung personenbezogener Daten nach Art. 13 DSGVO.",
};

/** Processors engaged under Art. 28 GDPR. */
const PROCESSORS = [
  {
    name: "Vercel Inc.",
    place: "USA / EU-Rechenzentren",
    purpose:
      "Hosting der Anwendung, Auslieferung der Seiten, Server-Logfiles sowie Speicherung der hochgeladenen Fotos (Vercel Blob).",
  },
  {
    name: "Neon Inc.",
    place: "USA / EU-Rechenzentren",
    purpose:
      "Betrieb der PostgreSQL-Datenbank mit Konto- und Kleidungsstückdaten.",
  },
  {
    name: "Anthropic PBC",
    place: "USA",
    purpose:
      "KI-gestützte Analyse hochgeladener Fotos zur Erkennung von Art, Farben, Muster, Formalität und Saison des Kleidungsstücks.",
  },
] as const;

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

export default function DatenschutzPage() {
  const { email, phone, datenschutzbeauftragter } = CONTROLLER;

  return (
    <div className="mx-auto max-w-[68ch]">
      <p className="label-caps text-ink-faint">Rechtliches</p>
      <h1 className="mt-1 text-[2.25rem] font-bold leading-tight tracking-tight">
        Datenschutzerklärung
      </h1>
      <p className="mt-2 text-ink-muted">Stand: {LEGAL_STAND}</p>

      <Section title="1. Verantwortlicher">
        <p>
          Verantwortlich für die Verarbeitung personenbezogener Daten im Sinne
          des Art. 4 Nr. 7 DSGVO ist:
        </p>
        <p className="whitespace-pre-line">{addressLines().join("\n")}</p>
        <p>
          E-Mail:{" "}
          <a href={`mailto:${email}`} className="text-accent hover:underline">
            {email}
          </a>
          {phone && <> · Telefon: {phone}</>}
        </p>
        {datenschutzbeauftragter ? (
          <p className="whitespace-pre-line">
            Datenschutzbeauftragter:{"\n"}
            {datenschutzbeauftragter}
          </p>
        ) : (
          <p>
            Ein Datenschutzbeauftragter ist nicht bestellt, da die
            Voraussetzungen des Art. 37 DSGVO bzw. § 38 BDSG nicht vorliegen.
          </p>
        )}
      </Section>

      <Section title="2. Ihre Rechte">
        <p>Sie haben jederzeit das Recht auf</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Auskunft über die zu Ihnen gespeicherten Daten (Art. 15 DSGVO),</li>
          <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO),</li>
          <li>Löschung Ihrer Daten (Art. 17 DSGVO),</li>
          <li>Einschränkung der Verarbeitung (Art. 18 DSGVO),</li>
          <li>Datenübertragbarkeit (Art. 20 DSGVO) sowie</li>
          <li>
            Widerspruch gegen Verarbeitungen, die auf einem berechtigten
            Interesse beruhen (Art. 21 DSGVO).
          </li>
        </ul>
        <p>
          Eine erteilte Einwilligung können Sie jederzeit mit Wirkung für die
          Zukunft widerrufen (Art. 7 Abs. 3 DSGVO). Unabhängig davon steht
          Ihnen ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde zu
          (Art. 77 DSGVO); zuständig ist die Behörde Ihres gewöhnlichen
          Aufenthaltsorts oder die des Verantwortlichen.
        </p>
        <p>
          Zur Ausübung dieser Rechte genügt eine formlose Nachricht an die oben
          genannte E-Mail-Adresse.
        </p>
      </Section>

      <Section title="3. Aufruf der Website und Server-Logfiles">
        <p>
          Beim Aufruf dieser Website werden durch unseren Hosting-Dienstleister
          technisch notwendige Daten verarbeitet, insbesondere IP-Adresse,
          Datum und Uhrzeit der Anfrage, aufgerufene Seite, übertragene
          Datenmenge, Referrer sowie Browser- und Betriebssystemangaben.
        </p>
        <p>
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes
          Interesse liegt im stabilen, sicheren Betrieb der Anwendung und in
          der Abwehr von Missbrauch. Diese Daten werden nicht mit anderen
          Datenquellen zusammengeführt.
        </p>
      </Section>

      <Section title="4. Nutzerkonto">
        <p>
          Für die Nutzung des Dienstes legen Sie ein Konto an. Dabei
          verarbeiten wir Ihren Namen, Ihre E-Mail-Adresse und Ihr Passwort.
          Das Passwort wird ausschließlich als kryptografischer Hash (bcrypt)
          gespeichert; die Klartextfassung ist uns zu keinem Zeitpunkt
          bekannt.
        </p>
        <p>
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, da die Verarbeitung
          zur Bereitstellung des von Ihnen angeforderten Dienstes erforderlich
          ist.
        </p>
      </Section>

      <Section title="5. Anmeldung (Session-Cookie)">
        <p>
          Nach der Anmeldung setzen wir ein Cookie, das ein signiertes Token
          zur Wiedererkennung Ihrer Sitzung enthält. Es ist als
          <code className="mx-1 font-mono text-sm">httpOnly</code>
          gesetzt, damit es nicht durch Skripte ausgelesen werden kann, und
          läuft nach 30 Tagen ab. Beim Abmelden wird es gelöscht.
        </p>
        <p>
          Dieses Cookie ist unbedingt erforderlich, damit Sie den Dienst nutzen
          können; die Speicherung ist daher nach § 25 Abs. 2 Nr. 2 TDDDG ohne
          Einwilligung zulässig. Rechtsgrundlage der anschließenden
          Verarbeitung ist Art. 6 Abs. 1 lit. b DSGVO.
        </p>
        <p>
          Wir setzen keine Cookies zu Analyse-, Tracking- oder Werbezwecken
          ein und binden keine Analysedienste, Social-Media-Plug-ins oder
          externen Schriftarten ein.
        </p>
      </Section>

      <Section title="6. Kleidungsstücke und hochgeladene Fotos">
        <p>
          Zu jedem erfassten Kleidungsstück speichern wir das von Ihnen
          hochgeladene Foto sowie die zugehörigen Angaben (Bezeichnung,
          Kategorie, Farben, Muster, Formalitätsgrad, Saison). Diese Daten
          sind Ihrem Konto zugeordnet und für andere Nutzerinnen und Nutzer
          innerhalb der Anwendung nicht einsehbar.
        </p>
        <p>
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Fotos werden vor dem
          Hochladen bereits in Ihrem Browser verkleinert, sodass nur die
          reduzierte Fassung übertragen wird.
        </p>
        <p>
          <strong className="text-ink">Hinweis zur Erreichbarkeit der Bilddateien:</strong>{" "}
          Die Fotos werden bei unserem Speicherdienstleister unter einer
          zufällig erzeugten, nicht öffentlich verzeichneten Adresse abgelegt.
          Diese Adresse ist nicht erratbar und wird nirgends veröffentlicht —
          wer sie jedoch kennt, kann die Datei ohne Anmeldung abrufen. Bitte
          laden Sie daher keine Fotos hoch, auf denen Personen erkennbar sind
          oder die weitere personenbezogene Informationen enthalten.
        </p>
      </Section>

      <Section title="7. KI-gestützte Analyse der Fotos">
        <p>
          Um die Eigenschaften eines Kleidungsstücks automatisch zu erkennen,
          übermitteln wir das hochgeladene Foto an Anthropic PBC und lassen es
          dort durch ein KI-Modell auswerten. Zurückgegeben werden
          ausschließlich beschreibende Angaben zum Kleidungsstück. Neben dem
          Bild werden keine Konto- oder Bestandsdaten übermittelt.
        </p>
        <p>
          Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, da diese
          Verarbeitung Teil der von Ihnen angeforderten Funktion ist. Möchten
          Sie die Analyse nicht nutzen, können Sie die Angaben zu jedem
          Kleidungsstück auch vollständig von Hand eintragen.
        </p>
        <p>
          Eine automatisierte Entscheidungsfindung im Sinne des Art. 22 DSGVO
          findet nicht statt: Die Analyse beschreibt Kleidungsstücke und
          entfaltet Ihnen gegenüber keine rechtliche Wirkung. Die
          Übereinstimmungsbewertung zwischen Kleidungsstücken erfolgt
          regelbasiert auf unserem Server, ohne Einsatz von KI.
        </p>
      </Section>

      <Section title="8. Empfänger und Auftragsverarbeiter">
        <p>
          Wir geben Ihre Daten nicht zu Werbezwecken weiter und verkaufen sie
          nicht. Zur Bereitstellung des Dienstes setzen wir folgende
          Dienstleister ein, mit denen Verträge zur Auftragsverarbeitung nach
          Art. 28 DSGVO bestehen:
        </p>
        <div className="mt-3 space-y-3">
          {PROCESSORS.map((p) => (
            <div key={p.name} className="card p-4">
              <p className="font-medium text-ink">{p.name}</p>
              <p className="mt-1 text-sm">{p.purpose}</p>
              <p className="mt-1 text-sm text-ink-faint">Sitz: {p.place}</p>
            </div>
          ))}
        </div>
        <p className="mt-3">
          Darüber hinaus geben wir Daten nur weiter, wenn wir gesetzlich dazu
          verpflichtet sind.
        </p>
      </Section>

      <Section title="9. Datenübermittlung in Drittländer">
        <p>
          Die vorgenannten Dienstleister haben ihren Sitz in den Vereinigten
          Staaten, sodass eine Verarbeitung außerhalb der EU bzw. des EWR nicht
          ausgeschlossen ist. Die Übermittlung wird auf die
          Standardvertragsklauseln der EU-Kommission nach Art. 46 Abs. 2 lit. c
          DSGVO gestützt, soweit sich der jeweilige Anbieter nicht auf den
          Angemessenheitsbeschluss der EU-Kommission zum EU-U.S. Data Privacy
          Framework vom 10. Juli 2023 stützen kann.
        </p>
        <p>
          Trotz dieser Garantien lässt sich nicht vollständig ausschließen,
          dass US-Behörden auf übermittelte Daten zugreifen.
        </p>
      </Section>

      <Section title="10. Speicherdauer">
        <p>
          Konto-, Kleidungsstück- und Bilddaten speichern wir, solange Ihr
          Konto besteht. Löschen Sie ein Kleidungsstück, werden der zugehörige
          Datenbankeintrag und die Bilddatei entfernt. Auf Ihre Anfrage hin
          löschen wir Ihr Konto samt aller zugehörigen Daten.
        </p>
        <p>
          Server-Logfiles werden von unserem Hosting-Dienstleister nur
          kurzfristig vorgehalten. Gesetzliche Aufbewahrungspflichten bleiben
          unberührt.
        </p>
      </Section>

      <Section title="11. Datensicherheit">
        <p>
          Die Übertragung erfolgt ausschließlich verschlüsselt über
          HTTPS/TLS. Passwörter werden ausschließlich gehasht gespeichert,
          Sitzungstoken werden kryptografisch signiert. Wir treffen darüber
          hinaus angemessene technische und organisatorische Maßnahmen nach
          Art. 32 DSGVO.
        </p>
      </Section>

      <Section title="12. Änderungen dieser Datenschutzerklärung">
        <p>
          Wir passen diese Erklärung an, wenn sich die Anwendung oder die
          Rechtslage ändert. Es gilt jeweils die auf dieser Seite
          veröffentlichte Fassung.
        </p>
        <p>
          Die Anbieterkennzeichnung finden Sie im{" "}
          <Link href="/impressum" className="text-accent hover:underline">
            Impressum
          </Link>
          .
        </p>
      </Section>
    </div>
  );
}
