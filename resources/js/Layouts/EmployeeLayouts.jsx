import Sidebar from "@/Components/Employee/Sidebar";
import Header from "@/Components/Employee/Header";

export default function EmployeeLayout({ title, children }) {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Fixed Sidebar */}
            <Sidebar />

            {/* Main Area */}
            <div className="ml-64 flex min-h-screen flex-col">
                {/* Header */}
                <Header title={title} />

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
