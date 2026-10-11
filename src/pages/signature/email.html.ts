import type { APIRoute } from 'astro';
import { signatureDocument } from '../../lib/email-signature';

export const GET: APIRoute = () => new Response(signatureDocument(), {
  headers: { 'Content-Type': 'text/html; charset=utf-8' },
});
