let accessToken: string | null = null;

export const setAccessTokenInMemory = (token: string | null) => {
  accessToken = token;
};

export const getAccessTokenFromMemory = () => {
  return accessToken;
};
