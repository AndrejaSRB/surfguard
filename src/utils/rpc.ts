let nextId = 1;

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: unknown[];
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
}

export class RpcError extends Error {
  constructor(
    public code: number,
    message: string,
    public data?: unknown,
  ) {
    super(`RPC error ${code}: ${message}`);
    this.name = "RpcError";
  }
}

export async function jsonRpcCall<T>(url: string, method: string, params: unknown[] = []): Promise<T> {
  const request: JsonRpcRequest = {
    jsonrpc: "2.0",
    id: nextId++,
    method,
    params,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const body = (await res.json()) as JsonRpcResponse<T>;

  if (body.error) {
    throw new RpcError(body.error.code, body.error.message, body.error.data);
  }

  return body.result as T;
}

export function resetIdCounter(): void {
  nextId = 1;
}
