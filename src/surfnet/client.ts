import { jsonRpcCall } from "../utils/rpc.js";

export class SurfnetClient {
  constructor(private rpcUrl: string) {}

  async call<T>(method: string, params: unknown[] = []): Promise<T> {
    return jsonRpcCall<T>(this.rpcUrl, method, params);
  }

  get url(): string {
    return this.rpcUrl;
  }
}
