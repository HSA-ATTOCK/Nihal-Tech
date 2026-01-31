"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Container from "@/components/Container";
import Input from "@/components/Input";
import Button from "@/components/Button";

export default function ContactPage() {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setEmail(session.user.email || "");
      setName(session.user.name || "");
    }
  }, [session]);

  const handleSubmit = async () => {
    if (!message || !subject) {
      setStatus("Please fill subject and message.");
      return;
    }
    if (!session?.user && !email) {
      setStatus("Email is required so we can respond.");
      return;
    }

    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Could not send");
      setStatus("Message sent. We have emailed you a copy.");
      if (!session?.user) setEmail("");
      setMessage("");
      setSubject("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-white via-[#eef2f9] to-[#e1e9fb] py-12">
      <Container>
        <div className="max-w-5xl mx-auto grid gap-8 lg:grid-cols-[1.05fr_0.95fr] items-start">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.18em]">
                Contact
              </p>
              <h1 className="text-3xl font-bold text-slate-900">
                How can we help?
              </h1>
              <p className="text-slate-600">
                Send us a note and we will reply within one business day. If you
                are logged in, we will use your account email.
              </p>
            </div>

            {status && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {status}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Email
                </label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={!!session?.user}
                />
                {session?.user && (
                  <p className="text-xs text-slate-500 mt-1">
                    Using your account email ({session.user.email}).
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Subject
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg bg-white border border-slate-200 text-slate-900 p-4 focus:border-[#1f4b99] focus:ring-2 focus:ring-[#1f4b99]/20 outline-none shadow-sm"
                  placeholder="Share details about your request"
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full justify-center"
              >
                {submitting ? "Sending..." : "Send message"}
              </Button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-slate-900">
                Contact details
              </h2>
              <p className="text-sm text-slate-600">
                Prefer a direct line? Use any of the channels below.
              </p>
            </div>
            <div className="space-y-3 text-slate-700 text-sm">
              <p>WhatsApp: +44 7473 516168</p>
              <p>Email: info@nihaltech.co.uk</p>
              <p>Address: 179 North Lane Rushmoor Aldershot GUI24SY</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Hours: Monday to Friday, 9:00-17:00 UK time. We aim to respond
              within one business day.
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
