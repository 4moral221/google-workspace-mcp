const config = require('../config');

class GoogleWorkspaceService {
  constructor() {
    this.clientId = config.google.clientId;
  }

  async authenticate() {
    // TODO: implement OAuth2 flow
    return { authenticated: false };
  }

  async listGmail() {
    return [];
  }

  async listCalendar() {
    return [];
  }

  async listDrive() {
    return [];
  }
}

module.exports = new GoogleWorkspaceService();
