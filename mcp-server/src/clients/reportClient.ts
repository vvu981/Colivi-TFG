import { IHttpClient } from "../core/http/types.js";
import { httpClient } from "../core/http/coliviHttpClient.js";
import { PageResponse } from "./listingClient.js";

export type ReportTargetType = "USER" | "LISTING";

export interface ReportTargetCount {
  targetId: string;
  targetType: ReportTargetType;
  pendingCount: number;
  totalCount: number;
  reportCount?: number;
}

export interface IReportClient {
  getMostReported(params: {
    targetType: ReportTargetType;
    page?: number;
    size?: number;
  }): Promise<PageResponse<ReportTargetCount>>;
}

export class ReportClient implements IReportClient {
  constructor(private readonly http: IHttpClient = httpClient) {}

  public async getMostReported(params: {
    targetType: ReportTargetType;
    page?: number;
    size?: number;
  }): Promise<PageResponse<ReportTargetCount>> {
    return this.http.get<PageResponse<ReportTargetCount>>("/admin/reports/most-reported", {
      type: params.targetType,
      page: params.page ?? 0,
      size: params.size ?? 10
    });
  }
}

export const reportClient = new ReportClient();
