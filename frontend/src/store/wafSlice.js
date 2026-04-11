// store/wafSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = "/api";

export const fetchStats = createAsyncThunk(
  "waf/fetchStats",
  async () => (await axios.get(`${API}/stats`)).data,
);
export const fetchEvents = createAsyncThunk(
  "waf/fetchEvents",
  async (limit = 100) => (await axios.get(`${API}/events?limit=${limit}`)).data,
);
export const fetchRules = createAsyncThunk(
  "waf/fetchRules",
  async () => (await axios.get(`${API}/rules`)).data,
);
export const fetchBanned = createAsyncThunk(
  "waf/fetchBanned",
  async () => (await axios.get(`${API}/banned`)).data,
);
export const fetchSuspicious = createAsyncThunk(
  "waf/fetchSuspicious",
  async () => (await axios.get(`${API}/suspicious`)).data,
);
export const fetchWebhooks = createAsyncThunk(
  "waf/fetchWebhooks",
  async () => (await axios.get(`${API}/webhooks`)).data,
);
export const banIP = createAsyncThunk(
  "waf/banIP",
  async ({ ip, reason, permanent }) => {
    const { data } = await axios.post(`${API}/ban`, { ip, reason, permanent });
    return { ip, data };
  },
);
export const unbanIP = createAsyncThunk("waf/unbanIP", async (ip) => {
  await axios.delete(`${API}/ban/${ip}`);
  return ip;
});
export const allowIP = createAsyncThunk("waf/allowIP", async (ip) => {
  await axios.post(`${API}/allowlist`, { ip });
  return ip;
});
export const simulateAttack = createAsyncThunk(
  "waf/simulate",
  async (input) => {
    const body = typeof input === "string" ? { type: input } : input || {};
    return (await axios.post(`${API}/simulate`, body)).data;
  },
);
export const addWebhook = createAsyncThunk(
  "waf/addWebhook",
  async (config) => (await axios.post(`${API}/webhooks`, config)).data,
);
export const deleteWebhook = createAsyncThunk(
  "waf/deleteWebhook",
  async (id) => {
    await axios.delete(`${API}/webhooks/${id}`);
    return id;
  },
);
export const toggleWebhook = createAsyncThunk(
  "waf/toggleWebhook",
  async (id) => (await axios.patch(`${API}/webhooks/${id}/toggle`)).data,
);
export const testWebhook = createAsyncThunk(
  "waf/testWebhook",
  async (id) => (await axios.post(`${API}/webhooks/test/${id}`)).data,
);

const wafSlice = createSlice({
  name: "waf",
  initialState: {
    stats: null,
    events: [],
    rules: [],
    banned: [],
    suspicious: [],
    webhooks: [],
    disabledRules: [],
    connected: false,
    loading: false,
    simulationResult: null,
    activeTab: "dashboard",
  },
  reducers: {
    setConnected: (state, action) => {
      state.connected = action.payload;
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    pushEvent: (state, action) => {
      state.events.unshift(action.payload);
      if (state.events.length > 300) state.events = state.events.slice(0, 300);
      if (state.stats) {
        state.stats.totalRequests = (state.stats.totalRequests || 0) + 1;
        if (action.payload.blocked) {
          state.stats.totalBlocked = (state.stats.totalBlocked || 0) + 1;
          const cat = action.payload.category;
          if (cat) {
            state.stats.attacksByCategory = state.stats.attacksByCategory || {};
            state.stats.attacksByCategory[cat] =
              (state.stats.attacksByCategory[cat] || 0) + 1;
          }
          const cc = action.payload.country;
          if (cc && cc !== "XX") {
            state.stats.attacksByCountry = state.stats.attacksByCountry || {};
            state.stats.attacksByCountry[cc] =
              (state.stats.attacksByCountry[cc] || 0) + 1;
          }
        } else {
          state.stats.totalAllowed = (state.stats.totalAllowed || 0) + 1;
        }
        state.stats.blockRate =
          state.stats.totalRequests > 0
            ? (
                (state.stats.totalBlocked / state.stats.totalRequests) *
                100
              ).toFixed(1)
            : "0.0";
      }
    },
    clearSimResult: (state) => {
      state.simulationResult = null;
    },
    toggleRule: (state, action) => {
      const id = action.payload;
      if (state.disabledRules.includes(id))
        state.disabledRules = state.disabledRules.filter((r) => r !== id);
      else state.disabledRules.push(id);
    },
    addCustomRule: (state, action) => {
      state.rules.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStats.fulfilled, (s, a) => {
        s.stats = a.payload;
      })
      .addCase(fetchEvents.fulfilled, (s, a) => {
        s.events = a.payload;
      })
      .addCase(fetchRules.fulfilled, (s, a) => {
        s.rules = a.payload;
      })
      .addCase(fetchBanned.fulfilled, (s, a) => {
        s.banned = a.payload;
      })
      .addCase(fetchSuspicious.fulfilled, (s, a) => {
        s.suspicious = a.payload;
      })
      .addCase(fetchWebhooks.fulfilled, (s, a) => {
        s.webhooks = a.payload;
      })
      .addCase(unbanIP.fulfilled, (s, a) => {
        s.banned = s.banned.filter((b) => b.ip !== a.payload);
      })
      .addCase(simulateAttack.fulfilled, (s, a) => {
        s.simulationResult = a.payload;
      });
  },
});

export const {
  setConnected,
  setActiveTab,
  pushEvent,
  clearSimResult,
  toggleRule,
  addCustomRule,
} = wafSlice.actions;
export default wafSlice.reducer;
