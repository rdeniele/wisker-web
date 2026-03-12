"use client";
import { useEffect, useState, useRef } from "react";
import type { Editor } from "@tiptap/react";
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiType,
} from "react-icons/fi";
import { BsListOl, BsPalette, BsPaintBucket } from "react-icons/bs";

interface BubbleToolbarProps {
  editor: Editor | null;
}

export default function BubbleToolbar({ editor }: BubbleToolbarProps) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const highlightPickerRef = useRef<HTMLDivElement>(null);
  const fontMenuRef = useRef<HTMLDivElement>(null);

  const fonts = [
    { label: "Default", value: "" },
    { label: "Arial", value: "Arial, sans-serif" },
    { label: "Times New Roman", value: "Times New Roman, serif" },
    { label: "Courier New", value: "Courier New, monospace" },
    { label: "Georgia", value: "Georgia, serif" },
    { label: "Verdana", value: "Verdana, sans-serif" },
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
  ];

  const highlights = [
    { label: "None", value: "" },
    { label: "Yellow", value: "#FEF08A" },
    { label: "Green", value: "#BBF7D0" },
    { label: "Blue", value: "#BFDBFE" },
    { label: "Pink", value: "#FBCFE8" },
    { label: "Orange", value: "#FED7AA" },
  ];

  useEffect(() => {
    if (!editor) return;

    const updateToolbar = () => {
      const { from, to, empty } = editor.state.selection;
      
      // Only show if there's actual text selected (not just cursor position)
      if (empty || from === to) {
        setShow(false);
        setShowColorPicker(false);
        setShowHighlightPicker(false);
        setShowFontMenu(false);
        return;
      }

      // Use requestAnimationFrame for smooth updates
      requestAnimationFrame(() => {
        const { view } = editor;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);
        
        // Calculate center position between start and end of selection
        const centerX = (start.left + end.left) / 2;
        
        // Position toolbar above the selection
        // Use viewport coordinates (start.top already accounts for scroll)
        const toolbarHeight = 50;
        const padding = 10;
        const topPosition = start.top - toolbarHeight - padding;
        
        // Ensure toolbar doesn't go off-screen at the top
        const finalTop = Math.max(60, topPosition); // 60 to stay below navbar
        
        setPosition({ 
          top: finalTop,
          left: centerX 
        });
        setShow(true);
      });
    };

    // Update on selection changes
    editor.on("selectionUpdate", updateToolbar);
    editor.on("update", updateToolbar);
    
    // Update on scroll and resize
    const handleScrollOrResize = () => {
      if (show) {
        updateToolbar();
      }
    };
    
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    document.addEventListener("scroll", handleScrollOrResize, true);

    return () => {
      editor.off("selectionUpdate", updateToolbar);
      editor.off("update", updateToolbar);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      document.removeEventListener("scroll", handleScrollOrResize, true);
    };
  }, [editor, show]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(event.target as Node)
      ) {
        // Don't close if clicking in the editor
        const editorElement = document.querySelector('.ProseMirror');
        if (editorElement && editorElement.contains(event.target as Node)) {
          return;
        }
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
      if (
        fontMenuRef.current &&
        !fontMenuRef.current.contains(event.target as Node)
      ) {
        setShowFontMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!editor || !show) {
    return null;
  }

  return (
    <div
      ref={toolbarRef}
      className="fixed z-[100] bg-gray-800 text-white rounded-lg shadow-2xl p-1.5 flex items-center gap-0.5 transition-all duration-100"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
        pointerEvents: 'auto',
        willChange: 'transform, top, left',
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Text Formatting */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-600 transition ${
          editor.isActive("bold") ? "bg-gray-600 text-orange-400" : ""
        }`}
        title="Bold (Ctrl+B)"
      >
        <FiBold size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-600 transition ${
          editor.isActive("italic") ? "bg-gray-600 text-orange-400" : ""
        }`}
        title="Italic (Ctrl+I)"
      >
        <FiItalic size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-2 rounded hover:bg-gray-600 transition ${
          editor.isActive("underline") ? "bg-gray-600 text-orange-400" : ""
        }`}
        title="Underline (Ctrl+U)"
      >
        <FiUnderline size={18} />
      </button>

      <div className="w-px h-5 bg-gray-600 mx-1" />

      {/* Headings */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`px-2.5 py-1.5 rounded hover:bg-gray-600 transition text-sm font-bold ${
          editor.isActive("heading", { level: 1 }) ? "bg-gray-600 text-orange-400" : ""
        }`}
        title="Heading 1"
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2.5 py-1.5 rounded hover:bg-gray-600 transition text-sm font-bold ${
          editor.isActive("heading", { level: 2 }) ? "bg-gray-600 text-orange-400" : ""
        }`}
        title="Heading 2"
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`px-2.5 py-1.5 rounded hover:bg-gray-600 transition text-sm font-bold ${
          editor.isActive("heading", { level: 3 }) ? "bg-gray-600 text-orange-400" : ""
        }`}
        title="Heading 3"
      >
        H3
      </button>

      <div className="w-px h-5 bg-gray-600 mx-1" />

      {/* Font Family */}
      <div className="relative" ref={fontMenuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowFontMenu(!showFontMenu);
            setShowColorPicker(false);
            setShowHighlightPicker(false);
          }}
          className="p-2 rounded hover:bg-gray-600 transition"
          title="Font Family"
        >
          <FiType size={18} />
        </button>
        {showFontMenu && (
          <div 
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white text-gray-900 border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 min-w-[160px]"
            onClick={(e) => e.stopPropagation()}
          >
            {fonts.map((font) => (
              <button
                key={font.value || "default"}
                onClick={(e) => {
                  e.stopPropagation();
                  if (font.value) {
                    editor.chain().focus().setFontFamily(font.value).run();
                  } else {
                    editor.chain().focus().unsetFontFamily().run();
                  }
                  setShowFontMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 transition text-sm"
                style={{ fontFamily: font.value || "inherit" }}
              >
                {font.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-gray-600 mx-1" />

      {/* Text Color */}
      <div className="relative" ref={colorPickerRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowColorPicker(!showColorPicker);
            setShowHighlightPicker(false);
          }}
          className="p-2 rounded hover:bg-gray-600 transition"
          title="Text Color"
        >
          <BsPalette size={18} />
        </button>
        {showColorPicker && (
          <div 
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-xl p-2.5 animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-4 gap-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    editor.chain().focus().setColor(color.value).run();
                    setShowColorPicker(false);
                  }}
                  className="w-8 h-8 rounded-md border-2 border-gray-200 hover:border-gray-400 hover:scale-110 transition-all"
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Highlight */}
      <div className="relative" ref={highlightPickerRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowHighlightPicker(!showHighlightPicker);
            setShowColorPicker(false);
          }}
          className="p-2 rounded hover:bg-gray-600 transition"
          title="Highlight"
        >
          <BsPaintBucket size={18} />
        </button>
        {showHighlightPicker && (
          <div 
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-xl p-2.5 animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-3 gap-2">
              {highlights.map((highlight) => (
                <button
                  key={highlight.value || "none"}
                  onClick={(e) => {
                    e.stopPropagation();
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
                  className="w-8 h-8 rounded-md border-2 border-gray-200 hover:border-gray-400 hover:scale-110 transition-all relative"
                  style={{
                    backgroundColor: highlight.value || "#ffffff",
                  }}
                  title={highlight.label}
                >
                  {!highlight.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-0.5 bg-red-500 rotate-45" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="w-px h-5 bg-gray-600 mx-1" />
      
      {/* Lists */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-600 transition ${
          editor.isActive("bulletList") ? "bg-gray-600 text-orange-400" : ""
        }`}
        title="Bullet List"
      >
        <FiList size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-gray-600 transition ${
          editor.isActive("orderedList") ? "bg-gray-600 text-orange-400" : ""
        }`}
        title="Numbered List"
      >
        <BsListOl size={18} />
      </button>
      
      <div className="w-px h-5 bg-gray-600 mx-1" />
      
      {/* Text Alignment */}
      <button
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={`p-2 rounded hover:bg-gray-600 transition ${
          editor.isActive({ textAlign: "left" }) ? "bg-gray-600 text-orange-400" : ""
        }`}
        title="Align Left"
      >
        <FiAlignLeft size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className={`p-2 rounded hover:bg-gray-600 transition ${
          editor.isActive({ textAlign: "center" }) ? "bg-gray-600 text-orange-400" : ""
        }`}
        title="Align Center"
      >
        <FiAlignCenter size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className={`p-2 rounded hover:bg-gray-600 transition ${
          editor.isActive({ textAlign: "right" }) ? "bg-gray-600 text-orange-400" : ""
        }`}
        title="Align Right"
      >
        <FiAlignRight size={18} />
      </button>
    </div>
  );
}
