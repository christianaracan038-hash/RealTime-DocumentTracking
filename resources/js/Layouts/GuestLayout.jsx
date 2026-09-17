import { usePage } from "@inertiajs/react";

import Logos from "@/Components/Employee/Logos";

/*
 * The sign-in shell.
 *
 * A photograph of the district office sits behind everything, lightly
 * blurred and darkened so it reads as atmosphere rather than
 * decoration - and so white text over it stays legible. The blur is
 * applied in CSS on a slightly oversized layer, because blurring an
 * element softens its edges and would otherwise show a pale rim.
 *
 * Split screen: the left states what the system is, the right is the
 * one job to do. On a phone the left collapses to a short banner so the
 * form is immediately reachable.
 */
export default function GuestLayout({ children }) {
    const { backgroundImage } = usePage().props;

    return (
        <div className="relative flex min-h-screen flex-col lg:flex-row">
            {/* Background */}
            {backgroundImage && (
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-10 scale-105 bg-cover bg-center blur-[3px]"
                    style={{ backgroundImage: `url("${backgroundImage}")` }}
                />
            )}

            {/*
             * Darkened towards the left, where the text sits, and lighter
             * on the right so the building still shows behind the form.
             */}
            <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-navy-950/85 lg:bg-gradient-to-r lg:from-navy-950/95 lg:via-navy-950/85 lg:to-navy-900/70"
            />

            {/* Identity */}
            <div className="flex flex-col justify-center px-8 py-10 lg:w-2/5 lg:px-14 lg:py-16">
                <Logos size="lg" className="mb-6" />

                <p className="text-sm font-semibold tracking-widest text-accent-400 uppercase">
                    Revenue District Office
                </p>

                <h1 className="mt-4 text-3xl font-bold text-white lg:text-4xl">
                    Document Tracking
                </h1>

                <p className="mt-4 max-w-md text-lg text-navy-200">
                    Register a referral, scan its QR code to receive it, and see
                    where every document has been.
                </p>
            </div>

            {/* Form, on white so the fields stay readable over the photo */}
            <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
                <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
