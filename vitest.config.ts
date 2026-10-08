import { defineConfig } from "vitest/config";

// Testes rápidos: rodam em qualquer lugar (npm test), sem Floci.
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    exclude: ["test/**/*.integracao.test.ts"],
  },
});
