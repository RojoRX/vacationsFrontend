const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default {
  meEndpoint: `${API_BASE_URL}/auth/me`,
  loginEndpoint: `${API_BASE_URL}/auth/login`,
  registerEndpoint: `${API_BASE_URL}/auth/register`,
  storageTokenKeyName: 'accessToken',
  onTokenExpiration: 'refreshToken'
};
