import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Link,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Garment } from "@/types";

// ── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  brand:      "#7a2e08",
  brandLight: "#c84a10",
  sand:       "#fdf4e0",
  sandDark:   "#f5e8cc",
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
  purple:     "#3a1878",
  purpleBg:   "#f0eaff",
  white:      "#ffffff",
  divider:    "#e8d5b0",
};

// ── Estilos ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    paddingTop: 48,
    paddingBottom: 52,
    paddingHorizontal: 44,
    fontFamily: "Helvetica",
    color: C.text,
  },

  // Cabecera
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: C.sandBorder,
    borderBottomStyle: "solid",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerLeft: { flexDirection: "column", gap: 2 },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: C.brand,
    letterSpacing: -0.5,
  },
  headerSub: { fontSize: 9, color: C.textLight, marginTop: 3 },
  headerDate: { fontSize: 8, color: C.textLight, textAlign: "right" },

  // Resumen global
  summaryBox: {
    backgroundColor: C.sandDark,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.sandBorder,
    borderStyle: "solid",
    padding: 14,
    marginBottom: 22,
    flexDirection: "row",
    gap: 0,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  summaryItemBorder: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
    borderLeftWidth: 1,
    borderLeftColor: C.sandBorder,
    borderLeftStyle: "solid",
  },
  summaryValue: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: C.brand,
  },
  summaryLabel: {
    fontSize: 7.5,
    color: C.textLight,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  // Sección por categoría
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: C.brand,
    letterSpacing: 0.2,
  },
  sectionBadge: {
    backgroundColor: C.sandDark,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sectionBadgeText: {
    fontSize: 7.5,
    color: C.textMid,
    fontFamily: "Helvetica-Bold",
  },
  sectionSubtotal: {
    marginLeft: "auto",
    fontSize: 8,
    color: C.textLight,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    borderBottomStyle: "solid",
    marginBottom: 8,
  },

  // Tabla
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.sandDark,
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    borderBottomStyle: "solid",
    alignItems: "flex-start",
  },
  tableRowAlt: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
    borderBottomStyle: "solid",
    backgroundColor: "#faf6ec",
    alignItems: "flex-start",
  },
  colName:   { width: "30%", paddingRight: 6 },
  colStatus: { width: "14%", paddingRight: 6 },
  colPrice:  { width: "12%", paddingRight: 6, textAlign: "right" },
  colNotes:  { width: "26%", paddingRight: 6 },
  colLink:   { width: "18%" },

  thText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.textLight,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tdName: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.text,
  },
  tdText: {
    fontSize: 8,
    color: C.textMid,
  },
  tdPrice: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.green,
    textAlign: "right",
  },
  tdPriceDash: {
    fontSize: 8,
    color: C.textLight,
    textAlign: "right",
  },
  tdNotes: {
    fontSize: 7.5,
    color: C.textMid,
    lineHeight: 1.4,
  },

  // Badges de estado
  badgePendiente: {
    backgroundColor: C.amberBg,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  badgeComprado: {
    backgroundColor: C.greenBg,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  badgeRecibido: {
    backgroundColor: C.skyBg,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  // Separador sección bici
  bikeDivider: {
    borderTopWidth: 1,
    borderTopColor: C.sandBorder,
    borderTopStyle: "dashed",
    marginTop: 24,
    marginBottom: 6,
    paddingTop: 10,
  },
  bikeDividerLabel: {
    fontSize: 7,
    color: C.textLight,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  // Pie de página
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: C.divider,
    borderTopStyle: "solid",
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: C.textLight },
  footerPage: { fontSize: 7, color: C.textLight },

  // Link
  linkText: {
    fontSize: 7.5,
    color: C.brandLight,
    textDecoration: "underline",
  },
  noLink: { fontSize: 7.5, color: C.textLight },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  COMPRADO:  "Comprado",
  RECIBIDO:  "Recibido",
};

function StatusBadge({ status }: { status: string }) {
  const style =
    status === "COMPRADO"  ? s.badgeComprado  :
    status === "RECIBIDO"  ? s.badgeRecibido  :
                             s.badgePendiente;
  const color =
    status === "COMPRADO"  ? C.green  :
    status === "RECIBIDO"  ? C.sky    :
                             C.amber;
  return (
    <View style={style}>
      <Text style={[s.badgeText, { color }]}>{STATUS_LABELS[status] ?? status}</Text>
    </View>
  );
}

const ALL_SLOTS: { key: string; label: string; isBike?: boolean }[] = [
  { key: "TOP",            label: "Parte de arriba" },
  { key: "BOTTOM",         label: "Parte de abajo" },
  { key: "SHOES",          label: "Calzado" },
  { key: "ACCESSORY",      label: "Accesorios" },
  { key: "COAT",           label: "Abrigos" },
  { key: "BIKE_ACCESSORY", label: "Accesorios bici", isBike: true },
];

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

function formatPrice(p: number | null | undefined) {
  if (p == null) return null;
  return p.toFixed(2).replace(".", ",") + " €";
}

// ── Tabla de una categoría ────────────────────────────────────────────────────
function CategoryTable({ items }: { items: Garment[] }) {
  const subtotal = items.reduce((s, g) => s + (g.price ?? 0), 0);
  const hasAnyPrice = items.some((g) => g.price != null);

  return (
    <>
      {/* Cabecera columnas */}
      <View style={s.tableHeader}>
        <Text style={[s.thText, s.colName]}>Nombre</Text>
        <Text style={[s.thText, s.colStatus]}>Estado</Text>
        <Text style={[s.thText, s.colPrice]}>Precio</Text>
        <Text style={[s.thText, s.colNotes]}>Notas</Text>
        <Text style={[s.thText, s.colLink]}>Enlace</Text>
      </View>

      {items.map((g, i) => (
        <View key={g.id} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt} wrap={false}>
          <View style={s.colName}>
            <Text style={s.tdName}>{truncate(g.name, 40)}</Text>
          </View>
          <View style={s.colStatus}>
            <StatusBadge status={g.status} />
          </View>
          <View style={s.colPrice}>
            {g.price != null
              ? <Text style={s.tdPrice}>{formatPrice(g.price)}</Text>
              : <Text style={s.tdPriceDash}>—</Text>
            }
          </View>
          <View style={s.colNotes}>
            <Text style={s.tdNotes}>
              {g.notes ? truncate(g.notes, 80) : ""}
            </Text>
          </View>
          <View style={s.colLink}>
            {g.purchaseUrl ? (
              <Link src={g.purchaseUrl} style={s.linkText}>
                {truncate(g.purchaseUrl.replace(/^https?:\/\/(www\.)?/, ""), 30)}
              </Link>
            ) : (
              <Text style={s.noLink}>—</Text>
            )}
          </View>
        </View>
      ))}

      {/* Subtotal de categoría si hay precios */}
      {hasAnyPrice && (
        <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingTop: 5, paddingRight: 8 }}>
          <Text style={{ fontSize: 8, color: C.textLight, marginRight: 4 }}>Subtotal:</Text>
          <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: C.green }}>
            {formatPrice(subtotal)}
          </Text>
        </View>
      )}
    </>
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

  const totalPrice  = garments.reduce((s, g) => s + (g.price ?? 0), 0);
  const priceKnown  = garments.filter((g) => g.price != null).length;
  const comprados   = garments.filter((g) => g.status === "COMPRADO").length;
  const recibidos   = garments.filter((g) => g.status === "RECIBIDO").length;
  const pendientes  = garments.filter((g) => g.status === "PENDIENTE").length;

  const outfitSlots = ALL_SLOTS.filter((s) => !s.isBike);
  const bikeSlots   = ALL_SLOTS.filter((s) => s.isBike);

  return (
    <Document
      title="Inventario de prendas"
      author="Burning Outfit Planner"
      subject="Inventario completo"
    >
      <Page size="A4" style={s.page}>
        {/* ── Cabecera ── */}
        <View style={s.header} fixed>
          <View style={s.headerLeft}>
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
            <Text style={[s.summaryValue, { color: C.green }]}>
              {totalPrice > 0 ? formatPrice(totalPrice) : "—"}
            </Text>
            <Text style={s.summaryLabel}>
              Precio total{priceKnown < garments.length ? ` (${priceKnown} con precio)` : ""}
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

        {/* ── Secciones de ropa (outfits) ── */}
        {outfitSlots.map(({ key, label }) => {
          const items = bySlot[key] ?? [];
          if (items.length === 0) return null;
          return (
            <View key={key}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>{label}</Text>
                <View style={s.sectionBadge}>
                  <Text style={s.sectionBadgeText}>{items.length}</Text>
                </View>
                {items.some((g) => g.price != null) && (
                  <Text style={s.sectionSubtotal}>
                    {formatPrice(items.reduce((s, g) => s + (g.price ?? 0), 0))}
                  </Text>
                )}
              </View>
              <CategoryTable items={items} />
            </View>
          );
        })}

        {/* ── Sección bici ── */}
        {(bySlot["BIKE_ACCESSORY"] ?? []).length > 0 && (
          <View style={s.bikeDivider}>
            <Text style={s.bikeDividerLabel}>Accesorios bici · no aparecen en outfits</Text>
            {bikeSlots.map(({ key, label }) => {
              const items = bySlot[key] ?? [];
              if (items.length === 0) return null;
              return (
                <View key={key}>
                  <View style={s.sectionHeader}>
                    <Text style={s.sectionTitle}>{label}</Text>
                    <View style={s.sectionBadge}>
                      <Text style={s.sectionBadgeText}>{items.length}</Text>
                    </View>
                  </View>
                  <CategoryTable items={items} />
                </View>
              );
            })}
          </View>
        )}

        {/* ── Pie de página ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Burning Outfit Planner</Text>
          <Text
            style={s.footerPage}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
