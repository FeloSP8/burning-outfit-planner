import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Link,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Garment } from "@/types";

// ── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  brand:      "#7a2e08",
  brandLight: "#c84a10",
  sand:       "#fdf4e0",
  sandDark:   "#f0e4c0",
  sandBorder: "#c4906a",
  text:       "#2a1a08",
  textMid:    "#7a5030",
  textLight:  "#a07040",
  green:      "#1a6a28",
  greenBg:    "#e6f4ea",
  amber:      "#92400e",
  amberBg:    "#fffbeb",
  sky:        "#075985",
  skyBg:      "#e0f2fe",
  white:      "#ffffff",
  rowAlt:     "#faf6ec",
  divider:    "#e8d5b0",
};

// ── Anchos de columna (puntos, página A4 = 595 - 88 padding = 507 útiles) ────
// Nombre 30% · Estado 15% · Precio 11% · Notas 20% · Enlace 24%
const COL = {
  name:   "30%",
  status: "15%",
  price:  "11%",
  notes:  "20%",
  link:   "24%",
};

// ── Estilos ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    paddingTop: 44,
    paddingBottom: 52,
    paddingHorizontal: 44,
    fontFamily: "Helvetica",
    color: C.text,
    fontSize: 8,
  },

  // ── Cabecera ──
  header: {
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: C.sandBorder,
    borderBottomStyle: "solid",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: C.brand,
  },
  headerSub: {
    fontSize: 8,
    color: C.textLight,
    marginTop: 3,
  },
  headerDate: {
    fontSize: 8,
    color: C.textLight,
  },

  // ── Resumen ──
  summaryBox: {
    backgroundColor: C.sandDark,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.sandBorder,
    borderStyle: "solid",
    paddingVertical: 12,
    paddingHorizontal: 0,
    marginBottom: 20,
    flexDirection: "row",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 6,
  },
  summaryItemBorder: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 6,
    borderLeftWidth: 1,
    borderLeftColor: C.sandBorder,
    borderLeftStyle: "solid",
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: C.brand,
  },
  summaryValueGreen: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: C.green,
  },
  summaryLabel: {
    fontSize: 7,
    color: C.textLight,
    marginTop: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },

  // ── Sección ──
  sectionWrap: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.brand,
  },
  sectionBadge: {
    marginLeft: 6,
    backgroundColor: C.sandDark,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  sectionBadgeText: {
    fontSize: 7,
    color: C.textMid,
    fontFamily: "Helvetica-Bold",
  },
  sectionSubtotal: {
    marginLeft: "auto",
    fontSize: 8,
    color: C.textLight,
  },

  // ── Tabla ──
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.sandDark,
    borderRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: 7,
    marginBottom: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 7,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    borderBottomStyle: "solid",
    alignItems: "flex-start",
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 7,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    borderBottomStyle: "solid",
    backgroundColor: C.rowAlt,
    alignItems: "flex-start",
  },

  thText: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: C.textLight,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tdName: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.text,
  },
  tdMuted: {
    fontSize: 7.5,
    color: C.textMid,
  },
  tdPrice: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.green,
  },
  tdPriceDash: {
    fontSize: 8,
    color: C.textLight,
  },
  tdNotes: {
    fontSize: 7,
    color: C.textMid,
    lineHeight: 1.4,
  },
  tdLink: {
    fontSize: 6.5,
    color: C.brandLight,
    textDecoration: "underline",
  },
  tdNoLink: {
    fontSize: 7,
    color: C.textLight,
  },

  // ── Badges estado ──
  badge: {
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  // ── Subtotal fila ──
  subtotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 4,
    paddingRight: 7,
    paddingBottom: 2,
  },
  subtotalLabel: { fontSize: 7.5, color: C.textLight, marginRight: 4 },
  subtotalValue: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.green },

  // ── Separador bici ──
  bikeSeparator: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: C.sandBorder,
    borderTopStyle: "dashed",
    paddingTop: 10,
  },
  bikeSeparatorLabel: {
    fontSize: 7,
    color: C.textLight,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },

  // ── Pie ──
  footer: {
    position: "absolute",
    bottom: 22,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: C.divider,
    borderTopStyle: "solid",
    paddingTop: 6,
  },
  footerText: { fontSize: 7, color: C.textLight },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  PENDIENTE: { label: "Pendiente", bg: C.amberBg, color: C.amber },
  COMPRADO:  { label: "Comprado",  bg: C.greenBg, color: C.green },
  RECIBIDO:  { label: "Recibido",  bg: C.skyBg,   color: C.sky   },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label: status, bg: C.sandDark, color: C.textMid };
  return (
    <View style={[s.badge, { backgroundColor: m.bg }]}>
      <Text style={[s.badgeText, { color: m.color }]}>{m.label}</Text>
    </View>
  );
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

