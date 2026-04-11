export default function FeedbackWindows() {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4">
            <h1 className="text-2xl font-bold">Feedback</h1>
            <p className="text-center text-gray-600">
                We appreciate your feedback! Please share your thoughts and suggestions to help us improve.
            </p>
            <a
                href="https://forms.gle/your-feedback-form-link"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-anime-primary px-4 py-2 text-sm font-bold text-white transition-all duration-300 hover:scale-105 hover:bg-anime-primary/90 hover:shadow-[0_0_20px_rgba(160,124,254,0.6)] active:scale-95"
            >
                Give Feedback
            </a>
        </div>
    );
}