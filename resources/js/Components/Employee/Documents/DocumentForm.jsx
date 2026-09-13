import { useForm } from "@inertiajs/react";

import EmployeeCard from "@/Components/Employee/EmployeeCard";
import EmployeeButton from "@/Components/Employee/EmployeeButton";

/*
 * Registration form.
 *
 * Fields are in the order the clerk reads them off the physical
 * document: who it belongs to, what kind it is, then where it goes.
 * Required fields say so in words rather than with an asterisk.
 */

const FIELD =
    "min-h-12 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-navy-900 placeholder:text-muted focus:border-brand-600";

function Field({ label, hint, error, required = false, children }) {
    return (
        <div>
            <label className="mb-1.5 block text-base font-semibold text-navy-800">
                {label}
                {!required && (
                    <span className="ml-2 text-sm font-normal text-muted">
                        optional
                    </span>
                )}
            </label>

            {hint && <p className="mb-2 text-sm text-muted">{hint}</p>}

            {children}

            {error && (
                <p className="mt-2 text-sm font-medium text-stop-600">
                    {error}
                </p>
            )}
        </div>
    );
}

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
            <h2 className="text-xl font-bold text-navy-900">
                Register a document
            </h2>

            <p className="mt-1 text-base text-muted">
                The tracking number and QR code are created for you.
            </p>

            <form onSubmit={submit} className="mt-7 space-y-6">
                <Field
                    label="Taxpayer name"
                    hint="The name printed on the document."
                    error={errors.taxpayer_name}
                    required
                >
                    <input
                        type="text"
                        value={data.taxpayer_name}
                        onChange={(e) =>
                            setData("taxpayer_name", e.target.value)
                        }
                        placeholder="e.g. Juan Dela Cruz"
                        className={FIELD}
                    />
                </Field>

                <Field
                    label="Transaction type"
                    error={errors.transaction_type}
                    required
                >
                    <select
                        value={data.transaction_type}
                        onChange={(e) =>
                            setData("transaction_type", e.target.value)
                        }
                        className={FIELD}
                    >
                        <option value="">Choose a type</option>

                        {transactionTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </Field>

                <Field
                    label="Date on the document"
                    error={errors.document_date}
                    required
                >
                    <input
                        type="date"
                        value={data.document_date}
                        onChange={(e) =>
                            setData("document_date", e.target.value)
                        }
                        className={FIELD}
                    />
                </Field>

                <Field
                    label="Description"
                    hint="A short note so a colleague can recognise it."
                    error={errors.description}
                    required
                >
                    <textarea
                        rows="4"
                        value={data.description}
                        onChange={(e) => setData("description", e.target.value)}
                        placeholder="What is this document for?"
                        className={`${FIELD} resize-none`}
                    />
                </Field>

                <Field label="Reference number" error={errors.reference_number}>
                    <input
                        type="text"
                        value={data.reference_number}
                        onChange={(e) =>
                            setData("reference_number", e.target.value)
                        }
                        className={FIELD}
                    />
                </Field>

                <Field
                    label="Send to which section"
                    error={errors.destination_section_id}
                    required
                >
                    <select
                        value={data.destination_section_id}
                        onChange={(e) =>
                            setData("destination_section_id", e.target.value)
                        }
                        className={FIELD}
                    >
                        <option value="">Choose a section</option>

                        {sections.map((section) => (
                            <option
                                key={section.section_id}
                                value={section.section_id}
                            >
                                {section.section_name}
                            </option>
                        ))}
                    </select>
                </Field>

                <EmployeeButton
                    type="submit"
                    size="lg"
                    disabled={processing}
                    className="w-full"
                >
                    {processing ? "Registering..." : "Register document"}
                </EmployeeButton>
            </form>
        </EmployeeCard>
    );
}
