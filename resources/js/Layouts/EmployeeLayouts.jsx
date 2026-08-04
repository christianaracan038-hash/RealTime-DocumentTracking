import Sidebar from "@/Components/Employee/Sidebar";
import Header from "@/Components/Employee/Header";

export default function EmployeeLayout({ title, children }) {
    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />

            <div className="flex flex-1 flex-col">
                <Header title={title} />

                <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
