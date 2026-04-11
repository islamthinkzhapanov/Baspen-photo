"use client";

import { useMemo } from "react";
import { RiExternalLinkLine, RiLoader4Line } from "@remixicon/react";
import { useClient } from "@/hooks/useClients";
import { PhotoUpload } from "@/components/clients/PhotoUpload";
import { PhotoGallery } from "@/components/clients/PhotoGallery";

interface AppointmentPhotosTabProps {
  clientId: string;
  appointmentId: string;
}

export function AppointmentPhotosTab({ clientId, appointmentId }: AppointmentPhotosTabProps) {
  const { data: client, isLoading } = useClient(clientId);

  const appointmentPhotos = useMemo(
    () => (client?.photos ?? []).filter((p) => p.appointmentId === appointmentId),
    [client?.photos, appointmentId]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RiLoader4Line className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Upload */}
      <PhotoUpload clientId={clientId} appointmentId={appointmentId} />

      {/* Gallery for this appointment */}
      {appointmentPhotos.length > 0 ? (
        <PhotoGallery photos={appointmentPhotos} />
      ) : (
        <p className="text-center text-sm text-gray-400 py-4">
          Нет фотографий для этого визита
        </p>
      )}

      {/* Link to full client gallery */}
      <a
        href={`/clients/${clientId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors py-2"
      >
        Все фото клиента
        <RiExternalLinkLine className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
