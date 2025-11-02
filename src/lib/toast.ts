// src/lib/toast.ts
import { toast as rtToast, type ToastOptions } from 'react-toastify';

const base: ToastOptions = {
  position: 'top-right',
  autoClose: 2800,
  pauseOnHover: true,
  draggable: true,
  closeOnClick: true,
};

export function toastSuccess(msg: string, opts?: ToastOptions) {
  rtToast.success(msg, { ...base, ...opts });
}
export function toastError(msg: string, opts?: ToastOptions) {
  rtToast.error(msg, { ...base, ...opts });
}
export function toastInfo(msg: string, opts?: ToastOptions) {
  rtToast.info(msg, { ...base, ...opts });
}
export function toastWarn(msg: string, opts?: ToastOptions) {
  rtToast.warn(msg, { ...base, ...opts });
}

export const toast = rtToast;
