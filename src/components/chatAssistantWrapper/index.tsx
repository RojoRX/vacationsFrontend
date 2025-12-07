"use client";

import { usePathname } from "next/navigation";
import ChatAssistant from "../chatAssistant";

export default function ChatAssistantWrapper() {
  const pathname = usePathname();

  // Rutas donde NO queremos mostrar el chat
  const HIDDEN_ROUTES = ["/login", "/register", "/auth"];

  const shouldHide = HIDDEN_ROUTES.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (shouldHide) return null;

  return <ChatAssistant />;
}
