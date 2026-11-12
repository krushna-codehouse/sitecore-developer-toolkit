'use server';

import { revalidatePath } from 'next/cache';
import { createComponent } from '@/toolkit/components';

export interface CreateComponentState {
  ok?: boolean;
  message?: string;
  files?: string[];
}

/** Writes files to disk, so it is only enabled while running `next dev`. */
export async function createComponentAction(
  _previous: CreateComponentState,
  formData: FormData,
): Promise<CreateComponentState> {
  if (process.env.NODE_ENV !== 'development') {
    return { ok: false, message: 'Scaffolding from the dashboard is only available in development (npm run dev).' };
  }

  const name = String(formData.get('name') ?? '').trim();
  const dryRun = formData.get('dryRun') === 'on';

  try {
    const result = createComponent(name, { dryRun });
    if (!dryRun) revalidatePath('/components');
    return {
      ok: true,
      message: `${dryRun ? 'Dry run: would create' : 'Created'} ${result.name} in ${result.dir}`,
      files: result.files,
    };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}
