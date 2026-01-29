import Container from "@/components/Container";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-white via-[#eef2f9] to-[#e1e9fb] py-12">
      <Container>
        <div className="max-w-4xl mx-auto space-y-6 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.18em]">
              Legal
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              Privacy Policy
            </h1>
            <p className="text-slate-600 text-sm">
              How we collect, use, and protect your information.
            </p>
          </div>
          <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
            <p>
              We collect the information you provide when creating an account,
              placing orders, or booking repairs. This includes contact details,
              device information, and order history.
            </p>
            <p>
              We use your data to fulfill orders, provide support, improve our
              services, and send important updates about bookings or security.
              We do not sell your data.
            </p>
            <p>
              Payments are processed by trusted third-party providers; we do not
              store full card details.
            </p>
            <p>
              You can request access, correction, or deletion of your personal
              data by contacting support@nihaltech.com.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
