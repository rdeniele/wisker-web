import React from "react";
import { FaEnvelope, FaFacebook, FaLinkedin } from "react-icons/fa";

const CommunitySection = () => (
  <>
    <div className="w-full border-t-2 border-gray-200 mt-6 sm:mt-8"></div>
    <div className="w-full flex flex-col items-center justify-center py-8 sm:py-12 gap-6">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center text-[#676561] mb-2">
        Join <span className="text-orange-300 font-extrabold">10,000+</span> students already smashing their grades
      </h2>
      <p className="text-gray-700 text-center text-base sm:text-lg max-w-2xl mb-4">
        Join our online community and stay updated! Reach out, follow, and network with Wisker on your favorite platforms.
      </p>
      <div className="flex flex-wrap justify-center items-center gap-6">
        {/* Social icons for Facebook, LinkedIn, Email */}
        <a href="mailto:info@wisker.app" className="flex flex-col items-center gap-2 text-gray-700 font-semibold text-base hover:text-blue-500 transition-colors">
          <FaEnvelope className="w-10 h-10" />
          <span>Email</span>
        </a>
        <a href="https://www.facebook.com/profile.php?id=61577887210771" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-gray-700 font-semibold text-base hover:text-blue-600 transition-colors">
          <FaFacebook className="w-10 h-10" />
          <span>Facebook</span>
        </a>
        <a href="https://www.linkedin.com/company/wisker/?viewAsMember=true" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-gray-700 font-semibold text-base hover:text-blue-700 transition-colors">
          <FaLinkedin className="w-10 h-10" />
          <span>LinkedIn</span>
        </a>
      </div>
    </div>
    <div className="w-full border-t-2 border-gray-200 mb-6 sm:mb-8"></div>
  </>
);

export default CommunitySection;
