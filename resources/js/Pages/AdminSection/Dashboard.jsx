import SectionDashboard from "@/Components/Employee/SectionDashboard";

export default function Dashboard(props) {
    return (
        <SectionDashboard
            {...props}
            title="Admin Section Dashboard"
            eyebrow="Admin Section"
            blurb="Anything sent to the Admin Section waits here until someone scans it in."
        />
    );
}
