import { useEffect, useState } from "react";

/*
 * Somebody's photograph, or their initials.
 *
 * The fallback is not decoration. While avatars live on a local disk, the
 * database is shared between machines but storage/ is not - so a photo
 * uploaded on one laptop genuinely is not there on another, and its
 * request 404s. Rather than checking existence on the server (a
 * filesystem call per face, or a network round trip per face once this is
 * on Supabase), the image is simply allowed to fail and initials take its
 * place. Nobody sees a broken image.
 *
 * Initials come from the display name, so "Atty. John Dela Cruz" gives
 * JD rather than AJ - a title is not part of somebody's initials.
 */

const TITLES = [
    "atty",
    "atty.",
    "engr",
    "engr.",
    "dr",
    "dr.",
    "mr",
    "mr.",
    "ms",
    "ms.",
    "mrs",
    "mrs.",
];

function initialsOf(name) {
    if (!name) return "?";

    const words = name
        .trim()
        .split(/\s+/)
        .filter((word) => !TITLES.includes(word.toLowerCase()));

    if (words.length === 0) return name.charAt(0).toUpperCase();

    if (words.length === 1) return words[0].charAt(0).toUpperCase();

    return (
        words[0].charAt(0) + words[words.length - 1].charAt(0)
    ).toUpperCase();
}

export default function Avatar({
    url = null,
    name = "",
    size = "md",
    className = "",
}) {
    const [failed, setFailed] = useState(false);

    // A different person in the same slot deserves a fresh attempt.
    useEffect(() => setFailed(false), [url]);

    const sizes = {
        sm: "h-8 w-8 text-xs",
        md: "h-10 w-10 text-base",
        lg: "h-16 w-16 text-xl",
    };

    const shell = `flex shrink-0 items-center justify-center overflow-hidden rounded-full ${
        sizes[size] ?? sizes.md
    } ${className}`;

    if (url && !failed) {
        return (
            <img
                src={url}
                alt={name ? `Photograph of ${name}` : "Photograph"}
                onError={() => setFailed(true)}
                className={`${shell} bg-navy-200 object-cover`}
            />
        );
    }

    return (
        <span
            aria-hidden="true"
            className={`${shell} bg-accent-400 font-bold text-navy-900`}
        >
            {initialsOf(name)}
        </span>
    );
}
