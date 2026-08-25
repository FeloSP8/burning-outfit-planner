import React from "react";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { ALL_SLOTS, C } from "@/lib/pdf-theme";
import { EVENT_DAYS } from "@/lib/dj-lineups";
import { SET_INDEX, fromMinutes, pickedEntriesByDay, venueLabel } from "@/lib/dj-agenda";
import type { PlayaSnapshot } from "@/types/snapshot";

/**
 * El dossier de papel: todo lo que hay que consultar en el playa, impreso.
 *
 * Es el plan B de la versión offline. Un PDF en el móvil no depende de cuotas
 * de almacenamiento, ni de que Safari decida vaciar la caché, ni de que la app
 * arranque: si todo lo demás falla, esto sigue abriéndose.
 *
 * Las fotos son opcionales (`images`): el try-on de cada turno y las miniaturas
 * de las prendas, ya bajadas y encogidas por `pdf-images.ts`. Sin ellas el
 * dossier sale igual, solo que en texto.
 */

const s = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    color: C.text,
    fontSize: 8.5,
  },
  header: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: C.sandBorder,
    borderBottomStyle: "solid",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerTitle: { fontSize: 24, fontFamily: "Helvetica-Bold", color: C.brand },
  headerSub: { fontSize: 8, color: C.textLight, marginTop: 3 },
  headerDate: { fontSize: 8, color: C.textLight, textAlign: "right" },

  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: C.brand,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    borderBottomStyle: "solid",
  },
  dayTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: C.brandLight,
    marginTop: 8,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: C.divider,
    borderBottomStyle: "solid",
  },
  rowAlt: { backgroundColor: C.rowAlt },
  time: { width: "13%", fontFamily: "Helvetica-Bold", color: C.brand },
  what: { width: "37%" },
  where: { width: "30%", color: C.textMid },
  who: { width: "20%", color: C.textLight, textAlign: "right" },
  note: { color: C.textLight, fontSize: 7 },
  empty: { color: C.textLight, fontStyle: "italic", marginBottom: 4 },

  outfitBody: { flexDirection: "row", gap: 8, width: "87%" },
  tryOn: {
    width: 96,
    height: 128,
    objectFit: "cover",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.sandBorder,
    borderStyle: "solid",
  },
  thumbGrid: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 2 },
  thumbBox: { width: 54 },
  thumb: {
    width: 54,
    height: 54,
    objectFit: "cover",
    borderRadius: 3,
    borderWidth: 1,
    borderColor: C.divider,
    borderStyle: "solid",
  },
  thumbName: { fontSize: 6.5, color: C.textMid, marginTop: 1.5 },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 3, marginTop: 2 },
  chip: {
    backgroundColor: C.sandDark,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontSize: 7.5,
  },

  checkRow: { flexDirection: "row", paddingVertical: 2.5 },
  box: { width: "5%", fontFamily: "Helvetica-Bold" },
  checkText: { width: "62%" },
  checkMeta: { width: "33%", color: C.textLight, textAlign: "right", fontSize: 7.5 },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: C.divider,
    borderTopStyle: "solid",
    paddingTop: 6,
  },
  footerText: { fontSize: 7, color: C.textLight },
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function dayHeading(date: string): string {
  const day = EVENT_DAYS.find((d) => d.date === date);
  if (!day) return date;
  return `${day.weekday} ${day.short}${day.label ? ` · ${day.label}` : ""}`;
}

function Agenda({ picks }: { picks: PlayaSnapshot["picks"] }) {
  const days = pickedEntriesByDay(picks);

  if (days.length === 0) {
    return <Text style={s.empty}>Nadie ha marcado ningún set todavía.</Text>;
  }

  return (
    <>
      {days.map(({ day, entries }) => (
        <View key={day.date}>
          {/* minPresenceAhead: si no caben un par de sets debajo, el título se
              va con ellos a la página siguiente en vez de quedarse solo. */}
          <View minPresenceAhead={40}>
            <Text style={s.dayTitle}>{dayHeading(day.date)}</Text>
          </View>
          {entries.map((entry, i) => (
            <View key={entry.set.id} wrap={false} style={i % 2 === 1 ? [s.row, s.rowAlt] : s.row}>
              <Text style={s.time}>
                {fromMinutes(entry.window.start)}
                {entry.window.estimated ? <Text style={s.note}> aprox.</Text> : ""}
              </Text>
              <Text style={s.what}>
                {entry.set.label}
                {entry.set.live ? <Text style={s.note}> · live</Text> : ""}
              </Text>
              <Text style={s.where}>
                {venueLabel(entry.venue)}
                {"\n"}
                <Text style={s.note}>{entry.venue.location}</Text>
              </Text>
              <Text style={s.who}>{entry.fans.join(", ")}</Text>
            </View>
          ))}
        </View>
      ))}
    </>
  );
}

/** `url → data URI`, lo que devuelve `loadPdfImages`. */
export type PdfImages = Record<string, string>;

