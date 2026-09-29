import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import logReducer from './logSlice';
import configReducer from './configSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    log: logReducer,
    config: configReducer
  }
});
