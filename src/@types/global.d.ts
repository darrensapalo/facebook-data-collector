import Global = NodeJS.Global;
export type FacebookMessengerAPI = any;
export interface PersonalGlobal extends Global {
  mssgr: FacebookMessengerAPI;
}
