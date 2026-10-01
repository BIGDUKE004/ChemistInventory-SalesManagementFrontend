import { addEntry } from './store/logSlice';
import { setConnected } from './store/configSlice';

/**
 * Calls the Apothic backend and records the result in the activity log.
 * Throws an Error with a readable message on failure so callers can
 * show it inline without duplicating error-parsing logic.
 */
export async function callApi(dispatch, { apiBase, path, method = 'GET', body, token }) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res, text, status;
  try {
    res = await fetch(`${apiBase.replace(/\/$/, '')}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    status = res.status;
    text = await res.text();
    dispatch(setConnected(true));
  } catch (err) {
    dispatch(setConnected(false));
    dispatch(addEntry(`${method} ${path}`, 0, `Could not reach ${apiBase}. Is the backend running and is this origin allowed in CORS?`));
    throw new Error('Could not reach the backend.');
  }

  dispatch(addEntry(`${method} ${path}`, status, text || '(empty body)'));

  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // non-JSON response, leave json as null
  }

  if (status >= 400) {
    throw new Error((json && (json.error || json.message)) || `Request failed (${status})`);
  }
  return json;
}
