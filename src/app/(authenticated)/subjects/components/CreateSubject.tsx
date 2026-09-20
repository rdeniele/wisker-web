import React from "react";
import SubjectForm from "./SubjectForm";

interface CreateSubjectProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

function CreateSubject({ onClose, onSuccess }: CreateSubjectProps) {
  return <SubjectForm mode="create" onClose={onClose} onSuccess={onSuccess} />;
}

export default CreateSubject;