function formatPrice(p: number) {
  return p.toFixed(2).replace(".", ",") + " €";
}

const ALL_SLOTS: { key: string; label: string; isBike?: boolean }[] = [
  { key: "TOP",            label: "Parte de arriba" },
  { key: "BOTTOM",         label: "Parte de abajo" },
  { key: "SHOES",          label: "Calzado" },
  { key: "ACCESSORY",      label: "Accesorios" },
  { key: "COAT",           label: "Abrigos" },
  { key: "BIKE_ACCESSORY", label: "Accesorios bici", isBike: true },
];

// ── Tabla de una categoría ────────────────────────────────────────────────────
function CategoryTable({ items }: { items: Garment[] }) {
  const subtotal   = items.reduce((acc, g) => acc + (g.price ?? 0), 0);
  const hasPrice   = items.some((g) => g.price != null);

  return (
    <>
      {/* Cabecera columnas */}
      <View style={s.tableHeader}>
        <Text style={[s.thText, { width: COL.name }]}>Nombre</Text>
        <Text style={[s.thText, { width: COL.status }]}>Estado</Text>
        <Text style={[s.thText, { width: COL.price, textAlign: "right" }]}>Precio</Text>
        <Text style={[s.thText, { width: COL.notes, paddingLeft: 6 }]}>Notas</Text>
        <Text style={[s.thText, { width: COL.link }]}>Enlace</Text>
      </View>

      {items.map((g, i) => (
        <View
          key={g.id}
          style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}
          wrap={false}
        >
          {/* Nombre */}
          <View style={{ width: COL.name, paddingRight: 4 }}>
            <Text style={s.tdName}>{truncate(g.name, 38)}</Text>
          </View>

          {/* Estado */}
          <View style={{ width: COL.status, paddingRight: 4 }}>
            <StatusBadge status={g.status} />
          </View>

          {/* Precio */}
          <View style={{ width: COL.price, paddingRight: 4, alignItems: "flex-end" }}>
            {g.price != null
              ? <Text style={s.tdPrice}>{formatPrice(g.price)}</Text>
              : <Text style={s.tdPriceDash}>—</Text>
            }
          </View>

          {/* Notas */}
          <View style={{ width: COL.notes, paddingHorizontal: 6 }}>
            <Text style={s.tdNotes}>{g.notes ? truncate(g.notes, 70) : ""}</Text>
          </View>

          {/* Enlace */}
          <View style={{ width: COL.link }}>
            {g.purchaseUrl ? (
              <Link src={g.purchaseUrl} style={s.tdLink}>
                {truncate(g.purchaseUrl.replace(/^https?:\/\/(www\.)?/, ""), 40)}
              </Link>
            ) : (
              <Text style={s.tdNoLink}>—</Text>
            )}
          </View>
        </View>
      ))}

      {/* Subtotal */}
      {hasPrice && (
        <View style={s.subtotalRow}>
          <Text style={s.subtotalLabel}>Subtotal:</Text>
          <Text style={s.subtotalValue}>{formatPrice(subtotal)}</Text>
        </View>
      )}
    </>
  );
}

// ── Sección completa ──────────────────────────────────────────────────────────
function SlotSection({ slot, items }: { slot: { key: string; label: string }; items: Garment[] }) {
  const subtotal  = items.reduce((acc, g) => acc + (g.price ?? 0), 0);
  const hasPrice  = items.some((g) => g.price != null);

  return (
    <View style={s.sectionWrap}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>{slot.label}</Text>
        <View style={s.sectionBadge}>
          <Text style={s.sectionBadgeText}>{items.length}</Text>
        </View>
        {hasPrice && (
          <Text style={s.sectionSubtotal}>{formatPrice(subtotal)}</Text>
        )}
      </View>
      <CategoryTable items={items} />
    </View>
  );
}

