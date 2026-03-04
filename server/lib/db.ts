import { MongoClient } from 'mongodb';
import { getRuntimeConfig } from './env.js';

type GlobalWithMongo = typeof globalThis & {
  _mongoClient?: MongoClient;
  _mongoDb?: Awaited<ReturnType<MongoClient['db']>>;
  _mongoConnectPromise?: Promise<Awaited<ReturnType<MongoClient['db']>>>;
};

const globalForMongo = globalThis as GlobalWithMongo;

export async function getDatabase() {
  const { MONGO_URI } = getRuntimeConfig();

  if (globalForMongo._mongoDb) {
    return globalForMongo._mongoDb;
  }

  if (!globalForMongo._mongoConnectPromise) {
    const client = new MongoClient(MONGO_URI);
    globalForMongo._mongoClient = client;
    globalForMongo._mongoConnectPromise = client.connect().then((connected) => {
      const db = connected.db();
      globalForMongo._mongoDb = db;
      console.log('[startup] Connected to MongoDB Atlas');
      return db;
    }).catch((error) => {
      globalForMongo._mongoConnectPromise = undefined;
      globalForMongo._mongoClient = undefined;
      throw error;
    });
  }

  return globalForMongo._mongoConnectPromise;
}
