import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSession } from '../store/authSlice';
import { setApiBase } from '../store/configSlice';
import { callApi, logResult } from '../api';

export default function Auth() {
  const dispatch = useDispatch();
  const apiBase = useSelector((s) => s.config.apiBase);
  const connected = useSelector((s) => s.config.connected);
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const f = new FormData(e.target);
    const userName = f.get('userName');
    try {
      const { data, raw } = await callApi(dispatch, {
        apiBase,
        path: '/Authorization/Login',
        method: 'POST',
        body: { userName, password: f.get('password') }
      });
      dispatch(setSession({ token: data.jwtId, userName: data.userName, fullName: data.fullName }));
      logResult(dispatch, `Signed in as ${data.fullName || data.userName}`, true, raw);
    } catch (err) {
      setError(err.message);
      logResult(dispatch, `Sign-in failed for "${userName}"`, false, err.raw || err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    const f = new FormData(e.target);
    const fullName = f.get('fullName');
    try {
      const { raw } = await callApi(dispatch, {
        apiBase,
        path: '/Authorization/Register',
        method: 'POST',
        body: { fullName, userName: f.get('userName'), passWord: f.get('passWord'), storeName: f.get('storeName') }
      });
      logResult(dispatch, `Registered new account for ${fullName}`, true, raw);
      setNotice('Account created. Log in below.');
      setMode('login');
    } catch (err) {
      setError(err.message);
      logResult(dispatch, `Registration failed for ${fullName}`, false, err.raw || err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="landing">
      <div className="landing-glow" aria-hidden="true" />
      <div className="landing-inner">
        <div className="landing-copy">
          <span className="eyebrow-dot" />
          <h1>Know what's on<br />the shelf, before<br />it's not.</h1>
          <p className="lede">
            Add stock as it arrives, dispense it as it sells, and keep every
            batch and expiry date where you can see it. One counter screen
            instead of a stockroom notebook.
          </p>
          <div className="stat-row">
            <div className="stat">
              <span className="stat-num">Stock</span>
              <span className="stat-label">brand, batch, expiry — logged at intake</span>
            </div>
            <div className="stat">
              <span className="stat-num">Sales</span>
              <span className="stat-label">every dispense recorded, by whom</span>
            </div>
            <div className="stat">
              <span className="stat-num">Staff</span>
              <span className="stat-label">one signed-in account per pharmacist</span>
            </div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-head">
            <div className={`pulse ${connected === false ? 'off' : connected ? 'on' : ''}`} />
            <input
              className="api-input"
              value={apiBase}
              spellCheck={false}
              onChange={(e) => dispatch(setApiBase(e.target.value))}
            />
          </div>

          <div className="tabs">
            <button className={mode === 'login' ? 'on' : ''} onClick={() => { setMode('login'); setError(''); }}>
              Log in
            </button>
            <button className={mode === 'register' ? 'on' : ''} onClick={() => { setMode('register'); setError(''); }}>
              Register
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLogin}>
              <label>Username<input name="userName" required autoFocus /></label>
              <label>Password<input name="password" type="password" required /></label>
              <button className="btn" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Log in'}</button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <label>Full name<input name="fullName" required autoFocus /></label>
              <label>Pharmacy name<input name="storeName" required placeholder="Use the same name as your team" /></label>
              <label>Username<input name="userName" required /></label>
              <label>Password<input name="passWord" type="password" required /></label>
              <button className="btn" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
            </form>
          )}

          {notice && <p className="notice ok">{notice}</p>}
          {error && <p className="notice err">{error}</p>}
        </div>
      </div>
    </div>
  );
}
