// store/wafSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { generateDemoEvents, generateDemoStats } from '../lib/demoData'

const API = '/api'

export const fetchStats      = createAsyncThunk('waf/fetchStats',      async () => (await axios.get(`${API}/stats`)).data)
export const fetchEvents     = createAsyncThunk('waf/fetchEvents',     async (limit = 100) => (await axios.get(`${API}/events?limit=${limit}`)).data)
export const fetchRules      = createAsyncThunk('waf/fetchRules',      async () => (await axios.get(`${API}/rules`)).data)
export const fetchBanned     = createAsyncThunk('waf/fetchBanned',     async () => (await axios.get(`${API}/banned`)).data)
export const fetchSuspicious = createAsyncThunk('waf/fetchSuspicious', async () => (await axios.get(`${API}/suspicious`)).data)
export const fetchWebhooks   = createAsyncThunk('waf/fetchWebhooks',   async () => (await axios.get(`${API}/webhooks`)).data)
export const banIP           = createAsyncThunk('waf/banIP',           async ({ ip, reason, permanent }) => { const { data } = await axios.post(`${API}/ban`, { ip, reason, permanent }); return { ip, data } })
export const unbanIP         = createAsyncThunk('waf/unbanIP',         async (ip) => { await axios.delete(`${API}/ban/${ip}`); return ip })
export const allowIP         = createAsyncThunk('waf/allowIP',         async (ip) => { await axios.post(`${API}/allowlist`, { ip }); return ip })
export const simulateAttack  = createAsyncThunk('waf/simulate',        async (type) => (await axios.post(`${API}/simulate`, { type })).data)
export const addWebhook      = createAsyncThunk('waf/addWebhook',      async (config) => (await axios.post(`${API}/webhooks`, config)).data)
export const deleteWebhook   = createAsyncThunk('waf/deleteWebhook',   async (id) => { await axios.delete(`${API}/webhooks/${id}`); return id })
export const toggleWebhook   = createAsyncThunk('waf/toggleWebhook',   async (id) => (await axios.patch(`${API}/webhooks/${id}/toggle`)).data)
export const testWebhook     = createAsyncThunk('waf/testWebhook',     async (id) => (await axios.post(`${API}/webhooks/test/${id}`)).data)

const wafSlice = createSlice({
  name: 'waf',
  initialState: {
    stats: null, events: [], rules: [], banned: [], suspicious: [], webhooks: [],
    disabledRules: [], connected: false, loading: false, simulationResult: null,
    activeTab: 'dashboard', demoMode: false,
  },
  reducers: {
    setConnected:  (s, a) => { s.connected = a.payload },
    setActiveTab:  (s, a) => { s.activeTab = a.payload },
    clearSimResult:(s)    => { s.simulationResult = null },
    toggleRule: (s, a) => {
      const id = a.payload
      s.disabledRules = s.disabledRules.includes(id)
        ? s.disabledRules.filter(r => r !== id)
        : [...s.disabledRules, id]
    },
    addCustomRule: (s, a) => { s.rules.push(a.payload) },

    // Demo mode — seed store with realistic fake data
    activateDemo: (s) => {
      const demoEvents = generateDemoEvents(80)
      const demoStats  = generateDemoStats(demoEvents)
      s.demoMode  = true
      s.events    = demoEvents
      s.stats     = demoStats
    },
    deactivateDemo: (s) => {
      s.demoMode = false
      s.events   = []
      s.stats    = null
    },

    pushEvent: (s, a) => {
      if (s.demoMode) return   // Don't mix real events into demo
      s.events.unshift(a.payload)
      if (s.events.length > 300) s.events = s.events.slice(0, 300)
      if (s.stats) {
        s.stats.totalRequests = (s.stats.totalRequests || 0) + 1
        if (a.payload.blocked) {
          s.stats.totalBlocked = (s.stats.totalBlocked || 0) + 1
          const cat = a.payload.category
          if (cat) { s.stats.attacksByCategory = s.stats.attacksByCategory || {}; s.stats.attacksByCategory[cat] = (s.stats.attacksByCategory[cat] || 0) + 1 }
          const cc = a.payload.country
          if (cc && cc !== 'XX') { s.stats.attacksByCountry = s.stats.attacksByCountry || {}; s.stats.attacksByCountry[cc] = (s.stats.attacksByCountry[cc] || 0) + 1 }
        } else {
          s.stats.totalAllowed = (s.stats.totalAllowed || 0) + 1
        }
        s.stats.blockRate = s.stats.totalRequests > 0
          ? ((s.stats.totalBlocked / s.stats.totalRequests) * 100).toFixed(1)
          : '0.0'
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStats.fulfilled,      (s, a) => { if (!s.demoMode) s.stats     = a.payload })
      .addCase(fetchEvents.fulfilled,     (s, a) => { if (!s.demoMode) s.events    = a.payload })
      .addCase(fetchRules.fulfilled,      (s, a) => {                  s.rules     = a.payload })
      .addCase(fetchBanned.fulfilled,     (s, a) => { if (!s.demoMode) s.banned    = a.payload })
      .addCase(fetchSuspicious.fulfilled, (s, a) => { if (!s.demoMode) s.suspicious = a.payload })
      .addCase(fetchWebhooks.fulfilled,   (s, a) => {                  s.webhooks  = a.payload })
      .addCase(unbanIP.fulfilled,         (s, a) => { s.banned = s.banned.filter(b => b.ip !== a.payload) })
      .addCase(simulateAttack.fulfilled,  (s, a) => { s.simulationResult = a.payload })
  }
})

export const {
  setConnected, setActiveTab, pushEvent, clearSimResult,
  toggleRule, addCustomRule, activateDemo, deactivateDemo,
} = wafSlice.actions
export default wafSlice.reducer
