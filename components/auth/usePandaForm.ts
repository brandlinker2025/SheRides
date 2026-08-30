"use client";

import { useCallback, useRef, useState } from "react";
import type { PandaFocusField, PandaMood } from "./panda-types";

export function usePandaForm() {
  const [mood, setMood] = useState<PandaMood>("idle");
  const [track, setTrack] = useState(0);
  const focusRef = useRef<PandaFocusField>(null);

  const onTextFocus = useCallback(() => {
    focusRef.current = "text";
    setMood("look");
  }, []);

  const onTextInput = useCallback((value: string) => {
    focusRef.current = "text";
    setTrack(value.length);
    setMood("track");
  }, []);

  const onPasswordFocus = useCallback((passwordVisible: boolean) => {
    focusRef.current = "password";
    setMood(passwordVisible ? "peek" : "cover");
  }, []);

  const onPasswordVisibility = useCallback((passwordVisible: boolean) => {
    focusRef.current = "password";
    setMood(passwordVisible ? "peek" : "cover");
  }, []);

  const onBlur = useCallback(() => {
    focusRef.current = null;
    setMood((current) => (current === "sad" || current === "happy" ? current : "idle"));
  }, []);

  const onError = useCallback(() => {
    setMood("sad");
  }, []);

  const onSuccess = useCallback(() => {
    setMood("happy");
  }, []);

  return {
    mood,
    track,
    onTextFocus,
    onTextInput,
    onPasswordFocus,
    onPasswordVisibility,
    onBlur,
    onError,
    onSuccess,
  };
}
