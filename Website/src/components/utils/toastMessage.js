import { toast } from "react-toastify";

export function toastMessage(message, type, time = 5000) {
  if (type === "success")
    return toast.success(message, {
      position: "top-center",
      autoClose: time,
      className: "toastMessage  Toastify__close-button--light",
    });
  else if (type === "error")
    return toast.error(message, {
      position: "top-center",
      autoClose: time,
      className: "toastMessage  Toastify__close-button--light",
    });
  else if (type === "info")
    return toast.info(message, {
      position: "top-center",
      autoClose: time,
      className: "toastMessage  Toastify__close-button--light",
    });
  else if (type === "warn")
    return toast.warn(message, {
      position: "top-center",
      autoClose: time,
      className: "toastMessage  Toastify__close-button--light",
    });
  else if (type === "dismiss") return toast.dismiss(message);
  else
    return toast(message, {
      position: "top-center",
      autoClose: time,
      className: "toastMessage  Toastify__close-button--light",
    });
}

export const txMessage = async (tx) => {
  const toastId = toastMessage("Transaction is sending...", "info", 600000);
  await tx.wait().then(async (receipt) => {
    if (receipt && receipt.status == 1) {
      toastMessage(toastId, "dismiss");
      toastMessage("Transaction is successful", "success");
    } else {
      toastMessage(toastId, "dismiss");
      toastMessage("Transaction is failed", "error");
    }
  });
};
