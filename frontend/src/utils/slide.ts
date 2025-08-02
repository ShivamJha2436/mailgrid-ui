import sendAnimation from "../assets/lottie/slide1.json";
import contactsAnimation from "../assets/lottie/slide2.json";
import templatesAnimation from "../assets/lottie/slide3.json";
import attachmentsAnimation from "../assets/lottie/slide4.json";
import engineAnimation from "../assets/lottie/slide5.json";
import filtersAnimation from "../assets/lottie/slide6.json";
import previewAnimation from "../assets/lottie/slide7.json";

export const slides = [
    {
        title: "📬 Send Emails, Simply",
        desc: "Mailgrid lets you send bulk personalized emails with just a few clicks — no setup or tech skills needed. Perfect for newsletters, campaigns, or updates — powered by a simple, fast CLI or desktop UI.",
        animation: sendAnimation,
    },
    {
        title: "📁 Import Your Contacts",
        desc: "Upload a CSV or sync from Google Sheets. We automatically clean up duplicates, handle column headers, and let you filter or segment contacts based on your campaign needs.",
        animation: contactsAnimation,
    },
    {
        title: "🎨 Beautiful Email Templates",
        desc: "Use your own HTML design or pick from our ready-made templates. Add placeholders like {{name}} or {{company}}, and we’ll personalize each email for every recipient automatically.",
        animation: templatesAnimation,
    },
    {
        title: "📎 Attach Files Easily",
        desc: "Need to send PDFs, brochures, or reports? Just attach them. Mailgrid supports secure file attachments up to 10MB per recipient — no additional setup required.",
        animation: attachmentsAnimation,
    },
    {
        title: "⚙️ Smart Delivery Engine",
        desc: "Our engine batches emails, handles retries on failures, and keeps your SMTP credentials secure. Whether you're sending to 50 or 5,000 — it’s fast, safe, and efficient.",
        animation: engineAnimation,
    },
    {
        title: "🔍 Target with Filters",
        desc: "Send only to the people who matter. Use simple filters like `age > 25` or `country = US` to segment your audience. Combine multiple conditions to reach your exact target group.",
        animation: filtersAnimation,
    },
    {
        title: "🚀 Preview & Launch",
        desc: "Preview your email with real data before sending. Check formatting, personalization, attachments, and filters. When you're ready — launch with a click and track delivery.",
        animation: previewAnimation,
    },
];