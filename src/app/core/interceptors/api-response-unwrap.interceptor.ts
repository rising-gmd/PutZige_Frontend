import {
  HttpContextToken,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { map } from 'rxjs';

/** Set to `true` on requests whose body uses the `ApiResponse<T>` envelope. */
export const UNWRAP_API_RESPONSE = new HttpContextToken<boolean>(() => false);

interface ApiResponseEnvelope {
  success: boolean;
  data?: unknown;
  message?: string;
}

function isApiEnvelope(body: unknown): body is ApiResponseEnvelope {
  return (
    typeof body === 'object' &&
    body !== null &&
    'success' in body &&
    typeof (body as Record<string, unknown>)['success'] === 'boolean'
  );
}

/**
 * Transparently unwraps `{ success, data }` API envelopes so services
 * receive the inner `data` directly. Opt-in via UNWRAP_API_RESPONSE context
 * token — non-chat endpoints remain unaffected.
 *
 * Throws a typed Error on `success: false` so the error interceptor can
 * surface a consistent message to the UI.
 */
export const apiResponseUnwrapInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.context.get(UNWRAP_API_RESPONSE)) return next(req);

  return next(req).pipe(
    map((event) => {
      if (!(event instanceof HttpResponse)) return event;

      const body = event.body;
      if (!isApiEnvelope(body)) return event;

      if (!body.success) {
        throw new Error(body.message ?? 'Server returned success: false');
      }

      return event.clone({ body: body.data ?? null });
    }),
  );
};
