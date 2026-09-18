import { usePage } from "@inertiajs/react";

import Logos from "@/Components/Employee/Logos";

/*
 * The sign-in shell.
 *
 * A photograph of the district office sits behind everything, blurred
 * and otherwise untouched - no wash over it. The blur is applied on a
 * slightly oversized layer, because blurring an element softens its
 * edges and would otherwise show a pale rim. It is strong enough that
 * the picture reads as a soft field of colour, so the text over it
 * stays legible without any overlay.
 *
 * Split screen: the left states what the system is, the right is the
 * one job to do, on a card in the same navy as the dashboard so it is
 * unmistakably the thing to fill in. On a phone the left collapses to
 * a short banner so the form is immediately reachable.
 *
 * `isolate` on the outer box matters: it makes the box its own stacking
 * context, so the -z-10 photo layer paints above the box's fallback
 * background instead of underneath it, where bg-paper would hide it.
 *
 * The card is a navy-to-blue gradient with a soft yellow glow bleeding
 * in from one corner - the modern "dark base, coloured light" look.
 * The glow is a blurred disc rather than a gradient stop, so the yellow
 * never sits flat behind the white text.
 */
export default function GuestLayout({ children }) {
    const { backgroundImage } = usePage().props;

    return (
        <div className="relative isolate flex min-h-screen flex-col bg-paper lg:flex-row">
            {/* Background - the photo, blurred, nothing else */}
            {backgroundImage && (
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-10 scale-105 bg-cover bg-center blur-[8px]"
                    style={{ backgroundImage: `url("${backgroundImage}")` }}
                />
            )}

            {/* Identity */}
            <div className="flex flex-col justify-center px-8 py-10 lg:w-2/5 lg:px-14 lg:py-16">
                <Logos size="lg" className="mb-6" />

                <p className="text-sm font-semibold tracking-widest text-accent-400 uppercase [text-shadow:0_1px_3px_rgba(5,10,36,0.7)]">
                    Revenue District Office 111
                </p>

                <h1 className="mt-4 text-3xl font-bold text-white lg:text-4xl [text-shadow:0_2px_6px_rgba(5,10,36,0.7)]">
                    Document Tracking Referral-Based
                </h1>

                <p className="mt-4 max-w-md text-lg text-white [text-shadow:0_1px_4px_rgba(5,10,36,0.7)]">
                    Register a referral, scan its QR code to receive it, and see
                    where every document has been.
                </p>
            </div>

            {/* Form */}
            <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
                <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-br from-navy-950 via-navy-900 to-brand-700 text-white shadow-2xl ring-1 ring-white/10">
                    {/* Yellow light from the lower-right corner */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-20 -bottom-24 h-80 w-80 rounded-full bg-accent-400/45 blur-3xl"
                    />

                    {/* A cooler blue light from the upper-left, for depth */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-brand-500/40 blur-3xl"
                    />

                    <div className="relative p-6 sm:p-8">{children}</div>
                </div>
            </div>
        </div>
    );
}
