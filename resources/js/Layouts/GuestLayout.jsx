import Logos from "@/Components/Employee/Logos";

/*
 * The sign-in shell.
 *
 * Split screen: the navy side states what the system is, the white side
 * is the one job to do. On a phone the navy panel collapses to a short
 * banner so the form is immediately reachable.
 */
export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col lg:flex-row">
            {/* Identity */}
            <div className="flex flex-col justify-center bg-navy-900 px-8 py-10 lg:w-2/5 lg:px-14 lg:py-16">
                <Logos size="lg" className="mb-6" />

                <p className="text-sm font-semibold tracking-widest text-accent-400 uppercase">
                    Revenue District Office
                </p>

                <h1 className="mt-4 text-3xl font-bold text-white lg:text-4xl">
                    Document Tracking
                </h1>

                <p className="mt-4 max-w-md text-lg text-navy-200">
                    Register a document, scan its QR code to receive it, and see
                    where every document has been.
                </p>
            </div>

            {/* Form */}
            <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-10">
                <div className="w-full max-w-md">{children}</div>
            </div>
        </div>
    );
}
