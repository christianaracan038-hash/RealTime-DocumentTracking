import SectionDashboard from "@/Components/Employee/SectionDashboard";

export default function Dashboard(props) {
    return (
        <SectionDashboard
            {...props}
            title="Assessment Dashboard"
            eyebrow="Assessment Section"
            blurb="Anything sent to Assessment waits here until someone scans it in."
        />
    );
}
