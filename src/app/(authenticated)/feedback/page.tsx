"use client";

import React from "react";

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Share Your Feedback
          </h1>
          <p className="text-gray-600">
            Help us improve Wisker by sharing your thoughts and suggestions
          </p>
        </div>

        {/* Google Form Embed */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <iframe
            src="https://docs.google.com/forms/d/e/1FAIpQLSe2nx39Yw2wzqQH-DMlMm96p4GKMZAgW66P-ACxVOiKET-_kQ/viewform?embedded=true"
            width="100%"
            height="1200"
            frameBorder="0"
            marginHeight={0}
            marginWidth={0}
            className="w-full"
          >
            Loading…
          </iframe>
        </div>
      </div>
    </div>
  );
}