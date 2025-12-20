"use client";

import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import Cookies from "js-cookie";

interface SessionIdProps {
  setSessionId: (id: string) => void;
}

export default function SessionId({ setSessionId }: SessionIdProps) {
  useEffect(() => {
    const currentSessionId = localStorage.getItem("session_id") || uuidv4();
    if (!localStorage.getItem("session_id")) {
      localStorage.setItem("session_id", currentSessionId);
    }

    console.log('[SessionId] Setting session_id:', currentSessionId);

    // Also set as cookie for server-side access
    Cookies.set('session_id', currentSessionId, {
      expires: 365, // 1 year
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });

    console.log('[SessionId] Cookie set, verifying:', Cookies.get('session_id'));

    setSessionId(currentSessionId);
  }, [setSessionId]);

  return null;
}
