import SectionDashboard from "@/Components/Employee/SectionDashboard";

export default function Dashboard(props) {
    return (
        <SectionDashboard
            {...props}
            title="Admin Section Dashboard"
            eyebrow="Admin Section"
            blurb="Pending Admin Receipt"
        />
    );
}
