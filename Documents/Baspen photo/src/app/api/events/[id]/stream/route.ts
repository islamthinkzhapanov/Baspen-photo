import { NextRequest } from "next/server";
import {
  createSubscriber,
  matchChannel,
  photoReadyChannel,
  type MatchNotification,
  type PhotoReadyNotification,
} from "@/lib/realtime/redis-pubsub";

/**
 * GET /api/events/[id]/stream — Server-Sent Events for realtime updates.
 *
 * Query params:
 * - sessionToken: participant session token (filters match events to this participant)
 *
 * Events emitted:
 * - "photo-ready": new photo processed in this event
 * - "match": new photo matched to this participant's face
 * - "ping": keepalive every 30s
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const sessionToken = request.nextUrl.searchParams.get("sessionToken");

  const subscriber = createSubscriber();
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Stream closed
          closed = true;
        }
      }

      // Keepalive ping every 30s
      const pingInterval = setInterval(() => {
        send("ping", { time: Date.now() });
      }, 30_000);

      // Subscribe to channels
      const channels = [photoReadyChannel(eventId)];
      if (sessionToken) {
        channels.push(matchChannel(eventId));
      }

      subscriber.on("message", (channel: string, message: string) => {
        if (channel === photoReadyChannel(eventId)) {
          const data = JSON.parse(message) as PhotoReadyNotification;
          send("photo-ready", data);
        } else if (channel === matchChannel(eventId) && sessionToken) {
          const data = JSON.parse(message) as MatchNotification;
          // Only send match events for this participant's session
          if (data.participantSessionToken === sessionToken) {
            send("match", {
              photoId: data.photoId,
              thumbnailPath: data.thumbnailPath,
              watermarkedPath: data.watermarkedPath,
              similarity: data.similarity,
              width: data.width,
              height: data.height,
            });
          }
        }
      });

      await subscriber.subscribe(...channels);

      // Send initial connected event
      send("connected", { eventId, channels: channels.length });

      // Cleanup on abort
      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(pingInterval);
        subscriber.unsubscribe().then(() => subscriber.quit());
        controller.close();
      });
    },
    cancel() {
      closed = true;
      subscriber.unsubscribe().then(() => subscriber.quit());
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
