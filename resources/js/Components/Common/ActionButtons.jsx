import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function ActionButton({ onEdit, onDelete }) {
    return (
        <div className="flex items-center gap-2">
            <button
                onClick={onEdit}
                className="rounded-lg bg-indigo-50 p-2 text-indigo-600 transition hover:bg-indigo-100"
            >
                <PencilSquareIcon className="h-5 w-5" />
            </button>

            <button
                onClick={onDelete}
                className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
            >
                <TrashIcon className="h-5 w-5" />
            </button>
        </div>
    );
}
