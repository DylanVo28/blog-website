import apiClient from "@/services/api/client";
import type { ApiResponse } from "@/types/api.types";

interface UploadSession {
  uploadId: string;
  fileName: string;
  contentType: string;
  uploadUrl: string;
  expiresInSeconds: number;
}

interface UploadConfig {
  provider: string;
  bucket: string;
}

export interface UploadResult {
  url: string;
  mode: "uploaded" | "mock";
}

export const uploadApi = {
  async getConfig() {
    const response = await apiClient.get<ApiResponse<UploadConfig>>("/upload/config");
    return response.data.data;
  },

  async presign(file: File) {
    const response = await apiClient.post<ApiResponse<UploadSession>>("/upload/presign", {
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
    });

    return response.data.data;
  },

  async uploadFile(file: File): Promise<UploadResult> {
    const session = await this.presign(file);

    try {
      const uploadUrl = new URL(session.uploadUrl);

      if (uploadUrl.hostname === "storage.example.com") {
        return {
          url: session.uploadUrl,
          mode: "mock",
        };
      }
    } catch {
      return {
        url: session.uploadUrl,
        mode: "mock",
      };
    }

    const response = await fetch(session.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error("Không thể tải ảnh lên storage.");
    }

    return {
      url: session.uploadUrl,
      mode: "uploaded",
    };
  },
};
