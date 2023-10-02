class FriendlyClientIdService {
  constructor() {
    this.nextId = 1;
    this.clientIdMapping = {};
  }

  getFriendlyId(clientId) {
    if (clientId in this.clientIdMapping) {
      return this.clientIdMapping[clientId];
    } else {
      if (window.location.pathname.includes("admin"))
        console.log(getLetterFromNumber(this.nextId), clientId);
      this.clientIdMapping[clientId] = getLetterFromNumber(this.nextId);
      this.nextId++;
      return this.clientIdMapping[clientId];
    }
  }
}

const getLetterFromNumber = num => {
  return String.fromCharCode(64 + num);
};

const SingletonInstance = new FriendlyClientIdService();
export default SingletonInstance;
