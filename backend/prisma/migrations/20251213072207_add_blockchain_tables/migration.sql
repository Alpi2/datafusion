-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "wallet_address" VARCHAR(42) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255),
    "profile_image_url" TEXT,
    "bio" TEXT,
    "infl_balance" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "reputation_score" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_jobs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tier" VARCHAR(20) NOT NULL,
    "prompt" TEXT NOT NULL,
    "schema" JSONB,
    "aiModels" TEXT[],
    "validation_level" VARCHAR(20),
    "compliance_requirements" TEXT[],
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "current_step" TEXT,
    "result_url" TEXT,
    "quality_score" INTEGER,
    "row_count" INTEGER,
    "file_size" BIGINT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "knowledge_document_ids" TEXT[],
    "chat_context" JSONB,
    "validation_report" JSONB,
    "compliance_report" JSONB,

    CONSTRAINT "generation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dataset_schemas" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "fields" JSONB NOT NULL,
    "tier" VARCHAR(20),
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dataset_schemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "datasets" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "tags" TEXT[],
    "price" DECIMAL(10,2) NOT NULL,
    "quality_score" INTEGER NOT NULL,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "preview_data" JSONB NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "row_count" INTEGER NOT NULL,
    "column_count" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "is_nft" BOOLEAN NOT NULL DEFAULT false,
    "nft_contract_address" VARCHAR(42),
    "nft_token_id" VARCHAR(78),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "datasets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "price_paid" DECIMAL(10,2) NOT NULL,
    "paymentMethod" VARCHAR(50) NOT NULL,
    "stripe_payment_id" TEXT,
    "transaction_hash" VARCHAR(66),
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_datasets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "bonding_progress" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "market_cap" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "graduation_threshold" DECIMAL(20,2) NOT NULL DEFAULT 69000,
    "total_earnings" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "trading_volume" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "holder_count" INTEGER NOT NULL DEFAULT 0,
    "deploymentType" VARCHAR(20) NOT NULL DEFAULT 'public',
    "nft_token_id" VARCHAR(78),
    "storage_provider" VARCHAR(50),
    "license_revenue" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMP(3),
    "graduated_at" TIMESTAMP(3),

    CONSTRAINT "user_datasets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "earnings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "dataset_id" TEXT,
    "amount" DECIMAL(20,8) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "source" VARCHAR(100),
    "transaction_hash" VARCHAR(66),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "details" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_documents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" VARCHAR(50) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "content_text" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "embeddings" vector(1536),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_stats" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_users" INTEGER NOT NULL DEFAULT 0,
    "total_datasets" INTEGER NOT NULL DEFAULT 0,
    "total_volume" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "total_earnings" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "active_users_24h" INTEGER NOT NULL DEFAULT 0,
    "new_datasets_24h" INTEGER NOT NULL DEFAULT 0,
    "total_purchases_24h" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bonding_curves" (
    "id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "contract_address" VARCHAR(42) NOT NULL,
    "creator_address" VARCHAR(42) NOT NULL,
    "token_name" VARCHAR(100) NOT NULL,
    "token_symbol" VARCHAR(10) NOT NULL,
    "current_supply" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "current_price" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "market_cap" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "total_volume" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "holder_count" INTEGER NOT NULL DEFAULT 0,
    "graduated" BOOLEAN NOT NULL DEFAULT false,
    "uniswap_pool_address" VARCHAR(42),
    "deployment_tx_hash" VARCHAR(66) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "graduated_at" TIMESTAMP(3),

    CONSTRAINT "bonding_curves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" TEXT NOT NULL,
    "bonding_curve_id" TEXT NOT NULL,
    "trader_address" VARCHAR(42) NOT NULL,
    "type" VARCHAR(10) NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "price" DECIMAL(20,8) NOT NULL,
    "total_value" DECIMAL(20,2) NOT NULL,
    "fee" DECIMAL(20,8) NOT NULL,
    "transaction_hash" VARCHAR(66) NOT NULL,
    "block_number" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_wallet_address_key" ON "users"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_wallet_address_idx" ON "users"("wallet_address");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_session_token_key" ON "user_sessions"("session_token");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_session_token_idx" ON "user_sessions"("session_token");

-- CreateIndex
CREATE INDEX "generation_jobs_user_id_idx" ON "generation_jobs"("user_id");

-- CreateIndex
CREATE INDEX "generation_jobs_status_idx" ON "generation_jobs"("status");

-- CreateIndex
CREATE INDEX "generation_jobs_created_at_idx" ON "generation_jobs"("created_at");

-- CreateIndex
CREATE INDEX "dataset_schemas_user_id_idx" ON "dataset_schemas"("user_id");

