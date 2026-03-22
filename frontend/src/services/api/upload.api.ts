import apiClient from "@/services/api/client";
import type { ApiResponse } from "@/types/api.types";

interface UploadConfig {
  provider: string;
  bucket: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
}

export interface UploadResult {
  url: string;
  mode: "uploaded";
}

export const uploadApi = {
  async getConfig() {
    const response = await apiClient.get<ApiResponse<UploadConfig>>("/upload/config");
    return response.data.data;
  },

  async uploadFile(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<ApiResponse<UploadResult>>(
      "/upload/images",
      formData,
    );

    return response.data.data;
  },
};
