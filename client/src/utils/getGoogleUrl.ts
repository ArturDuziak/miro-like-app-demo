export const getGoogleOAuthUrl = () => {
  const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth`;

  const options = {
    redirect_uri: import.meta.env.VITE_GOOGLE_OAUTH_REDIRECT_URL,
    client_id: import.meta.env.VITE_GOOGLE_PUBLIC_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' '),
  }

  const queryParams = new URLSearchParams(options)

  return `${googleUrl}?${queryParams.toString()}`;
};
