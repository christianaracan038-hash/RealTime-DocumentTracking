import SectionDashboard from "@/Components/Employee/SectionDashboard";

export default function Dashboard(props) {
    return (
        <SectionDashboard
            {...props}
            title="Compliance Dashboard"
            eyebrow="Compliance Section"
            blurb="Anything sent to Compliance waits here until someone scans it in."
        />
    );
}
