// store/wafSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const API = '/api'

export const fetchStats = createAsyncThunk('waf/fetchStats', async () => {
  const { data } = await axios.get(`${API}/stats`)
  return data
})

export const fetchEvents = createAsyncThunk('waf/fetchEvents', async (limit = 100) => {
  const { data } = await axios.get(`${API}/events?limit=${limit}`)
  return data
})

export const fetchRules = createAsyncThunk('waf/fetchRules', async () => {
  const { data } = await axios.get(`${API}/rules`)
  return data
})

export const fetchBanned = createAsyncThunk('waf/fetchBanned', async () => {
  const { data } = await axios.get(`${API}/banned`)
  return data
})

export const banIP = createAsyncThunk('waf/banIP', async ({ ip, reason, permanent }) => {
  const { data } = await axios.post(`${API}/ban`, { ip, reason, permanent })
  return { ip, data }
})

export const unbanIP = createAsyncThunk('waf/unbanIP', async (ip) => {
  await axios.delete(`${API}/ban/${ip}`)
  return ip
})

export const simulateAttack = createAsyncThunk('waf/simulate', async (type) => {
  const { data } = await axios.post(`${API}/simulate`, { type })
  return data
})

const wafSlice = createSlice({
  name: 'waf',
  initialState: {
    stats: null,
    events: [],
    rules: [],
    banned: [],
    connected: false,
    loading: false,
    simulationResult: null,
    activeTab: 'dashboard'
  },
  reducers: {
    setConnected: (state, action) => { state.connected = action.payload },
    setActiveTab: (state, action) => { state.activeTab = action.payload },
    pushEvent: (state, action) => {
      state.events.unshift(action.payload)
      if (state.events.length > 300) state.events = state.events.slice(0, 300)
      // Update stats in real-time
      if (state.stats) {
        state.stats.totalRequests = (state.stats.totalRequests || 0) + 1
        if (action.payload.blocked) {
          state.stats.totalBlocked = (state.stats.totalBlocked || 0) + 1
          const cat = action.payload.category
          if (cat) {
            state.stats.attacksByCategory = state.stats.attacksByCategory || {}
            state.stats.attacksByCategory[cat] = (state.stats.attacksByCategory[cat] || 0) + 1
          }
        } else {
          state.stats.totalAllowed = (state.stats.totalAllowed || 0) + 1
        }
        const total = state.stats.totalRequests
        const blocked = state.stats.totalBlocked
        state.stats.blockRate = total > 0 ? ((blocked / total) * 100).toFixed(1) : '0.0'
      }
    },
    clearSimResult: (state) => { state.simulationResult = null }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStats.fulfilled, (s, a) => { s.stats = a.payload })
      .addCase(fetchEvents.fulfilled, (s, a) => { s.events = a.payload })
      .addCase(fetchRules.fulfilled, (s, a) => { s.rules = a.payload })
      .addCase(fetchBanned.fulfilled, (s, a) => { s.banned = a.payload })
      .addCase(unbanIP.fulfilled, (s, a) => { s.banned = s.banned.filter(b => b.ip !== a.payload) })
      .addCase(simulateAttack.fulfilled, (s, a) => { s.simulationResult = a.payload })
  }
})

export const { setConnected, setActiveTab, pushEvent, clearSimResult } = wafSlice.actions
export default wafSlice.reducer
