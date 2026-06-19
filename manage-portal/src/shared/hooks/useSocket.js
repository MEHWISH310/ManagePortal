import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

let socketInstance = null;

// Singleton — one connection for the whole app
function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports:       ["websocket", "polling"],
      autoConnect:      true,
      reconnection:     true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
  }
  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

/**
 * useSocket — joins role rooms and subscribes to events
 *
 * @param {string} role    - "admin" | "employee"
 * @param {string} userId  - logged-in user's _id
 * @param {object} events  - { "event:name": handlerFn }
 */
export function useSocket(role, userId, events = {}) {
  const socket = getSocket();
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    if (!role || !userId) return;

    // Join role + personal rooms
    const onConnect = () => {
      socket.emit("join", { role, userId });
    };

    if (socket.connected) {
      socket.emit("join", { role, userId });
    } else {
      socket.on("connect", onConnect);
    }

    // Subscribe to all events
    const handlers = {};
    Object.entries(eventsRef.current).forEach(([event, fn]) => {
      handlers[event] = (data) => fn(data);
      socket.on(event, handlers[event]);
    });

    return () => {
      socket.off("connect", onConnect);
      Object.entries(handlers).forEach(([event, fn]) => {
        socket.off(event, fn);
      });
    };
  }, [role, userId]);

  return socket;
}