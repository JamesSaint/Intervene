import type { APIRoute } from 'astro';
import { campaignPaths, campaignStub } from '../../../lib/campaign-links';

// /r/<slug>/, for a link followed with a trailing slash.
export const getStaticPaths = campaignPaths;
export const GET: APIRoute = ({ params }) => campaignStub(params.slug!);
