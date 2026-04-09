import {
  RekognitionClient,
  CreateCollectionCommand,
  DeleteCollectionCommand,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  SearchFacesCommand,
  DeleteFacesCommand,
} from "@aws-sdk/client-rekognition";

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const SIMILARITY_THRESHOLD = parseFloat(
  process.env.FACE_SIMILARITY_THRESHOLD || "80"
);

export function getCollectionId(eventId: string): string {
  return `baspen-${eventId}`;
}

export async function createCollection(collectionId: string) {
  await rekognition.send(
    new CreateCollectionCommand({ CollectionId: collectionId })
  );
}

export async function deleteCollection(collectionId: string) {
  try {
    await rekognition.send(
      new DeleteCollectionCommand({ CollectionId: collectionId })
    );
  } catch (err: unknown) {
    // Collection may not exist — ignore
    if (
      err instanceof Error &&
      err.name === "ResourceNotFoundException"
    ) {
      return;
    }
    throw err;
  }
}

interface IndexedFace {
  faceId: string;
  boundingBox: { x: number; y: number; w: number; h: number };
  confidence: number;
}

/**
 * Index faces in an image into a Rekognition collection.
 * `externalImageId` is stored alongside each face so we can map results back
 * to photos or participants (e.g. photoId or "selfie-{participantId}").
 */
export async function indexFaces(
  collectionId: string,
  imageBytes: Buffer,
  externalImageId: string
): Promise<IndexedFace[]> {
  const response = await rekognition.send(
    new IndexFacesCommand({
      CollectionId: collectionId,
      Image: { Bytes: imageBytes },
      ExternalImageId: externalImageId,
      MaxFaces: 10,
      QualityFilter: "AUTO",
      DetectionAttributes: ["DEFAULT"],
    })
  );

  if (!response.FaceRecords) return [];

  return response.FaceRecords.map((record) => {
    const bb = record.Face!.BoundingBox!;
    return {
      faceId: record.Face!.FaceId!,
      boundingBox: {
        x: bb.Left ?? 0,
        y: bb.Top ?? 0,
        w: bb.Width ?? 0,
        h: bb.Height ?? 0,
      },
      confidence: (record.Face!.Confidence ?? 0) / 100, // normalize to 0-1
    };
  });
}

interface FaceMatch {
  faceId: string;
  externalImageId: string;
  similarity: number;
}

/**
 * Search a collection for faces matching the provided image.
 * Used when a user uploads a selfie to find their photos.
 */
export async function searchFacesByImage(
  collectionId: string,
  imageBytes: Buffer,
  maxFaces = 200,
  threshold?: number
): Promise<FaceMatch[]> {
  const response = await rekognition.send(
    new SearchFacesByImageCommand({
      CollectionId: collectionId,
      Image: { Bytes: imageBytes },
      MaxFaces: maxFaces,
      FaceMatchThreshold: threshold ?? SIMILARITY_THRESHOLD,
    })
  );

  if (!response.FaceMatches) return [];

  return response.FaceMatches.map((match) => ({
    faceId: match.Face!.FaceId!,
    externalImageId: match.Face!.ExternalImageId!,
    similarity: (match.Similarity ?? 0) / 100, // normalize to 0-1
  }));
}

/**
 * Search a collection for faces matching a known FaceId.
 * Used for participant matching — when a new photo is processed,
 * we search its faces against participant selfies already in the collection.
 */
export async function searchFaces(
  collectionId: string,
  faceId: string,
  maxFaces = 100,
  threshold?: number
): Promise<FaceMatch[]> {
  const response = await rekognition.send(
    new SearchFacesCommand({
      CollectionId: collectionId,
      FaceId: faceId,
      MaxFaces: maxFaces,
      FaceMatchThreshold: threshold ?? SIMILARITY_THRESHOLD,
    })
  );

  if (!response.FaceMatches) return [];

  return response.FaceMatches.map((match) => ({
    faceId: match.Face!.FaceId!,
    externalImageId: match.Face!.ExternalImageId!,
    similarity: (match.Similarity ?? 0) / 100, // normalize to 0-1
  }));
}

/**
 * Delete specific faces from a collection.
 * Used when photos are deleted or when a participant re-takes their selfie.
 */
export async function deleteFaces(
  collectionId: string,
  faceIds: string[]
) {
  if (faceIds.length === 0) return;

  await rekognition.send(
    new DeleteFacesCommand({
      CollectionId: collectionId,
      FaceIds: faceIds,
    })
  );
}
