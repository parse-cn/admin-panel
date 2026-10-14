<?php

namespace Parse\AdminPanel\Auth;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;
use LogicException;

final class TotpSecret extends Model
{
    protected $table = 'admin_panel_totp_secrets';

    protected $guarded = [];

    protected $hidden = ['secret', 'recovery_codes'];

    protected function casts(): array
    {
        return [
            'secret' => 'encrypted',
            'recovery_codes' => 'array',
            'confirmed_at' => 'datetime',
            'last_used_step' => 'integer',
        ];
    }

    public static function forUser(Authenticatable $user): Builder
    {
        if (! Schema::hasTable('admin_panel_totp_secrets')) {
            throw new LogicException('Publish and run the admin-panel-migrations before enabling two-factor authentication.');
        }

        return self::query()->where('user_type', $user::class)
            ->where('user_id', (string) $user->getAuthIdentifier());
    }
}
