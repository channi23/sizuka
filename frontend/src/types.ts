/** A single turn in a recruiter ↔ candidate conversation thread. */
export interface ConversationTurn {
  role?: string;   // Python shape: "recruiter" | "candidate"
  from?: string;   // legacy shape
  content?: string;
  body?: string;   // legacy shape
  timestamp?: string;
  time?: string;   // legacy shape
}

export interface APIJob {
  id: string;
  companyName: string;
  jdRaw: string;
  status: string;
  createdAt: string;
  candidateCount: number;
  matchAvg: number;
  emailsSent: number;
  replies: number;
}

export interface APICandidate {
  id: string;
  jobId: string;
  name: string | null;
  email: string | null;
  source: string | null;
  profileUrl: string | null;
  matchScore: number | null;
  interestScore: number | null;
  finalScore: number | null;
  matchExplanation: string | null;
  interestExplanation: string | null;
  skillsMatched: string[] | null;
  skillsMissing: string[] | null;
  emailStatus: string | null;
  outreachBody: string | null;
  outreachSubject: string | null;
  replyText: string | null;
  conversationHistory: ConversationTurn[] | null;
  conversationTurns: number;
  createdAt: string;
  computedScore?: number;
  job?: { id: string; companyName: string };
}

export interface APIPipelineEvent {
  id: number;
  jobId: string;
  stage: string | null;
  message: string | null;
  createdAt: string;
}

export interface UICandidate {
  id: string;
  jobId: string;
  name: string;
  email: string;
  source: string;
  profileUrl: string;
  matchScore: number;
  interestScore: number;
  finalScore: number;
  matchExplanation: string;
  interestExplanation: string;
  skillsMatched: string[];
  skillsMissing: string[];
  emailStatus: string;
  outreachBody: string;
  replyText: string;
  conversationHistory: ConversationTurn[] | null;
  createdAt: string;
  avatarHue: number;
  rank: number;
  companyName?: string;
}

export function toUICandidate(c: APICandidate, rank = 0): UICandidate {
  const hash = c.id.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return {
    id: c.id,
    jobId: c.jobId,
    name: c.name ?? 'Unknown',
    email: c.email ?? '',
    source: c.source ?? 'GitHub',
    profileUrl: c.profileUrl ?? '',
    matchScore: Math.round((c.matchScore ?? 0) * 100),
    interestScore: Math.round((c.interestScore ?? 0) * 100),
    finalScore: Math.round((c.finalScore ?? 0) * 100),
    matchExplanation: c.matchExplanation ?? '',
    interestExplanation: c.interestExplanation ?? '',
    skillsMatched: (c.skillsMatched as string[] | null) ?? [],
    skillsMissing: (c.skillsMissing as string[] | null) ?? [],
    emailStatus: c.emailStatus ?? 'pending',
    outreachBody: c.outreachBody ?? '',
    replyText: c.replyText ?? '',
    conversationHistory: c.conversationHistory,
    createdAt: c.createdAt,
    avatarHue: hash % 360,
    rank,
    companyName: c.job?.companyName,
  };
}
