import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// ─────────────────────────────────────────────────────────────────────────────
// Fronteras entre marcas (2026-09-04). Ver LOGICA_DE_NEGOCIO/38 y la auditoría
// de acoplamiento entre opabiz.com y mybusinessformation.com.
//
// Sin refactor de carpetas (Fase 2, pendiente), definimos las 2 áreas exclusivas
// que hoy están claramente delimitadas por path y bloqueamos cross-imports
// entre ellas.
//
// FBFC-exclusive: código que solo sirve al embudo del mailer de correo directo
// (landing + servicios + terms/privacy/legal de mybusinessformation.com,
// sistema de campañas, PDF de la carta física).
//
// OpaBiz Connect: sistema interno de despacho a empleados de campo. No tiene
// nada que ver con FBFC — un empleado nunca atiende una orden NBL de marketing.
// ─────────────────────────────────────────────────────────────────────────────

const FBFC_EXCLUSIVE_FILES = [
  "app/new-business/**/*.{ts,tsx}",
  "app/api/campaigns/**/*.{ts,tsx}",
  "app/api/sunbiz/**/*.{ts,tsx}",
  "app/admin/campaigns/**/*.{ts,tsx}",
];

// Libs que solo sirven al embudo FBFC (marketing/PDF). Cualquier importador
// fuera de FBFC_EXCLUSIVE_FILES es un cruce indebido.
const FBFC_ONLY_LIBS = [
  "@/lib/new-business-letter",
  "@/lib/fbfc-seal",
  "**/lib/new-business-letter",
  "**/lib/fbfc-seal",
];

// Libs de OpaBiz Connect (empleados internos, despacho). Ver LOGICA_DE_NEGOCIO/17.
// FBFC no debe depender de este subsistema.
const OPABIZ_CONNECT_LIBS = [
  "@/lib/opabiz-*",
  "**/lib/opabiz-*",
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Output del tsc -p tsconfig.server.json (Express compilado para Railway).
    // No tiene sentido lintear JS auto-generado.
    "dist-server/**",
  ]),
  // ─── Frontera 1: FBFC no debe importar OpaBiz Connect ───────────────────
  {
    files: FBFC_EXCLUSIVE_FILES,
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: OPABIZ_CONNECT_LIBS,
            message: "El código FBFC (mybusinessformation.com / campañas) no debe depender de OpaBiz Connect (despacho a empleados). Son dos negocios separados que comparten repo — si de verdad necesitas este módulo aquí, revisa la decisión con el founder primero.",
          },
        ],
      }],
    },
  },
  // ─── Frontera 2: Código no-FBFC no debe importar libs de PDF/carta FBFC ─
  //
  // new-business-letter.ts genera el PDF de la carta física de marketing;
  // fbfc-seal.ts es el sello embebido en ese PDF. Fuera del embudo FBFC
  // nadie tiene por qué depender de estos módulos.
  {
    files: ["app/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
    ignores: [
      ...FBFC_EXCLUSIVE_FILES,
      "lib/new-business-letter.ts",
      "lib/fbfc-seal.ts",
    ],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: FBFC_ONLY_LIBS,
            message: "Este módulo pertenece al embudo FBFC de mybusinessformation.com (carta física de marketing). Fuera de app/new-business/, app/api/campaigns/, app/api/sunbiz/ o app/admin/campaigns/ no debe importarse.",
          },
        ],
      }],
    },
  },
]);

export default eslintConfig;
