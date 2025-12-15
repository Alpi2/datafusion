import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getAuthToken } from "@/lib/auth";

type Handlers = {
  onEarningsUpdate?: (payload: any) => void;
};

export default function useEarningsSocket(
  userId: string | null,
  handlers: Handlers = {}
) {
  const { onEarningsUpdate } = handlers;
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    const token = getAuthToken();
    if (!token) {
      // no token — cannot open authenticated socket
      return;
    }

    const url =
      (process.env.NEXT_PUBLIC_SOCKET_IO_URL as string) ||
      window.location.origin;
    const socket = io(url, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
    });
    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("earnings:update", (data: any) => {
      try {
        if (onEarningsUpdate) onEarningsUpdate(data);
      } catch (e) {
        // ignore handler errors
      }
    });

    socket.on("connect_error", () => {
      // if socket cannot connect, start polling fallback
      if (pollRef.current == null) {
        // run a poll every 30s via dashboardClient (lazy import)
        // store interval id
        const id = window.setInterval(async () => {
          try {
            const client = await import("@/lib/api/dashboardClient");
            if (client && client.getEarningsSummary) {
              const summary = await client.getEarningsSummary(userId);
              if (onEarningsUpdate) onEarningsUpdate({ summary });
            }
          } catch (e) {
            // ignore polling errors
          }
        }, 30 * 1000);
        pollRef.current = id as unknown as number;
      }
    });

    return () => {
      try {
        if (socketRef.current) socketRef.current.disconnect();
        if (pollRef.current != null) window.clearInterval(pollRef.current);
      } catch (e) {
        // noop
      }
    };
  }, [userId]);

  return { connected };
}
