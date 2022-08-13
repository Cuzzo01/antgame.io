const { ResultCacheWrapper } = require("../handler/ResultCacheWrapper");
const { getServiceTokenData } = require("./AuthDao");

class ServiceTokenHandler extends ResultCacheWrapper {
  constructor() {
    super({ name: "ServiceTokenHandler" });
  }

  async getTokenData({ serviceName }) {
    return await this.getOrFetchValue({
      id: serviceName,
      getTimeToCache: () => 3600,
      fetchMethod: async () => {
        const tokenData = await getServiceTokenData({ serviceName });
        return tokenData;
      },
    });
  }
}
const SingletonInstance = new ServiceTokenHandler();
module.exports = { ServiceTokenHandler: SingletonInstance };
