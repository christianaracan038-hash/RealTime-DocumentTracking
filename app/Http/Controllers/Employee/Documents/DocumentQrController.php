<?php

namespace App\Http\Controllers\Employee\Documents;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Services\DocumentService;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

/**
 * Serves a document's QR code.
 *
 * QR images used to be read straight off disk through the storage
 * symlink, which only worked on the machine that registered the
 * document — the database is shared between everyone, the files are
 * not. Anyone else got a broken image.
 *
 * The QR payload is just the tracking number, so it can always be
 * regenerated. This serves the stored file when it exists and rebuilds
 * it when it does not, which repairs older documents on first view.
 */
class DocumentQrController extends Controller
{
    public function show(
        Document $document,
        DocumentService $documentService
    ): Response {
        $path = 'qrcodes/'.$document->qr_value.'.svg';

        if (! Storage::disk('public')->exists($path)) {
            $documentService->regenerateQrCode($document);
        }

        return response(
            Storage::disk('public')->get($path),
            200,
            [
                'Content-Type' => 'image/svg+xml',

                /*
                * The image for a given tracking number never changes,
                * so let the browser keep it.
                */
                'Cache-Control' => 'private, max-age=604800',
            ]
        );
    }
}
