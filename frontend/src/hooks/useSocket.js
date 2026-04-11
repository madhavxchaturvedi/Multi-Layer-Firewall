// hooks/useSocket.js
// Socket.io → Redux bridge + toast notifications for critical events
import { useEffect } from "react";
import { io } from "socket.io-client";
import { useDispatch } from "react-redux";
import { pushEvent, setConnected } from "../store/wafSlice";
import { useToast } from "../components/Toast";

let socket = null;

export function useSocket() {
  const dispatch = useDispatch();
  const { push } = useToast();

  useEffect(() => {
    const s = io("http://localhost:4000", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
    socket = s;

    s.on("connect", () => {
      dispatch(setConnected(true));
      push({
        type: "success",
        title: "Connected",
        message: "WAF backend is live — real-time feed active.",
        duration: 3000,
      });
    });

    s.on("disconnect", (reason) => {
      dispatch(setConnected(false));
      if (reason !== "io client disconnect") {
        push({
          type: "error",
          title: "Disconnected",
          message: "Lost connection to WAF backend.",
          duration: 4000,
        });
      }
    });

    s.on("waf:event", (event) => {
      dispatch(pushEvent(event));

      // Toast for critical/high blocked events only
      if (
        event.blocked &&
        (event.severity === "critical" || event.severity === "high")
      ) {
        push({
          type: event.severity,
          title: `${event.severity?.toUpperCase()} — ${event.ruleName || event.category || "Attack"} Blocked`,
          message: `${event.ip} → ${event.url}`,
          sub: event.country ? `Origin: ${event.country}` : undefined,
          duration: event.severity === "critical" ? 7000 : 5000,
        });
      }
    });

    return () => {
      s.removeAllListeners();
      s.disconnect();
      if (socket === s) socket = null;
      dispatch(setConnected(false));
    };
  }, [dispatch, push]);
}
