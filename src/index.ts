import listingsData from './listings.json';

type Listing = (typeof listingsData)[number];

interface Env {
  ASSETS: { fetch(input: Request | URL | string, init?: RequestInit): Promise<Response> };
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  NOTIFY_EMAIL?: string;
}

const NOTIFY_DEFAULT = 'j_rainey@outlook.com';

const cors: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: cors });
      }
      if (request.method === 'POST') {
        return handleContact(request, env);
      }
      return new Response('Method Not Allowed', { status: 405, headers: cors });
    }

    if (url.pathname === '/api/listings' && request.method === 'GET') {
      return handleListings(url);
    }

    return env.ASSETS.fetch(request);
  },
};

function handleListings(url: URL): Response {
  const city = url.searchParams.get('city') || '';
  const beds = url.searchParams.get('beds') || '';
  let results: Listing[] = [...listingsData];
  if (city) results = results.filter((l) => l.city.toLowerCase().includes(city.toLowerCase()));
  if (beds) results = results.filter((l) => l.beds.toLowerCase().includes(beds.toLowerCase()));
  return Response.json({ success: true, listings: results });
}

async function handleContact(request: Request, env: Env): Promise<Response> {
  if (!env.RESEND_API_KEY) {
    return Response.json(
      {
        success: false,
        message:
          'Email is not configured for this deployment. Add a Resend API key: wrangler secret put RESEND_API_KEY',
      },
      { status: 503, headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  }

  let body: Record<string, string>;
  try {
    body = (await request.json()) as Record<string, string>;
  } catch {
    return Response.json({ success: false, message: 'Invalid JSON' }, { status: 400, headers: cors });
  }

  const { name, email, phone, city, budget, moveDate, bedrooms, message } = body;
  if (!name?.trim() || !email?.trim() || !phone?.trim()) {
    return Response.json(
      { success: false, message: 'Name, email, and phone are required.' },
      { status: 400, headers: cors },
    );
  }

  const to = env.NOTIFY_EMAIL?.trim() || NOTIFY_DEFAULT;
  const from = env.RESEND_FROM?.trim() || 'Metro Locators <onboarding@resend.dev>';

  const html = `
    <h2>New Apartment Locator Lead</h2>
    <table cellpadding="8" style="border-collapse:collapse;">
      <tr><td><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>
      <tr><td><strong>Email</strong></td><td>${escapeHtml(email)}</td></tr>
      <tr><td><strong>Phone</strong></td><td>${escapeHtml(phone)}</td></tr>
      <tr><td><strong>City</strong></td><td>${escapeHtml(city || 'N/A')}</td></tr>
      <tr><td><strong>Budget</strong></td><td>${escapeHtml(budget || 'N/A')}</td></tr>
      <tr><td><strong>Move Date</strong></td><td>${escapeHtml(moveDate || 'N/A')}</td></tr>
      <tr><td><strong>Bedrooms</strong></td><td>${escapeHtml(bedrooms || 'N/A')}</td></tr>
      <tr><td><strong>Message</strong></td><td>${escapeHtml(message || 'N/A')}</td></tr>
    </table>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `New Lead from Metro Locators – ${name}`,
      html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Resend error:', res.status, errText);
    return Response.json(
      { success: false, message: 'Could not send email. Please try again later.' },
      { status: 502, headers: cors },
    );
  }

  return Response.json({
    success: true,
    message: 'Thanks! A locator will reach out within 24 hours.',
  }, { headers: cors });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
