-- CreateTable
CREATE TABLE "JwtRefreshToken" (
    "token" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "JwtRefreshToken_pkey" PRIMARY KEY ("token")
);

-- CreateIndex
CREATE UNIQUE INDEX "JwtRefreshToken_token_key" ON "JwtRefreshToken"("token");
