import { useEffect, useState } from "react";

import { FAQ_CATEGORIES } from "@/Components/Faq/faqData";
import useInView from "@/Components/Faq/useInView";

const OBSERVER_OPTIONS = { threshold: 0, rootMargin: "0px 0px -15% 0px" };

const popClass = (visible) =>
    `transition duration-500 ease-out motion-reduce:transform-none ${
        visible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-6 scale-95 opacity-0"
    }`;

const popDelay = (visible, index) => ({
    transitionDelay: visible ? `${index * 90}ms` : "0ms",
});

function FaqItem({ item, open, onToggle, inView, index }) {
    const [mounted, setMounted] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 30);
        return () => clearTimeout(timer);
    }, []);

    const visible = inView && mounted;

    return (
        <div className={popClass(visible)} style={popDelay(visible, index)}>
            <div
                className={`overflow-hidden rounded-2xl bg-navy-950/85 text-white shadow-xl ring-1 backdrop-blur-md transition-shadow duration-300 ${
                    open
                        ? "ring-accent-400/60"
                        : "ring-white/10 hover:ring-white/30"
                }`}
            >
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                >
                    <span className="text-base font-semibold sm:text-lg">
                        {item.question}
                    </span>
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`h-5 w-5 shrink-0 text-accent-400 transition-transform duration-300 ${
                            open ? "rotate-180" : ""
                        }`}
                    >
                        <path d="M6 9l6 6 6-6" />
                    </svg>
                </button>

                <div
                    className={`grid transition-all duration-300 ease-out ${
                        open
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0"
                    }`}
                >
                    <div className="overflow-hidden">
                        <div className="space-y-5 px-5 pb-6 sm:px-6">
                            <ol className="list-decimal space-y-2 pl-5 text-white/90 marker:font-semibold marker:text-accent-400">
                                {item.steps.map((step) => (
                                    <li key={step}>{step}</li>
                                ))}
                            </ol>

                            {item.image && !imageFailed && (
                                <img
                                    src={item.image}
                                    alt={item.question}
                                    loading="lazy"
                                    onError={() => setImageFailed(true)}
                                    className="w-full rounded-xl ring-1 ring-white/10"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function FaqSection() {
    const [ref, inView] = useInView(OBSERVER_OPTIONS);
    const [activeId, setActiveId] = useState(FAQ_CATEGORIES[0].id);
    const [openId, setOpenId] = useState(null);

    const active =
        FAQ_CATEGORIES.find((category) => category.id === activeId) ??
        FAQ_CATEGORIES[0];

    const selectCategory = (id) => {
        setActiveId(id);
        setOpenId(null);
    };

    const backToLogin = () => window.scrollTo({ top: 0, behavior: "smooth" });

    return (
        <section
            id="faqs"
            ref={ref}
            className="relative px-4 py-20 sm:px-6 lg:px-10 lg:py-28"
        >
            <div className="mx-auto max-w-6xl">
                <div
                    className={`text-center ${popClass(inView)}`}
                    style={popDelay(inView, 0)}
                >
                    <p className="text-base font-semibold tracking-widest text-accent-400 uppercase lg:text-xl [text-shadow:0_1px_3px_rgba(5,10,36,0.7)]">
                        Help Desk
                    </p>
                    <h2 className="mt-3 text-4xl font-bold text-white lg:text-5xl [text-shadow:0_2px_6px_rgba(5,10,36,0.7)]">
                        Frequently Asked Questions
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-white [text-shadow:0_1px_4px_rgba(5,10,36,0.7)]">
                        Step-by-step guides on how to use the system.
                    </p>
                </div>

                <div className="mt-12 flex flex-col gap-6 lg:flex-row lg:gap-10">
                    <nav
                        className={`flex gap-2 overflow-x-auto pb-2 lg:sticky lg:top-8 lg:w-64 lg:shrink-0 lg:flex-col lg:self-start lg:overflow-visible lg:pb-0 ${popClass(
                            inView,
                        )}`}
                        style={popDelay(inView, 1)}
                    >
                        {FAQ_CATEGORIES.map((category) => (
                            <button
                                key={category.id}
                                type="button"
                                onClick={() => selectCategory(category.id)}
                                className={`rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors duration-300 lg:rounded-xl lg:px-5 lg:py-3 lg:text-left lg:text-base ${
                                    category.id === active.id
                                        ? "bg-accent-400 text-navy-950"
                                        : "bg-navy-950/70 text-white ring-1 ring-white/10 backdrop-blur-md hover:bg-navy-900"
                                }`}
                            >
                                {category.label}
                            </button>
                        ))}
                    </nav>

                    <div key={active.id} className="flex-1 space-y-4">
                        {active.items.map((item, index) => (
                            <FaqItem
                                key={item.id}
                                item={item}
                                open={openId === item.id}
                                onToggle={() =>
                                    setOpenId(
                                        openId === item.id ? null : item.id,
                                    )
                                }
                                inView={inView}
                                index={index + 2}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={backToLogin}
                className={`fixed bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full bg-accent-400 px-6 py-3 text-sm font-bold tracking-wide text-navy-950 uppercase shadow-xl shadow-accent-400/30 transition duration-500 ease-out motion-reduce:transform-none ${
                    inView
                        ? "translate-y-0 scale-100 opacity-100"
                        : "pointer-events-none translate-y-6 scale-75 opacity-0"
                }`}
            >
                Back to login ↑
            </button>
        </section>
    );
}
