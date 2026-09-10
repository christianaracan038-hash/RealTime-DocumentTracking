import { useForm } from "@inertiajs/react";

import EmployeeCard from "@/Components/Employee/EmployeeCard";
import EmployeeButton from "@/Components/Employee/EmployeeButton";

export default function DocumentForm({ sections = [], transactionTypes = [] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        document_date: "",
        taxpayer_name: "",
        transaction_type: "",
        description: "",
        reference_number: "",
        destination_section_id: "",
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("documents.store"), {
            preserveScroll: true,
            onSuccess: () => {
                reset(
                    "document_date",
                    "taxpayer_name",
                    "transaction_type",
                    "description",
                    "reference_number",
                    "destination_section_id",
                );
            },
        });
    };

    return (
        <EmployeeCard>
            <h2 className="mb-6 text-lg font-semibold text-slate-800">
                Register Document
            </h2>

            <form onSubmit={submit} className="space-y-5">
                {/* Tracking Number */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Tracking Number
                    </label>

                    <input
                        type="text"
                        value="AUTO GENERATED"
                        disabled
                        className="w-full rounded-lg border border-slate-300 bg-slate-100 px-4 py-2.5 text-slate-600"
                    />
                </div>

                {/* Date */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Date
                    </label>

                    <input
                        type="date"
                        value={data.document_date}
                        onChange={(e) =>
                            setData("document_date", e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-indigo-500"
                    />

                    {errors.document_date && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.document_date}
                        </p>
                    )}
                </div>

                {/* Taxpayer Name */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Taxpayer Name
                    </label>

                    <input
                        type="text"
                        value={data.taxpayer_name}
                        onChange={(e) =>
                            setData("taxpayer_name", e.target.value)
                        }
                        placeholder="Enter the taxpayer's name..."
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-indigo-500"
                    />

                    {errors.taxpayer_name && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.taxpayer_name}
                        </p>
                    )}
                </div>

                {/* Transaction / Document Type */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Transaction / Document Type
                    </label>

                    <select
                        value={data.transaction_type}
                        onChange={(e) =>
                            setData("transaction_type", e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="">Select Transaction Type</option>

                        {transactionTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>

                    {errors.transaction_type && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.transaction_type}
                        </p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Description
                    </label>

                    <textarea
                        rows="5"
                        value={data.description}
                        onChange={(e) => setData("description", e.target.value)}
                        placeholder="Enter document description..."
                        className="w-full resize-none rounded-lg border border-slate-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-indigo-500"
                    />

                    {errors.description && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.description}
                        </p>
                    )}
                </div>

                {/* Reference Number (Optional) */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Reference Number
                    </label>

                    <input
                        type="text"
                        value={data.reference_number}
                        onChange={(e) =>
                            setData("reference_number", e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                </div>

                {/* Destination */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Destination Section
                    </label>

                    <select
                        value={data.destination_section_id}
                        onChange={(e) =>
                            setData("destination_section_id", e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="">Select Destination</option>

                        {sections.map((section) => (
                            <option
                                key={section.section_id}
                                value={section.section_id}
                            >
                                {section.section_name}
                            </option>
                        ))}
                    </select>

                    {errors.destination_section_id && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.destination_section_id}
                        </p>
                    )}
                </div>

                <EmployeeButton
                    type="submit"
                    disabled={processing}
                    className="w-full"
                >
                    {processing ? "Registering..." : "Register Document"}
                </EmployeeButton>
            </form>
        </EmployeeCard>
    );
}
