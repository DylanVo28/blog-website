import axios from "axios";
import type { ApiErrorResponse } from "@/types/api.types";

export function getApiErrorMessage(
  error: unknown,
  fallback: string = "Đã có lỗi xảy ra. Vui lòng thử lại.",
) {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const apiMessage = error.response?.data?.message;

    if (Array.isArray(apiMessage) && apiMessage.length > 0) {
      return apiMessage[0];
    }

    if (typeof apiMessage === "string" && apiMessage.trim().length > 0) {
      return apiMessage;
    }

    if (typeof error.message === "string" && error.message.trim().length > 0) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

export function isUnauthorizedError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401;
}
