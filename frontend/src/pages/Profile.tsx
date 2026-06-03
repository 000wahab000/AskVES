import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import timetableData from "../data/timetable.json";

// ---------------------------------------------------------------------------
// Derive all unique class codes from the timetable JSON
// ---------------------------------------------------------------------------
function getAllClassCodes(): string[] {
  const tt = (timetableData as any).timetable as Record<string, Record<string, Record<string, unknown>>>;
  const codes = new Set<string>();
  for (const day of Object.values(tt)) {
    for (const group of Object.values(day)) {
      for (const code of Object.keys(group)) {
        codes.add(code);
      }
    }
  }
  return [...codes].sort();
}

// ---------------------------------------------------------------------------
// Human-readable labels derived from class-code naming conventions:
//   D1ADA  → Year 1, AIDS-A
//   D1ADB  → Year 1, AIDS-B
//   D1EC   → Year 1, EXTC/EC
//   D2A/B/C→ Year 2, Div A/B/C
//   D3     → Year 3
//   D4A/B  → Year 4, Div A/B
//   D5A/B/C→ Year 5 (SE), Div A/B/C
// ---------------------------------------------------------------------------
function parseMeta(code: string): { department: string; year: string } {
  // Year 1 AIDS divisions
  if (code === "D1ADA") return { department: "AIDS", year: "First Year (FE)" };
  if (code === "D1ADB") return { department: "AIDS", year: "First Year (FE)" };
  // Year 1 EXTC/EC
  if (code === "D1EC")  return { department: "EXTC / EC", year: "First Year (FE)" };

  // Year 2 divisions (CMPN / INFT / EXTC mixed)
  if (code === "D2A")   return { department: "CMPN / INFT", year: "Second Year (SE)" };
  if (code === "D2B")   return { department: "CMPN / INFT", year: "Second Year (SE)" };
  if (code === "D2C")   return { department: "CMPN / INFT", year: "Second Year (SE)" };

  // Year 3
  if (code === "D3")    return { department: "Mechanical / Civil", year: "First Year (FE)" };

  // Year 4 divisions
  if (code === "D4A")   return { department: "EXTC / ECS", year: "First Year (FE)" };
  if (code === "D4B")   return { department: "EXTC / ECS", year: "First Year (FE)" };

  // Year 5 = Second Year SE divisions
  if (code === "D5A")   return { department: "CMPN / INFT", year: "Third Year (TE)" };
  if (code === "D5B")   return { department: "CMPN / INFT", year: "Third Year (TE)" };
  if (code === "D5C")   return { department: "CMPN / INFT", year: "Third Year (TE)" };

  return { department: "Other", year: "Unknown" };
}

// ---------------------------------------------------------------------------
// Build structured options for dropdowns
// ---------------------------------------------------------------------------
function buildOptions() {
  const codes = getAllClassCodes();

  const deptMap: Record<string, Record<string, string[]>> = {};
  for (const code of codes) {
    const { department, year } = parseMeta(code);
    if (!deptMap[department]) deptMap[department] = {};
    if (!deptMap[department][year]) deptMap[department][year] = [];
    deptMap[department][year].push(code);
  }
  return deptMap;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid rgba(100,160,220,0.20)",
  background: "#0b1730",
  color: "#dce8f5",
  fontSize: "0.95rem",
  fontFamily: "DM Sans, sans-serif",
  outline: "none",
  boxSizing: "border-box",
};

const SELECT_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
};

const LABEL_STYLE: React.CSSProperties = {
  color: "#3d5a7a",
  fontSize: "0.78rem",
  fontFamily: "DM Sans, sans-serif",
  fontWeight: 600,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  marginBottom: "6px",
  display: "block",
};

