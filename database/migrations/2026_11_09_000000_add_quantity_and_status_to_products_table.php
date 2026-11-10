<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Default 1 preserves the inventory value of products created before
            // quantity tracking existed.
            $table->unsignedInteger('quantity')->default(1)->after('price');
            $table->string('status')->default('active')->after('quantity');

            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropColumn(['quantity', 'status']);
        });
    }
};
