import SectionDashboard from "@/Components/Employee/SectionDashboard";

export default function Dashboard(props) {
    return (
        <SectionDashboard
            {...props}
            title="ONETT Dashboard"
            eyebrow="ONETT Section"
            blurb="Anything sent to ONETT waits here until someone scans it in."
        />
    );
}
