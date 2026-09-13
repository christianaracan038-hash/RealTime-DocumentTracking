import { useEffect, useState } from "react";
import { router } from "@inertiajs/react";

import Sidebar from "@/Components/Employee/Sidebar";
import Header from "@/Components/Employee/Header";

/*
 * Employee portal shell.
 *
 * Most staff open this on a phone, so the sidebar is a drawer below the
 * lg breakpoint - opened from the menu button in the header, closed by
 * the backdrop, Escape, or navigating. From lg up it is pinned open and
 * the content shifts right to make room.
 */
export default function EmployeeLayout({ title, children }) {
    const [menuOpen, setMenuOpen] = useState(false);

    // Any navigation closes the drawer so the next page opens clean.
    useEffect(() => router.on("navigate", () => setMenuOpen(false)), []);

    // Escape closes it, and the page behind stops scrolling while open.
    useEffect(() => {
        if (!menuOpen) return;

        const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
        window.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [menuOpen]);

    return (
        <div className="min-h-screen bg-paper">
            <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

            <div className="flex min-h-screen flex-col lg:ml-72">
                <Header title={title} onOpenMenu={() => setMenuOpen(true)} />

                <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
        </div>
    );
}
