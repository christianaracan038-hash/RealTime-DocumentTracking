import SectionDashboard from "@/Components/Employee/SectionDashboard";

export default function Dashboard(props) {
    return (
        <SectionDashboard
            {...props}
            title="Collection Dashboard"
            eyebrow="Collection Section"
            blurb="Anything sent to Collection waits here until someone scans it in."
        />
    );
}
