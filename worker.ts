/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore OpenNext generates this module during the Cloudflare build.
import handler from './.open-next/worker.js';
/* eslint-enable @typescript-eslint/ban-ts-comment */
import { syncRaEvents } from './src/capabilities/events/raScheduledSync';
import { RA_SYNC_CRON } from './src/capabilities/events/raSync';

interface RaScheduledController {
  cron: string;
  scheduledTime: number;
}

const worker = {
  fetch: handler.fetch,

  async scheduled(controller: RaScheduledController, env: CloudflareEnv) {
    if (controller.cron !== RA_SYNC_CRON) return;

    try {
      const result = await syncRaEvents(env.DB, { mode: 'scheduled', now: controller.scheduledTime });
      if (result.kind === 'failed') throw new Error('RA scheduled sync failed');
      if (result.kind === 'success') {
        console.info(`[ra-sync] completed fetched=${result.fetched} inserted=${result.inserted}`);
      } else console.info(`[ra-sync] ${result.kind}`);
    } catch {
      console.error('[ra-sync] failed');
      throw new Error('RA scheduled sync failed');
    }
  },
};

export default worker;
