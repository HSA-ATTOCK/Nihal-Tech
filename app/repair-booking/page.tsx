"use client";
import axios from "axios";
import { useState } from "react";
import Container from "@/components/Container";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Repair() {
  const { status } = useSession();
  const pathname = usePathname();
  const [phoneModel, setPhoneModel] = useState("");
  const [issue, setIssue] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const book = async () => {
    if (!phoneModel || !issue || !date || !time) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const dateTime = `${date}T${time}`;
      await axios.post("/api/repair", {
        phoneModel,
        issue: contact ? `${issue}\nContact preference: ${contact}` : issue,
        date: dateTime,
      });
      setMessage("Repair booked successfully!");
      setPhoneModel("");
      setIssue("");
      setDate("");
      setTime("");
      setContact("");
    } catch (error: unknown) {
      const fallback = "Booking failed. Please try again.";
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } })
          .response?.data?.message === "string"
      ) {
        setMessage(
          (error as { response?: { data?: { message?: string } } }).response
            ?.data?.message || fallback,
        );
      } else {
        setMessage(fallback);
      }
    } finally {
      setLoading(false);
    }
  };

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-700 shadow-sm max-w-md w-full">
          <h2 className="text-3xl font-bold mb-3 text-slate-900">
            🔧 Book a Repair
          </h2>
          <p className="mb-6">Login or sign up to book your repair.</p>
          <div className="flex gap-3 justify-center">
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
              className="bg-[#1f4b99] text-white visited:text-white px-6 py-2.5 rounded-full hover:bg-[#163a79] transition-all duration-200 shadow-sm font-semibold"
            >
              Login
            </Link>
            <Link
              href={`/signup?callbackUrl=${encodeURIComponent(pathname)}`}
              className="px-6 py-2.5 rounded-full border border-[#1f4b99] text-[#1f4b99] visited:text-[#1f4b99] bg-white hover:bg-[#1f4b99] hover:text-white hover:visited:text-white transition-colors shadow-sm"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <Container>
        <div className="max-w-5xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-2 items-stretch">
            <div className="bg-white border border-slate-200 p-10 rounded-3xl shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="text-4xl">🔧</div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    Book a Repair
                  </h2>
                  <p className="text-slate-600 text-sm">
                    Trusted technicians, fast turnaround
                  </p>
                </div>
              </div>

              {message && (
                <div className="mb-4 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  {message}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="text-slate-700 text-sm font-semibold mb-2 block">
                    📱 Phone Model
                  </label>
                  <Input
                    placeholder="e.g., iPhone 14 Pro, Samsung S23"
                    value={phoneModel}
                    onChange={(e) => setPhoneModel(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-slate-700 text-sm font-semibold mb-2 block">
                    🔍 Issue Description
                  </label>
                  <textarea
                    className="bg-white border border-slate-200 focus:border-[#1f4b99] focus:ring-2 focus:ring-[#1f4b99]/20 outline-none p-4 w-full rounded-xl text-slate-900 placeholder:text-slate-400 transition-all duration-200 resize-none shadow-sm"
                    placeholder="Describe the issue (e.g., cracked screen, battery problems)"
                    rows={4}
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-700 text-sm font-semibold mb-2 block">
                      📅 Preferred Date
                    </label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 text-sm font-semibold mb-2 block">
                      ⏰ Preferred Time (9am - 5pm)
                    </label>
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="bg-white border border-slate-200 focus:border-[#1f4b99] focus:ring-2 focus:ring-[#1f4b99]/20 outline-none p-3 w-full rounded-xl text-slate-900 placeholder:text-slate-400 transition-all duration-200 shadow-sm"
                    >
                      <option value="">Select a time</option>
                      {[...Array(9)].map((_, idx) => {
                        const hour = 9 + idx;
                        const label = `${hour}:00`;
                        const value = `${hour.toString().padStart(2, "0")}:00`;
                        return (
                          <option
                            key={value}
                            value={value}
                            className="bg-white"
                          >
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-700 text-sm font-semibold mb-2 block">
                      📞 Contact Preference (optional)
                    </label>
                    <Input
                      placeholder="Phone or email"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={book}
                  className="w-full mt-4 text-lg"
                  disabled={loading}
                >
                  {loading ? "🔄 Booking..." : "✨ Confirm Booking"}
                </Button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-10 rounded-3xl shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500 mb-2">
                  Why choose us
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  Premium service with warranty
                </h3>
                <ul className="space-y-3 text-slate-700">
                  <li className="flex gap-2 items-start">
                    <span className="text-emerald-500">✔</span>
                    Certified technicians and genuine parts
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="text-emerald-500">✔</span>
                    Same-day repairs for common issues
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="text-emerald-500">✔</span>
                    90-day repair warranty and live updates
                  </li>
                  <li className="flex gap-2 items-start">
                    <span className="text-emerald-500">✔</span>
                    Free diagnostics if you proceed with repair
                  </li>
                </ul>
              </div>

              <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-sm">
                Need help deciding?{" "}
                <span className="text-slate-900">Talk to our support</span> or
                schedule a callback after booking.
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