// ── Documento principal ───────────────────────────────────────────────────────
export function InventoryPDF({
  garments,
  generatedAt,
}: {
  garments: Garment[];
  generatedAt: string;
}) {
  const bySlot = garments.reduce<Record<string, Garment[]>>((acc, g) => {
    if (!acc[g.slot]) acc[g.slot] = [];
    acc[g.slot].push(g);
    return acc;
  }, {});

  const totalPrice  = garments.reduce((acc, g) => acc + (g.price ?? 0), 0);
  const priceKnown  = garments.filter((g) => g.price != null).length;
  const comprados   = garments.filter((g) => g.status === "COMPRADO").length;
  const recibidos   = garments.filter((g) => g.status === "RECIBIDO").length;
  const pendientes  = garments.filter((g) => g.status === "PENDIENTE").length;

  const outfitSlots = ALL_SLOTS.filter((s) => !s.isBike);
  const bikeSlots   = ALL_SLOTS.filter((s) => s.isBike);
  const hasBike     = (bySlot["BIKE_ACCESSORY"] ?? []).length > 0;

  return (
    <Document
      title="Inventario de prendas"
      author="Burning Outfit Planner"
      subject="Inventario completo"
    >
      <Page size="A4" style={s.page}>

        {/* ── Cabecera ── */}
        <View style={s.header} fixed>
          <View>
            <Text style={s.headerTitle}>Inventario de prendas</Text>
            <Text style={s.headerSub}>Burning Outfit Planner</Text>
          </View>
          <Text style={s.headerDate}>Generado el {generatedAt}</Text>
        </View>

        {/* ── Resumen global ── */}
        <View style={s.summaryBox}>
          <View style={s.summaryItem}>
            <Text style={s.summaryValue}>{garments.length}</Text>
            <Text style={s.summaryLabel}>Total prendas</Text>
          </View>
          <View style={s.summaryItemBorder}>
            <Text style={s.summaryValueGreen}>
              {priceKnown > 0 ? formatPrice(totalPrice) : "—"}
            </Text>
            <Text style={s.summaryLabel}>
              Precio total{priceKnown < garments.length && priceKnown > 0
                ? `\n(${priceKnown} de ${garments.length} con precio)`
                : ""}
            </Text>
          </View>
          <View style={s.summaryItemBorder}>
            <Text style={[s.summaryValue, { color: C.green, fontSize: 16 }]}>{comprados}</Text>
            <Text style={s.summaryLabel}>Comprados</Text>
          </View>
          <View style={s.summaryItemBorder}>
            <Text style={[s.summaryValue, { color: C.sky, fontSize: 16 }]}>{recibidos}</Text>
            <Text style={s.summaryLabel}>Recibidos</Text>
          </View>
          <View style={s.summaryItemBorder}>
            <Text style={[s.summaryValue, { color: C.amber, fontSize: 16 }]}>{pendientes}</Text>
            <Text style={s.summaryLabel}>Pendientes</Text>
          </View>
        </View>

        {/* ── Prendas por categoría ── */}
        {outfitSlots.map((slot) => {
          const items = bySlot[slot.key] ?? [];
          if (items.length === 0) return null;
          return <SlotSection key={slot.key} slot={slot} items={items} />;
        })}

        {/* ── Accesorios bici ── */}
        {hasBike && (
          <View style={s.bikeSeparator}>
            <Text style={s.bikeSeparatorLabel}>Accesorios bici · no aparecen en outfits</Text>
            {bikeSlots.map((slot) => {
              const items = bySlot[slot.key] ?? [];
              if (items.length === 0) return null;
              return <SlotSection key={slot.key} slot={slot} items={items} />;
            })}
          </View>
        )}

        {/* ── Pie de página ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Burning Outfit Planner</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>

      </Page>
    </Document>
  );
}
