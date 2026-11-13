import { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";

import Logos from "@/Components/Employee/Logos";
import FaqSection from "@/Components/Faq/FaqSection";
import useInView from "@/Components/Faq/useInView";

const HERO_OPTIONS = { threshold: 0.4 };
const STEP_MS = 220;
const CUE_DELAY_MS = 2200;

export default function GuestLayout({ children }) {
    const { backgroundImage } = usePage().props;
    const [heroRef, heroInView] = useInView(HERO_OPTIONS);
    const [mounted, setMounted] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setLoaded(true), 600);
        const cueTimer = setTimeout(() => setLoaded(true), CUE_DELAY_MS);
        return () => clearTimeout(timer);
    }, []);

    const cueVisible = loaded && heroInView;

    const scrollToFaqs = () =>
        document
            .getElementById("faqs")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });

    return (
        <div className="relative isolate bg-paper">
            {backgroundImage && (
                <div
                    aria-hidden="true"
                    className="pointer-events-none fixed inset-0 -z-10 scale-105 bg-cover bg-center blur-[8px]"
                    style={{ backgroundImage: `url("${backgroundImage}")` }}
                />
            )}

            <section
                ref={heroRef}
                className="relative flex min-h-screen flex-col pb-28 lg:flex-row"
            >
                <div className="flex flex-col justify-center px-8 py-10 lg:w-1/2 lg:px-16 lg:py-16 xl:px-24">
                    <Logos
                        size="lg"
                        className="mb-8 lg:mb-10 [&_img]:h-24 [&_img]:w-auto lg:[&_img]:h-32 xl:[&_img]:h-40"
                    />

                    <img
                        src="/images/rbdt-logo.png"
                        alt="RBDT - Referral-Based Document Tracking"
                        className="mt-3 h-5 w-full max-w-full object-contain object-left drop-shadow-[0_2px_6px_rgba(5,10,36,0.6)] sm:h-52 lg:h-72 xl:h-96"
                    />

                    <p className="text-base font-semibold tracking-widest text-accent-400 uppercase lg:text-xl [text-shadow:0_1px_3px_rgba(5,10,36,0.7)]">
                        Revenue District Office No. 111 South Cotabato
                    </p>

                    <h1 className="mt-4 text-[4.5vw] leading-tight font-bold whitespace-nowrap text-white sm:text-3xl lg:text-[1.9vw] [text-shadow:0_2px_6px_rgba(5,10,36,0.7)]">
                        Referral-Based Document Tracking
                    </h1>

                    {/*This is where the position of the public/images/rbdt-logo.png. Under the Referral-Based text*/}

                    {/* {                <img
                    src="/images/rbdt-logo.png"
                    alt="RBDT - Referral-Based Document Tracking"
                    className="mt-6 h-auto w-102 max-w-full object-contain drop-shadow-[0_2px_6px_rgba(5,10,36,0.6)] sm:h-24 lg:h-28 xl:h-32"
                />} */}

                    <p className="mt-8 max-w-xl text-2xl text-accent-400 lg:text-2xl lg:leading-relaxed [text-shadow:0_1px_4px_rgba(5,10,36,0.7)]">
                        REGISTER. SCAN. TRACK
                    </p>
                </div>

                <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
                    <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-br from-navy-950 via-navy-900 to-brand-700 text-white shadow-2xl ring-1 ring-white/10">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -right-20 -bottom-24 h-80 w-80 rounded-full bg-accent-400/45 blur-3xl"
                        />

                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-brand-500/40 blur-3xl"
                        />

                        <div className="relative p-6 sm:p-8">{children}</div>
                    </div>
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center">
                    <button
                        type="button"
                        onClick={scrollToFaqs}
                        className={`pointer-events-auto flex flex-col items-center rounded-full bg-accent-400 px-8 py-3 text-navy-950 shadow-xl shadow-accent-400/40 ring-1 ring-white/30 transition duration-700 ease-out hover:scale-105 motion-reduce:transform-none ${
                            cueVisible
                                ? "translate-y-0 scale-100 opacity-100"
                                : "pointer-events-none translate-y-8 scale-75 opacity-0"
                        }`}
                    >
                        <span className="text-lg font-extrabold tracking-widest uppercase">
                            FAQs
                        </span>
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5 animate-bounce"
                        >
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </button>
                </div>
            </section>

            <FaqSection />
        </div>
    );
}
