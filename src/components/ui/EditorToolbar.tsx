"use client";
import { useState, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiAlignJustify,
  FiType,
} from "react-icons/fi";
import { BsListOl, BsPalette, BsPaintBucket } from "react-icons/bs";

interface EditorToolbarProps {
  editor: Editor | null;
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  const fontMenuRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const highlightPickerRef = useRef<HTMLDivElement>(null);

  const fonts = [
    { label: "Default", value: "" },
    { label: "Arial", value: "Arial, sans-serif" },
    { label: "Times New Roman", value: "Times New Roman, serif" },
    { label: "Courier New", value: "Courier New, monospace" },
    { label: "Georgia", value: "Georgia, serif" },
    { label: "Verdana", value: "Verdana, sans-serif" },
    { label: "Comic Sans MS", value: "Comic Sans MS, cursive" },
    { label: "Impact", value: "Impact, sans-serif" },
  ];

  const colors = [
    { label: "Black", value: "#000000" },
    { label: "Red", value: "#EF4444" },
    { label: "Orange", value: "#F97316" },
    { label: "Yellow", value: "#EAB308" },
    { label: "Green", value: "#22C55E" },
    { label: "Blue", value: "#3B82F6" },
    { label: "Purple", value: "#A855F7" },
    { label: "Pink", value: "#EC4899" },
    { label: "Gray", value: "#6B7280" },
  ];

  const highlights = [
    { label: "None", value: "" },
    { label: "Yellow", value: "#FEF08A" },
    { label: "Green", value: "#BBF7D0" },
    { label: "Blue", value: "#BFDBFE" },
    { label: "Pink", value: "#FBCFE8" },
    { label: "Orange", value: "#FED7AA" },
    { label: "Purple", value: "#E9D5FF" },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        fontMenuRef.current &&
        !fontMenuRef.current.contains(event.target as Node)
      ) {
        setShowFontMenu(false);
      }
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setShowColorPicker(false);
      }
      if (
        highlightPickerRef.current &&
        !highlightPickerRef.current.contains(event.target as Node)
      ) {
        setShowHighlightPicker(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 p-2 px-4 flex items-center gap-1 flex-wrap bg-white">
      {/* Text Formatting */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-100 transition ${
          editor.isActive("bold") ? "bg-gray-200" : ""
        }`}
        title="Bold (Ctrl+B)"
      >
        <FiBold size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-100 transition ${
          editor.isActive("italic") ? "bg-gray-200" : ""
        }`}
        title="Italic (Ctrl+I)"
      >
        <FiItalic size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-2 rounded hover:bg-gray-100 transition ${
          editor.isActive("underline") ? "bg-gray-200" : ""
        }`}
        title="Underline (Ctrl+U)"
      >
        <FiUnderline size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Headings */}
      <button
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        className={`px-3 py-2 rounded hover:bg-gray-100 transition text-sm font-medium ${
          editor.isActive("heading", { level: 1 }) ? "bg-gray-200" : ""
        }`}
        title="Heading 1"
      >
        H1
      </button>
      <button
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        className={`px-3 py-2 rounded hover:bg-gray-100 transition text-sm font-medium ${
          editor.isActive("heading", { level: 2 }) ? "bg-gray-200" : ""
        }`}
        title="Heading 2"
      >
        H2
      </button>
      <button
        onClick={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        className={`px-3 py-2 rounded hover:bg-gray-100 transition text-sm font-medium ${
          editor.isActive("heading", { level: 3 }) ? "bg-gray-200" : ""
        }`}
        title="Heading 3"
      >
        H3
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Font Family */}
      <div className="relative" ref={fontMenuRef}>
        <button
          onClick={() => setShowFontMenu(!showFontMenu)}
          className="p-2 rounded hover:bg-gray-100 transition flex items-center gap-1"
          title="Font Family"
        >
          <FiType size={18} />
        </button>
        {showFontMenu && (
          <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[180px]">
            {fonts.map((font) => (
              <button
                key={font.value || "default"}
                onClick={() => {
                  if (font.value) {
                    editor.chain().focus().setFontFamily(font.value).run();
                  } else {
                    editor.chain().focus().unsetFontFamily().run();
                  }
                  setShowFontMenu(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                style={{ fontFamily: font.value || "inherit" }}
              >
                {font.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Text Color */}
      <div className="relative" ref={colorPickerRef}>
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="p-2 rounded hover:bg-gray-100 transition"
          title="Text Color"
        >
          <BsPalette size={18} />
        </button>
        {showColorPicker && (
          <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2">
            <div className="grid grid-cols-3 gap-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => {
                    editor.chain().focus().setColor(color.value).run();
                    setShowColorPicker(false);
                  }}
                  className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500 transition"
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                  aria-label={color.label}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Highlight Color */}
      <div className="relative" ref={highlightPickerRef}>
        <button
          onClick={() => setShowHighlightPicker(!showHighlightPicker)}
          className="p-2 rounded hover:bg-gray-100 transition"
          title="Highlight"
        >
          <BsPaintBucket size={18} />
        </button>
        {showHighlightPicker && (
          <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2">
            <div className="grid grid-cols-3 gap-2">
              {highlights.map((highlight) => (
                <button
                  key={highlight.value || "none"}
                  onClick={() => {
                    if (highlight.value) {
                      editor
                        .chain()
                        .focus()
                        .setHighlight({ color: highlight.value })
                        .run();
                    } else {
                      editor.chain().focus().unsetHighlight().run();
                    }
                    setShowHighlightPicker(false);
                  }}
                  className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500 transition"
                  style={{
                    backgroundColor: highlight.value || "#ffffff",
                  }}
                  title={highlight.label}
                  aria-label={highlight.label}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Lists */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-100 transition ${
          editor.isActive("bulletList") ? "bg-gray-200" : ""
        }`}
        title="Bullet List"
      >
        <FiList size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-gray-100 transition ${
          editor.isActive("orderedList") ? "bg-gray-200" : ""
        }`}
        title="Numbered List"
      >
        <BsListOl size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Text Alignment */}
      <button
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={`p-2 rounded hover:bg-gray-100 transition ${
          editor.isActive({ textAlign: "left" }) ? "bg-gray-200" : ""
        }`}
        title="Align Left"
      >
        <FiAlignLeft size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className={`p-2 rounded hover:bg-gray-100 transition ${
          editor.isActive({ textAlign: "center" }) ? "bg-gray-200" : ""
        }`}
        title="Align Center"
      >
        <FiAlignCenter size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className={`p-2 rounded hover:bg-gray-100 transition ${
          editor.isActive({ textAlign: "right" }) ? "bg-gray-200" : ""
        }`}
        title="Align Right"
      >
        <FiAlignRight size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        className={`p-2 rounded hover:bg-gray-100 transition ${
          editor.isActive({ textAlign: "justify" }) ? "bg-gray-200" : ""
        }`}
        title="Justify"
      >
        <FiAlignJustify size={18} />
      </button>
    </div>
  );
}
