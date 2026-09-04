/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore OpenNext generates this module during the Cloudflare build.
import handler from './.open-next/worker.js';
/* eslint-enable @typescript-eslint/ban-ts-comment */
import {
  shouldRunBiweeklyRaSync,
  syncRaEvents,
} from './src/capabilities/events/raScheduledSync';

const RA_SYNC_CRON = '15 19 * * SUN';

interface RaScheduledController {
  cron: string;
  scheduledTime: number;
}

const worker = {
  fetch: handler.fetch,

  async scheduled(controller: RaScheduledController, env: CloudflareEnv) {
    if (controller.cron !== RA_SYNC_CRON || !shouldRunBiweeklyRaSync(controller.scheduledTime)) {
      console.info('[ra-sync] skipped outside biweekly window');
      return;
    }

    try {
      const result = await syncRaEvents(env.DB);
      if (result.kind === 'not-configured') {
        console.warn('[ra-sync] skipped because RA API is not configured');
        return;
      }
      console.info(`[ra-sync] completed fetched=${result.fetched} inserted=${result.inserted}`);
    } catch {
      console.error('[ra-sync] failed');
      throw new Error('RA scheduled sync failed');
    }
  },
};

export default worker;
