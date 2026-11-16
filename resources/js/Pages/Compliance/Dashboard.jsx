import SectionDashboard from "@/Components/Employee/SectionDashboard";

export default function Dashboard(props) {
    return (
        <SectionDashboard
            {...props}
            title="Compliance Dashboard"
            eyebrow="Compliance Section"
            blurb="Pending Compliance Receipt"
        />
    );
}
