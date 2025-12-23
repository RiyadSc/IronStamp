import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Ignore patterns - don't lint build output
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "public/**",
      "*.config.js",
      "*.config.mjs",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Warn instead of error for missing dependencies in useEffect
      "react-hooks/exhaustive-deps": "warn",
      // Allow img element (we use both next/image and regular img)
      "@next/next/no-img-element": "off",
      // Allow unused vars prefixed with underscore
      "@typescript-eslint/no-unused-vars": ["warn", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_" 
      }],
      // Allow explicit any for flexibility
      "@typescript-eslint/no-explicit-any": "off",
      // Allow require imports (used in some libs)
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default eslintConfig;
