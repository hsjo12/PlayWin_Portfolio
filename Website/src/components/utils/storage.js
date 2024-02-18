"use client";

export const saveUserAddress = (userAddress) => {
  if (typeof window != undefined) {
    window.sessionStorage.setItem("userAddress", userAddress);
  }
};
export const getUserAddress = () => {
  if (typeof window !== "undefined") {
    return window.sessionStorage.getItem("userAddress");
  }
};
export const clearUserAddress = () => {
  window.sessionStorage.clear();
};
