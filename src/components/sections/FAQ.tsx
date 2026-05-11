"use client";

import React from "react";
import { landingPillOrange } from "@/lib/brand-landing";

const faqs: { question: string; answer: string }[] = [
  {
    question: "What is Wisker?",
    answer:
      "Wisker is an AI study tool and learning assistant that transforms your PDFs, lecture slides, and notes into quizzes, flashcards, and summaries. It uses AI-powered content processing and active recall learning techniques to help students study faster and retain more information.",
  },
  {
    question: "How does Wisker use AI for studying?",
    answer:
      "Wisker uses artificial intelligence (AI) to analyze your uploaded study materials and automatically generate structured learning tools like quizzes, flashcards, and summaries. This helps you turn passive notes into interactive, AI-generated study content for better retention.",
  },
  {
    question: "Can Wisker convert PDF to quiz using AI?",
    answer:
      "Yes. Wisker works as an AI PDF to quiz generator, allowing you to upload PDFs, PowerPoint slides, or notes and instantly convert them into quizzes and flashcards for exam preparation and active recall practice.",
  },
  {
    question:
      "What is active recall and why is it important in AI learning tools?",
    answer:
      "Active recall is a science-backed learning method where you actively test your memory instead of passively reading. Wisker integrates AI-powered active recall generation by turning your study materials into quizzes and flashcards that strengthen memory retention and improve exam performance.",
  },
  {
    question: "Is Wisker an AI flashcard generator?",
    answer:
      "Yes. Wisker is an AI flashcard generator that automatically extracts key concepts from your uploaded files and converts them into study cards. This helps students review faster and build long-term memory retention.",
  },
  {
    question: "Can Wisker help with exam preparation and board exams?",
    answer:
      "Yes. Wisker is designed as an AI exam preparation tool for students who want to study efficiently. It helps prepare for quizzes, finals, and board exams by generating structured review materials from your notes.",
  },
  {
    question: "What file types does Wisker AI support?",
    answer:
      "Wisker supports PDF documents, PowerPoint presentations, and text-based notes. The AI processes these files to generate structured learning content such as summaries, quizzes, and flashcards.",
  },
  {
    question: "Can I organize multiple subjects in Wisker?",
    answer:
      "Yes. Wisker acts as an AI-powered study organizer, allowing you to group files by subject or topic. This makes it easier to manage multiple courses, modules, and learning materials in one structured workspace.",
  },
  {
    question: "Is Wisker free to use?",
    answer:
      "Wisker offers a free AI study tool tier so students can experience AI-generated quizzes and flashcards. Premium features may be added later for advanced learning and productivity tools.",
  },
  {
    question: "Who is Wisker for?",
    answer:
      "Wisker is built for students, exam takers, and self-learners who want to use AI for studying, active recall learning, and exam preparation. It is ideal for anyone looking to study smarter using AI-powered tools.",
  },
];

export default function FAQ() {
  return (
    <section
      id="faq"
      className="font-fredoka w-full py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className={landingPillOrange}>FAQ</div>
          <h2
            id="faq-heading"
            className="font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#111016] tracking-tight leading-tight"
          >
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((item) => (
            <details
              key={item.question}
              className="group border-2 border-gray-200 rounded-2xl bg-white px-5 sm:px-6 open:border-[#b3d1ff]/60 open:shadow-md transition-all"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 py-4 sm:py-5 font-bold text-lg sm:text-xl text-gray-900 [&::-webkit-details-marker]:hidden">
                <span className="text-left">{item.question}</span>
                <span
                  className="shrink-0 text-[#7678ed] text-xl leading-none transition-transform duration-200 group-open:rotate-180"
                  aria-hidden
                >
                  ▼
                </span>
              </summary>
              <div className="border-t border-gray-100 pt-1 pb-4 sm:pb-5">
                <p className="text-gray-600 text-lg sm:text-xl leading-relaxed pr-2">
                  {item.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
