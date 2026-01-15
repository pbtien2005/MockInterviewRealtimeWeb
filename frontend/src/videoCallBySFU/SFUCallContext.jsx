import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  Children,
} from "react";

const SFUCallContext = createContext();

export const useSFUCall = () => {
  const ctx = useContext(SFUCallContext);
  if (!ctx) throw new Error("useSFUCall must be inside SFUCallProvider");
  return ctx;
};
export const SFUCallProvider = ({ children }) => {
  const value = {};
  return (
    <SFUCallContext.Provider value={value}>{children}</SFUCallContext.Provider>
  );
};
