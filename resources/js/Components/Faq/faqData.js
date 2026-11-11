export const FAQ_CATEGORIES = [
    {
        id: "getting-started",
        label: "Getting Started",
        items: [
            {
                id: "sign-in",
                question: "How do I sign in?",
                steps: [
                    "Enter your account credentials in the sign-in form.",
                    "Press the sign-in button.",
                    "You will be taken to the dashboard of your section.",
                ],
                image: null,
            },
            {
                id: "what-is-this",
                question: "What does Register, Scan, Track mean?",
                steps: [
                    "Register: create the referral so it receives a tracking number and QR code.",
                    "Scan: receive or forward the document by scanning its QR code.",
                    "Track: follow the document's movement from section to section.",
                ],
                image: null,
            },
        ],
    },
    {
        id: "registering",
        label: "Registering a Referral",
        items: [
            {
                id: "register-referral",
                question: "How do I register a referral?",
                steps: [
                    "Open the Referrals page.",
                    "Fill in the details of the referral.",
                    "Save it. A tracking number and QR code are generated.",
                ],
                image: null,
            },
            {
                id: "print-slip",
                question: "How do I print the reference slip?",
                steps: [
                    "Open the referral from the Referrals page.",
                    "Open its slip and press Print.",
                    "Attach the printed slip to the physical document.",
                ],
                image: null,
            },
        ],
    },
    {
        id: "receiving",
        label: "Receiving Documents",
        items: [
            {
                id: "scan-receive",
                question: "How do I receive a document by scanning?",
                steps: [
                    "Open the scanner from your dashboard and choose Receive.",
                    "Point the camera at the QR code on the slip, one document at a time.",
                    "Wait for the success message before scanning the next one.",
                ],
                image: null,
            },
            {
                id: "type-tracking",
                question: "What if the QR code cannot be scanned?",
                steps: [
                    "Open the scanner and find the tracking number field.",
                    "Type the tracking number printed on the slip.",
                    "Confirm to receive the document.",
                ],
                image: null,
            },
        ],
    },
    {
        id: "forwarding",
        label: "Forwarding Documents",
        items: [
            {
                id: "forward-document",
                question: "How do I forward a document to another section?",
                steps: [
                    "Open the scanner and choose Forward.",
                    "Select the destination section.",
                    "Scan the QR code or type the tracking number.",
                ],
                image: null,
            },
        ],
    },
    {
        id: "tracking",
        label: "Tracking & Remarks",
        items: [
            {
                id: "add-remarks",
                question: "How do I add a remark to a document?",
                steps: [
                    "Open the Documents page.",
                    "Select the document you are holding.",
                    "Type your remark and save it. It appears in the document's history.",
                ],
                image: null,
            },
            {
                id: "movement-history",
                question: "How do I see where a document has been?",
                steps: [
                    "Open the document from the list.",
                    "Check its movement history for each section and employee that handled it.",
                ],
                image: null,
            },
        ],
    },
];
