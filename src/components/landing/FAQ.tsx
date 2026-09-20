"use client";

import React, { useId, useState } from "react";
import { LuMinus, LuPlus } from "react-icons/lu";
import { cn } from "@/lib/utils";

const faqs: { question: string; answer: string }[] = [
  {
    question: "What is Wisker?",
    answer:
      "Wisker is an AI study tool and learning assistant that transforms your PDFs, lecture slides, and notes into quizzes, flashcards, and summaries. It uses AI-powered content processing and active recall principles to help students study smarter and retain more.",
  },
  {
    question: "How does Wisker use AI for studying?",
    answer:
      "Wisker uses artificial intelligence (AI) to analyze your uploaded study materials and automatically generate structured learning tools like quizzes, flashcards, and summaries. This helps you turn passive reading into active learning without manual formatting.",
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
      "Active recall is a science-backed learning method where you actively test your memory instead of passively reading. Wisker integrates AI-powered active recall generation by turning your study materials into questions and flashcards that strengthen long-term retention.",
  },
  {
    question: "Is Wisker an AI flashcard generator?",
    answer:
      "Yes. Wisker is an AI flashcard generator that automatically extracts key concepts from your uploaded files and converts them into study cards. This helps students review faster and build long-term memory.",
  },
  {
    question: "Can Wisker help with exam preparation and board exams?",
    answer:
      "Yes. Wisker is designed as an AI exam preparation tool for students who want to study efficiently. It helps prepare for quizzes, finals, and board exams by generating structured review material from your own notes.",
  },
  {
    question: "What file types does Wisker AI support?",
    answer:
      "Wisker supports PDF documents, PowerPoint presentations, and text-based notes. The AI processes these files to generate structured learning content such as summaries, quizzes, and flashcards.",
  },
  {
    question: "Can I organize multiple subjects in Wisker?",
    answer:
      "Yes. Wisker acts as an AI-powered study organizer, allowing you to group files by subject or topic. This makes it easier to manage multiple courses, modules, and learning materials in one structured space.",
  },
  {
    question: "Is Wisker free to use?",
    answer:
      "Wisker offers a free AI study tool tier so students can experience AI-generated quizzes and flashcards. Premium features may be added later for advanced learning and productivity tools.",
  },
  {
    question: "Who is Wisker for?",
    answer:
      "Wisker is built for students, exam takers, and self-learners who want to use AI for studying, active recall learning, and exam preparation. It is ideal for anyone looking to study smarter using their own materials.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <section
      id="faq"
      aria-labelledby={`${baseId}-heading`}
      className="mx-auto w-full max-w-[840px] px-5 pb-16 sm:px-6 sm:pb-24"
    >
      <h2
        id={`${baseId}-heading`}
        className="mb-8 text-center text-[clamp(1.875rem,5vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.015em]"
      >
        Questions, answered
      </h2>
      <div className="grid gap-3">
        {faqs.map((item, i) => {
          const open = openIndex === i;
          const panelId = `${baseId}-panel-${i}`;
          return (
            <div
              key={item.question}
              className="overflow-hidden rounded-[22px] border border-[#f0e4d4] bg-white shadow-[0_4px_0_#efe0cc]"
            >
              <h3>
                <button
                  type="button"
                  id={`${panelId}-btn`}
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="flex min-h-[64px] w-full items-center gap-4 px-5 py-4 text-left font-display text-[17px] font-medium leading-snug text-ink sm:px-[26px] sm:py-[22px] sm:text-xl"
                >
                  <span className="flex-1">{item.question}</span>
                  <span
                    aria-hidden
                    className={cn(
                      "grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[10px] bg-[#ffefd9] text-orange-800 transition-transform duration-200",
                      open && "rotate-180",
                    )}
                  >
                    {open ? (
                      <LuMinus className="h-[18px] w-[18px]" />
                    ) : (
                      <LuPlus className="h-[18px] w-[18px]" />
                    )}
                  </span>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={`${panelId}-btn`}
                inert={!open}
                className={cn(
                  "grid transition-[grid-template-rows] duration-300 ease-out",
                  open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="overflow-hidden">
                  <p className="max-w-[660px] px-5 pb-6 text-base leading-[1.6] text-gray-600 sm:px-[26px] sm:text-[16.5px]">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
