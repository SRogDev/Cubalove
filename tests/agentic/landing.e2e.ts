import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

// Smoke test: la landing carga y muestra el branding de Cubalove.
// Sin agent-steps: no necesita modelo ni API keys.
// Correr con el dev server arriba: APP_URL=http://localhost:3000 npm run test:e2e:agentic
test('landing muestra el branding de Cubalove', async ({ app, screen }) => {
  await app.open('/');
  await expect(
    screen.getByRole('heading', { name: /encuentra el amor/i }),
  ).toBeVisible();
  await expect(
    screen.getByRole('button', { name: /dale, entra ya/i }),
  ).toBeVisible();
});
