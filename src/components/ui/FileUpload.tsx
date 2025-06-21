import React from 'react';

interface FileUploadProps {
  label?: string;
  accept?: string;
  multiple?: boolean;
  onFileSelect: (files: FileList) => void;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, accept, multiple, onFileSelect, className }) => {
  return (
    <div className={`flex flex-col space-y-2 ${className || ''}`}>
      {label && <label className="font-medium mb-1">{label}</label>}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={e => {
          if (e.target.files) {
            onFileSelect(e.target.files);
          }
        }}
        className="border rounded p-2 focus:ring"
      />
    </div>
  );
};

export default FileUpload;
