import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearSession } from '../store/authSlice';
import { callApi, logResult } from '../api';

const TABS = [
  { id: 'inventory', label: 'Inventory' },
  { id: 'dispense', label: 'Dispense' },
  { id: 'log', label: 'Activity' }
];

export default function Dashboard() {
  const dispatch = useDispatch();
  const { token, userName, fullName } = useSelector((s) => s.auth);
  const apiBase = useSelector((s) => s.config.apiBase);
  const [tab, setTab] = useState('inventory');
  const [error, setError] = useState('');

  async function logout() {
    try {
      const { raw } = await callApi(dispatch, { apiBase, path: '/Authorization/Logout', method: 'POST', body: { userName } });
      logResult(dispatch, `Signed out ${fullName || userName}`, true, raw);
    } catch {}
    dispatch(clearSession());
  }

  return (
    <div className="appshell">
      <aside className="sidebar">
        <div className="brand">
          <span className="mark" />
          <span className="brand-name">Apothic</span>
        </div>
        <nav className="sidenav">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="sidefoot">
          <span className="who-name">{fullName || userName}</span>
          <button className="btn ghost" onClick={logout}>Log out</button>
        </div>
      </aside>

      <main className="content">
        {error && <p className="notice err">{error}</p>}
        {tab === 'inventory' && <Inventory token={token} apiBase={apiBase} setError={setError} />}
        {tab === 'dispense' && <Dispense token={token} apiBase={apiBase} setError={setError} />}
        {tab === 'log' && <ActivityLog />}
      </main>
    </div>
  );
}

