import { ValidationError } from './errors';

export function readPayload<T = Record<string, unknown>>(formData: FormData): T {
  const raw = formData.get('payload');
  if (!raw) return {} as T;
  try {
    return JSON.parse(String(raw)) as T;
  } catch {
    throw new ValidationError('The submitted data could not be read. Please try again.');
  }
}

export function toActionFailure(error: unknown, fallback: string): {
  status: 'error';
  message: string;
  fieldErrors?: Record<string, string>;
} {
  if (error && typeof error === 'object' && 'fieldErrors' in error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : fallback,
      fieldErrors: (error as { fieldErrors?: Record<string, string> }).fieldErrors,
    };
  }
  return { status: 'error', message: error instanceof Error ? error.message : fallback };
}

export function actionOk(message: string): { status: 'success'; message: string } {
  return { status: 'success', message };
}

export type AdminActionState =
  | { status: 'idle' }
  | {
      status: 'success';
      message: string;
      temporaryPassword?: string;
      user?: {
        id: string;
        email: string;
        name: string;
        roles: string[];
        sections: Array<{ sectionId: string; canPublish: boolean }>;
      };
    }
  | { status: 'error'; message: string; fieldErrors?: Record<string, string> };