-- CreateIndex
CREATE INDEX "dataset_schemas_is_template_idx" ON "dataset_schemas"("is_template");

-- CreateIndex
CREATE INDEX "datasets_creator_id_idx" ON "datasets"("creator_id");

-- CreateIndex
CREATE INDEX "datasets_category_idx" ON "datasets"("category");

-- CreateIndex
CREATE INDEX "datasets_status_idx" ON "datasets"("status");

-- CreateIndex
CREATE INDEX "datasets_created_at_idx" ON "datasets"("created_at");

-- CreateIndex
CREATE INDEX "datasets_rating_idx" ON "datasets"("rating");

-- CreateIndex
CREATE INDEX "datasets_download_count_idx" ON "datasets"("download_count");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_stripe_payment_id_key" ON "purchases"("stripe_payment_id");

-- CreateIndex
CREATE INDEX "purchases_buyer_id_idx" ON "purchases"("buyer_id");

-- CreateIndex
CREATE INDEX "purchases_dataset_id_idx" ON "purchases"("dataset_id");

-- CreateIndex
CREATE INDEX "purchases_stripe_payment_id_idx" ON "purchases"("stripe_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchases_buyer_id_dataset_id_key" ON "purchases"("buyer_id", "dataset_id");

-- CreateIndex
CREATE INDEX "reviews_dataset_id_idx" ON "reviews"("dataset_id");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_user_id_dataset_id_key" ON "reviews"("user_id", "dataset_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_datasets_dataset_id_key" ON "user_datasets"("dataset_id");

-- CreateIndex
CREATE INDEX "user_datasets_user_id_idx" ON "user_datasets"("user_id");

-- CreateIndex
CREATE INDEX "user_datasets_dataset_id_idx" ON "user_datasets"("dataset_id");

-- CreateIndex
CREATE INDEX "user_datasets_status_idx" ON "user_datasets"("status");

-- CreateIndex
CREATE INDEX "earnings_user_id_idx" ON "earnings"("user_id");

-- CreateIndex
CREATE INDEX "earnings_dataset_id_idx" ON "earnings"("dataset_id");

-- CreateIndex
CREATE INDEX "earnings_type_idx" ON "earnings"("type");

-- CreateIndex
CREATE INDEX "earnings_created_at_idx" ON "earnings"("created_at");

-- CreateIndex
CREATE INDEX "activity_log_user_id_idx" ON "activity_log"("user_id");

-- CreateIndex
CREATE INDEX "activity_log_action_idx" ON "activity_log"("action");

-- CreateIndex
CREATE INDEX "activity_log_created_at_idx" ON "activity_log"("created_at");

-- CreateIndex
CREATE INDEX "knowledge_documents_user_id_idx" ON "knowledge_documents"("user_id");

-- CreateIndex
CREATE INDEX "knowledge_documents_processed_idx" ON "knowledge_documents"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "platform_stats_date_key" ON "platform_stats"("date");

-- CreateIndex
CREATE INDEX "platform_stats_date_idx" ON "platform_stats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "bonding_curves_dataset_id_key" ON "bonding_curves"("dataset_id");

-- CreateIndex
CREATE UNIQUE INDEX "bonding_curves_contract_address_key" ON "bonding_curves"("contract_address");

-- CreateIndex
CREATE INDEX "bonding_curves_contract_address_idx" ON "bonding_curves"("contract_address");

-- CreateIndex
CREATE INDEX "bonding_curves_creator_address_idx" ON "bonding_curves"("creator_address");

-- CreateIndex
CREATE INDEX "bonding_curves_graduated_idx" ON "bonding_curves"("graduated");

-- CreateIndex
CREATE UNIQUE INDEX "trades_transaction_hash_key" ON "trades"("transaction_hash");

-- CreateIndex
CREATE INDEX "trades_bonding_curve_id_idx" ON "trades"("bonding_curve_id");

-- CreateIndex
CREATE INDEX "trades_trader_address_idx" ON "trades"("trader_address");

-- CreateIndex
CREATE INDEX "trades_type_idx" ON "trades"("type");

-- CreateIndex
CREATE INDEX "trades_created_at_idx" ON "trades"("created_at");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dataset_schemas" ADD CONSTRAINT "dataset_schemas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "datasets" ADD CONSTRAINT "datasets_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_datasets" ADD CONSTRAINT "user_datasets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_datasets" ADD CONSTRAINT "user_datasets_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonding_curves" ADD CONSTRAINT "bonding_curves_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_bonding_curve_id_fkey" FOREIGN KEY ("bonding_curve_id") REFERENCES "bonding_curves"("id") ON DELETE CASCADE ON UPDATE CASCADE;
