import { IHttpClient } from "../core/http/types.js";
import { httpClient } from "../core/http/coliviHttpClient.js";

export interface HomeSummary {
  id: string;
  name: string;
  invitationCode?: string;
  role?: string;
  status?: string;
}

export interface ChoreItem {
  id: string;
  title: string;
  description?: string;
  status: "PENDING" | "COMPLETED";
  dueDate?: string;
  assignedToUserId?: string;
  assignedToName?: string;
  basePoints?: number;
  points?: number;
}

export interface UserChoreScore {
  userId: string;
  nickname: string;
  fullName: string;
  profilePicUrl?: string;
  currentPoints: number;
  expectedPoints: number;
  completedCount: number;
  rescuedCount: number;
  penalizedCount: number;
  pendingCount: number;
}

export interface ChoreLeaderboard {
  period: string;
  startDate?: string;
  endDate?: string;
  scores: UserChoreScore[];
}

export interface IHomeChoreClient {
  getUserHomes(status?: string): Promise<HomeSummary[]>;
  getPendingChores(homeId: string, assigneeId: string): Promise<ChoreItem[]>;
  getLeaderboard(homeId: string, period?: string): Promise<ChoreLeaderboard>;
}

export class HomeChoreClient implements IHomeChoreClient {
  constructor(private readonly http: IHttpClient = httpClient) {}

  public async getUserHomes(status: string = "ACTIVE"): Promise<HomeSummary[]> {
    return this.http.get<HomeSummary[]>("/homes", { status });
  }

  public async getPendingChores(homeId: string, assigneeId: string): Promise<ChoreItem[]> {
    return this.http.get<ChoreItem[]>(`/homes/${homeId}/chores`, {
      assigneeId,
      status: "PENDING"
    });
  }

  public async getLeaderboard(homeId: string, period: string = "WEEKLY"): Promise<ChoreLeaderboard> {
    return this.http.get<ChoreLeaderboard>(`/homes/${homeId}/chores/leaderboard`, { period });
  }
}

export const homeChoreClient = new HomeChoreClient();
