import type { APIRoute } from 'astro';
import { campaignPaths, campaignStub } from '../../lib/campaign-links';

// /r/<slug>.html, which GitHub Pages serves at /r/<slug>.
export const getStaticPaths = campaignPaths;
export const GET: APIRoute = ({ params }) => campaignStub(params.slug!);
