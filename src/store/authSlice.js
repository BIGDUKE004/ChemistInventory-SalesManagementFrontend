import { createSlice } from '@reduxjs/toolkit';

function loadSession() {
  try {
    const raw = localStorage.getItem('chemist-session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const saved = loadSession();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: saved?.token || null,
    userName: saved?.userName || null,
    fullName: saved?.fullName || null
  },
  reducers: {
    setSession: (state, action) => {
      state.token = action.payload.token;
      state.userName = action.payload.userName;
      state.fullName = action.payload.fullName || null;
      try {
        localStorage.setItem('chemist-session', JSON.stringify(state));
      } catch {}
    },
    clearSession: (state) => {
      state.token = null;
      state.userName = null;
      state.fullName = null;
      try {
        localStorage.removeItem('chemist-session');
      } catch {}
    }
  }
});

export const { setSession, clearSession } = authSlice.actions;
export default authSlice.reducer;
