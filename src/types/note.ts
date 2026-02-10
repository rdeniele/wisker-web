export interface Note {
  id: string;
  title: string;
  rawContent: string;
  subjectId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  subject?: {
    id: string;
    title: string;
  } | null;
}

export interface Subject {
  id: string;
  title: string;
}
