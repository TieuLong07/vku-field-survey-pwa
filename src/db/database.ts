import Dexie, { type Table } from 'dexie';
import type { SurveyRecord } from '../types/survey';

export class SurveyDatabase extends Dexie {
  surveys!: Table<SurveyRecord, number>;

  constructor() {
    super('VKUSurveyDB');
    this.version(1).stores({
      surveys: '++id, uuid, building, equipment, condition, status, createdAt'
    });
  }
}

export const db = new SurveyDatabase();

// Database helper functions
export const getUnsyncedSurveys = async (): Promise<SurveyRecord[]> => {
  return await db.surveys.where('status').equals('pending').toArray();
};

export const getPendingCount = async (): Promise<number> => {
  return await db.surveys.where('status').equals('pending').count();
};

export const getAllSurveys = async (): Promise<SurveyRecord[]> => {
  return await db.surveys.orderBy('id').reverse().toArray();
};

export const addSurvey = async (survey: Omit<SurveyRecord, 'id'>): Promise<number> => {
  return await db.surveys.add(survey as SurveyRecord);
};

export const markSurveysAsSynced = async (ids: number[]): Promise<void> => {
  const now = new Date().toISOString();
  await db.transaction('rw', db.surveys, async () => {
    for (const id of ids) {
      await db.surveys.update(id, {
        status: 'synced',
        syncedAt: now
      });
    }
  });
};

export const deleteSurvey = async (id: number): Promise<void> => {
  await db.surveys.delete(id);
};

export const clearSyncedSurveys = async (): Promise<number> => {
  const synced = await db.surveys.where('status').equals('synced').toArray();
  const ids = synced.map(s => s.id!).filter(Boolean);
  await db.surveys.bulkDelete(ids);
  return ids.length;
};
