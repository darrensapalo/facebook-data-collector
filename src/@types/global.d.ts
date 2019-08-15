declare module NodeJS {
  export type FacebookMessengerAPI  = any;

  interface Global {
    mssgr: FacebookMessengerAPI;
  }
}
