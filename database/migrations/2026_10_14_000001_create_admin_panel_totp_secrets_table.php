<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_panel_totp_secrets', function (Blueprint $table): void {
            $table->id();
            $table->string('user_type', 160);
            $table->string('user_id', 64);
            $table->text('secret');
            $table->timestamp('confirmed_at');
            $table->text('recovery_codes');
            $table->unsignedBigInteger('last_used_step')->nullable();
            $table->timestamps();
            $table->unique(['user_type', 'user_id'], 'admin_panel_totp_user_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_panel_totp_secrets');
    }
};
