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
      // summary: human sentence, e.g. "Added Panadol to stock"
      // ok: true/false, drives the dot colour
      // detail: raw response text, shown only if the person expands the row
      prepare: (summary, ok, detail) => ({
        payload: {
          id: nanoid(),
          summary,
          ok,
          detail: typeof detail === 'string' ? detail : JSON.stringify(detail),
          time: new Date().toLocaleTimeString()
        }
      })
    }
  }
});

export const { addEntry } = logSlice.actions;
export default logSlice.reducer;
