-- Safe to run on the existing database (idempotent).
-- Adds the missing performance indexes without recreating tables.
-- Applies only the CREATE INDEX statements from the generated baseline migration.

CREATE INDEX IF NOT EXISTS "achievements_user_id_idx" ON "achievements" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "achievements_user_code_idx" ON "achievements" USING btree ("user_id","code");
CREATE INDEX IF NOT EXISTS "activity_logs_user_id_idx" ON "activity_logs" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "activity_logs_action_idx" ON "activity_logs" USING btree ("action");
CREATE INDEX IF NOT EXISTS "activity_logs_user_action_created_idx" ON "activity_logs" USING btree ("userId","action","created_at");
CREATE INDEX IF NOT EXISTS "ai_conversations_user_id_idx" ON "ai_conversations" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "ai_conversations_user_created_idx" ON "ai_conversations" USING btree ("user_id","created_at");
CREATE INDEX IF NOT EXISTS "ai_learning_data_user_id_idx" ON "ai_learning_data" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "ai_learning_type_idx" ON "ai_learning_data" USING btree ("behavior_type");
CREATE INDEX IF NOT EXISTS "ai_memory_user_id_idx" ON "ai_memory" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "ai_memory_category_idx" ON "ai_memory" USING btree ("category");
CREATE INDEX IF NOT EXISTS "ai_memory_user_key_idx" ON "ai_memory" USING btree ("user_id","memory_key");
CREATE INDEX IF NOT EXISTS "ai_memory_user_updated_idx" ON "ai_memory" USING btree ("user_id","updated_at");
CREATE INDEX IF NOT EXISTS "ai_preferences_user_id_idx" ON "ai_preferences" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "ai_recommendations_user_id_idx" ON "ai_recommendations" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "ai_reminders_user_id_idx" ON "ai_reminders" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "ai_reminders_user_remind_idx" ON "ai_reminders" USING btree ("user_id","remind_at");
CREATE INDEX IF NOT EXISTS "expenses_user_id_idx" ON "expenses" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "expenses_category_idx" ON "expenses" USING btree ("category");
CREATE INDEX IF NOT EXISTS "expenses_user_date_idx" ON "expenses" USING btree ("user_id","date");
CREATE INDEX IF NOT EXISTS "goal_categories_user_id_idx" ON "goal_categories" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "goals_user_id_idx" ON "goals" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "goals_category_idx" ON "goals" USING btree ("category");
CREATE INDEX IF NOT EXISTS "goals_user_status_idx" ON "goals" USING btree ("user_id","status");
CREATE INDEX IF NOT EXISTS "goals_user_deadline_idx" ON "goals" USING btree ("user_id","deadline");
CREATE INDEX IF NOT EXISTS "login_methods_user_id_idx" ON "login_methods" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "login_methods_user_method_idx" ON "login_methods" USING btree ("user_id","method");
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "notifications_user_read_created_idx" ON "notifications" USING btree ("user_id","read","created_at");
CREATE INDEX IF NOT EXISTS "password_resets_user_id_idx" ON "password_resets" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "password_resets_token_used_idx" ON "password_resets" USING btree ("token","used");
CREATE INDEX IF NOT EXISTS "product_prices_purchase_id_idx" ON "product_prices" USING btree ("purchase_id");
CREATE INDEX IF NOT EXISTS "product_prices_purchase_recorded_idx" ON "product_prices" USING btree ("purchase_id","recorded_at");
CREATE INDEX IF NOT EXISTS "purchases_user_id_idx" ON "purchases" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "purchases_user_status_idx" ON "purchases" USING btree ("user_id","status");
CREATE INDEX IF NOT EXISTS "savings_user_id_idx" ON "savings" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "savings_user_year_month_idx" ON "savings" USING btree ("user_id","year","month");
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");
