import { useRef } from "react";

export function TabIndexHandler({ children }) {
  const containerRef = useRef(null);

  const handleKeyDown = (e) => {
    const target = e.target;

    // 🔥 ENTER KEY HANDLING
    if (e.key === "Enter") {
      const tag = target.tagName.toLowerCase();
      const type = target.type;

      // ✅ Toggle checkbox on Enter
      if (type === "checkbox") {
        e.preventDefault();
        target.checked = !target.checked;
        target.dispatchEvent(new Event("change", { bubbles: true }));
        return;
      }

      // ❌ Skip textarea (allow new line)
      if (tag === "textarea") return;

      // 👉 Move to next field
      e.preventDefault();

      const focusable = Array.from(
        containerRef.current.querySelectorAll(
          "input, select, textarea, button, [tabindex]"
        )
      ).filter((el) => !el.disabled);

      const index = focusable.indexOf(target);

      if (index > -1 && index < focusable.length - 1) {
        focusable[index + 1].focus();
      }
    }
  };

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown}>
      {children}
    </div>
  );
}