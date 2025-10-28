import React from 'react';


export default function JsonEditor({ placeholder, value, onChange, spellCheck = false }) {
  return (
    <textarea
      className="json-input"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      spellCheck={spellCheck}
    />
  );
}