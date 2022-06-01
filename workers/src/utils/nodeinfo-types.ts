export interface NodeInfoWellKnown {
  links: Array<{
    rel: string;
    href: string;
  }>;
}

export interface NodeInfoV2 {
  version: string;
  software: {
    name: string;
    version: string;
  };
  protocols: string[];
  services?: {
    inbound: string[];
    outbound: string[];
  };
  usage: {
    users: {
      total: number;
      activeMonth: number;
      activeHalfYear: number;
    };
    localPosts: number;
    localComments?: number;
  };
  openRegistrations: boolean;
  metadata?: {
    nodeName: string;
    nodeDescription: string;
    maintainer: {
      name: string;
      email: string;
    };
    langs: string[];
    tosUrl: string | null;
    repositoryUrl: string;
    feedbackUrl: string;
    disableRegistration: boolean;
    disableLocalTimeline: boolean;
    disableGlobalTimeline: boolean;
    emailRequiredForSignup: boolean;
    enableHcaptcha: boolean;
    enableRecaptcha: boolean;
    maxNoteTextLength: 3000;
    enableTwitterIntegration: boolean;
    enableGithubIntegration: boolean;
    enableDiscordIntegration: boolean;
    enableEmail: boolean;
    enableServiceWorker: boolean;
    proxyAccountName: string | null;
  };
}
