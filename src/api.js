import { addEntry } from './store/logSlice';
import { setConnected } from './store/configSlice';

/**
 * Low-level call to the Apothic backend. Returns the parsed JSON body on
 * success, throws a readable Error on failure. Does not write to the
 * activity log itself — callers log a human sentence via logResult(),
 * since "POST /DrugManagement/AddDrug" means nothing to a pharmacist.
 */
export async function callApi(dispatch, { apiBase, path, method = 'GET', body, token, query }) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let url = `${apiBase.replace(/\/$/, '')}${path}`;
  if (query) url += `?${new URLSearchParams(query).toString()}`;

  let res, text, status;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    status = res.status;
    text = await res.text();
    dispatch(setConnected(true));
  } catch (err) {
    dispatch(setConnected(false));
    throw { message: `Could not reach ${apiBase}. Is the backend running?`, raw: null, status: 0 };
  }

  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // non-JSON response, leave json as null
  }

  if (status >= 400) {
    throw { message: (json && (json.error || json.message)) || `Request failed (${status})`, raw: text, status };
  }
  return { data: json, raw: text, status };
}

/** Records one human-readable line in the activity log. */
export function logResult(dispatch, summary, ok, detail) {
  dispatch(addEntry(summary, ok, detail));
}
