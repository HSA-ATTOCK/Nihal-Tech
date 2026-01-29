import Container from "@/components/Container";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-white via-[#eef2f9] to-[#e1e9fb] py-12">
      <Container>
        <div className="max-w-4xl mx-auto space-y-6 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.18em]">
              Legal
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              Terms and Conditions
            </h1>
            <p className="text-slate-600 text-sm">
              Key terms for using Nihal Tech services.
            </p>
          </div>
          <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
            <p>
              By using our site, purchasing products, or booking repairs, you
              agree to these terms. Please review them carefully.
            </p>
            <p>
              Repairs include a 90-day workmanship warranty unless otherwise
              stated. Accidental damage, liquid damage progression, or prior
              third-party work may affect eligibility.
            </p>
            <p>
              Orders may be canceled before dispatch; repair bookings can be
              canceled up to 24 hours before the appointment.
            </p>
            <p>
              For any concerns or clarifications, contact support@nihaltech.com.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
