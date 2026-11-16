import SectionDashboard from "@/Components/Employee/SectionDashboard";

export default function Dashboard(props) {
    return (
        <SectionDashboard
            {...props}
            title="ONETT Dashboard"
            eyebrow="ONETT Section"
            blurb="Pending Document Intake – ONETT"
        />
    );
}
