export interface ApiResponse<T = unknown> {
  status: number;
  data: T;
}

export interface FirebaseRecord {
  id: string;
  title?: string;
  [key: string]: unknown;
}
