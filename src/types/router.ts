export interface SessionParams {
  sessionId: string;
}

export interface RequestParams extends SessionParams {
  requestId: string;
}