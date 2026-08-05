-- CreateTable
CREATE TABLE "StyleLook" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sourcePhoto" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StyleLook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StyleLook_userId_idx" ON "StyleLook"("userId");

-- AddForeignKey
ALTER TABLE "StyleLook" ADD CONSTRAINT "StyleLook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
