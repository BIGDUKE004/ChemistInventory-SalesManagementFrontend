import { createSlice, nanoid } from '@reduxjs/toolkit';

const logSlice = createSlice({
  name: 'log',
  initialState: { entries: [] },
  reducers: {
    addEntry: {
      reducer: (state, action) => {
        state.entries.unshift(action.payload);
        if (state.entries.length > 50) state.entries.pop();
      },
      prepare: (label, status, body) => ({
        payload: {
          id: nanoid(),
          label,
          status,
          body: typeof body === 'string' ? body : JSON.stringify(body),
          time: new Date().toLocaleTimeString()
        }
      })
    }
  }
});

export const { addEntry } = logSlice.actions;
export default logSlice.reducer;
