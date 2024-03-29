import { ResultCacheWrapper } from "../handler/ResultCacheWrapper";
import { getServiceTokenData } from "./AuthDao";
import { ServiceTokenData } from "./models/ServiceTokenData";

export class ServiceTokenHandler {
  private static handler: ServiceTokenCache;

  static getCache(): ServiceTokenCache {
    if (this.handler) return this.handler;
    this.handler = new ServiceTokenCache();
    return this.handler;
  }
}

class ServiceTokenCache extends ResultCacheWrapper<ServiceTokenData> {
  constructor() {
    super({ name: "ServiceTokenHandler" });
  }

  async getTokenData(params: { serviceName: string }) {
    return await this.getOrFetchValue({
      id: params.serviceName,
      getTimeToCache: () => 3600,
      fetchMethod: async () => {
        const tokenData = (await getServiceTokenData({
          serviceName: params.serviceName,
        })) as ServiceTokenData;
        return tokenData;
      },
    });
  }
}
