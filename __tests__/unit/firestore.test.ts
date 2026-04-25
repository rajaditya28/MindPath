import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { COLLECTIONS, getDocument, queryByUser, saveDocument } from '@/lib/firestore';

const mockSet = jest.fn<() => Promise<void>>();
const mockGetDoc = jest.fn<() => Promise<{ exists: boolean; id: string; data: () => Record<string, unknown> }>>();
const mockGetQuery = jest.fn<() => Promise<{ docs: Array<{ id: string; data: () => Record<string, unknown> }> }>>();
const mockDoc = jest.fn<(id: string) => { set: typeof mockSet; get: typeof mockGetDoc }>();
const mockLimit = jest.fn<(limit: number) => { get: typeof mockGetQuery }>();
const mockWhere = jest.fn<(field: string, operator: string, value: unknown) => { limit: typeof mockLimit }>();
const mockCollection = jest.fn<(collection: string) => { doc: typeof mockDoc; where: typeof mockWhere }>();

jest.mock('@/lib/firebase-admin', () => ({
  getDb: () => ({
    collection: mockCollection,
  }),
}));

describe('Firestore helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSet.mockResolvedValue(undefined);
    mockDoc.mockReturnValue({ set: mockSet, get: mockGetDoc });
    mockLimit.mockReturnValue({ get: mockGetQuery });
    mockWhere.mockReturnValue({ limit: mockLimit });
    mockCollection.mockReturnValue({ doc: mockDoc, where: mockWhere });
  });

  it('saves documents with merge enabled through Firebase Admin', async () => {
    const data = { title: 'Machine Learning', userId: 'user-1' };

    await saveDocument(COLLECTIONS.LEARNING_PATHS, 'path-1', data);

    expect(mockCollection).toHaveBeenCalledWith('learning_paths');
    expect(mockDoc).toHaveBeenCalledWith('path-1');
    expect(mockSet).toHaveBeenCalledWith(data, { merge: true });
  });

  it('returns a document when it exists', async () => {
    mockGetDoc.mockResolvedValue({
      exists: true,
      id: 'path-1',
      data: () => ({ title: 'Saved Path', userId: 'user-1' }),
    });

    const result = await getDocument<{ id: string; title: string }>(COLLECTIONS.LEARNING_PATHS, 'path-1');

    expect(result).toEqual({ id: 'path-1', title: 'Saved Path', userId: 'user-1' });
  });

  it('returns null for missing documents', async () => {
    mockGetDoc.mockResolvedValue({
      exists: false,
      id: 'missing',
      data: () => ({}),
    });

    await expect(getDocument(COLLECTIONS.LEARNING_PATHS, 'missing')).resolves.toBeNull();
  });

  it('queries user documents and sorts newest first', async () => {
    mockGetQuery.mockResolvedValue({
      docs: [
        { id: 'old', data: () => ({ createdAt: '2026-04-25T08:00:00.000Z', userId: 'user-1' }) },
        { id: 'new', data: () => ({ createdAt: '2026-04-25T09:00:00.000Z', userId: 'user-1' }) },
      ],
    });

    const results = await queryByUser(COLLECTIONS.LEARNING_PATHS, 'user-1', 10);

    expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'user-1');
    expect(mockLimit).toHaveBeenCalledWith(10);
    expect(results.map((doc) => doc.id)).toEqual(['new', 'old']);
  });
});
