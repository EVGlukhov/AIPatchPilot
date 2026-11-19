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

export interface ChangedFile {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed";
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
