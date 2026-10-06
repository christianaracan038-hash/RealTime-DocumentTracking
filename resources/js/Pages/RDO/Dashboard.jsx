import SectionDashboard from "@/Components/Employee/SectionDashboard";

export default function Dashboard(props) {
    return (
        <SectionDashboard
            {...props}
            title="RDO Dashboard"
            eyebrow="RDO / ARDO Office"
            blurb="Documents sent to the RDO / ARDO Office stay here until someone scans them in."
        />
    );
}
