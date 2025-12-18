import React from "react";
import QuickActionCard from "@/components/ui/QuickActionCard";

function ProgressProfile() {
  return (
    <QuickActionCard
      bgColor="#EAE2FF"
      imageSrc="/images/wisky-search.png" // Place your image in public/images/ui/cat-scientist.png
      text={"Progress Profile"}
      textColor="#8C6FE6"
      style={{ boxShadow: "0 4px 0 0 #b6a3d8" }}
    />
  );
}

export default ProgressProfile;
