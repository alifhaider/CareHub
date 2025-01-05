-- CreateTable
CREATE TABLE "DoctorPopularty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "doctorId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DoctorPopularty_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("userId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpecialtyPopularty" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "doctorSpecialtyId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SpecialtyPopularty_doctorSpecialtyId_fkey" FOREIGN KEY ("doctorSpecialtyId") REFERENCES "DoctorSpecialty" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DoctorPopularty_doctorId_key" ON "DoctorPopularty"("doctorId");

-- CreateIndex
CREATE INDEX "DoctorPopularty_views_idx" ON "DoctorPopularty"("views");

-- CreateIndex
CREATE UNIQUE INDEX "SpecialtyPopularty_doctorSpecialtyId_key" ON "SpecialtyPopularty"("doctorSpecialtyId");

-- CreateIndex
CREATE INDEX "SpecialtyPopularty_views_idx" ON "SpecialtyPopularty"("views");
