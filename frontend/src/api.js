const BASE_URL = '/api';


export async function api(path, options = {}) {
  const token = sessionStorage.getItem('caterease_token');
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    });
  } catch {
    throw new Error('Cannot connect to the backend. Check that Node.js is running on port 4000.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}

export const peso = value => new Intl.NumberFormat('en-PH', {
  style: 'currency', currency: 'PHP'
}).format(Number(value) || 0);

export const prettyStatus = status => String(status || '').replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
