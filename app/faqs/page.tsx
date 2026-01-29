import Container from "@/components/Container";

const faqs = [
  {
    q: "How long do repairs take?",
    a: "Most common phone repairs are completed within 24 hours. Laptops and consoles vary based on parts availability, but we keep you updated at each step.",
  },
  {
    q: "Do you use genuine parts?",
    a: "We source manufacturer-grade or equivalent premium parts and back repairs with a 90-day warranty.",
  },
  {
    q: "Where do you operate?",
    a: "We serve customers across the UK with courier pickup and delivery options.",
  },
  {
    q: "How do I track my order or repair?",
    a: "Log in and visit the Orders or Bookings page to see live status, dates, and next steps.",
  },
];

export default function FaqsPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-white via-[#eef2f9] to-[#e1e9fb] py-12">
      <Container>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.18em]">
              Support
            </p>
            <h1 className="text-3xl font-bold text-slate-900">FAQs</h1>
            <p className="text-slate-600">
              Answers to common questions about repairs, orders, and deliveries.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((item) => (
              <div
                key={item.q}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {item.q}
                </h3>
                <p className="text-slate-700 text-sm leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
