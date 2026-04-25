// Google Cloud service clients for Text-to-Speech, Translate, Vision, NLP, YouTube, Storage

import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { TranslationServiceClient } from '@google-cloud/translate';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { LanguageServiceClient } from '@google-cloud/language';
import { Storage } from '@google-cloud/storage';
import { google } from 'googleapis';

// ============ TEXT-TO-SPEECH ============
let ttsClient: TextToSpeechClient | null = null;

function getTTSClient(): TextToSpeechClient {
  if (!ttsClient) {
    ttsClient = new TextToSpeechClient();
  }
  return ttsClient;
}

export async function synthesizeSpeech(text: string, languageCode = 'en-US'): Promise<Buffer> {
  const client = getTTSClient();
  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: { languageCode, ssmlGender: 'NEUTRAL' as const },
    audioConfig: { audioEncoding: 'MP3' as const },
  });
  return Buffer.from(response.audioContent as Uint8Array);
}

// ============ TRANSLATE ============
let translateClient: TranslationServiceClient | null = null;

function getTranslateClient(): TranslationServiceClient {
  if (!translateClient) {
    translateClient = new TranslationServiceClient();
  }
  return translateClient;
}

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  const client = getTranslateClient();
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const [response] = await client.translateText({
    parent: `projects/${projectId}/locations/global`,
    contents: [text],
    targetLanguageCode: targetLanguage,
    mimeType: 'text/plain',
  });
  return response.translations?.[0]?.translatedText || text;
}

// ============ VISION AI ============
let visionClient: ImageAnnotatorClient | null = null;

function getVisionClient(): ImageAnnotatorClient {
  if (!visionClient) {
    visionClient = new ImageAnnotatorClient();
  }
  return visionClient;
}

export async function analyzeImage(imageBuffer: Buffer): Promise<{
  labels: string[];
  text: string;
  description: string;
}> {
  const client = getVisionClient();
  const [labelResult] = await client.labelDetection({ image: { content: imageBuffer } });
  const [textResult] = await client.textDetection({ image: { content: imageBuffer } });

  const labels = labelResult.labelAnnotations?.map((l) => l.description || '') || [];
  const text = textResult.textAnnotations?.[0]?.description || '';

  return {
    labels: labels.filter(Boolean),
    text,
    description: labels.slice(0, 5).join(', '),
  };
}

// ============ NATURAL LANGUAGE ============
let nlpClient: LanguageServiceClient | null = null;

function getNLPClient(): LanguageServiceClient {
  if (!nlpClient) {
    nlpClient = new LanguageServiceClient();
  }
  return nlpClient;
}

export async function analyzeContent(text: string): Promise<{
  sentiment: number;
  entities: Array<{ name: string; type: string }>;
  categories: string[];
}> {
  const client = getNLPClient();

  const document = { content: text, type: 'PLAIN_TEXT' as const };

  const [sentimentResult] = await client.analyzeSentiment({ document });
  const [entityResult] = await client.analyzeEntities({ document });

  const sentiment = sentimentResult.documentSentiment?.score || 0;
  const entities = (entityResult.entities || []).map((e) => ({
    name: e.name || '',
    type: String(e.type || 'UNKNOWN'),
  }));

  return { sentiment, entities, categories: [] };
}

// ============ YOUTUBE DATA API ============
export async function searchYouTubeVideos(query: string, maxResults = 5): Promise<Array<{
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
}>> {
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.GEMINI_API_KEY;
  const youtube = google.youtube({ version: 'v3', auth: apiKey });

  const response = await youtube.search.list({
    part: ['snippet'],
    q: `${query} tutorial education`,
    type: ['video'],
    maxResults,
    videoEmbeddable: 'true',
    relevanceLanguage: 'en',
    safeSearch: 'strict',
  });

  return (response.data.items || []).map((item) => ({
    videoId: item.id?.videoId || '',
    title: item.snippet?.title || '',
    description: item.snippet?.description || '',
    thumbnail: item.snippet?.thumbnails?.medium?.url || '',
    channelTitle: item.snippet?.channelTitle || '',
  }));
}

// ============ CLOUD STORAGE ============
let storageClient: Storage | null = null;

function getStorageClient(): Storage {
  if (!storageClient) {
    storageClient = new Storage();
  }
  return storageClient;
}

export async function uploadToStorage(
  bucketName: string,
  fileName: string,
  data: Buffer,
  contentType: string
): Promise<string> {
  const storage = getStorageClient();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);

  await file.save(data, { contentType, resumable: false });
  await file.makePublic();

  return `https://storage.googleapis.com/${bucketName}/${fileName}`;
}
