import { defineConfig } from "vitest/config";

// Testes de integração: falam com o Floci (DocumentDB, SQS) de verdade.
// Rodam dentro do container: docker compose run --rm api npm run test:integracao
export default defineConfig({
  test: {
    include: ["test/**/*.integracao.test.ts"],
    testTimeout: 60_000,
    fileParallelism: false,
  },
});
