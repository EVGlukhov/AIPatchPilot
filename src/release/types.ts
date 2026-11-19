export interface CommitRecord {
  sha: string;
  message: string;
  author: string;
  url: string;
}

export interface PullRequestRecord {
  number: number;
  title: string;
  author: string | null;
  url: string;
  mergedAt: string;
}

export const CHANGED_FILE_STATUS = {
  ADDED: "added",
  MODIFIED: "modified",
  DELETED: "deleted",
  RENAMED: "renamed",
} as const;

export type ChangedFileStatus =
  (typeof CHANGED_FILE_STATUS)[keyof typeof CHANGED_FILE_STATUS];

export interface ChangedFile {
  path: string;
  status: ChangedFileStatus;
  previousPath?: string;
}

export interface ReleaseReportData {
  repository: string;
  currentTag: string;
  previousTag: string | null;
  commits: CommitRecord[];
  pullRequests: PullRequestRecord[];
  files: ChangedFile[];
}
