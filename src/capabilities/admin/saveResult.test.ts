import { describe, expect, it, vi } from 'vitest';
import { getFailedSaveAreas, runSave } from '@/capabilities/admin/saveResult';

describe('getFailedSaveAreas', () => {
  it('identifies rejected and success:false save operations', async () => {
    const failedAreas = await getFailedSaveAreas(
      ['TRACKS', 'PAGE SETTINGS', 'TERMINAL INFO'],
      [
        Promise.resolve({ success: true }),
        Promise.resolve({ success: false }),
        Promise.reject(new Error('offline')),
      ],
    );

    expect(failedAreas).toEqual(['PAGE SETTINGS', 'TERMINAL INFO']);
  });

  it.each([
    ['a success:false envelope', () => Promise.resolve({ success: false })],
    ['a rejected request', () => Promise.reject(new Error('offline'))],
  ])('keeps local edits on %s by skipping the success callback', async (_caseName, createOperation) => {
    const onSuccess = vi.fn();
    const onFailure = vi.fn();

    await expect(runSave(
      ['ARCHIVE LAYOUT'],
      [createOperation()],
      onSuccess,
      onFailure,
    )).resolves.toBe(false);

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onFailure).toHaveBeenCalledWith(['ARCHIVE LAYOUT']);
  });
});
