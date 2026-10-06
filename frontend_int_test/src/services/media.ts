import { apiRequest } from "./client";

export interface Media {
  id: string;
  uid: string;
  data: {
    cloudinaryPublicId: string;
    url: string;
    resourceType: string;
    format?: string;
    width?: number;
    height?: number;
  };
  created_at: unknown;
  type: string;
}

export async function uploadProfilePicture(file: File): Promise<Media> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", "profile_picture");
  return apiRequest<Media>("/media/upload", { method: "POST", body: formData });
}

export async function getMediaById(id: string): Promise<Media> {
  return apiRequest<Media>(`/media/${encodeURIComponent(id)}`);
}
