<?php

namespace Parse\AdminPanel\Auth;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use PragmaRX\Google2FA\Google2FA;

final class TotpService
{
    public function __construct(private readonly Google2FA $google2fa) {}

    public function generateSecret(): string
    {
        return $this->google2fa->generateSecretKey();
    }

    public function url(string $secret, string $email, string $issuer): string
    {
        return $this->google2fa->getQRCodeUrl($issuer, $email, $secret);
    }

    public function matchedStep(string $secret, string $code, int $last = -1): int|false
    {
        if (! preg_match('/^[0-9]{6}$/D', $code)) {
            return false;
        }

        return $this->google2fa->verifyKeyNewer($secret, $code, $last, 1);
    }

    public function consume(TotpSecret $record, ?string $code, ?string $recovery): bool
    {
        return DB::transaction(function () use ($record, $code, $recovery): bool {
            $current = TotpSecret::query()->lockForUpdate()->find($record->getKey());
            if ($current === null) {
                return false;
            }

            if ($recovery !== null) {
                $hashes = $current->recovery_codes;
                foreach ($hashes as $index => $hash) {
                    if (Hash::check($recovery, $hash)) {
                        unset($hashes[$index]);
                        $current->update(['recovery_codes' => array_values($hashes)]);

                        return true;
                    }
                }

                return false;
            }

            $step = $this->matchedStep($current->secret, $code ?? '', $current->last_used_step ?? -1);
            if ($step === false) {
                return false;
            }

            $current->update(['last_used_step' => $step]);

            return true;
        });
    }

    public function recoveryCodes(): array
    {
        return array_map(static fn () => bin2hex(random_bytes(10)), range(1, 8));
    }

    public function recoveryHashes(array $codes): array
    {
        return array_map(static fn (string $code) => Hash::make($code), $codes);
    }
}