function Inventory({ token, apiBase, setError }) {
  const dispatch = useDispatch();
  const [drugs, setDrugs] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);

  async function loadDrugs() {
    setError('');
    try {
      const { data, raw } = await callApi(dispatch, { apiBase, path: '/DrugManagement/GetAllDrugs', token });
      setDrugs(data || []);
      logResult(dispatch, `Loaded stock — ${(data || []).length} drug${data?.length === 1 ? '' : 's'} on shelf`, true, raw);
    } catch (err) {
      setError(err.message);
      setDrugs([]);
      logResult(dispatch, 'Could not load stock', false, err.raw || err.message);
    }
  }

  useEffect(() => { loadDrugs(); /* eslint-disable-next-line */ }, []);

  async function addDrug(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const f = new FormData(e.target);
    const brandName = f.get('brandName');
    const body = {
      brandName,
      genericName: f.get('genericName'),
      strength: f.get('strength'),
      dosage: f.get('dosage'),
      manufacturer: f.get('manufacturer'),
      batchNumber: f.get('batchNumber'),
      manufactureDate: f.get('manufactureDate') || null,
      expiryDate: f.get('expiryDate') || null,
      quantityInStock: Number(f.get('quantityInStock')),
      price: Number(f.get('price'))
    };
    try {
      const { raw } = await callApi(dispatch, { apiBase, path: '/DrugManagement/AddDrug', method: 'POST', body, token });
      logResult(dispatch, `Added ${brandName} to stock`, true, raw);
      e.target.reset();
      setShowAdd(false);
      loadDrugs();
    } catch (err) {
      setError(err.message);
      logResult(dispatch, `Could not add ${brandName}`, false, err.raw || err.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeDrug(brandName) {
    setError('');
    try {
      const { raw } = await callApi(dispatch, { apiBase, path: '/DrugManagement/DeleteDrug', method: 'DELETE', query: { brandName }, token });
      logResult(dispatch, `Removed ${brandName} from stock`, true, raw);
      if (lookupResult?.brandName === brandName) setLookupResult(null);
      loadDrugs();
    } catch (err) {
      setError(err.message);
      logResult(dispatch, `Could not remove ${brandName}`, false, err.raw || err.message);
    }
  }

  async function viewDrug(e) {
    e.preventDefault();
    setError('');
    const f = new FormData(e.target);
    const brandName = f.get('viewBrandName');
    try {
      const { data, raw } = await callApi(dispatch, { apiBase, path: '/DrugManagement/ViewDrugDetails', query: { brandName }, token });
      setLookupResult(data.drug);
      logResult(dispatch, `Viewed ${brandName}`, true, raw);
    } catch (err) {
      setError(err.message);
      setLookupResult(null);
      logResult(dispatch, `Could not find ${brandName}`, false, err.raw || err.message);
    }
  }

  async function searchDrugs(e) {
    e.preventDefault();
    setError('');
    const f = new FormData(e.target);
    const genericName = f.get('genericName');
    try {
      const { data, raw } = await callApi(dispatch, { apiBase, path: '/DrugManagement/SearchDrug', query: { genericName }, token });
      setDrugs(data.drugs || []);
      logResult(dispatch, data.message, true, raw);
    } catch (err) {
      setError(err.message);
      logResult(dispatch, `Search failed for "${genericName}"`, false, err.raw || err.message);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Inventory</h1>
          <p className="page-sub">Everything currently on the shelf.</p>
        </div>
        <div className="page-actions">
          <button className="btn ghost" onClick={loadDrugs}>Refresh</button>
          <button className="btn" style={{ width: 'auto' }} onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? 'Cancel' : 'Add drug'}
          </button>
        </div>
      </div>

      <div className="toolrow">
        <form className="inline-form" onSubmit={searchDrugs}>
          <input name="genericName" placeholder="Search by generic name…" />
          <button className="btn ghost small" type="submit">Search</button>
        </form>
        <form className="inline-form" onSubmit={viewDrug}>
          <input name="viewBrandName" placeholder="View by brand name…" />
          <button className="btn ghost small" type="submit">View</button>
        </form>
      </div>

      {lookupResult && (
        <div className="lookup-card">
          <div>
            <span className="stock-name">{lookupResult.brandName}</span>
            <span className="stock-sub">{lookupResult.genericName} · {lookupResult.strength} {lookupResult.dosage}</span>
          </div>
          <div className="stock-meta">
            <span className="mono">{lookupResult.quantityInStock} in stock</span>
            <span className="mono">batch {lookupResult.batchNumber || '—'}</span>
            <span className="mono">exp {lookupResult.expiryDate || '—'}</span>
            <span className="mono">₦{lookupResult.price ?? '—'}</span>
          </div>
          <button className="btn ghost small" onClick={() => setLookupResult(null)}>Close</button>
        </div>
      )}

      {showAdd && (
        <form className="grid2 addform" onSubmit={addDrug}>
          <label>Brand name<input name="brandName" required /></label>
          <label>Generic name<input name="genericName" required /></label>
          <label>Strength<input name="strength" placeholder="500mg" /></label>
          <label>Dosage form<input name="dosage" placeholder="Tablet" /></label>
          <label>Manufacturer<input name="manufacturer" /></label>
          <label>Batch number<input name="batchNumber" className="mono" /></label>
          <label>Manufacture date<input name="manufactureDate" type="date" /></label>
          <label>Expiry date<input name="expiryDate" type="date" /></label>
          <label>Quantity in stock<input name="quantityInStock" type="number" min="0" required /></label>
          <label>Price<input name="price" type="number" min="0" required /></label>
          <div className="row-actions"><button className="btn" type="submit" disabled={busy}>Save to stock</button></div>
        </form>
      )}

      {drugs === null && <p className="empty">Loading stock…</p>}
      {drugs && drugs.length === 0 && <p className="empty">Nothing on the shelf yet. Add your first drug above.</p>}
      {drugs && drugs.length > 0 && (
        <div className="stockgrid">
          {drugs.map((d) => (
            <div className="stockcard" key={d.id}>
              <div className="stock-main">
                <span className="stock-name">{d.brandName}</span>
                <span className="stock-sub">{d.genericName} · {d.strength} {d.dosage}</span>
              </div>
              <div className="stock-meta">
                <span className="mono">{d.quantityInStock} in stock</span>
                <span className="mono">batch {d.batchNumber || '—'}</span>
                <span className="mono">exp {d.expiryDate || '—'}</span>
              </div>
              <button className="btn danger small" onClick={() => removeDrug(d.brandName)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Dispense({ token, apiBase, setError }) {
  const dispatch = useDispatch();
  const [busy, setBusy] = useState(false);

  async function dispense(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const f = new FormData(e.target);
    const drugName = f.get('drugName');
    const quantity = Number(f.get('quantity'));
    const body = {
      name: f.get('name'),
      drugs: [{ drugName, batchId: f.get('batchId'), dosage: f.get('dosage'), quantity }]
    };
    try {
      const { raw } = await callApi(dispatch, { apiBase, path: '/Sales/dispenseDrug', method: 'POST', body, token });
      logResult(dispatch, `Dispensed ${quantity} × ${drugName}`, true, raw);
      e.target.reset();
    } catch (err) {
      setError(err.message);
      logResult(dispatch, `Could not dispense ${drugName}`, false, err.raw || err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dispense</h1>
          <p className="page-sub">Record a sale as it happens at the counter.</p>
        </div>
      </div>
      <form className="grid2 addform" onSubmit={dispense}>
        <label>Sold by (name)<input name="name" required /></label>
        <label>Drug name<input name="drugName" required /></label>
        <label>Batch ID<input name="batchId" className="mono" /></label>
        <label>Dosage<input name="dosage" /></label>
        <label>Quantity<input name="quantity" type="number" min="1" required /></label>
        <div className="row-actions"><button className="btn" type="submit" disabled={busy}>Dispense</button></div>
      </form>
    </>
  );
}

function ActivityLog() {
  const entries = useSelector((s) => s.log.entries);
  const [openId, setOpenId] = useState(null);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Activity</h1>
          <p className="page-sub">Everything that's happened this session.</p>
        </div>
      </div>
      {!entries.length && <p className="empty">Nothing has happened yet this session.</p>}
      {!!entries.length && (
        <ul className="feed">
          {entries.map((l) => (
            <li key={l.id}>
              <button className="feed-row" onClick={() => setOpenId(openId === l.id ? null : l.id)}>
                <span className={`feed-dot ${l.ok ? 'ok' : 'bad'}`} />
                <span className="feed-text">{l.summary}</span>
                <span className="feed-time">{l.time}</span>
              </button>
              {openId === l.id && <pre className="feed-detail">{(l.detail || '').slice(0, 500)}</pre>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