function Outfits({ days, images }: { days: PlayaSnapshot["days"]; images: PdfImages }) {
  const withOutfit = days.filter((d) => d.shifts.some((sh) => sh.outfit && sh.outfit.items.length > 0));
  if (withOutfit.length === 0) {
    return <Text style={s.empty}>Ningún outfit montado todavía.</Text>;
  }

  return (
    <>
      {withOutfit.map((day) => (
        <View key={day.id}>
          {/* Un día con fotos mide media página: si se mantuviera entero, un
              día que no cabe dejaría la anterior medio vacía. Lo que no se
              parte es cada turno. */}
          <View minPresenceAhead={150}>
            <Text style={s.dayTitle}>
              {dayHeading(day.date.slice(0, 10))}
              {day.label ? ` · ${day.label}` : ""}
            </Text>
          </View>
          {day.shifts.map((shift) => {
            const items = shift.outfit?.items ?? [];
            if (items.length === 0) return null;

            const tryOnUrl = shift.outfit?.tryOn?.imageUrl;
            const tryOn = tryOnUrl ? images[tryOnUrl] : undefined;
            const withPhoto = items.filter((item) => item.garment.photoUrl && images[item.garment.photoUrl]);
            // Las que no tienen foto siguen apareciendo, como etiqueta: un
            // outfit a medio fotografiar no puede salir a medias.
            const withoutPhoto = items.filter((item) => !withPhoto.includes(item));

            return (
              <View key={shift.id} wrap={false} style={s.row}>
                <Text style={s.time}>{shift.type === "TARDE" ? "Tarde" : "Noche"}</Text>
                <View style={s.outfitBody}>
                  {tryOn && <Image src={tryOn} style={s.tryOn} />}
                  <View style={{ flex: 1 }}>
                    {withPhoto.length > 0 && (
                      <View style={s.thumbGrid}>
                        {withPhoto.map((item) => (
                          <View key={item.id} style={s.thumbBox}>
                            <Image src={images[item.garment.photoUrl!]} style={s.thumb} />
                            <Text style={s.thumbName}>{item.garment.name}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {withoutPhoto.length > 0 && (
                      <View style={s.chipRow}>
                        {withoutPhoto.map((item) => (
                          <Text key={item.id} style={s.chip}>
                            {item.garment.name}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </>
  );
}

function Checklist({ items }: { items: PlayaSnapshot["checklist"] }) {
  const common = items.filter((i) => i.type === "COMMON");
  const individual = items.filter((i) => i.type === "INDIVIDUAL");

  const Block = ({ title, list }: { title: string; list: PlayaSnapshot["checklist"] }) =>
    list.length === 0 ? null : (
      <View>
        <Text style={s.dayTitle}>{title}</Text>
        {list.map((item) => (
          <View key={item.id} style={s.checkRow}>
            <Text style={s.box}>{item.done || item.iChecked ? "[x]" : "[ ]"}</Text>
            <Text style={s.checkText}>
              {item.text}
              {item.origin === "ALLI" ? <Text style={s.note}> · se compra allí</Text> : ""}
            </Text>
            <Text style={s.checkMeta}>
              {item.type === "COMMON"
                ? item.assigneeName ?? "sin asignar"
                : item.checkedBy.length > 0
                  ? item.checkedBy.join(", ")
                  : "—"}
            </Text>
          </View>
        ))}
      </View>
    );

  if (items.length === 0) return <Text style={s.empty}>La checklist está vacía.</Text>;

  return (
    <>
      <Block title="Comunes · basta con que uno lo traiga" list={common} />
      <Block title="Individuales · cada uno el suyo" list={individual} />
    </>
  );
}

function Inventory({ garments }: { garments: PlayaSnapshot["garments"] }) {
  if (garments.length === 0) return <Text style={s.empty}>El inventario está vacío.</Text>;

  return (
    <>
      {ALL_SLOTS.map((slot) => {
        const items = garments.filter((g) => g.slot === slot.key);
        if (items.length === 0) return null;
        return (
          <View key={slot.key}>
            <View minPresenceAhead={40}>
              <Text style={s.dayTitle}>
                {slot.label} · {items.length}
              </Text>
            </View>
            {items.map((g, i) => (
              <View key={g.id} style={i % 2 === 1 ? [s.row, s.rowAlt] : s.row}>
                <Text style={{ width: "60%" }}>{g.name}</Text>
                <Text style={{ width: "20%", color: C.textMid }}>{g.status.toLowerCase()}</Text>
                <Text style={{ width: "20%", color: C.textLight, textAlign: "right" }}>
                  {g.notes ?? ""}
                </Text>
              </View>
            ))}
          </View>
        );
      })}
    </>
  );
}

export function PlayaPDF({
  snapshot,
  generatedAt,
  images = {},
}: {
  snapshot: PlayaSnapshot;
  generatedAt: string;
  images?: PdfImages;
}) {
  const pickedCount = Object.keys(snapshot.picks).filter((id) => SET_INDEX[id]).length;

  return (
    <Document
      title="Dossier del playa"
      author="Burning Outfit Planner"
      subject="Agenda, outfits, checklist e inventario para Black Rock City"
    >
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <View>
            <Text style={s.headerTitle}>Dossier del playa</Text>
            <Text style={s.headerSub}>
              Burning Outfit Planner · {snapshot.userName} · Black Rock City 2026
            </Text>
          </View>
          <Text style={s.headerDate}>
            Generado el {generatedAt}
            {"\n"}
            {pickedCount} sets · {snapshot.garments.length} prendas ·{" "}
            {snapshot.checklist.length} tareas
          </Text>
        </View>

        <Section title="Agenda de música">
          <Agenda picks={snapshot.picks} />
        </Section>

        <Section title="Outfits por día">
          <Outfits days={snapshot.days} images={images} />
        </Section>

        <Section title="Checklist">
          <Checklist items={snapshot.checklist} />
        </Section>

        <Section title="Inventario">
          <Inventory garments={snapshot.garments} />
        </Section>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Horas marcadas «aprox.» son estimación nuestra, no del cartel.
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
