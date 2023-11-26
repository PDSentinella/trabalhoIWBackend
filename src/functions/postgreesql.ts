import { Client, QueryResult } from 'pg';

const connectionString = 'postgres://citus:chocolateCbanana945@c-trabalhoiw.dewsyiqyc5djkh.postgres.cosmos.azure.com:5432/citus?sslmode=require';

class PostgresConnection {
  private client: Client;

  constructor() {
    this.client = new Client(connectionString);
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.log('Connected to PostgreSQL database');
    } catch (error) {
      console.error('Error connecting to PostgreSQL database:', error);
      throw error; // Propagate the error for handling in the calling code
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.end();
      console.log('Connection to PostgreSQL closed');
    } catch (error) {
      console.error('Error closing connection to PostgreSQL database:', error);
      throw error;
    }
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    try {
      const result = await this.client.query(sql, params);
      return result;
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }
}

export default PostgresConnection;
