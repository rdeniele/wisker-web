"use client";

import React from "react";
import PageHeader from "@/components/ui/pageheader";
import Mascot from "@/components/ui/Mascot";

export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-4">
        <Mascot name="hi" size={84} className="hidden shrink-0 sm:block" />
        <PageHeader
          centered={false}
          title="Share your feedback"
          subtitle="Help us improve Wisker by sharing your thoughts and suggestions."
        />
      </div>

      {/* Google Form Embed */}
      <div className="card mt-6 overflow-hidden rounded-[24px]">
        <iframe
          title="Wisker feedback form"
          src="https://docs.google.com/forms/d/e/1FAIpQLSe2nx39Yw2wzqQH-DMlMm96p4GKMZAgW66P-ACxVOiKET-_kQ/viewform?embedded=true"
          width="100%"
          height="1200"
          frameBorder="0"
          marginHeight={0}
          marginWidth={0}
          className="block h-[1200px] w-full"
        >
          Loading…
        </iframe>
      </div>
    </div>
  );
}
