/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_PUBLIC_CLIENT_ID: string
  readonly VITE_GOOGLE_OAUTH_REDIRECT_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
