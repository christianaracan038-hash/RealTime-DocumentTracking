import Sidebar from "@/Components/Employee/Sidebar";
import Header from "@/Components/Employee/Header";

export default function EmployeeLayout({ title, children }) {
    return (
        <div className="min-h-screen bg-paper">
            <Sidebar />

            <div className="flex min-h-screen flex-col lg:ml-72">
                <Header title={title} />

                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
