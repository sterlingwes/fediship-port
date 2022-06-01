export interface MastoInstanceInfo {
  title: string;
  uri: string; // no protocol (host)
  version: string; // mastodon semver
  short_description: string;
  description: string;
  stats: {
    user_count: number;
    domain_count: number;
    status_count: number;
  };
  thumbnail: string; // url
}