const FIELD_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function Profile() {
  const navigate = useNavigate();
  const saved = JSON.parse(localStorage.getItem("askves_user") ?? "{}");

  const deptOptions = useMemo(() => buildOptions(), []);
  const departments = Object.keys(deptOptions).sort();

  const [form, setForm] = useState({
    name:       saved.name       ?? "",
    department: saved.department ?? "",
    year:       saved.year       ?? "",
    classCode:  saved.classCode  ?? "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // Derived cascading options
  const yearOptions   = form.department ? Object.keys(deptOptions[form.department] ?? {}).sort() : [];
  const codeOptions   = (form.department && form.year)
    ? (deptOptions[form.department]?.[form.year] ?? []).sort()
    : [];

  function handleDeptChange(dept: string) {
    setForm({ ...form, department: dept, year: "", classCode: "" });
  }
  function handleYearChange(year: string) {
    setForm({ ...form, year, classCode: "" });
  }

  function handleSave() {
    localStorage.setItem("askves_user", JSON.stringify(form));
    setIsEditing(false);
  }
  function handleLogout() {
    localStorage.removeItem("askves_user");
    navigate("/login");
  }
  function handleCancel() {
    setForm({
      name:       saved.name       ?? "",
      department: saved.department ?? "",
      year:       saved.year       ?? "",
      classCode:  saved.classCode  ?? "",
    });
    setIsEditing(false);
  }

  const initials = form.name
    ? form.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg, #070f1d)",
      color: "var(--t1, #dce8f5)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "48px 20px 80px",
      fontFamily: "DM Sans, sans-serif",
    }}>

      {/* Avatar */}
      <div style={{
        width: "88px", height: "88px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #1a7fa8, #6c63ff)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.8rem", fontWeight: 700,
        fontFamily: "Space Grotesk, sans-serif",
        marginBottom: "16px",
        boxShadow: "0 0 0 4px rgba(26,127,168,0.20)",
      }}>
        {initials}
      </div>

      <h1 style={{ fontSize: "1.6rem", margin: "0 0 4px", fontFamily: "Space Grotesk, sans-serif" }}>
        {form.name || "Your Profile"}
      </h1>
      {form.classCode && (
        <p style={{ color: "#3d5a7a", fontSize: "0.9rem", margin: "0 0 32px" }}>
          {form.classCode} &middot; {form.department} &middot; {form.year}
        </p>
      )}
      {!form.classCode && <div style={{ marginBottom: "32px" }} />}

      {/* Card */}
      <div style={{
        background: "#0b1730",
        border: "1px solid rgba(100,160,220,0.12)",
        borderRadius: "16px",
        padding: "28px",
        width: "100%",
        maxWidth: "440px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}>

        {/* Name */}
        <div style={FIELD_STYLE}>
          <label style={LABEL_STYLE}>Name</label>
          {isEditing ? (
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name"
              style={INPUT_STYLE}
            />
          ) : (
            <p style={{ fontSize: "1rem", margin: 0, color: "#dce8f5" }}>{form.name || "—"}</p>
          )}
        </div>

        {/* Department */}
        <div style={FIELD_STYLE}>
          <label style={LABEL_STYLE}>Department</label>
          {isEditing ? (
            <div style={{ position: "relative" }}>
              <select
                value={form.department}
                onChange={(e) => handleDeptChange(e.target.value)}
                style={SELECT_STYLE}
              >
                <option value="">— Select department —</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#3d5a7a" }}>▾</span>
            </div>
          ) : (
            <p style={{ fontSize: "1rem", margin: 0, color: "#dce8f5" }}>{form.department || "—"}</p>
          )}
        </div>

        {/* Year */}
        <div style={FIELD_STYLE}>
          <label style={LABEL_STYLE}>Year</label>
          {isEditing ? (
            <div style={{ position: "relative" }}>
              <select
                value={form.year}
                onChange={(e) => handleYearChange(e.target.value)}
                disabled={!form.department}
                style={{ ...SELECT_STYLE, opacity: form.department ? 1 : 0.4 }}
              >
                <option value="">— Select year —</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#3d5a7a" }}>▾</span>
            </div>
          ) : (
            <p style={{ fontSize: "1rem", margin: 0, color: "#dce8f5" }}>{form.year || "—"}</p>
          )}
        </div>

        {/* Class Code */}
        <div style={FIELD_STYLE}>
          <label style={LABEL_STYLE}>Class / Division</label>
          {isEditing ? (
            <div style={{ position: "relative" }}>
              <select
                value={form.classCode}
                onChange={(e) => setForm({ ...form, classCode: e.target.value })}
                disabled={!form.year}
                style={{ ...SELECT_STYLE, opacity: form.year ? 1 : 0.4 }}
              >
                <option value="">— Select class —</option>
                {codeOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#3d5a7a" }}>▾</span>
            </div>
          ) : (
            <p style={{ fontSize: "1rem", margin: 0, color: "#dce8f5", fontFamily: "Space Grotesk, sans-serif", fontWeight: 600 }}>
              {form.classCode || "—"}
            </p>
          )}
        </div>

        {/* Helper note while editing */}
        {isEditing && (
          <p style={{ color: "#3d5a7a", fontSize: "0.78rem", margin: "-8px 0 0" }}>
            Class codes are pulled from the live timetable. Select a department first to narrow down the options.
          </p>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                style={{
                  flex: 1, padding: "11px",
                  background: "linear-gradient(135deg, #1a7fa8, #6c63ff)",
                  color: "white", border: "none", borderRadius: "8px",
                  cursor: "pointer", fontFamily: "DM Sans, sans-serif",
                  fontSize: "0.95rem", fontWeight: 600,
                }}
              >
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                style={{
                  flex: 1, padding: "11px",
                  background: "transparent", color: "#7a9bbf",
                  border: "1px solid rgba(100,160,220,0.20)",
                  borderRadius: "8px", cursor: "pointer",
                  fontFamily: "DM Sans, sans-serif", fontSize: "0.95rem",
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                flex: 1, padding: "11px",
                background: "rgba(26,127,168,0.12)",
                color: "#1a7fa8",
                border: "1px solid rgba(26,127,168,0.30)",
                borderRadius: "8px", cursor: "pointer",
                fontFamily: "DM Sans, sans-serif",
                fontSize: "0.95rem", fontWeight: 600,
              }}
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* Logout */}
        {!isEditing && (
          <button
            onClick={handleLogout}
            style={{
              padding: "11px",
              background: "transparent", color: "#f87171",
              border: "1px solid rgba(248,113,113,0.30)",
              borderRadius: "8px", cursor: "pointer",
              fontFamily: "DM Sans, sans-serif", fontSize: "0.95rem",
            }}
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
}