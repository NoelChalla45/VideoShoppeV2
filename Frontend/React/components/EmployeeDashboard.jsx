// Employee dashboard with shift tracking and staff shortcuts.
import { useEffect, useState } from "react";
import "../styles/employee.css";
import { getStoredUser } from "../utils/auth";

export default function EmployeeDashboard() {
  const user = getStoredUser();
  const clockStorageKey = `videoShoppeEmployeeClock_${user?.id || "unknown"}`;
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [shiftStart, setShiftStart] = useState(null);
  const [timeLogs, setTimeLogs] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(clockStorageKey) || "null");
      if (saved) {
        setIsClockedIn(Boolean(saved.isClockedIn));
        setShiftStart(saved.shiftStart || null);
        setTimeLogs(Array.isArray(saved.timeLogs) ? saved.timeLogs : []);
      }
    } catch {
      // no-op
    }
  }, []);

  const persistClockState = (nextState) => {
    localStorage.setItem(clockStorageKey, JSON.stringify(nextState));
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) return "N/A";
    return new Date(dateValue).toLocaleString();
  };

  const handleClockIn = () => {
    if (isClockedIn) return;
    const now = new Date().toISOString();
    const nextState = {
      isClockedIn: true,
      shiftStart: now,
      timeLogs,
    };
    setIsClockedIn(true);
    setShiftStart(now);
    persistClockState(nextState);
  };

  const handleClockOut = () => {
    if (!isClockedIn || !shiftStart) return;

    const now = new Date();
    const start = new Date(shiftStart);
    const workedHours = ((now - start) / (1000 * 60 * 60)).toFixed(2);
    const nextLogs = [
      {
        id: now.toISOString(),
        clockInAt: shiftStart,
        clockOutAt: now.toISOString(),
        workedHours,
      },
      ...timeLogs,
    ];

    const nextState = {
      isClockedIn: false,
      shiftStart: null,
      timeLogs: nextLogs,
    };
    setTimeLogs(nextLogs);
    setIsClockedIn(false);
    setShiftStart(null);
    persistClockState(nextState);
  };

  return (
    <div className="employee-page">
      <div className="employee-inner">
        <header className="employee-head">
          <div>
            <p className="employee-eyebrow">Employee Operations</p>
            <h1>Employee Account</h1>
          </div>
        </header>

        <section className="employee-panel">
          <h2>Account Details</h2>
          <div className="employee-account-details">
            <article>
              <span>Email</span>
              <strong>{user?.email || "N/A"}</strong>
            </article>
            <article>
              <span>Account Type</span>
              <strong>{user?.role || "EMPLOYEE"}</strong>
            </article>
          </div>
        </section>

        <section className="employee-panel">
          <h2>Employee Time Clock</h2>
          <div className="employee-clock-head">
            <span className={`employee-shift-badge ${isClockedIn ? "live" : ""}`}>
              {isClockedIn ? "Clocked In" : "Clocked Out"}
            </span>
            <p>Shift start: {isClockedIn ? formatDateTime(shiftStart) : "No active shift"}</p>
          </div>
          <div className="employee-clock-actions">
            <button className="employee-clock-btn" onClick={handleClockIn} disabled={isClockedIn}>
              Clock In
            </button>
            <button className="employee-clock-btn alt" onClick={handleClockOut} disabled={!isClockedIn}>
              Clock Out
            </button>
          </div>
          {timeLogs.length === 0 ? (
            <p className="employee-empty">No logged shifts yet.</p>
          ) : (
            <div className="employee-time-logs">
              {timeLogs.slice(0, 6).map((entry) => (
                <article className="employee-time-row" key={entry.id}>
                  <span>In: {formatDateTime(entry.clockInAt)}</span>
                  <span>Out: {formatDateTime(entry.clockOutAt)}</span>
                  <strong>{entry.workedHours} hrs</strong>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
