declare module 'facebook-chat-api' {

  export type LoginCredentials = { appState?: JSON; email?: string; password?: string };

  export type LoginOptions = { logLevel?: string; loginRequired?: boolean };

  export type FacebookChatAPI = any;

  export type FacebookLoginError = { error: any, continue: (line: any) => void }

  export type LoginCallback = (err: FacebookLoginError, api: FacebookChatAPI) => void;

// The login process for Facebook Messenger.
  type FacebookLoginProcess = (
    loginData: LoginCredentials,
    options: LoginOptions,
    callback: LoginCallback
  ) => void;


  function login(credentials: LoginCredentials, options: LoginOptions, callback: LoginCallback): void;

  export default login;
}
