<?php

namespace Parse\AdminPanel\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use Parse\AdminPanel\Http\Requests\StoreUploadRequest;
use Parse\AdminPanel\Infrastructure\Laravel\Panel\PanelManager;

final class UploadController extends Controller
{
    public function store(
        StoreUploadRequest $request,
        PanelManager $panels,
        string $purpose,
    ): JsonResponse {
        $upload = $panels->current($request)->registeredUpload($purpose);
        $directory = ($upload->directory)($request);

        abort_if(trim($directory, '/') === '', 500, 'The upload directory is invalid.');

        $path = $request->file('file')->store($directory, $upload->disk);

        abort_if($path === false, 500, 'The file could not be stored.');

        return response()->json([
            'path' => $path,
            'url' => Storage::disk($upload->disk)->url($path),
        ], 201);
    }
}
