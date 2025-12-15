import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export function useBondingCurve(datasetId: string) {
  const [price, setPrice] = useState<string>("0");
  const [marketCap, setMarketCap] = useState<string>("0");
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!datasetId) return;
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL!, {
      transports: ["websocket"],
    });

    newSocket.on("connect", () => {
      newSocket.emit("subscribe", `bonding:${datasetId}`);
    });

    newSocket.on(`bonding:${datasetId}`, (data: any) => {
      try {
        if (
          data?.type === "trade" ||
          data?.type === "buy" ||
          data?.type === "sell"
        ) {
          // data.data may contain trade or price info
          const payload = data.data || data;
          if (payload.price) setPrice(payload.price);
          if (payload.marketCap) setMarketCap(payload.marketCap);
        } else if (data?.type === "graduation" || data?.type === "graduated") {
          alert("🎓 Congratulations! Your dataset graduated to Uniswap!");
        }
      } catch (e) {
        // ignore
      }
    });

    setSocket(newSocket);

    return () => {
      try {
        newSocket.disconnect();
      } catch (e) {
        // noop
      }
    };
  }, [datasetId]);

  return { price, marketCap, socket };
}
