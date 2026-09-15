import SectionDashboard from "@/Components/Employee/SectionDashboard";

export default function Dashboard(props) {
    return (
        <SectionDashboard
            {...props}
            title="CSS Dashboard"
            eyebrow="Client Support Section"
            blurb="Anything sent to Client Support waits here until someone scans it in."
        />
    );
}
