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
 */
export default function GuestLayout({ children }) {
    const { backgroundImage } = usePage().props;

    return (
        <div className="relative flex min-h-screen flex-col bg-paper lg:flex-row">
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
                    Revenue District Office
                </p>

                <h1 className="mt-4 text-3xl font-bold text-white lg:text-4xl [text-shadow:0_2px_6px_rgba(5,10,36,0.7)]">
                    Document Tracking Referral-Based
                </h1>

                <p className="mt-4 max-w-md text-lg text-white [text-shadow:0_1px_4px_rgba(5,10,36,0.7)]">
                    Register a referral, scan its QR code to receive it, and see
                    where every document has been.
                </p>
            </div>

            {/* Form, on navy sweeping into yellow at the corner */}
            <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
                <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-navy-950 via-navy-900 via-65% to-accent-500 p-6 text-white shadow-2xl sm:p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
