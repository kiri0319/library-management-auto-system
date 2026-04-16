import { createContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [liveNotifications, setLiveNotifications] = useState([]);
  const [liveActivities, setLiveActivities] = useState([]);
  const [stockUpdate, setStockUpdate] = useState(null);
  const [reservationReady, setReservationReady] = useState(null);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      return undefined;
    }

    const socketClient = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
    });

    socketClient.on("notification:new", (payload) => {
      setLiveNotifications((current) => [payload, ...current].slice(0, 20));
    });

    socketClient.on("activity:new", (payload) => {
      setLiveActivities((current) => [payload, ...current].slice(0, 20));
    });

    socketClient.on("book:stock-updated", (payload) => {
      setStockUpdate(payload);
    });

    socketClient.on("reservation:ready", (payload) => {
      setReservationReady(payload);
    });

    setSocket(socketClient);

    return () => {
      socketClient.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        liveNotifications,
        liveActivities,
        stockUpdate,
        reservationReady,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

