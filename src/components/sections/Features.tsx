"use client";
import React from "react";
import { FaMagic, FaCalendarAlt, FaTags, FaMapMarkedAlt, FaClipboardList } from "react-icons/fa";

const features = [
			{
				  icon: <FaMagic size={28} style={{ color: "#FFD600" }} />,
			  title: "Purr-sonalized Cat Quizzes",
			  desc: "AI whips up quizzes from your notes, hunting your weak spots like a laser pointer. Study game = next level, fr fr.",
			  color: "#fffbea",
			  border: "#FFD600",
			  secured: true
		},
	   {
				  icon: <FaClipboardList size={28} style={{ color: "#FF69B4" }} />,
			  title: "Flashcat Cards",
			  desc: "Flashcards that vibe with your study flow, using spaced repetition so you never fur-get. Big brain energy, no cap.",
			  color: "#fff0fa",
			  border: "#FF69B4",
			  secured: true
	},
	   {
				  icon: <FaMapMarkedAlt size={28} style={{ color: "#00E676" }} />,
			  title: "Cat-nnected Concept Maps",
			  desc: "Visual learning that slaps! Build your own cat-tastic maps to see how ideas are all tangled up like yarn.",
			  color: "#f0fff4",
			  border: "#00E676",
			  comingSoon: true
	},
	   {
				  icon: <FaCalendarAlt size={28} style={{ color: "#40C4FF" }} />,
			  title: "Catnap Study Schedules",
			  desc: "AI sets up study schedules that fit your vibe, so you can chill, nap, and still ace your exams. Study = pawsome.",
			  color: "#eaf8ff",
			  border: "#40C4FF",
			  comingSoon: true
	},
	   {
				  icon: <FaTags size={28} style={{ color: "#FF9100" }} />,
			  title: "Tag-a-Long Cat Exams",
			  desc: "Exams built from all your notes with the same subject tag. Prep like a top cat, no stress, just flex.",
			  color: "#fff7e6",
			  border: "#FF9100",
			  comingSoon: true
	},
	   {
				  icon: <FaMagic size={28} style={{ color: "#A3CFFF" }} />,
			  title: "Meowgic AI",
			  desc: "Next-gen AI that learns your study habits and keeps leveling up your experience. Study smarter, not harder. Coming soon, stay tuned!",
			  color: "#f4faff",
			  border: "#A3CFFF",
			  comingSoon: true
	},
];

export default function Features() {
	   return (
		   <section className="w-full bg-gray-50 py-10 sm:py-16" id="features">
			   <div className="max-w-5xl mx-auto px-2 sm:px-4">
				   <h1 className="font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-gray-700 text-center mb-6 sm:mb-8 tracking-tight leading-tight">
					   All the Cat-tastic Tools to<br />Slay Your Exams
				   </h1>
				   <p className="text-gray-600 text-base sm:text-lg md:text-xl text-center mb-8 sm:mb-12">
					   Our AI turns your notes into purr-fect, personalized study vibes. Study smarter, not harder. Paw-sitive results only!
				   </p>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
					{features.map((feature) => (
						<div
							key={feature.title}
							className={`transition-transform duration-150 cursor-pointer flex flex-col items-center bg-white rounded-2xl border-4 shadow-sm px-3 sm:px-4 py-5 sm:py-6 gap-2 sm:gap-3 ${feature.comingSoon ? 'opacity-60' : ''}`}
							style={{ background: feature.color, borderColor: feature.border, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
							onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.03)")}
							onMouseLeave={e => (e.currentTarget.style.transform = "")}
						>
							<div className="mb-1 sm:mb-2">{feature.icon}</div>
							<h3 className="font-semibold text-base sm:text-lg text-gray-800 text-center mb-1">{feature.title}</h3>
							<p className="text-gray-600 text-sm sm:text-base text-center m-0 mb-2">{feature.desc}</p>
							{feature.comingSoon && (
								<span className="text-xs font-medium text-purple-500 bg-purple-100 px-2 py-1 rounded-full">Coming Soon</span>
							)}
							{feature.secured && (
								<span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Secured</span>
							)}
						</div>
					))}
				</div>
			</div>
		</section>
		);
	}
