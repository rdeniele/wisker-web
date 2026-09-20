import React from "react";
import SubjectForm from "./SubjectForm";

interface UpdateSubjectProps {
  subjectId: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

function UpdateSubject({ subjectId, onClose, onSuccess }: UpdateSubjectProps) {
  return (
    <SubjectForm
      mode="update"
      subjectId={subjectId}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

export default UpdateSubject;
