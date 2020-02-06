
type Participant = { id: number; name: string };

import fs from "fs";
import logger from '../logger';

const verbose = true;

/**
 * Models minimally sufficient information about a facebook conversation.
 */
export class FBConversation {
  id: number;
  name: string;
  participants: Array<Participant>;
  isGroupChat: boolean;

  constructor(data: any) {
    this.id = data.threadID;
    this.name = data.name;
    this.participants = data.participants.map(p => {
      return { id: p.userID, name: p.name };
    });
    this.isGroupChat = data.isGroup;
  }

  /**
   * @returns {Array<FBConversation>} - the cache from the file storage.
   */
  static readCache(): Array<FBConversation> {
    if (verbose) {
      logger.verbose("Attempting to read from cache.");
    }
    let convoData = fs.readFileSync("./static/conversations.json", "utf8");
    let convos: Array<FBConversation> = JSON.parse(convoData);
    return convos;
  }
}

export default FBConversation;
