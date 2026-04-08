import { configureStore } from '@reduxjs/toolkit'
import wafReducer from './wafSlice'

export const store = configureStore({
  reducer: { waf: wafReducer }
})
