"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/sheets.ts
var sheets_exports = {};
__export(sheets_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(sheets_exports);
var SHEET_ID = process.env.GOOGLE_SHEET_ID ?? "14cre1M0kuiEASpBeDqln5a8gC-mgeC7ewE7KqqRUorA";
var API_KEY = process.env.GOOGLE_API_KEY ?? "";
function parseMoney(val) {
  if (!val) return 0;
  return parseFloat(String(val).replace(/[$,\s]/g, "")) || 0;
}
async function fetchSheet(range) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Sheets error ${res.status}: ${text}`);
  }
  const json = await res.json();
  return json.values ?? [];
}
function parseTransactions(rows) {
  return rows.slice(1).filter((r) => r.length > 0 && r[0]).map((r) => ({
    fecha: r[0] ?? "",
    mes: r[1] ?? "",
    semana: parseInt(r[2] ?? "0") || 0,
    udn: r[3] ?? "",
    producto: r[4] ?? "",
    categoria: r[5] ?? "",
    area: r[6] ?? "",
    cantidad: parseFloat(r[7] ?? "0") || 0,
    costoUnitario: parseMoney(r[8]),
    total: parseMoney(r[9]),
    notas: r[10]
  }));
}
function parseFinancials(rows) {
  return rows.slice(1).filter((r) => r.length > 0 && r[0]).map((r) => ({
    mes: r[0] ?? "",
    udn: r[1] ?? "",
    clasificacion: r[2] ?? "",
    categoria: r[3] ?? "",
    descripcion: r[4] ?? "",
    total: parseMoney(r[5]),
    notas: r[6]
  }));
}
function parseSales(rows) {
  return rows.slice(1).filter((r) => r.length > 0 && r[0]).map((r) => ({
    mes: r[0] ?? "",
    udn: r[1] ?? "",
    ventasNetas: parseMoney(r[2]),
    concepto: r[3] ?? ""
  }));
}
function parseProducts(rows) {
  return rows.slice(1).filter((r) => r.length > 0 && r[0]).map((r) => ({
    producto: r[0] ?? "",
    costoUnitario: parseMoney(r[1]),
    categoria: r[2] ?? ""
  }));
}
var handler = async () => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "s-maxage=300"
  };
  try {
    if (!API_KEY) {
      throw new Error("GOOGLE_API_KEY no configurada");
    }
    const [costoRows, gastosRows, ventasRows, productosRows] = await Promise.all([
      fetchSheet("Costo de Venta!A:K"),
      fetchSheet("Gastos Operativos!A:G"),
      fetchSheet("Ventas!A:D"),
      fetchSheet("BDD Precios!A:C")
    ]);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        transactions: parseTransactions(costoRows),
        financials: parseFinancials(gastosRows),
        sales: parseSales(ventasRows),
        products: parseProducts(productosRows),
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      })
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: message })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=sheets.js.map
