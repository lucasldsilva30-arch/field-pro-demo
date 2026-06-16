-- CreateEnum
CREATE TYPE "EmpresaStatus" AS ENUM ('ATIVA', 'INATIVA');

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "status" "EmpresaStatus" NOT NULL DEFAULT 'ATIVA',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DadoPlanilha" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "plano" TEXT,
    "status" TEXT,
    "empresaId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "dadosOriginais" JSONB,

    CONSTRAINT "DadoPlanilha_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_cnpj_key" ON "Empresa"("cnpj");

-- CreateIndex
CREATE INDEX "Empresa_nome_idx" ON "Empresa"("nome");

-- CreateIndex
CREATE INDEX "DadoPlanilha_empresaId_idx" ON "DadoPlanilha"("empresaId");

-- CreateIndex
CREATE INDEX "DadoPlanilha_empresaId_status_idx" ON "DadoPlanilha"("empresaId", "status");

-- CreateIndex
CREATE INDEX "DadoPlanilha_empresaId_nome_idx" ON "DadoPlanilha"("empresaId", "nome");

-- AddForeignKey
ALTER TABLE "DadoPlanilha" ADD CONSTRAINT "DadoPlanilha_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
