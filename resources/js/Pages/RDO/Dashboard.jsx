import SectionDashboard from "@/Components/Employee/SectionDashboard";

export default function Dashboard(props) {
    return (
        <SectionDashboard
            {...props}
            title="RDO Dashboard"
            eyebrow="RDO's/ARDO's Office"
            blurb="Anything sent to the RDO's/ARDO's Office waits here until someone scans it in."
        />
    );
}
