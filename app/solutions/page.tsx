"use client";

import Container from "@/components/Container";
import { useState } from "react";

const solutions = [
  {
    title: "Website Development",
    description:
      "Fast, mobile-friendly websites designed to convert visitors into customers.",
    features: [
      "Custom design",
      "SEO optimized",
      "Contact forms",
      "Booking systems",
      "2-week delivery",
    ],
    icon: "🌐",
  },
  {
    title: "Business Automation",
    description: "Automate repetitive tasks to save time and reduce errors.",
    features: [
      "Workflow analysis",
      "Custom scripts",
      "Data sync between apps",
      "1-week implementation",
    ],
    icon: "⚙️",
  },
  {
    title: "Complete System",
    description: "Website + automations working together for maximum results.",
    features: [
      "Website development",
      "Lead capture automation",
      "Follow-up sequences",
      "CRM integration",
      "Analytics dashboard",
    ],
    icon: "🚀",
  },
];

const process = [
  {
    step: "1",
    title: "Discovery",
    description:
      "We identify your biggest time-wasters in a free 15-minute call.",
  },
  {
    step: "2",
    title: "Proposal",
    description: "You receive a custom plan with clear ROI calculations.",
  },
  {
    step: "3",
    title: "Implementation",
    description: "Your first automation goes live within 1 week.",
  },
];

export default function SolutionsPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    solution: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/solutions-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: "success",
          message:
            "Thank you for your inquiry! We'll get back to you within 24 hours.",
        });
        setFormData({
          name: "",
          email: "",
          phone: "",
          company: "",
          solution: "",
          message: "",
        });
      } else {
        setStatus({
          type: "error",
          message: data.error || "Something went wrong. Please try again.",
        });
      }
    } catch {
      setStatus({
        type: "error",
        message: "Failed to send inquiry. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="pb-16">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-white via-[#eef2f9] to-[#e1e9fb] border-b border-slate-200">
        <Container>
          <div className="py-16 text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-semibold text-[#1f4b99]">
              Web Development & Automation
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-slate-900">
              Digital Solutions for Your Business
            </h1>
            <p className="text-lg text-slate-600">
              Custom websites and business automation tools to help you grow and
              save time.
            </p>
          </div>
        </Container>
      </div>

      <Container>
        {/* What We Offer Section */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.18em]">
              Digital Solutions
            </p>
            <h2 className="text-3xl font-bold text-slate-900 mt-2">
              Website Development & Automation
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {solutions.map((solution) => (
              <div
                key={solution.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{solution.icon}</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {solution.title}
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  {solution.description}
                </p>
                <ul className="space-y-2 mb-6">
                  {solution.features.map((feature) => (
                    <li
                      key={feature}
                      className="text-sm text-slate-700 flex items-start"
                    >
                      <span className="text-[#1f4b99] mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    setFormData({ ...formData, solution: solution.title });
                    document
                      .getElementById("contact-form")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full bg-[#1f4b99] text-white px-4 py-2 rounded-lg hover:bg-[#163a79] transition-colors font-semibold text-sm"
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Our Process Section */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.18em]">
              How It Works
            </p>
            <h2 className="text-3xl font-bold text-slate-900 mt-2">
              Our Process
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {process.map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1f4b99]/10 text-[#1f4b99] font-bold text-xl mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="mt-16" id="contact-form">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.18em]">
                Get In Touch
              </p>
              <h2 className="text-3xl font-bold text-slate-900 mt-2">
                Request a Quote
              </h2>
              <p className="text-slate-600 mt-2">
                Fill out the form below and we&apos;ll get back to you within 24
                hours.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6"
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-slate-900 mb-2"
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f4b99]/30 focus:border-[#1f4b99]"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-slate-900 mb-2"
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f4b99]/30 focus:border-[#1f4b99]"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-semibold text-slate-900 mb-2"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f4b99]/30 focus:border-[#1f4b99]"
                    placeholder="+44 1234 567890"
                  />
                </div>

                <div>
                  <label
                    htmlFor="company"
                    className="block text-sm font-semibold text-slate-900 mb-2"
                  >
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f4b99]/30 focus:border-[#1f4b99]"
                    placeholder="Your Company"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="solution"
                  className="block text-sm font-semibold text-slate-900 mb-2"
                >
                  Solution Interested In *
                </label>
                <select
                  id="solution"
                  name="solution"
                  required
                  value={formData.solution}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f4b99]/30 focus:border-[#1f4b99]"
                >
                  <option value="">Select a solution</option>
                  <option value="Website Development">
                    Website Development
                  </option>
                  <option value="Business Automation">
                    Business Automation
                  </option>
                  <option value="Complete System">Complete System</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-semibold text-slate-900 mb-2"
                >
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f4b99]/30 focus:border-[#1f4b99] resize-none"
                  placeholder="Tell us about your project and requirements..."
                />
              </div>

              {status.message && (
                <div
                  className={`p-4 rounded-lg ${
                    status.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {status.message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1f4b99] text-white px-6 py-3 rounded-lg hover:bg-[#163a79] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Inquiry"}
              </button>
            </form>
          </div>
        </div>
      </Container>
    </div>
  );
}
