<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('demos', function (Blueprint $table) {
            $table->id();

            // Join key back to faceit_matches.faceit_match_id — deliberately
            // not a foreign key. faceit_matches is per-player-per-match (every
            // teammate who played the same real match gets their own row
            // sharing this string), so there's no single faceit_matches row
            // to reference. Unique here is what makes every teammate resolve
            // to the same Demo instead of each uploading/parsing their own.
            $table->string('faceit_match_id')->unique();

            $table->string('map');

            // 'upload' today (a teammate attaches their own .dem); 'faceit_auto'
            // reserved for once the Faceit Downloads API application is
            // approved and a fetch job can populate raw_disk_path itself.
            $table->string('source')->default('upload');

            $table->string('status')->default('processing');
            $table->foreignId('uploaded_by_user_id')->nullable()->constrained('users')->nullOnDelete();

            // Private disk paths. raw_disk_path is cleared after a successful
            // parse (see config('demos.retain_raw_demo')) to control storage
            // use; parsed_disk_path is the compact JSON served by DemoController@data.
            $table->string('raw_disk_path')->nullable();
            $table->string('parsed_disk_path')->nullable();

            $table->unsignedTinyInteger('round_count')->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('parsed_at')->nullable();
            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demos');
    }
};
