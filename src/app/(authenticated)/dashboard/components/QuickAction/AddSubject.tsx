import React from "react";
import QuickActionCard from "@/components/ui/QuickActionCard";

function AddSubject() {
  return (
    <QuickActionCard
      bgColor="#FFE1E1"
      imageSrc="/images/wisky-read.png" // Place your image in public/images/ui/cat-book.png
      text={"Add Subjects"}
      textColor="#D96B6B"
      style={{ boxShadow: "0 4px 0 0 #d9a3a3" }}
    />
  );
}

export default AddSubject;
