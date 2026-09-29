import { createSlice } from '@reduxjs/toolkit';

const configSlice = createSlice({
  name: 'config',
  initialState: {
    apiBase: localStorage.getItem('chemist-api-base') || 'http://localhost:8080',
    connected: null // null = unknown, true/false after first request
  },
  reducers: {
    setApiBase: (state, action) => {
      state.apiBase = action.payload;
      try {
        localStorage.setItem('chemist-api-base', action.payload);
      } catch {}
    },
    setConnected: (state, action) => {
      state.connected = action.payload;
    }
  }
});

export const { setApiBase, setConnected } = configSlice.actions;
export default configSlice.reducer;
