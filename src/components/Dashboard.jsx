import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearSession } from '../store/authSlice';
import { callApi } from '../api';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { token, userName, fullName } = useSelector((s) => s.auth);
  const apiBase = useSelector((s) => s.config.apiBase);
  const [tab, setTab] = useState('inventory');
  const [error, setError] = useState('');

  async function logout() {
    try {
      await callApi(dispatch, { apiBase, path: '/Authorization/Logout', method: 'POST', body: { userName } });
    } catch {}
    dispatch(clearSession());
  }

  return (
    <div className="dash">
      <header className="dash-head">
        <div className="brand">
          <span className="mark" />
          <span className="brand-name">Apothic</span>
        </div>
        <div className="who">
          <span>{fullName || userName}</span>
          <button className="btn ghost" onClick={logout}>Log out</button>
        </div>
      </header>

      <nav className="rail">
        {['inventory', 'dispense', 'log'].map((t) => (
          <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            {t === 'inventory' ? 'Inventory' : t === 'dispense' ? 'Dispense' : 'Activity log'}
          </button>
        ))}
      </nav>

      <main className="sheet">
        {error && <p className="notice err">{error}</p>}
        {tab === 'inventory' && <Inventory token={token} apiBase={apiBase} setError={setError} />}
        {tab === 'dispense' && <Dispense token={token} apiBase={apiBase} setError={setError} />}
        {tab === 'log' && <ActivityLog />}
      </main>

      <p className="note">
        View, Search and Get-amount-of-drugs aren't wired up — those endpoints are GET requests that
        expect a request body, which browsers won't send. Convert them to query params on the backend to enable them here.
      </p>
    </div>
  );
}

function Inventory({ token, apiBase, setError }) {
  const dispatch = useDispatch();
  const [busy, setBusy] = useState(false);

  async function addDrug(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const f = new FormData(e.target);
    const body = {
      brandName: f.get('brandName'),
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
      await callApi(dispatch, { apiBase, path: '/DrugManagement/AddDrug', method: 'POST', body, token });
      e.target.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteDrug(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const f = new FormData(e.target);
    try {
      await callApi(dispatch, { apiBase, path: '/DrugManagement/DeleteDrug', method: 'DELETE', body: { id: Number(f.get('id')) }, token });
      e.target.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h2>Add drug to stock</h2>
      <form className="grid2" onSubmit={addDrug}>
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
        <div className="row-actions"><button className="btn" type="submit" disabled={busy}>Add drug</button></div>
      </form>

      <hr />
      <h2>Remove drug by ID</h2>
      <form className="grid2" onSubmit={deleteDrug}>
        <label>Drug ID<input name="id" type="number" required /></label>
        <div className="row-actions"><button className="btn danger" type="submit" disabled={busy}>Delete</button></div>
      </form>
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
    const body = {
      name: f.get('name'),
      drugs: [{
        drugName: f.get('drugName'),
        batchId: f.get('batchId'),
        dosage: f.get('dosage'),
        quantity: Number(f.get('quantity'))
      }]
    };
    try {
      await callApi(dispatch, { apiBase, path: '/Sales/dispenseDrug', method: 'POST', body, token });
      e.target.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h2>Dispense a sale</h2>
      <form className="grid2" onSubmit={dispense}>
        <label>Sold by (name)<input name="name" required /></label>
        <label>Drug name<input name="drugName" required /></label>
        <label>Batch ID<input name="batchId" className="mono" /></label>
        <label>Dosage<input name="dosage" /></label>
        <label>Quantity<input name="quantity" type="number" min="1" required /></label>
        <div className="row-actions"><button className="btn" type="submit" disabled={busy}>Dispense</button></div>
      </form>
      <p className="note">Sends one item per submission as sellDrugRequest.drugs[0].</p>
    </>
  );
}

function ActivityLog() {
  const entries = useSelector((s) => s.log.entries);
  if (!entries.length) return <p className="empty">Nothing sent yet.</p>;
  return (
    <ul className="log">
      {entries.map((l) => (
        <li key={l.id}>
          <div className="lh">
            <span className="lbl">{l.label}</span>
            <span className={`st ${l.status < 400 ? 's2' : 's4'}`}>{l.status}</span>
          </div>
          <div className="lh"><span className="tm">{l.time}</span></div>
          <pre>{l.body.slice(0, 400)}</pre>
        </li>
      ))}
    </ul>
  );
}
